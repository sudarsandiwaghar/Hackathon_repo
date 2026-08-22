const mongoose = require('mongoose');

const payrollSchema = new mongoose.Schema(
  {
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: true,
    },
    month: {
      type: Number,
      required: true,
      min: 1,
      max: 12,
    },
    year: {
      type: Number,
      required: true,
    },
    basicSalary: {
      type: Number,
      required: true,
      min: 0,
    },
    allowances: {
      hra: { type: Number, default: 0 },
      transport: { type: Number, default: 0 },
      medical: { type: Number, default: 0 },
      other: { type: Number, default: 0 },
    },
    deductions: {
      tax: { type: Number, default: 0 },
      insurance: { type: Number, default: 0 },
      providentFund: { type: Number, default: 0 },
      other: { type: Number, default: 0 },
    },
    netSalary: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: ['Pending', 'Processed', 'Paid'],
      default: 'Pending',
    },
    processedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index: one payroll record per employee per month/year
payrollSchema.index({ employeeId: 1, month: 1, year: 1 }, { unique: true });
// Index for admin queries
payrollSchema.index({ status: 1, year: -1, month: -1 });

const Payroll = mongoose.model('Payroll', payrollSchema);

module.exports = Payroll;
