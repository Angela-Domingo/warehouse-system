const mongoose = require('mongoose');
const { ROLES } = require('../utils/constants');

// Design note: warehouseId is a REFERENCE (not embedded) because a warehouse is a large,
// independently-updated document shared across many users - embedding it would duplicate
// warehouse data on every user record and go stale the moment the warehouse changes.
const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: { type: String, required: true, select: false },
    role: {
      type: String,
      enum: Object.values(ROLES),
      default: ROLES.STAFF,
      required: true,
    },
    warehouseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Warehouse',
      default: null, // admins may not be tied to a single warehouse
    },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

userSchema.index({ warehouseId: 1 });

module.exports = mongoose.model('User', userSchema);
