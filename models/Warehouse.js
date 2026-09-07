const mongoose = require('mongoose');

const warehouseSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, unique: true },
    location: { type: String, required: true, trim: true },
    capacity: {
      type: Number,
      required: true,
      min: [0, 'Capacity cannot be negative'],
    },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Warehouse', warehouseSchema);