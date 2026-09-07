const { body } = require('express-validator');

const createItemValidator = [
  body('sku').trim().notEmpty().withMessage('sku is required'),
  body('name').trim().notEmpty().withMessage('name is required'),
  body('category').trim().notEmpty().withMessage('category is required'),
  body('unit').trim().notEmpty().withMessage('unit is required'),
  body('unitPrice')
    .isFloat({ min: 0 })
    .withMessage('unitPrice must be a non-negative number'),
  body('reorderPoint')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('reorderPoint must be a non-negative number'),
];

const updateItemValidator = [
  body('name')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('name cannot be empty'),
  body('category')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('category cannot be empty'),
  body('unit')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('unit cannot be empty'),
  body('unitPrice')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('unitPrice must be a non-negative number'),
  body('reorderPoint')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('reorderPoint must be a non-negative number'),
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean'),
];

module.exports = { createItemValidator, updateItemValidator };