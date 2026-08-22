const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      enum: [
        'leave_approved',
        'leave_rejected',
        'leave_applied',
        'attendance_anomaly',
        'payroll_processed',
        'system',
      ],
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    read: {
      type: Boolean,
      default: false,
    },
    icon: {
      type: String,
      default: 'info',
    },
  },
  {
    timestamps: true,
  }
);

// Index for user's notifications, newest first
notificationSchema.index({ userId: 1, createdAt: -1 });
// Index for unread count
notificationSchema.index({ userId: 1, read: 1 });

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification;
