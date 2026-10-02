const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { authenticate } = require('../middleware/auth');
const { checkoutLimiter } = require('../middleware/rateLimiter');

router.use(authenticate);

router.post('/create-intent', checkoutLimiter, paymentController.createPaymentIntent);
router.post('/verify', checkoutLimiter, paymentController.verifyPayment);

module.exports = router;
