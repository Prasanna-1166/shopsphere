const prisma = require('./src/config/prisma');

async function clean() {
  try {
    await prisma.cartItem.deleteMany({ where: { cart: { user: { role: 'CUSTOMER' } } } });
    await prisma.cart.deleteMany({ where: { user: { role: 'CUSTOMER' } } });
    await prisma.address.deleteMany({ where: { user: { role: 'CUSTOMER' } } });
    await prisma.user.deleteMany({ where: { role: 'CUSTOMER' } });
    const remaining = await prisma.user.findMany({ select: { id: true, name: true, email: true, role: true } });
    console.log('✅ Clean complete. Remaining users in DB (Admins only):', remaining);
  } catch (err) {
    console.error('Error cleaning:', err);
  } finally {
    await prisma.$disconnect();
  }
}

clean();
