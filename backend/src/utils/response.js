/**
 * Standardized API Response Utilities
 */

/**
 * Send a standardized success JSON response
 * @param {import('express').Response} res
 * @param {any} data
 * @param {string} [message='Success']
 * @param {number} [statusCode=200]
 */
const sendSuccess = (res, data = null, message = 'Success', statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};

/**
 * Send a standardized error JSON response
 * @param {import('express').Response} res
 * @param {string} [message='An error occurred']
 * @param {number} [statusCode=500]
 * @param {any} [errors=null]
 */
const sendError = (res, message = 'An error occurred', statusCode = 500, errors = null) => {
  const payload = {
    success: false,
    message,
  };
  if (errors) {
    payload.errors = errors;
  }
  return res.status(statusCode).json(payload);
};

module.exports = {
  sendSuccess,
  sendError,
};
