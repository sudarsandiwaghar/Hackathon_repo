import express from 'express';
import jwt from 'jsonwebtoken';
import { db, User, Employee } from '../data/store.ts';
import { JWT_SECRET, authMiddleware, AuthRequest } from '../middleware/auth.ts';

const router = express.Router();

// POST /api/auth/signup
router.post('/signup', (req, res) => {
  const { email, password, firstName, lastName, department, designation, phone } = req.body;

  if (!email || !password || !firstName || !lastName) {
    return res.status(400).json({ error: 'Please provide email, password, firstName, and lastName.' });
  }

  const existingUser = db.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  if (existingUser) {
    return res.status(400).json({ error: 'An account with this email already exists.' });
  }

  const userId = 'user_' + Date.now().toString(36);
  const employeeId = 'emp_' + Date.now().toString(36);
  const employeeCode = 'DF-' + (100 + db.employees.length + 1);
  const verificationToken = 'verify_' + Math.random().toString(36).substring(2, 15);

  const newUser: User = {
    _id: userId,
    email: email.toLowerCase(),
    passwordHash: password, // In production bcrypt
    role: 'employee',
    employeeId,
    emailVerified: false,
    verificationToken,
    verificationTokenExpires: new Date(Date.now() + 24 * 3600000).toISOString(),
    createdAt: new Date().toISOString(),
  };

  const newEmployee: Employee = {
    _id: employeeId,
    employeeCode,
    firstName,
    lastName,
    email: email.toLowerCase(),
    phone: phone || '+91 98000 00000',
    address: 'Bangalore, Karnataka',
    department: department || 'Engineering',
    designation: designation || 'Associate Engineer',
    joiningDate: new Date().toISOString().split('T')[0],
    userId,
    salary: {
      basic: 50000,
      hra: 20000,
      specialAllowance: 12000,
      pfDeduction: 6000,
      taxDeduction: 5000,
    },
    leaveBalance: { paid: 12, sick: 8, unpaid: 0 },
    status: 'Active',
  };

  db.users.push(newUser);
  db.employees.push(newEmployee);

  // Auto notification
  db.notifications.push({
    _id: db.generateId(),
    userId,
    type: 'system',
    title: 'Welcome to Dayflow HRMS',
    message: 'Welcome to the team! Please complete your profile and verify your email.',
    read: false,
    icon: 'user',
    createdAt: new Date().toISOString(),
  });

  const token = jwt.sign(
    { userId: newUser._id, email: newUser.email, role: newUser.role, employeeId },
    JWT_SECRET,
    { expiresIn: '24h' }
  );

  res.status(201).json({
    message: 'Account created successfully! Please verify your email.',
    token,
    user: {
      _id: newUser._id,
      email: newUser.email,
      role: newUser.role,
      employeeId: newUser.employeeId,
      emailVerified: newUser.emailVerified,
    },
    employee: newEmployee,
    verificationToken,
    verificationUrl: `/verify-email/${verificationToken}`,
  });
});

// POST /api/auth/signin
router.post('/signin', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  const user = db.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  if (!user || user.passwordHash !== password) {
    return res.status(401).json({ error: 'Invalid email or password credentials.' });
  }

  const employee = db.employees.find((e) => e._id === user.employeeId);

  const token = jwt.sign(
    { userId: user._id, email: user.email, role: user.role, employeeId: user.employeeId },
    JWT_SECRET,
    { expiresIn: '24h' }
  );

  res.json({
    message: 'Authentication successful',
    token,
    user: {
      _id: user._id,
      email: user.email,
      role: user.role,
      employeeId: user.employeeId,
      emailVerified: user.emailVerified,
    },
    employee,
  });
});

// GET /api/auth/verify-email/:token
router.get('/verify-email/:token', (req, res) => {
  const { token } = req.params;
  const user = db.users.find((u) => u.verificationToken === token);

  if (!user) {
    return res.status(400).json({ error: 'Invalid or expired verification token.' });
  }

  user.emailVerified = true;
  delete user.verificationToken;
  delete user.verificationTokenExpires;

  res.json({
    success: true,
    message: 'Email address verified successfully! Your account is now fully active.',
    user: {
      _id: user._id,
      email: user.email,
      role: user.role,
      emailVerified: true,
    },
  });
});

// POST /api/auth/resend-verification
router.post('/resend-verification', authMiddleware, (req: AuthRequest, res) => {
  const user = req.user!;
  const newToken = 'verify_' + Math.random().toString(36).substring(2, 15);
  user.verificationToken = newToken;
  user.verificationTokenExpires = new Date(Date.now() + 24 * 3600000).toISOString();

  res.json({
    message: 'Verification email link regenerated.',
    verificationToken: newToken,
    verificationUrl: `/verify-email/${newToken}`,
  });
});

// GET /api/auth/me
router.get('/me', authMiddleware, (req: AuthRequest, res) => {
  const user = req.user!;
  const employee = db.employees.find((e) => e._id === user.employeeId);
  res.json({
    user: {
      _id: user._id,
      email: user.email,
      role: user.role,
      employeeId: user.employeeId,
      emailVerified: user.emailVerified,
    },
    employee,
  });
});

export default router;
