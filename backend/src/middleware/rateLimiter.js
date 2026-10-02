const rateLimit = require('express-rate-limit');
const config = require('../config');
const { sendError } = require('../utils/response');

/**
 * Standard API rate limiter
 */
const apiLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    return sendError(res, 'Too many requests. Please slow down and try again later.', [], 429);
  },
  skip: (req) => config.env === 'test',
});

/**
 * Strict rate limiter for authentication endpoints
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: config.rateLimit.authMax,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    return sendError(res, 'Too many login attempts. Please try again after 15 minutes.', [], 429);
  },
  skip: (req) => config.env === 'test',
});

/**
 * Checkout & Payment rate limiter
 */
const checkoutLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    return sendError(res, 'Too many checkout attempts. Please try again in a few minutes.', [], 429);
  },
  skip: (req) => config.env === 'test',
});

module.exports = {
  apiLimiter,
  authLimiter,
  checkoutLimiter,
};
