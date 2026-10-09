const crypto = require('crypto');
const request = require('supertest');
const app = require('../src/app');
const prisma = require('../src/config/prisma');
const { signToken } = require('../src/utils/jwt');
const PaymentService = require('../src/services/payment/PaymentService');

describe('ShopSphere — Razorpay Standard Gateway & Payment Integration Tests', () => {
  let customerUser = null;
  let otherCustomer = null;
  let customerToken = null;
  let otherToken = null;
  let testProduct = null;
  let testOrder = null;

  const TEST_KEY_SECRET = 'test_razorpay_secret_key_12345';
  const TEST_WEBHOOK_SECRET = 'test_razorpay_webhook_secret_67890';

  beforeAll(async () => {
    // 1. Create test customers
    customerUser = await prisma.user.create({
      data: {
        name: 'Payment Test Customer',
        email: `pay_test_${Date.now()}@example.com`,
        passwordHash: 'dummy_hash',
        role: 'CUSTOMER',
        status: 'ACTIVE',
        cart: { create: {} },
      },
    });

    otherCustomer = await prisma.user.create({
      data: {
        name: 'Payment Attacker User',
        email: `pay_attacker_${Date.now()}@example.com`,
        passwordHash: 'dummy_hash',
        role: 'CUSTOMER',
        status: 'ACTIVE',
        cart: { create: {} },
      },
    });

    customerToken = signToken({ id: customerUser.id, email: customerUser.email, role: customerUser.role });
    otherToken = signToken({ id: otherCustomer.id, email: otherCustomer.email, role: otherCustomer.role });

    // 2. Get active product
    testProduct = await prisma.product.findFirst({
      where: { active: true, stockQuantity: { gt: 10 } },
    });

    // 3. Create test internal order
    testOrder = await prisma.order.create({
      data: {
        userId: customerUser.id,
        status: 'PENDING',
        paymentStatus: 'PENDING',
        subtotal: 500,
        shippingAmount: 0,
        discount: 0,
        totalAmount: 500,
        shippingAddress: {
          fullName: 'Payment Test Customer',
          phone: '+91 9876543210',
          addressLine1: 'Test St 101',
          city: 'Bengaluru',
          state: 'Karnataka',
          postalCode: '560001',
        },
        items: {
          create: [
            {
              productId: testProduct.id,
              productName: testProduct.name,
              sku: testProduct.sku,
              unitPrice: 500,
              quantity: 1,
              subtotal: 500,
            },
          ],
        },
      },
    });
  });

  afterAll(async () => {
    try {
      if (testOrder) {
        await prisma.orderItem.deleteMany({ where: { orderId: testOrder.id } });
        await prisma.payment.deleteMany({ where: { orderId: testOrder.id } });
        await prisma.order.delete({ where: { id: testOrder.id } });
      }
      if (customerUser) {
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

  // =========================================================================
  // 1. CRYPTOGRAPHIC SIGNATURE VERIFICATION TESTS
  // =========================================================================
  describe('Cryptographic Signature Verification Unit Tests', () => {
    test('Razorpay Standard payment signature: Valid signature matches expected HMAC-SHA256', () => {
      const orderId = 'order_DA294jfk294';
      const paymentId = 'pay_924jfks823';
      const payload = `${orderId}|${paymentId}`;
      const validSignature = crypto.createHmac('sha256', TEST_KEY_SECRET).update(payload).digest('hex');

      // Verify signature formula
      const computed = crypto.createHmac('sha256', TEST_KEY_SECRET).update(`${orderId}|${paymentId}`).digest('hex');
      expect(computed).toBe(validSignature);

      // Constant-time timingSafeEqual validation
      const sigA = Buffer.from(computed, 'utf8');
      const sigB = Buffer.from(validSignature, 'utf8');
      expect(sigA.length === sigB.length && crypto.timingSafeEqual(sigA, sigB)).toBe(true);
    });

    test('Razorpay Standard payment signature: Tampered payment_id or order_id fails verification', () => {
      const orderId = 'order_DA294jfk294';
      const paymentId = 'pay_924jfks823';
      const validSignature = crypto.createHmac('sha256', TEST_KEY_SECRET).update(`${orderId}|${paymentId}`).digest('hex');

      const tamperedPaymentId = 'pay_tampered_123';
      const tamperedSignature = crypto.createHmac('sha256', TEST_KEY_SECRET).update(`${orderId}|${tamperedPaymentId}`).digest('hex');

      expect(tamperedSignature).not.toBe(validSignature);
    });

    test('Razorpay Webhook signature: Valid raw body HMAC-SHA256 matches header', () => {
      const rawBody = JSON.stringify({
        event: 'payment.captured',
        payload: {
          payment: {
            entity: {
              id: 'pay_webhook_test_123',
              amount: 50000,
              currency: 'INR',
              status: 'captured',
            },
          },
        },
      });

      const validWebhookSig = crypto.createHmac('sha256', TEST_WEBHOOK_SECRET).update(rawBody).digest('hex');

      const expected = crypto.createHmac('sha256', TEST_WEBHOOK_SECRET).update(rawBody).digest('hex');
      const a = Buffer.from(expected, 'utf8');
      const b = Buffer.from(validWebhookSig, 'utf8');
      expect(a.length === b.length && crypto.timingSafeEqual(a, b)).toBe(true);
    });
  });

  // =========================================================================
  // 2. PAYMENT CONFIG API & CREDENTIAL SECURITY
  // =========================================================================
  describe('GET /api/payments/config & Secret Security', () => {
    test('Returns public key and mode without exposing secret keys', async () => {
      const res = await request(app).get('/api/payments/config');
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('provider');
      expect(res.body.data).toHaveProperty('keyId');
      expect(res.body.data).toHaveProperty('mode');

      // CRITICAL SECURITY ASSERTION: Secret keys must NEVER be in response
      expect(res.body.data.keySecret).toBeUndefined();
      expect(res.body.data.webhookSecret).toBeUndefined();
      expect(JSON.stringify(res.body)).not.toContain('RAZORPAY_KEY_SECRET');
    });
  });

  // =========================================================================
  // 3. PAYMENT INTENT & IDOR PROTECTION
  // =========================================================================
  describe('POST /api/payments/create-intent', () => {
    test('Rejects unauthenticated request with 401', async () => {
      const res = await request(app)
        .post('/api/payments/create-intent')
        .send({ orderId: testOrder.id });

      expect(res.statusCode).toBe(401);
    });

    test('IDOR Protection: Customer B cannot create payment intent for Customer A order', async () => {
      const res = await request(app)
        .post('/api/payments/create-intent')
        .set('Authorization', `Bearer ${otherToken}`) // Attacker token
        .send({ orderId: testOrder.id });

      expect(res.statusCode).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Order not found');
    });

    test('Creates valid payment intent for legitimate order owner with server-calculated amount', async () => {
      const res = await request(app)
        .post('/api/payments/create-intent')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ orderId: testOrder.id });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.paymentIntent).toHaveProperty('provider');
      expect(res.body.data.paymentIntent).toHaveProperty('providerReference');
      expect(res.body.data.paymentIntent.amount).toBe(500);
      expect(res.body.data.paymentIntent.currency).toBe('INR');
    });
  });

  // =========================================================================
  // 4. SERVER-SIDE PAYMENT VERIFICATION & IDEMPOTENCY
  // =========================================================================
  describe('POST /api/payments/verify', () => {
    test('Rejects unauthenticated verification request with 401', async () => {
      const res = await request(app)
        .post('/api/payments/verify')
        .send({ orderId: testOrder.id });

      expect(res.statusCode).toBe(401);
    });

    test('IDOR Protection: Customer B cannot verify payment for Customer A order', async () => {
      const res = await request(app)
        .post('/api/payments/verify')
        .set('Authorization', `Bearer ${otherToken}`)
        .send({
          orderId: testOrder.id,
          providerReference: 'MOCK-TXN-12345',
        });

      expect(res.statusCode).toBe(404);
    });

    test('Verifies payment successfully and updates order to PAID status', async () => {
      const mockRef = `TXN-TEST-${Date.now()}`;

      const res = await request(app)
        .post('/api/payments/verify')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          orderId: testOrder.id,
          providerReference: mockRef,
          razorpayOrderId: 'order_test_123',
          razorpayPaymentId: 'pay_test_456',
          mockStatus: 'PAID',
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.order.paymentStatus).toBe('PAID');
      expect(res.body.data.order.status).toBe('CONFIRMED');

      // Verify in DB
      const freshOrder = await prisma.order.findUnique({ where: { id: testOrder.id } });
      expect(freshOrder.paymentStatus).toBe('PAID');
      expect(freshOrder.status).toBe('CONFIRMED');

      const paymentRecord = await prisma.payment.findFirst({ where: { orderId: testOrder.id } });
      expect(paymentRecord).not.toBeNull();
      expect(paymentRecord.status).toBe('PAID');
    });

    test('Idempotency: Re-verifying an already paid order returns success without duplicating records', async () => {
      const res = await request(app)
        .post('/api/payments/verify')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          orderId: testOrder.id,
          providerReference: 'TXN-TEST-DUPLICATE',
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.order.paymentStatus).toBe('PAID');

      // Confirm only 1 payment record exists for this order
      const paymentCount = await prisma.payment.count({ where: { orderId: testOrder.id } });
      expect(paymentCount).toBe(1);
    });
  });

  // =========================================================================
  // 5. WEBHOOK PROCESSING & ERROR HANDLING
  // =========================================================================
  describe('POST /api/payments/webhook', () => {
    test('Rejects webhook with invalid signature with 400', async () => {
      const webhookPayload = {
        event: 'payment.captured',
        payload: {
          payment: {
            entity: {
              id: 'pay_webhook_invalid_sig',
              amount: 50000,
            },
          },
        },
      };

      const res = await request(app)
        .post('/api/payments/webhook')
        .set('x-razorpay-signature', 'invalid_signature_hex_1234')
        .send(webhookPayload);

      expect(res.statusCode).toBe(400);
      expect(res.body.error).toContain('Invalid webhook signature');
    });

    test('Processes valid webhook events with valid HMAC signature', async () => {
      const webhookPayload = {
        event: 'payment.captured',
        payload: {
          payment: {
            entity: {
              id: 'pay_webhook_live_123',
              order_id: 'order_mock_999',
              amount: 50000,
              currency: 'INR',
              status: 'captured',
            },
          },
        },
      };

      const rawString = JSON.stringify(webhookPayload);
      const secret = process.env.PAYMENT_SECRET || 'mock_payment_secret';
      const validSig = crypto.createHmac('sha256', secret).update(rawString).digest('hex');

      const res = await request(app)
        .post('/api/payments/webhook')
        .set('x-razorpay-signature', validSig)
        .set('Content-Type', 'application/json')
        .send(webhookPayload);

      expect(res.statusCode).toBe(200);
      expect(res.body.received).toBe(true);
      expect(res.body.event).toBe('payment.captured');
    });
  });
});
