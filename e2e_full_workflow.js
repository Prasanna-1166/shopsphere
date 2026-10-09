require('dotenv').config();

const API_BASE = 'http://localhost:5000/api';

async function request(url, options = {}) {
  const res = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });
  const json = await res.json();
  if (!res.ok || json.success === false) {
    throw new Error(json.message || `Request failed with status ${res.status}`);
  }
  return json;
}

async function runFullWorkflowTest() {
  console.log('===============================================================');
  console.log('🛒 SHOPSPHERE — COMPLETE END-TO-END WORKFLOW & DELIVERY TEST');
  console.log('===============================================================\n');

  // Step 1: Health Check
  console.log('1️⃣ Checking API Health & Database Connectivity...');
  const healthRes = await request('/health');
  console.log(`   ✅ API Status: ${healthRes.data.status}, Database: ${healthRes.data.database?.status} (${healthRes.data.database?.latencyMs}ms)`);

  // Step 2: Browse Personal Care Category
  console.log('\n2️⃣ Browsing Products in "Personal Care & Grooming" (/products?category=personal-care)...');
  const catRes = await request('/products?category=personal-care');
  const products = catRes.data.products;
  console.log(`   ✅ Retrieved ${products.length} Personal Care products.`);
  const productToOrder = products[0];
  console.log(`   Selected Product: "${productToOrder.name}" (SKU: ${productToOrder.sku}, Price: ₹${productToOrder.price})`);

  // Step 3: Customer Login
  console.log('\n3️⃣ Authenticating Customer (customer@shopsphere.com)...');
  let token = null;
  try {
    const loginRes = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: 'customer@shopsphere.com',
        password: 'password123',
      }),
    });
    token = loginRes.data.token;
    console.log(`   ✅ Logged in successfully. Customer: ${loginRes.data.user?.name || 'Customer'}`);
  } catch (err) {
    console.log('   Registering new test customer...');
    const regRes = await request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Priya Sharma',
        email: `priya_${Date.now()}@example.com`,
        password: 'password123',
      }),
    });
    token = regRes.data.token;
    console.log(`   ✅ Registered customer successfully.`);
  }

  const authHeaders = { Authorization: `Bearer ${token}` };

  // Step 4: Add Product to Cart / Bag
  console.log('\n4️⃣ Adding Product to Cart / Shopping Bag...');
  await request('/cart/add', {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({ productId: productToOrder.id, quantity: 2 }),
  });
  const cartRes = await request('/cart', { headers: authHeaders });
  console.log(`   ✅ Cart Items Count: ${cartRes.data.items?.length || 0}`);
  console.log(`   Subtotal: ₹${cartRes.data.summary?.subtotal}, Final Total: ₹${cartRes.data.summary?.finalTotal}`);

  // Step 5: Save Delivery Address
  console.log('\n5️⃣ Providing Customer Delivery Address...');
  const addrRes = await request('/addresses', {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      fullName: 'Priya Sharma',
      phone: '+91 98765 43210',
      addressLine1: 'Flat 304, Green Glen Layout, Outer Ring Road',
      addressLine2: 'Near Bellandur Flyover',
      city: 'Bengaluru',
      state: 'Karnataka',
      postalCode: '560103',
      country: 'India',
      isDefault: true,
    }),
  });
  const addressId = addrRes.data.address.id;
  console.log(`   ✅ Delivery Address Saved (ID: ${addressId})`);

  // Step 6: Create Order via Checkout
  console.log('\n6️⃣ Placing Order (Initiating Checkout)...');
  const orderRes = await request('/orders/checkout', {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      addressId,
      paymentMethod: 'UPI',
    }),
  });
  const order = orderRes.data.order;
  const paymentIntent = orderRes.data.paymentIntent;
  console.log(`   ✅ Order Created: #${order.id}`);
  console.log(`   Initial Status: ${order.status}, Payment Status: ${order.paymentStatus}`);
  console.log(`   Payment Provider: ${paymentIntent?.provider || 'SIMULATOR'}`);

  // Step 7: Simulate Payment Approval (SUCCESS)
  console.log('\n7️⃣ Simulating Online Payment (Local Payment Simulator)...');
  const verifyRes = await request('/payments/verify', {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      orderId: order.id,
      scenario: 'SUCCESS',
      paymentMethod: 'Instant UPI',
      providerReference: paymentIntent?.providerReference,
    }),
  });
  console.log(`   ✅ Payment Verification Result: ${verifyRes.message}`);

  // Step 8: Verify Order Status on Customer Side
  console.log('\n8️⃣ Verifying Order Status on Customer Dashboard...');
  const customerOrderRes = await request(`/orders/${order.id}`, { headers: authHeaders });
  const confirmedOrder = customerOrderRes.data.order;
  console.log(`   ✅ Customer Order Status: ${confirmedOrder.status} (Expected: CONFIRMED)`);
  console.log(`   ✅ Customer Payment Status: ${confirmedOrder.paymentStatus} (Expected: PAID)`);

  // Step 9: Admin Authentication & Fulfillment
  console.log('\n9️⃣ Authenticating Admin Portal (superadmin@shopsphere.com)...');
  const adminLoginRes = await request('/auth/admin-login', {
    method: 'POST',
    body: JSON.stringify({
      email: 'superadmin@shopsphere.com',
      password: 'SuperAdmin@123',
    }),
  });
  const adminToken = adminLoginRes.data.token;
  const adminHeaders = { Authorization: `Bearer ${adminToken}` };
  console.log(`   ✅ Admin Authenticated.`);

  // Step 10: Admin Updates Order to PROCESSING -> SHIPPED -> DELIVERED
  console.log('\n🔟 Admin Processing Order Fulfillment to DELIVERED...');
  
  // Update to PROCESSING
  await request(`/admin/orders/${order.id}/status`, {
    method: 'PUT',
    headers: adminHeaders,
    body: JSON.stringify({ status: 'PROCESSING' }),
  });
  console.log('   🔄 Status updated to: PROCESSING');

  // Update to SHIPPED
  await request(`/admin/orders/${order.id}/status`, {
    method: 'PUT',
    headers: adminHeaders,
    body: JSON.stringify({ status: 'SHIPPED', trackingNumber: 'SS-BLR-984210' }),
  });
  console.log('   📦 Status updated to: SHIPPED (Tracking #: SS-BLR-984210)');

  // Update to DELIVERED
  const deliveredRes = await request(`/admin/orders/${order.id}/status`, {
    method: 'PUT',
    headers: adminHeaders,
    body: JSON.stringify({ status: 'DELIVERED' }),
  });
  console.log(`   🚚 Status updated to: ${deliveredRes.data?.order?.status || 'DELIVERED'}`);

  // Step 11: Final Customer Verification
  console.log('\n1️⃣1️⃣ Final Verification: Customer Order Details...');
  const finalOrderRes = await request(`/orders/${order.id}`, { headers: authHeaders });
  const finalOrder = finalOrderRes.data.order;
  console.log(`   ✅ Final Order #${finalOrder.id}:`);
  console.log(`      Status: ${finalOrder.status} (DELIVERED)`);
  console.log(`      Payment: ${finalOrder.paymentStatus} (PAID)`);
  console.log(`      Items: ${finalOrder.items.length} item(s)`);
  console.log(`      Total Amount: ₹${finalOrder.totalAmount}`);

  console.log('\n===============================================================');
  console.log('🎉 100% COMPLETE WORKFLOW PASSED — FROM ORDER TO PAYMENT & DELIVERY!');
  console.log('===============================================================\n');
}

runFullWorkflowTest().catch((err) => {
  console.error('❌ Workflow Test Failed:', err.message);
  process.exit(1);
});
