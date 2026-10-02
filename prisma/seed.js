const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting ShopSphere Database Seeding...');

  // 1. Clean existing records in reverse dependency order
  await prisma.auditLog.deleteMany({});
  await prisma.payment.deleteMany({});
  await prisma.orderItem.deleteMany({});
  await prisma.order.deleteMany({});
  await prisma.inventoryTransaction.deleteMany({});
  await prisma.cartItem.deleteMany({});
  await prisma.cart.deleteMany({});
  await prisma.wishlist.deleteMany({});
  await prisma.address.deleteMany({});
  await prisma.productImage.deleteMany({});
  await prisma.product.deleteMany({});
  await prisma.category.deleteMany({});
  await prisma.user.deleteMany({});

  console.log('🧹 Cleaned existing database records.');

  // 2. Hash default passwords
  const superAdminPassword = await bcrypt.hash('SuperAdmin@123', 10);
  const adminPassword = await bcrypt.hash('Admin@123', 10);
  const customerPassword = await bcrypt.hash('Customer@123', 10);

  // 3. Create Users
  const superAdmin = await prisma.user.create({
    data: {
      name: 'Eleanor Vance (Super Admin)',
      email: 'superadmin@shopsphere.com',
      passwordHash: superAdminPassword,
      role: 'SUPER_ADMIN',
      status: 'ACTIVE',
    },
  });

  const admin = await prisma.user.create({
    data: {
      name: 'Marcus Brody (Store Manager)',
      email: 'admin@shopsphere.com',
      passwordHash: adminPassword,
      role: 'ADMIN',
      status: 'ACTIVE',
    },
  });

  const customer1 = await prisma.user.create({
    data: {
      name: 'Aarav Sharma',
      email: 'customer@shopsphere.com',
      passwordHash: customerPassword,
      role: 'CUSTOMER',
      status: 'ACTIVE',
      cart: {
        create: {},
      },
    },
  });

  const customer2 = await prisma.user.create({
    data: {
      name: 'Priya Patel',
      email: 'priya@example.com',
      passwordHash: customerPassword,
      role: 'CUSTOMER',
      status: 'ACTIVE',
      cart: {
        create: {},
      },
    },
  });

  console.log('👤 Created demo accounts (SUPER_ADMIN, ADMIN, CUSTOMER).');

  // 4. Create Addresses for Customer 1 & 2
  const addr1 = await prisma.address.create({
    data: {
      userId: customer1.id,
      fullName: 'Aarav Sharma',
      phone: '+91 98765 43210',
      addressLine1: 'Flat 402, Sunshine Heights',
      addressLine2: 'Outer Ring Road, Bellandur',
      city: 'Bengaluru',
      state: 'Karnataka',
      postalCode: '560103',
      country: 'India',
      isDefault: true,
    },
  });

  await prisma.address.create({
    data: {
      userId: customer1.id,
      fullName: 'Aarav Sharma (Office)',
      phone: '+91 98765 43210',
      addressLine1: 'Tech Park Block B, 5th Floor',
      city: 'Bengaluru',
      state: 'Karnataka',
      postalCode: '560066',
      country: 'India',
      isDefault: false,
    },
  });

  // 5. Create Categories
  const categoriesData = [
    {
      name: 'Electronics & Audio',
      slug: 'electronics-audio',
      description: 'High-fidelity headphones, smart home gear, and cutting-edge audio technology.',
      image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&auto=format&fit=crop&q=80',
      active: true,
    },
    {
      name: 'Fashion & Apparel',
      slug: 'fashion-apparel',
      description: 'Modern silhouettes, premium fabrics, and street-ready urban essentials.',
      image: 'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=600&auto=format&fit=crop&q=80',
      active: true,
    },
    {
      name: 'Home & Living',
      slug: 'home-living',
      description: 'Minimalist decor, ergonomic furniture, and cozy accents for contemporary homes.',
      image: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=600&auto=format&fit=crop&q=80',
      active: true,
    },
    {
      name: 'Footwear & Sneakerhead',
      slug: 'footwear-sneakers',
      description: 'Engineered performance trainers, iconic lifestyle kicks, and handcrafted leather footwear.',
      image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&auto=format&fit=crop&q=80',
      active: true,
    },
    {
      name: 'Accessories & Watches',
      slug: 'accessories-watches',
      description: 'Timepieces, vegan leather wallets, polarized optics, and everyday carry essentials.',
      image: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=600&auto=format&fit=crop&q=80',
      active: true,
    },
    {
      name: 'Workspace & Stationery',
      slug: 'workspace-stationery',
      description: 'Mechanical keyboards, desk mats, fountain pens, and productivity accessories.',
      image: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=600&auto=format&fit=crop&q=80',
      active: true,
    },
  ];

  const createdCategories = {};
  for (const cat of categoriesData) {
    const created = await prisma.category.create({ data: cat });
    createdCategories[cat.slug] = created;
  }

  console.log(`📁 Created ${Object.keys(createdCategories).length} categories.`);

  // 6. Create 22 Rich Products with Images
  const productsData = [
    // Category: Electronics & Audio
    {
      name: 'SphereAcoustics Pro Wireless ANC Headphones',
      slug: 'sphereacoustics-pro-wireless-anc-headphones',
      sku: 'ELEC-ANC-001',
      description: 'Engineered with custom 45mm neodymium drivers and hybrid active noise cancellation, delivering pristine studio-grade frequency response and up to 40 hours of battery life.',
      price: 14999,
      discountPrice: 11999,
      stockQuantity: 45,
      active: true,
      categoryId: createdCategories['electronics-audio'].id,
      images: [
        { url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=80', altText: 'Studio ANC Headphones Front' },
        { url: 'https://images.unsplash.com/photo-1484704849700-f032a568e944?w=800&auto=format&fit=crop&q=80', altText: 'Earcups detail' },
      ],
    },
    {
      name: 'AuraSound Compact Portable Bluetooth 5.3 Speaker',
      slug: 'aurasound-compact-portable-speaker',
      sku: 'ELEC-SPK-002',
      description: 'IPX7 waterproof ultra-portable Bluetooth speaker featuring dual passive radiators for deep bass, 360-degree room-filling acoustic distribution, and 16 hours of continuous playtime.',
      price: 4499,
      discountPrice: 3299,
      stockQuantity: 60,
      active: true,
      categoryId: createdCategories['electronics-audio'].id,
      images: [
        { url: 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=800&auto=format&fit=crop&q=80', altText: 'Portable Speaker Black' },
      ],
    },
    {
      name: 'PulseFlow True Wireless Earbuds with Spatial Audio',
      slug: 'pulseflow-tws-earbuds',
      sku: 'ELEC-TWS-003',
      description: 'Ultra-low latency wireless earbuds with dynamic head tracking, transparency mode, beamforming quadruple microphones, and Qi wireless fast charging case.',
      price: 6999,
      discountPrice: 5499,
      stockQuantity: 3, // LOW STOCK
      active: true,
      categoryId: createdCategories['electronics-audio'].id,
      images: [
        { url: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=800&auto=format&fit=crop&q=80', altText: 'PulseFlow TWS In Charging Case' },
      ],
    },
    {
      name: 'NovaDesk Hi-Res Studio Desktop Reference Monitors',
      slug: 'novadesk-studio-monitors',
      sku: 'ELEC-MON-004',
      description: 'Biamplified 50W desktop acoustic reference speakers with woven glass fiber woofers, silk dome tweeters, and balanced TRS inputs for pristine mix monitoring.',
      price: 18999,
      discountPrice: null,
      stockQuantity: 0, // OUT OF STOCK
      active: true,
      categoryId: createdCategories['electronics-audio'].id,
      images: [
        { url: 'https://images.unsplash.com/photo-1545454675-3531b543be5d?w=800&auto=format&fit=crop&q=80', altText: 'Hi-Res Studio Monitors Pair' },
      ],
    },

    // Category: Fashion & Apparel
    {
      name: 'UrbanHeavyweight 450GSM French Terry Hoodie',
      slug: 'urban-heavyweight-french-terry-hoodie',
      sku: 'FASH-HOD-001',
      description: 'Crafted from 100% organic custom-milled heavyweight combed cotton with double-needle ribbed side panels and a tailored oversized street fit.',
      price: 3499,
      discountPrice: 2799,
      stockQuantity: 80,
      active: true,
      categoryId: createdCategories['fashion-apparel'].id,
      images: [
        { url: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=800&auto=format&fit=crop&q=80', altText: 'Charcoal Black Heavyweight Hoodie' },
      ],
    },
    {
      name: 'Komorebi Relaxed Fit Japanese Selvedge Denim',
      slug: 'komorebi-relaxed-selvedge-denim',
      sku: 'FASH-JNS-002',
      description: '14oz raw indigo shuttle-loom woven denim with copper hardware, chain-stitched hems, and distinctive red selvedge ID line.',
      price: 5999,
      discountPrice: 4899,
      stockQuantity: 25,
      active: true,
      categoryId: createdCategories['fashion-apparel'].id,
      images: [
        { url: 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=800&auto=format&fit=crop&q=80', altText: 'Indigo Raw Selvedge Denim Jeans' },
      ],
    },
    {
      name: 'Solstice All-Weather Technical Shell Windbreaker',
      slug: 'solstice-technical-windbreaker',
      sku: 'FASH-JKT-003',
      description: 'Waterproof breathable 3-layer membrane jacket featuring YKK AquaGuard seam-sealed zippers, reflective accents, and adjustable storm hood.',
      price: 7499,
      discountPrice: null,
      stockQuantity: 18,
      active: true,
      categoryId: createdCategories['fashion-apparel'].id,
      images: [
        { url: 'https://images.unsplash.com/photo-1548883354-7622d03aca27?w=800&auto=format&fit=crop&q=80', altText: 'Technical Windbreaker Jacket' },
      ],
    },
    {
      name: 'Merino Wool Minimalist Crewneck Sweater',
      slug: 'merino-wool-crewneck-sweater',
      sku: 'FASH-SWT-004',
      description: 'Ultra-fine 19.5 micron Australian extrafine merino wool knit, naturally odor-resistant, thermo-regulating, and exceptionally soft against skin.',
      price: 4299,
      discountPrice: 3599,
      stockQuantity: 4, // LOW STOCK
      active: true,
      categoryId: createdCategories['fashion-apparel'].id,
      images: [
        { url: 'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=800&auto=format&fit=crop&q=80', altText: 'Oatmeal Heather Crewneck Sweater' },
      ],
    },

    // Category: Footwear & Sneakerhead
    {
      name: 'Vortex Phantom Responsive Running Trainers',
      slug: 'vortex-phantom-running-trainers',
      sku: 'FOOT-RUN-001',
      description: 'Engineered jacquard mesh upper paired with supercritical nitrogen-infused foam midsole for maximum energy return and marathon-tested durability.',
      price: 8999,
      discountPrice: 6999,
      stockQuantity: 52,
      active: true,
      categoryId: createdCategories['footwear-sneakers'].id,
      images: [
        { url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&auto=format&fit=crop&q=80', altText: 'Vortex Phantom Trainers Scarlet Red' },
      ],
    },
    {
      name: 'Heritage Low-Top Full-Grain Leather Sneakers',
      slug: 'heritage-low-top-leather-sneakers',
      sku: 'FOOT-SNK-002',
      description: 'Hand-stitched Tuscan calfskin leather minimalist sneakers featuring Italian Margom rubber cupsoles and removable memory foam insoles.',
      price: 9999,
      discountPrice: 7999,
      stockQuantity: 30,
      active: true,
      categoryId: createdCategories['footwear-sneakers'].id,
      images: [
        { url: 'https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?w=800&auto=format&fit=crop&q=80', altText: 'Classic White Low-top Leather Sneakers' },
      ],
    },
    {
      name: 'TerraGrip Waterproof Trail Hiking Boots',
      slug: 'terragrip-trail-hiking-boots',
      sku: 'FOOT-BOT-003',
      description: 'Rugged nubuck leather construction with high-traction Vibram Megagrip outsoles, reinforced TPU toe caps, and waterproof inner bootie.',
      price: 11499,
      discountPrice: null,
      stockQuantity: 14,
      active: true,
      categoryId: createdCategories['footwear-sneakers'].id,
      images: [
        { url: 'https://images.unsplash.com/photo-1520639888713-7851133b1ed0?w=800&auto=format&fit=crop&q=80', altText: 'Rugged Trail Hiking Boots' },
      ],
    },

    // Category: Home & Living
    {
      name: 'Lumora Ambient Dimmable Ceramic Table Lamp',
      slug: 'lumora-ambient-ceramic-table-lamp',
      sku: 'HOME-LMP-001',
      description: 'Hand-thrown terracotta ceramic base paired with an unbleached linen drum shade. Features smooth 3-level brass rotary touch dimming and warm 2700K LED glow.',
      price: 3899,
      discountPrice: 2999,
      stockQuantity: 35,
      active: true,
      categoryId: createdCategories['home-living'].id,
      images: [
        { url: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=800&auto=format&fit=crop&q=80', altText: 'Terracotta Ceramic Table Lamp' },
      ],
    },
    {
      name: 'AromaZen Ultrasonic Essential Oil Diffuser',
      slug: 'aromazen-ultrasonic-diffuser',
      sku: 'HOME-DIF-002',
      description: 'Whisper-quiet cold ultrasonic mist diffuser with genuine bamboo exterior housing, ambient breathing mood lighting, and auto-shutoff safety timer.',
      price: 2499,
      discountPrice: 1899,
      stockQuantity: 48,
      active: true,
      categoryId: createdCategories['home-living'].id,
      images: [
        { url: 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=800&auto=format&fit=crop&q=80', altText: 'Bamboo Ultrasonic Diffuser' },
      ],
    },
    {
      name: 'Nordic Solid Walnut Ergonomic Accent Chair',
      slug: 'nordic-walnut-accent-chair',
      sku: 'HOME-CHR-003',
      description: 'Sculptural solid American walnut frame with boucle upholstered high-density foam cushions and ergonomic lumbar contouring.',
      price: 24999,
      discountPrice: 19999,
      stockQuantity: 6,
      active: true,
      categoryId: createdCategories['home-living'].id,
      images: [
        { url: 'https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?w=800&auto=format&fit=crop&q=80', altText: 'Nordic Walnut Lounge Chair' },
      ],
    },
    {
      name: 'Artisan Handwoven Wool Area Rug (5x8 ft)',
      slug: 'artisan-handwoven-wool-rug',
      sku: 'HOME-RUG-004',
      description: 'Fair-trade hand-loomed 100% New Zealand wool rug featuring subtle geometric tribal motifs and plush underfoot pile height.',
      price: 12999,
      discountPrice: null,
      stockQuantity: 12,
      active: true,
      categoryId: createdCategories['home-living'].id,
      images: [
        { url: 'https://images.unsplash.com/photo-1600121848594-d8644e57abab?w=800&auto=format&fit=crop&q=80', altText: 'Handwoven Minimalist Wool Rug' },
      ],
    },

    // Category: Accessories & Watches
    {
      name: 'Chronos Classic Bauhaus Automatic Watch 40mm',
      slug: 'chronos-classic-bauhaus-automatic-watch',
      sku: 'ACCS-WAT-001',
      description: 'Miyota 9015 Japanese 24-jewel automatic movement, double-domed anti-reflective sapphire crystal, surgical 316L stainless steel case, and quick-release leather strap.',
      price: 16999,
      discountPrice: 13499,
      stockQuantity: 22,
      active: true,
      categoryId: createdCategories['accessories-watches'].id,
      images: [
        { url: 'https://images.unsplash.com/photo-1524805444758-089113d48a6d?w=800&auto=format&fit=crop&q=80', altText: 'Bauhaus Automatic Watch' },
      ],
    },
    {
      name: 'Aegis Slim RFID-Blocking Top Grain Leather Wallet',
      slug: 'aegis-rfid-leather-wallet',
      sku: 'ACCS-WLT-002',
      description: 'Handcrafted vegetable-tanned bifold wallet holding up to 10 cards and flat currency with integrated aerospace aluminum RFID electromagnetic shielding.',
      price: 2199,
      discountPrice: 1699,
      stockQuantity: 90,
      active: true,
      categoryId: createdCategories['accessories-watches'].id,
      images: [
        { url: 'https://images.unsplash.com/photo-1627123424574-724758594e93?w=800&auto=format&fit=crop&q=80', altText: 'Top Grain Slim Leather Wallet' },
      ],
    },
    {
      name: 'SolRay Polarized Classic Acetate Sunglasses',
      slug: 'solray-polarized-acetate-sunglasses',
      sku: 'ACCS-SUN-003',
      description: 'Hand-polished cellulose acetate frames with Japanese 7-barrel hinges and category 3 polarized UV400 scratch-resistant mineral glass lenses.',
      price: 3999,
      discountPrice: 2999,
      stockQuantity: 40,
      active: true,
      categoryId: createdCategories['accessories-watches'].id,
      images: [
        { url: 'https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=800&auto=format&fit=crop&q=80', altText: 'Handcrafted Acetate Sunglasses' },
      ],
    },

    // Category: Workspace & Stationery
    {
      name: 'KeyForge Mechanical 75% Wireless Keyboard',
      slug: 'keyforge-75-mechanical-keyboard',
      sku: 'WORK-KBD-001',
      description: 'Gasket-mounted CNC anodized aluminum chassis, pre-lubed Gateron Pro switches, hot-swappable PCB, PBT dye-sub keycaps, and tri-mode Bluetooth/2.4G/USB-C connectivity.',
      price: 10999,
      discountPrice: 8999,
      stockQuantity: 38,
      active: true,
      categoryId: createdCategories['workspace-stationery'].id,
      images: [
        { url: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=800&auto=format&fit=crop&q=80', altText: 'Custom Mechanical 75% Keyboard' },
      ],
    },
    {
      name: 'DeskMat Pro Ergonomic Felt & Vegan Leather Desk Pad',
      slug: 'deskmat-pro-felt-leather-pad',
      sku: 'WORK-MAT-002',
      description: 'Dual-sided 900x400mm oversized executive desk organizer pad made from waterproof scratch-proof PU leather backed with natural Merino wool felt.',
      price: 1799,
      discountPrice: 1299,
      stockQuantity: 70,
      active: true,
      categoryId: createdCategories['workspace-stationery'].id,
      images: [
        { url: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=800&auto=format&fit=crop&q=80', altText: 'Executive Desk Mat Minimalist' },
      ],
    },
    {
      name: 'Precision Aluminum Laptop Stand with 360 Rotation',
      slug: 'precision-aluminum-laptop-stand',
      sku: 'WORK-STD-003',
      description: 'Aircraft-grade sandblasted aluminum stand with dual-axis damping hinges and 360-degree silent swivel base for posture-perfect workstation ergonomics.',
      price: 2899,
      discountPrice: 2299,
      stockQuantity: 55,
      active: true,
      categoryId: createdCategories['workspace-stationery'].id,
      images: [
        { url: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=800&auto=format&fit=crop&q=80', altText: 'Adjustable Aluminum Laptop Stand' },
      ],
    },
    {
      name: 'Kaweco Style Brass Pocket Fountain Pen',
      slug: 'kaweco-style-brass-fountain-pen',
      sku: 'WORK-PEN-004',
      description: 'Machined solid raw brass fountain pen with stainless steel medium nib that develops a unique vintage patina over time with daily use.',
      price: 3499,
      discountPrice: null,
      stockQuantity: 2, // LOW STOCK
      active: true,
      categoryId: createdCategories['workspace-stationery'].id,
      images: [
        { url: 'https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?w=800&auto=format&fit=crop&q=80', altText: 'Solid Brass Pocket Fountain Pen' },
      ],
    },
  ];

  const createdProducts = [];
  for (const p of productsData) {
    const { images, ...prodData } = p;
    const created = await prisma.product.create({
      data: {
        ...prodData,
        images: {
          create: images.map((img, idx) => ({
            url: img.url,
            altText: img.altText,
            sortOrder: idx,
          })),
        },
      },
      include: { images: true },
    });
    createdProducts.push(created);

    // Create initial restock inventory transaction
    await prisma.inventoryTransaction.create({
      data: {
        productId: created.id,
        quantityChange: created.stockQuantity,
        previousQuantity: 0,
        newQuantity: created.stockQuantity,
        type: 'RESTOCK',
        reason: 'Initial warehouse inventory stock',
        performedBy: admin.id,
      },
    });
  }

  console.log(`📦 Created ${createdProducts.length} products with stock and inventory transactions.`);

  // 7. Seed Sample Orders for Customer 1
  const order1Products = [createdProducts[0], createdProducts[4]]; // ANC Headphones & Hoodie
  const order1Subtotal = (createdProducts[0].discountPrice || createdProducts[0].price) * 1 +
                         (createdProducts[4].discountPrice || createdProducts[4].price) * 1;
  const order1Shipping = 0;
  const order1Total = order1Subtotal + order1Shipping;

  const order1 = await prisma.order.create({
    data: {
      userId: customer1.id,
      subtotal: order1Subtotal,
      discount: 0,
      shippingAmount: order1Shipping,
      totalAmount: order1Total,
      status: 'DELIVERED',
      paymentStatus: 'PAID',
      shippingAddress: {
        fullName: addr1.fullName,
        phone: addr1.phone,
        addressLine1: addr1.addressLine1,
        addressLine2: addr1.addressLine2,
        city: addr1.city,
        state: addr1.state,
        postalCode: addr1.postalCode,
        country: addr1.country,
      },
      items: {
        create: [
          {
            productId: createdProducts[0].id,
            productName: createdProducts[0].name,
            sku: createdProducts[0].sku,
            unitPrice: createdProducts[0].discountPrice || createdProducts[0].price,
            quantity: 1,
            subtotal: createdProducts[0].discountPrice || createdProducts[0].price,
          },
          {
            productId: createdProducts[4].id,
            productName: createdProducts[4].name,
            sku: createdProducts[4].sku,
            unitPrice: createdProducts[4].discountPrice || createdProducts[4].price,
            quantity: 1,
            subtotal: createdProducts[4].discountPrice || createdProducts[4].price,
          },
        ],
      },
      payments: {
        create: {
          provider: 'MOCK',
          providerReference: 'MOCK-PAY-TXN-882193',
          amount: order1Total,
          currency: 'INR',
          status: 'PAID',
          metadata: { cardLast4: '4242', method: 'UPI / Mock Card' },
        },
      },
    },
  });

  // Order 2: Processing
  const order2 = await prisma.order.create({
    data: {
      userId: customer1.id,
      subtotal: createdProducts[8].discountPrice || createdProducts[8].price, // Trainers
      discount: 0,
      shippingAmount: 99,
      totalAmount: (createdProducts[8].discountPrice || createdProducts[8].price) + 99,
      status: 'PROCESSING',
      paymentStatus: 'PAID',
      shippingAddress: {
        fullName: addr1.fullName,
        phone: addr1.phone,
        addressLine1: addr1.addressLine1,
        city: addr1.city,
        state: addr1.state,
        postalCode: addr1.postalCode,
        country: addr1.country,
      },
      items: {
        create: [
          {
            productId: createdProducts[8].id,
            productName: createdProducts[8].name,
            sku: createdProducts[8].sku,
            unitPrice: createdProducts[8].discountPrice || createdProducts[8].price,
            quantity: 1,
            subtotal: createdProducts[8].discountPrice || createdProducts[8].price,
          },
        ],
      },
      payments: {
        create: {
          provider: 'MOCK',
          providerReference: 'MOCK-PAY-TXN-991024',
          amount: (createdProducts[8].discountPrice || createdProducts[8].price) + 99,
          currency: 'INR',
          status: 'PAID',
          metadata: { method: 'NetBanking' },
        },
      },
    },
  });

  // 8. Wishlist item for Customer 1
  await prisma.wishlist.create({
    data: {
      userId: customer1.id,
      productId: createdProducts[15].id, // Bauhaus Watch
    },
  });

  // 9. Initial Audit Logs
  await prisma.auditLog.createMany({
    data: [
      {
        userId: superAdmin.id,
        action: 'STORE_INITIALIZATION',
        entity: 'SYSTEM',
        entityId: 'SYSTEM-ROOT',
        metadata: { message: 'ShopSphere production seed initialized with standard catalog' },
      },
      {
        userId: admin.id,
        action: 'ORDER_STATUS_UPDATE',
        entity: 'ORDER',
        entityId: order1.id,
        metadata: { previousStatus: 'SHIPPED', newStatus: 'DELIVERED' },
      },
      {
        userId: admin.id,
        action: 'ORDER_STATUS_UPDATE',
        entity: 'ORDER',
        entityId: order2.id,
        metadata: { previousStatus: 'CONFIRMED', newStatus: 'PROCESSING' },
      },
    ],
  });

  console.log('✅ Seeding completed successfully!');
  console.log('\n----------------------------------------');
  console.log('🔐 Demo Credentials for Testing:');
  console.log('----------------------------------------');
  console.log('1. Super Admin: superadmin@shopsphere.com / SuperAdmin@123');
  console.log('2. Admin:       admin@shopsphere.com / Admin@123');
  console.log('3. Customer:    customer@shopsphere.com / Customer@123');
  console.log('4. Customer 2:  priya@example.com / Customer@123');
  console.log('----------------------------------------\n');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
