const prisma = require('../config/prisma');
const { sendSuccess, sendError } = require('../utils/response');

/**
 * Helper to calculate authoritative cart totals from database
 */
const calculateCartTotals = (items) => {
  let subtotal = 0;
  let totalSavings = 0;
  let totalQuantity = 0;

  const enrichedItems = items.map((item) => {
    const product = item.product;
    const effectivePrice = product.discountPrice !== null ? product.discountPrice : product.price;
    const itemSubtotal = effectivePrice * item.quantity;
    const regularSubtotal = product.price * item.quantity;
    const itemSavings = regularSubtotal - itemSubtotal;

    subtotal += itemSubtotal;
    totalSavings += itemSavings;
    totalQuantity += item.quantity;

    return {
      id: item.id,
      productId: item.productId,
      quantity: item.quantity,
      unitPrice: effectivePrice,
      regularPrice: product.price,
      discountPrice: product.discountPrice,
      itemSubtotal,
      inStock: product.stockQuantity >= item.quantity,
      availableStock: product.stockQuantity,
      product: {
        id: product.id,
        name: product.name,
        slug: product.slug,
        sku: product.sku,
        active: product.active,
        images: product.images,
        category: product.category,
      },
    };
  });

  const shipping = subtotal > 1500 || subtotal === 0 ? 0 : 99; // Free shipping over 1500
  const finalTotal = subtotal + shipping;

  return {
    items: enrichedItems,
    summary: {
      subtotal,
      totalSavings,
      shipping,
      finalTotal,
      totalQuantity,
      isFreeShipping: shipping === 0 && subtotal > 0,
    },
  };
};

/**
 * Get Authenticated Customer Cart
 */
const getCart = async (req, res, next) => {
  try {
    let cart = await prisma.cart.findUnique({
      where: { userId: req.user.id },
      include: {
        items: {
          include: {
            product: {
              include: {
                images: { orderBy: { sortOrder: 'asc' } },
                category: { select: { id: true, name: true, slug: true } },
              },
            },
          },
          orderBy: { id: 'asc' },
        },
      },
    });

    if (!cart) {
      cart = await prisma.cart.create({
        data: { userId: req.user.id },
        include: { items: true },
      });
    }

    const { items, summary } = calculateCartTotals(cart.items || []);

    return sendSuccess(res, 'Cart fetched successfully.', {
      cartId: cart.id,
      items,
      summary,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Add Item to Cart
 */
const addToCart = async (req, res, next) => {
  try {
    const { productId, quantity = 1 } = req.body;

    if (!productId) {
      return sendError(res, 'Product ID is required.', [], 400);
    }

    const qty = Math.max(1, parseInt(quantity, 10) || 1);

    // 1. Verify product exists, active and check stock
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product || !product.active) {
      return sendError(res, 'Product is unavailable or out of stock.', [], 404);
    }

    if (product.stockQuantity < 1) {
      return sendError(res, 'This product is currently out of stock.', [], 400);
    }

    // 2. Find or create user cart
    let cart = await prisma.cart.findUnique({
      where: { userId: req.user.id },
    });

    if (!cart) {
      cart = await prisma.cart.create({
        data: { userId: req.user.id },
      });
    }

    // 3. Check existing cart item
    const existingCartItem = await prisma.cartItem.findUnique({
      where: {
        cartId_productId: {
          cartId: cart.id,
          productId,
        },
      },
    });

    const newQuantity = existingCartItem ? existingCartItem.quantity + qty : qty;

    if (newQuantity > product.stockQuantity) {
      return sendError(
        res,
        `Cannot add ${qty} more items. Only ${product.stockQuantity} items in stock (you already have ${existingCartItem ? existingCartItem.quantity : 0} in cart).`,
        [],
        400
      );
    }

    if (existingCartItem) {
      await prisma.cartItem.update({
        where: { id: existingCartItem.id },
        data: { quantity: newQuantity },
      });
    } else {
      await prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productId,
          quantity: qty,
        },
      });
    }

    // Return updated cart
    return getCart(req, res, next);
  } catch (error) {
    next(error);
  }
};

/**
 * Update Cart Item Quantity
 */
const updateCartItem = async (req, res, next) => {
  try {
    const { itemId } = req.params;
    const { quantity } = req.body;

    if (quantity === undefined) {
      return sendError(res, 'Quantity is required.', [], 400);
    }

    const qty = parseInt(quantity, 10);

    // IDOR Protection: Ensure cart item belongs to user's cart
    const cartItem = await prisma.cartItem.findUnique({
      where: { id: itemId },
      include: {
        cart: true,
        product: true,
      },
    });

    if (!cartItem || cartItem.cart.userId !== req.user.id) {
      return sendError(res, 'Cart item not found.', [], 404);
    }

    // If quantity <= 0, remove the item
    if (qty <= 0) {
      await prisma.cartItem.delete({ where: { id: itemId } });
      return getCart(req, res, next);
    }

    // Check stock
    if (qty > cartItem.product.stockQuantity) {
      return sendError(
        res,
        `Only ${cartItem.product.stockQuantity} items available in stock.`,
        [],
        400
      );
    }

    await prisma.cartItem.update({
      where: { id: itemId },
      data: { quantity: qty },
    });

    return getCart(req, res, next);
  } catch (error) {
    next(error);
  }
};

/**
 * Remove Item from Cart
 */
const removeFromCart = async (req, res, next) => {
  try {
    const { itemId } = req.params;

    // IDOR Protection: Ensure item belongs to user's cart
    const cartItem = await prisma.cartItem.findUnique({
      where: { id: itemId },
      include: { cart: true },
    });

    if (!cartItem || cartItem.cart.userId !== req.user.id) {
      return sendError(res, 'Cart item not found.', [], 404);
    }

    await prisma.cartItem.delete({
      where: { id: itemId },
    });

    return getCart(req, res, next);
  } catch (error) {
    next(error);
  }
};

/**
 * Clear All Items from Cart
 */
const clearCart = async (req, res, next) => {
  try {
    const cart = await prisma.cart.findUnique({
      where: { userId: req.user.id },
    });

    if (cart) {
      await prisma.cartItem.deleteMany({
        where: { cartId: cart.id },
      });
    }

    return sendSuccess(res, 'Cart cleared successfully.', { items: [], summary: { subtotal: 0, finalTotal: 0, totalQuantity: 0 } });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
};
