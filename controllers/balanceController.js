const StockBalance = require('../models/StockBalance');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');

// GET /api/balance/:warehouseId/:itemId
const getBalance = asyncHandler(async (req, res) => {
  const { warehouseId, itemId } = req.params;

  const balance = await StockBalance.findOne({
    warehouseId,
    itemId,
  });

  res.json({
    success: true,
    data: {
      warehouseId,
      itemId,
      quantity: balance ? balance.quantity : 0,
    },
  });
});

// GET /api/balance/:warehouseId
const getWarehouseBalances = asyncHandler(async (req, res) => {
  const { warehouseId } = req.params;

  const balances = await StockBalance.find({ warehouseId })
    .populate('itemId', 'name sku')
    .sort({ updatedAt: -1 });

  res.json({
    success: true,
    data: balances,
  });
});

module.exports = {
  getBalance,
  getWarehouseBalances,
};