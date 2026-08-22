import express from 'express';
import { db, AttendanceRecord } from '../data/store.ts';
import { authMiddleware, roleGuard, AuthRequest } from '../middleware/auth.ts';
import { reconcileAttendanceForDate, runStartupCatchup } from '../jobs/attendanceReconciler.ts';

const router = express.Router();

// POST /api/attendance/check-in
router.post('/check-in', authMiddleware, (req: AuthRequest, res) => {
  const user = req.user!;
  const todayStr = new Date().toISOString().split('T')[0];

  let record = db.attendance.find((a) => a.employeeId === user.employeeId && a.date === todayStr);

  if (record && record.checkIn) {
    return res.status(400).json({
      error: 'You have already checked in for today at ' + new Date(record.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    });
  }

  const nowIso = new Date().toISOString();

  if (record) {
    record.checkIn = nowIso;
    record.status = 'Present';
    record.source = 'manual';
  } else {
    record = {
      _id: db.generateId(),
      employeeId: user.employeeId,
      date: todayStr,
      checkIn: nowIso,
      status: 'Present',
      source: 'manual',
    };
    db.attendance.push(record);
  }

  res.json({ message: 'Checked in successfully!', attendance: record });
});

// POST /api/attendance/check-out
router.post('/check-out', authMiddleware, (req: AuthRequest, res) => {
  const user = req.user!;
  const todayStr = new Date().toISOString().split('T')[0];

  const record = db.attendance.find((a) => a.employeeId === user.employeeId && a.date === todayStr);

  if (!record || !record.checkIn) {
    return res.status(400).json({ error: 'You have not checked in for today yet.' });
  }

  if (record.checkOut) {
    return res.status(400).json({
      error: 'You have already checked out today at ' + new Date(record.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    });
  }

  const checkOutIso = new Date().toISOString();
  record.checkOut = checkOutIso;

  const inTime = new Date(record.checkIn).getTime();
  const outTime = new Date(checkOutIso).getTime();
  const hours = Number(((outTime - inTime) / 3600000).toFixed(2));
  record.totalHours = hours;

  if (hours < 4.0) {
    record.status = 'Half-day';
    record.notes = 'Total working duration was under 4 hours.';
  } else {
    record.status = 'Present';
  }

  res.json({ message: 'Checked out successfully!', attendance: record });
});

// GET /api/attendance/me
router.get('/me', authMiddleware, (req: AuthRequest, res) => {
  const user = req.user!;
  const { month, year, startDate, endDate, limit } = req.query;

  let records = db.attendance.filter((a) => a.employeeId === user.employeeId);

  if (startDate && endDate) {
    records = records.filter((a) => a.date >= String(startDate) && a.date <= String(endDate));
  } else if (month && year) {
    const prefix = `${year}-${String(month).padStart(2, '0')}`;
    records = records.filter((a) => a.date.startsWith(prefix));
  }

  // Sort descending by date
  records.sort((a, b) => b.date.localeCompare(a.date));

  if (limit) {
    records = records.slice(0, Number(limit));
  }

  // Calculate summary stats
  const totalDays = records.length;
  const presentDays = records.filter((r) => r.status === 'Present').length;
  const halfDays = records.filter((r) => r.status === 'Half-day').length;
  const leaveDays = records.filter((r) => r.status === 'Leave').length;
  const absentDays = records.filter((r) => r.status === 'Absent').length;

  const todayStr = new Date().toISOString().split('T')[0];
  const todayRecord = db.attendance.find((a) => a.employeeId === user.employeeId && a.date === todayStr);

  res.json({
    records,
    todayRecord: todayRecord || null,
    summary: {
      totalDays,
      presentDays,
      halfDays,
      leaveDays,
      absentDays,
      attendanceRate: totalDays > 0 ? Math.round(((presentDays + halfDays * 0.5) / totalDays) * 100) : 100,
    },
  });
});

// GET /api/attendance (Admin only)
router.get('/', authMiddleware, roleGuard(['admin']), (req, res) => {
  const { date, department, status, employeeId, startDate, endDate } = req.query;

  let records = [...db.attendance];

  if (date) {
    records = records.filter((r) => r.date === String(date));
  } else if (startDate && endDate) {
    records = records.filter((r) => r.date >= String(startDate) && r.date <= String(endDate));
  }

  if (status && status !== 'all') {
    records = records.filter((r) => r.status.toLowerCase() === String(status).toLowerCase());
  }

  if (employeeId) {
    records = records.filter((r) => r.employeeId === String(employeeId));
  }

  // Attach employee info
  const enriched = records.map((r) => {
    const emp = db.employees.find((e) => e._id === r.employeeId);
    return {
      ...r,
      employee: emp
        ? {
            _id: emp._id,
            employeeCode: emp.employeeCode,
            name: `${emp.firstName} ${emp.lastName}`,
            department: emp.department,
            designation: emp.designation,
            photo: emp.photo,
          }
        : null,
    };
  });

  let filtered = enriched;
  if (department && department !== 'all') {
    filtered = filtered.filter((r) => r.employee && r.employee.department.toLowerCase() === String(department).toLowerCase());
  }

  // Sort by date desc
  filtered.sort((a, b) => b.date.localeCompare(a.date));

  res.json(filtered);
});

// GET /api/attendance/stats (Admin aggregate stats)
router.get('/stats', authMiddleware, roleGuard(['admin']), (req, res) => {
  const todayStr = new Date().toISOString().split('T')[0];
  const activeEmployees = db.employees.filter((e) => e.status !== 'Inactive');
  const totalEmployees = activeEmployees.length;

  const todayRecords = db.attendance.filter((a) => a.date === todayStr);

  const presentToday = todayRecords.filter((a) => a.status === 'Present').length;
  const halfDayToday = todayRecords.filter((a) => a.status === 'Half-day').length;
  const onLeaveToday = todayRecords.filter((a) => a.status === 'Leave').length;
  const absentToday = Math.max(0, totalEmployees - (presentToday + halfDayToday + onLeaveToday));

  // Past 14 days trend data for Recharts
  const trendDays = 14;
  const dailyTrends = [];

  for (let i = trendDays - 1; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000);
    if (d.getDay() === 0 || d.getDay() === 6) continue; // Skip weekends in chart for cleaner view

    const dStr = d.toISOString().split('T')[0];
    const dayRecords = db.attendance.filter((a) => a.date === dStr);

    const p = dayRecords.filter((a) => a.status === 'Present').length;
    const h = dayRecords.filter((a) => a.status === 'Half-day').length;
    const l = dayRecords.filter((a) => a.status === 'Leave').length;
    const a = dayRecords.filter((a) => a.status === 'Absent').length;

    dailyTrends.push({
      date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      dateRaw: dStr,
      present: p,
      halfDay: h,
      leave: l,
      absent: a,
      total: totalEmployees,
    });
  }

  res.json({
    totalEmployees,
    today: {
      present: presentToday,
      halfDay: halfDayToday,
      onLeave: onLeaveToday,
      absent: absentToday,
      presentRate: totalEmployees > 0 ? Math.round(((presentToday + halfDayToday * 0.5) / totalEmployees) * 100) : 0,
    },
    dailyTrends,
  });
});

// POST /api/attendance/reconcile (Admin manual trigger)
router.post('/reconcile', authMiddleware, roleGuard(['admin']), (req, res) => {
  const { date } = req.body;
  if (date) {
    const result = reconcileAttendanceForDate(String(date));
    return res.json({ message: `Attendance reconciled for ${date}`, result });
  } else {
    const results = runStartupCatchup();
    return res.json({ message: 'Attendance catchup completed for past 7 days', results });
  }
});

export default router;
