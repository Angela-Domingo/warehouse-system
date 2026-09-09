const StockBalance = require('../models/StockBalance');
const StockMovement = require('../models/StockMovement');
const ApiError = require('./ApiError');

/**
 * Increases the balance for (warehouseId, itemId) by `quantity`, creating the balance
 * document on first use (upsert), and writes a matching stockMovements audit row.
 * Used by: Stock-In, Transfer approval (destination leg), positive Adjustments.
 */
async function increaseStock({ warehouseId, itemId, quantity, type, reference, reasonCode, notes, createdBy }) {
  if (quantity <= 0) {
    throw ApiError.badRequest('Quantity must be greater than zero.');
  }

  const balance = await StockBalance.findOneAndUpdate(
    { warehouseId, itemId },
    { $inc: { quantity } },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );

  const movement = await StockMovement.create({
    warehouseId,
    itemId,
    type,
    quantity,
    balanceAfter: balance.quantity,
    reference: reference || '',
    reasonCode: reasonCode || '',
    notes: notes || '',
    createdBy,
  });

  return { balance, movement };
}

/**
 * Decreases the balance for (warehouseId, itemId) by `quantity`. Uses an atomic
 * conditional update (quantity >= requested amount) so two concurrent stock-outs can never
 * push the balance negative, and throws a 409 conflict if there isn't enough stock.
 * Used by: Stock-Out, Transfer approval (source leg), negative Adjustments.
 */
async function decreaseStock({ warehouseId, itemId, quantity, type, reference, reasonCode, notes, createdBy }) {
  if (quantity <= 0) {
    throw ApiError.badRequest('Quantity must be greater than zero.');
  }

  const balance = await StockBalance.findOneAndUpdate(
    { warehouseId, itemId, quantity: { $gte: quantity } },
    { $inc: { quantity: -quantity } },
    { new: true }
  );

  if (!balance) {
    throw ApiError.conflict(
      'Insufficient stock for this operation. Check current balance before retrying.',
      'INSUFFICIENT_STOCK'
    );
  }

  const movement = await StockMovement.create({
    warehouseId,
    itemId,
    type,
    quantity,
    balanceAfter: balance.quantity,
    reference: reference || '',
    reasonCode: reasonCode || '',
    notes: notes || '',
    createdBy,
  });

  return { balance, movement };
}

module.exports = { increaseStock, decreaseStock };