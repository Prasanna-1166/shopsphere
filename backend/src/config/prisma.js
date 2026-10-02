const { PrismaClient } = require('@prisma/client');
const config = require('./index');

let prisma;

if (config.isProduction) {
  prisma = new PrismaClient();
} else {
  if (!global.__prisma) {
    global.__prisma = new PrismaClient({
      log: ['warn', 'error'],
    });
  }
  prisma = global.__prisma;
}

module.exports = prisma;
