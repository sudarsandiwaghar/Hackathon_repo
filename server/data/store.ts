import crypto from 'crypto';

export interface User {
  _id: string;
  email: string;
  passwordHash: string;
  role: 'admin' | 'employee';
  employeeId: string;
  emailVerified: boolean;
  verificationToken?: string;
  verificationTokenExpires?: string;
  createdAt: string;
}

export interface Employee {
  _id: string;
  employeeCode: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  department: 'Engineering' | 'Human Resources' | 'Marketing' | 'Finance' | 'Product' | 'Operations';
  designation: string;
  joiningDate: string;
  photo?: string;
  userId: string;
  salary: {
    basic: number;
    hra: number;
    specialAllowance: number;
    pfDeduction: number;
    taxDeduction: number;
  };
  leaveBalance: {
    paid: number;
    sick: number;
    unpaid: number;
  };
  status: 'Active' | 'On Leave' | 'Inactive';
}

export interface AttendanceRecord {
  _id: string;
  employeeId: string;
  date: string; // YYYY-MM-DD
  checkIn?: string; // ISO datetime
  checkOut?: string; // ISO datetime
  totalHours?: number;
  status: 'Present' | 'Absent' | 'Half-day' | 'Leave';
  source: 'manual' | 'system' | 'leave-sync';
  notes?: string;
}

export interface LeaveRequest {
  _id: string;
  employeeId: string;
  leaveType: 'Paid' | 'Sick' | 'Unpaid';
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  days: number;
  reason: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  reviewedBy?: string; // Admin userId or employeeId
  reviewComment?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PayrollRecord {
  _id: string;
  employeeId: string;
  month: number; // 1-12
  year: number;
  basicSalary: number;
  allowances: {
    hra: number;
    special: number;
    bonus?: number;
  };
  deductions: {
    pf: number;
    tax: number;
    unpaidLeaveDeduction?: number;
  };
  netSalary: number;
  status: 'Pending' | 'Processed' | 'Paid';
  processedAt?: string;
  paymentDate?: string;
}

export interface NotificationItem {
  _id: string;
  userId: string;
  type: 'leave_approved' | 'leave_rejected' | 'attendance_anomaly' | 'payroll_processed' | 'system';
  title: string;
  message: string;
  read: boolean;
  icon?: string;
  createdAt: string;
}

// In-Memory Database Store with initial seed
class MemoryDB {
  users: User[] = [];
  employees: Employee[] = [];
  attendance: AttendanceRecord[] = [];
  leaves: LeaveRequest[] = [];
  payrolls: PayrollRecord[] = [];
  notifications: NotificationItem[] = [];

  constructor() {
    this.seedInitialData();
  }

  generateId(): string {
    return 'id_' + Math.random().toString(36).substring(2, 11) + '_' + Date.now().toString(36);
  }

