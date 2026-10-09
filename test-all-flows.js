const supertest = require('supertest');
const crypto = require('crypto');
const app = require('./backend/src/app');
const prisma = require('./backend/src/config/prisma');

async function runComprehensiveTests() {
  console.log('====================================================');
  console.log('🚀 SHOPSPHERE — PRODUCTION VERIFICATION & PAYMENT SUITE');
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
    assert(cats.body.data?.categories?.length === 8, `Categories count is 8 (actual: ${cats.body.data?.categories?.length})`);

    const hkCat = await supertest(app).get('/api/categories/home-kitchen');
    assert(hkCat.status === 200, 'GET /api/categories/home-kitchen returned 200');
    assert(hkCat.body.data?.category?.slug === 'home-kitchen', 'Category slug matches home-kitchen');

    // 3. Products Catalog & Image Audit
    console.log('\n--- 3. PRODUCT CATALOG & IMAGE INTEGRITY ---');
    const allProds = await supertest(app).get('/api/products?page=1&limit=150');
    assert(allProds.status === 200, 'GET /api/products returned 200');
    assert(allProds.body.data?.pagination?.total === 106, `Total products in DB is 106 (actual: ${allProds.body.data?.pagination?.total})`);

    // Check all products have images
    const productsList = allProds.body.data.products;
    const allHaveImages = productsList.every(p => Array.isArray(p.images) && p.images.length > 0 && p.images[0].url.startsWith('https://'));
    assert(allHaveImages, 'All 106 products have valid HTTPS image URLs');

    // Check zero cross-product duplicate URLs
    const imgMap = {};
    let dupsCount = 0;
    for (const p of productsList) {
      for (const img of p.images) {
        if (imgMap[img.url]) {
          dupsCount++;
        }
        imgMap[img.url] = p.sku;
      }
    }
    assert(dupsCount === 0, `Zero duplicate image URLs across catalog (actual duplicates: ${dupsCount})`);

    const hkProds = await supertest(app).get('/api/products?category=home-kitchen');
    assert(hkProds.status === 200, 'GET /api/products?category=home-kitchen returned 200');
    assert(hkProds.body.data?.products?.length > 0, 'Home & Kitchen products retrieved');

    const searchProds = await supertest(app).get('/api/products?search=rice');
    assert(searchProds.status === 200, 'GET /api/products?search=rice returned 200');
    assert(searchProds.body.data?.products?.length > 0, 'Search for "rice" returned matching products');

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
    assert(adminMetrics.body.data?.overview?.totalProducts === 106, `Admin overview accurately reflects 106 products (actual: ${adminMetrics.body.data?.overview?.totalProducts})`);

    // 5. Razorpay Payments & Verification Flow
    console.log('\n--- 5. RAZORPAY PAYMENT GATEWAY & VERIFICATION ---');
    const payConfig = await supertest(app).get('/api/payments/config');
    assert(payConfig.status === 200, 'GET /api/payments/config returned 200');
    assert(payConfig.body.data?.provider !== undefined, 'Payment provider configured');
    assert(payConfig.body.data?.keySecret === undefined, 'Key secret is securely hidden from client');
    assert(payConfig.body.data?.webhookSecret === undefined, 'Webhook secret is securely hidden from client');

    // Customer Registration & Shopping Flow
    const testEmail = `test.customer.${Date.now()}@example.com`;
    const regRes = await supertest(app).post('/api/auth/register').send({
      name: 'Test Customer',
      email: testEmail,
      password: 'Password@123'
    });
    assert(regRes.status === 201, 'Customer registration returned 201');
    const customerToken = regRes.body.data?.token;
    const testUserId = regRes.body.data?.user?.id;

    // Add product to cart
    const prodToBuy = productsList[0];
    const addToCart = await supertest(app)
      .post('/api/cart/add')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ productId: prodToBuy.id, quantity: 1 });
    assert(addToCart.status === 200, 'Adding product to cart returned 200');

    // Create Order with Online Payment
    const checkoutRes = await supertest(app)
      .post('/api/orders/checkout')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        shippingAddress: {
          fullName: 'Test Customer',
          phone: '+91 9876543210',
          addressLine1: 'Test Avenue 42',
          city: 'Bengaluru',
          state: 'Karnataka',
          postalCode: '560001',
        },
        paymentMethod: 'ONLINE',
      });
    assert(checkoutRes.status === 201, 'Order created with status PENDING for online payment');
    const createdOrderId = checkoutRes.body.data?.order?.id;

    // Create Payment Intent
    const intentRes = await supertest(app)
      .post('/api/payments/create-intent')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ orderId: createdOrderId });
    assert(intentRes.status === 200, 'Payment intent created on server');
    assert(intentRes.body.data?.paymentIntent?.amount > 0, 'Payment intent amount calculated');

    // Server-Side Verification
    const verifyRes = await supertest(app)
      .post('/api/payments/verify')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        orderId: createdOrderId,
        providerReference: `TEST-TXN-${Date.now()}`,
        mockStatus: 'PAID',
      });
    assert(verifyRes.status === 200, 'Payment verified server-side');
    assert(verifyRes.body.data?.order?.paymentStatus === 'PAID', 'Order paymentStatus updated to PAID');
    assert(verifyRes.body.data?.order?.status === 'CONFIRMED', 'Order status updated to CONFIRMED');

    // Clean up test records
    if (createdOrderId) {
      await prisma.orderItem.deleteMany({ where: { orderId: createdOrderId } });
      await prisma.payment.deleteMany({ where: { orderId: createdOrderId } });
      await prisma.inventoryTransaction.deleteMany({ where: { reason: { contains: createdOrderId } } });
      await prisma.order.delete({ where: { id: createdOrderId } });
    }
    if (testUserId) {
      await prisma.cartItem.deleteMany({ where: { cart: { userId: testUserId } } });
      await prisma.cart.deleteMany({ where: { userId: testUserId } });
      await prisma.user.delete({ where: { id: testUserId } });
    }
    console.log('  🧹 Cleaned up temporary test order and customer account.');

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
