import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import authRoutes from './server/routes/auth.ts';
import employeeRoutes from './server/routes/employees.ts';
import attendanceRoutes from './server/routes/attendance.ts';
import leaveRoutes from './server/routes/leave.ts';
import payrollRoutes from './server/routes/payroll.ts';
import notificationRoutes from './server/routes/notifications.ts';
import seedRoutes from './server/routes/seed.ts';
import { runStartupCatchup, reconcileAttendanceForDate } from './server/jobs/attendanceReconciler.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Run startup catchup on boot
  try {
    runStartupCatchup();
    console.log('[Dayflow HRMS] Startup attendance reconciliation executed.');
  } catch (err) {
    console.error('[Dayflow HRMS] Attendance catchup error:', err);
  }

  // Set up periodic EOD attendance reconciliation (runs every hour to keep state fresh)
  setInterval(() => {
    try {
      const todayStr = new Date().toISOString().split('T')[0];
      reconcileAttendanceForDate(todayStr);
    } catch (e) {
      console.error('[Dayflow HRMS] Reconciler tick error:', e);
    }
  }, 60 * 60 * 1000);

  // Mount API routes
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      service: 'Dayflow HRMS API',
      timestamp: new Date().toISOString(),
    });
  });

  app.use('/api/auth', authRoutes);
  app.use('/api/employees', employeeRoutes);
  app.use('/api/attendance', attendanceRoutes);
  app.use('/api/leave', leaveRoutes);
  app.use('/api/payroll', payrollRoutes);
  app.use('/api/notifications', notificationRoutes);
  app.use('/api/seed', seedRoutes);

  // Vite integration
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Dayflow HRMS] Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
