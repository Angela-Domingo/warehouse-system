const Warehouse = require('../models/Warehouse');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');

// POST /api/warehouses (admin only)
const createWarehouse = asyncHandler(async (req, res) => {
  const { name, location, capacity } = req.body;

  const warehouse = await Warehouse.create({ name, location, capacity });

  res.status(201).json({
    success: true,
    message: 'Record created successfully',
    data: warehouse,
  });
});

// GET /api/warehouses (any authenticated role)
const getWarehouses = asyncHandler(async (req, res) => {
  const warehouses = await Warehouse.find().sort({ name: 1 });
  res.status(200).json({
    success: true,
    message: 'Warehouses fetched successfully',
    data: warehouses,
  });
});

// GET /api/warehouses/:id
const getWarehouseById = asyncHandler(async (req, res) => {
  const warehouse = await Warehouse.findById(req.params.id);
  if (!warehouse) {
    throw ApiError.notFound('Warehouse not found.');
  }
  res.status(200).json({
    success: true,
    message: 'Warehouse fetched successfully',
    data: warehouse,
  });
});

// PUT /api/warehouses/:id (admin only)
const updateWarehouse = asyncHandler(async (req, res) => {
  const { name, location, capacity, isActive } = req.body;

  const warehouse = await Warehouse.findById(req.params.id);
  if (!warehouse) {
    throw ApiError.notFound('Warehouse not found.');
  }

  if (name !== undefined) warehouse.name = name;
  if (location !== undefined) warehouse.location = location;
  if (capacity !== undefined) warehouse.capacity = capacity;
  if (isActive !== undefined) warehouse.isActive = isActive;

  await warehouse.save();

  res.status(200).json({
    success: true,
    message: 'Status updated successfully',
    data: warehouse,
  });
});

// DELETE /api/warehouses/:id (admin only) - soft delete to preserve history integrity
const deleteWarehouse = asyncHandler(async (req, res) => {
  const warehouse = await Warehouse.findById(req.params.id);
  if (!warehouse) {
    throw ApiError.notFound('Warehouse not found.');
  }

  warehouse.isActive = false;
  await warehouse.save();

  res.status(200).json({
    success: true,
    message: 'Warehouse deactivated successfully',
    data: warehouse,
  });
});

module.exports = {
  createWarehouse,
  getWarehouses,
  getWarehouseById,
  updateWarehouse,
  deleteWarehouse,
};