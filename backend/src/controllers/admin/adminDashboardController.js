const prisma = require('../../config/prisma');
const { sendSuccess } = require('../../utils/response');

/**
 * Get Real Database Aggregated Metrics for Admin Dashboard
 */
const getDashboardMetrics = async (req, res, next) => {
  try {
    const [
      revenueAggregate,
      totalOrders,
      totalCustomers,
      totalProducts,
      pendingOrders,
      lowStockProductsCount,
      recentOrders,
      topOrderItems,
    ] = await Promise.all([
      // Total Revenue from Paid Orders
      prisma.order.aggregate({
        _sum: { totalAmount: true },
        where: { paymentStatus: 'PAID' },
      }),
      // Total Orders Count
      prisma.order.count(),
      // Total Customers Count
      prisma.user.count({
        where: { role: 'CUSTOMER' },
      }),
      // Total Products Count
      prisma.product.count(),
      // Pending Orders
      prisma.order.count({
        where: { status: 'PENDING' },
      }),
      // Low Stock Products (<= 5)
      prisma.product.count({
        where: { stockQuantity: { lte: 5 }, active: true },
      }),
      // Recent 6 Orders
      prisma.order.findMany({
        take: 6,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, name: true, email: true } },
          items: { select: { id: true, productName: true, quantity: true, unitPrice: true } },
        },
      }),
      // Aggregation for Top Products
      prisma.orderItem.groupBy({
        by: ['productId', 'productName', 'sku'],
        _sum: { quantity: true, subtotal: true },
        orderBy: {
          _sum: { quantity: 'desc' },
        },
        take: 5,
      }),
    ]);

    const totalRevenue = revenueAggregate._sum.totalAmount || 0;

    return sendSuccess(res, 'Dashboard metrics fetched.', {
      overview: {
        totalRevenue,
        totalOrders,
        totalCustomers,
        totalProducts,
        pendingOrders,
        lowStockProductsCount,
      },
      recentOrders,
      topProducts: topOrderItems.map((item) => ({
        productId: item.productId,
        productName: item.productName,
        sku: item.sku,
        totalUnitsSold: item._sum.quantity || 0,
        totalRevenue: item._sum.subtotal || 0,
      })),
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboardMetrics,
};
