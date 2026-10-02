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
const allowedOrigins = [
  config.cors.customerOrigin,
  config.cors.adminOrigin,
  'http://localhost:5173',
  'http://localhost:5174',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5174',
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. mobile apps, curl, server-to-server)
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error(`CORS policy blocked access from origin: ${origin}`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token', 'x-csrf-token', 'x-xsrf-token'],
    exposedHeaders: ['Set-Cookie'],
  })
);

// 3. Body & Cookie Parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser(config.cookieSecret));

// 4. Request Logging
if (config.env !== 'test') {
  app.use(morgan(config.isProduction ? 'combined' : 'dev'));
}

// 5. CSRF Cookie generation & Verification
app.use(setCsrfCookie);
app.use(verifyCsrfToken);

// 6. Global API Rate Limiter
app.use('/api', apiLimiter);

// 7. Mount Application API Routes
app.use('/api', routes);

// 8. 404 Route Handler
app.use('/api/*', (req, res) => {
  return sendError(res, `API route not found: ${req.method} ${req.originalUrl}`, [], 404);
});

// 9. Root Welcome Route
app.get('/', (req, res) => {
  res.json({
    name: 'ShopSphere API',
    status: 'online',
    documentation: '/docs/api.md',
    healthCheck: '/api/health',
  });
});

// 10. Centralized Error Handling Middleware
app.use(errorHandler);

module.exports = app;
