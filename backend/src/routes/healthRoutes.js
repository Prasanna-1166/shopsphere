const express = require('express');
const router = express.Router();
const prisma = require('../config/prisma');
const config = require('../config');

router.get('/', async (req, res) => {
  let dbStatus = 'disconnected';
  let dbLatencyMs = null;

  try {
    const start = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    dbLatencyMs = Date.now() - start;
    dbStatus = 'connected';
  } catch (err) {
    dbStatus = 'error';
  }

  const isHealthy = dbStatus === 'connected';

  return res.status(isHealthy ? 200 : 503).json({
    success: isHealthy,
    message: isHealthy ? 'ShopSphere API is operating normally' : 'Degraded API service',
    data: {
      status: isHealthy ? 'healthy' : 'degraded',
      environment: config.env,
      timestamp: new Date().toISOString(),
      database: {
        status: dbStatus,
        latencyMs: dbLatencyMs,
      },
      uptimeSeconds: Math.floor(process.uptime()),
    },
  });
});

module.exports = router;
