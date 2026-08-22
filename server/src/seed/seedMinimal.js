/**
 * Dayflow HRMS — Minimal Seed Script
 *
 * Creates:
 * - 1 admin user (hr@dayflow.com)
 * - 5 employee users with matching Employee profiles
 * - 7 days of attendance records (consistent with leaves)
 * - 3 leave requests (1 approved, 1 pending, 1 rejected)
 * - 1 month of payroll for all employees
 * - Sample notifications
 *
 * All cross-collection references are internally consistent.
 */

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Employee = require('../models/Employee');
const Attendance = require('../models/Attendance');
const Leave = require('../models/Leave');
const Payroll = require('../models/Payroll');
const Notification = require('../models/Notification');

const connectDB = require('../config/db');

// ─── Helper: get date N days ago at midnight ────────────────
const daysAgo = (n) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(0, 0, 0, 0);
  return d;
};

// ─── Helper: random time on a given date ────────────────────
const timeOnDate = (date, hour, minute = 0) => {
  const d = new Date(date);
  d.setHours(hour, minute, 0, 0);
  return d;
};

const seed = async () => {
  try {
    await connectDB();

    // Clear all collections
    console.log('🗑  Clearing existing data...');
    await Promise.all([
      User.deleteMany({}),
      Employee.deleteMany({}),
      Attendance.deleteMany({}),
      Leave.deleteMany({}),
      Payroll.deleteMany({}),
      Notification.deleteMany({}),
    ]);

    // ─── 1. Create Users ──────────────────────────────────────
    console.log('👤 Creating users...');
    const hashedPassword = await bcrypt.hash('Admin@123', 12);
    const empPassword = await bcrypt.hash('Employee@123', 12);

    const adminUser = await User.create({
      email: 'hr@dayflow.com',
      password: hashedPassword,
      role: 'admin',
      emailVerified: true,
    });

    const employeeUsers = await User.create([
      { email: 'john.doe@dayflow.com', password: empPassword, role: 'employee', emailVerified: true },
      { email: 'jane.smith@dayflow.com', password: empPassword, role: 'employee', emailVerified: true },
      { email: 'alice.johnson@dayflow.com', password: empPassword, role: 'employee', emailVerified: true },
      { email: 'bob.williams@dayflow.com', password: empPassword, role: 'employee', emailVerified: true },
      { email: 'carol.davis@dayflow.com', password: empPassword, role: 'employee', emailVerified: true },
    ]);

    // ─── 2. Create Employee Profiles ──────────────────────────
    console.log('🏢 Creating employee profiles...');

    const employeeData = [
      {
        employeeCode: 'EMP001',
        firstName: 'Priya',
        lastName: 'Sharma',
        email: 'hr@dayflow.com',
        phone: '+91 98765 43210',
        address: '42 MG Road, Bangalore 560001',
        department: 'HR',
        designation: 'HR Manager',
        joiningDate: new Date('2024-01-15'),
        userId: adminUser._id,
        salary: { basic: 75000, hra: 15000, transport: 3000, medical: 2000, other: 5000 },
      },
      {
        employeeCode: 'EMP002',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@dayflow.com',
        phone: '+91 98765 43211',
        address: '15 Indiranagar, Bangalore 560038',
        department: 'Engineering',
        designation: 'Senior Developer',
        joiningDate: new Date('2024-03-01'),
        userId: employeeUsers[0]._id,
        salary: { basic: 65000, hra: 13000, transport: 2500, medical: 2000, other: 3000 },
      },
      {
        employeeCode: 'EMP003',
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane.smith@dayflow.com',
        phone: '+91 98765 43212',
        address: '88 Koramangala, Bangalore 560034',
        department: 'Engineering',
        designation: 'Frontend Developer',
        joiningDate: new Date('2024-06-15'),
        userId: employeeUsers[1]._id,
        salary: { basic: 55000, hra: 11000, transport: 2000, medical: 2000, other: 2000 },
      },
      {
        employeeCode: 'EMP004',
        firstName: 'Alice',
        lastName: 'Johnson',
        email: 'alice.johnson@dayflow.com',
        phone: '+91 98765 43213',
        address: '23 Whitefield, Bangalore 560066',
        department: 'Marketing',
        designation: 'Marketing Lead',
        joiningDate: new Date('2024-04-10'),
        userId: employeeUsers[2]._id,
        salary: { basic: 60000, hra: 12000, transport: 2500, medical: 2000, other: 4000 },
      },
      {
        employeeCode: 'EMP005',
        firstName: 'Bob',
        lastName: 'Williams',
        email: 'bob.williams@dayflow.com',
        phone: '+91 98765 43214',
        address: '56 JP Nagar, Bangalore 560078',
        department: 'Finance',
        designation: 'Financial Analyst',
        joiningDate: new Date('2024-08-01'),
        userId: employeeUsers[3]._id,
        salary: { basic: 58000, hra: 11600, transport: 2000, medical: 2000, other: 3000 },
      },
      {
        employeeCode: 'EMP006',
        firstName: 'Carol',
        lastName: 'Davis',
        email: 'carol.davis@dayflow.com',
        phone: '+91 98765 43215',
        address: '7 HSR Layout, Bangalore 560102',
        department: 'Engineering',
        designation: 'Backend Developer',
        joiningDate: new Date('2025-01-10'),
        userId: employeeUsers[4]._id,
        salary: { basic: 52000, hra: 10400, transport: 2000, medical: 2000, other: 2000 },
      },
    ];

    const employees = await Employee.create(employeeData);

    // Link employees back to users
    adminUser.employeeId = employees[0]._id;
    await adminUser.save();
    for (let i = 0; i < employeeUsers.length; i++) {
      employeeUsers[i].employeeId = employees[i + 1]._id;
      await employeeUsers[i].save();
    }

    // ─── 3. Create Leave Requests ─────────────────────────────
    console.log('📋 Creating leave requests...');

    // John has an approved 2-day leave (3-4 days ago)
    const approvedLeave = await Leave.create({
      employeeId: employees[1]._id, // John
      leaveType: 'Paid',
      startDate: daysAgo(4),
      endDate: daysAgo(3),
      reason: 'Family function — sister\'s wedding',
      status: 'Approved',
      reviewedBy: employees[0]._id, // Priya (admin)
      reviewComment: 'Approved. Enjoy the wedding!',
      reviewedAt: daysAgo(5),
    });

    // Jane has a pending sick leave request (tomorrow + day after)
    const pendingLeave = await Leave.create({
      employeeId: employees[2]._id, // Jane
      leaveType: 'Sick',
      startDate: new Date(Date.now() + 86400000), // tomorrow
      endDate: new Date(Date.now() + 2 * 86400000), // day after
      reason: 'Dental surgery scheduled',
      status: 'Pending',
    });

    // Alice had a rejected leave request
    const rejectedLeave = await Leave.create({
      employeeId: employees[3]._id, // Alice
      leaveType: 'Unpaid',
      startDate: daysAgo(2),
      endDate: daysAgo(1),
      reason: 'Personal work',
      status: 'Rejected',
      reviewedBy: employees[0]._id,
      reviewComment: 'Cannot approve during campaign launch week. Please reschedule.',
      reviewedAt: daysAgo(3),
    });

    // ─── 4. Create Attendance Records ─────────────────────────
    console.log('📅 Creating attendance records...');

    const attendanceRecords = [];

    for (let dayOffset = 6; dayOffset >= 0; dayOffset--) {
      const date = daysAgo(dayOffset);
      const dayOfWeek = date.getDay(); // 0=Sun, 6=Sat

      // Skip weekends
      if (dayOfWeek === 0 || dayOfWeek === 6) continue;

      for (const emp of employees) {
        // John (employees[1]) was on leave days 4-3 ago
        if (emp._id.equals(employees[1]._id) && (dayOffset === 4 || dayOffset === 3)) {
          attendanceRecords.push({
            employeeId: emp._id,
            date,
            status: 'Leave',
            source: 'leave-sync',
          });
          continue;
        }

        // Bob (employees[4]) was absent 2 days ago
        if (emp._id.equals(employees[4]._id) && dayOffset === 2) {
          attendanceRecords.push({
            employeeId: emp._id,
            date,
            status: 'Absent',
            source: 'system',
          });
          continue;
        }

        // Carol (employees[5]) had a half-day 1 day ago
        if (emp._id.equals(employees[5]._id) && dayOffset === 1) {
          attendanceRecords.push({
            employeeId: emp._id,
            date,
            checkIn: timeOnDate(date, 9, 30),
            checkOut: timeOnDate(date, 13, 0),
            status: 'Half-day',
            source: 'manual',
          });
          continue;
        }

        // Everyone else: normal present
        attendanceRecords.push({
          employeeId: emp._id,
          date,
          checkIn: timeOnDate(date, 9, 0 + Math.floor(Math.random() * 30)),
          checkOut: timeOnDate(date, 17, 30 + Math.floor(Math.random() * 30)),
          status: 'Present',
          source: 'manual',
        });
      }
    }

    await Attendance.create(attendanceRecords);

    // ─── 5. Create Payroll Records ────────────────────────────
    console.log('💰 Creating payroll records...');

    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();

    const payrollRecords = employees.map((emp) => {
      const totalAllowances =
        (emp.salary.hra || 0) +
        (emp.salary.transport || 0) +
        (emp.salary.medical || 0) +
        (emp.salary.other || 0);
      const tax = Math.round(emp.salary.basic * 0.1);
      const pf = Math.round(emp.salary.basic * 0.12);
      const insurance = 500;
      const totalDeductions = tax + pf + insurance;
      const netSalary = emp.salary.basic + totalAllowances - totalDeductions;

      return {
        employeeId: emp._id,
        month: currentMonth === 1 ? 12 : currentMonth - 1, // Last month
        year: currentMonth === 1 ? currentYear - 1 : currentYear,
        basicSalary: emp.salary.basic,
        allowances: {
          hra: emp.salary.hra,
          transport: emp.salary.transport,
          medical: emp.salary.medical,
          other: emp.salary.other,
        },
        deductions: {
          tax,
          insurance,
          providentFund: pf,
          other: 0,
        },
        netSalary,
        status: 'Paid',
        processedAt: daysAgo(5),
      };
    });

    await Payroll.create(payrollRecords);

    // ─── 6. Create Notifications ──────────────────────────────
    console.log('🔔 Creating notifications...');

    await Notification.create([
      {
        userId: employeeUsers[0]._id, // John
        type: 'leave_approved',
        title: 'Leave Approved',
        message: 'Your paid leave from ' + daysAgo(4).toLocaleDateString() + ' to ' + daysAgo(3).toLocaleDateString() + ' has been approved.',
        read: true,
        icon: 'check-circle',
      },
      {
        userId: employeeUsers[2]._id, // Alice
        type: 'leave_rejected',
        title: 'Leave Rejected',
        message: 'Your unpaid leave request was rejected. Reason: Cannot approve during campaign launch week.',
        read: false,
        icon: 'x-circle',
      },
      {
        userId: adminUser._id,
        type: 'leave_applied',
        title: 'New Leave Request',
        message: 'Jane Smith has requested sick leave for dental surgery.',
        read: false,
        icon: 'calendar',
      },
      {
        userId: adminUser._id,
        type: 'attendance_anomaly',
        title: 'Attendance Anomaly',
        message: 'Bob Williams was marked absent on ' + daysAgo(2).toLocaleDateString() + '.',
        read: false,
        icon: 'alert-triangle',
      },
      ...employeeUsers.map((u) => ({
        userId: u._id,
        type: 'payroll_processed',
        title: 'Salary Processed',
        message: 'Your salary for last month has been processed and credited.',
        read: Math.random() > 0.5,
        icon: 'dollar-sign',
      })),
    ]);

    // ─── Summary ──────────────────────────────────────────────
    console.log('\n✅ Minimal seed completed successfully!\n');
    console.log('╔══════════════════════════════════════════════════════╗');
    console.log('║  Demo Credentials                                   ║');
    console.log('╠══════════════════════════════════════════════════════╣');
    console.log('║  Admin:    hr@dayflow.com       / Admin@123         ║');
    console.log('║  Employee: john.doe@dayflow.com / Employee@123      ║');
    console.log('╠══════════════════════════════════════════════════════╣');
    console.log('║  Created:                                           ║');
    console.log(`║  • ${employees.length} employees across 4 departments             ║`);
    console.log(`║  • ${attendanceRecords.length} attendance records (7 days)              ║`);
    console.log('║  • 3 leave requests (approved/pending/rejected)     ║');
    console.log(`║  • ${payrollRecords.length} payroll records (last month)              ║`);
    console.log('║  • Notifications for all events                     ║');
    console.log('╚══════════════════════════════════════════════════════╝\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  }
};

seed();
