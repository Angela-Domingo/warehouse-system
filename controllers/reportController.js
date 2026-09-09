const StockBalance = require('../models/StockBalance');
const StockMovement = require('../models/StockMovement');
const asyncHandler = require('../utils/asyncHandler');
const { MOVEMENT_TYPES } = require('../utils/constants');

// GET /api/admin/reports/valuation
// Stock valuation = sum(balance.quantity * item.unitPrice) grouped overall and per warehouse.
const getValuationReport = asyncHandler(async (req, res) => {
  const perWarehouse = await StockBalance.aggregate([
    {
      $lookup: { from: 'items', localField: 'itemId', foreignField: '_id', as: 'item' },
    },
    { $unwind: '$item' },
    {
      $lookup: {
        from: 'warehouses',
        localField: 'warehouseId',
        foreignField: '_id',
        as: 'warehouse',
      },
    },
    { $unwind: '$warehouse' },
    {
      $project: {
        warehouseId: 1,
        warehouseName: '$warehouse.name',
        lineValue: { $multiply: ['$quantity', '$item.unitPrice'] },
      },
    },
    {
      $group: {
        _id: '$warehouseId',
        warehouseName: { $first: '$warehouseName' },
        totalValue: { $sum: '$lineValue' },
      },
    },
    { $sort: { totalValue: -1 } },
  ]);

  const grandTotal = perWarehouse.reduce((sum, w) => sum + w.totalValue, 0);

  res.status(200).json({
    success: true,
    message: 'Stock valuation report generated successfully',
    data: { grandTotal, perWarehouse },
  });
});

// GET /api/admin/reports/fast-moving?days=30&limit=10
// "Fast-moving" = items with the highest total OUT quantity in the trailing window.
const getFastMovingReport = asyncHandler(async (req, res) => {
  const days = parseInt(req.query.days, 10) || 30;
  const limit = Math.min(parseInt(req.query.limit, 10) || 10, 50);
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const fastMoving = await StockMovement.aggregate([
    { $match: { type: MOVEMENT_TYPES.OUT, createdAt: { $gte: since } } },
    { $group: { _id: '$itemId', totalOut: { $sum: '$quantity' }, movementCount: { $sum: 1 } } },
    { $sort: { totalOut: -1 } },
    { $limit: limit },
    { $lookup: { from: 'items', localField: '_id', foreignField: '_id', as: 'item' } },
    { $unwind: '$item' },
    {
      $project: {
        _id: 0,
        itemId: '$item._id',
        sku: '$item.sku',
        name: '$item.name',
        totalOut: 1,
        movementCount: 1,
      },
    },
  ]);

  res.status(200).json({
    success: true,
    message: 'Fast-moving items report generated successfully',
    data: { windowDays: days, items: fastMoving },
  });
});

// GET /api/admin/reports/warehouse-wise
// Item count + total quantity on hand, grouped per warehouse.
const getWarehouseWiseReport = asyncHandler(async (req, res) => {
  const report = await StockBalance.aggregate([
    {
      $group: {
        _id: '$warehouseId',
        distinctItemCount: { $sum: 1 },
        totalQuantity: { $sum: '$quantity' },
      },
    },
    {
      $lookup: { from: 'warehouses', localField: '_id', foreignField: '_id', as: 'warehouse' },
    },
    { $unwind: '$warehouse' },
    {
      $project: {
        _id: 0,
        warehouseId: '$warehouse._id',
        warehouseName: '$warehouse.name',
        location: '$warehouse.location',
        distinctItemCount: 1,
        totalQuantity: 1,
      },
    },
    { $sort: { warehouseName: 1 } },
  ]);

  res.status(200).json({
    success: true,
    message: 'Warehouse-wise report generated successfully',
    data: report,
  });
});

module.exports = { getValuationReport, getFastMovingReport, getWarehouseWiseReport };
