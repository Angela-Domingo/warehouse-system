const express = require('express');
const {
  createWarehouse,
  getWarehouses,
  getWarehouseById,
  updateWarehouse,
  deleteWarehouse,
} = require('../controllers/warehouseController');

const { protect, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');
const {
  createWarehouseValidator,
  updateWarehouseValidator,
} = require('../utils/validators/warehouseValidators');

const router = express.Router();

router.use(protect);

router
  .route('/')
  .get(getWarehouses)
  .post(
    authorize('admin'),
    validate(createWarehouseValidator),
    createWarehouse
  );

router
  .route('/:id')
  .get(getWarehouseById)
  .put(
    authorize('admin'),
    validate(updateWarehouseValidator),
    updateWarehouse
  )
  .delete(authorize('admin'), deleteWarehouse);

module.exports = router;