  seedInitialData() {
    this.users = [];
    this.employees = [];
    this.attendance = [];
    this.leaves = [];
    this.payrolls = [];
    this.notifications = [];

    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    // Seed Admin
    const adminUserId = 'user_admin_001';
    const adminEmpId = 'emp_admin_001';
    
    this.users.push({
      _id: adminUserId,
      email: 'hr@dayflow.com',
      passwordHash: 'Admin@123', // In demo/plain-check or bcrypt
      role: 'admin',
      employeeId: adminEmpId,
      emailVerified: true,
      createdAt: new Date(Date.now() - 90 * 86400000).toISOString(),
    });

    this.employees.push({
      _id: adminEmpId,
      employeeCode: 'DF-001',
      firstName: 'Divya',
      lastName: 'Dharshini',
      email: 'hr@dayflow.com',
      phone: '+91 98765 43210',
      address: '14th Main Road, Indiranagar, Bangalore, Karnataka 560038',
      department: 'Human Resources',
      designation: 'Head of People & HR Operations',
      joiningDate: '2023-01-15',
      photo: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=256',
      userId: adminUserId,
      salary: {
        basic: 85000,
        hra: 34000,
        specialAllowance: 21000,
        pfDeduction: 10200,
        taxDeduction: 14800,
      },
      leaveBalance: { paid: 18, sick: 10, unpaid: 0 },
      status: 'Active',
    });

    // Seed 7 representative Employees across departments
    const employeeData = [
      {
        id: 'emp_002',
        userId: 'user_002',
        code: 'DF-002',
        first: 'Alex',
        last: 'Chen',
        email: 'alex.chen@dayflow.com',
        phone: '+91 98111 22334',
        address: '42, Prestige Green Woods, Koramangala 4th Block, Bangalore',
        dept: 'Engineering' as const,
        desig: 'Senior Full Stack Engineer',
        joining: '2023-03-01',
        photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=256',
        basic: 95000,
        hra: 38000,
        special: 27000,
        pf: 11400,
        tax: 18600,
        paidLeave: 14,
        sickLeave: 8,
      },
      {
        id: 'emp_003',
        userId: 'user_003',
        code: 'DF-003',
        first: 'Sarah',
        last: 'Jenkins',
        email: 'sarah.jenkins@dayflow.com',
        phone: '+91 98222 33445',
        address: '77, Palm Meadows, Whitefield, Bangalore',
        dept: 'Engineering' as const,
        desig: 'Lead Cloud Architect',
        joining: '2023-05-10',
        photo: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=256',
        basic: 110000,
        hra: 44000,
        special: 36000,
        pf: 13200,
        tax: 23800,
        paidLeave: 16,
        sickLeave: 10,
      },
      {
        id: 'emp_004',
        userId: 'user_004',
        code: 'DF-004',
        first: 'Rohan',
        last: 'Mehta',
        email: 'rohan.mehta@dayflow.com',
        phone: '+91 98333 44556',
        address: '102, Shobha Iris, Marathahalli, Bangalore',
        dept: 'Product' as const,
        desig: 'Product Designer (UI/UX)',
        joining: '2023-08-20',
        photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=256',
        basic: 70000,
        hra: 28000,
        special: 17000,
        pf: 8400,
        tax: 10600,
        paidLeave: 12,
        sickLeave: 9,
      },
      {
        id: 'emp_005',
        userId: 'user_005',
        code: 'DF-005',
        first: 'Priya',
        last: 'Sharma',
        email: 'priya.sharma@dayflow.com',
        phone: '+91 98444 55667',
        address: '5, Ferns Residency, HSR Layout Sector 2, Bangalore',
        dept: 'Marketing' as const,
        desig: 'Growth & Brand Marketing Lead',
        joining: '2023-11-01',
        photo: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=256',
        basic: 75000,
        hra: 30000,
        special: 19000,
        pf: 9000,
        tax: 12000,
        paidLeave: 15,
        sickLeave: 7,
      },
      {
        id: 'emp_006',
        userId: 'user_006',
        code: 'DF-006',
        first: 'Vikram',
        last: 'Aditya',
        email: 'vikram.aditya@dayflow.com',
        phone: '+91 98555 66778',
        address: '88, Brigade Gateway, Malleshwaram, Bangalore',
        dept: 'Finance' as const,
        desig: 'Senior Financial Analyst',
        joining: '2024-01-15',
        photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=256',
        basic: 80000,
        hra: 32000,
        special: 20000,
        pf: 9600,
        tax: 13400,
        paidLeave: 11,
        sickLeave: 10,
      },
      {
        id: 'emp_007',
        userId: 'user_007',
        code: 'DF-007',
        first: 'Ananya',
        last: 'Deshmukh',
        email: 'ananya.deshmukh@dayflow.com',
        phone: '+91 98666 77889',
        address: '19, Embassy GolfLinks, Domlur, Bangalore',
        dept: 'Operations' as const,
        desig: 'Operations & Facilities Manager',
        joining: '2024-02-01',
        photo: 'https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?auto=format&fit=crop&q=80&w=256',
        basic: 65000,
        hra: 26000,
        special: 15000,
        pf: 7800,
        tax: 9200,
        paidLeave: 14,
        sickLeave: 6,
      },
      {
        id: 'emp_008',
        userId: 'user_008',
        code: 'DF-008',
        first: 'Kavya',
        last: 'Nair',
        email: 'kavya.nair@dayflow.com',
        phone: '+91 98777 88990',
        address: '34, Sobha Lakeview, Bellandur, Bangalore',
        dept: 'Engineering' as const,
        desig: 'QA Automation Engineer',
        joining: '2024-03-10',
        photo: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=256',
        basic: 60000,
        hra: 24000,
        special: 14000,
        pf: 7200,
        tax: 7800,
        paidLeave: 13,
        sickLeave: 8,
      }
    ];

    employeeData.forEach((ed) => {
      this.users.push({
        _id: ed.userId,
        email: ed.email,
        passwordHash: 'Employee@123',
        role: 'employee',
        employeeId: ed.id,
        emailVerified: true,
        createdAt: new Date(Date.now() - 60 * 86400000).toISOString(),
      });

      this.employees.push({
        _id: ed.id,
        employeeCode: ed.code,
        firstName: ed.first,
        lastName: ed.last,
        email: ed.email,
        phone: ed.phone,
        address: ed.address,
        department: ed.dept,
        designation: ed.desig,
        joiningDate: ed.joining,
        photo: ed.photo,
        userId: ed.userId,
        salary: {
          basic: ed.basic,
          hra: ed.hra,
          specialAllowance: ed.special,
          pfDeduction: ed.pf,
          taxDeduction: ed.tax,
        },
        leaveBalance: { paid: ed.paidLeave, sick: ed.sickLeave, unpaid: 0 },
        status: 'Active',
      });
    });

    // Seed Leaves
    const leave1: LeaveRequest = {
      _id: 'leave_001',
      employeeId: 'emp_002', // Alex Chen
      leaveType: 'Paid',
      startDate: new Date(Date.now() - 4 * 86400000).toISOString().split('T')[0],
      endDate: new Date(Date.now() - 3 * 86400000).toISOString().split('T')[0],
      days: 2,
      reason: 'Attending Odoo × NMIT Hackathon 2026 conference & technical keynote presentation.',
      status: 'Approved',
      reviewedBy: adminUserId,
      reviewComment: 'Approved. Great initiative representing Dayflow!',
      createdAt: new Date(Date.now() - 7 * 86400000).toISOString(),
      updatedAt: new Date(Date.now() - 6 * 86400000).toISOString(),
    };

    const leave2: LeaveRequest = {
      _id: 'leave_002',
      employeeId: 'emp_004', // Rohan Mehta
      leaveType: 'Sick',
      startDate: new Date(Date.now() + 2 * 86400000).toISOString().split('T')[0],
      endDate: new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0],
      days: 2,
      reason: 'Scheduled dental procedure and recovery period.',
      status: 'Pending',
      createdAt: new Date(Date.now() - 1 * 86400000).toISOString(),
      updatedAt: new Date(Date.now() - 1 * 86400000).toISOString(),
    };

