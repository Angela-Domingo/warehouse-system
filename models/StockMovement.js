const mongoose = require('mongoose');
const { MOVEMENT_TYPES } = require('../utils/constants');

// Design note: this is an append-only audit log (module 11 - Movement History Log). Every
// stock-in, stock-out, transfer leg, and adjustment writes exactly one document here and it
// is never edited afterward - if a correction is needed, a new compensating movement is
// recorded instead. "reference" stores batch numbers, transfer IDs, or adjustment IDs so the
// full chain of an event can be reconstructed without joining back through every collection.
const stockMovementSchema = new mongoose.Schema(
  {
    warehouseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse', required: true },
    itemId: { type: mongoose.Schema.Types.ObjectId, ref: 'Item', required: true },
    type: {
      type: String,
      enum: Object.values(MOVEMENT_TYPES),
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: [0.0001, 'Movement quantity must be greater than zero'],
    },
    balanceAfter: { type: Number, required: true },
    reference: { type: String, trim: true, default: '' },
    reasonCode: { type: String, trim: true, default: '' },
    notes: { type: String, trim: true, default: '' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

stockMovementSchema.index({ warehouseId: 1, itemId: 1, createdAt: -1 });

module.exports = mongoose.model('StockMovement', stockMovementSchema);