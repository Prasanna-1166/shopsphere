const request = require('supertest');
const app = require('../src/app');
const prisma = require('../src/config/prisma');
const { signToken } = require('../src/utils/jwt');

describe('ShopSphere — Checkout Transactions & Order Lifecycle Tests', () => {
  let customerUser = null;
  let otherCustomer = null;
  let customerToken = null;
  let otherToken = null;
  let testProduct = null;
  let createdOrderId = null;
  let initialStock = 0;

  beforeAll(async () => {
    // 1. Create two test customers
    customerUser = await prisma.user.create({
      data: {
        name: 'Order Tester',
        email: `order_tester_${Date.now()}@example.com`,
        passwordHash: 'dummy_hash',
        role: 'CUSTOMER',
        status: 'ACTIVE',
        cart: { create: {} },
      },
    });

    otherCustomer = await prisma.user.create({
      data: {
        name: 'Other Customer',
        email: `other_customer_${Date.now()}@example.com`,
        passwordHash: 'dummy_hash',
        role: 'CUSTOMER',
        status: 'ACTIVE',
        cart: { create: {} },
      },
    });

    customerToken = signToken({ id: customerUser.id, email: customerUser.email, role: customerUser.role });
    otherToken = signToken({ id: otherCustomer.id, email: otherCustomer.email, role: otherCustomer.role });

    // 2. Find product
    testProduct = await prisma.product.findFirst({
      where: { active: true, stockQuantity: { gt: 10 } },
    });
    initialStock = testProduct.stockQuantity;
  });

  afterAll(async () => {
    try {
      if (customerUser) {
        await prisma.orderItem.deleteMany({ where: { order: { userId: customerUser.id } } });
        await prisma.payment.deleteMany({ where: { order: { userId: customerUser.id } } });
        await prisma.order.deleteMany({ where: { userId: customerUser.id } });
        await prisma.cartItem.deleteMany({ where: { cart: { userId: customerUser.id } } });
        await prisma.cart.deleteMany({ where: { userId: customerUser.id } });
        await prisma.user.delete({ where: { id: customerUser.id } });
      }
      if (otherCustomer) {
        await prisma.cart.deleteMany({ where: { userId: otherCustomer.id } });
        await prisma.user.delete({ where: { id: otherCustomer.id } });
      }
    } catch (e) {}
    await prisma.$disconnect();
  });

  test('POST /api/orders/checkout - Fails if cart is empty', async () => {
    const res = await request(app)
      .post('/api/orders/checkout')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        shippingAddress: {
          fullName: 'Order Tester',
          phone: '+91 9876543210',
          addressLine1: 'Test St 101',
          city: 'Bengaluru',
          state: 'Karnataka',
          postalCode: '560001',
        },
      });

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('cart is empty');
  });

  test('POST /api/orders/checkout - Executes atomic checkout, deducts inventory, and clears cart', async () => {
    if (!testProduct) return;

    // 1. Add 2 items to cart
    await request(app)
      .post('/api/cart/add')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ productId: testProduct.id, quantity: 2 });

    // 2. Checkout
    const res = await request(app)
      .post('/api/orders/checkout')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        shippingAddress: {
          fullName: 'Order Tester',
          phone: '+91 9876543210',
          addressLine1: 'Test St 101',
          city: 'Bengaluru',
          state: 'Karnataka',
          postalCode: '560001',
        },
        paymentMethod: 'MOCK_CARD',
        autoConfirmMock: true,
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.order).toBeDefined();

    createdOrderId = res.body.data.order.id;

    // 3. Verify stock was deducted in database
    const freshProduct = await prisma.product.findUnique({ where: { id: testProduct.id } });
    expect(freshProduct.stockQuantity).toBe(initialStock - 2);

    // 4. Verify cart is now empty
    const cartRes = await request(app)
      .get('/api/cart')
      .set('Authorization', `Bearer ${customerToken}`);
    expect(cartRes.body.data.items.length).toBe(0);
  });

  test('GET /api/orders/:id - IDOR Protection: User B cannot access User A order', async () => {
    if (!createdOrderId) return;

    const res = await request(app)
      .get(`/api/orders/${createdOrderId}`)
      .set('Authorization', `Bearer ${otherToken}`); // Other customer token

    expect(res.statusCode).toBe(404);
    expect(res.body.success).toBe(false);
  });

  test('POST /api/orders/:id/cancel - Cancels order and restores stock atomically', async () => {
    if (!createdOrderId) return;

    const res = await request(app)
      .post(`/api/orders/${createdOrderId}/cancel`)
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ reason: 'Unit test cancellation' });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.order.status).toBe('CANCELLED');

    // Verify stock is restored
    const freshProduct = await prisma.product.findUnique({ where: { id: testProduct.id } });
    expect(freshProduct.stockQuantity).toBe(initialStock);
  });
});
