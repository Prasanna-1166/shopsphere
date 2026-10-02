const request = require('supertest');
const app = require('../src/app');
const prisma = require('../src/config/prisma');

describe('ShopSphere — Product Catalog & Filtering Tests', () => {
  let sampleProduct = null;
  let sampleCategory = null;

  beforeAll(async () => {
    // Ensure at least one test category and product exists
    sampleCategory = await prisma.category.findFirst({ where: { active: true } });
    sampleProduct = await prisma.product.findFirst({
      where: { active: true },
      include: { category: true },
    });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  test('GET /api/products - Returns paginated list of active products with category', async () => {
    const res = await request(app).get('/api/products?page=1&limit=5');
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data.products)).toBe(true);
    expect(res.body.data.pagination.page).toBe(1);
    expect(res.body.data.pagination.limit).toBe(5);
  });

  test('GET /api/products - Supports keyword search by product name', async () => {
    if (!sampleProduct) return;
    const query = sampleProduct.name.split(' ')[0];
    const res = await request(app).get(`/api/products?search=${encodeURIComponent(query)}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    const names = res.body.data.products.map((p) => p.name.toLowerCase());
    expect(names.some((n) => n.includes(query.toLowerCase()))).toBe(true);
  });

  test('GET /api/products - Filters products by category slug', async () => {
    if (!sampleCategory) return;
    const res = await request(app).get(`/api/products?category=${sampleCategory.slug}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    res.body.data.products.forEach((p) => {
      expect(p.category.slug).toBe(sampleCategory.slug);
    });
  });

  test('GET /api/products - Filters products by price range', async () => {
    const min = 1000;
    const max = 10000;
    const res = await request(app).get(`/api/products?minPrice=${min}&maxPrice=${max}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    res.body.data.products.forEach((p) => {
      expect(p.price).toBeGreaterThanOrEqual(min);
      expect(p.price).toBeLessThanOrEqual(max);
    });
  });

  test('GET /api/products/slug/:slug - Fetches product details by slug', async () => {
    if (!sampleProduct) return;
    const res = await request(app).get(`/api/products/slug/${sampleProduct.slug}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.product.id).toBe(sampleProduct.id);
    expect(res.body.data.product.name).toBe(sampleProduct.name);
  });

  test('GET /api/products/slug/non-existent-product - Returns 404 for invalid slug', async () => {
    const res = await request(app).get('/api/products/slug/non-existent-product-slug-404');
    expect(res.statusCode).toBe(404);
    expect(res.body.success).toBe(false);
  });
});
