const Item = require('../models/Item');
const Warehouse = require('../models/Warehouse');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { increaseStock, decreaseStock } = require('../utils/stockService');
const { MOVEMENT_TYPES, ROLES } = require('../utils/constants');

// Shared guard: staff tied to a specific warehouse may only record movements for their own
// warehouse; managers/admins may act on any warehouse. Prevents a staff member from one
// warehouse silently inflating another warehouse's stock.
function assertWarehouseAccess(user, warehouseId) {
  if (user.role === ROLES.STAFF && user.warehouseId && String(user.warehouseId) !== String(warehouseId)) {
    throw ApiError.forbidden('Staff can only record movements for their own assigned warehouse.');
  }
}

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

// POST /api/stock/in  (Module 4 - Stock-In Recording)
const stockIn = asyncHandler(async (req, res) => {
  const { warehouseId, itemId, quantity, batchNumber, notes } = req.body;

  assertWarehouseAccess(req.user, warehouseId);
  await assertWarehouseAndItemExist(warehouseId, itemId);

  const { balance, movement } = await increaseStock({
    warehouseId,
    itemId,
    quantity,
    type: MOVEMENT_TYPES.IN,
    reference: batchNumber || '',
    notes,
    createdBy: req.user._id,
  });

  res.status(201).json({
    success: true,
    message: 'Record created successfully',
    data: { movement, currentBalance: balance.quantity },
  });
});

// POST /api/stock/out  (Module 5 - Stock-Out Recording)
const stockOut = asyncHandler(async (req, res) => {
  const { warehouseId, itemId, quantity, reference, notes } = req.body;

  assertWarehouseAccess(req.user, warehouseId);
  await assertWarehouseAndItemExist(warehouseId, itemId);

  const { balance, movement } = await decreaseStock({
    warehouseId,
    itemId,
    quantity,
    type: MOVEMENT_TYPES.OUT,
    reference: reference || '',
    notes,
    createdBy: req.user._id,
  });

  res.status(201).json({
    success: true,
    message: 'Record created successfully',
    data: { movement, currentBalance: balance.quantity },
  });
});

module.exports = { stockIn, stockOut };