    const leave3: LeaveRequest = {
      _id: 'leave_003',
      employeeId: 'emp_005', // Priya Sharma
      leaveType: 'Paid',
      startDate: new Date(Date.now() + 5 * 86400000).toISOString().split('T')[0],
      endDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
      days: 3,
      reason: 'Family wedding anniversary vacation in Goa.',
      status: 'Pending',
      createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
      updatedAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    };

    const leave4: LeaveRequest = {
      _id: 'leave_004',
      employeeId: 'emp_006', // Vikram Aditya
      leaveType: 'Unpaid',
      startDate: new Date(Date.now() - 15 * 86400000).toISOString().split('T')[0],
      endDate: new Date(Date.now() - 14 * 86400000).toISOString().split('T')[0],
      days: 2,
      reason: 'Personal urgent real estate paperwork.',
      status: 'Rejected',
      reviewedBy: adminUserId,
      reviewComment: 'Insufficient notice period for critical quarterly audit week. Please reschedule.',
      createdAt: new Date(Date.now() - 18 * 86400000).toISOString(),
      updatedAt: new Date(Date.now() - 17 * 86400000).toISOString(),
    };

    this.leaves.push(leave1, leave2, leave3, leave4);

    // Seed Attendance for the past 14 days for all employees
    const allEmps = this.employees;
    const pastDays = 14;

