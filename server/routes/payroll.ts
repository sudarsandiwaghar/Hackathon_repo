import express from 'express';
import { db, PayrollRecord } from '../data/store.ts';
import { authMiddleware, roleGuard, AuthRequest } from '../middleware/auth.ts';

const router = express.Router();

// GET /api/payroll/me (Employee read-only)
router.get('/me', authMiddleware, (req: AuthRequest, res) => {
  const user = req.user!;
  const records = db.payrolls
    .filter((p) => p.employeeId === user.employeeId)
    .sort((a, b) => {
      if (a.year !== b.year) return b.year - a.year;
      return b.month - a.month;
    });

  const emp = db.employees.find((e) => e._id === user.employeeId);

  res.json({
    records,
    salaryStructure: emp?.salary || null,
  });
});

// GET /api/payroll (Admin all records)
router.get('/', authMiddleware, roleGuard(['admin']), (req, res) => {
  const { month, year, department, status, employeeId } = req.query;

  let list = db.payrolls.map((p) => {
    const emp = db.employees.find((e) => e._id === p.employeeId);
    return {
      ...p,
      employee: emp
        ? {
            _id: emp._id,
            employeeCode: emp.employeeCode,
            name: `${emp.firstName} ${emp.lastName}`,
            email: emp.email,
            department: emp.department,
            designation: emp.designation,
            photo: emp.photo,
          }
        : null,
    };
  });

  if (month) {
    list = list.filter((p) => p.month === Number(month));
  }

  if (year) {
    list = list.filter((p) => p.year === Number(year));
  }

  if (status && status !== 'all') {
    list = list.filter((p) => p.status.toLowerCase() === String(status).toLowerCase());
  }

  if (employeeId) {
    list = list.filter((p) => p.employeeId === String(employeeId));
  }

  if (department && department !== 'all') {
    list = list.filter((p) => p.employee && p.employee.department.toLowerCase() === String(department).toLowerCase());
  }

  // Sort by year desc, month desc
  list.sort((a, b) => {
    if (a.year !== b.year) return b.year - a.year;
    return b.month - a.month;
  });

  // Calculate summary stats
  const totalPayroll = list.reduce((sum, p) => sum + p.netSalary, 0);
  const paidCount = list.filter((p) => p.status === 'Paid').length;
  const processedCount = list.filter((p) => p.status === 'Processed').length;
  const pendingCount = list.filter((p) => p.status === 'Pending').length;

  res.json({
    records: list,
    summary: {
      totalDisbursed: totalPayroll,
      recordCount: list.length,
      paidCount,
      processedCount,
      pendingCount,
    },
  });
});

// PUT /api/payroll/:id & /:id/status (Admin edit payroll item)
const updatePayrollHandler = (req: express.Request, res: express.Response) => {
  const { id } = req.params;
  const { basicSalary, allowances, deductions, status, paymentDate } = req.body;

  const record = db.payrolls.find((p) => p._id === id);
  if (!record) {
    return res.status(404).json({ error: 'Payroll record not found.' });
  }

  if (basicSalary !== undefined) record.basicSalary = Number(basicSalary);
  if (allowances !== undefined) record.allowances = { ...record.allowances, ...allowances };
  if (deductions !== undefined) record.deductions = { ...record.deductions, ...deductions };
  if (status !== undefined) record.status = status;
  if (paymentDate !== undefined) record.paymentDate = paymentDate;

  // Recalculate net salary
  const totalAllowances = Object.values(record.allowances).reduce((a, b) => (typeof b === 'number' ? a + b : a), 0);
  const totalDeductions = Object.values(record.deductions).reduce((a, b) => (typeof b === 'number' ? a + b : a), 0);
  record.netSalary = record.basicSalary + totalAllowances - totalDeductions;

  res.json({ message: 'Payroll record updated', record });
};

router.put('/:id', authMiddleware, roleGuard(['admin']), updatePayrollHandler);
router.put('/:id/status', authMiddleware, roleGuard(['admin']), updatePayrollHandler);

// POST /api/payroll/generate (Admin generates monthly payroll)
router.post('/generate', authMiddleware, roleGuard(['admin']), (req, res) => {
  const { month, year } = req.body;

  if (!month || !year) {
    return res.status(400).json({ error: 'Month and year are required.' });
  }

  const targetMonth = Number(month);
  const targetYear = Number(year);
  const activeEmps = db.employees.filter((e) => e.status !== 'Inactive');

  let generatedCount = 0;
  let skippedCount = 0;
  const nowIso = new Date().toISOString();

  activeEmps.forEach((emp) => {
    const existing = db.payrolls.find(
      (p) => p.employeeId === emp._id && p.month === targetMonth && p.year === targetYear
    );

    if (existing) {
      skippedCount++;
      return;
    }

    const basic = emp.salary.basic;
    const allowances = {
      hra: emp.salary.hra,
      special: emp.salary.specialAllowance,
    };
    const deductions = {
      pf: emp.salary.pfDeduction,
      tax: emp.salary.taxDeduction,
    };
    const net = basic + allowances.hra + allowances.special - (deductions.pf + deductions.tax);

    const record: PayrollRecord = {
      _id: db.generateId(),
      employeeId: emp._id,
      month: targetMonth,
      year: targetYear,
      basicSalary: basic,
      allowances,
      deductions,
      netSalary: net,
      status: 'Processed',
      processedAt: nowIso,
    };

    db.payrolls.push(record);
    generatedCount++;

    // Notify employee
    const user = db.users.find((u) => u.employeeId === emp._id);
    if (user) {
      db.notifications.push({
        _id: db.generateId(),
        userId: user._id,
        type: 'payroll_processed',
        title: 'New Salary Slip Available',
        message: `Your payroll for ${targetMonth}/${targetYear} has been generated (Net Pay: ₹${net.toLocaleString('en-IN')}).`,
        read: false,
        icon: 'credit-card',
        createdAt: nowIso,
      });
    }
  });

  res.json({
    message: `Payroll generation complete for ${targetMonth}/${targetYear}`,
    generatedCount,
    skippedCount,
  });
});

export default router;
