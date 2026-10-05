const prisma = require('../../config/prisma');
const { sendSuccess, sendError } = require('../../utils/response');
const { createAuditLog } = require('../../utils/auditLogger');

/**
 * Get Customers List with Spend Summary
 */
const getAdminCustomers = async (req, res, next) => {
  try {
    const { search, status, page = 1, limit = 15 } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const take = Math.min(100, Math.max(1, parseInt(limit, 10) || 15));
    const skip = (pageNum - 1) * take;

    const where = {
      role: 'CUSTOMER', // Only list regular customers
    };

    if (search && search.trim()) {
      const q = search.trim();
      where.OR = [
        { name: { contains: q } },
        { email: { contains: q } },
      ];
    }

    if (status) {
      where.status = status;
    }

    const total = await prisma.user.count({ where });
    const customers = await prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        status: true,
        createdAt: true,
        _count: {
          select: { orders: true },
        },
        orders: {
          where: { paymentStatus: 'PAID' },
          select: { totalAmount: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take,
    });

    const enrichedCustomers = customers.map((c) => {
      const totalSpent = c.orders.reduce((sum, ord) => sum + ord.totalAmount, 0);
      return {
        id: c.id,
        name: c.name,
        email: c.email,
        status: c.status,
        createdAt: c.createdAt,
        totalOrders: c._count.orders,
        totalSpent,
      };
    });

    return sendSuccess(res, 'Customers fetched.', {
      customers: enrichedCustomers,
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
 * Get Customer Profile & Order History Details
 */
const getAdminCustomerDetails = async (req, res, next) => {
  try {
    const { id } = req.params;

    const customer = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        createdAt: true,
        addresses: {
          orderBy: { isDefault: 'desc' },
        },
        orders: {
          include: {
            items: true,
            payments: true,
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!customer) {
      return sendError(res, 'Customer not found.', [], 404);
    }

    const totalSpent = customer.orders
      .filter((o) => o.paymentStatus === 'PAID')
      .reduce((sum, o) => sum + o.totalAmount, 0);

    return sendSuccess(res, 'Customer details fetched.', {
      customer: {
        ...customer,
        totalSpent,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Toggle Customer Account Status (ACTIVE / SUSPENDED)
 * Strictly enforces that ordinary ADMIN cannot modify ADMIN or SUPER_ADMIN users
 */
const toggleCustomerStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status: targetStatus } = req.body;

    const targetUser = await prisma.user.findUnique({
      where: { id },
    });

    if (!targetUser) {
      return sendError(res, 'User not found.', [], 404);
    }

    // Protection rule: Cannot modify other admins unless you are SUPER_ADMIN
    if ((targetUser.role === 'ADMIN' || targetUser.role === 'SUPER_ADMIN') && req.user.role !== 'SUPER_ADMIN') {
      return sendError(res, 'Forbidden. You do not have permission to modify administrative accounts.', [], 403);
    }

    // Protection rule: Cannot suspend own account
    if (targetUser.id === req.user.id) {
      return sendError(res, 'You cannot modify the status of your own account.', [], 400);
    }

    const nextStatus = targetStatus || (targetUser.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE');

    const updated = await prisma.user.update({
      where: { id },
      data: { status: nextStatus },
      select: { id: true, name: true, email: true, status: true, role: true },
    });

    await createAuditLog(prisma, {
      userId: req.user.id,
      action: 'USER_STATUS_TOGGLE',
      entity: 'USER',
      entityId: id,
      metadata: { previousStatus: targetUser.status, newStatus: nextStatus },
    });

    return sendSuccess(res, `Account status updated to ${nextStatus}.`, { user: updated });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAdminCustomers,
  getAdminCustomerDetails,
  toggleCustomerStatus,
};