    for (let d = pastDays; d >= 0; d--) {
      const targetDate = new Date(Date.now() - d * 86400000);
      const isWeekend = targetDate.getDay() === 0 || targetDate.getDay() === 6;
      if (isWeekend) continue; // Skip weekends

      const dateStr = targetDate.toISOString().split('T')[0];
      const isToday = d === 0;

      allEmps.forEach((emp, index) => {
        // Check if employee has approved leave for dateStr
        const approvedLeave = this.leaves.find(
          (l) => l.employeeId === emp._id && l.status === 'Approved' && dateStr >= l.startDate && dateStr <= l.endDate
        );

        if (approvedLeave) {
          this.attendance.push({
            _id: this.generateId(),
            employeeId: emp._id,
            date: dateStr,
            status: 'Leave',
            source: 'leave-sync',
            notes: `Approved ${approvedLeave.leaveType} Leave`,
          });
          return;
        }

        if (isToday) {
          // Present today for some employees (including Alex Chen and Admin)
          if (index % 3 !== 2) {
            const checkInTime = new Date(targetDate);
            checkInTime.setHours(9, 15 + index * 5, 0);
            this.attendance.push({
              _id: this.generateId(),
              employeeId: emp._id,
              date: dateStr,
              checkIn: checkInTime.toISOString(),
              status: 'Present',
              source: 'manual',
            });
          }
        } else {
          // Historical days
          if ((index + d) % 11 === 0) {
            // Absent
            this.attendance.push({
              _id: this.generateId(),
              employeeId: emp._id,
              date: dateStr,
              status: 'Absent',
              source: 'system',
              notes: 'Unexcused Absence',
            });
          } else if ((index + d) % 13 === 0) {
            // Half-day
            const inTime = new Date(targetDate);
            inTime.setHours(9, 30, 0);
            const outTime = new Date(targetDate);
            outTime.setHours(13, 30, 0);
            this.attendance.push({
              _id: this.generateId(),
              employeeId: emp._id,
              date: dateStr,
              checkIn: inTime.toISOString(),
              checkOut: outTime.toISOString(),
              totalHours: 4.0,
              status: 'Half-day',
              source: 'manual',
              notes: 'Half day afternoon leave',
            });
          } else {
            // Full Present
            const inTime = new Date(targetDate);
            inTime.setHours(9, 10 + (index % 20), 0);
            const outTime = new Date(targetDate);
            outTime.setHours(18, 15 + (index % 30), 0);
            const totalHours = Number(((outTime.getTime() - inTime.getTime()) / 3600000).toFixed(1));

            this.attendance.push({
              _id: this.generateId(),
              employeeId: emp._id,
              date: dateStr,
              checkIn: inTime.toISOString(),
              checkOut: outTime.toISOString(),
              totalHours,
              status: 'Present',
              source: 'manual',
            });
          }
        }
      });
    }

    // Seed Payroll for past 2 months
    const curMonth = now.getMonth() + 1;
    const curYear = now.getFullYear();

    allEmps.forEach((emp) => {
      const net = emp.salary.basic + emp.salary.hra + emp.salary.specialAllowance - emp.salary.pfDeduction - emp.salary.taxDeduction;

      // Last month (Paid)
      const prevMonth = curMonth === 1 ? 12 : curMonth - 1;
      const prevYear = curMonth === 1 ? curYear - 1 : curYear;
      this.payrolls.push({
        _id: this.generateId(),
        employeeId: emp._id,
        month: prevMonth,
        year: prevYear,
        basicSalary: emp.salary.basic,
        allowances: {
          hra: emp.salary.hra,
          special: emp.salary.specialAllowance,
        },
        deductions: {
          pf: emp.salary.pfDeduction,
          tax: emp.salary.taxDeduction,
        },
        netSalary: net,
        status: 'Paid',
        processedAt: new Date(prevYear, prevMonth - 1, 28).toISOString(),
        paymentDate: new Date(prevYear, prevMonth - 1, 30).toISOString(),
      });

      // Current month (Processed / Ready)
      this.payrolls.push({
        _id: this.generateId(),
        employeeId: emp._id,
        month: curMonth,
        year: curYear,
        basicSalary: emp.salary.basic,
        allowances: {
          hra: emp.salary.hra,
          special: emp.salary.specialAllowance,
        },
        deductions: {
          pf: emp.salary.pfDeduction,
          tax: emp.salary.taxDeduction,
        },
        netSalary: net,
        status: 'Processed',
        processedAt: new Date(curYear, curMonth - 1, 25).toISOString(),
      });
    });

    // Seed Notifications
    this.notifications.push(
      {
        _id: this.generateId(),
        userId: 'user_002', // Alex Chen
        type: 'leave_approved',
        title: 'Leave Approved',
        message: 'Your Paid leave request for 2 days has been approved by HR.',
        read: false,
        icon: 'check-circle',
        createdAt: new Date(Date.now() - 6 * 86400000).toISOString(),
      },
      {
        _id: this.generateId(),
        userId: 'user_002',
        type: 'payroll_processed',
        title: 'Salary Slip Generated',
        message: `Your payroll for ${curMonth}/${curYear} has been computed and processed.`,
        read: true,
        icon: 'credit-card',
        createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
      },
      {
        _id: this.generateId(),
        userId: adminUserId,
        type: 'system',
        title: 'Pending Leave Approvals',
        message: '2 leave applications are awaiting your administrative review.',
        read: false,
        icon: 'calendar',
        createdAt: new Date(Date.now() - 1 * 86400000).toISOString(),
      },
      {
        _id: this.generateId(),
        userId: 'user_006',
        type: 'leave_rejected',
        title: 'Leave Application Update',
        message: 'Your leave request was declined due to quarter-end audit schedules.',
        read: false,
        icon: 'alert-triangle',
        createdAt: new Date(Date.now() - 17 * 86400000).toISOString(),
      }
    );
  }
}

export const db = new MemoryDB();
