const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Event = require('../models/Event');

const router = express.Router();

const WELCOME_UPLOADS_DIR = path.join(__dirname, '..', 'uploads', 'welcome');

if (!fs.existsSync(WELCOME_UPLOADS_DIR)) {
  fs.mkdirSync(WELCOME_UPLOADS_DIR, { recursive: true });
  console.log('Created uploads/welcome directory');
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, WELCOME_UPLOADS_DIR);
  },
  filename: (_req, file, cb) => {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    const ext = path.extname(file.originalname) || '.webm';
    cb(null, `welcome-${timestamp}-${random}${ext}`);
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
    fileSize: 50 * 1024 * 1024,
  },
});

function removeWelcomeAudioFile(fileName) {
  if (!fileName) return;
  const filePath = path.join(WELCOME_UPLOADS_DIR, fileName);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
}

function normalizeEventInput(body) {
  return {
    name: body.name?.trim(),
    startDate: body.startDate,
    endDate: body.endDate,
    status: body.status === 'inactive' ? 'inactive' : 'active',
    welcomeMessage: body.welcomeMessage?.trim() || '',
  };
}

function sendValidationError(res, err) {
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: Object.values(err.errors).map((e) => e.message).join(', '),
    });
  }

  return res.status(500).json({
    success: false,
    message: err.message || 'Event request failed',
  });
}

// Public list for the guest kiosk. Shows active events that have not ended.
router.get('/active', async (_req, res) => {
  try {
    const now = new Date();
    const events = await Event.find({
      status: 'active',
      endDate: { $gte: now },
    })
      .sort({ startDate: 1, createdAt: -1 })
      .lean();

    return res.json({
      success: true,
      count: events.length,
      data: events,
    });
  } catch (err) {
    console.error('Fetch active events error:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch active events',
    });
  }
});

// Admin list.
router.get('/', async (_req, res) => {
  try {
    const events = await Event.find()
      .sort({ createdAt: -1 })
      .lean();

    return res.json({
      success: true,
      count: events.length,
      data: events,
    });
  } catch (err) {
    console.error('Fetch events error:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch events',
    });
  }
});

router.post('/', async (req, res) => {
  try {
    const event = await Event.create(normalizeEventInput(req.body));
    return res.status(201).json({
      success: true,
      data: event,
    });
  } catch (err) {
    console.error('Create event error:', err);
    return sendValidationError(res, err);
  }
});

router.post('/:id/welcome-audio', upload.single('audio'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No audio file provided. Expected field name: "audio"',
      });
    }

    const event = await Event.findById(req.params.id);
    if (!event) {
      fs.unlink(path.join(WELCOME_UPLOADS_DIR, req.file.filename), () => {});
      return res.status(404).json({
        success: false,
        message: 'Event not found',
      });
    }

    removeWelcomeAudioFile(event.welcomeAudioFileName);

    event.welcomeAudioUrl = `/uploads/welcome/${req.file.filename}`;
    event.welcomeAudioFileName = req.file.filename;
    await event.save();

    return res.json({
      success: true,
      data: event,
    });
  } catch (err) {
    if (req.file) {
      fs.unlink(path.join(WELCOME_UPLOADS_DIR, req.file.filename), () => {});
    }
    console.error('Welcome audio upload error:', err);
    if (err.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid event ID',
      });
    }
    return res.status(500).json({
      success: false,
      message: err.message || 'Failed to upload welcome audio',
    });
  }
});

router.delete('/:id/welcome-audio', async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found',
      });
    }

    removeWelcomeAudioFile(event.welcomeAudioFileName);

    event.welcomeAudioUrl = '';
    event.welcomeAudioFileName = '';
    await event.save();

    return res.json({
      success: true,
      data: event,
    });
  } catch (err) {
    console.error('Welcome audio delete error:', err);
    if (err.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid event ID',
      });
    }
    return res.status(500).json({
      success: false,
      message: 'Failed to delete welcome audio',
    });
  }
});

router.patch('/:id', async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found',
      });
    }

    Object.assign(event, normalizeEventInput({ ...event.toObject(), ...req.body }));
    await event.save();

    return res.json({
      success: true,
      data: event,
    });
  } catch (err) {
    console.error('Update event error:', err);
    if (err.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid event ID',
      });
    }
    return sendValidationError(res, err);
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found',
      });
    }

    removeWelcomeAudioFile(event.welcomeAudioFileName);
    await event.deleteOne();
    return res.json({
      success: true,
      message: 'Event deleted successfully',
    });
  } catch (err) {
    console.error('Delete event error:', err);
    if (err.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid event ID',
      });
    }
    return res.status(500).json({
      success: false,
      message: 'Failed to delete event',
    });
  }
});

module.exports = router;
