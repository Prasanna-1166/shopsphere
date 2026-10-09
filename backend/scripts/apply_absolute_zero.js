const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const prisma = require('../src/config/prisma');

const absoluteZeroFixes = {
  'GR-SPC-003': 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=800&auto=format&fit=crop&q=80',
  'SO-MAT-006': 'https://images.unsplash.com/photo-1593062096033-9a26b09da705?w=800&auto=format&fit=crop&q=80',
};

async function main() {
  for (const [sku, url] of Object.entries(absoluteZeroFixes)) {
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
      console.log(`✅ 100% Unique: ${sku}`);
    }
  }

  let seedContent = fs.readFileSync(path.resolve(__dirname, '../../prisma/seed.js'), 'utf8');
  for (const [sku, url] of Object.entries(absoluteZeroFixes)) {
    const skuRegex = new RegExp(`(sku:\\s*['"]${sku}['"][\\s\\S]*?images:\\s*\\[)([\\s\\S]*?)(\\])`, 'm');
    const match = seedContent.match(skuRegex);
    if (match) {
      const replacement = `$1\n        { url: '${url}', altText: '${sku}' }\n      $3`;
      seedContent = seedContent.replace(skuRegex, replacement);
    }
  }
  fs.writeFileSync(path.resolve(__dirname, '../../prisma/seed.js'), seedContent, 'utf8');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
