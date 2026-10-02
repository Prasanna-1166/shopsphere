const { sendError } = require('../utils/response');
const config = require('../config');

/**
 * Centralized Express Error Handler
 */
const errorHandler = (err, req, res, next) => {
  // Safe logging in dev / test
  if (config.env !== 'test') {
    console.error('💥 Unhandled Application Error:', {
      message: err.message,
      path: req.originalUrl,
      method: req.method,
      stack: config.isProduction ? undefined : err.stack,
    });
  }

  // 1. Prisma unique constraint violation (P2002)
  if (err.code === 'P2002') {
    const fields = err.meta && err.meta.target ? err.meta.target : ['field'];
    const fieldName = Array.isArray(fields) ? fields.join(', ') : fields;
    return sendError(res, `A record with this ${fieldName} already exists.`, [], 409);
  }

  // 2. Prisma foreign key constraint failure (P2003)
  if (err.code === 'P2003') {
    return sendError(res, 'Operation failed due to related records constraint.', [], 400);
  }

  // 3. Prisma record not found (P2025)
  if (err.code === 'P2025') {
    return sendError(res, 'Requested record was not found.', [], 404);
  }

  // 4. JSON parsing syntax error
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return sendError(res, 'Malformed JSON payload received.', [], 400);
  }

  // 5. Default generic error
  const statusCode = err.statusCode || err.status || 500;
  const message = config.isProduction && statusCode === 500
    ? 'An unexpected error occurred on the server. Please try again later.'
    : err.message || 'Internal Server Error';

  return sendError(res, message, err.errors || [], statusCode);
};

module.exports = errorHandler;
