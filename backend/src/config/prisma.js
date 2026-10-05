const { PrismaClient } = require('@prisma/client');
const config = require('./index');

let rawUrl = config.databaseUrl || process.env.DATABASE_URL || '';
// Ensure direct host without -pooler is used for fast, reliable Neon PostgreSQL connections
let cleanDbUrl = rawUrl.replace('-pooler', '');
if (cleanDbUrl) {
  if (!cleanDbUrl.includes('connect_timeout')) {
    cleanDbUrl += (cleanDbUrl.includes('?') ? '&' : '?') + 'connect_timeout=30';
  }
  if (!cleanDbUrl.includes('pool_timeout')) {
    cleanDbUrl += (cleanDbUrl.includes('?') ? '&' : '?') + 'pool_timeout=30';
  }
}

let prisma;

if (config.isProduction) {
  prisma = new PrismaClient({
    datasources: {
      db: {
        url: cleanDbUrl,
      },
    },
  });
} else {
  if (!global.__prisma) {
    global.__prisma = new PrismaClient({
      datasources: {
        db: {
          url: cleanDbUrl,
        },
      },
      log: ['warn', 'error'],
    });
  }
  prisma = global.__prisma;
}

module.exports = prisma;
