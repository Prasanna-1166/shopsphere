const prisma = require('../../config/prisma');
const { sendSuccess } = require('../../utils/response');

/**
 * Get Real Database Aggregated Metrics for Admin Dashboard
 */
const getDashboardMetrics = async (req, res, next) => {
  try {
    // 1. Total Revenue from Paid Orders
    const revenueAggregate = await prisma.order.aggregate({
      _sum: { totalAmount: true },
      where: { paymentStatus: 'PAID' },
    });

    // 2. Total Orders Count
    const totalOrders = await prisma.order.count();

    // 3. Total Customers Count
    const totalCustomers = await prisma.user.count({
      where: { role: 'CUSTOMER' },
    });

    // 4. Total Products Count
    const totalProducts = await prisma.product.count();

    // 5. Pending Orders
    const pendingOrders = await prisma.order.count({
      where: { status: 'PENDING' },
    });

    // 6. Low Stock Products (<= 5)
    const lowStockProductsCount = await prisma.product.count({
      where: { stockQuantity: { lte: 5 }, active: true },
    });

    // 7. Recent 6 Orders
    const recentOrders = await prisma.order.findMany({
      take: 6,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, name: true, email: true } },
        items: { select: { id: true, productName: true, quantity: true, unitPrice: true } },
      },
    });

    // 8. Aggregation for Top Products
    const topOrderItems = await prisma.orderItem.groupBy({
      by: ['productId', 'productName', 'sku'],
      _sum: { quantity: true, subtotal: true },
      orderBy: {
        _sum: { quantity: 'desc' },
      },
      take: 5,
    });

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
