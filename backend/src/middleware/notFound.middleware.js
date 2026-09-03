const { sendError } = require('../utils/response');

/**
 * 404 Not Found Middleware for unhandled endpoints
 */
const notFoundHandler = (req, res, next) => {
  return sendError(res, `Route not found: ${req.method} ${req.originalUrl}`, 404);
};

module.exports = notFoundHandler;
