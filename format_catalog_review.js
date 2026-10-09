const fs = require('fs');
const products = JSON.parse(fs.readFileSync('current_db_products.json', 'utf8'));

let output = '';
let currentCat = '';

for (const p of products) {
  if (p.category !== currentCat) {
    currentCat = p.category;
    output += `\n======================================================\n`;
    output += `CATEGORY: ${currentCat}\n`;
    output += `======================================================\n\n`;
  }
  output += `SKU: ${p.sku}\n`;
  output += `NAME: ${p.name}\n`;
  output += `IMAGE: ${p.image}\n`;
  output += `DESCRIPTION: ${p.description}\n`;
  output += `------------------------------------------------------\n`;
}

fs.writeFileSync('full_catalog_review.txt', output);
console.log('Written full_catalog_review.txt');
