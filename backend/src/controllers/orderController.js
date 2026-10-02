const prisma = require('../config/prisma');
const paymentService = require('../services/payment/PaymentService');
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
 * Perform Atomic Checkout & Create Order
 */
const createOrder = async (req, res, next) => {
  try {
    const { addressId, shippingAddress: directAddress, paymentMethod = 'MOCK_CARD' } = req.body;

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
        country: savedAddr.country,
      };
    } else if (directAddress) {
      if (!directAddress.fullName || !directAddress.phone || !directAddress.addressLine1 || !directAddress.city || !directAddress.state || !directAddress.postalCode) {
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

    // 3. Execute Atomic Database Transaction (Order + Items + Inventory Deduction + Inventory Tx + Clear Cart)
    const orderResult = await prisma.$transaction(async (tx) => {
      let subtotal = 0;
      const orderItemsToCreate = [];
      const inventoryUpdates = [];

      for (const item of cart.items) {
        const freshProduct = await tx.product.findUnique({
          where: { id: item.productId },
        });

        if (!freshProduct || !freshProduct.active) {
          throw new Error(`Product "${freshProduct ? freshProduct.name : 'Unknown'}" is no longer available.`);
        }

        if (freshProduct.stockQuantity < item.quantity) {
          throw new Error(
            `Insufficient stock for "${freshProduct.name}". Only ${freshProduct.stockQuantity} remaining.`
          );
        }

        const authoritativePrice = freshProduct.discountPrice !== null ? freshProduct.discountPrice : freshProduct.price;
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

        // Prepare inventory reduction
        inventoryUpdates.push({
          productId: freshProduct.id,
          previousStock: freshProduct.stockQuantity,
          newStock: freshProduct.stockQuantity - item.quantity,
          quantityChange: -item.quantity,
        });
      }

      const shippingAmount = subtotal > 1500 ? 0 : 99;
      const totalAmount = subtotal + shippingAmount;

      // Create Order
      const newOrder = await tx.order.create({
        data: {
          userId: req.user.id,
          subtotal,
          discount: 0,
          shippingAmount,
          totalAmount,
          status: 'PENDING',
          paymentStatus: 'PAID', // In mock simulation, auto-mark as paid
          shippingAddress: JSON.stringify(finalShippingAddress),
          items: {
            create: orderItemsToCreate,
          },
        },
        include: {
          items: true,
        },
      });

      // Deduct inventory & record inventory transactions
      for (const inv of inventoryUpdates) {
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
            reason: `Order #${newOrder.id} checkout deduction`,
            performedBy: req.user.id,
          },
        });
      }

      // Create Payment record
      await tx.payment.create({
        data: {
          orderId: newOrder.id,
          provider: 'MOCK',
          providerReference: `MOCK-ORD-${Date.now().toString(36).toUpperCase()}`,
          amount: totalAmount,
          currency: 'INR',
          status: 'PAID',
          metadata: JSON.stringify({
            paymentMethod,
            simulated: true,
            checkoutTimestamp: new Date().toISOString(),
          }),
        },
      });

      // Clear customer's cart
      await tx.cartItem.deleteMany({
        where: { cartId: cart.id },
      });

      return newOrder;
    });

    // Audit log
    await createAuditLog(prisma, {
      userId: req.user.id,
      action: 'ORDER_PLACED',
      entity: 'ORDER',
      entityId: orderResult.id,
      metadata: { totalAmount: orderResult.totalAmount, itemsCount: orderResult.items.length },
    });

    orderResult.shippingAddress = parseJsonSafe(orderResult.shippingAddress);

    return sendSuccess(res, 'Order placed successfully! Thank you for shopping with ShopSphere.', { order: orderResult }, 201);
  } catch (error) {
    if (error.message && (error.message.includes('Insufficient stock') || error.message.includes('is no longer available'))) {
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
        payments: true,
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
        payments: true,
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
      include: { items: true },
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

      // Restore inventory
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

    return sendSuccess(res, 'Order has been successfully cancelled and refunded.', { order: updatedOrder });
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
