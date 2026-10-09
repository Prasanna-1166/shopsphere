const paymentService = require('../services/payment/PaymentService');
const prisma = require('../config/prisma');
const config = require('../config');
const { sendSuccess, sendError } = require('../utils/response');
const { createAuditLog } = require('../utils/auditLogger');

const parseJsonSafe = (val) => {
  if (!val) return null;
  if (typeof val === 'object') return val;
  try {
    return JSON.parse(val);
  } catch (e) {
    return val;
  }
};

/**
 * Get Public Payment Gateway Configuration for Client
 */
const getPaymentConfig = async (req, res, next) => {
  try {
    const isSim = paymentService.isSimulated();
    const providerName = paymentService.getProviderName();

    return sendSuccess(res, 'Payment gateway configuration fetched.', {
      provider: providerName,
      mode: config.payment.mode,
      isSimulated: isSim,
      keyId: isSim ? 'sim_key_local_development' : config.razorpay.keyId,
      currency: 'INR',
      supportedScenarios: isSim
        ? [
            { id: 'SUCCESS', label: 'Simulate Payment Success (Approve)', type: 'success' },
            { id: 'FAILURE', label: 'Simulate Card Decline (Fail)', type: 'failure' },
            { id: 'CANCEL', label: 'Simulate Customer Cancel', type: 'cancel' },
          ]
        : [],
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Initialize / Create Payment Intent for an Order
 */
const createPaymentIntent = async (req, res, next) => {
  try {
    const { orderId } = req.body;

    if (!orderId) {
      return sendError(res, 'Order ID is required.', [], 400);
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: true,
        payments: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
    });

    if (!order || order.userId !== req.user.id) {
      return sendError(res, 'Order not found or unauthorized.', [], 404);
    }

    if (order.paymentStatus === 'PAID') {
      return sendError(res, 'This order has already been paid successfully.', [], 400);
    }

    if (order.status === 'CANCELLED') {
      return sendError(res, 'Cannot initiate payment for a cancelled order.', [], 400);
    }

    // Generate intent via configured provider (Local Simulator or Razorpay)
    const intent = await paymentService.createPaymentIntent(order);

    // Persist or update Payment record
    let paymentRecord;
    if (order.payments.length > 0 && order.payments[0].status === 'PENDING') {
      paymentRecord = await prisma.payment.update({
        where: { id: order.payments[0].id },
        data: {
          provider: intent.provider,
          providerReference: intent.providerReference,
          amount: order.totalAmount,
          currency: intent.currency || 'INR',
          status: 'PENDING',
          metadata: JSON.stringify(intent.metadata || {}),
        },
      });
    } else {
      paymentRecord = await prisma.payment.create({
        data: {
          orderId: order.id,
          provider: intent.provider,
          providerReference: intent.providerReference,
          amount: order.totalAmount,
          currency: intent.currency || 'INR',
          status: 'PENDING',
          metadata: JSON.stringify(intent.metadata || {}),
        },
      });
    }

    await createAuditLog(prisma, {
      userId: req.user.id,
      action: 'PAYMENT_INTENT_CREATED',
      entity: 'PAYMENT',
      entityId: paymentRecord.id,
      metadata: {
        orderId: order.id,
        provider: intent.provider,
        providerReference: intent.providerReference,
        amount: order.totalAmount,
        isSimulated: intent.isSimulated,
      },
    });

    return sendSuccess(res, 'Payment intent created successfully.', {
      paymentIntent: intent,
      order: {
        id: order.id,
        totalAmount: order.totalAmount,
        subtotal: order.subtotal,
        shippingAmount: order.shippingAmount,
        status: order.status,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Verify Server-Side Payment & Finalize Order (Simulator & Gateway)
 */
const verifyPayment = async (req, res, next) => {
  try {
    const {
      orderId,
      scenario,
      simulationReason,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
      providerReference,
      mockStatus,
      paymentMethod,
    } = req.body;

    if (!orderId) {
      return sendError(res, 'Order ID is required.', [], 400);
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: true,
        payments: { orderBy: { createdAt: 'desc' } },
      },
    });

    if (!order || order.userId !== req.user.id) {
      return sendError(res, 'Order not found or unauthorized access.', [], 404);
    }

    // Idempotency: If already verified and paid, return current authoritative order
    if (order.paymentStatus === 'PAID') {
      const activePayment = order.payments.find((p) => p.status === 'PAID') || order.payments[0];
      return sendSuccess(res, 'Payment is already verified and confirmed.', {
        order: {
          ...order,
          shippingAddress: parseJsonSafe(order.shippingAddress),
        },
        payment: {
          ...activePayment,
          metadata: parseJsonSafe(activePayment?.metadata),
        },
      });
    }

    if (order.status === 'CANCELLED') {
      return sendError(res, 'Cannot verify payment for a cancelled order.', [], 400);
    }

    // Perform verification via PaymentService
    const rOrderId = razorpay_order_id || razorpayOrderId;
    const rPaymentId = razorpay_payment_id || razorpayPaymentId;
    const rSignature = razorpay_signature || razorpaySignature;

    const verificationResult = await paymentService.verifyPayment({
      order,
      scenario,
      simulationReason,
      razorpayOrderId: rOrderId,
      razorpayPaymentId: rPaymentId,
      razorpaySignature: rSignature,
      providerReference: providerReference || rPaymentId,
      mockStatus,
      paymentMethod,
    });

    // Handle Failed / Cancelled Simulation or Gateway Declines
    if (!verificationResult.success) {
      const isCancelled = verificationResult.status === 'CANCELLED';
      const orderPayStatus = isCancelled ? 'PENDING' : 'FAILED';
      const paymentDbStatus = isCancelled ? 'PENDING' : 'FAILED';

      await prisma.$transaction(async (tx) => {
        // Update Order Payment Status
        await tx.order.update({
          where: { id: orderId },
          data: {
            paymentStatus: orderPayStatus,
          },
        });

        // Update Payment Record
        if (order.payments.length > 0) {
          await tx.payment.update({
            where: { id: order.payments[0].id },
            data: {
              status: paymentDbStatus,
              metadata: JSON.stringify({
                ...verificationResult.metadata,
                error: verificationResult.error,
              }),
            },
          });
        } else {
          await tx.payment.create({
            data: {
              orderId: order.id,
              provider: verificationResult.provider || 'SIMULATOR',
              providerReference: verificationResult.providerReference || `FAIL-${Date.now()}`,
              amount: order.totalAmount,
              currency: 'INR',
              status: paymentDbStatus,
              metadata: JSON.stringify({
                ...verificationResult.metadata,
                error: verificationResult.error,
              }),
            },
          });
        }
      });

      await createAuditLog(prisma, {
        userId: req.user.id,
        action: isCancelled ? 'PAYMENT_CANCELLED' : 'PAYMENT_FAILED',
        entity: 'ORDER',
        entityId: orderId,
        metadata: {
          provider: verificationResult.provider,
          error: verificationResult.error,
          isSimulated: verificationResult.isSimulated,
        },
      });

      return sendError(
        res,
        verificationResult.error || 'Payment verification failed.',
        [],
        400
      );
    }

    // Atomic Finalization on SUCCESS: Order confirmed, Payment marked PAID, stock deducted if not already deducted, Cart cleared
    const { updatedOrder, updatedPayment } = await prisma.$transaction(async (tx) => {
      // 1. Update Order Status
      const finalizedOrder = await tx.order.update({
        where: { id: orderId },
        data: {
          paymentStatus: 'PAID',
          status: order.status === 'PENDING' ? 'CONFIRMED' : order.status,
        },
      });

      // 2. Update or Create Payment Record
      let payRecord;
      if (order.payments.length > 0) {
        payRecord = await tx.payment.update({
          where: { id: order.payments[0].id },
          data: {
            status: 'PAID',
            provider: verificationResult.provider || 'SIMULATOR',
            providerReference: verificationResult.providerReference,
            metadata: JSON.stringify(verificationResult.metadata || {}),
          },
        });
      } else {
        payRecord = await tx.payment.create({
          data: {
            orderId: order.id,
            provider: verificationResult.provider || 'SIMULATOR',
            providerReference: verificationResult.providerReference,
            amount: order.totalAmount,
            currency: 'INR',
            status: 'PAID',
            metadata: JSON.stringify(verificationResult.metadata || {}),
          },
        });
      }

      // 3. Ensure Inventory Deduction (Deduct stock once only if not already deducted)
      const existingInventoryTx = await tx.inventoryTransaction.findFirst({
        where: { reason: { contains: order.id } },
      });

      if (!existingInventoryTx) {
        for (const item of order.items) {
          const freshProd = await tx.product.findUnique({ where: { id: item.productId } });
          if (freshProd) {
            const newStock = Math.max(0, freshProd.stockQuantity - item.quantity);
            await tx.product.update({
              where: { id: freshProd.id },
              data: { stockQuantity: newStock },
            });

            await tx.inventoryTransaction.create({
              data: {
                productId: freshProd.id,
                quantityChange: -item.quantity,
                previousQuantity: freshProd.stockQuantity,
                newQuantity: newStock,
                type: 'SALE',
                reason: `Order #${order.id} payment verified deduction`,
                performedBy: req.user.id,
              },
            });
          }
        }
      }

      // 4. Clear Customer's Cart
      const cart = await tx.cart.findUnique({ where: { userId: req.user.id } });
      if (cart) {
        await tx.cartItem.deleteMany({ where: { cartId: cart.id } });
      }

      return { updatedOrder: finalizedOrder, updatedPayment: payRecord };
    });

    await createAuditLog(prisma, {
      userId: req.user.id,
      action: 'PAYMENT_VERIFIED',
      entity: 'ORDER',
      entityId: orderId,
      metadata: {
        provider: verificationResult.provider,
        providerReference: verificationResult.providerReference,
        amount: order.totalAmount,
        isSimulated: verificationResult.isSimulated,
      },
    });

    return sendSuccess(res, 'Payment verified successfully! Your order is confirmed.', {
      order: {
        ...updatedOrder,
        shippingAddress: parseJsonSafe(updatedOrder.shippingAddress),
      },
      payment: {
        ...updatedPayment,
        metadata: parseJsonSafe(updatedPayment.metadata),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Handle Webhook Events (Razorpay & Simulated Webhooks)
 */
const handleWebhook = async (req, res, next) => {
  try {
    const signature = req.headers['x-razorpay-signature'];
    const rawBody = req.rawBody || Buffer.from(JSON.stringify(req.body));

    // Verify webhook signature
    const isSignatureValid = await paymentService.verifyWebhookSignature(rawBody, signature);
    if (!isSignatureValid) {
      return res.status(400).json({ error: 'Invalid webhook signature.' });
    }

    const payload = req.body;
    const event = payload.event;
    const paymentEntity = payload.payload?.payment?.entity;
    const internalOrderId = paymentEntity?.notes?.orderId || payload.orderId;
    const razorpayPaymentId = paymentEntity?.id;
    const razorpayOrderId = paymentEntity?.order_id;

    if (event === 'payment.captured' || event === 'order.paid') {
      if (internalOrderId) {
        const order = await prisma.order.findUnique({
          where: { id: internalOrderId },
          include: { items: true },
        });

        if (order && order.paymentStatus !== 'PAID') {
          await prisma.$transaction(async (tx) => {
            await tx.order.update({
              where: { id: order.id },
              data: {
                paymentStatus: 'PAID',
                status: order.status === 'PENDING' ? 'CONFIRMED' : order.status,
              },
            });

            await tx.payment.create({
              data: {
                orderId: order.id,
                provider: 'RAZORPAY',
                providerReference: razorpayPaymentId || razorpayOrderId || `RZP-WH-${Date.now()}`,
                amount: paymentEntity?.amount ? paymentEntity.amount / 100 : order.totalAmount,
                currency: paymentEntity?.currency || 'INR',
                status: 'PAID',
                metadata: JSON.stringify(payload),
              },
            });

            // Stock deduction if not yet done
            const existingTx = await tx.inventoryTransaction.findFirst({
              where: { reason: { contains: order.id } },
            });

            if (!existingTx) {
              for (const item of order.items) {
                const prod = await tx.product.findUnique({ where: { id: item.productId } });
                if (prod) {
                  const newStock = Math.max(0, prod.stockQuantity - item.quantity);
                  await tx.product.update({
                    where: { id: prod.id },
                    data: { stockQuantity: newStock },
                  });
                  await tx.inventoryTransaction.create({
                    data: {
                      productId: prod.id,
                      quantityChange: -item.quantity,
                      previousQuantity: prod.stockQuantity,
                      newQuantity: newStock,
                      type: 'SALE',
                      reason: `Order #${order.id} webhook payment captured`,
                      performedBy: order.userId,
                    },
                  });
                }
              }
            }
          });
        }
      }
    } else if (event === 'payment.failed') {
      if (internalOrderId) {
        await prisma.order.updateMany({
          where: { id: internalOrderId, paymentStatus: 'PENDING' },
          data: { paymentStatus: 'FAILED' },
        });
      }
    }

    return res.status(200).json({ received: true, event });
  } catch (error) {
    console.error('Webhook processing error:', error.message);
    return res.status(500).json({ error: 'Webhook processing error.' });
  }
};

module.exports = {
  getPaymentConfig,
  createPaymentIntent,
  verifyPayment,
  handleWebhook,
};
