const express = require('express');
const router = express.Router();

const { getBalances } = require('../controllers/balanceController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/', getBalances);

module.exports = router;