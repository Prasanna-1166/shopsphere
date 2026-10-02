const request = require('supertest');
const app = require('../src/app');
const prisma = require('../src/config/prisma');
const { signToken } = require('../src/utils/jwt');

describe('ShopSphere — Cart Operations & Stock Validation Tests', () => {
  let testUser = null;
  let authToken = null;
  let testProduct = null;
  let addedItemId = null;

  beforeAll(async () => {
    // 1. Create temporary customer
    testUser = await prisma.user.create({
      data: {
        name: 'Cart Tester',
        email: `cart_tester_${Date.now()}@example.com`,
        passwordHash: 'dummy_hash',
        role: 'CUSTOMER',
        status: 'ACTIVE',
        cart: { create: {} },
      },
    });

    authToken = signToken({ id: testUser.id, email: testUser.email, role: testUser.role });

    // 2. Grab an active product with stock
    testProduct = await prisma.product.findFirst({
      where: { active: true, stockQuantity: { gt: 5 } },
    });
  });

  afterAll(async () => {
    try {
      if (testUser) {
        await prisma.cartItem.deleteMany({ where: { cart: { userId: testUser.id } } });
        await prisma.cart.deleteMany({ where: { userId: testUser.id } });
        await prisma.user.delete({ where: { id: testUser.id } });
      }
    } catch (e) {}
    await prisma.$disconnect();
  });

  test('GET /api/cart - Fetches initially empty cart for user', async () => {
    const res = await request(app)
      .get('/api/cart')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.items.length).toBe(0);
  });

  test('POST /api/cart/add - Adds item to cart and calculates authoritative server price', async () => {
    if (!testProduct) return;

    const res = await request(app)
      .post('/api/cart/add')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        productId: testProduct.id,
        quantity: 2,
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.items.length).toBe(1);

    const item = res.body.data.items[0];
    expect(item.productId).toBe(testProduct.id);
    expect(item.quantity).toBe(2);

    addedItemId = item.id;
  });

  test('PUT /api/cart/items/:itemId - Updates item quantity in cart', async () => {
    if (!addedItemId) return;

    const res = await request(app)
      .put(`/api/cart/items/${addedItemId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ quantity: 3 });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    const updated = res.body.data.items.find((i) => i.id === addedItemId);
    expect(updated.quantity).toBe(3);
  });

  test('POST /api/cart/add - Prevents adding more than available warehouse stock', async () => {
    if (!testProduct) return;

    const res = await request(app)
      .post('/api/cart/add')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        productId: testProduct.id,
        quantity: testProduct.stockQuantity + 999,
      });

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('items in stock');
  });

  test('DELETE /api/cart/items/:itemId - Removes item from cart', async () => {
    if (!addedItemId) return;

    const res = await request(app)
      .delete(`/api/cart/items/${addedItemId}`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.items.length).toBe(0);
  });
});
