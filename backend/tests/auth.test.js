const request = require('supertest');
const app = require('../src/app');
const prisma = require('../src/config/prisma');

describe('ShopSphere — Authentication & RBAC Tests', () => {
  const testEmail = `test_customer_${Date.now()}@example.com`;
  const testPassword = 'Password@123';
  let customerToken = null;

  afterAll(async () => {
    // Cleanup created test customer
    try {
      const user = await prisma.user.findUnique({ where: { email: testEmail } });
      if (user) {
        await prisma.cartItem.deleteMany({ where: { cart: { userId: user.id } } });
        await prisma.cart.deleteMany({ where: { userId: user.id } });
        await prisma.user.delete({ where: { id: user.id } });
      }
    } catch (e) {}
    await prisma.$disconnect();
  });

  test('POST /api/auth/register - Successfully registers customer with default CUSTOMER role', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Test Customer Runner',
        email: testEmail,
        password: testPassword,
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.email).toBe(testEmail);
    expect(res.body.data.user.role).toBe('CUSTOMER');
    expect(res.body.data.token).toBeDefined();

    customerToken = res.body.data.token;
  });

  test('POST /api/auth/register - Rejects duplicate email registration', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Duplicate Test',
        email: testEmail,
        password: testPassword,
      });

    expect(res.statusCode).toBe(409);
    expect(res.body.success).toBe(false);
  });

  test('POST /api/auth/login - Successfully logs in with valid customer credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: testEmail,
        password: testPassword,
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.email).toBe(testEmail);
    expect(res.headers['set-cookie']).toBeDefined();
  });

  test('POST /api/auth/login - Rejects invalid password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: testEmail,
        password: 'WrongPassword!456',
      });

    expect(res.statusCode).toBe(401);
    expect(res.body.success).toBe(false);
  });

  test('POST /api/auth/admin-login - Denies ordinary customer access to admin login endpoint', async () => {
    const res = await request(app)
      .post('/api/auth/admin-login')
      .send({
        email: testEmail,
        password: testPassword,
      });

    expect(res.statusCode).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('do not possess administrative privileges');
  });

  test('GET /api/auth/me - Returns authenticated user details with token', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${customerToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.email).toBe(testEmail);
  });

  test('GET /api/auth/me - Rejects unauthenticated request without token/cookie', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.statusCode).toBe(401);
    expect(res.body.success).toBe(false);
  });
});
