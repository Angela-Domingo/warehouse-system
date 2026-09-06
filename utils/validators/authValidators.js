const { body } = require('express-validator');
const { ROLES } = require('../constants');

const registerValidator = [
  body('name').trim().notEmpty().withMessage('name is required'),
  body('email').isEmail().withMessage('a valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('password must be at least 6 characters'),
  body('role').optional().isIn(Object.values(ROLES)).withMessage('invalid role'),
  body('warehouseId').optional().isMongoId().withMessage('warehouseId must be a valid id'),
];

const loginValidator = [
  body('email').isEmail().withMessage('a valid email is required'),
  body('password').notEmpty().withMessage('password is required'),
];

module.exports = { registerValidator, loginValidator };
