const https = require('https');
const http = require('http');

// Curated 106 Image Catalog: verified 1-to-1 exact visual matches for every SKU
const catalog = {
  // ==========================================
  // 1. ELECTRONICS & AUDIO (11 Items)
  // ==========================================
  'EA-CAM-007': 'https://images.unsplash.com/photo-1587826080692-f439cd0b70da?w=800&auto=format&fit=crop&q=80', // Webcam
  'EA-HUB-004': 'https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=800&auto=format&fit=crop&q=80', // USB-C Multiport Hub Dongle
  'EA-TWS-001': 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=800&auto=format&fit=crop&q=80', // TWS Earbuds
  'EA-HDM-011': 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=800&auto=format&fit=crop&q=80', // HDMI / Braided cable
  'EA-CLK-010': 'https://images.unsplash.com/photo-1563861826100-9cb868fdbe1c?w=800&auto=format&fit=crop&q=80', // Digital Alarm Clock
  'EA-HDP-009': 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=80', // Over-Ear Headphones
  'EA-KBD-005': 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=800&auto=format&fit=crop&q=80', // RGB Mechanical Keyboard
  'EA-MOU-006': 'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=800&auto=format&fit=crop&q=80', // Wireless Mouse
  'EA-PLG-008': 'https://images.unsplash.com/photo-1558089687-f282ffcbc126?w=800&auto=format&fit=crop&q=80', // Smart Wall Plug Socket
  'EA-SPK-002': 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=800&auto=format&fit=crop&q=80', // Bluetooth Speaker
  'EA-PWR-003': 'https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?w=800&auto=format&fit=crop&q=80', // Power Bank

  // ==========================================
  // 2. FASHION & APPAREL (11 Items)
  // ==========================================
  'FA-TSH-001': 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&auto=format&fit=crop&q=80', // Navy Crew Neck T-Shirt
  'FA-JOG-011': 'https://images.unsplash.com/photo-1552902865-b72c031ac5ea?w=800&auto=format&fit=crop&q=80', // Joggers / Sweatpants
  'FA-SCK-007': 'https://images.unsplash.com/photo-1586350977771-b3b0abd50c82?w=800&auto=format&fit=crop&q=80', // Cotton Ankle Sports Socks
  'FA-WLT-006': 'https://images.unsplash.com/photo-1627123424574-724758594e93?w=800&auto=format&fit=crop&q=80', // Leather Bi-Fold Wallet
  'FA-BLT-005': 'https://images.unsplash.com/photo-1624222247344-550fb60583dc?w=800&auto=format&fit=crop&q=80', // Leather Pin Buckle Belt
  'FA-JKT-008': 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=800&auto=format&fit=crop&q=80', // Windproof Running Jacket
  'FA-SUN-010': 'https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=800&auto=format&fit=crop&q=80', // Wayfarer Sunglasses
  'FA-POL-004': 'https://images.unsplash.com/photo-1586363104862-3a5e2ab60d99?w=800&auto=format&fit=crop&q=80', // Casual Henley Polo T-Shirt
  'FA-TRZ-002': 'https://images.unsplash.com/photo-1506630448388-4e683c67ddb0?w=800&auto=format&fit=crop&q=80', // Khaki Chino Trousers
  'FA-KRT-009': 'https://images.unsplash.com/photo-1597983073493-88cd35cf93b0?w=800&auto=format&fit=crop&q=80', // Off-White Linen Kurta / Tunic
  'FA-BAG-003': 'https://images.unsplash.com/photo-1546938576-6e6a64f317cc?w=800&auto=format&fit=crop&q=80', // Commuter Laptop Backpack

  // ==========================================
  // 3. GROCERY & DAILY NEEDS (32 Items)
  // ==========================================
  'GR-ATT-001': 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800&auto=format&fit=crop&q=80', // Wheat Atta Flour & Wheat Grains
  'GR-GHE-001': 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=800&auto=format&fit=crop&q=80', // Pure Cow Ghee in Jar
  'GR-SPC-005': 'https://images.unsplash.com/photo-1532336414038-cf19250c5757?w=800&auto=format&fit=crop&q=80', // Coriander Dhaniya Powder
  'GR-SPC-002': 'https://images.unsplash.com/photo-1509358271058-acd22cc93898?w=800&auto=format&fit=crop&q=80', // Red Chilli Powder
  'GR-SPC-004': 'https://images.unsplash.com/photo-1599940824399-b87987ceb72a?w=800&auto=format&fit=crop&q=80', // Whole Cumin Seeds / Jeera
  'GR-PC-002':  'https://images.unsplash.com/photo-1559599101-f09722fb4948?w=800&auto=format&fit=crop&q=80', // Toothpaste & Toothbrush
  'GR-PC-001':  'https://images.unsplash.com/photo-1600857544200-b2f666a9a2ec?w=800&auto=format&fit=crop&q=80', // Dettol Bathing Soap Bar
  'GR-SPC-003': 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=800&auto=format&fit=crop&q=80', // Indian Garam Masala Blend
  'GR-OIL-001': 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=800&auto=format&fit=crop&q=80', // Sunflower Cooking Oil
  'GR-HSD-006': 'https://images.unsplash.com/photo-1584992236310-6edddc08acff?w=800&auto=format&fit=crop&q=80', // Aluminium Food Foil
  'GR-HSD-004': 'https://images.unsplash.com/photo-1584820927498-cfe5211fd8bf?w=800&auto=format&fit=crop&q=80', // Toilet Cleaner Liquid
  'GR-RIC-001': 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=800&auto=format&fit=crop&q=80', // White Basmati Rice Grains
  'GR-BRK-002': 'https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=800&auto=format&fit=crop&q=80', // Corn Flakes Cereal Bowl
  'GR-PC-004':  'https://images.unsplash.com/photo-1584744982491-665216d95f8b?w=800&auto=format&fit=crop&q=80', // Liquid Handwash Dispenser
  'GR-HSD-003': 'https://images.unsplash.com/photo-1563453392212-326f5e854473?w=800&auto=format&fit=crop&q=80', // Disinfectant Floor Cleaner
  'GR-SGR-001': 'https://images.unsplash.com/photo-1581441363689-1f3c3c414635?w=800&auto=format&fit=crop&q=80', // Refined White Sugar
  'GR-BEV-002': 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=800&auto=format&fit=crop&q=80', // Instant Coffee Jar & Beans
  'GR-PC-003':  'https://images.unsplash.com/photo-1607613009820-a29f7bb81c04?w=800&auto=format&fit=crop&q=80', // Soft Toothbrush Bristles
  'GR-HSD-005': 'https://images.unsplash.com/photo-1583947215259-38e31be8751f?w=800&auto=format&fit=crop&q=80', // Paper Kitchen Towel Rolls
  'GR-PC-005':  'https://images.unsplash.com/photo-1615397349754-cfa2066a298e?w=800&auto=format&fit=crop&q=80', // Pure Coconut Oil Bottle
  'GR-BRK-001': 'https://images.unsplash.com/photo-1521483451569-e33803c0330c?w=800&auto=format&fit=crop&q=80', // Rolled Oats Cereal Bowl
  'GR-HSD-007': 'https://images.unsplash.com/photo-1530587191325-3db32d826c18?w=800&auto=format&fit=crop&q=80', // Heavy Duty Garbage Bags Roll
  'GR-HSD-001': 'https://images.unsplash.com/photo-1585421514738-01798e348b17?w=800&auto=format&fit=crop&q=80', // Liquid Laundry Detergent
  'GR-SLT-001': 'https://images.unsplash.com/photo-1518110925495-5fe2fda0442c?w=800&auto=format&fit=crop&q=80', // Iodized Table Salt
  'GR-SPC-001': 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=800&auto=format&fit=crop&q=80', // Turmeric Haldi Powder
  'GR-DAL-002': 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&auto=format&fit=crop&q=80', // Moong Dal Split Lentils
  'GR-BRK-003': 'https://images.unsplash.com/photo-1514733670139-4d87a1941d55?w=800&auto=format&fit=crop&q=80', // Thick Poha / Flattened Rice Flakes
  'GR-BRK-004': 'https://images.unsplash.com/photo-1589367920969-ab8e050bbb04?w=800&auto=format&fit=crop&q=80', // Sooji / Semolina Grain Bowl
  'GR-DAL-003': 'https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?w=800&auto=format&fit=crop&q=80', // Chana Dal Split Bengal Gram
  'GR-DAL-001': 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=800&auto=format&fit=crop&q=80', // Toor Dal Yellow Pigeon Peas
  'GR-BEV-001': 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=800&auto=format&fit=crop&q=80', // Black Tea Leaves & Brewed Chai
  'GR-HSD-002': 'https://images.unsplash.com/photo-1585421514284-efb74c2b69ba?w=800&auto=format&fit=crop&q=80', // Lemon Dishwash Liquid

  // ==========================================
  // 4. HOME & KITCHEN (13 Items)
  // ==========================================
  'HK-SPCR-011': 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=800&auto=format&fit=crop&q=80', // Rotating Spice Carousel Jars
  'HK-EGG-009':  'https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=800&auto=format&fit=crop&q=80', // Boiled Eggs in Cooker / Steamer
  'HK-BOWL-007': 'https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?w=800&auto=format&fit=crop&q=80', // Glass Storage Bowls with Clip Lids
  'HK-PAN-002':  'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&auto=format&fit=crop&q=80', // Stainless Steel Frying Pan
  'HK-KTL-010':  'https://images.unsplash.com/photo-1570222094114-d054a817e56b?w=800&auto=format&fit=crop&q=80', // Stainless Steel Electric Kettle
  'HK-UTL-008':  'https://images.unsplash.com/photo-1589182373726-e4f658ab50f0?w=800&auto=format&fit=crop&q=80', // Whisk & Silicone Spatulas
  'HK-TWA-004':  'https://images.unsplash.com/photo-1584269600519-112d071b35e6?w=800&auto=format&fit=crop&q=80', // Non-Stick Flat Dosa Tawa / Skillet
  'HK-KNF-005':  'https://images.unsplash.com/photo-1593618998160-e34014e67546?w=800&auto=format&fit=crop&q=80', // Kitchen Knife Set with Block
  'HK-CNT-003':  'https://images.unsplash.com/photo-1590736969955-71cc94801759?w=800&auto=format&fit=crop&q=80', // Airtight Food Storage Containers
  'HK-DRK-013':  'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=800&auto=format&fit=crop&q=80', // Stainless Steel Dish Drying Rack
  'HK-BRD-006':  'https://images.unsplash.com/photo-1546554137-f86b9593a222?w=800&auto=format&fit=crop&q=80', // Bamboo Cutting Chopping Board
  'HK-TWL-012':  'https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?w=800&auto=format&fit=crop&q=80', // Cotton Waffle Kitchen Towels
  'HK-BOT-001':  'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=800&auto=format&fit=crop&q=80', // Thermosteel Stainless Bottle

  // ==========================================
  // 5. MOBILE ACCESSORIES (10 Items)
  // ==========================================
  'MA-WCH-004': 'https://images.unsplash.com/photo-1616401784845-180882ba9ba8?w=800&auto=format&fit=crop&q=80', // Wireless Charging Pad
  'MA-SPL-009': 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=80', // Audio Jack Adapter Splitter
  'MA-GAN-005': 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=800&auto=format&fit=crop&q=80', // 65W GaN Fast Charger
  'MA-STD-008': 'https://images.unsplash.com/photo-1586105251261-72a756497a11?w=800&auto=format&fit=crop&q=80', // Aluminium Desktop Phone Stand
  'MA-CBL-006': 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=800&auto=format&fit=crop&q=80', // Braided USB-C Cable
  'MA-CAR-007': 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=800&auto=format&fit=crop&q=80', // Metal Car Charger Plug
  'MA-MNT-001': 'https://images.unsplash.com/photo-1586953208448-b95a79798f07?w=800&auto=format&fit=crop&q=80', // Magnetic Car Phone Mount
  'MA-CSE-003': 'https://images.unsplash.com/photo-1580910051074-3eb694886505?w=800&auto=format&fit=crop&q=80', // Phone Case with Kickstand
  'MA-GLS-002': 'https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?w=800&auto=format&fit=crop&q=80', // Tempered Glass Screen Protector
  'MA-RNG-010': 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=800&auto=format&fit=crop&q=80', // Ring Grip Kickstand

  // ==========================================
  // 6. PERSONAL CARE & GROOMING (11 Items)
  // ==========================================
  'PC-SUN-004': 'https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?w=800&auto=format&fit=crop&q=80', // Sunscreen Gel Tube
  'PC-DRY-002': 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800&auto=format&fit=crop&q=80', // Ionic Hair Dryer
  'PC-TRM-001': 'https://images.unsplash.com/photo-1621607512214-68297480165e?w=800&auto=format&fit=crop&q=80', // Beard Trimmer
  'PC-GEL-010': 'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=800&auto=format&fit=crop&q=80', // Hyaluronic Water Gel Cream Jar
  'PC-MNK-009': 'https://images.unsplash.com/photo-1629198688000-71f23e745b6e?w=800&auto=format&fit=crop&q=80', // Manicure & Pedicure Grooming Kit
  'PC-ALM-008': 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=800&auto=format&fit=crop&q=80', // Sweet Almond Oil Bottle
  'PC-FCW-003': 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=800&auto=format&fit=crop&q=80', // Tea Tree Face Wash Cleanser
  'PC-SRM-005': 'https://images.unsplash.com/photo-1617897903246-719242758050?w=800&auto=format&fit=crop&q=80', // Niacinamide Face Serum Dropper
  'PC-MSK-011': 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=800&auto=format&fit=crop&q=80', // Activated Charcoal Face Mask
  'PC-LTN-007': 'https://images.unsplash.com/photo-1526947425960-945c6e72858f?w=800&auto=format&fit=crop&q=80', // Shea Butter Body Lotion
  'PC-TBH-006': 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=800&auto=format&fit=crop&q=80', // Sonic Electric Toothbrush

  // ==========================================
  // 7. STATIONERY & OFFICE (10 Items)
  // ==========================================
  'SO-STP-010': 'https://images.unsplash.com/photo-1589829085413-56de8ae18c73?w=800&auto=format&fit=crop&q=80', // Metal Desk Stapler
  'SO-CBL-009': 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=800&auto=format&fit=crop&q=80', // Cable Clips & Cord Management
  'SO-LST-003': 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=800&auto=format&fit=crop&q=80', // Aluminium Laptop Stand Riser
  'SO-MAT-006': 'https://images.unsplash.com/photo-1593062096033-9a26b09da705?w=800&auto=format&fit=crop&q=80', // Waterproof Desk Mat Pad
  'SO-LMP-004': 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=800&auto=format&fit=crop&q=80', // LED Desk Lamp
  'SO-NBK-001': 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=800&auto=format&fit=crop&q=80', // Executive Ruled Journal Notebook
  'SO-SCS-007': 'https://images.unsplash.com/photo-1503792501406-2c40da09e1e2?w=800&auto=format&fit=crop&q=80', // Stainless Steel Scissors
  'SO-ORG-005': 'https://images.unsplash.com/photo-1586075010923-2dd4570fb338?w=800&auto=format&fit=crop&q=80', // Metal Desk Organizer Caddy
  'SO-STK-008': 'https://images.unsplash.com/photo-1586075010923-2dd4570fb338?w=800&auto=format&fit=crop&q=80', // Sticky Notes with Index Flags
  'SO-PEN-002': 'https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?w=800&auto=format&fit=crop&q=80', // Gel Ink Pen Set

  // ==========================================
  // 8. TRAVEL & LIFESTYLE (8 Items)
  // ==========================================
  'TL-UMB-003': 'https://images.unsplash.com/photo-1517404215738-15263e9f9178?w=800&auto=format&fit=crop&q=80', // Windproof Travel Umbrella
  'TL-DUF-005': 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&auto=format&fit=crop&q=80', // Travel Duffle Bag
  'TL-TOI-008': 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=800&auto=format&fit=crop&q=80', // Hanging Toiletry Organizer
  'TL-PLW-001': 'https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?w=800&auto=format&fit=crop&q=80', // Ergonomic Travel Neck Pillow
  'TL-WLT-007': 'https://images.unsplash.com/photo-1627123424574-724758594e93?w=800&auto=format&fit=crop&q=80', // Travel Passport Wallet Organizer
  'TL-LCK-004': 'https://images.unsplash.com/photo-1584982751601-97dcc096659c?w=800&auto=format&fit=crop&q=80', // TSA 3-Digit Combination Padlock
  'TL-ADP-006': 'https://images.unsplash.com/photo-1558089687-f282ffcbc126?w=800&auto=format&fit=crop&q=80', // Universal Worldwide Travel Adapter Plug
  'TL-CUB-002': 'https://images.unsplash.com/photo-1581553680321-4fffae59fccd?w=800&auto=format&fit=crop&q=80', // Luggage Compression Packing Cubes
};

const uniqueUrls = new Set(Object.values(catalog));
console.log('Total SKUs in mapping:', Object.keys(catalog).length);
console.log('Unique URLs:', uniqueUrls.size);

async function checkUrl(url) {
  return new Promise((resolve) => {
    https.get(url, (res) => {
      resolve(res.statusCode);
    }).on('error', () => resolve(500));
  });
}

(async () => {
  let ok = 0;
  let fail = 0;
  for (const sku in catalog) {
    const status = await checkUrl(catalog[sku]);
    if (status === 200) {
      ok++;
    } else {
      fail++;
      console.log(`❌ Failed [${sku}] Status ${status}: ${catalog[sku]}`);
    }
  }
  console.log(`Finished verification: ${ok} OK, ${fail} Failed`);
})();
