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
    return sendError(res, 'Invalid or expired authentication token.', 401);
  }
};

module.exports = {
  authenticateJwt,
};
