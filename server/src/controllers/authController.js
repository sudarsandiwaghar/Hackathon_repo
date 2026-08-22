const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Employee = require('../models/Employee');

/**
 * Generate JWT token for a user
 */
const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, role: user.role, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
  );
};

/**
 * Generate a sequential employee code
 */
const generateEmployeeCode = async () => {
  const lastEmployee = await Employee.findOne()
    .sort({ createdAt: -1 })
    .select('employeeCode');

  if (!lastEmployee || !lastEmployee.employeeCode) {
    return 'EMP001';
  }

  const lastNumber = parseInt(lastEmployee.employeeCode.replace('EMP', ''), 10);
  const nextNumber = lastNumber + 1;
  return `EMP${String(nextNumber).padStart(3, '0')}`;
};

/**
 * POST /api/auth/signup
 * Register a new user + create employee profile
 */
exports.signup = async (req, res) => {
  try {
    const { email, password, firstName, lastName, department, designation } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email already exists.',
      });
    }

    // Create user
    const user = new User({
      email: email.toLowerCase(),
      password,
      role: 'employee', // Default role; admins are created via seed or manual DB update
    });

    // Generate email verification token
    const verificationToken = user.generateVerificationToken();
    await user.save();

    // Create employee profile
    const employeeCode = await generateEmployeeCode();
    const employee = await Employee.create({
      employeeCode,
      firstName,
      lastName,
      email: email.toLowerCase(),
      department: department || 'Engineering',
      designation: designation || 'Employee',
      joiningDate: new Date(),
      userId: user._id,
    });

    // Link employee to user
    user.employeeId = employee._id;
    await user.save();

    // Generate JWT
    const token = generateToken(user);

    // Build verification URL (for dev — in production this would be emailed)
    const verificationUrl = `${req.protocol}://${req.get('host')}/api/auth/verify-email/${verificationToken}`;

    res.status(201).json({
      success: true,
      message: 'Account created successfully. Please verify your email.',
      data: {
        token,
        user: {
          id: user._id,
          email: user.email,
          role: user.role,
          emailVerified: user.emailVerified,
          employeeId: employee._id,
        },
        employee: {
          id: employee._id,
          employeeCode: employee.employeeCode,
          firstName: employee.firstName,
          lastName: employee.lastName,
          fullName: employee.fullName,
        },
        // DEV ONLY: In production, this would be sent via email
        verificationUrl,
      },
    });
  } catch (error) {
    console.error('Signup error:', error);

    // Handle MongoDB duplicate key error
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email already exists.',
      });
    }

    res.status(500).json({
      success: false,
      message: 'An error occurred during registration.',
    });
  }
};

/**
 * POST /api/auth/signin
 * Authenticate user and return JWT
 */
exports.signin = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user with password field (excluded by default)
    const user = await User.findOne({ email: email.toLowerCase() }).select(
      '+password'
    );

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    // Get employee profile
    const employee = await Employee.findById(user.employeeId);

    // Generate JWT
    const token = generateToken(user);

    res.json({
      success: true,
      message: 'Signed in successfully.',
      data: {
        token,
        user: {
          id: user._id,
          email: user.email,
          role: user.role,
          emailVerified: user.emailVerified,
          employeeId: user.employeeId,
        },
        employee: employee
          ? {
              id: employee._id,
              employeeCode: employee.employeeCode,
              firstName: employee.firstName,
              lastName: employee.lastName,
              fullName: employee.fullName,
              department: employee.department,
              designation: employee.designation,
              photo: employee.photo,
            }
          : null,
      },
    });
  } catch (error) {
    console.error('Signin error:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred during sign in.',
    });
  }
};

/**
 * GET /api/auth/verify-email/:token
 * Verify email with token
 */
exports.verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;

    const user = await User.findByVerificationToken(token);

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired verification token.',
      });
    }

    user.emailVerified = true;
    user.verificationToken = undefined;
    user.verificationTokenExpires = undefined;
    await user.save();

    res.json({
      success: true,
      message: 'Email verified successfully.',
    });
  } catch (error) {
    console.error('Verify email error:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred during email verification.',
    });
  }
};

/**
 * POST /api/auth/resend-verification
 * Resend verification email (rate-limited by token expiry check)
 */
exports.resendVerification = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select(
      '+verificationToken +verificationTokenExpires'
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    if (user.emailVerified) {
      return res.status(400).json({
        success: false,
        message: 'Email is already verified.',
      });
    }

    // Rate limit: don't regenerate if current token is less than 5 minutes old
    if (
      user.verificationTokenExpires &&
      user.verificationTokenExpires > Date.now() + 23.9 * 60 * 60 * 1000
    ) {
      return res.status(429).json({
        success: false,
        message: 'Verification email was recently sent. Please wait before requesting again.',
      });
    }

    const verificationToken = user.generateVerificationToken();
    await user.save();

    const verificationUrl = `${req.protocol}://${req.get('host')}/api/auth/verify-email/${verificationToken}`;

    res.json({
      success: true,
      message: 'Verification token regenerated.',
      data: {
        // DEV ONLY: In production, this would be sent via email
        verificationUrl,
      },
    });
  } catch (error) {
    console.error('Resend verification error:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred.',
    });
  }
};

/**
 * GET /api/auth/me
 * Get current user + employee profile
 */
exports.getMe = async (req, res) => {
  try {
    const user = req.user;
    const employee = await Employee.findById(user.employeeId);

    res.json({
      success: true,
      data: {
        user: {
          id: user._id,
          email: user.email,
          role: user.role,
          emailVerified: user.emailVerified,
          employeeId: user.employeeId,
        },
        employee: employee
          ? {
              id: employee._id,
              employeeCode: employee.employeeCode,
              firstName: employee.firstName,
              lastName: employee.lastName,
              fullName: employee.fullName,
              email: employee.email,
              phone: employee.phone,
              address: employee.address,
              department: employee.department,
              designation: employee.designation,
              joiningDate: employee.joiningDate,
              photo: employee.photo,
              status: employee.status,
            }
          : null,
      },
    });
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred.',
    });
  }
};
