require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const cats = await prisma.category.findMany();
  console.log(cats.map(c => ({ id: c.id, name: c.name, slug: c.slug })));
}
main().finally(() => prisma.$disconnect());
