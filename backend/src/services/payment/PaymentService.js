const crypto = require('crypto');

/**
 * Base Payment Provider Interface
 */
class BasePaymentProvider {
  async createPaymentIntent(order, metadata = {}) {
    throw new Error('createPaymentIntent must be implemented by provider');
  }

  async verifyPayment(paymentData) {
    throw new Error('verifyPayment must be implemented by provider');
  }

  async handleWebhook(payload, signature) {
    throw new Error('handleWebhook must be implemented by provider');
  }
}

/**
 * Development Mock Payment Provider
 * Safe simulated payment processing for local and testing environments
 */
class MockPaymentProvider extends BasePaymentProvider {
  async createPaymentIntent(order, metadata = {}) {
    const reference = `MOCK-TXN-${crypto.randomBytes(6).toString('hex').toUpperCase()}`;
    return {
      success: true,
      provider: 'MOCK',
      providerReference: reference,
      amount: order.totalAmount,
      currency: 'INR',
      status: 'PENDING',
      clientSecret: `mock_secret_${reference}`,
      metadata: {
        ...metadata,
        isSimulated: true,
        orderId: order.id,
      },
    };
  }

  async verifyPayment({ providerReference, mockStatus = 'PAID', cardLast4 = '4242', paymentMethod = 'Credit Card' }) {
    if (mockStatus === 'FAILED') {
      return {
        success: false,
        status: 'FAILED',
        providerReference,
        error: 'Simulated payment failure (Mock Gateway)',
      };
    }

    return {
      success: true,
      status: 'PAID',
      providerReference: providerReference || `MOCK-TXN-${Date.now()}`,
      metadata: {
        paidAt: new Date().toISOString(),
        paymentMethod,
        cardLast4,
        settled: true,
      },
    };
  }

  async handleWebhook(payload) {
    return {
      received: true,
      event: payload.event || 'payment.success',
      data: payload.data || {},
    };
  }
}

/**
 * Payment Service Manager
 */
class PaymentService {
  constructor(providerName = 'MOCK') {
    this.providerName = providerName;
    if (providerName === 'MOCK') {
      this.provider = new MockPaymentProvider();
    } else {
      // Defaults to Mock if unknown provider is supplied
      this.provider = new MockPaymentProvider();
    }
  }

  async createPaymentIntent(order, metadata) {
    return this.provider.createPaymentIntent(order, metadata);
  }

  async verifyPayment(paymentData) {
    return this.provider.verifyPayment(paymentData);
  }

  async handleWebhook(payload, signature) {
    return this.provider.handleWebhook(payload, signature);
  }
}

module.exports = new PaymentService(process.env.PAYMENT_PROVIDER || 'MOCK');
