const Item = require('../models/Item');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');

// POST /api/items (admin only)
const createItem = asyncHandler(async (req, res) => {
  const { sku, name, category, unit, unitPrice, reorderPoint } = req.body;

  const existing = await Item.findOne({ sku: sku.toUpperCase() });
  if (existing) {
    throw ApiError.conflict(`Item with SKU '${sku}' already exists.`, 'DUPLICATE_SKU');
  }

  const item = await Item.create({ sku, name, category, unit, unitPrice, reorderPoint });

  res.status(201).json({
    success: true,
    message: 'Record created successfully',
    data: item,
  });
});

// GET /api/items?category=&search=
const getItems = asyncHandler(async (req, res) => {
  const { category, search } = req.query;
  const filter = {};

  if (category) filter.category = category;

  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { sku: { $regex: search, $options: 'i' } },
    ];
  }

  const items = await Item.find(filter).sort({ name: 1 });

  res.status(200).json({
    success: true,
    message: 'Items fetched successfully',
    data: items,
  });
});

// GET /api/items/:id
const getItemById = asyncHandler(async (req, res) => {
  const item = await Item.findById(req.params.id);

  if (!item) {
    throw ApiError.notFound('Item not found.');
  }

  res.status(200).json({
    success: true,
    message: 'Item fetched successfully',
    data: item,
  });
});

// PUT /api/items/:id (admin only)
const updateItem = asyncHandler(async (req, res) => {
  const { name, category, unit, unitPrice, reorderPoint, isActive } = req.body;

  const item = await Item.findById(req.params.id);

  if (!item) {
    throw ApiError.notFound('Item not found.');
  }

  if (name !== undefined) item.name = name;
  if (category !== undefined) item.category = category;
  if (unit !== undefined) item.unit = unit;
  if (unitPrice !== undefined) item.unitPrice = unitPrice;
  if (reorderPoint !== undefined) item.reorderPoint = reorderPoint;
  if (isActive !== undefined) item.isActive = isActive;

  await item.save();

  res.status(200).json({
    success: true,
    message: 'Status updated successfully',
    data: item,
  });
});

// DELETE /api/items/:id (admin only) - soft delete to preserve movement history integrity
const deleteItem = asyncHandler(async (req, res) => {
  const item = await Item.findById(req.params.id);

  if (!item) {
    throw ApiError.notFound('Item not found.');
  }

  item.isActive = false;
  await item.save();

  res.status(200).json({
    success: true,
    message: 'Item deactivated successfully',
    data: item,
  });
});

module.exports = {
  createItem,
  getItems,
  getItemById,
  updateItem,
  deleteItem,
};