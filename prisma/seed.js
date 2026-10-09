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
  console.log('🧹 Purging previous catalog records...');
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

  // 4. Create 8 Realistic Categories for Indian Retail Market
  const categoriesData = [
    {
      id: 'cat_grocery_daily_needs',
      name: 'Grocery & Daily Needs',
      slug: 'grocery-daily-needs',
      description: 'Pantry staples, pulses, basmati rice, cold-pressed cooking oils, pure spices, breakfast cereals, beverages, and daily household cleaning essentials.',
      image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&auto=format&fit=crop&q=80',
      active: true,
    },
    {
      id: 'cat_home_kitchen',
      name: 'Home & Kitchen',
      slug: 'home-kitchen',
      description: 'Stainless steel thermal bottles, non-stick cookware, airtight storage containers, kitchen tools, and smart appliances.',
      image: 'https://images.unsplash.com/photo-1584992236310-6edddc08acff?w=800&auto=format&fit=crop&q=80',
      active: true,
    },
    {
      id: 'cat_electronics_accessories',
      name: 'Electronics & Audio',
      slug: 'electronics-accessories',
      description: 'Wireless earbuds, Bluetooth portable speakers, fast charging power banks, USB multiport hubs, and PC accessories.',
      image: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=800&auto=format&fit=crop&q=80',
      active: true,
    },
    {
      id: 'cat_fashion_apparel',
      name: 'Fashion & Apparel',
      slug: 'fashion-apparel',
      description: 'Comfortable 100% cotton basics, everyday polo tees, genuine leather accessories, commuter backpacks, and sunglasses.',
      image: 'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=800&auto=format&fit=crop&q=80',
      active: true,
    },
    {
      id: 'cat_personal_care',
      name: 'Personal Care & Grooming',
      slug: 'personal-care',
      description: 'Gentle skincare, grooming trimmers, hair dryers, broad-spectrum sunscreens, and daily wellness essentials.',
      image: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800&auto=format&fit=crop&q=80',
      active: true,
    },
    {
      id: 'cat_stationery_office',
      name: 'Stationery & Office',
      slug: 'stationery-office',
      description: 'Hardbound executive journals, Japanese gel pen sets, aluminium laptop stands, LED desk lamps, and desk organizers.',
      image: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=800&auto=format&fit=crop&q=80',
      active: true,
    },
    {
      id: 'cat_mobile_accessories',
      name: 'Mobile Accessories',
      slug: 'mobile-accessories',
      description: 'GaN fast wall chargers, durable braided Type-C cables, 9H tempered glass, phone cases, and magnetic car mounts.',
      image: 'https://images.unsplash.com/photo-1586953208448-b95a79798f07?w=800&auto=format&fit=crop&q=80',
      active: true,
    },
    {
      id: 'cat_travel_lifestyle',
      name: 'Travel & Lifestyle',
      slug: 'travel-lifestyle',
      description: 'Memory foam travel neck pillows, compression packing cubes, windproof umbrellas, TSA cable locks, and duffle bags.',
      image: 'https://images.unsplash.com/photo-1527631746610-bca00a040d60?w=800&auto=format&fit=crop&q=80',
      active: true,
    },
  ];

  for (const cat of categoriesData) {
    await prisma.category.create({ data: cat });
  }

  console.log(`📁 Created ${categoriesData.length} retail categories.`);

  // 5. Create 106 Realistic Products with Believable Indian Market Pricing
  const productsData = [
    // =========================================================================
    // 1. GROCERY & DAILY NEEDS (32 Products)
    // =========================================================================
    {
      name: 'India Gate Feast Rozzana Premium Basmati Rice (5 kg)',
      slug: 'india-gate-rozzana-basmati-rice-5kg',
      sku: 'GR-RIC-001',
      description: 'Aged long-grain basmati rice with sweet natural aroma and slender, non-sticky grains upon cooking. Ideal for daily pulao, biryani, and steamed rice.',
      price: 450,
      discountPrice: 389,
      stockQuantity: 85,
      active: true,
      categoryId: 'cat_grocery_daily_needs',
      images: [
        { url: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=800&auto=format&fit=crop&q=80', altText: "India Gate Feast Rozzana Premium Basmati Rice (5 kg)" },
        { url: 'https://images.unsplash.com/photo-1536304993881-ff6e9eefa2a6?w=800&auto=format&fit=crop&q=80', altText: "India Gate Feast Rozzana Premium Basmati Rice (5 kg)" }
      ],
    },
    {
      name: 'Tata Sampann Unpolished Toor Dal / Arhar Dal (1 kg)',
      slug: 'tata-sampann-unpolished-toor-dal-1kg',
      sku: 'GR-DAL-001',
      description: '100% unpolished yellow pigeon peas sourced from fertile Indian farmlands. Retains natural wholesome proteins, dietary fibre, and authentic taste without artificial polish.',
      price: 185,
      discountPrice: 159,
      stockQuantity: 120,
      active: true,
      categoryId: 'cat_grocery_daily_needs',
      images: [
        { url: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=800&auto=format&fit=crop&q=80', altText: "Tata Sampann Unpolished Toor Dal / Arhar Dal (1 kg)" }
      ],
    },
    {
      name: 'Aashirvaad Superior MP Sharbati Whole Wheat Atta (5 kg)',
      slug: 'aashirvaad-superior-mp-sharbati-atta-5kg',
      sku: 'GR-ATT-001',
      description: 'Ground from the golden grains of Madhya Pradesh with traditional chakki process. High water absorption gives ultra-soft rotis that stay fresh longer.',
      price: 295,
      discountPrice: 265,
      stockQuantity: 90,
      active: true,
      categoryId: 'cat_grocery_daily_needs',
      images: [
        { url: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=800&auto=format&fit=crop&q=80', altText: "Aashirvaad Superior MP Sharbati Whole Wheat Atta (5 kg)" }
      ],
    },
    {
      name: 'Fortune Sunlite Refined Sunflower Oil (1 Litre Pouch)',
      slug: 'fortune-sunlite-refined-sunflower-oil-1l',
      sku: 'GR-OIL-001',
      description: 'Light, clear, and fortified with Vitamin A and Vitamin D. High smoke point makes it suitable for deep frying, sautéing, and daily Indian cooking.',
      price: 165,
      discountPrice: 139,
      stockQuantity: 100,
      active: true,
      categoryId: 'cat_grocery_daily_needs',
      images: [
        { url: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=800&auto=format&fit=crop&q=80', altText: 'GR-OIL-001' }
      ],
    },
    {
      name: 'Amul Pure Cow Ghee (1 Litre Tin)',
      slug: 'amul-pure-cow-ghee-1l',
      sku: 'GR-GHE-001',
      description: 'Rich granular texture and traditional golden aroma made from fresh cow milk cream. Free from preservatives, ideal for tempering dals, rotis, and sweets.',
      price: 650,
      discountPrice: 599,
      stockQuantity: 60,
      active: true,
      categoryId: 'cat_grocery_daily_needs',
      images: [
        { url: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=800&auto=format&fit=crop&q=80', altText: "Amul Pure Cow Ghee (1 Litre Tin)" }
      ],
    },
    {
      name: 'Tata Salt Vacuum Evaporated Iodized Salt (1 kg)',
      slug: 'tata-salt-iodized-1kg',
      sku: 'GR-SLT-001',
      description: 'India’s trusted vacuum-evaporated table salt ensuring the right proportion of iodine for normal physical and mental growth. Free flowing and pure.',
      price: 28,
      discountPrice: 25,
      stockQuantity: 250,
      active: true,
      categoryId: 'cat_grocery_daily_needs',
      images: [
        { url: 'https://images.unsplash.com/photo-1518110925495-5fe2fda0442c?w=800&auto=format&fit=crop&q=80', altText: "Tata Salt Vacuum Evaporated Iodized Salt (1 kg)" }
      ],
    },
    {
      name: 'Madhur Pure & Hygienic Refined Sugar (1 kg Pack)',
      slug: 'madhur-pure-refined-sugar-1kg',
      sku: 'GR-SGR-001',
      description: 'Sulphur-free, untouched by hands refined sparkling white crystal sugar. Dissolves quickly and evenly in beverages, tea, and homemade desserts.',
      price: 58,
      discountPrice: 49,
      stockQuantity: 140,
      active: true,
      categoryId: 'cat_grocery_daily_needs',
      images: [
        { url: 'https://images.unsplash.com/photo-1581441363689-1f3c3c414635?w=800&auto=format&fit=crop&q=80', altText: "Madhur Pure & Hygienic Refined Sugar (1 kg Pack)" }
      ],
    },
    {
      name: 'Tata Sampann Moong Dal Split (1 kg)',
      slug: 'tata-sampann-moong-dal-split-1kg',
      sku: 'GR-DAL-002',
      description: 'High-protein split yellow moong lentils with zero polish. Easy to digest, quick cooking, and rich in natural dietary fibre and essential minerals.',
      price: 160,
      discountPrice: 138,
      stockQuantity: 110,
      active: true,
      categoryId: 'cat_grocery_daily_needs',
      images: [
        { url: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&auto=format&fit=crop&q=80', altText: "Tata Sampann Moong Dal Split (1 kg)" }
      ],
    },
    {
      name: 'Tata Sampann Unpolished Chana Dal (1 kg)',
      slug: 'tata-sampann-unpolished-chana-dal-1kg',
      sku: 'GR-DAL-003',
      description: 'Naturally unpolished split Bengal gram packed with wholesome plant protein. Ideal for tadka dals, dry curries, and savoury homemade snacks.',
      price: 120,
      discountPrice: 102,
      stockQuantity: 115,
      active: true,
      categoryId: 'cat_grocery_daily_needs',
      images: [
        { url: 'https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?w=800&auto=format&fit=crop&q=80', altText: "Tata Sampann Unpolished Chana Dal (1 kg)" }
      ],
    },
    {
      name: 'Tata Sampann High Curcumin Pure Turmeric Powder (500 g)',
      slug: 'tata-sampann-pure-turmeric-powder-500g',
      sku: 'GR-SPC-001',
      description: 'Contains at least 3% natural curcumin guaranteed. Sourced from Salem farmlands, ground hygienically to give deep golden color and healing aroma.',
      price: 145,
      discountPrice: 125,
      stockQuantity: 95,
      active: true,
      categoryId: 'cat_grocery_daily_needs',
      images: [
        { url: 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=800&auto=format&fit=crop&q=80', altText: "Tata Sampann High Curcumin Pure Turmeric Powder (500 g)" }
      ],
    },
    {
      name: 'Catch Kashmiri Mirch Red Chilli Powder (500 g)',
      slug: 'catch-kashmiri-mirch-powder-500g',
      sku: 'GR-SPC-002',
      description: 'Premium mild-spicy red chilli powder known for its appetizing vibrant natural red color and subtle smoky flavor. No artificial colors added.',
      price: 210,
      discountPrice: 179,
      stockQuantity: 85,
      active: true,
      categoryId: 'cat_grocery_daily_needs',
      images: [
        { url: 'https://images.unsplash.com/photo-1509358271058-acd22cc93898?w=800&auto=format&fit=crop&q=80', altText: 'GR-SPC-002' }
      ],
    },
    {
      name: 'Everest Royal Garam Masala (100 g Box)',
      slug: 'everest-royal-garam-masala-100g',
      sku: 'GR-SPC-003',
      description: 'A traditional blend of 13 roasted aromatic spices including black cardamom, cinnamon, mace, and cloves for rich North and South Indian gravies.',
      price: 92,
      discountPrice: 82,
      stockQuantity: 130,
      active: true,
      categoryId: 'cat_grocery_daily_needs',
      images: [
        { url: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=800&auto=format&fit=crop&q=80', altText: 'GR-SPC-003' }
      ],
    },
    {
      name: 'Catch Whole Cumin Seeds / Jeera (200 g)',
      slug: 'catch-whole-cumin-seeds-jeera-200g',
      sku: 'GR-SPC-004',
      description: 'Cleaned, bold aromatic cumin seeds with high essential oil content. Delivers rich earthy fragrance to everyday tadkas, dal fry, and jeera rice.',
      price: 140,
      discountPrice: 119,
      stockQuantity: 100,
      active: true,
      categoryId: 'cat_grocery_daily_needs',
      images: [
        { url: 'https://images.unsplash.com/photo-1599940824399-b87987ceb72a?w=800&auto=format&fit=crop&q=80', altText: 'GR-SPC-004' }
      ],
    },
    {
      name: 'Catch Coriander / Dhaniya Powder (500 g)',
      slug: 'catch-coriander-dhaniya-powder-500g',
      sku: 'GR-SPC-005',
      description: 'Cold-ground whole coriander seeds retaining maximum natural volatile oils for a fresh, citrusy aroma and smooth gravy texture.',
      price: 135,
      discountPrice: 115,
      stockQuantity: 90,
      active: true,
      categoryId: 'cat_grocery_daily_needs',
      images: [
        { url: 'https://images.unsplash.com/photo-1532336414038-cf19250c5757?w=800&auto=format&fit=crop&q=80', altText: 'GR-SPC-005' }
      ],
    },
    {
      name: 'Tata Tea Gold Pure CTC & Long Leaf Tea (500 g)',
      slug: 'tata-tea-gold-leaf-500g',
      sku: 'GR-BEV-001',
      description: 'Exquisite blend of strong Assam CTC tea with 15% gently rolled long tea leaves for rich taste and irresistible aroma in every cup of chai.',
      price: 340,
      discountPrice: 295,
      stockQuantity: 110,
      active: true,
      categoryId: 'cat_grocery_daily_needs',
      images: [
        { url: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=800&auto=format&fit=crop&q=80', altText: "Tata Tea Gold Pure CTC & Long Leaf Tea (500 g)" }
      ],
    },
    {
      name: 'Nescafe Classic 100% Pure Instant Coffee (100 g Glass Jar)',
      slug: 'nescafe-classic-instant-coffee-100g',
      sku: 'GR-BEV-002',
      description: 'Crafted with premium selected Robusta coffee beans slow-roasted to perfection. Delivers bold aroma and signature refreshing taste.',
      price: 360,
      discountPrice: 315,
      stockQuantity: 75,
      active: true,
      categoryId: 'cat_grocery_daily_needs',
      images: [
        { url: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=800&auto=format&fit=crop&q=80', altText: "Nescafe Classic 100% Pure Instant Coffee (100 g Glass Jar)" }
      ],
    },
    {
      name: 'Quaker Rolled Oats with Beta Glucan Fibre (1 kg Pouch)',
      slug: 'quaker-rolled-oats-1kg',
      sku: 'GR-BRK-001',
      description: '100% whole grain oats rich in soluble beta-glucan fibre that helps maintain healthy cholesterol and provides long-lasting energy for active mornings.',
      price: 199,
      discountPrice: 169,
      stockQuantity: 80,
      active: true,
      categoryId: 'cat_grocery_daily_needs',
      images: [
        { url: 'https://images.unsplash.com/photo-1521483451569-e33803c0330c?w=800&auto=format&fit=crop&q=80', altText: "Quaker Rolled Oats with Beta Glucan Fibre (1 kg Pouch)" }
      ],
    },
    {
      name: "Kellogg's Real Almond & Honey Crunchy Corn Flakes (750 g)",
      slug: 'kelloggs-almond-honey-corn-flakes-750g',
      sku: 'GR-BRK-002',
      description: 'Crispy sun-ripened corn flakes loaded with real sliced Californian almonds and natural bee honey. Packed with iron and essential B-complex vitamins.',
      price: 390,
      discountPrice: 329,
      stockQuantity: 65,
      active: true,
      categoryId: 'cat_grocery_daily_needs',
      images: [
        { url: 'https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=800&auto=format&fit=crop&q=80', altText: "Kellogg's Real Almond & Honey Crunchy Corn Flakes (750 g)" }
      ],
    },
    {
      name: 'Tata Sampann Organic Thick Poha / Flattened Rice (500 g)',
      slug: 'tata-sampann-thick-poha-500g',
      sku: 'GR-BRK-003',
      description: 'Hygienically cleaned and processed thick rice flakes that retain moisture and stay fluffy without turning soggy. Natural source of iron and dietary fibre.',
      price: 55,
      discountPrice: 46,
      stockQuantity: 130,
      active: true,
      categoryId: 'cat_grocery_daily_needs',
      images: [
        { url: 'https://images.unsplash.com/photo-1515543237350-b3eea1ec8082?w=800&auto=format&fit=crop&q=80', altText: "Tata Sampann Organic Thick Poha / Flattened Rice (500 g)" }
      ],
    },
    {
      name: 'Tata Sampann Roasted Sooji / Rava (500 g)',
      slug: 'tata-sampann-roasted-sooji-500g',
      sku: 'GR-BRK-004',
      description: 'Pre-roasted durum wheat semolina made with strict quality checks. Ready for instant preparation of non-sticky upma, sheera, halwa, and crispy rava dosas.',
      price: 48,
      discountPrice: 40,
      stockQuantity: 120,
      active: true,
      categoryId: 'cat_grocery_daily_needs',
      images: [
        { url: 'https://images.unsplash.com/photo-1589367920969-ab8e050bbb04?w=800&auto=format&fit=crop&q=80', altText: "Tata Sampann Roasted Sooji / Rava (500 g)" }
      ],
    },
    {
      name: 'Surf Excel Matic Front & Top Load Liquid Detergent (2 Litre)',
      slug: 'surf-excel-matic-liquid-detergent-2l',
      sku: 'GR-HSD-001',
      description: 'Advanced stain-lifting formula dissolves instantly in washing machines to remove tough grease, tea, and food stains without leaving white powder residue.',
      price: 480,
      discountPrice: 399,
      stockQuantity: 70,
      active: true,
      categoryId: 'cat_grocery_daily_needs',
      images: [
        { url: 'https://images.unsplash.com/photo-1585421514738-01798e348b17?w=800&auto=format&fit=crop&q=80', altText: 'GR-HSD-001' }
      ],
    },
    {
      name: 'Vim Lemon Power Dishwash Liquid Gel (750 ml Bottle)',
      slug: 'vim-lemon-dishwash-gel-750ml',
      sku: 'GR-HSD-002',
      description: 'Concentrated lemon degreaser formula cleans 1 sink-full of oily utensils with just 1 spoon of gel. Leaves stainless steel and glass sparkling clean.',
      price: 170,
      discountPrice: 142,
      stockQuantity: 140,
      active: true,
      categoryId: 'cat_grocery_daily_needs',
      images: [
        { url: 'https://images.unsplash.com/photo-1585421514284-efb74c2b69ba?w=800&auto=format&fit=crop&q=80', altText: "Vim Lemon Power Dishwash Liquid Gel (750 ml Bottle)" }
      ],
    },
    {
      name: 'Lizol Disinfectant Citrus Surface Floor Cleaner (1 Litre)',
      slug: 'lizol-disinfectant-floor-cleaner-citrus-1l',
      sku: 'GR-HSD-003',
      description: 'Kills 99.9% of germs and virus strains while cutting through kitchen grease and floor grime. Leaves a long-lasting fresh citrus scent across tile and marble.',
      price: 225,
      discountPrice: 189,
      stockQuantity: 90,
      active: true,
      categoryId: 'cat_grocery_daily_needs',
      images: [
        { url: 'https://images.unsplash.com/photo-1563453392212-326f5e854473?w=800&auto=format&fit=crop&q=80', altText: 'GR-HSD-003' }
      ],
    },
    {
      name: 'Harpic Power Plus 10X Max Toilet Cleaner (1 Litre)',
      slug: 'harpic-power-plus-toilet-cleaner-1l',
      sku: 'GR-HSD-004',
      description: 'Thick liquid formula clings to toilet bowl surfaces to eliminate 99.9% germs, remove yellow limescale, and eliminate stubborn stains effortlessly.',
      price: 215,
      discountPrice: 178,
      stockQuantity: 95,
      active: true,
      categoryId: 'cat_grocery_daily_needs',
      images: [
        { url: 'https://images.unsplash.com/photo-1584820927498-cfe5211fd8bf?w=800&auto=format&fit=crop&q=80', altText: "Harpic Power Plus 10X Max Toilet Cleaner (1 Litre)" }
      ],
    },
    {
      name: 'Origami 3-Ply Virgin Pulp Kitchen Towel Tissues (Pack of 4 Rolls)',
      slug: 'origami-3ply-kitchen-towel-pack-4',
      sku: 'GR-HSD-005',
      description: 'Highly absorbent food-contact safe paper towels. Ideal for absorbing excess oil from fried snacks, wiping kitchen counters, and cleaning microwave spills.',
      price: 260,
      discountPrice: 219,
      stockQuantity: 80,
      active: true,
      categoryId: 'cat_grocery_daily_needs',
      images: [
        { url: 'https://images.unsplash.com/photo-1583947215259-38e31be8751f?w=800&auto=format&fit=crop&q=80', altText: "Origami 3-Ply Virgin Pulp Kitchen Towel Tissues (Pack of 4 Rolls)" }
      ],
    },
    {
      name: 'Freshwrap Heavy Duty Aluminium Food Foil (18 Metres)',
      slug: 'freshwrap-aluminium-food-foil-18m',
      sku: 'GR-HSD-006',
      description: '11-micron thick food grade hygienic aluminium wrap. Keeps rotis, parathas, and sandwiches warm and moisture-fresh for school and office tiffins.',
      price: 180,
      discountPrice: 149,
      stockQuantity: 110,
      active: true,
      categoryId: 'cat_grocery_daily_needs',
      images: [
        { url: 'https://images.unsplash.com/photo-1584992236310-6edddc08acff?w=800&auto=format&fit=crop&q=80', altText: 'GR-HSD-006' }
      ],
    },
    {
      name: 'Shalimar Oxo-Biodegradable Heavy Duty Garbage Bags (Medium 30 Bags x 2 Rolls)',
      slug: 'shalimar-garbage-bags-medium-60-pack',
      sku: 'GR-HSD-007',
      description: '19 x 21 inch tear-resistant bags with convenient tie-string closure. Eco-conscious oxo-biodegradable formulation prevents leakage and foul odors.',
      price: 199,
      discountPrice: 159,
      stockQuantity: 130,
      active: true,
      categoryId: 'cat_grocery_daily_needs',
      images: [
        { url: 'https://images.unsplash.com/photo-1530587191325-3db32d826c18?w=800&auto=format&fit=crop&q=80', altText: 'GR-HSD-007' }
      ],
    },
    {
      name: 'Dettol Skincare Moisturizing Bathing Soap Bar (125 g x Pack of 4)',
      slug: 'dettol-skincare-soap-pack-4',
      sku: 'GR-PC-001',
      description: 'Trusted 99.9% germ protection enriched with added moisturizers and nourishing argan oil to prevent skin dryness. Dermatologically tested for entire family.',
      price: 260,
      discountPrice: 225,
      stockQuantity: 100,
      active: true,
      categoryId: 'cat_grocery_daily_needs',
      images: [
        { url: 'https://images.unsplash.com/photo-1600857544200-b2f666a9a2ec?w=800&auto=format&fit=crop&q=80', altText: 'GR-PC-001' }
      ],
    },
    {
      name: 'Colgate Total 12-Hour Antibacterial Toothpaste (150 g x Pack of 2)',
      slug: 'colgate-total-toothpaste-pack-2',
      sku: 'GR-PC-002',
      description: 'Dual-zinc and arginine formula actively fights plaque, cavities, tartar, and bad breath across teeth, tongue, cheeks, and gums for 12 hours.',
      price: 280,
      discountPrice: 239,
      stockQuantity: 115,
      active: true,
      categoryId: 'cat_grocery_daily_needs',
      images: [
        { url: 'https://images.unsplash.com/photo-1559599101-f09722fb4948?w=800&auto=format&fit=crop&q=80', altText: 'GR-PC-002' }
      ],
    },
    {
      name: 'Oral-B CrossAction Pro-Health Soft Toothbrush (Pack of 4)',
      slug: 'oral-b-crossaction-soft-toothbrush-pack-4',
      sku: 'GR-PC-003',
      description: 'CrissCross bristles angled at 16 degrees reach deep between teeth to remove up to 99% of hard-to-reach plaque while being gentle on sensitive gums.',
      price: 199,
      discountPrice: 165,
      stockQuantity: 130,
      active: true,
      categoryId: 'cat_grocery_daily_needs',
      images: [
        { url: 'https://images.unsplash.com/photo-1607613009820-a29f7bb81c04?w=800&auto=format&fit=crop&q=80', altText: 'GR-PC-003' }
      ],
    },
    {
      name: 'Lifebuoy Total Germ Protection Liquid Handwash Refill Pouch (750 ml)',
      slug: 'lifebuoy-liquid-handwash-refill-750ml',
      sku: 'GR-PC-004',
      description: 'Powered by Activ Silver formula for 10-second fast germ fighting. Gentle foaming handwash that leaves hands clean and refreshed after meals.',
      price: 145,
      discountPrice: 119,
      stockQuantity: 125,
      active: true,
      categoryId: 'cat_grocery_daily_needs',
      images: [
        { url: 'https://images.unsplash.com/photo-1584744982491-665216d95f8b?w=800&auto=format&fit=crop&q=80', altText: 'GR-PC-004' }
      ],
    },
    {
      name: 'Parachute 100% Pure Unrefined Coconut Oil (500 ml Bottle)',
      slug: 'parachute-pure-coconut-oil-500ml',
      sku: 'GR-PC-005',
      description: 'Made from sun-dried superior copras through a multi-stage filtration process without chemicals. Multipurpose oil for deep hair nourishment and skin hydration.',
      price: 215,
      discountPrice: 185,
      stockQuantity: 105,
      active: true,
      categoryId: 'cat_grocery_daily_needs',
      images: [
        { url: 'https://images.unsplash.com/photo-1615397349754-cfa2066a298e?w=800&auto=format&fit=crop&q=80', altText: 'GR-PC-005' }
      ],
    },

    // =========================================================================
    // 2. HOME & KITCHEN (13 Products)
    // =========================================================================
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
        { url: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=800&auto=format&fit=crop&q=80', altText: "Thermosteel 1000ml Vacuum Insulated Stainless Steel Bottle" }
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
        { url: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&auto=format&fit=crop&q=80', altText: 'HK-PAN-002' }
      ],
    },
    {
      name: 'Modular Stackable Airtight Food Storage Containers (Set of 6, 1200ml)',
      slug: 'modular-airtight-food-storage-containers-set-6',
      sku: 'HK-CNT-003',
      description: 'BPA-free crystal clear containers with silicone sealed locking lids. Stackable space-saving design keeps pulses, snacks, and grains dry and bug-free.',
      price: 799,
      discountPrice: 549,
      stockQuantity: 58,
      active: true,
      categoryId: 'cat_home_kitchen',
      images: [
        { url: 'https://images.unsplash.com/photo-1590736969955-71cc94801759?w=800&auto=format&fit=crop&q=80', altText: 'HK-CNT-003' }
      ],
    },
    {
      name: 'Heavy-Gauge Die-Cast Aluminium Non-Stick Dosa Tawa (28cm)',
      slug: 'die-cast-non-stick-dosa-tawa-28cm',
      sku: 'HK-TWA-004',
      description: '5-layer scratch-resistant granite non-stick coating requires minimum cooking oil for crisp paper dosas, rotis, and parathas without sticking.',
      price: 1299,
      discountPrice: 899,
      stockQuantity: 44,
      active: true,
      categoryId: 'cat_home_kitchen',
      images: [
        { url: 'https://images.unsplash.com/photo-1590794056226-79ef3a8147e1?w=800&auto=format&fit=crop&q=80', altText: 'HK-TWA-004' }
      ],
    },
    {
      name: 'High-Carbon German Stainless Steel Kitchen Knife Set with Wooden Block (6 Pcs)',
      slug: 'german-stainless-steel-kitchen-knife-set-6pcs',
      sku: 'HK-KNF-005',
      description: 'Precision-tapered ground blades for effortless vegetable and meat slicing. Includes Chef knife, Santoku knife, utility knife, paring knife, kitchen shears, and pine wooden block.',
      price: 1499,
      discountPrice: 1099,
      stockQuantity: 38,
      active: true,
      categoryId: 'cat_home_kitchen',
      images: [
        { url: 'https://images.unsplash.com/photo-1593618998160-e34014e67546?w=800&auto=format&fit=crop&q=80', altText: "High-Carbon German Stainless Steel Kitchen Knife Set with Wooden Block (6 Pcs)" }
      ],
    },
    {
      name: 'Organic Bamboo Wood Cutting Chopping Board with Juice Groove',
      slug: 'organic-bamboo-cutting-chopping-board',
      sku: 'HK-BRD-006',
      description: 'Extra thick knife-friendly organic bamboo board with perimeter juice groove to prevent countertop spills. Naturally antimicrobial and easy to wash.',
      price: 699,
      discountPrice: 479,
      stockQuantity: 65,
      active: true,
      categoryId: 'cat_home_kitchen',
      images: [
        { url: 'https://images.unsplash.com/photo-1546554137-f86b9593a222?w=800&auto=format&fit=crop&q=80', altText: 'HK-BRD-006' }
      ],
    },
    {
      name: 'Borosilicate Heat-Resistant Glass Food Storage Bowls with Clip Lids (Set of 3)',
      slug: 'borosilicate-glass-bowls-set-3',
      sku: 'HK-BOWL-007',
      description: 'Microwave, oven, freezer, and dishwasher safe bowls (400ml, 650ml, 950ml). Non-porous glass does not absorb food stains or odors.',
      price: 999,
      discountPrice: 749,
      stockQuantity: 50,
      active: true,
      categoryId: 'cat_home_kitchen',
      images: [
        { url: 'https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?w=800&auto=format&fit=crop&q=80', altText: 'HK-BOWL-007' }
      ],
    },
    {
      name: 'Ergonomic Stainless Steel Whisk & Silicone Spatula Combo (Pack of 3)',
      slug: 'stainless-whisk-silicone-spatula-combo-3pc',
      sku: 'HK-UTL-008',
      description: 'Heat resistant up to 230°C food grade silicone spatulas and sturdy balloon wire whisk. Safe for all non-stick cookware surfaces.',
      price: 449,
      discountPrice: 329,
      stockQuantity: 90,
      active: true,
      categoryId: 'cat_home_kitchen',
      images: [
        { url: 'https://images.unsplash.com/photo-1589182373726-e4f658ab50f0?w=800&auto=format&fit=crop&q=80', altText: "Ergonomic Stainless Steel Whisk & Silicone Spatula Combo (Pack of 3)" }
      ],
    },
    {
      name: 'Automatic Rapid Stainless Steel Electric Egg Boiler (7 Eggs Capacity)',
      slug: 'automatic-electric-egg-boiler-7eggs',
      sku: 'HK-EGG-009',
      description: 'Boils up to 7 eggs in soft, medium, or hard consistency with one-touch operation and automatic dry-boil safety shutoff.',
      price: 899,
      discountPrice: 649,
      stockQuantity: 45,
      active: true,
      categoryId: 'cat_home_kitchen',
      images: [
        { url: 'https://images.unsplash.com/photo-1587486913049-53fc88980cfc?w=800&auto=format&fit=crop&q=80', altText: "Automatic Rapid Stainless Steel Electric Egg Boiler (7 Eggs Capacity)" }
      ],
    },
    {
      name: 'Cordless Fast-Boil Stainless Steel Electric Kettle (1.5 Litre, 1500W)',
      slug: 'cordless-fast-boil-electric-kettle-1-5l',
      sku: 'HK-KTL-010',
      description: '304 food-grade stainless steel interior with concealed heating element. Boils water in under 4 minutes with auto shut-off and boil-dry protection.',
      price: 1199,
      discountPrice: 849,
      stockQuantity: 55,
      active: true,
      categoryId: 'cat_home_kitchen',
      images: [
        { url: 'https://images.unsplash.com/photo-1570222094114-d054a817e56b?w=800&auto=format&fit=crop&q=80', altText: "Cordless Fast-Boil Stainless Steel Electric Kettle (1.5 Litre, 1500W)" }
      ],
    },
    {
      name: '360-Degree Rotating 12-Jar Spice Carousel Rack Organiser',
      slug: 'rotating-12jar-spice-carousel-rack',
      sku: 'HK-SPCR-011',
      description: 'Compact revolving spice stand made from durable ABS with 12 refillable glass spice containers with dual sift-and-pour shaker lids.',
      price: 899,
      discountPrice: 649,
      stockQuantity: 40,
      active: true,
      categoryId: 'cat_home_kitchen',
      images: [
        { url: 'https://images.unsplash.com/photo-1588854337236-6889d631faa8?w=800&auto=format&fit=crop&q=80', altText: 'HK-SPCR-011' }
      ],
    },
    {
      name: 'Pure Cotton Waffle Weave Kitchen Cleaning Towels (Pack of 6)',
      slug: 'pure-cotton-waffle-weave-kitchen-towels-6pack',
      sku: 'HK-TWL-012',
      description: 'Super absorbent, lint-free honeycomb weave towels (40x60cm). Fast-drying fabric ideal for dish drying, wiping countertops, and dining tables.',
      price: 499,
      discountPrice: 349,
      stockQuantity: 80,
      active: true,
      categoryId: 'cat_home_kitchen',
      images: [
        { url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&auto=format&fit=crop&q=80', altText: 'HK-TWL-012' }
      ],
    },
    {
      name: 'Multi-Purpose Stainless Steel Over-the-Sink Dish Drying Rack',
      slug: 'stainless-over-sink-dish-drying-rack',
      sku: 'HK-DRK-013',
      description: 'Roll-up silicone rimmed heat-resistant stainless steel drying trivet. Drains water directly into the sink, saving precious kitchen counter space.',
      price: 1599,
      discountPrice: 1199,
      stockQuantity: 35,
      active: true,
      categoryId: 'cat_home_kitchen',
      images: [
        { url: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=800&auto=format&fit=crop&q=80', altText: 'HK-DRK-013' }
      ],
    },

    // =========================================================================
    // 3. ELECTRONICS & AUDIO (11 Products)
    // =========================================================================
    {
      name: 'BassPro ANC True Wireless Bluetooth Earbuds with 40-Hour Battery',
      slug: 'basspro-anc-true-wireless-earbuds',
      sku: 'EA-TWS-001',
      description: 'Active Noise Cancellation up to 30dB with Quad-mic ENC for crystal-clear calls. 10mm dynamic bass drivers, IPX5 sweat resistance, and fast Type-C charging.',
      price: 2499,
      discountPrice: 1799,
      stockQuantity: 60,
      active: true,
      categoryId: 'cat_electronics_accessories',
      images: [
        { url: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=800&auto=format&fit=crop&q=80', altText: "BassPro ANC True Wireless Bluetooth Earbuds with 40-Hour Battery" }
      ],
    },
    {
      name: 'SoundPulse 16W Waterproof IPX7 Portable Bluetooth Speaker',
      slug: 'soundpulse-16w-waterproof-bluetooth-speaker',
      sku: 'EA-SPK-002',
      description: 'Dual 8W acoustic drivers with passive bass radiator. Rugged shockproof fabric housing delivers 14 hours of continuous music on a single charge.',
      price: 1999,
      discountPrice: 1499,
      stockQuantity: 42,
      active: true,
      categoryId: 'cat_electronics_accessories',
      images: [
        { url: 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=800&auto=format&fit=crop&q=80', altText: "SoundPulse 16W Waterproof IPX7 Portable Bluetooth Speaker" }
      ],
    },
    {
      name: 'Ultra-Slim 10,000mAh 22.5W Fast Charging Power Bank with Dual Output',
      slug: 'ultraslim-10000mah-fast-charging-power-bank',
      sku: 'EA-PWR-003',
      description: 'Aviation-grade aluminium alloy enclosure with Type-C Power Delivery and USB-A Quick Charge 3.0. Charges smartphones 0 to 60% in just 30 minutes.',
      price: 1499,
      discountPrice: 1099,
      stockQuantity: 55,
      active: true,
      categoryId: 'cat_electronics_accessories',
      images: [
        { url: 'https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?w=800&auto=format&fit=crop&q=80', altText: "Ultra-Slim 10,000mAh 22.5W Fast Charging Power Bank with Dual Output" }
      ],
    },
    {
      name: '7-in-1 Aluminium USB-C Multiport Hub Adapter (4K HDMI, 100W PD, SD Card)',
      slug: '7-in-1-aluminium-usb-c-hub-adapter',
      sku: 'EA-HUB-004',
      description: 'Expands a single USB-C port into 4K@30Hz HDMI, 100W Power Delivery charging, 3 x USB 3.0 5Gbps ports, and SD/TF micro card reader slots.',
      price: 1899,
      discountPrice: 1399,
      stockQuantity: 30,
      active: true,
      categoryId: 'cat_electronics_accessories',
      images: [
        { url: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=800&auto=format&fit=crop&q=80', altText: 'EA-HUB-004' }
      ],
    },
    {
      name: 'RGB Mechanical Gaming Keyboard with Hot-Swappable Red Switches',
      slug: 'rgb-mechanical-gaming-keyboard-red-switches',
      sku: 'EA-KBD-005',
      description: 'Tenkeyless 87-key compact mechanical keyboard with smooth linear red switches, detachable Type-C braided cable, and 18 customizable RGB backlighting modes.',
      price: 2699,
      discountPrice: 1999,
      stockQuantity: 28,
      active: true,
      categoryId: 'cat_electronics_accessories',
      images: [
        { url: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=800&auto=format&fit=crop&q=80', altText: "RGB Mechanical Gaming Keyboard with Hot-Swappable Red Switches" }
      ],
    },
    {
      name: 'Silent Click Ergonomic 2.4GHz Wireless Optical Mouse with DPI Switch',
      slug: 'silent-click-ergonomic-wireless-mouse',
      sku: 'EA-MOU-006',
      description: 'Contoured hand-fit design with 90% silent click buttons, 3-level adjustable DPI (800/1200/1600), nano USB receiver, and 18-month battery longevity.',
      price: 699,
      discountPrice: 499,
      stockQuantity: 70,
      active: true,
      categoryId: 'cat_electronics_accessories',
      images: [
        { url: 'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=800&auto=format&fit=crop&q=80', altText: "Silent Click Ergonomic 2.4GHz Wireless Optical Mouse with DPI Switch" }
      ],
    },
    {
      name: '1080p Full HD Webcam with Stereo Microphone & Privacy Shutter',
      slug: '1080p-full-hd-webcam-privacy-shutter',
      sku: 'EA-CAM-007',
      description: 'Plug-and-play USB webcam with auto light correction and noise-cancelling dual mics. Perfect for Zoom meetings, online college classes, and video calls.',
      price: 1599,
      discountPrice: 1199,
      stockQuantity: 36,
      active: true,
      categoryId: 'cat_electronics_accessories',
      images: [
        { url: 'https://images.unsplash.com/photo-1587826080692-f439cd0b70da?w=800&auto=format&fit=crop&q=80', altText: "1080p Full HD Webcam with Stereo Microphone & Privacy Shutter" }
      ],
    },
    {
      name: 'Smart Wi-Fi Plug with Energy Monitoring (16A for Heavy Appliances)',
      slug: 'smart-wifi-plug-16a-energy-monitor',
      sku: 'EA-PLG-008',
      description: 'Control geysers, ACs, and water pumps from anywhere via smartphone app. Compatible with Alexa and Google Assistant for hands-free voice control.',
      price: 999,
      discountPrice: 749,
      stockQuantity: 48,
      active: true,
      categoryId: 'cat_electronics_accessories',
      images: [
        { url: 'https://images.unsplash.com/photo-1558002038-1055907df827?w=800&auto=format&fit=crop&q=80', altText: "Smart Wi-Fi Plug with Energy Monitoring (16A for Heavy Appliances)" }
      ],
    },
    {
      name: 'Over-Ear Studio Monitor Headphones with 50mm Neodymium Drivers',
      slug: 'over-ear-studio-monitor-headphones-50mm',
      sku: 'EA-HDP-009',
      description: 'Precision acoustic tuning with memory foam protein leather earcups. Delivers deep punchy bass, clear vocal mids, and passive noise isolation.',
      price: 2199,
      discountPrice: 1649,
      stockQuantity: 25,
      active: true,
      categoryId: 'cat_electronics_accessories',
      images: [
        { url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=80', altText: "Over-Ear Studio Monitor Headphones with 50mm Neodymium Drivers" }
      ],
    },
    {
      name: 'Digital Alarm Clock with Wireless Phone Charging Station & Night Light',
      slug: 'digital-alarm-clock-wireless-charging-station',
      sku: 'EA-CLK-010',
      description: 'Modern minimalist bedside clock with 10W fast wireless charging pad, dimmable LED time display, dual alarms, and warm ambient night light.',
      price: 1399,
      discountPrice: 999,
      stockQuantity: 34,
      active: true,
      categoryId: 'cat_electronics_accessories',
      images: [
        { url: 'https://images.unsplash.com/photo-1563861826100-9cb868fdbe1c?w=800&auto=format&fit=crop&q=80', altText: "Digital Alarm Clock with Wireless Phone Charging Station & Night Light" }
      ],
    },
    {
      name: 'Braided High-Speed 4K 60Hz HDMI 2.0 Cable with Gold Connectors (2m)',
      slug: 'braided-4k-hdmi-cable-2m',
      sku: 'EA-HDM-011',
      description: 'Supports 18Gbps bandwidth, HDR, and ARC audio. Heavy-duty nylon braiding prevents kinks, providing reliable connection for TV, monitor, and gaming consoles.',
      price: 399,
      discountPrice: 249,
      stockQuantity: 85,
      active: true,
      categoryId: 'cat_electronics_accessories',
      images: [
        { url: 'https://images.unsplash.com/photo-1558655146-d09347e92766?w=800&auto=format&fit=crop&q=80', altText: 'EA-HDM-011' }
      ],
    },

    // =========================================================================
    // 4. FASHION & APPAREL (11 Products)
    // =========================================================================
    {
      name: '100% Combed Organic Cotton Classic Crew Neck T-Shirt (Midnight Navy)',
      slug: 'organic-cotton-classic-crew-neck-tshirt-navy',
      sku: 'FA-TSH-001',
      description: '180 GSM pre-shrunk bio-washed combed cotton. Super soft, breathable fabric with reinforced ribbed collar that maintains shape wash after wash.',
      price: 699,
      discountPrice: 449,
      stockQuantity: 95,
      active: true,
      categoryId: 'cat_fashion_apparel',
      images: [
        { url: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&auto=format&fit=crop&q=80', altText: 'FA-TSH-001' }
      ],
    },
    {
      name: 'Pure Cotton Relaxed Fit Everyday Chino Trousers (Khaki Beige)',
      slug: 'pure-cotton-relaxed-fit-chino-trousers-khaki',
      sku: 'FA-TRZ-002',
      description: 'Tailored from breathable 98% cotton with 2% elastane stretch for all-day office comfort. Wrinkle-resistant finish with deep slant pockets.',
      price: 1499,
      discountPrice: 1099,
      stockQuantity: 40,
      active: true,
      categoryId: 'cat_fashion_apparel',
      images: [
        { url: 'https://images.unsplash.com/photo-1506630448388-4e683c67ddb0?w=800&auto=format&fit=crop&q=80', altText: 'FA-TRZ-002' }
      ],
    },
    {
      name: 'Water-Resistant Everyday Commuter Laptop Backpack (26L, Fits 15.6")',
      slug: 'water-resistant-commuter-laptop-backpack-26l',
      sku: 'FA-BAG-003',
      description: 'Durable 900D water-repellent oxford fabric with padded laptop sleeve, secret anti-theft back pocket, external USB pass-through, and luggage strap.',
      price: 1799,
      discountPrice: 1249,
      stockQuantity: 50,
      active: true,
      categoryId: 'cat_fashion_apparel',
      images: [
        { url: 'https://images.unsplash.com/photo-1546938576-6e6a64f317cc?w=800&auto=format&fit=crop&q=80', altText: 'FA-BAG-003' }
      ],
    },
    {
      name: 'Pure Cotton Breathable Casual Henley Polo T-Shirt (Heather Grey)',
      slug: 'pure-cotton-henley-polo-tshirt-grey',
      sku: 'FA-POL-004',
      description: '220 GSM pique knit fabric with classic button placket. Provides a sharp smart-casual look suitable for workplace and weekend outings.',
      price: 899,
      discountPrice: 599,
      stockQuantity: 65,
      active: true,
      categoryId: 'cat_fashion_apparel',
      images: [
        { url: 'https://images.unsplash.com/photo-1586363104862-3a5e2ab60d99?w=800&auto=format&fit=crop&q=80', altText: "Pure Cotton Breathable Casual Henley Polo T-Shirt (Heather Grey)" }
      ],
    },
    {
      name: 'Genuine Leather Classic Reversible Pin Buckle Belt (Black & Brown)',
      slug: 'genuine-leather-reversible-belt',
      sku: 'FA-BLT-005',
      description: 'Solid brass rotating buckle lets you switch between formal black and casual rich brown leather with one twist. 35mm width fits all trousers.',
      price: 799,
      discountPrice: 549,
      stockQuantity: 60,
      active: true,
      categoryId: 'cat_fashion_apparel',
      images: [
        { url: 'https://images.unsplash.com/photo-1624222247344-550fb60583dc?w=800&auto=format&fit=crop&q=80', altText: "Genuine Leather Classic Reversible Pin Buckle Belt (Black & Brown)" }
      ],
    },
    {
      name: 'Full-Grain Leather Bi-Fold Wallet with RFID Blocking Lining',
      slug: 'leather-bifold-wallet-rfid-blocking',
      sku: 'FA-WLT-006',
      description: 'Slim handcrafted leather wallet with 8 card slots, 2 currency compartments, and military-grade RFID lining to prevent digital pickpocketing.',
      price: 899,
      discountPrice: 599,
      stockQuantity: 70,
      active: true,
      categoryId: 'cat_fashion_apparel',
      images: [
        { url: 'https://images.unsplash.com/photo-1627123424574-724758594e93?w=800&auto=format&fit=crop&q=80', altText: 'FA-WLT-006' }
      ],
    },
    {
      name: 'Cushioned Cotton Ankle Sports Socks (Pack of 5 Pairs, Multi-Colour)',
      slug: 'cushioned-cotton-ankle-socks-5pack',
      sku: 'FA-SCK-007',
      description: 'Terry cushioned sole absorbs impact during running and gym workouts. Y-heel stitch and arch compression band prevent slipping inside shoes.',
      price: 499,
      discountPrice: 349,
      stockQuantity: 90,
      active: true,
      categoryId: 'cat_fashion_apparel',
      images: [
        { url: 'https://images.unsplash.com/photo-1582966772680-860e372bb558?w=800&auto=format&fit=crop&q=80', altText: "Cushioned Cotton Ankle Sports Socks (Pack of 5 Pairs, Multi-Colour)" }
      ],
    },
    {
      name: 'Lightweight Windproof Full-Zip Active Sports Running Jacket',
      slug: 'lightweight-windproof-running-jacket',
      sku: 'FA-JKT-008',
      description: 'Breathable water-resistant nylon shell with zippered pockets and reflective night-running safety strips. Folds into its own pocket for easy storage.',
      price: 1699,
      discountPrice: 1199,
      stockQuantity: 32,
      active: true,
      categoryId: 'cat_fashion_apparel',
      images: [
        { url: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=800&auto=format&fit=crop&q=80', altText: "Lightweight Windproof Full-Zip Active Sports Running Jacket" }
      ],
    },
    {
      name: 'Pure Linen Handloom Short Kurta for Casual & Festive Wear (Off-White)',
      slug: 'pure-linen-short-kurta-off-white',
      sku: 'FA-KRT-009',
      description: '100% breathable organic linen fabric with mandarin collar and coconut shell buttons. Keeps you cool in Indian summer weather.',
      price: 1299,
      discountPrice: 899,
      stockQuantity: 45,
      active: true,
      categoryId: 'cat_fashion_apparel',
      images: [
        { url: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=800&auto=format&fit=crop&q=80', altText: 'FA-KRT-009' }
      ],
    },
    {
      name: 'Polarized UV400 Protection Wayfarer Sunglasses with Hard Case',
      slug: 'polarized-uv400-wayfarer-sunglasses',
      sku: 'FA-SUN-010',
      description: 'TAC polarized shatterproof lenses eliminate reflective road and water glare with 100% UVA/B protection. Lightweight acetate frame with spring hinges.',
      price: 999,
      discountPrice: 699,
      stockQuantity: 55,
      active: true,
      categoryId: 'cat_fashion_apparel',
      images: [
        { url: 'https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=800&auto=format&fit=crop&q=80', altText: "Polarized UV400 Protection Wayfarer Sunglasses with Hard Case" }
      ],
    },
    {
      name: 'Comfort-Fit Brushed Fleece Casual Track Pants / Joggers (Charcoal)',
      slug: 'brushed-fleece-casual-joggers-charcoal',
      sku: 'FA-JOG-011',
      description: 'Soft cotton-rich fleece with elasticated drawstring waistband and ribbed ankle cuffs. Deep zippered side pockets secure phone and keys.',
      price: 999,
      discountPrice: 699,
      stockQuantity: 60,
      active: true,
      categoryId: 'cat_fashion_apparel',
      images: [
        { url: 'https://images.unsplash.com/photo-1552902865-b72c031ac5ea?w=800&auto=format&fit=crop&q=80', altText: 'FA-JOG-011' }
      ],
    },

    // =========================================================================
    // 5. PERSONAL CARE & GROOMING (11 Products)
    // =========================================================================
    {
      name: 'Cordless Waterproof Beard Trimmer with 20 Length Settings (Titanium Blades)',
      slug: 'cordless-waterproof-beard-trimmer-titanium',
      sku: 'PC-TRM-001',
      description: 'Self-sharpening titanium-coated skin-friendly blades with 0.5mm precision zoom wheel. 90-minute cordless runtime on a fast 1-hour USB quick charge.',
      price: 1499,
      discountPrice: 1099,
      stockQuantity: 45,
      active: true,
      categoryId: 'cat_personal_care',
      images: [
        { url: 'https://images.unsplash.com/photo-1621607512214-68297480165e?w=800&auto=format&fit=crop&q=80', altText: "Cordless Waterproof Beard Trimmer with 20 Length Settings (Titanium Blades)" }
      ],
    },
    {
      name: 'Ceramic Ionic Hair Dryer with 3 Heat Settings & Cool Shot (1600W)',
      slug: 'ceramic-ionic-hair-dryer-1600w',
      sku: 'PC-DRY-002',
      description: 'Advanced negative ionic technology neutralizes static frizz for smooth salon-like blowouts. Includes concentrator nozzle and foldable handle for travel.',
      price: 1399,
      discountPrice: 999,
      stockQuantity: 38,
      active: true,
      categoryId: 'cat_personal_care',
      images: [
        { url: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800&auto=format&fit=crop&q=80', altText: 'PC-DRY-002' }
      ],
    },
    {
      name: 'Natural Tea Tree & Salicylic Acid Anti-Acne Oil-Control Face Wash (150ml)',
      slug: 'tea-tree-salicylic-acid-face-wash-150ml',
      sku: 'PC-FCW-003',
      description: 'Sulphate-free purifying gentle foaming cleanser unclogs pores, controls excess sebum, and prevents pimples without stripping natural moisture.',
      price: 349,
      discountPrice: 249,
      stockQuantity: 80,
      active: true,
      categoryId: 'cat_personal_care',
      images: [
        { url: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=800&auto=format&fit=crop&q=80', altText: 'PC-FCW-003' }
      ],
    },
    {
      name: 'Broad Spectrum SPF 50 PA++++ Lightweight Matte Sunscreen Gel (50g)',
      slug: 'spf-50-matte-sunscreen-gel-50g',
      sku: 'PC-SUN-004',
      description: 'Non-greasy, ultra-light water-gel formula leaves zero white cast. Enriched with Centella Asiatica and Vitamin C to protect against UV and blue light.',
      price: 499,
      discountPrice: 399,
      stockQuantity: 75,
      active: true,
      categoryId: 'cat_personal_care',
      images: [
        { url: 'https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?w=800&auto=format&fit=crop&q=80', altText: "Broad Spectrum SPF 50 PA++++ Lightweight Matte Sunscreen Gel (50g)" }
      ],
    },
    {
      name: 'Niacinamide 10% & Zinc 1% Dark Spot Clarifying Face Serum (30ml)',
      slug: 'niacinamide-10-zinc-1-face-serum-30ml',
      sku: 'PC-SRM-005',
      description: 'Pure grade Vitamin B3 clinically proven to fade dark acne spots, reduce enlarged pores, and balance uneven skin tone within 4 weeks.',
      price: 599,
      discountPrice: 449,
      stockQuantity: 65,
      active: true,
      categoryId: 'cat_personal_care',
      images: [
        { url: 'https://images.unsplash.com/photo-1617897903246-719242758050?w=800&auto=format&fit=crop&q=80', altText: 'PC-SRM-005' }
      ],
    },
    {
      name: 'Sonic Electric Toothbrush with 40,000 VPM & 3 Replacement Heads',
      slug: 'sonic-electric-toothbrush-3heads',
      sku: 'PC-TBH-006',
      description: '5 cleaning modes (Clean, White, Polish, Massage, Sensitive) with built-in 2-minute smart timer and 30-day battery life per USB charge.',
      price: 1599,
      discountPrice: 1149,
      stockQuantity: 40,
      active: true,
      categoryId: 'cat_personal_care',
      images: [
        { url: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=800&auto=format&fit=crop&q=80', altText: 'PC-TBH-006' }
      ],
    },
    {
      name: 'Pure Shea Butter & Vitamin E Deep Nourishing Body Lotion (400ml)',
      slug: 'shea-butter-vitamin-e-body-lotion-400ml',
      sku: 'PC-LTN-007',
      description: 'Non-sticky fast-absorbing body lotion locks in deep moisture for 48 hours. Heals rough elbows, knees, and dry skin in cold weather.',
      price: 399,
      discountPrice: 299,
      stockQuantity: 70,
      active: true,
      categoryId: 'cat_personal_care',
      images: [
        { url: 'https://images.unsplash.com/photo-1526947425960-945c6e72858f?w=800&auto=format&fit=crop&q=80', altText: "Pure Shea Butter & Vitamin E Deep Nourishing Body Lotion (400ml)" }
      ],
    },
    {
      name: 'Natural Cold-Pressed Sweet Almond Oil for Hair & Skin (200ml)',
      slug: 'cold-pressed-sweet-almond-oil-200ml',
      sku: 'PC-ALM-008',
      description: '100% pure edible grade sweet almond oil rich in Vitamin E and antioxidants. Strengthens hair roots, softens skin, and works as gentle baby massage oil.',
      price: 399,
      discountPrice: 299,
      stockQuantity: 80,
      active: true,
      categoryId: 'cat_personal_care',
      images: [
        { url: 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=800&auto=format&fit=crop&q=80', altText: 'PC-ALM-008' }
      ],
    },
    {
      name: 'Multi-Purpose Stainless Steel Pedicure & Manicure Grooming Kit (12 Pcs)',
      slug: 'stainless-pedicure-manicure-kit-12pc',
      sku: 'PC-MNK-009',
      description: 'Surgical grade stainless steel nail clippers, cuticle scissors, tweezers, and files in a luxurious compact PU leather travel case.',
      price: 549,
      discountPrice: 379,
      stockQuantity: 60,
      active: true,
      categoryId: 'cat_personal_care',
      images: [
        { url: 'https://images.unsplash.com/photo-1629198688000-71f23e745b6e?w=800&auto=format&fit=crop&q=80', altText: "Multi-Purpose Stainless Steel Pedicure & Manicure Grooming Kit (12 Pcs)" }
      ],
    },
    {
      name: 'Hydrating Hyaluronic Acid Lightweight Oil-Free Water Gel Cream (50g)',
      slug: 'hyaluronic-acid-water-gel-cream-50g',
      sku: 'PC-GEL-010',
      description: 'Quick-absorbing oil-free gel moisturizer delivers intense 72-hour continuous hydration without clogging pores or feeling sticky in humid climates.',
      price: 499,
      discountPrice: 379,
      stockQuantity: 55,
      active: true,
      categoryId: 'cat_personal_care',
      images: [
        { url: 'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=800&auto=format&fit=crop&q=80', altText: 'PC-GEL-010' }
      ],
    },
    {
      name: 'Pure Activated Charcoal Deep Cleansing Peel-Off Face Mask (100g)',
      slug: 'activated-charcoal-peel-off-mask-100g',
      sku: 'PC-MSK-011',
      description: 'Natural bamboo charcoal acts like a magnet to extract stubborn blackheads, whiteheads, environmental pollutants, and dead skin cells.',
      price: 349,
      discountPrice: 249,
      stockQuantity: 65,
      active: true,
      categoryId: 'cat_personal_care',
      images: [
        { url: 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=800&auto=format&fit=crop&q=80', altText: 'PC-MSK-011' }
      ],
    },

    // =========================================================================
    // 6. STATIONERY & OFFICE (10 Products)
    // =========================================================================
    {
      name: 'Hardbound Executive Ruled Notebook (A5, 200 Pages, 100 GSM Cream Paper)',
      slug: 'hardbound-executive-ruled-notebook-a5',
      sku: 'SO-NBK-001',
      description: 'Premium faux leather hardbound journal with acid-free, bleed-resistant 100 GSM cream pages. Includes elastic band closure, ribbon bookmark, and inner rear pocket.',
      price: 320,
      discountPrice: 249,
      stockQuantity: 120,
      active: true,
      categoryId: 'cat_stationery_office',
      images: [
        { url: 'https://images.unsplash.com/photo-1589829085413-56de8ae18c73?w=800&auto=format&fit=crop&q=80', altText: 'SO-NBK-001' }
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
        { url: 'https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?w=800&auto=format&fit=crop&q=80', altText: "SmoothFlow 0.5mm Retractable Gel Ink Pen Set (Pack of 10, Blue & Black)" }
      ],
    },
    {
      name: 'Ergonomic Aluminium Folding Laptop Stand with 6-Level Height Adjustment',
      slug: 'ergonomic-aluminium-folding-laptop-stand',
      sku: 'SO-LST-003',
      description: 'Aviation-grade aluminium alloy stand with non-slip silicone pads. Foldable, portable design promotes healthy posture and laptop heat dissipation.',
      price: 1199,
      discountPrice: 799,
      stockQuantity: 65,
      active: true,
      categoryId: 'cat_stationery_office',
      images: [
        { url: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=800&auto=format&fit=crop&q=80', altText: 'SO-LST-003' }
      ],
    },
    {
      name: 'Eye-Care LED Desk Lamp with 3 Color Modes & Touch Dimming (USB Rechargeable)',
      slug: 'eyecare-led-desk-lamp-touch-control',
      sku: 'SO-LMP-004',
      description: 'Flicker-free warm, cool, and natural light modes with stepless brightness control. Flexible 180-degree gooseneck and USB rechargeable lithium battery.',
      price: 1299,
      discountPrice: 849,
      stockQuantity: 42,
      active: true,
      categoryId: 'cat_stationery_office',
      images: [
        { url: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=800&auto=format&fit=crop&q=80', altText: "Eye-Care LED Desk Lamp with 3 Color Modes & Touch Dimming (USB Rechargeable)" }
      ],
    },
    {
      name: 'Multi-Compartment Mesh Metal Desk Organizer Caddy with Drawer',
      slug: 'multi-compartment-metal-desk-organizer-caddy',
      sku: 'SO-ORG-005',
      description: 'Durable rust-resistant powder-coated steel mesh with 6 compartments and slide-out drawer for pens, sticky notes, paperclips, and stationery.',
      price: 599,
      discountPrice: 399,
      stockQuantity: 75,
      active: true,
      categoryId: 'cat_stationery_office',
      images: [
        { url: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=800&auto=format&fit=crop&q=80', altText: "Multi-Compartment Mesh Metal Desk Organizer Caddy with Drawer" }
      ],
    },
    {
      name: 'Extended Anti-Fray Waterproof Desk Mat Pad (800x300mm, Dual Color)',
      slug: 'extended-waterproof-desk-mat-pad',
      sku: 'SO-MAT-006',
      description: 'Dual-sided waterproof PU leather desk blotter protects your table from scratches, stains, and spills while providing a smooth mouse gliding surface.',
      price: 699,
      discountPrice: 479,
      stockQuantity: 60,
      active: true,
      categoryId: 'cat_stationery_office',
      images: [
        { url: 'https://images.unsplash.com/photo-1593062096033-9a26b09da705?w=800&auto=format&fit=crop&q=80', altText: 'SO-MAT-006' }
      ],
    },
    {
      name: 'Heavy Duty Multi-Purpose Stainless Steel Craft Scissors (Pack of 2)',
      slug: 'heavy-duty-stainless-craft-scissors-pack-2',
      sku: 'SO-SCS-007',
      description: 'Ultra-sharp titanium-coated blades for cutting paper, cardboard, fabric, and plastic packaging effortlessly. Soft-touch comfort grip handles.',
      price: 299,
      discountPrice: 199,
      stockQuantity: 80,
      active: true,
      categoryId: 'cat_stationery_office',
      images: [
        { url: 'https://images.unsplash.com/photo-1503792501406-2c40da09e1e2?w=800&auto=format&fit=crop&q=80', altText: 'SO-SCS-007' }
      ],
    },
    {
      name: 'Pastel Neon Sticky Notes with Index Flags (400 Sheets Pack)',
      slug: 'pastel-neon-sticky-notes-400-sheets',
      sku: 'SO-STK-008',
      description: 'Strong self-adhesive memo notes that stick reliably to monitors, books, and walls without leaving residue. Includes color-coded page flags.',
      price: 249,
      discountPrice: 169,
      stockQuantity: 110,
      active: true,
      categoryId: 'cat_stationery_office',
      images: [
        { url: 'https://images.unsplash.com/photo-1586075010923-2dd4570fb338?w=800&auto=format&fit=crop&q=80', altText: "Pastel Neon Sticky Notes with Index Flags (400 Sheets Pack)" }
      ],
    },
    {
      name: 'Desktop Cable Clips & Wire Management Organizers (Pack of 10)',
      slug: 'desktop-cable-clips-organizer-10pack',
      sku: 'SO-CBL-009',
      description: 'Strong 3M adhesive backed silicone clips keep phone chargers, USB cords, and headphone cables neatly organized and off the floor.',
      price: 249,
      discountPrice: 159,
      stockQuantity: 130,
      active: true,
      categoryId: 'cat_stationery_office',
      images: [
        { url: 'https://images.unsplash.com/photo-1508746829417-e6f548d8d6ed?w=800&auto=format&fit=crop&q=80', altText: 'SO-CBL-009' }
      ],
    },
    {
      name: 'Compact Metal Stapler with 1000 Standard Staples & Staple Remover',
      slug: 'compact-metal-stapler-with-staples-set',
      sku: 'SO-STP-010',
      description: 'Jam-free 25-sheet capacity metal body stapler with built-in staple reload indicator and ergonomic palm pressure pad.',
      price: 299,
      discountPrice: 199,
      stockQuantity: 85,
      active: true,
      categoryId: 'cat_stationery_office',
      images: [
        { url: 'https://images.unsplash.com/photo-1568667256549-094345857637?w=800&auto=format&fit=crop&q=80', altText: 'SO-STP-010' }
      ],
    },

    // =========================================================================
    // 7. MOBILE ACCESSORIES (10 Products)
    // =========================================================================
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
        { url: 'https://images.unsplash.com/photo-1586953208448-b95a79798f07?w=800&auto=format&fit=crop&q=80', altText: 'MA-MNT-001' }
      ],
    },
    {
      name: 'Super-Tough 9H Tempered Glass Screen Protector with Easy Align Frame (Pack of 2)',
      slug: '9h-tempered-glass-screen-protector-pack-2',
      sku: 'MA-GLS-002',
      description: 'Oleophobic anti-fingerprint coating with edge-to-edge 2.5D curved protection and 99.9% optical clarity. Includes precision auto-alignment installation frame.',
      price: 399,
      discountPrice: 249,
      stockQuantity: 140,
      active: true,
      categoryId: 'cat_mobile_accessories',
      images: [
        { url: 'https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?w=800&auto=format&fit=crop&q=80', altText: 'MA-GLS-002' }
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
        { url: 'https://images.unsplash.com/photo-1580910051074-3eb694886505?w=800&auto=format&fit=crop&q=80', altText: 'MA-CSE-003' }
      ],
    },
    {
      name: '15W Qi-Certified Fast Wireless Charging Pad with LED Indicator',
      slug: '15w-fast-wireless-charging-pad',
      sku: 'MA-WCH-004',
      description: 'Ultra-thin 6mm aluminium alloy base with foreign object detection and smart temperature control. Works through phone cases up to 5mm thickness.',
      price: 899,
      discountPrice: 599,
      stockQuantity: 50,
      active: true,
      categoryId: 'cat_mobile_accessories',
      images: [
        { url: 'https://images.unsplash.com/photo-1616401784845-180882ba9ba8?w=800&auto=format&fit=crop&q=80', altText: 'MA-WCH-004' }
      ],
    },
    {
      name: '65W GaN Dual Port USB-C Power Delivery Fast Wall Charger',
      slug: '65w-gan-dual-port-fast-wall-charger',
      sku: 'MA-GAN-005',
      description: 'Gallium Nitride (GaN) technology delivers high-power charging in a 50% smaller footprint. Fast-charges laptops, iPads, and iPhones simultaneously.',
      price: 1699,
      discountPrice: 1199,
      stockQuantity: 45,
      active: true,
      categoryId: 'cat_mobile_accessories',
      images: [
        { url: 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=800&auto=format&fit=crop&q=80', altText: 'MA-GAN-005' }
      ],
    },
    {
      name: 'Heavy-Duty Braided 60W Type-C to Type-C Fast Charging Cable (1.5m)',
      slug: 'braided-60w-type-c-cable-1-5m',
      sku: 'MA-CBL-006',
      description: 'Reinforced ballistic nylon weave withstands 25,000+ bends. Supports 480Mbps data transfer and fast Power Delivery for Android & MacBooks.',
      price: 349,
      discountPrice: 219,
      stockQuantity: 120,
      active: true,
      categoryId: 'cat_mobile_accessories',
      images: [
        { url: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=800&auto=format&fit=crop&q=80', altText: "Heavy-Duty Braided 60W Type-C to Type-C Fast Charging Cable (1.5m)" }
      ],
    },
    {
      name: 'High-Speed Dual Metal 38W Fast Car Charger (Type-C PD & QC 3.0)',
      slug: 'dual-metal-38w-fast-car-charger',
      sku: 'MA-CAR-007',
      description: 'All-metal zinc alloy body fits flush into 12V/24V cigarette lighter socket with soft blue circular LED ring for nighttime visibility.',
      price: 599,
      discountPrice: 399,
      stockQuantity: 65,
      active: true,
      categoryId: 'cat_mobile_accessories',
      images: [
        { url: 'https://images.unsplash.com/photo-1517400508447-f8dd518b86db?w=800&auto=format&fit=crop&q=80', altText: 'MA-CAR-007' }
      ],
    },
    {
      name: 'Foldable Aluminium Mobile & Tablet Desktop Stand Holder',
      slug: 'foldable-aluminium-phone-tablet-stand',
      sku: 'MA-STD-008',
      description: 'Dual-hinge 270-degree adjustable viewing angle for video calls, recipe reading, and gaming with dedicated cable charging pass-through slot.',
      price: 499,
      discountPrice: 329,
      stockQuantity: 75,
      active: true,
      categoryId: 'cat_mobile_accessories',
      images: [
        { url: 'https://images.unsplash.com/photo-1586105251261-72a756497a11?w=800&auto=format&fit=crop&q=80', altText: 'MA-STD-008' }
      ],
    },
    {
      name: '2-in-1 Type-C to 3.5mm Headphone Jack & Fast Charging Splitter',
      slug: 'type-c-to-3-5mm-audio-charging-splitter',
      sku: 'MA-SPL-009',
      description: 'Built-in Hi-Res DAC audio chip ensures crisp lossless sound while charging your smartphone at up to 30W Power Delivery simultaneously.',
      price: 399,
      discountPrice: 249,
      stockQuantity: 80,
      active: true,
      categoryId: 'cat_mobile_accessories',
      images: [
        { url: 'https://images.unsplash.com/photo-1563770660941-20978e870e26?w=800&auto=format&fit=crop&q=80', altText: 'MA-SPL-009' }
      ],
    },
    {
      name: 'Ultra-Slim Ring Grip Holder & Magnetic Kickstand for Smartphones',
      slug: 'ultra-slim-ring-grip-holder-magnetic',
      sku: 'MA-RNG-010',
      description: 'Premium zinc alloy 3mm ultra-thin phone grip rotates 360 degrees and flips 180 degrees. Compatible with magnetic car dashboard phone holders.',
      price: 249,
      discountPrice: 149,
      stockQuantity: 110,
      active: true,
      categoryId: 'cat_mobile_accessories',
      images: [
        { url: 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=800&auto=format&fit=crop&q=80', altText: 'MA-RNG-010' }
      ],
    },

    // =========================================================================
    // 8. TRAVEL & LIFESTYLE (8 Products)
    // =========================================================================
    {
      name: 'Memory Foam Ergonomic Travel Neck Pillow with Washable Velvet Cover',
      slug: 'memory-foam-ergonomic-travel-neck-pillow',
      sku: 'TL-PLW-001',
      description: '100% pure high-density memory foam with 360-degree chin and neck support. Includes breathable washable cover, sleep eye mask, and earplugs.',
      price: 799,
      discountPrice: 549,
      stockQuantity: 50,
      active: true,
      categoryId: 'cat_travel_lifestyle',
      images: [
        { url: 'https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?w=800&auto=format&fit=crop&q=80', altText: "Memory Foam Ergonomic Travel Neck Pillow with Washable Velvet Cover" }
      ],
    },
    {
      name: 'Water-Resistant Compression Luggage Packing Cubes Set (6 Pcs Organizer)',
      slug: 'compression-luggage-packing-cubes-set-6',
      sku: 'TL-CUB-002',
      description: 'Ripstop honeycomb nylon cubes with double compression zippers save up to 40% suitcase space. Includes dedicated laundry and shoe bags.',
      price: 1099,
      discountPrice: 749,
      stockQuantity: 45,
      active: true,
      categoryId: 'cat_travel_lifestyle',
      images: [
        { url: 'https://images.unsplash.com/photo-1581553680321-4fffae59fccd?w=800&auto=format&fit=crop&q=80', altText: 'TL-CUB-002' }
      ],
    },
    {
      name: 'Automatic Open-Close Windproof Teflon Travel Umbrella (Compact)',
      slug: 'automatic-windproof-teflon-travel-umbrella',
      sku: 'TL-UMB-003',
      description: '9-rib reinforced fiberglass frame with water-repellent 210T Teflon canopy. Withstands heavy downpours and strong wind gusts without flipping inside out.',
      price: 699,
      discountPrice: 499,
      stockQuantity: 65,
      active: true,
      categoryId: 'cat_travel_lifestyle',
      images: [
        { url: 'https://images.unsplash.com/photo-1517404215738-15263e9f9178?w=800&auto=format&fit=crop&q=80', altText: 'TL-UMB-003' }
      ],
    },
    {
      name: 'TSA Approved 3-Digit Combination Cable Luggage Locks (Pack of 2)',
      slug: 'tsa-approved-combination-luggage-locks-pack-2',
      sku: 'TL-LCK-004',
      description: 'Durable zinc alloy lock body with flexible braided steel cable that threads easily through multiple zipper pulls on suitcases and backpacks.',
      price: 499,
      discountPrice: 349,
      stockQuantity: 80,
      active: true,
      categoryId: 'cat_travel_lifestyle',
      images: [
        { url: 'https://images.unsplash.com/photo-1584982751601-97dcc096659c?w=800&auto=format&fit=crop&q=80', altText: 'TL-LCK-004' }
      ],
    },
    {
      name: 'Foldable Lightweight Water-Resistant Gym & Travel Duffle Bag (35L)',
      slug: 'foldable-water-resistant-travel-duffle-bag-35l',
      sku: 'TL-DUF-005',
      description: 'Spacious main compartment with ventilated side shoe pocket and wet-dry separation pouch. Folds down into a small compact pouch when not in use.',
      price: 999,
      discountPrice: 699,
      stockQuantity: 40,
      active: true,
      categoryId: 'cat_travel_lifestyle',
      images: [
        { url: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&auto=format&fit=crop&q=80', altText: 'TL-DUF-005' }
      ],
    },
    {
      name: 'Universal All-in-One Worldwide Travel Adapter with 4 USB Ports',
      slug: 'universal-worldwide-travel-adapter-4usb',
      sku: 'TL-ADP-006',
      description: 'Covers over 150 countries with US/EU/UK/AUS plugs. 4 USB ports plus Type-C fast output with dual 6A safety fuses for global travel.',
      price: 1199,
      discountPrice: 799,
      stockQuantity: 48,
      active: true,
      categoryId: 'cat_travel_lifestyle',
      images: [
        { url: 'https://images.unsplash.com/photo-1527631746610-bca00a040d60?w=800&auto=format&fit=crop&q=80', altText: 'TL-ADP-006' }
      ],
    },
    {
      name: 'RFID Blocking Multi-Pocket Travel Passport Wallet & Document Organizer',
      slug: 'rfid-passport-wallet-document-organizer',
      sku: 'TL-WLT-007',
      description: 'Stores up to 4 passports, boarding passes, credit cards, cash, and SIM cards in organized zippered compartments with external quick-access boarding pass slip.',
      price: 599,
      discountPrice: 399,
      stockQuantity: 55,
      active: true,
      categoryId: 'cat_travel_lifestyle',
      images: [
        { url: 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=800&auto=format&fit=crop&q=80', altText: 'TL-WLT-007' }
      ],
    },
    {
      name: 'Hanging Waterproof Toiletry & Cosmetic Organizer Bag with Swivel Hook',
      slug: 'hanging-waterproof-toiletry-cosmetic-bag',
      sku: 'TL-TOI-008',
      description: '4 separate clear zippered compartments with elastic loops for bottles, shampoo, shaving kit, and cosmetics. 360-degree metal hook hangs on towel bars and bathroom doors.',
      price: 699,
      discountPrice: 469,
      stockQuantity: 60,
      active: true,
      categoryId: 'cat_travel_lifestyle',
      images: [
        { url: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=800&auto=format&fit=crop&q=80', altText: 'TL-TOI-008' }
      ],
    },
  ];

  for (const prod of productsData) {
    const { images, ...productFields } = prod;
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
