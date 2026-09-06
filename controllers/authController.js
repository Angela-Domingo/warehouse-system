const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Warehouse = require('../models/Warehouse');
const asyncHandler = require('../utils/asyncHandler');
const generateToken = require('../utils/generateToken');
const ApiError = require('../utils/ApiError');

// POST /api/auth/register
// Anyone can self-register as staff. Manager/Admin accounts are also created here for
// simplicity (per project scope: no social login, self-built JWT flow), but in a real
// deployment you'd typically gate manager/admin creation behind an existing admin.
const register = asyncHandler(async (req, res) => {
  const { name, email, password, role, warehouseId } = req.body;

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    throw ApiError.conflict('An account with this email already exists.', 'DUPLICATE_EMAIL');
  }

  if (warehouseId) {
    const warehouse = await Warehouse.findById(warehouseId);
    if (!warehouse) {
      throw ApiError.badRequest('warehouseId does not refer to an existing warehouse.');
    }
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const user = await User.create({
    name,
    email,
    passwordHash,
    role: role || 'staff',
    warehouseId: warehouseId || null,
  });

  const token = generateToken(user);

  res.status(201).json({
    success: true,
    message: 'Record created successfully',
    data: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      warehouseId: user.warehouseId,
      token,
    },
  });
});

// POST /api/auth/login
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email: email.toLowerCase() }).select('+passwordHash');
  if (!user || !user.isActive) {
    throw ApiError.unauthorized('Invalid email or password.');
  }

  const isMatch = await bcrypt.compare(password, user.passwordHash);
  if (!isMatch) {
    throw ApiError.unauthorized('Invalid email or password.');
  }

  const token = generateToken(user);

  res.status(200).json({
    success: true,
    message: 'Login successful',
    data: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      warehouseId: user.warehouseId,
      token,
    },
  });
});

// GET /api/auth/me
const getMe = asyncHandler(async (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Current user fetched successfully',
    data: req.user,
  });
});

module.exports = { register, login, getMe };
