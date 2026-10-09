const prisma = require('../config/prisma');
const paymentService = require('../services/payment/PaymentService');
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
 * Perform Server-Side Authorized Checkout & Create Order
 */
const createOrder = async (req, res, next) => {
  try {
    const { addressId, shippingAddress: directAddress, paymentMethod = 'RAZORPAY', autoConfirmMock = false } = req.body;

    // 1. Resolve Shipping Address snapshot
    let finalShippingAddress = null;

    if (addressId) {
      const savedAddr = await prisma.address.findUnique({
        where: { id: addressId },
      });
      if (!savedAddr || savedAddr.userId !== req.user.id) {
        return sendError(res, 'Specified shipping address is invalid.', [], 400);
      }
      finalShippingAddress = {
        fullName: savedAddr.fullName,
        phone: savedAddr.phone,
        addressLine1: savedAddr.addressLine1,
        addressLine2: savedAddr.addressLine2,
        city: savedAddr.city,
        state: savedAddr.state,
        postalCode: savedAddr.postalCode,
        country: savedAddr.country || 'India',
      };
    } else if (directAddress) {
      if (
        !directAddress.fullName ||
        !directAddress.phone ||
        !directAddress.addressLine1 ||
        !directAddress.city ||
        !directAddress.state ||
        !directAddress.postalCode
      ) {
        return sendError(res, 'Complete shipping address details are required.', [], 400);
      }
      finalShippingAddress = {
        fullName: directAddress.fullName,
        phone: directAddress.phone,
        addressLine1: directAddress.addressLine1,
        addressLine2: directAddress.addressLine2 || null,
        city: directAddress.city,
        state: directAddress.state,
        postalCode: directAddress.postalCode,
        country: directAddress.country || 'India',
      };
    } else {
      return sendError(res, 'Shipping address is required to place an order.', [], 400);
    }

    // 2. Fetch Customer Cart
    const cart = await prisma.cart.findUnique({
      where: { userId: req.user.id },
      include: {
        items: {
          include: { product: true },
        },
      },
    });

    if (!cart || !cart.items || cart.items.length === 0) {
      return sendError(res, 'Your shopping cart is empty. Add products to cart before checkout.', [], 400);
    }

    // 3. Recalculate Subtotal, check stock, and prepare order items
    let subtotal = 0;
    const orderItemsToCreate = [];
    const inventoryDeductions = [];

    for (const item of cart.items) {
      const freshProduct = await prisma.product.findUnique({
        where: { id: item.productId },
      });

      if (!freshProduct || !freshProduct.active) {
        return sendError(
          res,
          `Product "${freshProduct ? freshProduct.name : 'Unknown'}" is no longer available.`,
          [],
          400
        );
      }

      if (freshProduct.stockQuantity < item.quantity) {
        return sendError(
          res,
          `Insufficient stock for "${freshProduct.name}". Only ${freshProduct.stockQuantity} remaining.`,
          [],
          400
        );
      }

      const authoritativePrice =
        freshProduct.discountPrice !== null ? freshProduct.discountPrice : freshProduct.price;
      const itemSubtotal = authoritativePrice * item.quantity;
      subtotal += itemSubtotal;

      orderItemsToCreate.push({
        productId: freshProduct.id,
        productName: freshProduct.name,
        sku: freshProduct.sku,
        unitPrice: authoritativePrice,
        quantity: item.quantity,
        subtotal: itemSubtotal,
      });

      inventoryDeductions.push({
        productId: freshProduct.id,
        quantityChange: -item.quantity,
        previousStock: freshProduct.stockQuantity,
        newStock: freshProduct.stockQuantity - item.quantity,
      });
    }

    const shippingAmount = subtotal > 1500 ? 0 : 99;
    const totalAmount = subtotal + shippingAmount;

    const isCod = paymentMethod === 'COD' || paymentMethod === 'CASH_ON_DELIVERY';
    const isMockAutoPay = autoConfirmMock && (config.payment.provider === 'MOCK' || paymentMethod === 'MOCK_CARD');

    // 4. Create Order in Database Transaction
    const orderResult = await prisma.$transaction(async (tx) => {
      const newOrder = await tx.order.create({
        data: {
          userId: req.user.id,
          subtotal,
          discount: 0,
          shippingAmount,
          totalAmount,
          status: isCod ? 'CONFIRMED' : isMockAutoPay ? 'CONFIRMED' : 'PENDING',
          paymentStatus: isMockAutoPay ? 'PAID' : 'PENDING',
          shippingAddress: JSON.stringify(finalShippingAddress),
          items: {
            create: orderItemsToCreate,
          },
        },
        include: {
          items: true,
        },
      });

      // If Cash On Delivery or Mock Auto Pay, deduct inventory immediately and clear cart
      if (isCod || isMockAutoPay) {
        for (const inv of inventoryDeductions) {
          await tx.product.update({
            where: { id: inv.productId },
            data: { stockQuantity: inv.newStock },
          });

          await tx.inventoryTransaction.create({
            data: {
              productId: inv.productId,
              quantityChange: inv.quantityChange,
              previousQuantity: inv.previousStock,
              newQuantity: inv.newStock,
              type: 'SALE',
              reason: `Order #${newOrder.id} ${isCod ? 'COD' : 'mock'} checkout deduction`,
              performedBy: req.user.id,
            },
          });
        }

        await tx.payment.create({
          data: {
            orderId: newOrder.id,
            provider: isCod ? 'COD' : 'MOCK',
            providerReference: isCod ? `COD-${newOrder.id.slice(-8).toUpperCase()}` : `MOCK-TXN-${Date.now()}`,
            amount: totalAmount,
            currency: 'INR',
            status: isMockAutoPay ? 'PAID' : 'PENDING',
            metadata: JSON.stringify({
              paymentMethod: isCod ? 'Cash on Delivery' : 'Mock Card',
              timestamp: new Date().toISOString(),
            }),
          },
        });

        // Clear cart
        await tx.cartItem.deleteMany({
          where: { cartId: cart.id },
        });
      }

      return newOrder;
    });

    // 5. If Online Payment (Razorpay or Mock with verification flow), create payment intent
    let paymentIntent = null;
    let paymentRequired = false;

    if (!isCod && !isMockAutoPay) {
      paymentRequired = true;
      try {
        paymentIntent = await paymentService.createPaymentIntent(orderResult, {
          paymentMethod,
          addressId,
        });

        // Persist payment intent record
        await prisma.payment.create({
          data: {
            orderId: orderResult.id,
            provider: paymentIntent.provider,
            providerReference: paymentIntent.providerReference || paymentIntent.razorpayOrderId,
            amount: totalAmount,
            currency: paymentIntent.currency || 'INR',
            status: 'PENDING',
            metadata: JSON.stringify(paymentIntent.metadata || {}),
          },
        });
      } catch (intentErr) {
        console.error('Payment intent generation error:', intentErr.message);
        return sendError(res, intentErr.message || 'Failed to initialize payment gateway order.', [], 500);
      }
    }

    // 6. Audit Log
    await createAuditLog(prisma, {
      userId: req.user.id,
      action: 'ORDER_PLACED',
      entity: 'ORDER',
      entityId: orderResult.id,
      metadata: {
        totalAmount: orderResult.totalAmount,
        itemsCount: orderResult.items.length,
        paymentMethod,
        isCod,
      },
    });

    orderResult.shippingAddress = parseJsonSafe(orderResult.shippingAddress);

    return sendSuccess(
      res,
      isCod ? 'Order placed successfully with Cash on Delivery.' : 'Order initialized. Complete payment to confirm.',
      {
        order: orderResult,
        paymentIntent,
        paymentRequired,
      },
      201
    );
  } catch (error) {
    if (
      error.message &&
      (error.message.includes('Insufficient stock') || error.message.includes('is no longer available'))
    ) {
      return sendError(res, error.message, [], 400);
    }
    next(error);
  }
};

