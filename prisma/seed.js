const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

let directUrl = (process.env.DATABASE_URL || '').replace('-pooler', '');
if (directUrl && !directUrl.includes('connect_timeout')) {
  directUrl += (directUrl.includes('?') ? '&' : '?') + 'connect_timeout=30';
}
process.env.DATABASE_URL = directUrl;

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: directUrl,
    },
  },
});

async function main() {
  console.log('🌱 Starting ShopSphere Clean Production Database Seeding...');
  console.log('ℹ️ Target Database: Neon PostgreSQL');

  // 1. Clean existing records in reverse dependency order
  console.log('🧹 Purging any leftover mock/testing records...');
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

  console.log('✅ Clean database purge complete.');

  // 2. Hash initial secure administrative credentials
  const superAdminPassword = await bcrypt.hash('SuperAdmin@123', 10);
  const adminPassword = await bcrypt.hash('Admin@123', 10);

  // 3. Create Administrative Accounts ONLY (NO fake customers)
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

  console.log(`👤 Created 2 administrative users (Super Admin & Store Manager). Customers count: 0.`);

  // 4. Create 7 Realistic Categories for Indian Retail Market
  const categoriesData = [
    {
      id: 'cat_home_kitchen',
      name: 'Home & Kitchen',
      slug: 'home-kitchen',
      description: 'Stainless steel thermal bottles, non-stick cookware, airtight storage containers, and kitchen appliances.',
      image: 'https://images.unsplash.com/photo-1584992236310-6edddc08acff?w=600&auto=format&fit=crop&q=80',
      active: true,
    },
    {
      id: 'cat_electronics_accessories',
      name: 'Electronics & Audio',
      slug: 'electronics-accessories',
      description: 'Wireless earbuds, Bluetooth portable speakers, fast charging power banks, and USB accessories.',
      image: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=600&auto=format&fit=crop&q=80',
      active: true,
    },
    {
      id: 'cat_fashion_apparel',
      name: 'Fashion & Apparel',
      slug: 'fashion-apparel',
      description: 'Comfortable everyday wear, pure cotton basics, backpacks, and accessories.',
      image: 'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=600&auto=format&fit=crop&q=80',
      active: true,
    },
    {
      id: 'cat_personal_care',
      name: 'Personal Care & Grooming',
      slug: 'personal-care',
      description: 'Gentle skincare, grooming trimmers, hair dryers, and wellness essentials.',
      image: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=600&auto=format&fit=crop&q=80',
      active: true,
    },
    {
      id: 'cat_grocery_daily_needs',
      name: 'Grocery & Daily Needs',
      slug: 'grocery-daily-needs',
      description: 'Estate teas, organic dry fruits, stone-ground coffee, and pure staples.',
      image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=600&auto=format&fit=crop&q=80',
      active: true,
    },
    {
      id: 'cat_stationery_office',
      name: 'Stationery & Office',
      slug: 'stationery-office',
      description: 'Quality notebooks, gel pens, desk organizers, and study lighting.',
      image: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=600&auto=format&fit=crop&q=80',
      active: true,
    },
    {
      id: 'cat_mobile_accessories',
      name: 'Mobile Accessories',
      slug: 'mobile-accessories',
      description: 'Fast chargers, slim power banks, car mounts, and phone stands.',
      image: 'https://images.unsplash.com/photo-1586953208448-b95a79798f07?w=600&auto=format&fit=crop&q=80',
      active: true,
    },
  ];

  for (const cat of categoriesData) {
    await prisma.category.create({ data: cat });
  }

  console.log(`📁 Created ${categoriesData.length} retail categories.`);

  // 5. Create 38 Realistic Products with Believable Indian Pricing (₹99 – ₹2,499)
  const productsData = [
    // --- 1. Home & Kitchen ---
    {
      name: 'Thermosteel 1000ml Vacuum Insulated Stainless Steel Bottle',
      slug: 'thermosteel-1000ml-insulated-water-bottle',
      sku: 'HK-BOT-001',
      description: 'Double-wall food-grade 304 stainless steel keeps beverages cold for 24 hours and hot for 18 hours. Leak-proof cap with carrying handle for gym, office, and travel.',
      price: 899,
      discountPrice: 649,
      stockQuantity: 75,
      active: true,
      categoryId: 'cat_home_kitchen',
      images: [
        { url: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=800&auto=format&fit=crop&q=80', altText: 'Thermosteel 1000ml Vacuum Insulated Stainless Steel Bottle' }
      ],
    },
    {
      name: 'ChefPro Tri-Ply Stainless Steel Fry Pan (24cm, Induction Base)',
      slug: 'chefpro-triply-stainless-steel-fry-pan',
      sku: 'HK-PAN-002',
      description: 'Heavy-gauge 3-layer body for even heat distribution with zero hotspots. Riveted stay-cool ergonomic handle suitable for gas and induction cooktops.',
      price: 1899,
      discountPrice: 1399,
      stockQuantity: 32,
      active: true,
      categoryId: 'cat_home_kitchen',
      images: [
        { url: 'https://images.unsplash.com/photo-1584992236310-6edddc08acff?w=800&auto=format&fit=crop&q=80', altText: 'ChefPro Tri-Ply Stainless Steel Fry Pan' }
      ],
    },
    {
      name: 'FreshLock Airtight Glass Food Container Set (Pack of 3, Borosilicate)',
      slug: 'freshlock-airtight-glass-food-container-set',
      sku: 'HK-JAR-003',
      description: 'Microwave and oven-safe borosilicate glass lunch containers with leakproof BPA-free locking lids (320ml, 640ml, 1040ml). Ideal for meal prep and office lunches.',
      price: 1199,
      discountPrice: 849,
      stockQuantity: 50,
      active: true,
      categoryId: 'cat_home_kitchen',
      images: [
        { url: 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=800&auto=format&fit=crop&q=80', altText: 'FreshLock Airtight Glass Food Container Set' }
      ],
    },
    {
      name: 'Automatic Electric Kettle 1.8 Litre Stainless Steel',
      slug: 'automatic-electric-kettle-1-8l',
      sku: 'HK-KET-004',
      description: '1500W rapid boiling electric kettle with automatic shut-off and boil-dry protection. 360-degree swivel cordless base with easy-grip cool touch handle.',
      price: 1199,
      discountPrice: 849,
      stockQuantity: 35,
      active: true,
      categoryId: 'cat_home_kitchen',
      images: [
        { url: 'https://images.unsplash.com/photo-1594213114663-ddf4f240f106?w=800&auto=format&fit=crop&q=80', altText: 'Automatic Electric Kettle 1.8 Litre Stainless Steel' }
      ],
    },
    {
      name: 'Stainless Steel Insulated Lunch Box with Thermal Bag (3 Containers)',
      slug: 'insulated-stainless-steel-lunch-box-3-containers',
      sku: 'HK-LUN-005',
      description: 'Compact 3-tier mirror finish stainless steel tiffin set with leak-resistant silicone gaskets and insulated fabric carrying case to keep meals fresh and warm.',
      price: 999,
      discountPrice: 749,
      stockQuantity: 60,
      active: true,
      categoryId: 'cat_home_kitchen',
      images: [
        { url: 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=800&auto=format&fit=crop&q=80', altText: 'Stainless Steel Insulated Lunch Box' }
      ],
    },
    {
      name: 'Precision Kitchen Chef Knife Set with Wooden Block (6 Pieces)',
      slug: 'precision-kitchen-chef-knife-set-6pc',
      sku: 'HK-KNF-006',
      description: 'High-carbon stainless steel blades with ergonomic slip-resistant handles. Includes 8-inch chef knife, bread knife, santoku knife, utility knife, paring knife, and pine block.',
      price: 2499,
      discountPrice: 1799,
      stockQuantity: 25,
      active: true,
      categoryId: 'cat_home_kitchen',
      images: [
        { url: 'https://images.unsplash.com/photo-1593618998160-e34014e67546?w=800&auto=format&fit=crop&q=80', altText: 'Precision Kitchen Chef Knife Set' }
      ],
    },

    // --- 2. Electronics & Audio ---
    {
      name: 'BoltAudio BassPods Wave Wireless Earbuds with ENC',
      slug: 'boltaudio-basspods-wave-wireless-earbuds',
      sku: 'EA-EAR-001',
      description: 'Quad-mic environmental noise cancellation, 13mm deep bass drivers, 40 hours total playtime with Type-C fast charging, and IPX5 sweat resistance.',
      price: 1899,
      discountPrice: 1299,
      stockQuantity: 45,
      active: true,
      categoryId: 'cat_electronics_accessories',
      images: [
        { url: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=800&auto=format&fit=crop&q=80', altText: 'BoltAudio BassPods Wave Earbuds' }
      ],
    },
    {
      name: 'SoundPulse 10W Compact Bluetooth Speaker with Bass Radiator',
      slug: 'soundpulse-10w-compact-bluetooth-speaker',
      sku: 'EA-SPK-002',
      description: 'Portable IPX6 water-resistant speaker with 12-hour continuous battery life, built-in FM radio, microSD slot, and punchy stereo sound.',
      price: 1499,
      discountPrice: 999,
      stockQuantity: 60,
      active: true,
      categoryId: 'cat_electronics_accessories',
      images: [
        { url: 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=800&auto=format&fit=crop&q=80', altText: 'SoundPulse 10W Portable Speaker' }
      ],
    },
    {
      name: 'PowerMax 20000mAh 22.5W Fast Charging Power Bank',
      slug: 'powermax-20000mah-fast-charging-power-bank',
      sku: 'EA-PWR-003',
      description: 'Dual USB-A and Type-C Power Delivery ports, digital LED battery display, multi-layer circuit protection, compatible with iPhone and Android.',
      price: 2199,
      discountPrice: 1499,
      stockQuantity: 38,
      active: true,
      categoryId: 'cat_electronics_accessories',
      images: [
        { url: 'https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?w=800&auto=format&fit=crop&q=80', altText: 'PowerMax 20000mAh Power Bank' }
      ],
    },
    {
      name: 'SilentClick 2.4GHz Wireless Optical Mouse with Nano Receiver',
      slug: 'silentclick-wireless-optical-mouse',
      sku: 'EA-MOU-004',
      description: 'Ergonomic contoured profile with 90% quieter clicking sound, 1600 DPI 3-level sensitivity switch, and 12-month battery life with smart auto-sleep.',
      price: 699,
      discountPrice: 449,
      stockQuantity: 80,
      active: true,
      categoryId: 'cat_electronics_accessories',
      images: [
        { url: 'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=800&auto=format&fit=crop&q=80', altText: 'SilentClick Wireless Optical Mouse' }
      ],
    },
    {
      name: 'Braided 4-in-1 Multi USB Fast Charging Cable (1.2m)',
      slug: 'braided-4-in-1-multi-usb-charging-cable',
      sku: 'EA-CAB-005',
      description: 'Heavy-duty nylon braided cable with 2x Lightning, Type-C, and Micro USB connectors. Reinforced strain relief and 3A fast charging.',
      price: 499,
      discountPrice: 299,
      stockQuantity: 120,
      active: true,
      categoryId: 'cat_electronics_accessories',
      images: [
        { url: 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=800&auto=format&fit=crop&q=80', altText: 'Braided 4-in-1 Multi USB Cable' }
      ],
    },
    {
      name: 'HD 1080p USB Web Camera with Built-in Noise-Cancelling Mic',
      slug: 'hd-1080p-usb-web-camera-with-microphone',
      sku: 'EA-CAM-006',
      description: 'Full HD 1080p 30fps video stream with automatic low-light correction, universal monitor clip, and privacy shutter for Zoom and Teams meetings.',
      price: 1999,
      discountPrice: 1399,
      stockQuantity: 28,
      active: true,
      categoryId: 'cat_electronics_accessories',
      images: [
        { url: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=800&auto=format&fit=crop&q=80', altText: 'HD 1080p USB Web Camera' }
      ],
    },

    // --- 3. Fashion & Apparel ---
    {
      name: 'Everyday Classic 100% Combed Cotton Crewneck T-Shirt (Navy)',
      slug: 'everyday-classic-combed-cotton-tshirt-navy',
      sku: 'FA-TEE-001',
      description: '180 GSM bio-washed pre-shrunk combed cotton. Breathable, durable stitching, colorfast dye, perfect for daily casual comfort.',
      price: 699,
      discountPrice: 449,
      stockQuantity: 110,
      active: true,
      categoryId: 'cat_fashion_apparel',
      images: [
        { url: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&auto=format&fit=crop&q=80', altText: 'Navy Combed Cotton T-Shirt' }
      ],
    },
    {
      name: 'ComfortFit Pure Linen Casual Mandarin Collar Shirt',
      slug: 'comfortfit-pure-linen-casual-shirt',
      sku: 'FA-SHT-002',
      description: 'Lightweight, naturally breathable linen-cotton blend shirt with clean roll-up sleeve tabs and relaxed silhouette for Indian summers.',
      price: 1699,
      discountPrice: 1199,
      stockQuantity: 35,
      active: true,
      categoryId: 'cat_fashion_apparel',
      images: [
        { url: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=800&auto=format&fit=crop&q=80', altText: 'Casual Linen Mandarin Shirt' }
      ],
    },
    {
      name: 'ActiveStretch Lightweight Quick-Dry Track Pants with Zip Pockets',
      slug: 'activestretch-quickdry-track-pants',
      sku: 'FA-TRK-003',
      description: '4-way stretch polyester elastane blend with moisture-wicking technology, elasticated waistband with drawstring, and concealed zipper pockets.',
      price: 1199,
      discountPrice: 799,
      stockQuantity: 55,
      active: true,
      categoryId: 'cat_fashion_apparel',
      images: [
        { url: 'https://images.unsplash.com/photo-1552902865-b72c031ac5ea?w=800&auto=format&fit=crop&q=80', altText: 'Quick-Dry Track Pants' }
      ],
    },
    {
      name: 'Water-Resistant Everyday Laptop Backpack (25 Litres)',
      slug: 'water-resistant-everyday-laptop-backpack-25l',
      sku: 'FA-BAG-004',
      description: 'Multi-compartment commuter backpack with dedicated padded sleeve fitting up to 15.6-inch laptops. Breathable mesh back panel and sturdy water-repellent polyester fabric.',
      price: 1499,
      discountPrice: 999,
      stockQuantity: 45,
      active: true,
      categoryId: 'cat_fashion_apparel',
      images: [
        { url: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&auto=format&fit=crop&q=80', altText: 'Everyday Laptop Backpack' }
      ],
    },
    {
      name: 'Genuine Full-Grain Leather Bi-Fold Wallet (RFID Protected)',
      slug: 'genuine-leather-bifold-wallet-rfid',
      sku: 'FA-WLT-005',
      description: 'Crafted from authentic top-grain oiled leather with 8 card slots, 2 currency compartments, and integrated RFID blocking mesh to protect credit cards.',
      price: 899,
      discountPrice: 599,
      stockQuantity: 70,
      active: true,
      categoryId: 'cat_fashion_apparel',
      images: [
        { url: 'https://images.unsplash.com/photo-1627123424574-724758594e93?w=800&auto=format&fit=crop&q=80', altText: 'Genuine Leather Bi-Fold Wallet' }
      ],
    },

    // --- 4. Personal Care & Grooming ---
    {
      name: 'PrecisionGroom Cordless Beard Trimmer with Titanium Blades',
      slug: 'precisiongroom-cordless-beard-trimmer',
      sku: 'PC-TRM-001',
      description: 'Self-sharpening titanium-coated blades, 20 length settings (0.5mm - 10mm precision dial), 90 minutes runtime on a single USB charge.',
      price: 1599,
      discountPrice: 1099,
      stockQuantity: 48,
      active: true,
      categoryId: 'cat_personal_care',
      images: [
        { url: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=800&auto=format&fit=crop&q=80', altText: 'PrecisionGroom Cordless Beard Trimmer' }
      ],
    },
    {
      name: 'Ionic Hair Dryer 1400W with Cool Shot & Diffuser Nozzle',
      slug: 'ionic-hair-dryer-1400w-with-diffuser',
      sku: 'PC-DRY-002',
      description: 'Salon-grade 1400W motor with negative ionic technology to reduce frizz and heat damage. Includes concentrator nozzle and 2 speed/heat settings.',
      price: 1399,
      discountPrice: 949,
      stockQuantity: 40,
      active: true,
      categoryId: 'cat_personal_care',
      images: [
        { url: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800&auto=format&fit=crop&q=80', altText: 'Ionic Hair Dryer 1400W' }
      ],
    },
    {
      name: 'Ayurvedic Neem & Tea Tree Purifying Face Wash (150ml, Pack of 2)',
      slug: 'ayurvedic-neem-tea-tree-face-wash-pack-2',
      sku: 'PC-FWS-003',
      description: 'Gentle soap-free foaming gel with organic neem extracts, pure tea tree essential oil, and aloe vera. Clinically proven oil control for acne-prone skin.',
      price: 499,
      discountPrice: 349,
      stockQuantity: 85,
      active: true,
      categoryId: 'cat_personal_care',
      images: [
        { url: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=800&auto=format&fit=crop&q=80', altText: 'Neem & Tea Tree Face Wash' }
      ],
    },
    {
      name: 'SonicClean Rechargeable Electric Toothbrush with 3 Modes',
      slug: 'sonicclean-rechargeable-electric-toothbrush',
      sku: 'PC-TBR-004',
      description: '38,000 vibrations per minute sonic motor with smart 2-minute timer and 30-second quadrant pause. Includes 2 replacement DuPont brush heads.',
      price: 1299,
      discountPrice: 899,
      stockQuantity: 38,
      active: true,
      categoryId: 'cat_personal_care',
      images: [
        { url: 'https://images.unsplash.com/photo-1559591937-e162f4e3c5ec?w=800&auto=format&fit=crop&q=80', altText: 'SonicClean Electric Toothbrush' }
      ],
    },
    {
      name: 'Ultra-Soft Cotton Bath Towel Set (500 GSM, Pack of 2)',
      slug: 'ultra-soft-cotton-bath-towel-set-pack-2',
      sku: 'PC-TWL-005',
      description: 'Plush 100% combed cotton bath towels with high absorbency and quick-drying weave. Fade-resistant dyed yarn and skin-friendly texture.',
      price: 899,
      discountPrice: 649,
      stockQuantity: 50,
      active: true,
      categoryId: 'cat_personal_care',
      images: [
        { url: 'https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?w=800&auto=format&fit=crop&q=80', altText: 'Cotton Bath Towel Set' }
      ],
    },

    // --- 5. Grocery & Daily Needs ---
    {
      name: 'Single-Estate Darjeeling First Flush Whole Leaf Black Tea (250g Tin)',
      slug: 'darjeeling-first-flush-black-tea-250g',
      sku: 'GR-TEA-001',
      description: '100% pure orthodox whole leaf black tea harvested from high-elevation Himalayan estates. Delicate muscatel aroma and rich amber liquor.',
      price: 499,
      discountPrice: 399,
      stockQuantity: 65,
      active: true,
      categoryId: 'cat_grocery_daily_needs',
      images: [
        { url: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=800&auto=format&fit=crop&q=80', altText: 'Darjeeling Black Tea Tin' }
      ],
    },
    {
      name: 'Raw Organic Forest Honey with Natural Bee Pollen (500g Glass Jar)',
      slug: 'raw-organic-forest-honey-500g',
      sku: 'GR-HNY-002',
      description: 'Unprocessed, unpasteurized wild multi-flora honey sustainably sourced from tribal forest collectives. Rich in antioxidants and natural enzymes.',
      price: 450,
      discountPrice: 360,
      stockQuantity: 55,
      active: true,
      categoryId: 'cat_grocery_daily_needs',
      images: [
        { url: 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=800&auto=format&fit=crop&q=80', altText: 'Raw Organic Forest Honey' }
      ],
    },
    {
      name: 'Premium California Whole Almonds (500g Vacuum Pouch)',
      slug: 'premium-california-whole-almonds-500g',
      sku: 'GR-ALM-003',
      description: '100% crunchy, uniform grade almonds packaged in a nitrogen-flushed zipper pouch for maximum freshness and nutty flavor.',
      price: 599,
      discountPrice: 479,
      stockQuantity: 90,
      active: true,
      categoryId: 'cat_grocery_daily_needs',
      images: [
        { url: 'https://images.unsplash.com/photo-1508746829417-e6f548d8d6ed?w=800&auto=format&fit=crop&q=80', altText: 'California Whole Almonds' }
      ],
    },
    {
      name: 'Artisan Dark Roast South Indian Filter Coffee Blend (80:20, 500g)',
      slug: 'south-indian-filter-coffee-blend-500g',
      sku: 'GR-COF-004',
      description: 'Traditional blend of 80% Arabica & Robusta coffee beans with 20% high-grade roasted chicory. Rich crema, bold body, and lingering aroma.',
      price: 380,
      discountPrice: 299,
      stockQuantity: 70,
      active: true,
      categoryId: 'cat_grocery_daily_needs',
      images: [
        { url: 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=800&auto=format&fit=crop&q=80', altText: 'South Indian Filter Coffee' }
      ],
    },
    {
      name: 'Cold-Pressed Virgin Coconut Oil (500ml Glass Bottle)',
      slug: 'cold-pressed-virgin-coconut-oil-500ml',
      sku: 'GR-OIL-005',
      description: 'Extracted from fresh coconut milk using cold-press centrifugal method. Unrefined, unbleached, suitable for cooking, hair conditioning, and skincare.',
      price: 320,
      discountPrice: 249,
      stockQuantity: 60,
      active: true,
      categoryId: 'cat_grocery_daily_needs',
      images: [
        { url: 'https://images.unsplash.com/photo-1526947425960-945c6e72858f?w=800&auto=format&fit=crop&q=80', altText: 'Cold Pressed Virgin Coconut Oil' }
      ],
    },

    // --- 6. Stationery & Office ---
    {
      name: 'Hardbound Executive Ruled Notebook (A5, 200 Pages, 100 GSM)',
      slug: 'hardbound-executive-ruled-notebook-a5',
      sku: 'SO-NBK-001',
      description: 'Premium faux leather hardbound journal with acid-free, bleed-resistant 100 GSM cream pages. Includes elastic band closure, ribbon bookmark, and inner rear pocket.',
      price: 320,
      discountPrice: 249,
      stockQuantity: 120,
      active: true,
      categoryId: 'cat_stationery_office',
      images: [
        { url: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=800&auto=format&fit=crop&q=80', altText: 'Executive Ruled Notebook' }
      ],
    },
    {
      name: 'SmoothFlow 0.5mm Retractable Gel Ink Pen Set (Pack of 10, Blue & Black)',
      slug: 'smoothflow-retractable-gel-ink-pen-set-10pc',
      sku: 'SO-PEN-002',
      description: 'Japanese quick-drying waterproof pigment ink with precision tungsten carbide ball tip. Comfortable rubberized finger grip prevents writing fatigue.',
      price: 299,
      discountPrice: 199,
      stockQuantity: 150,
      active: true,
      categoryId: 'cat_stationery_office',
      images: [
        { url: 'https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?w=800&auto=format&fit=crop&q=80', altText: 'SmoothFlow Gel Pen Set' }
      ],
    },
    {
      name: 'Ergonomic Aluminium Laptop Stand with 6-Level Height Adjustment',
      slug: 'ergonomic-aluminium-folding-laptop-stand',
      sku: 'SO-LST-003',
      description: 'Aviation-grade aluminium alloy stand with non-slip silicone pads. Foldable, portable design promotes healthy posture and laptop heat dissipation.',
      price: 1199,
      discountPrice: 799,
      stockQuantity: 65,
      active: true,
      categoryId: 'cat_stationery_office',
      images: [
        { url: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=800&auto=format&fit=crop&q=80', altText: 'Ergonomic Laptop Stand' }
      ],
    },
    {
      name: 'Eye-Care LED Desk Lamp with 3 Color Modes & Touch Dimming',
      slug: 'eyecare-led-desk-lamp-touch-control',
      sku: 'SO-LMP-004',
      description: 'Flicker-free warm, cool, and natural light modes with stepless brightness control. Flexible 180-degree gooseneck and USB rechargeable lithium battery.',
      price: 1299,
      discountPrice: 849,
      stockQuantity: 42,
      active: true,
      categoryId: 'cat_stationery_office',
      images: [
        { url: 'https://images.unsplash.com/photo-1534972195531-a756b1126f24?w=800&auto=format&fit=crop&q=80', altText: 'Eye Care LED Desk Lamp' }
      ],
    },
    {
      name: 'Multi-Compartment Mesh Metal Desk Organizer Caddy',
      slug: 'multi-compartment-metal-desk-organizer-caddy',
      sku: 'SO-ORG-005',
      description: 'Durable rust-resistant powder-coated steel mesh with 6 compartments and slide-out drawer for pens, sticky notes, paperclips, and stationery.',
      price: 599,
      discountPrice: 399,
      stockQuantity: 75,
      active: true,
      categoryId: 'cat_stationery_office',
      images: [
        { url: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=800&auto=format&fit=crop&q=80', altText: 'Mesh Desk Organizer' }
      ],
    },

    // --- 7. Mobile Accessories ---
    {
      name: 'Magnetic 360-Degree Rotating Car Dashboard Phone Mount',
      slug: 'magnetic-360-car-dashboard-phone-mount',
      sku: 'MA-MNT-001',
      description: 'Equipped with 6 ultra-strong N52 neodymium magnets and high-strength 3M VHB base adhesive. Secure one-handed phone placement during bumpy drives.',
      price: 599,
      discountPrice: 349,
      stockQuantity: 95,
      active: true,
      categoryId: 'cat_mobile_accessories',
      images: [
        { url: 'https://images.unsplash.com/photo-1586953208448-b95a79798f07?w=800&auto=format&fit=crop&q=80', altText: 'Magnetic Car Phone Mount' }
      ],
    },
    {
      name: 'Super-Tough 9H Tempered Glass Screen Protector with Easy Align Frame',
      slug: '9h-tempered-glass-screen-protector-pack-2',
      sku: 'MA-GLS-002',
      description: 'Oleophobic anti-fingerprint coating with edge-to-edge 2.5D curved protection and 99.9% optical clarity. Includes precision auto-alignment installation frame.',
      price: 399,
      discountPrice: 249,
      stockQuantity: 140,
      active: true,
      categoryId: 'cat_mobile_accessories',
      images: [
        { url: 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=800&auto=format&fit=crop&q=80', altText: '9H Tempered Glass Screen Protector' }
      ],
    },
    {
      name: 'Shockproof Matte Finish Hybrid Phone Case with Ring Kickstand',
      slug: 'shockproof-matte-hybrid-phone-case',
      sku: 'MA-CSE-003',
      description: 'Dual-layer TPU bumper with translucent scratch-resistant PC back. Integrated 360-degree zinc alloy finger ring kickstand and raised camera lip.',
      price: 499,
      discountPrice: 299,
      stockQuantity: 110,
      active: true,
      categoryId: 'cat_mobile_accessories',
      images: [
        { url: 'https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?w=800&auto=format&fit=crop&q=80', altText: 'Shockproof Hybrid Phone Case' }
      ],
    },
    {
      name: 'Fast 15W Qi Wireless Charging Pad with LED Breathing Indicator',
      slug: '15w-qi-fast-wireless-charging-pad',
      sku: 'MA-WIR-004',
      description: 'Ultra-slim 6mm aluminium alloy charging pad with smart foreign object detection and temperature management. Charges through phone cases up to 5mm.',
      price: 1199,
      discountPrice: 799,
      stockQuantity: 50,
      active: true,
      categoryId: 'cat_mobile_accessories',
      images: [
        { url: 'https://images.unsplash.com/photo-1622445262464-84b1456045b6?w=800&auto=format&fit=crop&q=80', altText: '15W Fast Wireless Charging Pad' }
      ],
    },
    {
      name: 'Dual-Port 20W USB-C + USB-A Wall Charger (BIS Certified)',
      slug: 'dual-port-20w-fast-wall-charger',
      sku: 'MA-CHG-005',
      description: 'BIS-certified compact power adapter with Power Delivery 20W Type-C port and Quick Charge 18W Type-A port to charge two devices simultaneously safely.',
      price: 799,
      discountPrice: 499,
      stockQuantity: 90,
      active: true,
      categoryId: 'cat_mobile_accessories',
      images: [
        { url: 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=800&auto=format&fit=crop&q=80', altText: 'Dual-Port 20W Wall Charger' }
      ],
    },
    {
      name: 'Heavy-Duty Braided 100W Type-C to Type-C PD Cable (2 Metres)',
      slug: 'heavy-duty-100w-type-c-pd-cable-2m',
      sku: 'MA-CBL-006',
      description: 'E-Marker chip enabled 100W PD charging cable with thick zinc alloy connectors and double-braided ballistic nylon jacket. Supports 480Mbps data sync.',
      price: 499,
      discountPrice: 349,
      stockQuantity: 105,
      active: true,
      categoryId: 'cat_mobile_accessories',
      images: [
        { url: 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=800&auto=format&fit=crop&q=80', altText: 'Heavy-Duty 100W Type-C PD Cable' }
      ],
    },
  ];

  for (const p of productsData) {
    const { images, ...productFields } = p;
    await prisma.product.create({
      data: {
        ...productFields,
        images: {
          create: images.map((img, idx) => ({
            url: img.url,
            altText: img.altText,
            sortOrder: idx,
          })),
        },
      },
    });
  }

  console.log(`📦 Seeded ${productsData.length} realistic Indian market products across ${categoriesData.length} categories.`);

  // 6. Verify and output clean DB status
  const [totalUsers, totalCats, totalProds, totalOrders, totalPayments] = await Promise.all([
    prisma.user.count(),
    prisma.category.count(),
    prisma.product.count(),
    prisma.order.count(),
    prisma.payment.count(),
  ]);

  console.log('\n========================================');
  console.log('🎉 SEEDING COMPLETED SUCCESSFULLY!');
  console.log(`👥 Total Users:      ${totalUsers} (Admins only)`);
  console.log(`📂 Categories:       ${totalCats}`);
  console.log(`🛍️ Products:         ${totalProds}`);
  console.log(`📦 Customer Orders:  ${totalOrders} (Clean state)`);
  console.log(`💳 Payments:         ${totalPayments} (Clean state)`);
  console.log('========================================\n');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
