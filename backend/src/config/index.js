require('dotenv').config({ path: require('path').resolve(__dirname, '../../../.env') });
require('dotenv').config(); // Also check local backend/.env if present

module.exports = {
  env: process.env.NODE_ENV || 'development',
  isProduction: process.env.NODE_ENV === 'production',
  port: parseInt(process.env.PORT, 10) || 5000,
  databaseUrl: process.env.DATABASE_URL,
  jwt: {
    secret: process.env.JWT_SECRET || 'dev_shopsphere_super_secure_jwt_secret_key_32_chars_min',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    cookieName: 'shopsphere_token',
  },
  cookieSecret: process.env.COOKIE_SECRET || 'dev_shopsphere_cookie_secret_key_32_chars',
  cors: {
    customerOrigin: process.env.CUSTOMER_ORIGIN || 'http://localhost:5173',
    adminOrigin: process.env.ADMIN_ORIGIN || 'http://localhost:5174',
    apiOrigin: process.env.API_ORIGIN || 'http://localhost:5000',
  },
  payment: {
    provider: process.env.PAYMENT_PROVIDER || 'MOCK',
    secret: process.env.PAYMENT_SECRET || 'mock_payment_secret',
  },
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 15 * 60 * 1000,
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS, 10) || 100,
    authMax: parseInt(process.env.AUTH_RATE_LIMIT_MAX, 10) || 20,
  },
};
