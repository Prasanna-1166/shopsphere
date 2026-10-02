const prisma = require('../config/prisma');
const { sendSuccess, sendError } = require('../utils/response');

/**
 * Get Authenticated Customer's Wishlist
 */
const getWishlist = async (req, res, next) => {
  try {
    const wishlist = await prisma.wishlist.findMany({
      where: { userId: req.user.id },
      include: {
        product: {
          include: {
            images: { orderBy: { sortOrder: 'asc' } },
            category: { select: { id: true, name: true, slug: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const items = wishlist.map((item) => ({
      id: item.id,
      productId: item.productId,
      createdAt: item.createdAt,
      product: item.product,
    }));

    return sendSuccess(res, 'Wishlist fetched successfully.', { items });
  } catch (error) {
    next(error);
  }
};

/**
 * Toggle Product in Wishlist (Add if absent, Remove if present)
 */
const toggleWishlist = async (req, res, next) => {
  try {
    const { productId } = req.body;

    if (!productId) {
      return sendError(res, 'Product ID is required.', [], 400);
    }

    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product || !product.active) {
      return sendError(res, 'Product not found.', [], 404);
    }

    const existing = await prisma.wishlist.findUnique({
      where: {
        userId_productId: {
          userId: req.user.id,
          productId,
        },
      },
    });

    if (existing) {
      await prisma.wishlist.delete({
        where: { id: existing.id },
      });
      return sendSuccess(res, 'Removed from wishlist.', { inWishlist: false, productId });
    } else {
      await prisma.wishlist.create({
        data: {
          userId: req.user.id,
          productId,
        },
      });
      return sendSuccess(res, 'Added to wishlist.', { inWishlist: true, productId });
    }
  } catch (error) {
    next(error);
  }
};

/**
 * Remove Item from Wishlist
 */
const removeFromWishlist = async (req, res, next) => {
  try {
    const { productId } = req.params;

    const existing = await prisma.wishlist.findUnique({
      where: {
        userId_productId: {
          userId: req.user.id,
          productId,
        },
      },
    });

    if (!existing) {
      return sendError(res, 'Item not found in wishlist.', [], 404);
    }

    await prisma.wishlist.delete({
      where: { id: existing.id },
    });

    return sendSuccess(res, 'Item removed from wishlist.', { productId });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getWishlist,
  toggleWishlist,
  removeFromWishlist,
};
