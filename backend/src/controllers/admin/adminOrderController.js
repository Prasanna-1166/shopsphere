const prisma = require('../../config/prisma');
const { sendSuccess, sendError } = require('../../utils/response');
const { createAuditLog } = require('../../utils/auditLogger');

/**
 * Valid Status Transitions Matrix
 */
const VALID_TRANSITIONS = {
  PENDING: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['PROCESSING', 'CANCELLED'],
  PROCESSING: ['SHIPPED', 'CANCELLED'],
  SHIPPED: ['DELIVERED'],
  DELIVERED: [],
  CANCELLED: [],
};

/**
 * Get Orders for Admin with Filtering and Pagination
 */
const getAdminOrders = async (req, res, next) => {
  try {
    const {
      search,
      status,
      paymentStatus,
      page = 1,
      limit = 15,
      sortBy = 'newest',
    } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const take = Math.min(100, Math.max(1, parseInt(limit, 10) || 15));
    const skip = (pageNum - 1) * take;

    const where = {};

    if (search && search.trim()) {
      const q = search.trim();
      where.OR = [
        { id: { contains: q } },
        { user: { name: { contains: q } } },
        { user: { email: { contains: q } } },
      ];
    }

    if (status) {
      where.status = status;
    }

    if (paymentStatus) {
      where.paymentStatus = paymentStatus;
    }

    const total = await prisma.order.count({ where });
    const orders = await prisma.order.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, email: true } },
        items: true,
        payments: { take: 1, orderBy: { createdAt: 'desc' } },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take,
    });

    return sendSuccess(res, 'Orders fetched.', {
      orders,
      pagination: {
        total,
        page: pageNum,
        limit: take,
        totalPages: Math.ceil(total / take),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get Complete Order Details for Admin
 */
const getAdminOrderDetails = async (req, res, next) => {
  try {
    const { id } = req.params;

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            status: true,
            createdAt: true,
          },
        },
        items: {
          include: {
            product: {
              include: { images: { take: 1, orderBy: { sortOrder: 'asc' } } },
            },
          },
        },
        payments: true,
      },
    });

    if (!order) {
      return sendError(res, 'Order not found.', [], 404);
    }

    // Get audit logs for this order
    const logs = await prisma.auditLog.findMany({
      where: { entity: 'ORDER', entityId: id },
      include: { user: { select: { name: true, role: true } } },
      orderBy: { createdAt: 'desc' },
    });

    return sendSuccess(res, 'Order details fetched.', { order, auditLogs: logs });
  } catch (error) {
    next(error);
  }
};

/**
 * Update Order Status with strict state machine validation
 */
const updateOrderStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status: newStatus, paymentStatus, note } = req.body;

    if (!newStatus && !paymentStatus) {
      return sendError(res, 'Target order status or payment status is required.', [], 400);
    }

    const order = await prisma.order.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!order) {
      return sendError(res, 'Order not found.', [], 404);
    }

    // If newStatus is provided, validate state machine
    if (newStatus && newStatus !== order.status) {
      const allowedNext = VALID_TRANSITIONS[order.status] || [];
      if (!allowedNext.includes(newStatus)) {
        return sendError(
          res,
          `Invalid state transition. Cannot move from ${order.status} to ${newStatus}. Permitted: [${allowedNext.join(', ')}]`,
          [],
          400
        );
      }

      // Fulfillment guard: Do not dispatch or deliver online orders unless payment is PAID
      if (['SHIPPED', 'DELIVERED'].includes(newStatus)) {
        const activePayment = await prisma.payment.findFirst({
          where: { orderId: id },
          orderBy: { createdAt: 'desc' },
        });
        const isCod = activePayment?.provider === 'COD';
        if (order.paymentStatus !== 'PAID' && !isCod) {
          return sendError(
            res,
            `Cannot transition order #${id} to ${newStatus}: Payment status is ${order.paymentStatus}. Orders must be legitimately paid before fulfillment.`,
            [],
            400
          );
        }
      }
    }

    const updateData = {};
    if (newStatus) updateData.status = newStatus;
    if (paymentStatus) updateData.paymentStatus = paymentStatus;

    const updated = await prisma.$transaction(async (tx) => {
      // If moving to CANCELLED, restore stock
      if (newStatus === 'CANCELLED' && order.status !== 'CANCELLED') {
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
                reason: `Admin cancelled order #${id}: ${note || 'Admin order update'}`,
                performedBy: req.user.id,
              },
            });
          }
        }
      }

      return tx.order.update({
        where: { id },
        data: updateData,
        include: { user: true, items: true, payments: true },
      });
    });

    // Record audit log
    await createAuditLog(prisma, {
      userId: req.user.id,
      action: 'ORDER_STATUS_UPDATE',
      entity: 'ORDER',
      entityId: id,
      metadata: {
        previousStatus: order.status,
        newStatus: newStatus || order.status,
        previousPaymentStatus: order.paymentStatus,
        newPaymentStatus: paymentStatus || order.paymentStatus,
        note,
      },
    });

    return sendSuccess(res, 'Order status updated successfully.', { order: updated });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAdminOrders,
  getAdminOrderDetails,
  updateOrderStatus,
};
