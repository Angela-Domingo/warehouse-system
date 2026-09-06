const ApiError = require('../utils/ApiError');

// Catches every error forwarded via next(err) (including from asyncHandler) and converts it
// into one consistent JSON shape. This is the single place that decides HTTP status + body,
// so no route ever needs to hand-format an error response itself.
function errorHandler(err, req, res, next) {
  let error = err;

  // Mongoose bad ObjectId -> treat as 404, not a 500 crash.
  if (err.name === 'CastError') {
    error = ApiError.notFound(`Invalid identifier: ${err.value}`);
  }

  // Mongoose validation errors -> 400.
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((e) => e.message);
    error = ApiError.badRequest(messages.join(', '));
  }

  // Mongoose duplicate key error -> 409.
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {}).join(', ');
    error = ApiError.conflict(`Duplicate value for field(s): ${field}`, 'DUPLICATE_KEY');
  }

  const statusCode = error.statusCode || 500;
  const message = error.message || 'Internal server error';
  const errorCode = error.errorCode || 'INTERNAL_ERROR';

  if (statusCode === 500) {
    // Log full detail server-side; never leak stack traces to the client.
    console.error(err);
  }

  res.status(statusCode).json({
    success: false,
    message,
    errorCode,
  });
}

// Catches requests to routes that don't exist at all.
function notFound(req, res, next) {
  next(ApiError.notFound(`Route not found: ${req.method} ${req.originalUrl}`));
}

module.exports = { errorHandler, notFound };
