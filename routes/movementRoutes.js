const express = require('express');
const router = express.Router();

const { getMovements } = require('../controllers/movementController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/', getMovements);

module.exports = router;