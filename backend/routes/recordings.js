const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Recording = require('../models/Recording');
const Event = require('../models/Event');

const router = express.Router();

// ─── Multer Storage Configuration ─────────────────────────────────────────────

const UPLOADS_DIR = path.join(__dirname, '..', 'uploads', 'audio');

// Ensure uploads directory exists
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  console.log('📁 Created uploads/audio directory');
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (_req, file, cb) => {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    const ext = path.extname(file.originalname) || '.webm';
    cb(null, `recording-${timestamp}-${random}${ext}`);
  },
});

const fileFilter = (_req, file, cb) => {
  const allowed = ['audio/webm', 'audio/ogg', 'audio/mp4', 'audio/mpeg', 'audio/wav'];
  if (allowed.includes(file.mimetype) || file.mimetype.startsWith('audio/')) {
    cb(null, true);
  } else {
    cb(new Error(`Unsupported file type: ${file.mimetype}`), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB max
  },
});

// ─── POST /api/recordings/upload ─────────────────────────────────────────────

router.post('/upload', upload.single('audio'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No audio file provided. Expected field name: "audio"',
      });
    }

    const { guestName, eventName, duration, eventId } = req.body;
    let selectedEvent = null;

    if (eventId) {
      selectedEvent = await Event.findById(eventId);
      if (!selectedEvent) {
        const filePath = path.join(UPLOADS_DIR, req.file.filename);
        fs.unlink(filePath, () => {});
        return res.status(400).json({
          success: false,
          message: 'Selected event was not found',
        });
      }
    }

    // Build the public URL for the file
    const audioUrl = `/uploads/audio/${req.file.filename}`;

    const recording = await Recording.create({
      guestName: guestName?.trim() || 'Anonymous Guest',
      eventName: selectedEvent?.name || eventName?.trim() || '',
      eventId: selectedEvent?._id || null,
      audioUrl,
      fileName: req.file.filename,
      duration: parseFloat(duration) || 0,
      createdAt: new Date(),
    });

    console.log(`✅ New recording saved: ${recording.fileName} (${recording.guestName})`);

    return res.status(201).json({
      success: true,
      data: recording,
    });
  } catch (err) {
    // Clean up file if DB save failed
    if (req.file) {
      const filePath = path.join(UPLOADS_DIR, req.file.filename);
      fs.unlink(filePath, () => {});
    }
    console.error('Upload error:', err);
    return res.status(500).json({
      success: false,
      message: err.message || 'Failed to save recording',
    });
  }
});

// ─── GET /api/recordings ─────────────────────────────────────────────────────

router.get('/', async (_req, res) => {
  try {
    const recordings = await Recording.find()
      .sort({ createdAt: -1 })
      .lean();

    return res.json({
      success: true,
      count: recordings.length,
      data: recordings,
    });
  } catch (err) {
    console.error('Fetch recordings error:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch recordings',
    });
  }
});

// ─── DELETE /api/recordings/:id ───────────────────────────────────────────────

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const recording = await Recording.findById(id);
    if (!recording) {
      return res.status(404).json({
        success: false,
        message: 'Recording not found',
      });
    }

    // Delete the audio file from disk
    const filePath = path.join(UPLOADS_DIR, recording.fileName);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`🗑️  Deleted file: ${recording.fileName}`);
    }

    // Remove from database
    await recording.deleteOne();
    console.log(`🗑️  Deleted recording: ${recording._id} (${recording.guestName})`);

    return res.json({
      success: true,
      message: 'Recording deleted successfully',
    });
  } catch (err) {
    console.error('Delete error:', err);
    if (err.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid recording ID',
      });
    }
    return res.status(500).json({
      success: false,
      message: 'Failed to delete recording',
    });
  }
});

module.exports = router;
