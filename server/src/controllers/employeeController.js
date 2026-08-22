const Employee = require('../models/Employee');
const User = require('../models/User');
const { uploadToCloudinary } = require('../middleware/upload');

// @desc    Get all employees (directory)
// @route   GET /api/employees
// @access  Private
exports.getEmployees = async (req, res, next) => {
  try {
    const { department, search } = req.query;
    
    let query = {};
    if (department) {
      query.department = department;
    }
    
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } }
      ];
    }

    const employees = await Employee.find(query)
      .populate('user', 'email role isEmailVerified')
      .sort({ firstName: 1 });

    res.status(200).json({
      success: true,
      count: employees.length,
      data: employees
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single employee by ID
// @route   GET /api/employees/:id
// @access  Private
exports.getEmployee = async (req, res, next) => {
  try {
    const employee = await Employee.findById(req.params.id)
      .populate('user', 'email role isEmailVerified')
      .populate('manager', 'firstName lastName');

    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }

    res.status(200).json({
      success: true,
      data: employee
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update current employee profile (Self)
// @route   PUT /api/employees/me
// @access  Private
exports.updateMe = async (req, res, next) => {
  try {
    // Prevent updating restricted fields
    const { _id, user, department, designation, salary, dateJoined, employmentType, status, ...updateData } = req.body;

    // Handle profile photo upload if file exists
    if (req.file) {
      try {
        const photoUrl = await uploadToCloudinary(req.file.buffer, 'dayflow/profiles');
        updateData.profilePhoto = photoUrl;
      } catch (uploadError) {
        return res.status(500).json({ success: false, message: 'Image upload failed', error: uploadError.message });
      }
    }

    const employee = await Employee.findOneAndUpdate(
      { user: req.user.id },
      updateData,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      data: employee
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update any employee (Admin)
// @route   PUT /api/employees/:id
// @access  Private/Admin
exports.updateEmployee = async (req, res, next) => {
  try {
    const updateData = { ...req.body };

    // Handle profile photo upload if file exists
    if (req.file) {
      try {
        const photoUrl = await uploadToCloudinary(req.file.buffer, 'dayflow/profiles');
        updateData.profilePhoto = photoUrl;
      } catch (uploadError) {
        return res.status(500).json({ success: false, message: 'Image upload failed', error: uploadError.message });
      }
    }

    const employee = await Employee.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }

    res.status(200).json({
      success: true,
      data: employee
    });
  } catch (error) {
    next(error);
  }
};
