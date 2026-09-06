const jwt = require('jsonwebtoken');

// Payload kept intentionally small (id + role + warehouseId) - anything else needed by a
// route should be fetched fresh from the DB rather than trusted from the token.
function generateToken(user) {
  return jwt.sign(
    {
      id: user._id,
      role: user.role,
      warehouseId: user.warehouseId || null,
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}

module.exports = generateToken;
