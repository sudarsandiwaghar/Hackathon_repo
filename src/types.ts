export interface User {
  _id: string;
  email: string;
  role: 'admin' | 'employee';
  employeeId: string;
  emailVerified: boolean;
}

export interface Employee {
  _id: string;
  employeeCode: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address?: string;
  department: 'Engineering' | 'Human Resources' | 'Marketing' | 'Finance' | 'Product' | 'Operations';
  designation: string;
  joiningDate: string;
  photo?: string;
  userId?: string;
  salary?: {
    basic: number;
    hra: number;
    specialAllowance: number;
    pfDeduction: number;
    taxDeduction: number;
  };
  leaveBalance?: {
    paid: number;
    sick: number;
    unpaid: number;
  };
  status: 'Active' | 'On Leave' | 'Inactive';
}

export interface AttendanceRecord {
  _id: string;
  employeeId: string;
  date: string;
  checkIn?: string;
  checkOut?: string;
  totalHours?: number;
  status: 'Present' | 'Absent' | 'Half-day' | 'Leave';
  source: 'manual' | 'system' | 'leave-sync';
  notes?: string;
  employee?: {
    _id: string;
    employeeCode: string;
    name: string;
    department: string;
    designation: string;
    photo?: string;
  };
}

export interface LeaveRequest {
  _id: string;
  employeeId: string;
  leaveType: 'Paid' | 'Sick' | 'Unpaid';
  startDate: string;
  endDate: string;
  days: number;
  reason: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  reviewedBy?: string;
  reviewComment?: string;
  createdAt: string;
  updatedAt: string;
  employee?: {
    _id: string;
    employeeCode: string;
    name: string;
    email: string;
    department: string;
    designation: string;
    photo?: string;
    leaveBalance?: {
      paid: number;
      sick: number;
      unpaid: number;
    };
  };
}

export interface PayrollRecord {
  _id: string;
  employeeId: string;
  month: number;
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
  employee?: {
    _id: string;
    employeeCode: string;
    name: string;
    email: string;
    department: string;
    designation: string;
    photo?: string;
  };
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
