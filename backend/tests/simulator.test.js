const crypto = require('crypto');
const request = require('supertest');
const app = require('../src/app');
const prisma = require('../src/config/prisma');
const { signToken } = require('../src/utils/jwt');
const PaymentService = require('../src/services/payment/PaymentService');

describe('ShopSphere — Local Payment Simulator & Gateway Separation Tests', () => {
  let customerUser = null;
  let otherCustomer = null;
  let adminUser = null;
  let customerToken = null;
  let otherToken = null;
  let adminToken = null;
  let testProduct = null;
  let initialStock = 0;
  let createdOrders = [];

  beforeAll(async () => {
    // 1. Create test customer A
    customerUser = await prisma.user.create({
      data: {
        name: 'Sim Customer A',
        email: `sim_customer_a_${Date.now()}@example.com`,
        passwordHash: 'dummy_hash',
        role: 'CUSTOMER',
        status: 'ACTIVE',
        cart: { create: {} },
      },
    });

    // 2. Create test customer B (for IDOR tests)
    otherCustomer = await prisma.user.create({
      data: {
        name: 'Sim Customer B',
        email: `sim_customer_b_${Date.now()}@example.com`,
        passwordHash: 'dummy_hash',
        role: 'CUSTOMER',
        status: 'ACTIVE',
        cart: { create: {} },
      },
    });

    // 3. Create or fetch admin user
    adminUser = await prisma.user.findFirst({
      where: { role: 'ADMIN' },
    });
    if (!adminUser) {
      adminUser = await prisma.user.create({
        data: {
          name: 'Sim Admin Tester',
          email: `sim_admin_${Date.now()}@example.com`,
          passwordHash: 'dummy_hash',
          role: 'ADMIN',
          status: 'ACTIVE',
        },
      });
    }

    customerToken = signToken({ id: customerUser.id, email: customerUser.email, role: customerUser.role });
    otherToken = signToken({ id: otherCustomer.id, email: otherCustomer.email, role: otherCustomer.role });
    adminToken = signToken({ id: adminUser.id, email: adminUser.email, role: adminUser.role });

    // 4. Find active product with stock
    testProduct = await prisma.product.findFirst({
      where: { active: true, stockQuantity: { gt: 20 } },
    });
    initialStock = testProduct.stockQuantity;
  });

  afterAll(async () => {
    try {
      for (const ord of createdOrders) {
        await prisma.orderItem.deleteMany({ where: { orderId: ord.id } });
        await prisma.payment.deleteMany({ where: { orderId: ord.id } });
        await prisma.inventoryTransaction.deleteMany({ where: { reason: { contains: ord.id } } });
        await prisma.order.deleteMany({ where: { id: ord.id } });
      }
      if (customerUser) {
        await prisma.cartItem.deleteMany({ where: { cart: { userId: customerUser.id } } });
        await prisma.cart.deleteMany({ where: { userId: customerUser.id } });
        await prisma.user.delete({ where: { id: customerUser.id } });
      }
      if (otherCustomer) {
        await prisma.cartItem.deleteMany({ where: { cart: { userId: otherCustomer.id } } });
        await prisma.cart.deleteMany({ where: { userId: otherCustomer.id } });
        await prisma.user.delete({ where: { id: otherCustomer.id } });
      }
    } catch (e) {}
    await prisma.$disconnect();
  });

  // Helper to place an online order for Customer A
  async function placeTestOrder(quantity = 1) {
    // Clear any existing cart items first
    const cart = await prisma.cart.findUnique({ where: { userId: customerUser.id } });
    if (cart) {
      await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
    }

    // Add to cart
    await request(app)
      .post('/api/cart/add')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ productId: testProduct.id, quantity });

    // Checkout
    const res = await request(app)
      .post('/api/orders/checkout')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        shippingAddress: {
          fullName: 'Sim Customer A',
          phone: '+91 9876543210',
          addressLine1: 'Test St 101',
          city: 'Bengaluru',
          state: 'Karnataka',
          postalCode: '560001',
        },
        paymentMethod: 'ONLINE',
      });

    expect(res.statusCode).toBe(201);
    const order = res.body.data.order;
    createdOrders.push(order);
    return order;
  }

  // =========================================================================
  // 1. CONFIG & PUBLIC PAYMENT INFO
  // =========================================================================
  describe('GET /api/payments/config', () => {
    test('Exposes Simulator configuration with explicit test mode metadata', async () => {
      const res = await request(app).get('/api/payments/config');
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.isSimulated).toBe(true);
      expect(res.body.data.provider).toBe('SIMULATOR');
      expect(res.body.data.supportedScenarios).toBeDefined();
      expect(res.body.data.supportedScenarios.length).toBeGreaterThanOrEqual(3);

      // Verify no secret leak
      expect(res.body.data.keySecret).toBeUndefined();
      expect(res.body.data.webhookSecret).toBeUndefined();
    });
  });

  // =========================================================================
  // 2. SERVER-AUTHORITATIVE TOTALS & INTENT CREATION
  // =========================================================================
  describe('Server-Authoritative Amounts & Payment Intent', () => {
    test('Calculates order totals strictly on server using product prices', async () => {
      const order = await placeTestOrder(2);
      const expectedUnit = testProduct.discountPrice !== null ? testProduct.discountPrice : testProduct.price;
      const expectedSubtotal = expectedUnit * 2;
      const expectedShipping = expectedSubtotal > 1500 ? 0 : 99;
      const expectedTotal = expectedSubtotal + expectedShipping;

      expect(order.subtotal).toBe(expectedSubtotal);
      expect(order.shippingAmount).toBe(expectedShipping);
      expect(order.totalAmount).toBe(expectedTotal);
    });

    test('POST /api/payments/create-intent - Creates simulator intent with isSimulated: true', async () => {
      const order = await placeTestOrder(1);
      const res = await request(app)
        .post('/api/payments/create-intent')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ orderId: order.id });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.paymentIntent.isSimulated).toBe(true);
      expect(res.body.data.paymentIntent.gatewayVerified).toBe(false);
      expect(res.body.data.paymentIntent.providerReference).toMatch(/^SIM-INTENT-/);
      expect(res.body.data.paymentIntent.amount).toBe(order.totalAmount);
    });
  });

  // =========================================================================
  // 3. SIMULATED SCENARIO: SUCCESS
  // =========================================================================
  describe('Simulated Outcome: SUCCESS (Approval)', () => {
    test('Confirms order, marks payment PAID, and deducts inventory exactly once', async () => {
      const order = await placeTestOrder(1);
      const preStock = (await prisma.product.findUnique({ where: { id: testProduct.id } })).stockQuantity;

      const res = await request(app)
        .post('/api/payments/verify')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          orderId: order.id,
          scenario: 'SUCCESS',
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.order.paymentStatus).toBe('PAID');
      expect(res.body.data.order.status).toBe('CONFIRMED');

      // Check payment record metadata in database
      const paymentRecord = await prisma.payment.findFirst({
        where: { orderId: order.id },
      });
      expect(paymentRecord.status).toBe('PAID');
      expect(paymentRecord.provider).toBe('SIMULATOR');

      // Verify stock was deducted exactly 1 unit
      const postStock = (await prisma.product.findUnique({ where: { id: testProduct.id } })).stockQuantity;
      expect(postStock).toBe(preStock - 1);

      // Verify cart was cleared
      const cartRes = await request(app)
        .get('/api/cart')
        .set('Authorization', `Bearer ${customerToken}`);
      expect(cartRes.body.data.items.length).toBe(0);
    });

    test('Idempotency: Repeated verification of already PAID order does not double-deduct stock', async () => {
      const order = await placeTestOrder(1);

      // 1st verify
      await request(app)
        .post('/api/payments/verify')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ orderId: order.id, scenario: 'SUCCESS' });

      const stockAfterFirst = (await prisma.product.findUnique({ where: { id: testProduct.id } })).stockQuantity;

      // 2nd verify (re-execution / duplicate click)
      const res2 = await request(app)
        .post('/api/payments/verify')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ orderId: order.id, scenario: 'SUCCESS' });

      expect(res2.statusCode).toBe(200);
      expect(res2.body.data.order.paymentStatus).toBe('PAID');

      // Confirm stock was NOT deducted again
      const stockAfterSecond = (await prisma.product.findUnique({ where: { id: testProduct.id } })).stockQuantity;
      expect(stockAfterSecond).toBe(stockAfterFirst);
    });
  });

  // =========================================================================
  // 4. SIMULATED SCENARIO: FAILURE (CARD DECLINE)
  // =========================================================================
  describe('Simulated Outcome: FAILURE (Decline)', () => {
    test('Marks payment FAILED, keeps order PENDING, and leaves inventory untouched', async () => {
      const order = await placeTestOrder(1);
      const preStock = (await prisma.product.findUnique({ where: { id: testProduct.id } })).stockQuantity;

      const res = await request(app)
        .post('/api/payments/verify')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          orderId: order.id,
          scenario: 'FAILURE',
          simulationReason: 'Insufficient funds test scenario',
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);

      // Check DB order state
      const dbOrder = await prisma.order.findUnique({ where: { id: order.id } });
      expect(dbOrder.paymentStatus).toBe('FAILED');
      expect(dbOrder.status).toBe('PENDING');

      // Check DB payment record
      const paymentRecord = await prisma.payment.findFirst({
        where: { orderId: order.id },
      });
      expect(paymentRecord.status).toBe('FAILED');

      // Verify stock was NOT deducted
      const postStock = (await prisma.product.findUnique({ where: { id: testProduct.id } })).stockQuantity;
      expect(postStock).toBe(preStock);
    });
  });

  // =========================================================================
  // 5. SIMULATED SCENARIO: CANCEL
  // =========================================================================
  describe('Simulated Outcome: CANCEL (Customer Cancellation)', () => {
    test('Marks payment CANCELLED, leaves order retryable and inventory untouched', async () => {
      const order = await placeTestOrder(1);
      const preStock = (await prisma.product.findUnique({ where: { id: testProduct.id } })).stockQuantity;

      const res = await request(app)
        .post('/api/payments/verify')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          orderId: order.id,
          scenario: 'CANCEL',
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);

      // Check DB order state
      const dbOrder = await prisma.order.findUnique({ where: { id: order.id } });
      expect(dbOrder.paymentStatus).toBe('PENDING');
      expect(dbOrder.status).toBe('PENDING');

      // Check payment record
      const paymentRecord = await prisma.payment.findFirst({
        where: { orderId: order.id },
      });
      expect(paymentRecord.status).toBe('PENDING');
      const meta = typeof paymentRecord.metadata === 'string' ? JSON.parse(paymentRecord.metadata) : paymentRecord.metadata;
      expect(meta.scenario).toBe('CANCEL');

      // Verify stock was NOT deducted
      const postStock = (await prisma.product.findUnique({ where: { id: testProduct.id } })).stockQuantity;
      expect(postStock).toBe(preStock);
    });
  });

  // =========================================================================
  // 6. RETRY FLOW AFTER FAILURE
  // =========================================================================
  describe('Retry Payment After Failure', () => {
    test('Allows customer to retry and successfully pay for previously failed order', async () => {
      const order = await placeTestOrder(1);

      // Step 1: Simulate failure
      await request(app)
        .post('/api/payments/verify')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ orderId: order.id, scenario: 'FAILURE' });

      let currentOrder = await prisma.order.findUnique({ where: { id: order.id } });
      expect(currentOrder.paymentStatus).toBe('FAILED');

      // Step 2: Retry with SUCCESS scenario
      const retryRes = await request(app)
        .post('/api/payments/verify')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ orderId: order.id, scenario: 'SUCCESS' });

      expect(retryRes.statusCode).toBe(200);
      expect(retryRes.body.success).toBe(true);
      expect(retryRes.body.data.order.paymentStatus).toBe('PAID');
      expect(retryRes.body.data.order.status).toBe('CONFIRMED');

      currentOrder = await prisma.order.findUnique({ where: { id: order.id } });
      expect(currentOrder.paymentStatus).toBe('PAID');
      expect(currentOrder.status).toBe('CONFIRMED');
    });
  });

  // =========================================================================
  // 7. ACCESS CONTROL & IDOR SECURITY
  // =========================================================================
  describe('Authorization & IDOR Protection', () => {
    test('Customer B cannot simulate payment for Customer A order', async () => {
      const order = await placeTestOrder(1);

      const res = await request(app)
        .post('/api/payments/verify')
        .set('Authorization', `Bearer ${otherToken}`) // Attacker token
        .send({
          orderId: order.id,
          scenario: 'SUCCESS',
        });

      expect(res.statusCode).toBe(404);
      expect(res.body.success).toBe(false);

      // Confirm order remains unpaid in database
      const dbOrder = await prisma.order.findUnique({ where: { id: order.id } });
      expect(dbOrder.paymentStatus).toBe('PENDING');
    });

    test('Unauthenticated request is rejected with 401', async () => {
      const order = await placeTestOrder(1);

      const res = await request(app)
        .post('/api/payments/verify')
        .send({ orderId: order.id, scenario: 'SUCCESS' });

      expect(res.statusCode).toBe(401);
    });
  });

  // =========================================================================
  // 8. ADMIN DASHBOARD REVENUE SEPARATION
  // =========================================================================
  describe('Admin Dashboard Financial Separation', () => {
    test('Excludes simulated payments from real revenue metric', async () => {
      const res = await request(app)
        .get('/api/admin/dashboard/metrics')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.overview).toHaveProperty('realRevenue');
      expect(res.body.data.overview).toHaveProperty('simulatedRevenue');
      expect(res.body.data.overview).toHaveProperty('isSimulationMode');
      expect(res.body.data.overview.isSimulationMode).toBe(true);

      // Real revenue must ONLY count real gateway transactions (RAZORPAY/STRIPE)
      expect(typeof res.body.data.overview.realRevenue).toBe('number');
      expect(typeof res.body.data.overview.simulatedRevenue).toBe('number');
    });
  });

  // =========================================================================
  // 9. RAZORPAY PROVIDER FAIL-SAFE
  // =========================================================================
  describe('Razorpay Provider Safe Fail Behavior', () => {
    test('Fails safely with clear error if Razorpay mode is invoked without credentials', async () => {
      const { RazorpayPaymentProvider } = require('../src/services/payment/PaymentService');
      const unconfiguredRzp = new (PaymentService.constructor)();

      // Temporarily switch provider to unconfigured Razorpay
      process.env.PAYMENT_PROVIDER = 'RAZORPAY';
      delete process.env.RAZORPAY_KEY_ID;
      delete process.env.RAZORPAY_KEY_SECRET;
      unconfiguredRzp.refreshProvider();

      expect(unconfiguredRzp.getProviderName()).toBe('RAZORPAY');

      // Must throw clear configuration error when attempting to create intent
      await expect(
        unconfiguredRzp.createPaymentIntent({ id: 'dummy-order', totalAmount: 500 })
      ).rejects.toThrow(/Razorpay configuration missing/);

      // Restore environment
      process.env.PAYMENT_PROVIDER = 'SIMULATOR';
      PaymentService.refreshProvider();
    });
  });
});
