const express = require('express');
const { optionalAuth } = require('../middleware/auth');
const controller = require('../controllers/payment.controller');
const router = express.Router();

router.post('/charge', optionalAuth, controller.createCharge);
router.get('/:orderId', optionalAuth, controller.getPaymentByOrder);

module.exports = router;