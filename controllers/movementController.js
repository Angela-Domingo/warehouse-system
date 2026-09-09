const StockMovement = require('../models/StockMovement');
const asyncHandler = require('../utils/asyncHandler');

// GET /api/movements?warehouseId=&itemId=&type=&from=&to=&page=&limit=
// Movement History Log
const getMovements = asyncHandler(async (req, res) => {
  const { warehouseId, itemId, type, from, to, page = 1, limit = 50 } = req.query;

  const filter = {};

  if (warehouseId) filter.warehouseId = warehouseId;
  if (itemId) filter.itemId = itemId;
  if (type) filter.type = type;

  if (from || to) {
    filter.createdAt = {};

    if (from) filter.createdAt.$gte = new Date(from);
    if (to) filter.createdAt.$lte = new Date(to);
  }

  const pageNum = Math.max(parseInt(page, 10) || 1, 1);
  const limitNum = Math.min(Math.max(parseInt(limit, 10) || 50, 1), 200);

  const [movements, total] = await Promise.all([
    StockMovement.find(filter)
      .populate('warehouseId', 'name')
      .populate('itemId', 'sku name unit')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum),

    StockMovement.countDocuments(filter),
  ]);

  res.status(200).json({
    success: true,
    message: 'Movement history fetched successfully',
    data: movements,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum),
    },
  });
});

module.exports = { getMovements };