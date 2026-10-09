const fs = require('fs');

const updateNeonScript = fs.readFileSync('update_neon_images.js', 'utf8');
const mappingMatch = updateNeonScript.match(/const catalogImages = ({[\s\S]*?});/);

if (!mappingMatch) {
  console.error('Could not find catalogImages in update_neon_images.js');
  process.exit(1);
}

const catalogImages = eval('(' + mappingMatch[1] + ')');
let seedContent = fs.readFileSync('prisma/seed.js', 'utf8');

let replaceCount = 0;
for (const [sku, url] of Object.entries(catalogImages)) {
  // Look for the product block with this SKU in prisma/seed.js and update its images url
  const regex = new RegExp(`(sku:\\s*['"]${sku}['"][\\s\\S]*?images:\\s*\\[\\s*{\\s*url:\\s*['"])([^'"]+)(['"])`, 'g');
  if (regex.test(seedContent)) {
    seedContent = seedContent.replace(regex, `$1${url}$3`);
    replaceCount++;
  }
}

fs.writeFileSync('prisma/seed.js', seedContent);
console.log(`Updated prisma/seed.js with ${replaceCount} verified image URLs!`);
