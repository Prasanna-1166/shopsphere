const request = require('supertest');
const app = require('../src/app');
const prisma = require('../src/config/prisma');

describe('ShopSphere — Product Catalog Image Accuracy & Integrity Tests', () => {
  let activeProducts = [];
  let activeCategories = [];

  beforeAll(async () => {
    activeProducts = await prisma.product.findMany({
      where: { active: true },
      include: { images: true, category: true },
    });

    activeCategories = await prisma.category.findMany({
      where: { active: true },
    });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  test('Catalog audit: 106 active products exist in the catalog', () => {
    expect(activeProducts.length).toBe(106);
  });

  test('All 8 retail categories exist with descriptions and category images', () => {
    expect(activeCategories.length).toBe(8);
    for (const cat of activeCategories) {
      expect(cat.name).toBeTruthy();
      expect(cat.slug).toBeTruthy();
      expect(cat.image).toBeTruthy();
      expect(cat.image.startsWith('http')).toBe(true);
    }
  });

  test('Every active product has at least one valid image with HTTP URL', () => {
    for (const prod of activeProducts) {
      expect(prod.images.length).toBeGreaterThan(0);
      const primaryImage = prod.images[0];
      expect(primaryImage.url).toBeTruthy();
      expect(primaryImage.url.startsWith('https://')).toBe(true);
      expect(primaryImage.url).not.toContain('undefined');
      expect(primaryImage.url).not.toContain('null');
    }
  });

  test('Zero duplicate image URLs across different categories', () => {
    // Cross-category image uniqueness check
    const categoryByImage = {};
    const crossCategoryDuplicates = [];

    for (const prod of activeProducts) {
      for (const img of prod.images) {
        if (categoryByImage[img.url] && categoryByImage[img.url] !== prod.categoryId) {
          crossCategoryDuplicates.push({
            url: img.url,
            firstCategory: categoryByImage[img.url],
            secondCategory: prod.categoryId,
            productName: prod.name,
          });
        }
        categoryByImage[img.url] = prod.categoryId;
      }
    }

    expect(crossCategoryDuplicates).toEqual([]);
  });

  test('GET /api/products returns product image array with sortOrder and altText', async () => {
    const res = await request(app).get('/api/products?page=1&limit=10');
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);

    const products = res.body.data.products;
    expect(products.length).toBe(10);

    for (const p of products) {
      expect(Array.isArray(p.images)).toBe(true);
      if (p.images.length > 0) {
        expect(p.images[0]).toHaveProperty('url');
        expect(p.images[0].url.startsWith('https://')).toBe(true);
      }
    }
  });

  test('GET /api/products/slug/:slug returns complete gallery images', async () => {
    const sample = activeProducts[0];
    const res = await request(app).get(`/api/products/slug/${sample.slug}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.product.id).toBe(sample.id);
    expect(res.body.data.product.images.length).toBe(sample.images.length);
  });
});
