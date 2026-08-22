const express = require('express');
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const auth = require('../middleware/auth');
const authController = require('../controllers/authController');

const router = express.Router();

// POST /api/auth/signup
router.post(
  '/signup',
  [
    body('email')
      .isEmail()
      .withMessage('Please provide a valid email address.')
      .normalizeEmail(),
    body('password')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters long.')
      .matches(/[A-Z]/)
      .withMessage('Password must contain at least one uppercase letter.')
      .matches(/[0-9]/)
      .withMessage('Password must contain at least one number.'),
    body('firstName')
      .trim()
      .notEmpty()
      .withMessage('First name is required.')
      .isLength({ max: 50 })
      .withMessage('First name cannot exceed 50 characters.'),
    body('lastName')
      .trim()
      .notEmpty()
      .withMessage('Last name is required.')
      .isLength({ max: 50 })
      .withMessage('Last name cannot exceed 50 characters.'),
    body('department')
      .optional()
      .isIn(['Engineering', 'HR', 'Marketing', 'Finance', 'Operations'])
      .withMessage('Invalid department.'),
    body('designation')
      .optional()
      .trim()
      .isLength({ max: 100 })
      .withMessage('Designation cannot exceed 100 characters.'),
  ],
  validate,
  authController.signup
);

// POST /api/auth/signin
router.post(
  '/signin',
  [
    body('email')
      .isEmail()
      .withMessage('Please provide a valid email address.')
      .normalizeEmail(),
    body('password').notEmpty().withMessage('Password is required.'),
  ],
  validate,
  authController.signin
);

// GET /api/auth/verify-email/:token
router.get('/verify-email/:token', authController.verifyEmail);

// POST /api/auth/resend-verification (requires auth)
router.post('/resend-verification', auth, authController.resendVerification);

// GET /api/auth/me (requires auth)
router.get('/me', auth, authController.getMe);

module.exports = router;
