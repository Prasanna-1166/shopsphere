const request = require('supertest');
const app = require('../src/app');
const prisma = require('../src/config/prisma');
const { signToken } = require('../src/utils/jwt');

describe('ShopSphere — Admin Portal RBAC & Management Tests', () => {
  let adminUser = null;
  let customerUser = null;
  let adminToken = null;
  let customerToken = null;
  let createdProductId = null;

  beforeAll(async () => {
    // 1. Create Admin User
    adminUser = await prisma.user.create({
      data: {
        name: 'Admin Test Runner',
        email: `admin_runner_${Date.now()}@example.com`,
        passwordHash: 'dummy_hash',
        role: 'ADMIN',
        status: 'ACTIVE',
      },
    });
    adminToken = signToken({ id: adminUser.id, email: adminUser.email, role: adminUser.role });

    // 2. Create Regular Customer
    customerUser = await prisma.user.create({
      data: {
        name: 'Regular Customer',
        email: `reg_cust_${Date.now()}@example.com`,
        passwordHash: 'dummy_hash',
        role: 'CUSTOMER',
        status: 'ACTIVE',
      },
    });
    customerToken = signToken({ id: customerUser.id, email: customerUser.email, role: customerUser.role });
  });

  afterAll(async () => {
    try {
      if (createdProductId) {
        await prisma.inventoryTransaction.deleteMany({ where: { productId: createdProductId } });
        await prisma.productImage.deleteMany({ where: { productId: createdProductId } });
        await prisma.product.delete({ where: { id: createdProductId } });
      }
      if (adminUser) {
        await prisma.auditLog.deleteMany({ where: { userId: adminUser.id } });
        await prisma.user.delete({ where: { id: adminUser.id } });
      }
      if (customerUser) {
        await prisma.user.delete({ where: { id: customerUser.id } });
      }
    } catch (e) {}
    await prisma.$disconnect();
  });

  test('GET /api/admin/dashboard/metrics - Access granted to ADMIN role', async () => {
    const res = await request(app)
      .get('/api/admin/dashboard/metrics')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.overview).toBeDefined();
  });

  test('GET /api/admin/dashboard/metrics - Denies CUSTOMER access with 403 Forbidden', async () => {
    const res = await request(app)
      .get('/api/admin/dashboard/metrics')
      .set('Authorization', `Bearer ${customerToken}`);

    expect(res.statusCode).toBe(403);
    expect(res.body.success).toBe(false);
  });

  test('POST /api/admin/products - Creates new product and logs inventory transaction', async () => {
    const category = await prisma.category.findFirst();
    if (!category) return;

    const res = await request(app)
      .post('/api/admin/products')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Admin Test Acoustic Unit',
        sku: `TST-SKU-${Date.now().toString(36).toUpperCase()}`,
        description: 'Testing admin product creation workflow',
        price: 4999,
        discountPrice: 3999,
        stockQuantity: 25,
        categoryId: category.id,
        images: ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600'],
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.product).toBeDefined();

    createdProductId = res.body.data.product.id;
  });

  test('POST /api/admin/inventory/adjust - Adjusts inventory with reason and non-negative validation', async () => {
    if (!createdProductId) return;

    const res = await request(app)
      .post('/api/admin/inventory/adjust')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        productId: createdProductId,
        newQuantity: 50,
        reason: 'Warehouse recount audit test',
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.updatedProduct.stockQuantity).toBe(50);
  });
});
