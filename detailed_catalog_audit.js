const prisma = require('./backend/src/config/prisma');
const fs = require('fs');

async function checkCatalog() {
  const prods = await prisma.product.findMany({
    include: { category: true, images: true },
    orderBy: [{ category: { name: 'asc' } }, { sku: 'asc' }]
  });

  let output = `TOTAL PRODUCTS: ${prods.length}\n\n`;

  const byCat = {};
  for (const p of prods) {
    if (!byCat[p.category.name]) byCat[p.category.name] = [];
    byCat[p.category.name].push(p);
  }

  for (const [cat, items] of Object.entries(byCat)) {
    output += `=======================================================\n`;
    output += `CATEGORY: ${cat} (${items.length} items)\n`;
    output += `=======================================================\n`;
    for (const item of items) {
      output += `[${item.sku}] "${item.name}"\n`;
      output += `  Img: ${item.images[0]?.url || 'NONE'}\n`;
      output += `  Desc: ${item.description.slice(0, 120)}...\n\n`;
    }
  }

  fs.writeFileSync('catalog_full_dump.txt', output, 'utf8');
  console.log('Saved catalog_full_dump.txt');

  await prisma.$disconnect();
}

checkCatalog();
