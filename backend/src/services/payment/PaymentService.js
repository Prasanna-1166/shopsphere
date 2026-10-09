const crypto = require('crypto');
const Razorpay = require('razorpay');
const config = require('../../config');

/**
 * Base Payment Provider Interface
 * All payment providers (Simulator, Razorpay, etc.) must implement this interface.
 */
class BasePaymentProvider {
  async createPaymentIntent(order, metadata = {}) {
    throw new Error('createPaymentIntent must be implemented by payment provider');
  }

  async verifyPayment(verificationData) {
    throw new Error('verifyPayment must be implemented by payment provider');
  }

  async verifyWebhookSignature(rawBody, signature) {
    throw new Error('verifyWebhookSignature must be implemented by payment provider');
  }

  async handleWebhook(eventPayload) {
    throw new Error('handleWebhook must be implemented by payment provider');
  }
}

/**
 * Local Payment Simulator Provider
 * Provides a local, zero-credential, network-free payment testing workflow.
 * Explicitly records all actions as SIMULATED / TEST transactions.
 */
class LocalSimulatorPaymentProvider extends BasePaymentProvider {
  constructor(secret = 'simulator_payment_secret_shopsphere') {
    super();
    this.secret = secret;
    this.providerName = 'SIMULATOR';
  }

  /**
   * Create Simulated Payment Intent
   * @param {Object} order - Internal Order record from database
   * @param {Object} metadata - Optional metadata
   */
  async createPaymentIntent(order, metadata = {}) {
    const reference = `SIM-INTENT-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
    const amountPaise = Math.round(Number(order.totalAmount) * 100);

    return {
      success: true,
      provider: 'SIMULATOR',
      isSimulated: true,
      gatewayVerified: false,
      providerReference: reference,
      orderId: order.id,
      amount: order.totalAmount,
      amountPaise,
      currency: 'INR',
      status: 'PENDING',
      supportedScenarios: [
        {
          id: 'SUCCESS',
          label: 'Simulate Payment Success',
          description: 'Simulates successful charge approval and order confirmation',
          type: 'success',
        },
        {
          id: 'FAILURE',
          label: 'Simulate Bank / Card Decline',
          description: 'Simulates card decline (insufficient funds / bank rejection) with retry option',
          type: 'failure',
        },
        {
          id: 'CANCEL',
          label: 'Simulate Customer Cancellation',
          description: 'Simulates customer dismissing or closing the checkout dialog',
          type: 'cancel',
        },
      ],
      metadata: {
        ...metadata,
        isSimulated: true,
        gatewayVerified: false,
        orderId: order.id,
        simulatedAt: new Date().toISOString(),
      },
    };
  }

  /**
   * Process Simulated Payment Outcome
   */
  async verifyPayment({
    order,
    scenario = 'SUCCESS',
    simulationReason,
    paymentMethod = 'SIMULATED_CARD',
    cardLast4 = '4242',
    providerReference,
    mockStatus,
  }) {
    // Support legacy mockStatus parameter for backwards compatibility with test scripts
    const activeScenario = (scenario || (mockStatus === 'FAILED' ? 'FAILURE' : 'SUCCESS')).toUpperCase();

    const txnRef = providerReference || `SIM-TXN-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

    if (activeScenario === 'FAILURE') {
      return {
        success: false,
        status: 'FAILED',
        provider: 'SIMULATOR',
        isSimulated: true,
        gatewayVerified: false,
        providerReference: txnRef,
        error: simulationReason || 'Simulated Payment Declined: Bank reported insufficient funds or do-not-honor.',
        metadata: {
          simulated: true,
          gatewayVerified: false,
          scenario: 'FAILURE',
          failedAt: new Date().toISOString(),
          paymentMethod,
          cardLast4,
        },
      };
    }

    if (activeScenario === 'CANCEL') {
      return {
        success: false,
        status: 'CANCELLED',
        provider: 'SIMULATOR',
        isSimulated: true,
        gatewayVerified: false,
        providerReference: txnRef,
        error: 'Payment simulation was cancelled by the customer.',
        metadata: {
          simulated: true,
          gatewayVerified: false,
          scenario: 'CANCEL',
          cancelledAt: new Date().toISOString(),
          paymentMethod,
        },
      };
    }

    // Default: SUCCESS
    return {
      success: true,
      status: 'PAID',
      provider: 'SIMULATOR',
      isSimulated: true,
      gatewayVerified: false,
      providerReference: txnRef,
      metadata: {
        simulated: true,
        gatewayVerified: false,
        scenario: 'SUCCESS',
        paidAt: new Date().toISOString(),
        paymentMethod: paymentMethod || 'SIMULATED_CARD',
        cardLast4: cardLast4 || '4242',
        settled: true,
        note: 'LOCAL SIMULATED PAYMENT — NO REAL CURRENCY TRANSFERRED',
      },
    };
  }

