const mongoose = require('mongoose');

// Design note: this collection holds ONE document per (warehouseId, itemId) pair - the
// current running balance. It is kept separate from stockMovements (the append-only log)
// because balances are read constantly (every stock-out, transfer, low-stock check) and
// updated in place, while movements are written once and never modified. Mixing the two
// would mean recalculating a SUM over the entire movement history on every read, which
// does not scale. References (not embedding) are used for warehouseId/itemId since both
// are large, independently-updated documents shared across many stockBalance records.
const stockBalanceSchema = new mongoose.Schema(
  {
    warehouseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse', required: true },
    itemId: { type: mongoose.Schema.Types.ObjectId, ref: 'Item', required: true },
    quantity: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Stock balance cannot go negative'],
    },
  },
  { timestamps: true }
);

// A given item can only have ONE balance document per warehouse.
stockBalanceSchema.index({ warehouseId: 1, itemId: 1 }, { unique: true });

module.exports = mongoose.model('StockBalance', stockBalanceSchema);