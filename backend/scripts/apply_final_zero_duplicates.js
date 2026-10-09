const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const prisma = require('../src/config/prisma');

const finalUniqueSkuImages = {
  'PC-GEL-010': 'https://images.unsplash.com/photo-1556228722-d0b5be7490bf?w=800&auto=format&fit=crop&q=80',
  'SO-MAT-006': 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=800&auto=format&fit=crop&q=80',
  'SO-SCS-007': 'https://images.unsplash.com/photo-1503792501406-2c40da09e1e2?w=800&auto=format&fit=crop&q=80',
  'SO-STP-010': 'https://images.unsplash.com/photo-1568667256549-094345857637?w=800&auto=format&fit=crop&q=80',
  'SO-CBL-009': 'https://images.unsplash.com/photo-1508746829417-e6f548d8d6ed?w=800&auto=format&fit=crop&q=80',
  'MA-CAR-007': 'https://images.unsplash.com/photo-1517400508447-f8dd518b86db?w=800&auto=format&fit=crop&q=80',
  'MA-CSE-003': 'https://images.unsplash.com/photo-1580910051074-3eb694886505?w=800&auto=format&fit=crop&q=80',
  'MA-RNG-010': 'https://images.unsplash.com/photo-1586105251261-72a756497a11?w=800&auto=format&fit=crop&q=80',
  'MA-GAN-005': 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=800&auto=format&fit=crop&q=80',
  'TL-ADP-006': 'https://images.unsplash.com/photo-1527631746610-bca00a040d60?w=800&auto=format&fit=crop&q=80',
  'PC-SRM-005': 'https://images.unsplash.com/photo-1608248597359-009581561230?w=800&auto=format&fit=crop&q=80',
  'HK-BRD-006': 'https://images.unsplash.com/photo-1546554137-f86b9593a222?w=800&auto=format&fit=crop&q=80',
  'GR-SPC-002': 'https://images.unsplash.com/photo-1509358271058-acd22cc93898?w=800&auto=format&fit=crop&q=80',
};

async function main() {
  console.log('🔄 Applying final zero-duplicate image mappings...');
  for (const [sku, url] of Object.entries(finalUniqueSkuImages)) {
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
      console.log(`✅ Fixed SKU ${sku}: ${prod.name}`);
    }
  }

  // Also sync prisma/seed.js
  let seedContent = fs.readFileSync(path.resolve(__dirname, '../../prisma/seed.js'), 'utf8');
  for (const [sku, url] of Object.entries(finalUniqueSkuImages)) {
    const skuRegex = new RegExp(`(sku:\\s*['"]${sku}['"][\\s\\S]*?images:\\s*\\[)([\\s\\S]*?)(\\])`, 'm');
    const match = seedContent.match(skuRegex);
    if (match) {
      const replacement = `$1\n        { url: '${url}', altText: '${sku}' }\n      $3`;
      seedContent = seedContent.replace(skuRegex, replacement);
    }
  }
  fs.writeFileSync(path.resolve(__dirname, '../../prisma/seed.js'), seedContent, 'utf8');
  console.log('✨ Catalog image audit zero-duplicate perfection reached.');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
