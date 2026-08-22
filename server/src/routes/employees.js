const express = require('express');
const {
  getEmployees,
  getEmployee,
  updateMe,
  updateEmployee
} = require('../controllers/employeeController');
const { protect } = require('../middleware/auth');
const roleGuard = require('../middleware/roleGuard');
const { upload } = require('../middleware/upload');

const router = express.Router();

// All routes require authentication
router.use(protect);

// Self-service routes
router.put('/me', upload.single('profilePhoto'), updateMe);

// Directory routes (all logged-in users can view)
router.route('/')
  .get(getEmployees);

router.route('/:id')
  .get(getEmployee)
  .put(roleGuard('admin', 'hr'), upload.single('profilePhoto'), updateEmployee);

module.exports = router;
