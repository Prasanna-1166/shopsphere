const app = require('./app');
const config = require('./config');
const prisma = require('./config/prisma');

const PORT = config.port;
const HOST = '0.0.0.0';

const server = app.listen(PORT, HOST, async () => {
  console.log(`
  🚀 ==========================================
     ShopSphere API Server Running!
     URL:         http://${HOST}:${PORT}
     Environment: ${config.env}
     Database:    Neon PostgreSQL (via Prisma)
     Healthcheck: http://${HOST}:${PORT}/api/health
  ==========================================
  `);

  try {
    await prisma.$connect();
    console.log('  🗄️  Database connection established successfully.');
  } catch (err) {
    console.error('  ⚠️  Warning: Initial database connection failed:', err.message);
  }
});

// Graceful shutdown handling
const gracefulShutdown = async (signal) => {
  console.log(`\n🛑 Received ${signal}. Shutting down ShopSphere API gracefully...`);
  server.close(async () => {
    try {
      await prisma.$disconnect();
      console.log('🔌 Database connection closed.');
    } catch (err) {
      console.error('Error disconnecting database:', err);
    }
    process.exit(0);
  });
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
