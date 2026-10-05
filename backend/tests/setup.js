const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
require('dotenv').config();

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_secret_key_32_chars_minimum_shopsphere';
process.env.COOKIE_SECRET = process.env.COOKIE_SECRET || 'test_cookie_secret_key_32_chars';
process.env.PAYMENT_PROVIDER = 'MOCK';

// Global test timeouts (30 seconds for cloud DB calls)
jest.setTimeout(30000);
