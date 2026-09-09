const express = require('express');
const router = express.Router();

const {
  getValuationReport,
  getFastMovingReport,
  getWarehouseWiseReport,
} = require('../controllers/reportController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const { ROLES } = require('../utils/constants');

router.use(protect, authorize(ROLES.MANAGER, ROLES.ADMIN));

router.get('/valuation', getValuationReport);
router.get('/fast-moving', getFastMovingReport);
router.get('/warehouse-wise', getWarehouseWiseReport);

module.exports = router;
