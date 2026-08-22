import express from 'express';
import { db } from '../data/store.ts';
import { runStartupCatchup } from '../jobs/attendanceReconciler.ts';

const router = express.Router();

// POST /api/seed/reset
router.post('/reset', (req, res) => {
  db.seedInitialData();
  runStartupCatchup();
  res.json({
    message: 'Database reset and re-seeded successfully with 8 employees, attendance, leaves, payroll, and notifications.',
    counts: {
      users: db.users.length,
      employees: db.employees.length,
      attendance: db.attendance.length,
      leaves: db.leaves.length,
      payrolls: db.payrolls.length,
      notifications: db.notifications.length,
    },
  });
});

export default router;
