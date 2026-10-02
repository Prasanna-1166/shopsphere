const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting ShopSphere Real-World Database Seeding...');

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

  // 3. Create Admin Users
  const superAdmin = await prisma.user.create({
    data: {
      name: 'Rajesh Nair (Super Admin)',
      email: 'superadmin@shopsphere.com',
      passwordHash: superAdminPassword,
      role: 'SUPER_ADMIN',
      status: 'ACTIVE',
    },
  });

  const admin = await prisma.user.create({
    data: {
      name: 'Sunita Menon (Store Manager)',
      email: 'admin@shopsphere.com',
      passwordHash: adminPassword,
      role: 'ADMIN',
      status: 'ACTIVE',
    },
  });

  // 4. Create Realistic Indian Customers
  const customerData = [
    {
      name: 'Aarav Sharma',
      email: 'customer@shopsphere.com', // Primary demo customer
      phone: '+91 98201 45678',
      city: 'Bengaluru',
      state: 'Karnataka',
      pin: '560103',
      addr1: 'Flat 402, Sunshine Heights, Outer Ring Road, Bellandur',
    },
    {
      name: 'Priya Iyer',
      email: 'priya.iyer@gmail.com',
      phone: '+91 98450 12345',
      city: 'Chennai',
      state: 'Tamil Nadu',
      pin: '600028',
      addr1: 'No. 14, 2nd Cross Street, RA Puram',
    },
    {
      name: 'Rohan Kulkarni',
      email: 'rohan.k@outlook.com',
      phone: '+91 99220 87654',
      city: 'Pune',
      state: 'Maharashtra',
      pin: '411038',
      addr1: 'B-12, Mayur Colony, Kothrud',
    },
    {
      name: 'Ananya Deshmukh',
      email: 'ananya.d@yahoo.com',
      phone: '+91 98112 34567',
      city: 'Mumbai',
      state: 'Maharashtra',
      pin: '400053',
      addr1: 'A-704, Sea Breeze Apts, Lokhandwala, Andheri West',
    },
    {
      name: 'Vikramaditya Verma',
      email: 'vikram.verma@gmail.com',
      phone: '+91 98710 98765',
      city: 'New Delhi',
      state: 'Delhi',
      pin: '110017',
      addr1: 'E-45, Greater Kailash Part 1',
    },
    {
      name: 'Sneha Reddy',
      email: 'sneha.reddy@gmail.com',
      phone: '+91 98490 65432',
      city: 'Hyderabad',
      state: 'Telangana',
      pin: '500081',
      addr1: 'Plot 88, Silicon Valley, Madhapur',
    },
    {
      name: 'Harish Mehta',
      email: 'harish.mehta@gmail.com',
      phone: '+91 98250 33445',
      city: 'Ahmedabad',
      state: 'Gujarat',
      pin: '380015',
      addr1: '301, Shivalik Plaza, Satellite Road',
    },
    {
      name: 'Deblina Mukherjee',
      email: 'deblina.m@gmail.com',
      phone: '+91 98300 77889',
      city: 'Kolkata',
      state: 'West Bengal',
      pin: '700029',
      addr1: '42A, Southern Avenue, Lake Market',
    },
  ];

  const createdCustomers = [];
  for (const c of customerData) {
    const user = await prisma.user.create({
      data: {
        name: c.name,
        email: c.email,
        passwordHash: customerPassword,
        role: 'CUSTOMER',
        status: 'ACTIVE',
        cart: { create: {} },
      },
    });

    const addr = await prisma.address.create({
      data: {
        userId: user.id,
        fullName: c.name,
        phone: c.phone,
        addressLine1: c.addr1,
        city: c.city,
        state: c.state,
        postalCode: c.pin,
        country: 'India',
        isDefault: true,
      },
    });

    createdCustomers.push({ ...user, address: addr });
  }

  console.log(`👤 Created Admin accounts & ${createdCustomers.length} realistic Indian customers.`);

  // 5. Create Realistic Categories for Indian Retail Market
  const categoriesData = [
    {
      name: 'Electronics & Audio',
      slug: 'electronics-audio',
      description: 'True wireless earbuds, portable Bluetooth speakers, fast charging power banks, and everyday tech accessories.',
      image: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=600&auto=format&fit=crop&q=80',
      active: true,
    },
    {
      name: 'Home & Kitchen',
      slug: 'home-kitchen',
      description: 'Stainless steel thermal bottles, airtight storage jars, non-stick cookware, and aesthetic home organizers.',
      image: 'https://images.unsplash.com/photo-1584992236310-6edddc08acff?w=600&auto=format&fit=crop&q=80',
      active: true,
    },
    {
      name: 'Fashion & Everyday Wear',
      slug: 'fashion-apparel',
      description: 'Breathable 100% cotton tees, everyday linen shirts, casual polo tees, and comfortable loungewear.',
      image: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=600&auto=format&fit=crop&q=80',
      active: true,
    },
    {
      name: 'Personal Care & Grooming',
      slug: 'personal-care',
      description: 'Natural grooming essentials, herbal hair care, electric trimmers, and daily skin hydration kits.',
      image: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=600&auto=format&fit=crop&q=80',
      active: true,
    },
    {
      name: 'Bags & Travel Essentials',
      slug: 'bags-travel',
      description: 'Water-resistant laptop backpacks, lightweight sling bags, passport organizers, and compact duffles.',
      image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&auto=format&fit=crop&q=80',
      active: true,
    },
    {
      name: 'Workspace & Stationery',
      slug: 'workspace-stationery',
      description: 'Ergonomic laptop stands, desk organizers, smooth gel pen sets, and premium hardcover notebooks.',
      image: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=600&auto=format&fit=crop&q=80',
      active: true,
    },
  ];

  const createdCategories = {};
  for (const cat of categoriesData) {
    const created = await prisma.category.create({ data: cat });
    createdCategories[cat.slug] = created;
  }

  console.log(`📁 Created ${Object.keys(createdCategories).length} retail categories.`);

  // 6. Create 24 Realistic Products with Middle-Class Indian Pricing (₹99 – ₹3,999)
  const productsData = [
    // --- Category: Electronics & Audio ---
    {
      name: 'BoltAudio BassPods Wave Wireless Earbuds with ENC',
      slug: 'boltaudio-basspods-wave-wireless-earbuds',
      sku: 'ELEC-EAR-001',
      description: 'Quad-mic environmental noise cancellation, 13mm deep bass drivers, 40 hours total playtime with Type-C fast charging, and IPX5 sweat resistance.',
      price: 1899,
      discountPrice: 1299,
      stockQuantity: 45,
      active: true,
      categoryId: createdCategories['electronics-audio'].id,
      images: [
        { url: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=800&auto=format&fit=crop&q=80', altText: 'BoltAudio BassPods Wave Earbuds' },
      ],
    },
    {
      name: 'SoundPulse 10W Compact Bluetooth Speaker with Bass Radiator',
      slug: 'soundpulse-10w-compact-bluetooth-speaker',
      sku: 'ELEC-SPK-002',
      description: 'Portable IPX6 water-resistant speaker with 12-hour continuous battery life, built-in FM radio, microSD slot, and punchy stereo sound.',
      price: 1499,
      discountPrice: 999,
      stockQuantity: 60,
      active: true,
      categoryId: createdCategories['electronics-audio'].id,
      images: [
        { url: 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=800&auto=format&fit=crop&q=80', altText: 'SoundPulse 10W Portable Speaker' },
      ],
    },
    {
      name: 'PowerMax 20000mAh 22.5W Fast Charging Power Bank',
      slug: 'powermax-20000mah-fast-charging-power-bank',
      sku: 'ELEC-PWR-003',
      description: 'Dual USB-A and Type-C Power Delivery ports, digital LED battery display, multi-layer circuit protection, compatible with iPhone and Android.',
      price: 2199,
      discountPrice: 1499,
      stockQuantity: 38,
      active: true,
      categoryId: createdCategories['electronics-audio'].id,
      images: [
        { url: 'https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?w=800&auto=format&fit=crop&q=80', altText: 'PowerMax 20000mAh Power Bank' },
      ],
    },
    {
      name: 'TurboCharge 65W GaN Dual-Port Fast Wall Charger',
      slug: 'turbocharge-65w-gan-fast-wall-charger',
      sku: 'ELEC-CHG-004',
      description: 'Next-gen Gallium Nitride (GaN) technology for compact, ultra-fast charging of laptops, tablets, and smartphones simultaneously without overheating.',
      price: 1999,
      discountPrice: 1399,
      stockQuantity: 28,
      active: true,
      categoryId: createdCategories['electronics-audio'].id,
      images: [
        { url: 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=800&auto=format&fit=crop&q=80', altText: 'TurboCharge 65W GaN Charger' },
      ],
    },

    // --- Category: Home & Kitchen ---
    {
      name: 'Thermosteel 1000ml Vacuum Insulated Stainless Steel Bottle',
      slug: 'thermosteel-1000ml-insulated-water-bottle',
      sku: 'HOME-BOT-001',
      description: 'Double-wall food-grade 304 stainless steel keeps beverages cold for 24 hours and hot for 18 hours. Spill-proof cap with carrying loop.',
      price: 899,
      discountPrice: 649,
      stockQuantity: 75,
      active: true,
      categoryId: createdCategories['home-kitchen'].id,
      images: [
        { url: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=800&auto=format&fit=crop&q=80', altText: 'Stainless Steel Insulated Bottle' },
      ],
    },
    {
      name: 'ChefPro Tri-Ply Stainless Steel Fry Pan (24cm, Induction Base)',
      slug: 'chefpro-triply-stainless-steel-fry-pan',
      sku: 'HOME-PAN-002',
      description: 'Heavy-gauge 3-layer body for even heat distribution with zero hotspots. Riveted stay-cool ergonomic handle suitable for gas and induction stoves.',
      price: 1899,
      discountPrice: 1399,
      stockQuantity: 32,
      active: true,
      categoryId: createdCategories['home-kitchen'].id,
      images: [
        { url: 'https://images.unsplash.com/photo-1584992236310-6edddc08acff?w=800&auto=format&fit=crop&q=80', altText: 'Stainless Steel Fry Pan' },
      ],
    },
    {
      name: 'FreshLock Airtight Glass Food Container Set (Pack of 3)',
      slug: 'freshlock-airtight-glass-food-container-set',
      sku: 'HOME-JAR-003',
      description: 'Microwave and oven-safe borosilicate glass lunch containers with leakproof BPA-free locking lids (320ml, 640ml, 1040ml).',
      price: 1199,
      discountPrice: 849,
      stockQuantity: 50,
      active: true,
      categoryId: createdCategories['home-kitchen'].id,
      images: [
        { url: 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=800&auto=format&fit=crop&q=80', altText: 'Airtight Glass Container Set' },
      ],
    },
    {
      name: 'BrewMaster French Press Coffee & Tea Maker (600ml)',
      slug: 'brewmaster-french-press-coffee-maker',
      sku: 'HOME-BRW-004',
      description: 'Heat-resistant borosilicate glass carafe with 4-level stainless steel mesh filtration system for rich, smooth aromatic coffee and leaf tea.',
      price: 999,
      discountPrice: 699,
      stockQuantity: 40,
      active: true,
      categoryId: createdCategories['home-kitchen'].id,
      images: [
        { url: 'https://images.unsplash.com/photo-1517256064527-09c73fc73e38?w=800&auto=format&fit=crop&q=80', altText: 'French Press Coffee Maker' },
      ],
    },

    // --- Category: Fashion & Everyday Wear ---
    {
      name: 'Everyday Classic 100% Combed Cotton Crewneck T-Shirt (Navy)',
      slug: 'everyday-classic-combed-cotton-tshirt-navy',
      sku: 'FASH-TEE-001',
      description: '180 GSM bio-washed pre-shrunk combed cotton. Breathable, durable stitching, colorfast dye, perfect for daily casual comfort.',
      price: 699,
      discountPrice: 449,
      stockQuantity: 110,
      active: true,
      categoryId: createdCategories['fashion-apparel'].id,
      images: [
        { url: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&auto=format&fit=crop&q=80', altText: 'Navy Combed Cotton T-Shirt' },
      ],
    },
    {
      name: 'ComfortFit Pure Linen Casual Mandarin Collar Shirt',
      slug: 'comfortfit-pure-linen-casual-shirt',
      sku: 'FASH-SHT-002',
      description: 'Lightweight, naturally breathable linen-cotton blend shirt with clean roll-up sleeve tabs and relaxed silhouette for Indian summers.',
      price: 1699,
      discountPrice: 1199,
      stockQuantity: 35,
      active: true,
      categoryId: createdCategories['fashion-apparel'].id,
      images: [
        { url: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=800&auto=format&fit=crop&q=80', altText: 'Casual Linen Mandarin Shirt' },
      ],
    },
    {
      name: 'ActiveStretch Lightweight Quick-Dry Track Pants with Zip Pockets',
      slug: 'activestretch-quickdry-track-pants',
      sku: 'FASH-TRK-003',
      description: '4-way stretch polyester elastane blend with moisture-wicking technology, elasticated waistband with drawstring, and concealed zipper pockets.',
      price: 1199,
      discountPrice: 799,
      stockQuantity: 55,
      active: true,
      categoryId: createdCategories['fashion-apparel'].id,
      images: [
        { url: 'https://images.unsplash.com/photo-1552902865-b72c031ac5ea?w=800&auto=format&fit=crop&q=80', altText: 'Quick-Dry Track Pants' },
      ],
    },
    {
      name: 'Woven Canvas Casual Sneakers with Memory Foam Insole',
      slug: 'woven-canvas-casual-sneakers',
      sku: 'FASH-SNK-004',
      description: 'Durable breathable canvas upper with cushioned memory foam footbed and anti-skid rubber vulcanized outsole for everyday commute.',
      price: 1499,
      discountPrice: 999,
      stockQuantity: 42,
      active: true,
      categoryId: createdCategories['fashion-apparel'].id,
      images: [
        { url: 'https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?w=800&auto=format&fit=crop&q=80', altText: 'Woven Canvas Sneakers' },
      ],
    },

    // --- Category: Personal Care & Grooming ---
    {
      name: 'PrecisionGroom Cordless Beard Trimmer with Titanium Blades',
      slug: 'precisiongroom-cordless-beard-trimmer',
      sku: 'CARE-TRM-001',
      description: 'Self-sharpening titanium-coated blades, 20 length settings (0.5mm - 10mm precision dial), 90 minutes runtime on a single USB charge.',
      price: 1599,
      discountPrice: 1099,
      stockQuantity: 48,
      active: true,
      categoryId: createdCategories['personal-care'].id,
      images: [
        { url: 'https://images.unsplash.com/photo-1621607512214-68297480165e?w=800&auto=format&fit=crop&q=80', altText: 'Cordless Beard Trimmer' },
      ],
    },
    {
      name: 'PureBotanics Red Onion & Black Seed Hair Care Kit (Shampoo + Oil)',
      slug: 'purebotanics-red-onion-hair-care-kit',
      sku: 'CARE-HRK-002',
      description: 'Sulphate & paraben-free daily anti-hairfall therapy enriched with cold-pressed onion seed oil, bhringraj, and Moroccan argan extracts.',
      price: 799,
      discountPrice: 549,
      stockQuantity: 85,
      active: true,
      categoryId: createdCategories['personal-care'].id,
      images: [
        { url: 'https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?w=800&auto=format&fit=crop&q=80', altText: 'Herbal Hair Care Kit' },
      ],
    },
    {
      name: 'HydraGlow Vitamin C & Hyaluronic Acid Face Care Duo',
      slug: 'hydraglow-vitamin-c-face-care-duo',
      sku: 'CARE-SKN-003',
      description: 'Lightweight non-sticky Vitamin C face serum (30ml) paired with oil-free hyaluronic moisturizer (50g) for 24-hour hydration and natural radiance.',
      price: 899,
      discountPrice: 599,
      stockQuantity: 65,
      active: true,
      categoryId: createdCategories['personal-care'].id,
      images: [
        { url: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=800&auto=format&fit=crop&q=80', altText: 'Vitamin C Face Care Set' },
      ],
    },
    {
      name: 'SonicClean Electric Toothbrush with 3 Cleaning Modes',
      slug: 'sonicclean-electric-toothbrush',
      sku: 'CARE-TTH-004',
      description: '38,000 vibrations per minute sonic motor, built-in 2-minute quad-pacer smart timer, IPX7 waterproof body, and 30-day battery backup.',
      price: 1299,
      discountPrice: 899,
      stockQuantity: 30,
      active: true,
      categoryId: createdCategories['personal-care'].id,
      images: [
        { url: 'https://images.unsplash.com/photo-1559591937-e1032b4b2e88?w=800&auto=format&fit=crop&q=80', altText: 'Sonic Electric Toothbrush' },
      ],
    },

    // --- Category: Bags & Travel Essentials ---
    {
      name: 'UrbanShield 25L Water-Resistant Laptop Backpack (15.6 Inch)',
      slug: 'urbanshield-25l-water-resistant-laptop-backpack',
      sku: 'BAGS-BPK-001',
      description: 'Padded dedicated 15.6" laptop compartment, hidden anti-theft back pocket, USB charging pass-through, ergonomic breathable mesh shoulder straps.',
      price: 1799,
      discountPrice: 1199,
      stockQuantity: 58,
      active: true,
      categoryId: createdCategories['bags-travel'].id,
      images: [
        { url: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&auto=format&fit=crop&q=80', altText: 'Water-Resistant Laptop Backpack' },
      ],
    },
    {
      name: 'MetroCross Compact Crossbody Sling Bag with Tablet Sleeve',
      slug: 'metrocross-compact-crossbody-sling-bag',
      sku: 'BAGS-SLG-002',
      description: 'Lightweight unisex sling bag with water-repellent nylon fabric, key leash, quick-access front zipper, and adjustable reversible shoulder strap.',
      price: 999,
      discountPrice: 649,
      stockQuantity: 70,
      active: true,
      categoryId: createdCategories['bags-travel'].id,
      images: [
        { url: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=800&auto=format&fit=crop&q=80', altText: 'Compact Crossbody Sling Bag' },
      ],
    },
    {
      name: 'TravelPro 40L Foldable Weekend Duffle Bag with Shoe Compartment',
      slug: 'travelpro-40l-foldable-weekend-duffle-bag',
      sku: 'BAGS-DUF-003',
      description: 'Ripstop honeycomb polyester construction with isolated ventilated shoe pocket, wet-dry pouch, and luggage trolley sleeve attachment.',
      price: 1399,
      discountPrice: 899,
      stockQuantity: 44,
      active: true,
      categoryId: createdCategories['bags-travel'].id,
      images: [
        { url: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=800&auto=format&fit=crop&q=80', altText: 'Weekend Travel Duffle Bag' },
      ],
    },
    {
      name: 'LeatherCraft Slim Bifold RFID-Blocking Leather Wallet',
      slug: 'leathercraft-slim-bifold-rfid-leather-wallet',
      sku: 'BAGS-WLT-004',
      description: 'Handcrafted top-grain genuine leather with 6 card slots, 2 currency compartments, transparent ID window, and certified RFID data protection.',
      price: 899,
      discountPrice: 599,
      stockQuantity: 80,
      active: true,
      categoryId: createdCategories['bags-travel'].id,
      images: [
        { url: 'https://images.unsplash.com/photo-1627123424574-724758594e93?w=800&auto=format&fit=crop&q=80', altText: 'Genuine Leather Bifold Wallet' },
      ],
    },

    // --- Category: Workspace & Stationery ---
    {
      name: 'ErgoLift Multi-Angle Foldable Aluminum Laptop Stand',
      slug: 'ergolift-multiangle-aluminum-laptop-stand',
      sku: 'WORK-STD-001',
      description: 'Solid CNC machined aerospace-grade aluminum with 6 adjustable height levels, anti-slip silicone cushions, and foldable portable pouch.',
      price: 1299,
      discountPrice: 849,
      stockQuantity: 62,
      active: true,
      categoryId: createdCategories['workspace-stationery'].id,
      images: [
        { url: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=800&auto=format&fit=crop&q=80', altText: 'Aluminum Laptop Stand' },
      ],
    },
    {
      name: 'DeskShield Extended Dual-Sided PU Leather Desk Mat (90x45cm)',
      slug: 'deskshield-extended-leather-desk-mat',
      sku: 'WORK-MAT-002',
      description: 'Spill-resistant eco-friendly PU leather desk blotter with smooth mouse gliding surface, stitched anti-fray edges, and reversible dual colors.',
      price: 799,
      discountPrice: 499,
      stockQuantity: 90,
      active: true,
      categoryId: createdCategories['workspace-stationery'].id,
      images: [
        { url: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=800&auto=format&fit=crop&q=80', altText: 'Dual-Sided Desk Mat' },
      ],
    },
    {
      name: 'PaperKraft Hardcover A5 Dot-Grid Journal Notebook (160 Pages)',
      slug: 'paperkraft-hardcover-a5-dotgrid-journal',
      sku: 'WORK-NTB-003',
      description: '120 GSM bleed-resistant ivory paper, lay-flat thread binding, elastic closure band, dual ribbon bookmarks, and expandable rear inner pocket.',
      price: 499,
      discountPrice: 349,
      stockQuantity: 100,
      active: true,
      categoryId: createdCategories['workspace-stationery'].id,
      images: [
        { url: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=800&auto=format&fit=crop&q=80', altText: 'A5 Dot Grid Hardcover Journal' },
      ],
    },
    {
      name: 'AeroWire Magnetic Cable Management Clips (Pack of 4)',
      slug: 'aerowire-magnetic-cable-management-clips',
      sku: 'WORK-CBL-004',
      description: 'Strong magnetic locking collars with traceless 3M adhesive base, keeping charging cables, HDMI cords, and earphones organized on your desk.',
      price: 399,
      discountPrice: 249,
      stockQuantity: 120,
      active: true,
      categoryId: createdCategories['workspace-stationery'].id,
      images: [
        { url: 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=800&auto=format&fit=crop&q=80', altText: 'Magnetic Cable Management Clips' },
      ],
    },
  ];

  const createdProducts = [];
  for (const prod of productsData) {
    const { images, ...prodFields } = prod;
    const created = await prisma.product.create({
      data: {
        ...prodFields,
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

    // Record initial inventory transaction
    await prisma.inventoryTransaction.create({
      data: {
        productId: created.id,
        quantityChange: created.stockQuantity,
        previousQuantity: 0,
        newQuantity: created.stockQuantity,
        type: 'RESTOCK',
        reason: 'Initial retail inventory inward',
        performedBy: superAdmin.id,
      },
    });

    createdProducts.push(created);
  }

  console.log(`📦 Created ${createdProducts.length} retail products with middle-class Indian pricing.`);

  // 7. Seed Realistic Real-World Historical Orders across Customers
  const orderTemplates = [
    {
      customerIndex: 0, // Aarav Sharma
      daysAgo: 2,
      status: 'DELIVERED',
      paymentStatus: 'PAID',
      items: [
        { productIndex: 0, qty: 1 }, // Earbuds (₹1299)
        { productIndex: 4, qty: 1 }, // Thermosteel Bottle (₹649)
      ],
    },
    {
      customerIndex: 0, // Aarav Sharma
      daysAgo: 14,
      status: 'DELIVERED',
      paymentStatus: 'PAID',
      items: [
        { productIndex: 8, qty: 2 }, // Cotton T-shirts (2 x ₹449 = ₹898)
        { productIndex: 20, qty: 1 }, // Laptop Stand (₹849)
      ],
    },
    {
      customerIndex: 1, // Priya Iyer
      daysAgo: 5,
      status: 'SHIPPED',
      paymentStatus: 'PAID',
      items: [
        { productIndex: 6, qty: 1 }, // Glass Food Containers (₹849)
        { productIndex: 7, qty: 1 }, // French Press (₹699)
      ],
    },
    {
      customerIndex: 2, // Rohan Kulkarni
      daysAgo: 1,
      status: 'PROCESSING',
      paymentStatus: 'PAID',
      items: [
        { productIndex: 16, qty: 1 }, // Laptop Backpack (₹1199)
        { productIndex: 19, qty: 1 }, // Leather Wallet (₹599)
      ],
    },
    {
      customerIndex: 3, // Ananya Deshmukh
      daysAgo: 8,
      status: 'DELIVERED',
      paymentStatus: 'PAID',
      items: [
        { productIndex: 13, qty: 1 }, // Hair Care Kit (₹549)
        { productIndex: 14, qty: 1 }, // Vitamin C Duo (₹599)
      ],
    },
    {
      customerIndex: 4, // Vikramaditya Verma
      daysAgo: 22,
      status: 'DELIVERED',
      paymentStatus: 'PAID',
      items: [
        { productIndex: 2, qty: 1 }, // Power Bank (₹1499)
        { productIndex: 3, qty: 1 }, // GaN Charger (₹1399)
      ],
    },
    {
      customerIndex: 5, // Sneha Reddy
      daysAgo: 3,
      status: 'CONFIRMED',
      paymentStatus: 'PAID',
      items: [
        { productIndex: 9, qty: 1 }, // Linen Shirt (₹1199)
        { productIndex: 17, qty: 1 }, // Crossbody Sling (₹649)
      ],
    },
    {
      customerIndex: 6, // Harish Mehta
      daysAgo: 35,
      status: 'DELIVERED',
      paymentStatus: 'PAID',
      items: [
        { productIndex: 5, qty: 1 }, // Fry Pan (₹1399)
        { productIndex: 21, qty: 1 }, // Desk Mat (₹499)
      ],
    },
    {
      customerIndex: 7, // Deblina Mukherjee
      daysAgo: 18,
      status: 'DELIVERED',
      paymentStatus: 'PAID',
      items: [
        { productIndex: 15, qty: 1 }, // Sonic Toothbrush (₹899)
        { productIndex: 22, qty: 2 }, // Dot-Grid Journal (2 x ₹349 = ₹698)
      ],
    },
    {
      customerIndex: 1, // Priya Iyer
      daysAgo: 45,
      status: 'DELIVERED',
      paymentStatus: 'PAID',
      items: [
        { productIndex: 1, qty: 1 }, // Bluetooth Speaker (₹999)
        { productIndex: 23, qty: 1 }, // Cable clips (₹249)
      ],
    },
    {
      customerIndex: 3, // Ananya Deshmukh
      daysAgo: 60,
      status: 'DELIVERED',
      paymentStatus: 'PAID',
      items: [
        { productIndex: 18, qty: 1 }, // Travel Duffle (₹899)
        { productIndex: 10, qty: 1 }, // Track Pants (₹799)
      ],
    },
    {
      customerIndex: 0, // Aarav Sharma
      daysAgo: 0, // Today
      status: 'PENDING',
      paymentStatus: 'PENDING',
      items: [
        { productIndex: 12, qty: 1 }, // Beard Trimmer (₹1099)
      ],
    },
  ];

  for (const ord of orderTemplates) {
    const cust = createdCustomers[ord.customerIndex];
    const orderDate = new Date();
    orderDate.setDate(orderDate.getDate() - ord.daysAgo);

    let subtotal = 0;
    const orderItemsData = [];

    for (const item of ord.items) {
      const prod = createdProducts[item.productIndex];
      const unitPrice = prod.discountPrice || prod.price;
      const itemSubtotal = unitPrice * item.qty;
      subtotal += itemSubtotal;

      orderItemsData.push({
        productId: prod.id,
        productName: prod.name,
        sku: prod.sku,
        quantity: item.qty,
        unitPrice: unitPrice,
        subtotal: itemSubtotal,
      });
    }

    const shippingAddressJson = JSON.stringify({
      fullName: cust.address.fullName,
      phone: cust.address.phone,
      addressLine1: cust.address.addressLine1,
      city: cust.address.city,
      state: cust.address.state,
      postalCode: cust.address.postalCode,
      country: cust.address.country,
    });

    const createdOrder = await prisma.order.create({
      data: {
        userId: cust.id,
        subtotal: subtotal,
        totalAmount: subtotal,
        status: ord.status,
        paymentStatus: ord.paymentStatus,
        shippingAddress: shippingAddressJson,
        createdAt: orderDate,
        updatedAt: orderDate,
        items: {
          create: orderItemsData,
        },
      },
    });

    if (ord.paymentStatus === 'PAID') {
      await prisma.payment.create({
        data: {
          orderId: createdOrder.id,
          amount: subtotal,
          provider: 'UPI_GATEWAY',
          providerReference: `UPI-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`,
          status: 'PAID',
          createdAt: orderDate,
        },
      });
    }
  }

  console.log(`🛒 Seeded ${orderTemplates.length} realistic customer orders across 8 Indian metros.`);

  // 8. Create Audit Logs for Admin tracking
  await prisma.auditLog.create({
    data: {
      userId: superAdmin.id,
      action: 'SYSTEM_BOOTSTRAP',
      entity: 'SYSTEM',
      metadata: JSON.stringify({ message: 'ShopSphere Indian Retail Database initialized successfully.' }),
    },
  });

  console.log('✅ Seeding completed successfully!');
  console.log('----------------------------------------');
  console.log('🔐 Verified Login Credentials:');
  console.log('----------------------------------------');
  console.log('1. Super Admin: superadmin@shopsphere.com / SuperAdmin@123 (Admin Portal)');
  console.log('2. Store Manager: admin@shopsphere.com / Admin@123 (Admin Portal)');
  console.log('3. Demo Customer: customer@shopsphere.com / Customer@123 (Customer Storefront)');
  console.log('4. Customer 2: priya.iyer@gmail.com / Customer@123 (Customer Storefront)');
  console.log('----------------------------------------');
}

main()
  .catch((e) => {
    console.error('❌ Seeding Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