/**
 * Get Authenticated Customer Order History
 */
const getMyOrders = async (req, res, next) => {
  try {
    const orders = await prisma.order.findMany({
      where: { userId: req.user.id },
      include: {
        items: {
          include: {
            product: {
              include: { images: { orderBy: { sortOrder: 'asc' }, take: 1 } },
            },
          },
        },
        payments: { orderBy: { createdAt: 'desc' } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const parsedOrders = orders.map((o) => ({
      ...o,
      shippingAddress: parseJsonSafe(o.shippingAddress),
      payments: o.payments.map((p) => ({ ...p, metadata: parseJsonSafe(p.metadata) })),
    }));

    return sendSuccess(res, 'Orders fetched successfully.', { orders: parsedOrders });
  } catch (error) {
    next(error);
  }
};

/**
 * Get Order Details by ID (IDOR Protected)
 */
const getOrderById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            product: {
              include: { images: { orderBy: { sortOrder: 'asc' }, take: 1 } },
            },
          },
        },
        payments: { orderBy: { createdAt: 'desc' } },
      },
    });

    if (!order || order.userId !== req.user.id) {
      return sendError(res, 'Order not found.', [], 404);
    }

    const parsedOrder = {
      ...order,
      shippingAddress: parseJsonSafe(order.shippingAddress),
      payments: order.payments.map((p) => ({ ...p, metadata: parseJsonSafe(p.metadata) })),
    };

    return sendSuccess(res, 'Order details fetched.', { order: parsedOrder });
  } catch (error) {
    next(error);
  }
};

