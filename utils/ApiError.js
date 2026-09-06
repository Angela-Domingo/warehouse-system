// A single error shape used everywhere so the error-handling middleware can produce
// consistent JSON responses instead of leaking stack traces or crashing the process.

class ApiError extends Error {
  constructor(statusCode, message, errorCode = 'ERROR') {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message, errorCode = 'VALIDATION_ERROR') {
    return new ApiError(400, message, errorCode);
  }

  static unauthorized(message = 'Authentication required') {
    return new ApiError(401, message, 'UNAUTHORIZED');
  }

  static forbidden(message = 'You do not have permission to perform this action') {
    return new ApiError(403, message, 'FORBIDDEN');
  }

  static notFound(message = 'Resource not found') {
    return new ApiError(404, message, 'NOT_FOUND');
  }

  static conflict(message, errorCode = 'CONFLICT') {
    return new ApiError(409, message, errorCode);
  }

  static internal(message = 'Something went wrong') {
    return new ApiError(500, message, 'INTERNAL_ERROR');
  }
}

module.exports = ApiError;
