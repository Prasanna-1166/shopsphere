const prisma = require('../../config/prisma');
const { sendSuccess, sendError } = require('../../utils/response');

/**
 * Helper to slugify string
 */
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
 * Get Products for Admin with search, filters, stock status, pagination
 */
const getAdminProducts = async (req, res, next) => {
  try {
    const {
      search,
      category,
      stockStatus, // 'all' | 'in_stock' | 'low_stock' | 'out_of_stock'
      active,      // 'all' | 'true' | 'false'
      page = 1,
      limit = 15,
      sortBy = 'newest',
    } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const take = Math.min(100, Math.max(1, parseInt(limit, 10) || 15));
    const skip = (pageNum - 1) * take;

    const where = {};

    if (search && search.trim()) {
      const q = search.trim();
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { sku: { contains: q, mode: 'insensitive' } },
        { slug: { contains: q, mode: 'insensitive' } },
      ];
    }

    if (category) {
      where.categoryId = category;
    }

    if (active === 'true') {
      where.active = true;
    } else if (active === 'false') {
      where.active = false;
    }

    if (stockStatus === 'out_of_stock') {
      where.stockQuantity = 0;
    } else if (stockStatus === 'low_stock') {
      where.stockQuantity = { gt: 0, lte: 5 };
    } else if (stockStatus === 'in_stock') {
      where.stockQuantity = { gt: 5 };
    }

    let orderBy = { createdAt: 'desc' };
    if (sortBy === 'price_asc') orderBy = { price: 'asc' };
    if (sortBy === 'price_desc') orderBy = { price: 'desc' };
    if (sortBy === 'stock_asc') orderBy = { stockQuantity: 'asc' };
    if (sortBy === 'stock_desc') orderBy = { stockQuantity: 'desc' };
    if (sortBy === 'name_asc') orderBy = { name: 'asc' };

    const [total, products] = await Promise.all([
      prisma.product.count({ where }),
      prisma.product.findMany({
        where,
        include: {
          category: { select: { id: true, name: true, slug: true } },
          images: { orderBy: { sortOrder: 'asc' } },
          _count: { select: { orderItems: true } },
        },
        orderBy,
        skip,
        take,
      }),
    ]);

    return sendSuccess(res, 'Admin products fetched.', {
      products,
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
 * Create a New Product
 */
const createProduct = async (req, res, next) => {
  try {
    const {
      name,
      sku,
      description,
      price,
      discountPrice,
      stockQuantity = 0,
      active = true,
      categoryId,
      images = [],
    } = req.body;

    if (!name || !sku || !description || price === undefined || !categoryId) {
      return sendError(res, 'Name, SKU, description, price, and category are required.', [], 400);
    }

    const numPrice = parseFloat(price);
    const numDiscount = discountPrice ? parseFloat(discountPrice) : null;
    const numStock = Math.max(0, parseInt(stockQuantity, 10) || 0);

    if (isNaN(numPrice) || numPrice < 0) {
      return sendError(res, 'Valid product price is required.', [], 400);
    }

    if (numDiscount !== null && (isNaN(numDiscount) || numDiscount >= numPrice)) {
      return sendError(res, 'Discount price must be less than regular price.', [], 400);
    }

    // Verify category exists
    const category = await prisma.category.findUnique({ where: { id: categoryId } });
    if (!category) {
      return sendError(res, 'Selected category does not exist.', [], 404);
    }

    let generatedSlug = slugify(name);
    // Check slug collision
    const existingSlug = await prisma.product.findUnique({ where: { slug: generatedSlug } });
    if (existingSlug) {
      generatedSlug = `${generatedSlug}-${Date.now().toString(36)}`;
    }

    // Check SKU collision
    const existingSku = await prisma.product.findUnique({ where: { sku: sku.trim().toUpperCase() } });
    if (existingSku) {
      return sendError(res, 'A product with this SKU already exists.', [], 409);
    }

    const product = await prisma.$transaction(async (tx) => {
      const created = await tx.product.create({
        data: {
          name: name.trim(),
          slug: generatedSlug,
          sku: sku.trim().toUpperCase(),
          description: description.trim(),
          price: numPrice,
          discountPrice: numDiscount,
          stockQuantity: numStock,
          active: Boolean(active),
          categoryId,
          images: {
            create: images.map((img, idx) => ({
              url: typeof img === 'string' ? img : img.url,
              altText: typeof img === 'string' ? `${name} - Image ${idx + 1}` : (img.altText || `${name}`),
              sortOrder: idx,
            })),
          },
        },
        include: {
          category: true,
          images: true,
        },
      });

      // Initial restock inventory transaction
      if (numStock > 0) {
        await tx.inventoryTransaction.create({
          data: {
            productId: created.id,
            quantityChange: numStock,
            previousQuantity: 0,
            newQuantity: numStock,
            type: 'RESTOCK',
            reason: 'Initial catalog creation stock',
            performedBy: req.user.id,
          },
        });
      }

      return created;
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: req.user.id,
        action: 'PRODUCT_CREATE',
        entity: 'PRODUCT',
        entityId: product.id,
        metadata: { name: product.name, sku: product.sku, price: product.price },
      },
    });

    return sendSuccess(res, 'Product created successfully.', { product }, 201);
  } catch (error) {
    next(error);
  }
};

/**
 * Update Product
 */
const updateProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      name,
      sku,
      description,
      price,
      discountPrice,
      stockQuantity,
      active,
      categoryId,
      images,
    } = req.body;

    const existing = await prisma.product.findUnique({
      where: { id },
      include: { images: true },
    });

    if (!existing) {
      return sendError(res, 'Product not found.', [], 404);
    }

    const updateData = {};
    if (name) updateData.name = name.trim();
    if (description) updateData.description = description.trim();
    if (active !== undefined) updateData.active = Boolean(active);
    if (categoryId) updateData.categoryId = categoryId;

    if (sku && sku.trim().toUpperCase() !== existing.sku) {
      const skuCheck = await prisma.product.findUnique({ where: { sku: sku.trim().toUpperCase() } });
      if (skuCheck) return sendError(res, 'SKU already assigned to another product.', [], 409);
      updateData.sku = sku.trim().toUpperCase();
    }

    if (price !== undefined) {
      const numPrice = parseFloat(price);
      if (isNaN(numPrice) || numPrice < 0) return sendError(res, 'Invalid price.', [], 400);
      updateData.price = numPrice;
    }

    if (discountPrice !== undefined) {
      const numDiscount = discountPrice ? parseFloat(discountPrice) : null;
      const targetPrice = updateData.price !== undefined ? updateData.price : existing.price;
      if (numDiscount !== null && (isNaN(numDiscount) || numDiscount >= targetPrice)) {
        return sendError(res, 'Discount price must be lower than base price.', [], 400);
      }
      updateData.discountPrice = numDiscount;
    }

    const updated = await prisma.$transaction(async (tx) => {
      // Stock adjustment if provided directly
      if (stockQuantity !== undefined) {
        const newStock = Math.max(0, parseInt(stockQuantity, 10));
        if (newStock !== existing.stockQuantity) {
          updateData.stockQuantity = newStock;
          await tx.inventoryTransaction.create({
            data: {
              productId: id,
              quantityChange: newStock - existing.stockQuantity,
              previousQuantity: existing.stockQuantity,
              newQuantity: newStock,
              type: 'MANUAL_ADJUSTMENT',
              reason: 'Product update stock adjustment',
              performedBy: req.user.id,
            },
          });
        }
      }

      // Handle Image Updates if provided
      if (Array.isArray(images)) {
        await tx.productImage.deleteMany({ where: { productId: id } });
        if (images.length > 0) {
          await tx.productImage.createMany({
            data: images.map((img, idx) => ({
              productId: id,
              url: typeof img === 'string' ? img : img.url,
              altText: typeof img === 'string' ? `${existing.name} Image` : (img.altText || `${existing.name}`),
              sortOrder: idx,
            })),
          });
        }
      }

      return tx.product.update({
        where: { id },
        data: updateData,
        include: {
          category: true,
          images: { orderBy: { sortOrder: 'asc' } },
        },
      });
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: req.user.id,
        action: 'PRODUCT_UPDATE',
        entity: 'PRODUCT',
        entityId: id,
        metadata: { updatedFields: Object.keys(updateData) },
      },
    });

    return sendSuccess(res, 'Product updated successfully.', { product: updated });
  } catch (error) {
    next(error);
  }
};

