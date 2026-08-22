const { validationResult } = require('express-validator');

/**
 * Middleware to check express-validator results.
 * Place after validation chains in the route definition.
 *
 * Usage:
 *   router.post('/signup',
 *     [body('email').isEmail(), body('password').isLength({ min: 8 })],
 *     validate,
 *     controller.signup
 *   );
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map((err) => ({
      field: err.path,
      message: err.msg,
      value: err.value,
    }));

    return res.status(400).json({
      success: false,
      message: 'Validation failed.',
      errors: formattedErrors,
    });
  }

  next();
};

module.exports = validate;
