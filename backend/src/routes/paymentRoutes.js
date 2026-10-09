const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { authenticate } = require('../middleware/auth');
const { checkoutLimiter } = require('../middleware/rateLimiter');

// 1. Public Payment Config & Webhooks
router.get('/config', paymentController.getPaymentConfig);
router.post('/webhook', paymentController.handleWebhook);

// 2. Authenticated Customer Checkout & Verification Endpoints
router.use(authenticate);

router.post('/create-intent', checkoutLimiter, paymentController.createPaymentIntent);
router.post('/verify', checkoutLimiter, paymentController.verifyPayment);

module.exports = router;
