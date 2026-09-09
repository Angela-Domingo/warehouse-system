const express = require('express');
const router = express.Router();

const {
  createTransferRequest,
  getTransferRequests,
  getTransferRequestById,
  decideTransferRequest,
} = require('../controllers/transferController');
const {
  createTransferValidator,
  decisionValidator,
} = require('../utils/validators/transferValidators');
const validate = require('../middleware/validate');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const { ROLES } = require('../utils/constants');

router.use(protect);

router.get('/', getTransferRequests);
router.get('/:id', getTransferRequestById);
router.post(
  '/',
  authorize(ROLES.STAFF, ROLES.MANAGER, ROLES.ADMIN),
  createTransferValidator,
  validate,
  createTransferRequest
);
router.put(
  '/:id/decision',
  authorize(ROLES.MANAGER, ROLES.ADMIN),
  decisionValidator,
  validate,
  decideTransferRequest
);

module.exports = router;
