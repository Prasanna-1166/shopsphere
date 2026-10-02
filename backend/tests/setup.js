process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test_secret_key_32_chars_minimum_shopsphere';
process.env.COOKIE_SECRET = 'test_cookie_secret_key_32_chars';
process.env.PAYMENT_PROVIDER = 'MOCK';

// Global test timeouts
jest.setTimeout(30000);
