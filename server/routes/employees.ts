import express from 'express';
import { db, Employee } from '../data/store.ts';
import { authMiddleware, roleGuard, AuthRequest } from '../middleware/auth.ts';

const router = express.Router();

// GET /api/employees (Role-aware)
router.get('/', authMiddleware, (req: AuthRequest, res) => {
  const user = req.user!;
  const { department, search, status } = req.query;

  let list = [...db.employees];

  if (department && department !== 'all') {
    list = list.filter((e) => e.department.toLowerCase() === String(department).toLowerCase());
  }

  if (status && status !== 'all') {
    list = list.filter((e) => e.status.toLowerCase() === String(status).toLowerCase());
  }

  if (search) {
    const q = String(search).toLowerCase();
    list = list.filter(
      (e) =>
        e.firstName.toLowerCase().includes(q) ||
        e.lastName.toLowerCase().includes(q) ||
        e.email.toLowerCase().includes(q) ||
        e.employeeCode.toLowerCase().includes(q) ||
        e.designation.toLowerCase().includes(q)
    );
  }

  // Role-based field sanitization
  if (user.role === 'admin') {
    return res.json(list);
  } else {
    // Employee sees public directory fields only
    const sanitized = list.map((e) => ({
      _id: e._id,
      employeeCode: e.employeeCode,
      firstName: e.firstName,
      lastName: e.lastName,
      email: e.email,
      phone: e.phone,
      department: e.department,
      designation: e.designation,
      joiningDate: e.joiningDate,
      photo: e.photo,
      status: e.status,
    }));
    return res.json(sanitized);
  }
});

// GET /api/employees/me (Own profile)
router.get('/me', authMiddleware, (req: AuthRequest, res) => {
  const user = req.user!;
  const emp = db.employees.find((e) => e._id === user.employeeId);
  if (!emp) {
    return res.status(404).json({ error: 'Employee profile not found.' });
  }
  res.json(emp);
});

// PUT /api/employees/me (Self update: allowed fields only)
router.put('/me', authMiddleware, (req: AuthRequest, res) => {
  const user = req.user!;
  const emp = db.employees.find((e) => e._id === user.employeeId);
  if (!emp) {
    return res.status(404).json({ error: 'Employee profile not found.' });
  }

  const { phone, address, photo } = req.body;

  if (phone !== undefined) emp.phone = phone;
  if (address !== undefined) emp.address = address;
  if (photo !== undefined) emp.photo = photo;

  res.json({ message: 'Profile updated successfully', employee: emp });
});

// GET /api/employees/:id (Admin only)
router.get('/:id', authMiddleware, roleGuard(['admin']), (req, res) => {
  const emp = db.employees.find((e) => e._id === req.params.id);
  if (!emp) {
    return res.status(404).json({ error: 'Employee not found' });
  }
  res.json(emp);
});

// PUT /api/employees/:id (Admin only: update all fields)
router.put('/:id', authMiddleware, roleGuard(['admin']), (req, res) => {
  const emp = db.employees.find((e) => e._id === req.params.id);
  if (!emp) {
    return res.status(404).json({ error: 'Employee not found' });
  }

  const {
    firstName,
    lastName,
    phone,
    address,
    department,
    designation,
    joiningDate,
    photo,
    salary,
    leaveBalance,
    status,
  } = req.body;

  if (firstName !== undefined) emp.firstName = firstName;
  if (lastName !== undefined) emp.lastName = lastName;
  if (phone !== undefined) emp.phone = phone;
  if (address !== undefined) emp.address = address;
  if (department !== undefined) emp.department = department;
  if (designation !== undefined) emp.designation = designation;
  if (joiningDate !== undefined) emp.joiningDate = joiningDate;
  if (photo !== undefined) emp.photo = photo;
  if (status !== undefined) emp.status = status;
  if (salary !== undefined) emp.salary = { ...emp.salary, ...salary };
  if (leaveBalance !== undefined) emp.leaveBalance = { ...emp.leaveBalance, ...leaveBalance };

  res.json({ message: 'Employee record updated successfully', employee: emp });
});

// POST /api/employees (Admin creates employee)
router.post('/', authMiddleware, roleGuard(['admin']), (req, res) => {
  const { firstName, lastName, email, phone, address, department, designation, joiningDate, salary } = req.body;

  if (!firstName || !lastName || !email || !department || !designation) {
    return res.status(400).json({ error: 'Missing required employee fields.' });
  }

  const existing = db.employees.find((e) => e.email.toLowerCase() === email.toLowerCase());
  if (existing) {
    return res.status(400).json({ error: 'Employee with this email already exists.' });
  }

  const userId = 'user_' + Date.now().toString(36);
  const employeeId = 'emp_' + Date.now().toString(36);
  const employeeCode = 'DF-' + (100 + db.employees.length + 1);

  const newUser = {
    _id: userId,
    email: email.toLowerCase(),
    passwordHash: 'Employee@123',
    role: 'employee' as const,
    employeeId,
    emailVerified: true,
    createdAt: new Date().toISOString(),
  };

  const newEmp: Employee = {
    _id: employeeId,
    employeeCode,
    firstName,
    lastName,
    email: email.toLowerCase(),
    phone: phone || '+91 98000 00000',
    address: address || 'Bangalore, India',
    department: department || 'Engineering',
    designation: designation || 'Specialist',
    joiningDate: joiningDate || new Date().toISOString().split('T')[0],
    userId,
    salary: salary || {
      basic: 60000,
      hra: 24000,
      specialAllowance: 15000,
      pfDeduction: 7200,
      taxDeduction: 8000,
    },
    leaveBalance: { paid: 15, sick: 10, unpaid: 0 },
    status: 'Active',
  };

  db.users.push(newUser);
  db.employees.push(newEmp);

  res.status(201).json({ message: 'Employee created successfully', employee: newEmp });
});

export default router;
