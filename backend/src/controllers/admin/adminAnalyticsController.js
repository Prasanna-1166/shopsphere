const prisma = require('../../config/prisma');
const { sendSuccess } = require('../../utils/response');

/**
 * Get Comprehensive Store Analytics with Server-side Aggregation
 */
const getAnalytics = async (req, res, next) => {
  try {
    // 1. Total Revenue & Total Paid Orders
    const revenueAggregate = await prisma.order.aggregate({
      _sum: { totalAmount: true },
      _count: { id: true },
      _avg: { totalAmount: true },
      where: { paymentStatus: 'PAID' },
    });

    // 2. Orders Grouped by Status
    const ordersByStatus = await prisma.order.groupBy({
      by: ['status'],
      _count: { id: true },
    });

    // 3. Top Selling Products
    const topProductsSold = await prisma.orderItem.groupBy({
      by: ['productId', 'productName'],
      _sum: { quantity: true, subtotal: true },
      orderBy: { _sum: { quantity: 'desc' } },
      take: 6,
    });

    // 4. Sales Grouped by Category (via Product Category relations)
    const salesByCategory = await prisma.category.findMany({
      select: {
        id: true,
        name: true,
        products: {
          select: {
            orderItems: {
              select: { subtotal: true, quantity: true },
            },
          },
        },
      },
    });

    // 5. Customer Registration count
    const customerGrowth = await prisma.user.count({
      where: { role: 'CUSTOMER' },
    });

    // 6. Recent 30 days orders for trend
    const recentOrdersList = await prisma.order.findMany({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        },
      },
      select: {
        id: true,
        totalAmount: true,
        status: true,
        paymentStatus: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    const totalRevenue = revenueAggregate._sum.totalAmount || 0;
    const totalPaidOrders = revenueAggregate._count.id || 0;
    const averageOrderValue = totalPaidOrders > 0 ? (revenueAggregate._avg.totalAmount || 0) : 0;

    // Process Category Breakdown
    const categoryBreakdown = salesByCategory.map((cat) => {
      let catRevenue = 0;
      let catUnits = 0;
      cat.products.forEach((p) => {
        p.orderItems.forEach((oi) => {
          catRevenue += oi.subtotal;
          catUnits += oi.quantity;
        });
      });
      return {
        categoryId: cat.id,
        categoryName: cat.name,
        revenue: catRevenue,
        unitsSold: catUnits,
      };
    });

    // Group 30-day trends by date
    const dailyMap = {};
    recentOrdersList.forEach((ord) => {
      const dateStr = ord.createdAt.toISOString().split('T')[0];
      if (!dailyMap[dateStr]) {
        dailyMap[dateStr] = { date: dateStr, revenue: 0, ordersCount: 0 };
      }
      dailyMap[dateStr].ordersCount += 1;
      if (ord.paymentStatus === 'PAID') {
        dailyMap[dateStr].revenue += ord.totalAmount;
      }
    });

    const revenueTrends = Object.values(dailyMap);

    return sendSuccess(res, 'Analytics fetched.', {
      summary: {
        totalRevenue,
        totalPaidOrders,
        averageOrderValue: Math.round(averageOrderValue),
        totalCustomers: customerGrowth,
      },
      ordersByStatus: ordersByStatus.map((s) => ({
        status: s.status,
        count: s._count.id,
      })),
      topProducts: topProductsSold.map((p) => ({
        productId: p.productId,
        productName: p.productName,
        unitsSold: p._sum.quantity || 0,
        revenue: p._sum.subtotal || 0,
      })),
      categoryBreakdown,
      revenueTrends,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAnalytics,
};
