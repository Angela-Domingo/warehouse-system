const express = require('express');
const router = express.Router();

const {
  createAdjustment,
  getAdjustments,
} = require('../controllers/adjustmentController');

const {
  createAdjustmentValidator,
} = require('../utils/validators/adjustmentValidators');

const validate = require('../middleware/validate');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const { ROLES } = require('../utils/constants');

router.use(protect);

router.get('/', getAdjustments);

router.post(
  '/',
  authorize(ROLES.MANAGER, ROLES.ADMIN),
  createAdjustmentValidator,
  validate,
  createAdjustment
);

module.exports = router;