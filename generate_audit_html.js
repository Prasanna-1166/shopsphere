const fs = require('fs');
const products = JSON.parse(fs.readFileSync('current_db_products.json', 'utf8'));

let html = `<!DOCTYPE html>
<html>
<head>
  <meta charset='utf-8'/>
  <title>ShopSphere 106 Products Audit</title>
  <style>
    body { font-family: system-ui, sans-serif; background: #0f172a; color: #f8fafc; margin: 0; padding: 20px; }
    h1 { text-align: center; color: #38bdf8; }
    .category-section { margin-bottom: 40px; }
    .category-title { font-size: 22px; font-weight: bold; border-bottom: 2px solid #334155; padding-bottom: 8px; margin-bottom: 20px; color: #a5f3fc; }
    .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 20px; }
    .card { background: #1e293b; border-radius: 12px; overflow: hidden; border: 1px solid #334155; display: flex; flex-direction: column; }
    .card img { width: 100%; height: 200px; object-fit: cover; background: #0f172a; }
    .card-content { padding: 14px; flex-grow: 1; display: flex; flex-direction: column; justify-content: space-between; }
    .sku { font-size: 11px; color: #94a3b8; font-family: monospace; font-weight: bold; }
    .name { font-size: 14px; font-weight: 600; margin: 6px 0 8px 0; color: #f1f5f9; }
    .desc { font-size: 12px; color: #cbd5e1; margin-bottom: 8px; line-height: 1.4; }
    .url { font-size: 10px; color: #64748b; word-break: break-all; }
  </style>
</head>
<body>
  <h1>ShopSphere - Complete 106 Products Visual Catalog Audit</h1>
`;

const byCat = {};
for (const p of products) {
  if (!byCat[p.category]) byCat[p.category] = [];
  byCat[p.category].push(p);
}

for (const cat in byCat) {
  html += `<div class='category-section'><div class='category-title'>${cat} (${byCat[cat].length} products)</div><div class='grid'>`;
  for (const p of byCat[cat]) {
    html += `
      <div class='card'>
        <img src='${p.image}' alt='${p.name}' loading='lazy'/>
        <div class='card-content'>
          <div>
            <div class='sku'>${p.sku}</div>
            <div class='name'>${p.name}</div>
            <div class='desc'>${p.description ? p.description.slice(0, 100) : ''}...</div>
          </div>
          <div class='url'>${p.image}</div>
        </div>
      </div>
    `;
  }
  html += `</div></div>`;
}

html += `</body></html>`;
fs.writeFileSync('catalog_visual_audit.html', html);
console.log('Written catalog_visual_audit.html');
