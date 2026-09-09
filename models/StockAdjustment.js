const mongoose = require('mongoose');
const { ADJUSTMENT_REASONS } = require('../utils/constants');

// Design note: kept as its own collection (rather than just another stockMovements row)
// because an adjustment carries extra domain fields - reasonCode, an approving admin, a
// signed delta - that don't apply to ordinary in/out/transfer movements. Every adjustment
// still ALSO writes a corresponding entry into stockMovements so the movement history log
// stays complete and queryable from one place.
const stockAdjustmentSchema = new mongoose.Schema(
  {
    warehouseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse', required: true },
    itemId: { type: mongoose.Schema.Types.ObjectId, ref: 'Item', required: true },
    // Signed delta: positive = stock found/added, negative = stock removed/written off.
    quantityDelta: { type: Number, required: true },
    reasonCode: {
      type: String,
      enum: Object.values(ADJUSTMENT_REASONS),
      required: true,
    },
    notes: { type: String, trim: true, default: '' },
    adjustedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

stockAdjustmentSchema.index({ warehouseId: 1, itemId: 1 });

// A delta of exactly zero is not a valid adjustment.
stockAdjustmentSchema.pre('validate', function (next) {
  if (this.quantityDelta === 0) {
    return next(new Error('Adjustment quantityDelta cannot be zero.'));
  }
  next();
});

module.exports = mongoose.model('StockAdjustment', stockAdjustmentSchema);