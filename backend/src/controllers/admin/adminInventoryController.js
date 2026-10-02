const prisma = require('../../config/prisma');
const { sendSuccess, sendError } = require('../../utils/response');
const { createAuditLog } = require('../../utils/auditLogger');

/**
 * Get Inventory Items with Stock Overview & Alerts
 */
const getInventory = async (req, res, next) => {
  try {
    const { search, lowStockOnly, page = 1, limit = 20 } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const take = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * take;

    const where = {};
    if (search && search.trim()) {
      const q = search.trim();
      where.OR = [
        { name: { contains: q } },
        { sku: { contains: q } },
      ];
    }

    if (lowStockOnly === 'true' || lowStockOnly === true) {
      where.stockQuantity = { lte: 5 };
    }

    const [total, products] = await Promise.all([
      prisma.product.count({ where }),
      prisma.product.findMany({
        where,
        select: {
          id: true,
          name: true,
          sku: true,
          price: true,
          stockQuantity: true,
          active: true,
          category: { select: { name: true } },
          updatedAt: true,
          _count: { select: { inventoryTransactions: true } },
        },
        orderBy: { stockQuantity: 'asc' },
        skip,
        take,
      }),
    ]);

    return sendSuccess(res, 'Inventory items fetched.', {
      inventory: products,
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
 * Manually Adjust Inventory Stock
 * Never allows negative stock and records an immutable InventoryTransaction
 */
const adjustStock = async (req, res, next) => {
  try {
    const { productId, changeAmount, newQuantity, reason = 'Manual inventory adjustment' } = req.body;

    if (!productId) {
      return sendError(res, 'Product ID is required.', [], 400);
    }

    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      return sendError(res, 'Product not found.', [], 404);
    }

    let calculatedNewQuantity;
    let actualChange;

    if (newQuantity !== undefined) {
      calculatedNewQuantity = parseInt(newQuantity, 10);
      actualChange = calculatedNewQuantity - product.stockQuantity;
    } else if (changeAmount !== undefined) {
      actualChange = parseInt(changeAmount, 10);
      calculatedNewQuantity = product.stockQuantity + actualChange;
    } else {
      return sendError(res, 'Either changeAmount or newQuantity must be provided.', [], 400);
    }

    if (isNaN(calculatedNewQuantity) || calculatedNewQuantity < 0) {
      return sendError(res, 'Resulting stock quantity cannot be negative.', [], 400);
    }

    const result = await prisma.$transaction(async (tx) => {
      const updatedProduct = await tx.product.update({
        where: { id: productId },
        data: { stockQuantity: calculatedNewQuantity },
      });

      const transaction = await tx.inventoryTransaction.create({
        data: {
          productId,
          quantityChange: actualChange,
          previousQuantity: product.stockQuantity,
          newQuantity: calculatedNewQuantity,
          type: 'MANUAL_ADJUSTMENT',
          reason: reason.trim(),
          performedBy: req.user.id,
        },
      });

      return { updatedProduct, transaction };
    });

    await createAuditLog(prisma, {
      userId: req.user.id,
      action: 'INVENTORY_ADJUST',
      entity: 'PRODUCT',
      entityId: productId,
      metadata: {
        previousQuantity: product.stockQuantity,
        newQuantity: calculatedNewQuantity,
        change: actualChange,
        reason,
      },
    });

    return sendSuccess(res, 'Inventory adjusted successfully.', result);
  } catch (error) {
    next(error);
  }
};

/**
 * Get Inventory Transaction History
 */
const getInventoryHistory = async (req, res, next) => {
  try {
    const { productId, page = 1, limit = 20 } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const take = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * take;

    const where = {};
    if (productId) {
      where.productId = productId;
    }

    const [total, transactions] = await Promise.all([
      prisma.inventoryTransaction.count({ where }),
      prisma.inventoryTransaction.findMany({
        where,
        include: {
          product: { select: { name: true, sku: true } },
          user: { select: { name: true, email: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
    ]);

    return sendSuccess(res, 'Inventory history fetched.', {
      transactions,
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

module.exports = {
  getInventory,
  adjustStock,
  getInventoryHistory,
};
