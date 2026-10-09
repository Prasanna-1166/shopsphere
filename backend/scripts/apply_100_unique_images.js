const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const prisma = require('../src/config/prisma');

const uniqueSkuImages = {
  // Grocery & Daily Needs
  'GR-OIL-001': 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=800&auto=format&fit=crop&q=80',
  'GR-PC-005': 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=800&auto=format&fit=crop&q=80',
  'GR-PC-002': 'https://images.unsplash.com/photo-1559599101-f09722fb4948?w=800&auto=format&fit=crop&q=80',
  'GR-PC-003': 'https://images.unsplash.com/photo-1559599238-308793637427?w=800&auto=format&fit=crop&q=80',
  'GR-HSD-001': 'https://images.unsplash.com/photo-1585421514738-01798e348b17?w=800&auto=format&fit=crop&q=80',
  'GR-PC-004': 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=800&auto=format&fit=crop&q=80',
  'GR-HSD-003': 'https://images.unsplash.com/photo-1563453392212-326f5e854473?w=800&auto=format&fit=crop&q=80',
  'GR-HSD-007': 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80',
  'GR-HSD-006': 'https://images.unsplash.com/photo-1584992236310-6edddc08acff?w=800&auto=format&fit=crop&q=80',
  'GR-SPC-005': 'https://images.unsplash.com/photo-1532336414038-cf19250c5757?w=800&auto=format&fit=crop&q=80',
  'GR-PC-001': 'https://images.unsplash.com/photo-1600857544200-b2f666a9a2ec?w=800&auto=format&fit=crop&q=80',

  // Home & Kitchen
  'HK-CNT-003': 'https://images.unsplash.com/photo-1590736969955-71cc94801759?w=800&auto=format&fit=crop&q=80',
  'HK-BOWL-007': 'https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?w=800&auto=format&fit=crop&q=80',
  'HK-DRK-013': 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=800&auto=format&fit=crop&q=80',
  'HK-PAN-002': 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&auto=format&fit=crop&q=80',
  'HK-TWA-004': 'https://images.unsplash.com/photo-1590794056226-79ef3a8147e1?w=800&auto=format&fit=crop&q=80',
  'HK-SPCR-011': 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=800&auto=format&fit=crop&q=80',
  'HK-TWL-012': 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&auto=format&fit=crop&q=80',

  // Personal Care & Grooming
  'PC-ALM-008': 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=800&auto=format&fit=crop&q=80',
  'PC-TBH-006': 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=800&auto=format&fit=crop&q=80',
  'PC-DRY-002': 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800&auto=format&fit=crop&q=80',
  'PC-MSK-011': 'https://images.unsplash.com/photo-1567928815116-f576e1074eef?w=800&auto=format&fit=crop&q=80',
  'PC-FCW-003': 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=800&auto=format&fit=crop&q=80',

  // Electronics & Audio
  'EA-HDM-011': 'https://images.unsplash.com/photo-1558655146-d09347e92766?w=800&auto=format&fit=crop&q=80',
  'EA-HUB-004': 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=800&auto=format&fit=crop&q=80',

  // Mobile Accessories
  'MA-SPL-009': 'https://images.unsplash.com/photo-1563770660941-20978e870e26?w=800&auto=format&fit=crop&q=80',
  'MA-MNT-001': 'https://images.unsplash.com/photo-1586953208448-b95a79798f07?w=800&auto=format&fit=crop&q=80',
  'MA-STD-008': 'https://images.unsplash.com/photo-1586105251261-72a756497a11?w=800&auto=format&fit=crop&q=80',
  'MA-GLS-002': 'https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?w=800&auto=format&fit=crop&q=80',
  'MA-RNG-010': 'https://images.unsplash.com/photo-1580910051074-3eb694886505?w=800&auto=format&fit=crop&q=80',
  'MA-WCH-004': 'https://images.unsplash.com/photo-1616401784845-180882ba9ba8?w=800&auto=format&fit=crop&q=80',
  'MA-CCH-003': 'https://images.unsplash.com/photo-1517400508447-f8dd518b86db?w=800&auto=format&fit=crop&q=80',
  'MA-CAB-001': 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=800&auto=format&fit=crop&q=80',

  // Stationery & Office
  'SO-NBK-001': 'https://images.unsplash.com/photo-1589829085413-56de8ae18c73?w=800&auto=format&fit=crop&q=80',
  'SO-LST-003': 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=800&auto=format&fit=crop&q=80',

  // Travel & Lifestyle
  'TL-LCK-004': 'https://images.unsplash.com/photo-1582139329536-e7284fece509?w=800&auto=format&fit=crop&q=80',
  'TL-WLT-007': 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=800&auto=format&fit=crop&q=80',
  'TL-CUB-002': 'https://images.unsplash.com/photo-1565084888279-aca607ecce0c?w=800&auto=format&fit=crop&q=80',
  'TL-DUF-005': 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&auto=format&fit=crop&q=80',
  'TL-TOI-008': 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=800&auto=format&fit=crop&q=80',
  'TL-ADP-006': 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=800&auto=format&fit=crop&q=80',

  // Fashion & Apparel
  'FA-WLT-006': 'https://images.unsplash.com/photo-1627123424574-724758594e93?w=800&auto=format&fit=crop&q=80',
  'FA-BAG-003': 'https://images.unsplash.com/photo-1546938576-6e6a64f317cc?w=800&auto=format&fit=crop&q=80',
  'FA-TSH-001': 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&auto=format&fit=crop&q=80',
  'FA-KRT-009': 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=800&auto=format&fit=crop&q=80',
  'FA-TRZ-002': 'https://images.unsplash.com/photo-1506630448388-4e683c67ddb0?w=800&auto=format&fit=crop&q=80',
  'FA-JOG-011': 'https://images.unsplash.com/photo-1552902865-b72c031ac5ea?w=800&auto=format&fit=crop&q=80',
};

async function main() {
  console.log('🔄 Applying 100% unique, verified image mappings to all catalog products in Neon DB...');
  let count = 0;
  for (const [sku, url] of Object.entries(uniqueSkuImages)) {
    const prod = await prisma.product.findUnique({ where: { sku } });
    if (prod) {
      await prisma.productImage.deleteMany({ where: { productId: prod.id } });
      await prisma.productImage.create({
        data: {
          productId: prod.id,
          url,
          altText: prod.name,
          sortOrder: 0,
        },
      });
      count++;
    }
  }
  console.log(`✅ Successfully updated ${count} products in DB.`);

  // Also update prisma/seed.js
  let seedContent = fs.readFileSync(path.resolve(__dirname, '../../prisma/seed.js'), 'utf8');
  for (const [sku, url] of Object.entries(uniqueSkuImages)) {
    const skuRegex = new RegExp(`(sku:\\s*['"]${sku}['"][\\s\\S]*?images:\\s*\\[)([\\s\\S]*?)(\\])`, 'm');
    const match = seedContent.match(skuRegex);
    if (match) {
      const replacement = `$1\n        { url: '${url}', altText: '${sku}' }\n      $3`;
      seedContent = seedContent.replace(skuRegex, replacement);
    }
  }
  fs.writeFileSync(path.resolve(__dirname, '../../prisma/seed.js'), seedContent, 'utf8');
  console.log('✅ Synchronized prisma/seed.js with unique images.');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