/**
 * Toggle Single Product Active Status
 */
const toggleProductActive = async (req, res, next) => {
  try {
    const { id } = req.params;

    const existing = await prisma.product.findUnique({ where: { id } });
    if (!existing) {
      return sendError(res, 'Product not found.', [], 404);
    }

    const updated = await prisma.product.update({
      where: { id },
      data: { active: !existing.active },
    });

    await prisma.auditLog.create({
      data: {
        userId: req.user.id,
        action: 'PRODUCT_STATUS_TOGGLE',
        entity: 'PRODUCT',
        entityId: id,
        metadata: { previousActive: existing.active, newActive: updated.active },
      },
    });

    return sendSuccess(res, `Product ${updated.active ? 'activated' : 'deactivated'} successfully.`, { product: updated });
  } catch (error) {
    next(error);
  }
};

/**
 * Bulk Toggle Product Active Status
 */
const bulkToggleProductActive = async (req, res, next) => {
  try {
    const { productIds, active } = req.body;

    if (!Array.isArray(productIds) || productIds.length === 0 || active === undefined) {
      return sendError(res, 'productIds array and target active boolean are required.', [], 400);
    }

    const result = await prisma.product.updateMany({
      where: { id: { in: productIds } },
      data: { active: Boolean(active) },
    });

    await prisma.auditLog.create({
      data: {
        userId: req.user.id,
        action: 'PRODUCT_BULK_STATUS_UPDATE',
        entity: 'PRODUCT',
        metadata: { count: result.count, productIds, active: Boolean(active) },
      },
    });

    return sendSuccess(res, `Updated ${result.count} products successfully.`, { modifiedCount: result.count });
  } catch (error) {
    next(error);
  }
};

