const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema(
  {
    sku: { type: String, required: true, trim: true, uppercase: true, unique: true },
    name: { type: String, required: true, trim: true },
    category: { type: String, required: true, trim: true },
    unit: { type: String, required: true, trim: true }, // e.g. "pcs", "kg", "box"
    unitPrice: { type: Number, required: true, min: [0, 'Unit price cannot be negative'] },
    reorderPoint: {
      type: Number,
      required: true,
      default: 10,
      min: [0, 'Reorder point cannot be negative'],
    },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

itemSchema.index({ category: 1 });

module.exports = mongoose.model('Item', itemSchema);