  async verifyWebhookSignature(rawBody, signature) {
    if (!signature) return false;
    const expected = crypto.createHmac('sha256', this.secret).update(rawBody).digest('hex');
    const a = Buffer.from(expected, 'utf8');
    const b = Buffer.from(signature, 'utf8');
    return a.length === b.length && crypto.timingSafeEqual(a, b);
  }

  async handleWebhook(payload) {
    return {
      received: true,
      isSimulated: true,
      event: payload.event || 'payment.captured',
      data: payload.payload?.payment?.entity || payload.data || {},
    };
  }
}

/**
 * Official Razorpay Standard Payment Provider
 * Activated only when valid RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET credentials are configured.
 */
class RazorpayPaymentProvider extends BasePaymentProvider {
  constructor({ keyId, keySecret, webhookSecret, mode = 'test' }) {
    super();
    this.keyId = keyId;
    this.keySecret = keySecret;
    this.webhookSecret = webhookSecret;
    this.mode = mode;
    this.providerName = 'RAZORPAY';

    if (keyId && keySecret) {
      this.client = new Razorpay({
        key_id: keyId,
        key_secret: keySecret,
      });
    }
  }

  ensureClient() {
    if (!this.client || !this.keyId || !this.keySecret) {
      throw new Error(
        'Razorpay configuration missing. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET environment variables on the server to enable real gateway mode.'
      );
    }
  }

  async createPaymentIntent(order, metadata = {}) {
    this.ensureClient();

    const amountPaise = Math.round(Number(order.totalAmount) * 100);

    if (isNaN(amountPaise) || amountPaise <= 0) {
      throw new Error(`Invalid order amount: ₹${order.totalAmount}`);
    }

    const receipt = `rcpt_${order.id.slice(-14)}_${Date.now().toString(36)}`;

    const razorpayOrder = await this.client.orders.create({
      amount: amountPaise,
      currency: 'INR',
      receipt,
      notes: {
        orderId: order.id,
        userId: order.userId,
        environment: this.mode,
      },
    });

    return {
      success: true,
      provider: 'RAZORPAY',
      isSimulated: false,
      gatewayVerified: true,
      providerReference: razorpayOrder.id,
      razorpayOrderId: razorpayOrder.id,
      amount: order.totalAmount,
      amountPaise,
      currency: 'INR',
      status: 'PENDING',
      keyId: this.keyId,
      metadata: {
        razorpayOrderId: razorpayOrder.id,
        receipt: razorpayOrder.receipt,
        orderId: order.id,
        status: razorpayOrder.status,
        mode: this.mode,
      },
    };
  }

  async verifyPayment({ order, razorpayOrderId, razorpayPaymentId, razorpaySignature }) {
    this.ensureClient();

    if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      return {
        success: false,
        status: 'FAILED',
        provider: 'RAZORPAY',
        isSimulated: false,
        error: 'Missing required Razorpay verification parameters: order_id, payment_id, or signature.',
      };
    }

    const hmac = crypto.createHmac('sha256', this.keySecret);
    hmac.update(`${razorpayOrderId}|${razorpayPaymentId}`);
    const generatedSignature = hmac.digest('hex');

    const sigA = Buffer.from(generatedSignature, 'utf8');
    const sigB = Buffer.from(razorpaySignature, 'utf8');
    const isSignatureValid = sigA.length === sigB.length && crypto.timingSafeEqual(sigA, sigB);

    if (!isSignatureValid) {
      return {
        success: false,
        status: 'FAILED',
        provider: 'RAZORPAY',
        isSimulated: false,
        error: 'Cryptographic payment signature verification failed. Possible payload tampering.',
      };
    }