/**
 * Safe Delete Product (or Deactivate if Ordered)
 */
const deleteProduct = async (req, res, next) => {
  try {
    const { id } = req.params;

    const product = await prisma.product.findUnique({
      where: { id },
      include: { _count: { select: { orderItems: true } } },
    });

    if (!product) {
      return sendError(res, 'Product not found.', [], 404);
    }

    // If product is associated with past orders, perform safe deactivation instead of cascading failure
    if (product._count.orderItems > 0) {
      await prisma.product.update({
        where: { id },
        data: { active: false },
      });

      await prisma.auditLog.create({
        data: {
          userId: req.user.id,
          action: 'PRODUCT_DEACTIVATE_SAFE',
          entity: 'PRODUCT',
          entityId: id,
          metadata: { reason: 'Deactivated due to historical order dependencies' },
        },
      });

      return sendSuccess(res, 'Product has historical orders. It has been deactivated rather than deleted to preserve order history.', { deactivated: true });
    }

    // Clean delete
    await prisma.product.delete({ where: { id } });

    await prisma.auditLog.create({
      data: {
        userId: req.user.id,
        action: 'PRODUCT_DELETE',
        entity: 'PRODUCT',
        entityId: id,
        metadata: { name: product.name, sku: product.sku },
      },
    });

    return sendSuccess(res, 'Product deleted successfully.');
  } catch (error) {
    next(error);
  }
};

/**
 * Export Products to CSV format
 */
