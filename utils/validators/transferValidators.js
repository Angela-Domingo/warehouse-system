const { body } = require('express-validator');
const { TRANSFER_STATUS } = require('../constants');

const createTransferValidator = [
  body('fromWarehouseId').isMongoId().withMessage('fromWarehouseId must be a valid id'),
  body('toWarehouseId').isMongoId().withMessage('toWarehouseId must be a valid id'),
  body('itemId').isMongoId().withMessage('itemId must be a valid id'),
  body('quantity').isFloat({ gt: 0 }).withMessage('quantity must be greater than zero'),
];

const decisionValidator = [
  body('status')
    .isIn([TRANSFER_STATUS.APPROVED, TRANSFER_STATUS.REJECTED])
    .withMessage("status must be 'approved' or 'rejected'"),
  body('remarks').optional().trim(),
];

module.exports = { createTransferValidator, decisionValidator };
