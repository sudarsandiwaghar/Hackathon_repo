const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema(
  {
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    checkIn: {
      type: Date,
      default: null,
    },
    checkOut: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: ['Present', 'Absent', 'Half-day', 'Leave'],
      default: 'Present',
    },
    source: {
      type: String,
      enum: ['manual', 'system', 'leave-sync'],
      default: 'manual',
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for fast lookups: "attendance for employee X on date Y"
attendanceSchema.index({ employeeId: 1, date: -1 });
// Index for dashboard queries: "all attendance on date Y"
attendanceSchema.index({ date: -1, status: 1 });

const Attendance = mongoose.model('Attendance', attendanceSchema);

module.exports = Attendance;
