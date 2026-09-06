const jwt = require('jsonwebtoken');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const User = require('../models/User');

// Verifies the JWT from the Authorization header, then loads the current user from the DB
// (rather than trusting only the token payload) so a deactivated/deleted user is rejected
// even if their token hasn't expired yet.
const protect = asyncHandler(async (req, res, next) => {
  let token;
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  }

  if (!token) {
    throw ApiError.unauthorized('No token provided. Please log in.');
  }

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    throw ApiError.unauthorized('Invalid or expired token.');
  }

  const user = await User.findById(decoded.id).select('-passwordHash');
  if (!user) {
    throw ApiError.unauthorized('User belonging to this token no longer exists.');
  }

  req.user = user; // full mongoose doc (minus password) available to downstream handlers
  next();
});

module.exports = { protect };
