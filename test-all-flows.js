const supertest = require('supertest');
const app = require('./backend/src/app');
const prisma = require('./backend/src/config/prisma');

async function runComprehensiveTests() {
  console.log('====================================================');
  console.log('🚀 SHOPSPHERE — END-TO-END VERIFICATION SUITE');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      failed++;
    }
  }

  try {
    console.log('Connecting to Neon PostgreSQL database...');
    let connected = false;
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        await prisma.$connect();
        connected = true;
        console.log(`✅ Connected to database (attempt ${attempt}).\n`);
        break;
      } catch (err) {
        console.log(`  ⏳ Neon compute waking up (attempt ${attempt}/3): ${err.message}...`);
        await new Promise((r) => setTimeout(r, 2500));
      }
    }
    if (!connected) {
      throw new Error('Failed to connect to Neon PostgreSQL after 3 attempts');
    }

    // 1. Database Health
    console.log('--- 1. DATABASE & SERVER HEALTH ---');
    const health = await supertest(app).get('/api/health');
    assert(health.status === 200, 'GET /api/health returned 200');
    assert(health.body.data?.database?.status === 'connected', 'Database status is connected');

    // 2. Categories
    console.log('\n--- 2. CATEGORY ENDPOINTS ---');
    const cats = await supertest(app).get('/api/categories');
    assert(cats.status === 200, 'GET /api/categories returned 200');
    assert(cats.body.data?.categories?.length === 7, `Categories count is 7 (actual: ${cats.body.data?.categories?.length})`);

    const hkCat = await supertest(app).get('/api/categories/home-kitchen');
    assert(hkCat.status === 200, 'GET /api/categories/home-kitchen returned 200');
    assert(hkCat.body.data?.category?.slug === 'home-kitchen', 'Category slug matches home-kitchen');

    // 3. Products Catalog
    console.log('\n--- 3. PRODUCT CATALOG & FILTERS ---');
    const allProds = await supertest(app).get('/api/products?page=1&limit=50');
    assert(allProds.status === 200, 'GET /api/products returned 200');
    assert(allProds.body.data?.pagination?.total === 38, `Total products in DB is 38 (actual: ${allProds.body.data?.pagination?.total})`);

    const hkProds = await supertest(app).get('/api/products?category=home-kitchen');
    assert(hkProds.status === 200, 'GET /api/products?category=home-kitchen returned 200');
    assert(hkProds.body.data?.pagination?.total === 6, `Home & Kitchen has 6 products (actual: ${hkProds.body.data?.pagination?.total})`);

    const hkIdProds = await supertest(app).get('/api/products?category=cat_home_kitchen');
    assert(hkIdProds.status === 200, 'GET /api/products?category=cat_home_kitchen returned 200');
    assert(hkIdProds.body.data?.pagination?.total === 6, `Category filter by ID works (actual: ${hkIdProds.body.data?.pagination?.total})`);

    const searchProds = await supertest(app).get('/api/products?search=bottle');
    assert(searchProds.status === 200, 'GET /api/products?search=bottle returned 200');
    assert(searchProds.body.data?.products?.length > 0, 'Search for "bottle" returned matching products');

    const priceProds = await supertest(app).get('/api/products?minPrice=500&maxPrice=1000');
    assert(priceProds.status === 200, 'GET /api/products?minPrice=500&maxPrice=1000 returned 200');
    assert(priceProds.body.data?.products?.length > 0, 'Price filter 500-1000 returned products');

    const singleProd = await supertest(app).get('/api/products/slug/thermosteel-1000ml-insulated-water-bottle');
    assert(singleProd.status === 200, 'GET /api/products/slug/... returned 200');
    assert(singleProd.body.data?.product?.name.includes('Thermosteel'), 'Product details matched');

    const featured = await supertest(app).get('/api/products/showcase/featured');
    assert(featured.status === 200, 'GET /api/products/showcase/featured returned 200');
    assert(featured.body.data?.featured?.length > 0, 'Featured showcase products loaded');

    // 4. Admin Auth & RBAC Security
    console.log('\n--- 4. ADMIN AUTHENTICATION & SECURITY ---');
    const badLogin = await supertest(app).post('/api/auth/admin-login').send({
      email: 'superadmin@shopsphere.com',
      password: 'WrongPassword123'
    });
    assert(badLogin.status === 401, 'Admin login with invalid password returned 401');

    const adminLogin = await supertest(app).post('/api/auth/admin-login').send({
      email: 'superadmin@shopsphere.com',
      password: 'SuperAdmin@123'
    });
    assert(adminLogin.status === 200, 'Admin login returned 200');
    const adminToken = adminLogin.body.data?.token;
    assert(!!adminToken, 'Admin JWT token received');

    const unauthMetrics = await supertest(app).get('/api/admin/dashboard/metrics');
    assert(unauthMetrics.status === 401, 'Unauthenticated access to /api/admin/dashboard/metrics returned 401');

    const adminMetrics = await supertest(app)
      .get('/api/admin/dashboard/metrics')
      .set('Authorization', `Bearer ${adminToken}`);
    assert(adminMetrics.status === 200, 'Admin access to /api/admin/dashboard/metrics returned 200');
    assert(adminMetrics.body.data?.overview?.totalProducts === 38, 'Admin overview accurately reflects 38 products');
    assert(adminMetrics.body.data?.overview?.totalCustomers === 0, 'Admin overview shows 0 customers initially');
    assert(adminMetrics.body.data?.overview?.totalOrders === 0, 'Admin overview shows 0 orders initially');
    assert(adminMetrics.body.data?.overview?.totalRevenue === 0, 'Admin overview shows ₹0 revenue initially');

    const adminProds = await supertest(app)
      .get('/api/admin/products')
      .set('Authorization', `Bearer ${adminToken}`);
    assert(adminProds.status === 200, 'Admin products list returned 200');
    assert(adminProds.body.data?.products?.length > 0, 'Admin products list populated');

    const adminOrders = await supertest(app)
      .get('/api/admin/orders')
      .set('Authorization', `Bearer ${adminToken}`);
    assert(adminOrders.status === 200, 'Admin orders list returned 200');
    assert(adminOrders.body.data?.orders?.length === 0, 'Admin orders list is 0 in clean state');

    const adminCustomers = await supertest(app)
      .get('/api/admin/customers')
      .set('Authorization', `Bearer ${adminToken}`);
    assert(adminCustomers.status === 200, 'Admin customers list returned 200');
    assert(adminCustomers.body.data?.customers?.length === 0, 'Admin customers list is 0 in clean state');

    // 5. Customer Authentication & Cart
    console.log('\n--- 5. CUSTOMER AUTHENTICATION & SHOPPING FLOW ---');
    const testEmail = `test.customer.${Date.now()}@example.com`;
    const regRes = await supertest(app).post('/api/auth/register').send({
      name: 'Test Customer',
      email: testEmail,
      password: 'Password@123'
    });
    assert(regRes.status === 201, 'Customer registration returned 201');
    const customerToken = regRes.body.data?.token;
    const testUserId = regRes.body.data?.user?.id;

    // Verify Customer cannot access Admin endpoints
    const customerAdminAttempt = await supertest(app)
      .get('/api/admin/dashboard/metrics')
      .set('Authorization', `Bearer ${customerToken}`);
    assert(customerAdminAttempt.status === 403, 'Customer role accessing admin endpoint returned 403 Forbidden');

    // Add product to cart
    const prodToBuy = allProds.body.data.products[0];
    const addToCart = await supertest(app)
      .post('/api/cart/add')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ productId: prodToBuy.id, quantity: 2 });
    assert(addToCart.status === 200, 'Adding product to cart returned 200');

    const getCart = await supertest(app)
      .get('/api/cart')
      .set('Authorization', `Bearer ${customerToken}`);
    assert(getCart.status === 200, 'GET /api/cart returned 200');
    assert(getCart.body.data?.items?.length === 1 && getCart.body.data.items[0].quantity === 2, 'Cart has 1 item with quantity 2');

    // Clean up test customer
    if (testUserId) {
      await prisma.cartItem.deleteMany({ where: { cart: { userId: testUserId } } });
      await prisma.cart.deleteMany({ where: { userId: testUserId } });
      await prisma.user.delete({ where: { id: testUserId } });
    }
    console.log('  🧹 Cleaned up temporary test customer account.');

    // 6. Database Verification
    console.log('\n--- 6. DATABASE PURITY & STATS ---');
    const dbUsers = await prisma.user.count({ where: { role: 'CUSTOMER' } });
    const dbOrders = await prisma.order.count();
    const dbPayments = await prisma.payment.count();
    const dbProducts = await prisma.product.count();
    const dbCategories = await prisma.category.count();

    assert(dbUsers === 0, `0 Customer accounts in clean database (actual: ${dbUsers})`);
    assert(dbOrders === 0, `0 Orders in clean database (actual: ${dbOrders})`);
    assert(dbPayments === 0, `0 Payments in clean database (actual: ${dbPayments})`);
    assert(dbProducts === 38, `38 Realistic products in database (actual: ${dbProducts})`);
    assert(dbCategories === 7, `7 Realistic categories in database (actual: ${dbCategories})`);

    console.log('\n====================================================');
    console.log(`SUMMARY: ${passed} PASSED, ${failed} FAILED`);
    console.log('====================================================\n');

  } catch (err) {
    console.error('Fatal error in test runner:', err);
  } finally {
    await prisma.$disconnect();
  }
}

runComprehensiveTests();
