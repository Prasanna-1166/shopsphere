const prisma = require('../../config/prisma');
const config = require('../../config');
const paymentService = require('../../services/payment/PaymentService');
const { sendSuccess } = require('../../utils/response');

/**
 * Get Real Database Aggregated Metrics for Admin Dashboard
 * Strictly excludes simulated / local test payments from real revenue metrics.
 */
const getDashboardMetrics = async (req, res, next) => {
  try {
    // 1. Fetch Paid Orders to Separate Real Gateway Revenue vs Simulated Test Volume
    const paidOrders = await prisma.order.findMany({
      where: { paymentStatus: 'PAID' },
      include: {
        payments: {
          take: 1,
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    let realRevenue = 0;
    let simulatedRevenue = 0;
    let realPaidOrdersCount = 0;
    let simulatedOrdersCount = 0;

    for (const order of paidOrders) {
      const provider = order.payments?.[0]?.provider || 'SIMULATOR';
      if (provider === 'RAZORPAY' || provider === 'STRIPE') {
        realRevenue += order.totalAmount;
        realPaidOrdersCount++;
      } else {
        // SIMULATOR or MOCK
        simulatedRevenue += order.totalAmount;
        simulatedOrdersCount++;
      }
    }

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
        payments: { select: { provider: true, status: true, providerReference: true }, take: 1 },
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

    return sendSuccess(res, 'Dashboard metrics fetched.', {
      overview: {
        totalRevenue: realRevenue, // Real financial revenue only
        realRevenue,
        simulatedRevenue,
        realPaidOrdersCount,
        simulatedOrdersCount,
        paymentMode: paymentService.getProviderName(),
        isSimulationMode: paymentService.isSimulated(),
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
