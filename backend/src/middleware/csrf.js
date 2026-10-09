const crypto = require('crypto');
const config = require('../config');
const { sendError } = require('../utils/response');

const CSRF_COOKIE_NAME = 'shopsphere_csrf';

/**
 * Generates and sets a double-submit CSRF cookie if not present
 */
const setCsrfCookie = (req, res, next) => {
  if (!req.cookies || !req.cookies[CSRF_COOKIE_NAME]) {
    const csrfToken = crypto.randomBytes(24).toString('hex');
    res.cookie(CSRF_COOKIE_NAME, csrfToken, {
      httpOnly: false, // Must be readable by client JS to include in request headers
      secure: config.isProduction,
      sameSite: config.isProduction ? 'none' : 'lax',
      path: '/',
    });
  }
  next();
};

/**
 * Verifies CSRF token for mutating HTTP requests when session cookie auth is used
 */
const verifyCsrfToken = (req, res, next) => {
  // 1. Safe read-only methods do not require CSRF validation
  const safeMethods = ['GET', 'HEAD', 'OPTIONS'];
  if (safeMethods.includes(req.method)) {
    return next();
  }

  // 2. Public auth and webhook endpoints do not require CSRF
  const publicPaths = [
    '/api/auth/register',
    '/api/auth/login',
    '/api/auth/admin-login',
    '/api/auth/logout',
    '/api/payments/webhook',
    '/api/webhooks/razorpay',
  ];
  if (publicPaths.some((p) => req.originalUrl.startsWith(p))) {
    return next();
  }

  // 3. If client authenticates with Authorization Bearer header, CSRF is not required
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    return next();
  }

  // 4. If no auth cookie is attached (e.g. unauthenticated requests), skip
  if (!req.cookies || !req.cookies[config.jwt.cookieName]) {
    return next();
  }

  // 5. If origin is present, CORS middleware already validates allowed origins.
  // Double-submit token check applies when x-csrf-token is provided.
  const cookieCsrfToken = req.cookies[CSRF_COOKIE_NAME];
  const headerCsrfToken = req.headers['x-csrf-token'] || req.headers['x-xsrf-token'];

  if (headerCsrfToken && cookieCsrfToken && cookieCsrfToken !== headerCsrfToken) {
    return sendError(res, 'CSRF validation failed. Invalid CSRF token.', [], 403);
  }

  next();
};

module.exports = {
  CSRF_COOKIE_NAME,
  setCsrfCookie,
  verifyCsrfToken,
};
