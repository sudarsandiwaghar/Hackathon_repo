import express from 'express';
import { db, LeaveRequest, AttendanceRecord } from '../data/store.ts';
import { authMiddleware, roleGuard, AuthRequest } from '../middleware/auth.ts';

const router = express.Router();

// Helper to count calendar days between two dates
function calculateDays(startStr: string, endStr: string): number {
  const start = new Date(startStr);
  const end = new Date(endStr);
  const diffTime = Math.abs(end.getTime() - start.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
}

// POST /api/leave (Employee applies for leave)
router.post('/', authMiddleware, (req: AuthRequest, res) => {
  const user = req.user!;
  const { leaveType, startDate, endDate, reason } = req.body;

  if (!leaveType || !startDate || !endDate || !reason) {
    return res.status(400).json({ error: 'Please provide leave type, start date, end date, and reason.' });
  }

  if (startDate > endDate) {
    return res.status(400).json({ error: 'Start date cannot be after end date.' });
  }

  // Check overlap with existing approved/pending leaves
  const hasOverlap = db.leaves.some((l) => {
    if (l.employeeId !== user.employeeId || l.status === 'Rejected') return false;
    // Overlap condition
    return !(endDate < l.startDate || startDate > l.endDate);
  });

  if (hasOverlap) {
    return res.status(400).json({
      error: 'You already have an existing leave application covering overlapping dates.',
    });
  }

  const days = calculateDays(startDate, endDate);

  // Check balance if Paid or Sick
  const emp = db.employees.find((e) => e._id === user.employeeId);
  if (emp) {
    if (leaveType === 'Paid' && emp.leaveBalance.paid < days) {
      return res.status(400).json({
        error: `Insufficient Paid Leave balance. You have ${emp.leaveBalance.paid} days available, but requested ${days} days.`,
      });
    }
    if (leaveType === 'Sick' && emp.leaveBalance.sick < days) {
      return res.status(400).json({
        error: `Insufficient Sick Leave balance. You have ${emp.leaveBalance.sick} days available, but requested ${days} days.`,
      });
    }
  }

  const nowIso = new Date().toISOString();
  const leaveId = 'leave_' + Date.now().toString(36);

  const newLeave: LeaveRequest = {
    _id: leaveId,
    employeeId: user.employeeId,
    leaveType,
    startDate,
    endDate,
    days,
    reason,
    status: 'Pending',
    createdAt: nowIso,
    updatedAt: nowIso,
  };

  db.leaves.push(newLeave);

  // Notify Admins
  const adminUsers = db.users.filter((u) => u.role === 'admin');
  adminUsers.forEach((admin) => {
    db.notifications.push({
      _id: db.generateId(),
      userId: admin._id,
      type: 'system',
      title: 'New Leave Request',
      message: `${emp?.firstName || 'An employee'} applied for ${days} days of ${leaveType} leave (${startDate} to ${endDate}).`,
      read: false,
      icon: 'calendar',
      createdAt: nowIso,
    });
  });

  res.status(201).json({ message: 'Leave application submitted successfully!', leave: newLeave });
});

// GET /api/leave/me
router.get('/me', authMiddleware, (req: AuthRequest, res) => {
  const user = req.user!;
  const myLeaves = db.leaves
    .filter((l) => l.employeeId === user.employeeId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const emp = db.employees.find((e) => e._id === user.employeeId);

  res.json({
    leaves: myLeaves,
    leaveBalance: emp?.leaveBalance || { paid: 0, sick: 0, unpaid: 0 },
  });
});

// GET /api/leave (Admin only)
router.get('/', authMiddleware, roleGuard(['admin']), (req, res) => {
  const { status, leaveType, department } = req.query;

  let list = db.leaves.map((l) => {
    const emp = db.employees.find((e) => e._id === l.employeeId);
    return {
      ...l,
      employee: emp
        ? {
            _id: emp._id,
            employeeCode: emp.employeeCode,
            name: `${emp.firstName} ${emp.lastName}`,
            email: emp.email,
            department: emp.department,
            designation: emp.designation,
            photo: emp.photo,
            leaveBalance: emp.leaveBalance,
          }
        : null,
    };
  });

  if (status && status !== 'all') {
    list = list.filter((l) => l.status.toLowerCase() === String(status).toLowerCase());
  }

  if (leaveType && leaveType !== 'all') {
    list = list.filter((l) => l.leaveType.toLowerCase() === String(leaveType).toLowerCase());
  }

  if (department && department !== 'all') {
    list = list.filter((l) => l.employee && l.employee.department.toLowerCase() === String(department).toLowerCase());
  }

  // Sort: Pending first, then newest
  list.sort((a, b) => {
    if (a.status === 'Pending' && b.status !== 'Pending') return -1;
    if (a.status !== 'Pending' && b.status === 'Pending') return 1;
    return b.createdAt.localeCompare(a.createdAt);
  });

  res.json(list);
});

// PUT /api/leave/:id/review & /:id/status (Admin reviews and syncs attendance)
const reviewHandler = (req: AuthRequest, res: express.Response) => {
  const { id } = req.params;
  const { status, reviewComment } = req.body;

  if (!['Approved', 'Rejected'].includes(status)) {
    return res.status(400).json({ error: "Status must be either 'Approved' or 'Rejected'." });
  }

  const leave = db.leaves.find((l) => l._id === id);
  if (!leave) {
    return res.status(404).json({ error: 'Leave request not found.' });
  }

  const emp = db.employees.find((e) => e._id === leave.employeeId);
  const user = db.users.find((u) => u.employeeId === leave.employeeId);

  leave.status = status;
  leave.reviewedBy = req.user!._id;
  leave.reviewComment = reviewComment || (status === 'Approved' ? 'Approved by HR Administrator' : 'Declined');
  leave.updatedAt = new Date().toISOString();

  // Write-Through Sync on Approval
  if (status === 'Approved') {
    // 1. Deduct leave balance
    if (emp) {
      if (leave.leaveType === 'Paid') {
        emp.leaveBalance.paid = Math.max(0, emp.leaveBalance.paid - leave.days);
      } else if (leave.leaveType === 'Sick') {
        emp.leaveBalance.sick = Math.max(0, emp.leaveBalance.sick - leave.days);
      }
    }

    // 2. Upsert Attendance records for each date in [startDate, endDate]
    const cur = new Date(leave.startDate);
    const end = new Date(leave.endDate);

    while (cur <= end) {
      const dayOfWeek = cur.getDay();
      // Only sync for working weekdays (Monday-Friday)
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        const dStr = cur.toISOString().split('T')[0];
        let att = db.attendance.find((a) => a.employeeId === leave.employeeId && a.date === dStr);

        if (att) {
          att.status = 'Leave';
          att.source = 'leave-sync';
          att.notes = `Approved ${leave.leaveType} Leave`;
        } else {
          db.attendance.push({
            _id: db.generateId(),
            employeeId: leave.employeeId,
            date: dStr,
            status: 'Leave',
            source: 'leave-sync',
            notes: `Approved ${leave.leaveType} Leave`,
          });
        }
      }
      cur.setDate(cur.getDate() + 1);
    }

    // 3. Create Notification for Employee
    if (user) {
      db.notifications.push({
        _id: db.generateId(),
        userId: user._id,
        type: 'leave_approved',
        title: 'Leave Approved',
        message: `Your ${leave.leaveType} leave request for ${leave.days} day(s) (${leave.startDate} to ${leave.endDate}) has been approved.`,
        read: false,
        icon: 'check-circle',
        createdAt: new Date().toISOString(),
      });
    }
  } else {
    // Rejected Notification
    if (user) {
      db.notifications.push({
        _id: db.generateId(),
        userId: user._id,
        type: 'leave_rejected',
        title: 'Leave Request Declined',
        message: `Your leave request for ${leave.startDate} to ${leave.endDate} was declined: "${leave.reviewComment}"`,
        read: false,
        icon: 'alert-triangle',
        createdAt: new Date().toISOString(),
      });
    }
  }

  res.json({ message: `Leave request has been ${status.toLowerCase()}`, leave });
};

router.put('/:id/review', authMiddleware, roleGuard(['admin']), reviewHandler);
router.put('/:id/status', authMiddleware, roleGuard(['admin']), reviewHandler);

// DELETE /api/leave/:id (Cancel own pending leave)
router.delete('/:id', authMiddleware, (req: AuthRequest, res) => {
  const { id } = req.params;
  const user = req.user!;

  const index = db.leaves.findIndex((l) => l._id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Leave request not found.' });
  }

  const leave = db.leaves[index];
  if (user.role !== 'admin' && leave.employeeId !== user.employeeId) {
    return res.status(403).json({ error: 'Unauthorized to cancel this leave application.' });
  }

  if (leave.status !== 'Pending') {
    return res.status(400).json({ error: 'Cannot cancel a leave request that is already ' + leave.status });
  }

  db.leaves.splice(index, 1);
  res.json({ message: 'Leave request cancelled successfully.' });
});

export default router;
