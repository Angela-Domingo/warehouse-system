const express = require('express');
const router = express.Router();

const { stockIn, stockOut } = require('../controllers/stockController');
const {
  stockInValidator,
  stockOutValidator,
} = require('../utils/validators/stockValidators');
const validate = require('../middleware/validate');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const { ROLES } = require('../utils/constants');

router.use(protect);

router.post(
  '/in',
  authorize(ROLES.STAFF, ROLES.MANAGER, ROLES.ADMIN),
  stockInValidator,
  validate,
  stockIn
);

router.post(
  '/out',
  authorize(ROLES.STAFF, ROLES.MANAGER, ROLES.ADMIN),
  stockOutValidator,
  validate,
  stockOut
);

module.exports = router;