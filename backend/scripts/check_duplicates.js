const prisma = require('../src/config/prisma');

async function check() {
  const products = await prisma.product.findMany({
    include: { images: true, category: true }
  });
  const urlMap = {};
  const dups = [];
  for (const p of products) {
    for (const img of p.images) {
      if (urlMap[img.url]) {
        dups.push({
          url: img.url,
          prod1: urlMap[img.url].name,
          sku1: urlMap[img.url].sku,
          cat1: urlMap[img.url].category.name,
          prod2: p.name,
          sku2: p.sku,
          cat2: p.category.name
        });
      } else {
        urlMap[img.url] = p;
      }
    }
  }
  console.log(`Total duplicate image URLs found: ${dups.length}`);
  for (const d of dups) {
    console.log(`- ${d.sku1} (${d.cat1}) vs ${d.sku2} (${d.cat2})\n  URL: ${d.url}\n  P1: ${d.prod1}\n  P2: ${d.prod2}\n`);
  }
}

check()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
