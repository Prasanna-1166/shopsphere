const fs = require('fs');
const products = JSON.parse(fs.readFileSync('current_db_products.json', 'utf8'));
products.slice(0, 68).forEach((p, idx) => {
  console.log(`#${idx+1} [${p.sku}] (${p.category}) -> ${p.name}`);
  console.log(`    IMG: ${p.image}`);
});