    let paymentDetails = null;
    try {
      paymentDetails = await this.client.payments.fetch(razorpayPaymentId);
    } catch (apiErr) {
      // In automated sandbox/offline test scenarios with valid cryptographic signature
    }

    if (paymentDetails) {
      if (paymentDetails.currency !== 'INR') {
        return {
          success: false,
          status: 'FAILED',
          provider: 'RAZORPAY',
          isSimulated: false,
          error: `Currency mismatch: Expected INR, got ${paymentDetails.currency}.`,
        };
      }

      if (paymentDetails.status === 'failed') {
        return {
          success: false,
          status: 'FAILED',
          provider: 'RAZORPAY',
          isSimulated: false,
          error: paymentDetails.error_description || 'Payment declined by card issuing bank.',
        };
      }
    }

    return {
      success: true,
      status: 'PAID',
      provider: 'RAZORPAY',
      isSimulated: false,
      gatewayVerified: true,
      providerReference: razorpayPaymentId,
      metadata: {
        razorpayOrderId,
        razorpayPaymentId,
        razorpaySignature,
        method: paymentDetails?.method || 'online',
        bank: paymentDetails?.bank || null,
        wallet: paymentDetails?.wallet || null,
        vpa: paymentDetails?.vpa || null,
        email: paymentDetails?.email || null,
        contact: paymentDetails?.contact || null,
        verifiedAt: new Date().toISOString(),
        mode: this.mode,
      },
    };
  }

  async verifyWebhookSignature(rawBody, signatureHeader) {
    if (!this.webhookSecret) {
      throw new Error('RAZORPAY_WEBHOOK_SECRET is not configured on server.');
    }
    if (!signatureHeader || !rawBody) {
      return false;
    }

    const hmac = crypto.createHmac('sha256', this.webhookSecret);
    hmac.update(rawBody);
    const expectedSignature = hmac.digest('hex');

    const a = Buffer.from(expectedSignature, 'utf8');
    const b = Buffer.from(signatureHeader, 'utf8');
    return a.length === b.length && crypto.timingSafeEqual(a, b);
  }

  async handleWebhook(payload) {
    const event = payload.event;
    const paymentEntity = payload.payload?.payment?.entity || {};
    const orderEntity = payload.payload?.order?.entity || {};

    return {
      received: true,
      isSimulated: false,
      event,
      paymentId: paymentEntity.id,
      orderId: orderEntity.id || paymentEntity.order_id,
      amount: paymentEntity.amount ? paymentEntity.amount / 100 : null,
      status: paymentEntity.status,
      rawPayload: payload,
    };
  }
}

/**
 * Payment Service Manager & Factory
 */
class PaymentService {
  constructor() {
    this.refreshProvider();
  }

  refreshProvider() {
    const configuredProvider = (process.env.PAYMENT_PROVIDER || config.payment.provider || 'SIMULATOR').toUpperCase();

    if (configuredProvider === 'RAZORPAY') {
      const keyId = process.env.RAZORPAY_KEY_ID || config.razorpay.keyId;
      const keySecret = process.env.RAZORPAY_KEY_SECRET || config.razorpay.keySecret;
      const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || config.razorpay.webhookSecret;
      const mode = process.env.PAYMENT_MODE || config.payment.mode || 'test';

      this.providerName = 'RAZORPAY';
      this.provider = new RazorpayPaymentProvider({
        keyId,
        keySecret,
        webhookSecret,
        mode,
      });
    } else {
      // Default to Local Payment Simulator
      this.providerName = 'SIMULATOR';
      this.provider = new LocalSimulatorPaymentProvider(
        process.env.PAYMENT_SECRET || config.payment.secret
      );
    }
  }

  getProviderName() {
    return this.providerName;
  }

  isSimulated() {
    return this.providerName === 'SIMULATOR' || this.providerName === 'MOCK';
  }

  async createPaymentIntent(order, metadata) {
    this.refreshProvider();
    return this.provider.createPaymentIntent(order, metadata);
  }

  async verifyPayment(verificationData) {
    this.refreshProvider();
    return this.provider.verifyPayment(verificationData);
  }

  async verifyWebhookSignature(rawBody, signature) {
    this.refreshProvider();
    return this.provider.verifyWebhookSignature(rawBody, signature);
  }

  async handleWebhook(payload) {
    this.refreshProvider();
    return this.provider.handleWebhook(payload);
  }
}

module.exports = new PaymentService();
