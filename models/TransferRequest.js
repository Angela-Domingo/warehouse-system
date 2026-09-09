const mongoose = require('mongoose');
const { TRANSFER_STATUS } = require('../utils/constants');

// Design note: fromWarehouseId/toWarehouseId/itemId are references, not embedded, because
// a transfer request is small and short-lived while warehouses/items are large and shared -
// embedding a full item or warehouse document here would duplicate data that changes
// independently of the transfer's own lifecycle.
const transferRequestSchema = new mongoose.Schema(
  {
    fromWarehouseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse', required: true },
    toWarehouseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse', required: true },
    itemId: { type: mongoose.Schema.Types.ObjectId, ref: 'Item', required: true },
    quantity: {
      type: Number,
      required: true,
      min: [0.0001, 'Transfer quantity must be greater than zero'],
    },
    status: {
      type: String,
      enum: Object.values(TRANSFER_STATUS),
      default: TRANSFER_STATUS.PENDING,
    },
    requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    decidedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    decidedAt: { type: Date, default: null },
    remarks: { type: String, trim: true, default: '' },
  },
  { timestamps: true }
);

transferRequestSchema.index({ status: 1 });
transferRequestSchema.index({ fromWarehouseId: 1 });
transferRequestSchema.index({ toWarehouseId: 1 });

// Business rule guard at the schema level: source and destination can't be the same warehouse.
transferRequestSchema.pre('validate', function (next) {
  if (this.fromWarehouseId && this.toWarehouseId && this.fromWarehouseId.equals(this.toWarehouseId)) {
    return next(new Error('Source and destination warehouse cannot be the same.'));
  }
  next();
});

module.exports = mongoose.model('TransferRequest', transferRequestSchema);
