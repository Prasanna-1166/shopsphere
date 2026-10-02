const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimiter');

router.post('/register', authLimiter, authController.register);
router.post('/login', authLimiter, authController.login);
router.post('/admin-login', authLimiter, authController.adminLogin);
router.post('/logout', authController.logout);
router.get('/me', authenticate, authController.getMe);
router.get('/csrf-token', authController.getCsrfToken);

module.exports = router;
