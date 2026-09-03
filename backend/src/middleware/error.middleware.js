const env = require('../config/env');
const { sendError } = require('../utils/response');

/**
 * Centralized Application Error Handling Middleware
 */
const errorHandler = (err, req, res, next) => {
  console.error(`[Error] ${req.method} ${req.url}:`, err.stack || err.message);

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  const errors = env.NODE_ENV === 'development' ? { stack: err.stack } : null;

  return sendError(res, message, statusCode, errors);
};

module.exports = errorHandler;
