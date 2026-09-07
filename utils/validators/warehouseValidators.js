const { body } = require('express-validator');

const createWarehouseValidator = [
  body('name').trim().notEmpty().withMessage('name is required'),
  body('location').trim().notEmpty().withMessage('location is required'),
  body('capacity')
    .isFloat({ min: 0 })
    .withMessage('capacity must be a non-negative number'),
];

const updateWarehouseValidator = [
  body('name')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('name cannot be empty'),
  body('location')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('location cannot be empty'),
  body('capacity')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('capacity must be a non-negative number'),
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean'),
];

module.exports = { createWarehouseValidator, updateWarehouseValidator };