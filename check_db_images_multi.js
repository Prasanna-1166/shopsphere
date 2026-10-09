require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const products = await prisma.product.findMany({
    include: { images: true }
  });
  let multi = 0;
  for (const p of products) {
    if (p.images.length !== 1) {
      multi++;
      console.log(p.sku + ' has ' + p.images.length + ' images:');
      p.images.forEach(i => console.log('   - id: ' + i.id + ' | isPrimary: ' + i.isPrimary + ' | ' + i.url));
    }
  }
  console.log('Total products with != 1 images:', multi);
}

main().catch(console.error).finally(() => prisma.$disconnect());
