const prisma = require('../config/prisma');
const { sendSuccess, sendError } = require('../utils/response');

/**
 * Get Active Categories for Customer Storefront
 */
const getCategories = async (req, res, next) => {
  try {
    const categories = await prisma.category.findMany({
      where: { active: true },
      include: {
        _count: {
          select: { products: { where: { active: true } } },
        },
      },
      orderBy: { name: 'asc' },
    });

    return sendSuccess(res, 'Categories fetched successfully.', { categories });
  } catch (error) {
    next(error);
  }
};

/**
 * Get Category by Slug
 */
const getCategoryBySlug = async (req, res, next) => {
  try {
    const { slug } = req.params;

    const category = await prisma.category.findUnique({
      where: { slug },
      include: {
        _count: {
          select: { products: { where: { active: true } } },
        },
      },
    });

    if (!category || !category.active) {
      return sendError(res, 'Category not found.', [], 404);
    }

    return sendSuccess(res, 'Category fetched.', { category });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCategories,
  getCategoryBySlug,
};