/**
 * Cancel Order by Customer
 */
const cancelOrder = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason = 'Cancelled by customer' } = req.body;

    const order = await prisma.order.findUnique({
      where: { id },
      include: { items: true, payments: true },
    });

    if (!order || order.userId !== req.user.id) {
      return sendError(res, 'Order not found.', [], 404);
    }

    const cancellableStatuses = ['PENDING', 'CONFIRMED'];
    if (!cancellableStatuses.includes(order.status)) {
      return sendError(
        res,
        `This order cannot be cancelled because its current status is "${order.status}".`,
        [],
        400
      );
    }

    const updatedOrder = await prisma.$transaction(async (tx) => {
      const cancelled = await tx.order.update({
        where: { id },
        data: {
          status: 'CANCELLED',
          paymentStatus: order.paymentStatus === 'PAID' ? 'REFUNDED' : order.paymentStatus,
        },
      });

      // Restore inventory only if inventory was previously deducted
      const inventoryTx = await tx.inventoryTransaction.findFirst({
        where: { reason: { contains: id } },
      });

      if (inventoryTx) {
        for (const item of order.items) {
          const prod = await tx.product.findUnique({ where: { id: item.productId } });
          if (prod) {
            const newStock = prod.stockQuantity + item.quantity;
            await tx.product.update({
              where: { id: prod.id },
              data: { stockQuantity: newStock },
            });

            await tx.inventoryTransaction.create({
              data: {
                productId: prod.id,
                quantityChange: item.quantity,
                previousQuantity: prod.stockQuantity,
                newQuantity: newStock,
                type: 'CANCELLATION_RESTORE',
                reason: `Order #${id} cancellation restoration: ${reason}`,
                performedBy: req.user.id,
              },
            });
          }
        }
      }

      return cancelled;
    });

    await createAuditLog(prisma, {
      userId: req.user.id,
      action: 'ORDER_CANCELLED',
      entity: 'ORDER',
      entityId: id,
      metadata: { reason, previousStatus: order.status },
    });

    updatedOrder.shippingAddress = parseJsonSafe(updatedOrder.shippingAddress);

    return sendSuccess(res, 'Order has been successfully cancelled.', { order: updatedOrder });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createOrder,
  getMyOrders,
  getOrderById,
  cancelOrder,
};
