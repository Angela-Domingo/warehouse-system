const StockAdjustment = require('../models/StockAdjustment');
const Warehouse = require('../models/Warehouse');
const Item = require('../models/Item');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { increaseStock, decreaseStock } = require('../utils/stockService');
const { MOVEMENT_TYPES } = require('../utils/constants');

async function assertWarehouseAndItemExist(warehouseId, itemId) {
  const [warehouse, item] = await Promise.all([
    Warehouse.findById(warehouseId),
    Item.findById(itemId),
  ]);

  if (!warehouse || !warehouse.isActive) {
    throw ApiError.badRequest('warehouseId does not refer to an active warehouse.');
  }

  if (!item || !item.isActive) {
    throw ApiError.badRequest('itemId does not refer to an active item.');
  }
}

// POST /api/adjustments
const createAdjustment = asyncHandler(async (req, res) => {
  const { warehouseId, itemId, quantityDelta, reasonCode, notes } = req.body;

  await assertWarehouseAndItemExist(warehouseId, itemId);

  let result;

  if (quantityDelta > 0) {
    result = await increaseStock({
      warehouseId,
      itemId,
      quantity: quantityDelta,
      type: MOVEMENT_TYPES.ADJUSTMENT,
      reasonCode,
      notes,
      createdBy: req.user._id,
    });
  } else {
    result = await decreaseStock({
      warehouseId,
      itemId,
      quantity: Math.abs(quantityDelta),
      type: MOVEMENT_TYPES.ADJUSTMENT,
      reasonCode,
      notes,
      createdBy: req.user._id,
    });
  }

  const adjustment = await StockAdjustment.create({
    warehouseId,
    itemId,
    quantityDelta,
    reasonCode,
    notes: notes || '',
    adjustedBy: req.user._id,
  });

  res.status(201).json({
    success: true,
    message: 'Stock adjustment recorded successfully',
    data: {
      adjustment,
      movement: result.movement,
      currentBalance: result.balance.quantity,
    },
  });
});

module.exports = { createAdjustment };
