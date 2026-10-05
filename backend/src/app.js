const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const config = require('./config');
const routes = require('./routes');
const errorHandler = require('./middleware/errorHandler');
const { setCsrfCookie, verifyCsrfToken } = require('./middleware/csrf');
const { apiLimiter } = require('./middleware/rateLimiter');
const { sendError } = require('./utils/response');

const app = express();

// 1. Security Headers
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

// 2. CORS Configuration
const parseOrigins = (val) => {
  if (!val) return [];
  return String(val)
    .split(',')
    .map((u) => u.trim().replace(/\/+$/, ''))
    .filter(Boolean);
};

const rawAllowedOrigins = [
  ...parseOrigins(config.cors.customerOrigin),
  ...parseOrigins(config.cors.adminOrigin),
  ...parseOrigins(config.cors.apiOrigin),
  ...parseOrigins(process.env.ALLOWED_ORIGINS),
  'https://shop.dvlpr.dpdns.org',
  'https://admin.dvlpr.dpdns.org',
  'https://shopsphere-customer-web.onrender.com',
  'https://shopsphere-admin-web.onrender.com',
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5000',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5174',
  'http://127.0.0.1:5000',
].filter(Boolean);

const isOriginAllowed = (origin) => {
  if (!origin) return true; // Mobile apps, curl, server-to-server, Postman
  const clean = origin.trim().replace(/\/+$/, '');
  if (rawAllowedOrigins.includes(clean)) return true;

  // Allow dynamically any *.dpdns.org or *.onrender.com domain
  try {
    const parsed = new URL(clean);
    if (
      parsed.hostname.endsWith('.dpdns.org') ||
      parsed.hostname.endsWith('.onrender.com') ||
      parsed.hostname === 'localhost' ||
      parsed.hostname === '127.0.0.1'
    ) {
      return true;
    }
  } catch (e) {
    // Malformed origin
  }
  return false;
};

const corsOptions = {
  origin: (origin, callback) => {
    if (isOriginAllowed(origin)) {
      return callback(null, true);
    }
    return callback(null, false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token', 'x-csrf-token', 'x-xsrf-token'],
  exposedHeaders: ['Set-Cookie'],
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// 3. Body & Cookie Parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser(config.cookieSecret));

// 4. Request Logging
if (config.env !== 'test') {
  app.use(morgan(config.isProduction ? 'combined' : 'dev'));
}

// 5. Root Welcome & Health Check Routes
app.get('/', (req, res) => {
  res.json({
    name: 'ShopSphere API',
    status: 'online',
    version: '1.0.0',
    documentation: '/docs/api.md',
    healthCheck: '/api/health',
  });
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 6. CSRF Cookie generation & Verification
app.use(setCsrfCookie);
app.use(verifyCsrfToken);

// 7. Global API Rate Limiter
app.use('/api', apiLimiter);

// 8. Mount Application API Routes
app.use('/api', routes);

// 9. 404 Route Handler
app.use('*', (req, res) => {
  return sendError(res, `Route not found: ${req.method} ${req.originalUrl}`, [], 404);
});

// 10. Centralized Error Handling Middleware
app.use(errorHandler);

module.exports = app;
