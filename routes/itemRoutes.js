const express = require('express');
const router = express.Router();

const {
  createItem,
  getItems,
  getItemById,
  updateItem,
  deleteItem,
} = require('../controllers/itemController');
const { getLowStockItems } = require('../controllers/balanceController');
const { createItemValidator, updateItemValidator } = require('../utils/validators/itemValidators');
const validate = require('../middleware/validate');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const { ROLES } = require('../utils/constants');

router.use(protect);

// IMPORTANT: '/low-stock' must be registered before '/:id' or Express will try to treat
// "low-stock" as an :id value and fail with a CastError.
router.get('/low-stock', getLowStockItems);
router.get('/', getItems);
router.get('/:id', getItemById);
router.post('/', authorize(ROLES.ADMIN), createItemValidator, validate, createItem);
router.put('/:id', authorize(ROLES.ADMIN), updateItemValidator, validate, updateItem);
router.delete('/:id', authorize(ROLES.ADMIN), deleteItem);

module.exports = router;