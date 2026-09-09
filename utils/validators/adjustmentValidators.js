const { body } = require('express-validator');
const { ADJUSTMENT_REASONS } = require('../constants');

const createAdjustmentValidator = [
  body('warehouseId')
    .isMongoId()
    .withMessage('warehouseId must be a valid id'),

  body('itemId')
    .isMongoId()
    .withMessage('itemId must be a valid id'),

  body('quantityDelta')
    .isFloat()
    .withMessage('quantityDelta must be a number')
    .custom((value) => value !== 0)
    .withMessage('quantityDelta cannot be zero'),

  body('reasonCode')
    .isIn(Object.values(ADJUSTMENT_REASONS))
    .withMessage(
      `reasonCode must be one of: ${Object.values(ADJUSTMENT_REASONS).join(', ')}`
    ),

  body('notes')
    .optional()
    .trim(),
];

module.exports = {
  createAdjustmentValidator,
};