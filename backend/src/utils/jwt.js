const jwt = require('jsonwebtoken');
const config = require('../config');

/**
 * Sign JWT token with minimal claims
 */
const signToken = (payload) => {
  return jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn,
  });
};

/**
 * Verify JWT token
 */
const verifyToken = (token) => {
  return jwt.verify(token, config.jwt.secret);
};

/**
 * Attach HTTP-only cookie to response
 */
const attachAuthCookie = (res, token) => {
  const cookieOptions = {
    httpOnly: true,
    secure: config.isProduction,
    sameSite: config.isProduction ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: '/',
  };
  res.cookie(config.jwt.cookieName, token, cookieOptions);
};

/**
 * Clear auth cookie from response
 */
const clearAuthCookie = (res) => {
  res.clearCookie(config.jwt.cookieName, {
    httpOnly: true,
    secure: config.isProduction,
    sameSite: config.isProduction ? 'none' : 'lax',
    path: '/',
  });
};

module.exports = {
  signToken,
  verifyToken,
  attachAuthCookie,
  clearAuthCookie,
};
