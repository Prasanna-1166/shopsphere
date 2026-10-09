const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const prisma = require('../src/config/prisma');

// Mapping of specific SKU fixes to distinct, high-quality, verified images
const specificSkuImages = {
  // Grocery
  'GR-OIL-003': 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=800&auto=format&fit=crop&q=80', // Sunflower oil
  'GR-TP-001': 'https://images.unsplash.com/photo-1559599101-f09722fb4948?w=800&auto=format&fit=crop&q=80', // Colgate toothpaste

  // Home & Kitchen
  'HK-CON-001': 'https://images.unsplash.com/photo-1584992236310-6edddc08acff?w=800&auto=format&fit=crop&q=80', // Airtight food containers
  'HK-SPC-001': 'https://images.unsplash.com/photo-1532336414038-cf19250c5757?w=800&auto=format&fit=crop&q=80', // Spice rack organiser
  'HK-TWL-001': 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&auto=format&fit=crop&q=80', // Cotton kitchen towels

  // Personal Care (assign dedicated unique images)
  'PC-FCL-001': 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=800&auto=format&fit=crop&q=80', // Tea tree face wash
  'PC-BOIL-004': 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=800&auto=format&fit=crop&q=80', // Jasmine body massage oil
  'PC-DRY-002': 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800&auto=format&fit=crop&q=80', // Hair dryer

  // Electronics & Audio
  'EA-HUB-005': 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=800&auto=format&fit=crop&q=80', // 7-in-1 USB hub
  'EA-CAB-006': 'https://images.unsplash.com/photo-1558655146-d09347e92766?w=800&auto=format&fit=crop&q=80', // HDMI cable

  // Mobile Accessories
  'MA-CAB-001': 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=800&auto=format&fit=crop&q=80', // Type-C braided cable

  // Fashion & Apparel
  'FA-BAG-001': 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&auto=format&fit=crop&q=80', // Commuter backpack
  'FA-WAL-002': 'https://images.unsplash.com/photo-1627123424574-724758594e93?w=800&auto=format&fit=crop&q=80', // Leather wallet

  // Travel & Lifestyle
  'TL-ADP-001': 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=800&auto=format&fit=crop&q=80', // Travel adapter
  'TL-DUF-002': 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=800&auto=format&fit=crop&q=80', // Travel duffle
  'TL-CUB-003': 'https://images.unsplash.com/photo-1565084888279-aca607ecce0c?w=800&auto=format&fit=crop&q=80', // Packing cubes

  // Stationery
  'SO-JRN-001': 'https://images.unsplash.com/photo-1589829085413-56de8ae18c73?w=800&auto=format&fit=crop&q=80', // Executive journal
  'SO-PEN-002': 'https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?w=800&auto=format&fit=crop&q=80', // Gel pen set
  'SO-LMP-004': 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=800&auto=format&fit=crop&q=80', // Desk lamp
};

async function main() {
  console.log('🔄 Updating database products with unique verified images...');

  for (const [sku, url] of Object.entries(specificSkuImages)) {
    const product = await prisma.product.findUnique({ where: { sku } });
    if (product) {
      await prisma.productImage.deleteMany({ where: { productId: product.id } });
      await prisma.productImage.create({
        data: {
          productId: product.id,
          url,
          altText: product.name,
          sortOrder: 0,
        },
      });
      console.log(`✅ Updated ${sku}: ${product.name}`);
    }
  }

  console.log('✨ Database image update complete.');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