const exportProductsCSV = async (req, res, next) => {
  try {
    const products = await prisma.product.findMany({
      include: {
        category: { select: { name: true } },
      },
      orderBy: { name: 'asc' },
    });

    // Build CSV content
    const headers = ['ID', 'Name', 'SKU', 'Category', 'Price', 'DiscountPrice', 'StockQuantity', 'Active', 'CreatedAt'];
    const rows = products.map((p) => [
      p.id,
      `"${p.name.replace(/"/g, '""')}"`,
      p.sku,
      `"${p.category.name.replace(/"/g, '""')}"`,
      p.price,
      p.discountPrice || '',
      p.stockQuantity,
      p.active ? 'TRUE' : 'FALSE',
      p.createdAt.toISOString(),
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="shopsphere_products.csv"');
    return res.status(200).send(csvContent);
  } catch (error) {
    next(error);
  }
};

/**
 * Import Products from CSV Data with row-by-row validation
 */
const importProductsCSV = async (req, res, next) => {
  try {
    const { csvData } = req.body;

    if (!csvData || typeof csvData !== 'string') {
      return sendError(res, 'CSV data string is required in request body.', [], 400);
    }

    const lines = csvData.trim().split(/\r?\n/);
    if (lines.length < 2) {
      return sendError(res, 'CSV must contain a header row and at least one product row.', [], 400);
    }

    const header = lines[0].split(',').map((h) => h.trim().toLowerCase());
    const nameIdx = header.indexOf('name');
    const skuIdx = header.indexOf('sku');
    const priceIdx = header.indexOf('price');
    const categoryIdx = header.indexOf('category');
    const stockIdx = header.indexOf('stockquantity') !== -1 ? header.indexOf('stockquantity') : header.indexOf('stock');

    if (nameIdx === -1 || skuIdx === -1 || priceIdx === -1) {
      return sendError(res, 'CSV must include "name", "sku", and "price" columns.', [], 400);
    }

    const categories = await prisma.category.findMany({});
    const categoryMap = new Map();
    categories.forEach((c) => {
      categoryMap.set(c.name.toLowerCase(), c.id);
      categoryMap.set(c.slug.toLowerCase(), c.id);
    });

    // Default category fallback if unassigned
    const defaultCategoryId = categories[0]?.id;

    const successItems = [];
    const errors = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const cols = line.split(',').map((c) => c.replace(/^"|"$/g, '').trim());
      const name = cols[nameIdx];
      const sku = cols[skuIdx]?.toUpperCase();
      const price = parseFloat(cols[priceIdx]);
      const stockQuantity = stockIdx !== -1 ? parseInt(cols[stockIdx], 10) || 0 : 10;
      const catName = categoryIdx !== -1 ? cols[categoryIdx]?.toLowerCase() : null;

      if (!name || !sku || isNaN(price) || price < 0) {
        errors.push(`Row ${i + 1}: Invalid required fields (Name: "${name}", SKU: "${sku}", Price: ${cols[priceIdx]})`);
        continue;
      }

      const categoryId = (catName && categoryMap.get(catName)) || defaultCategoryId;

      try {
        const slug = `${slugify(name)}-${Date.now().toString(36)}`;
        const upserted = await prisma.product.upsert({
          where: { sku },
          update: {
            name,
            price,
            stockQuantity: Math.max(0, stockQuantity),
            categoryId,
          },
          create: {
            name,
            sku,
            slug,
            description: `Imported product: ${name}`,
            price,
            stockQuantity: Math.max(0, stockQuantity),
            categoryId,
            active: true,
          },
        });
        successItems.push(upserted.sku);
      } catch (err) {
        errors.push(`Row ${i + 1} (${sku}): ${err.message}`);
      }
    }

    await prisma.auditLog.create({
      data: {
        userId: req.user.id,
        action: 'PRODUCT_CSV_IMPORT',
        entity: 'PRODUCT',
        metadata: { importedCount: successItems.length, errorCount: errors.length },
      },
    });

    return sendSuccess(res, `Processed CSV import. ${successItems.length} products imported/updated.`, {
      importedCount: successItems.length,
      errors,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAdminProducts,
  createProduct,
  updateProduct,
  toggleProductActive,
  bulkToggleProductActive,
  deleteProduct,
  exportProductsCSV,
  importProductsCSV,
};
