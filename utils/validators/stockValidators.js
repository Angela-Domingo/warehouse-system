const { body } = require('express-validator');

const stockInValidator = [
  body('warehouseId')
    .isMongoId()
    .withMessage('warehouseId must be a valid id'),

  body('itemId')
    .isMongoId()
    .withMessage('itemId must be a valid id'),

  body('quantity')
    .isFloat({ gt: 0 })
    .withMessage('quantity must be greater than zero'),

  body('batchNumber')
    .optional()
    .trim(),

  body('notes')
    .optional()
    .trim(),
];

const stockOutValidator = [
  body('warehouseId')
    .isMongoId()
    .withMessage('warehouseId must be a valid id'),

  body('itemId')
    .isMongoId()
    .withMessage('itemId must be a valid id'),

  body('quantity')
    .isFloat({ gt: 0 })
    .withMessage('quantity must be greater than zero'),

  body('reference')
    .optional()
    .trim(),

  body('notes')
    .optional()
    .trim(),
];

module.exports = {
  stockInValidator,
  stockOutValidator,
};