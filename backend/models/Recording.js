const mongoose = require('mongoose');

const recordingSchema = new mongoose.Schema(
  {
    guestName: {
      type: String,
      trim: true,
      default: 'Anonymous Guest',
      maxlength: 100,
    },
    eventName: {
      type: String,
      trim: true,
      default: '',
      maxlength: 200,
    },
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      default: null,
      index: true,
    },
    audioUrl: {
      type: String,
      required: true,
    },
    fileName: {
      type: String,
      required: true,
    },
    duration: {
      type: Number,
      default: 0,
      min: 0,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    // Disable the auto-managed timestamps so our custom createdAt is used
    timestamps: false,
    versionKey: false,
  }
);

// Index for fast sorting by newest first
recordingSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Recording', recordingSchema);
