const prisma = require('../../config/prisma');
const { sendSuccess, sendError } = require('../../utils/response');

const slugify = (text) => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-');
};

/**
 * Get all categories for Admin
 */
const getAdminCategories = async (req, res, next) => {
  try {
    const categories = await prisma.category.findMany({
      include: {
        _count: {
          select: { products: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    return sendSuccess(res, 'Categories fetched.', { categories });
  } catch (error) {
    next(error);
  }
};

/**
 * Create a New Category
 */
const createCategory = async (req, res, next) => {
  try {
    const { name, description, image, active = true } = req.body;

    if (!name || !name.trim()) {
      return sendError(res, 'Category name is required.', [], 400);
    }

    const trimmedName = name.trim();
    let slug = slugify(trimmedName);

    const existingSlug = await prisma.category.findUnique({ where: { slug } });
    if (existingSlug) {
      slug = `${slug}-${Date.now().toString(36)}`;
    }

    const category = await prisma.category.create({
      data: {
        name: trimmedName,
        slug,
        description: description ? description.trim() : null,
        image: image || null,
        active: Boolean(active),
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: req.user.id,
        action: 'CATEGORY_CREATE',
        entity: 'CATEGORY',
        entityId: category.id,
        metadata: { name: category.name, slug: category.slug },
      },
    });

    return sendSuccess(res, 'Category created successfully.', { category }, 201);
  } catch (error) {
    next(error);
  }
};

/**
 * Update Category
 */
const updateCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, description, image, active } = req.body;

    const existing = await prisma.category.findUnique({ where: { id } });
    if (!existing) {
      return sendError(res, 'Category not found.', [], 404);
    }

    const updateData = {};
    if (name) {
      updateData.name = name.trim();
      updateData.slug = slugify(name.trim());
    }
    if (description !== undefined) updateData.description = description ? description.trim() : null;
    if (image !== undefined) updateData.image = image;
    if (active !== undefined) updateData.active = Boolean(active);

    const updated = await prisma.category.update({
      where: { id },
      data: updateData,
    });

    await prisma.auditLog.create({
      data: {
        userId: req.user.id,
        action: 'CATEGORY_UPDATE',
        entity: 'CATEGORY',
        entityId: id,
        metadata: { updatedFields: Object.keys(updateData) },
      },
    });

    return sendSuccess(res, 'Category updated successfully.', { category: updated });
  } catch (error) {
    next(error);
  }
};

/**
 * Toggle Category Active Status
 */
const toggleCategoryActive = async (req, res, next) => {
  try {
    const { id } = req.params;

    const existing = await prisma.category.findUnique({ where: { id } });
    if (!existing) {
      return sendError(res, 'Category not found.', [], 404);
    }

    const updated = await prisma.category.update({
      where: { id },
      data: { active: !existing.active },
    });

    await prisma.auditLog.create({
      data: {
        userId: req.user.id,
        action: 'CATEGORY_STATUS_TOGGLE',
        entity: 'CATEGORY',
        entityId: id,
        metadata: { previousActive: existing.active, newActive: updated.active },
      },
    });

    return sendSuccess(res, `Category ${updated.active ? 'activated' : 'deactivated'}.`, { category: updated });
  } catch (error) {
    next(error);
  }
};

/**
 * Safe Delete Category (Prevent deletion if products are attached)
 */
const deleteCategory = async (req, res, next) => {
  try {
    const { id } = req.params;

    const count = await prisma.product.count({ where: { categoryId: id } });
    if (count > 0) {
      return sendError(
        res,
        `Cannot delete category because it has ${count} assigned product(s). Please reassign or delete the products first.`,
        [],
        400
      );
    }

    await prisma.category.delete({ where: { id } });

    await prisma.auditLog.create({
      data: {
        userId: req.user.id,
        action: 'CATEGORY_DELETE',
        entity: 'CATEGORY',
        entityId: id,
      },
    });

    return sendSuccess(res, 'Category deleted successfully.');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAdminCategories,
  createCategory,
  updateCategory,
  toggleCategoryActive,
  deleteCategory,
};
