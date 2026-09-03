const jwt = require('jsonwebtoken');
const env = require('../config/env');

/**
 * Generate a JWT token for a given user payload
 * @param {object} payload
 * @param {string} [expiresIn]
 * @returns {string}
 */
const generateToken = (payload, expiresIn = env.JWT_EXPIRES_IN) => {
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn });
};

/**
 * Verify and decode a JWT token
 * @param {string} token
 * @returns {object} Decoded payload
 */
const verifyToken = (token) => {
  return jwt.verify(token, env.JWT_SECRET);
};

module.exports = {
  generateToken,
  verifyToken,
};
