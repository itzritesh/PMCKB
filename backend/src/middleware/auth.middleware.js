const { verifyToken } = require('../utils/jwt');
const { sendError } = require('../utils/response');

/**
 * Authentication middleware to verify JWT in Authorization Bearer header
 */
const authenticateJwt = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return sendError(res, 'Access denied. No authentication token provided.', 401);
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = verifyToken(token);
    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return sendError(res, 'Authentication token has expired. Please log in again.', 401);
    }
    return sendError(res, 'Invalid authentication token.', 401);
  }
};

module.exports = {
  authenticateJwt,
  authenticateUser: authenticateJwt,
};
