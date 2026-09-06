const { validationResult } = require('express-validator');
const ApiError = require('../utils/ApiError');

// Runs after an array of express-validator checks (e.g. body('email').isEmail()) and turns
// any collected errors into a clean 400 response instead of letting bad data reach controllers.
function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const message = errors
      .array()
      .map((e) => `${e.path}: ${e.msg}`)
      .join(', ');
    throw ApiError.badRequest(message);
  }
  next();
}

module.exports = validate;
