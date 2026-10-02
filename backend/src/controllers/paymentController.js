const paymentService = require('../services/payment/PaymentService');
const prisma = require('../config/prisma');
const { sendSuccess, sendError } = require('../utils/response');

/**
 * Initialize Payment Intent for an Order
 */
const createPaymentIntent = async (req, res, next) => {
  try {
    const { orderId } = req.body;

    if (!orderId) {
      return sendError(res, 'Order ID is required.', [], 400);
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order || order.userId !== req.user.id) {
      return sendError(res, 'Order not found.', [], 404);
    }

    const intent = await paymentService.createPaymentIntent(order);
    return sendSuccess(res, 'Payment intent created.', { paymentIntent: intent });
  } catch (error) {
    next(error);
  }
};

/**
 * Verify & Complete Payment
 */
const verifyPayment = async (req, res, next) => {
  try {
    const { orderId, providerReference, mockStatus, paymentMethod } = req.body;

    if (!orderId) {
      return sendError(res, 'Order ID is required.', [], 400);
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order || order.userId !== req.user.id) {
      return sendError(res, 'Order not found.', [], 404);
    }

    const verificationResult = await paymentService.verifyPayment({
      providerReference,
      mockStatus,
      paymentMethod,
    });

    if (!verificationResult.success) {
      await prisma.order.update({
        where: { id: orderId },
        data: { paymentStatus: 'FAILED' },
      });
      return sendError(res, 'Payment verification failed.', [verificationResult.error], 400);
    }

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        paymentStatus: 'PAID',
        status: order.status === 'PENDING' ? 'CONFIRMED' : order.status,
      },
    });

    return sendSuccess(res, 'Payment verified successfully.', { order: updatedOrder, verification: verificationResult });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createPaymentIntent,
  verifyPayment,
};
