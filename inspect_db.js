require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

const prisma = new PrismaClient();

async function main() {
  const products = await prisma.product.findMany({
    include: { category: true, images: true },
    orderBy: [{ category: { name: 'asc' } }, { name: 'asc' }]
  });
  console.log('Total products in DB:', products.length);
  const result = products.map(p => {
    const primaryImg = p.images.find(i => i.isPrimary) || p.images[0];
    return {
      sku: p.sku,
      category: p.category.name,
      name: p.name,
      image: primaryImg ? primaryImg.url : 'NO_IMAGE',
      description: p.description
    };
  });
  fs.writeFileSync('current_db_products.json', JSON.stringify(result, null, 2));
  console.log('Written to current_db_products.json');
}

main().catch(console.error).finally(() => prisma.$disconnect());
