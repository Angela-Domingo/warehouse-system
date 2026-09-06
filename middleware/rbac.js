const ApiError = require('../utils/ApiError');

// Usage: router.post('/warehouses', protect, authorize('admin'), createWarehouse)
// Must run AFTER `protect`, since it reads req.user set by that middleware.
function authorize(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      throw ApiError.unauthorized('Authentication required before authorization can be checked.');
    }
    if (!allowedRoles.includes(req.user.role)) {
      throw ApiError.forbidden(
        `Role '${req.user.role}' is not permitted to perform this action.`
      );
    }
    next();
  };
}

module.exports = { authorize };
