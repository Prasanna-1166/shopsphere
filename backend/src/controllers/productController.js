const prisma = require('../config/prisma');
const { sendSuccess, sendError } = require('../utils/response');

/**
 * Get Products with Search, Filters, Sorting, and Pagination
 */
const getProducts = async (req, res, next) => {
  try {
    const {
      search,
      category,
      minPrice,
      maxPrice,
      inStock,
      sortBy = 'newest',
      page = 1,
      limit = 12,
    } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const take = Math.min(50, Math.max(1, parseInt(limit, 10) || 12));
    const skip = (pageNum - 1) * take;

    const where = {
      active: true, // Only show active products to customers
    };

    // Category filter (slug or ID)
    if (category) {
      where.category = {
        OR: [{ id: category }, { slug: category }],
      };
    }

    // Search query across name, sku, and description
    if (search && search.trim()) {
      const q = search.trim();
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { sku: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
      ];
    }

    // Price range filters
    if (minPrice !== undefined || maxPrice !== undefined) {
      where.price = {};
      if (minPrice !== undefined && !isNaN(parseFloat(minPrice))) {
        where.price.gte = parseFloat(minPrice);
      }
      if (maxPrice !== undefined && !isNaN(parseFloat(maxPrice))) {
        where.price.lte = parseFloat(maxPrice);
      }
    }

    // In-stock filter
    if (inStock === 'true' || inStock === true) {
      where.stockQuantity = { gt: 0 };
    }

    // Sorting options
    let orderBy = { createdAt: 'desc' };
    if (sortBy === 'price_asc') {
      orderBy = { price: 'asc' };
    } else if (sortBy === 'price_desc') {
      orderBy = { price: 'desc' };
    } else if (sortBy === 'name_asc') {
      orderBy = { name: 'asc' };
    } else if (sortBy === 'newest') {
      orderBy = { createdAt: 'desc' };
    }

    const [total, products] = await Promise.all([
      prisma.product.count({ where }),
      prisma.product.findMany({
        where,
        include: {
          category: {
            select: { id: true, name: true, slug: true },
          },
          images: {
            orderBy: { sortOrder: 'asc' },
          },
        },
        orderBy,
        skip,
        take,
      }),
    ]);

    const totalPages = Math.ceil(total / take);

    return sendSuccess(res, 'Products fetched successfully.', {
      products,
      pagination: {
        total,
        page: pageNum,
        limit: take,
        totalPages,
        hasMore: pageNum < totalPages,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get Product by Slug
 */
const getProductBySlug = async (req, res, next) => {
  try {
    const { slug } = req.params;

    const product = await prisma.product.findUnique({
      where: { slug },
      include: {
        category: true,
        images: {
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    if (!product || !product.active) {
      return sendError(res, 'Product not found or currently unavailable.', [], 404);
    }

    return sendSuccess(res, 'Product details fetched.', { product });
  } catch (error) {
    next(error);
  }
};

/**
 * Get Product by ID
 */
const getProductById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        images: {
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    if (!product || !product.active) {
      return sendError(res, 'Product not found or unavailable.', [], 404);
    }

    return sendSuccess(res, 'Product details fetched.', { product });
  } catch (error) {
    next(error);
  }
};

/**
 * Get Deterministic Related / Recommended Products
 */
const getRelatedProducts = async (req, res, next) => {
  try {
    const { id } = req.params;

    const currentProduct = await prisma.product.findUnique({
      where: { id },
      select: { categoryId: true },
    });

    if (!currentProduct) {
      return sendError(res, 'Product not found.', [], 404);
    }

    // Fetch up to 4 other active products in the same category
    const related = await prisma.product.findMany({
      where: {
        categoryId: currentProduct.categoryId,
        id: { not: id },
        active: true,
      },
      include: {
        category: { select: { id: true, name: true, slug: true } },
        images: { orderBy: { sortOrder: 'asc' }, take: 2 },
      },
      take: 4,
    });

    return sendSuccess(res, 'Related products fetched.', { products: related });
  } catch (error) {
    next(error);
  }
};

/**
 * Get Featured / Home Showcase Products
 */
const getFeaturedProducts = async (req, res, next) => {
  try {
    const [featured, newArrivals, bestDeals] = await Promise.all([
      // High rating / featured
      prisma.product.findMany({
        where: { active: true, stockQuantity: { gt: 0 } },
        include: {
          category: { select: { id: true, name: true, slug: true } },
          images: { orderBy: { sortOrder: 'asc' } },
        },
        take: 8,
        orderBy: { createdAt: 'desc' },
      }),
      // New arrivals
      prisma.product.findMany({
        where: { active: true },
        include: {
          category: { select: { id: true, name: true, slug: true } },
          images: { orderBy: { sortOrder: 'asc' } },
        },
        take: 8,
        orderBy: { createdAt: 'desc' },
      }),
      // Best discounted deals
      prisma.product.findMany({
        where: {
          active: true,
          discountPrice: { not: null },
          stockQuantity: { gt: 0 },
        },
        include: {
          category: { select: { id: true, name: true, slug: true } },
          images: { orderBy: { sortOrder: 'asc' } },
        },
        take: 6,
        orderBy: { discountPrice: 'asc' },
      }),
    ]);

    return sendSuccess(res, 'Showcase products fetched.', {
      featured,
      newArrivals,
      bestDeals,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProducts,
  getProductBySlug,
  getProductById,
  getRelatedProducts,
  getFeaturedProducts,
};
