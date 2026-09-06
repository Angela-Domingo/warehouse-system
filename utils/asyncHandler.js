// Wraps an async route handler so any thrown error / rejected promise is forwarded to
// Express's error-handling middleware instead of crashing the server or hanging the request.
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;
