const express = require('express');
const router = express.Router();
const { authenticateJwt } = require('../middleware/auth.middleware');
const { sendSuccess } = require('../utils/response');

/**
 * Protected test endpoint
 * GET /api/protected/test
 */
router.get('/test', authenticateJwt, (req, res) => {
  return sendSuccess(
    res,
    {
      message: 'Access granted to protected resource.',
      authenticatedUser: req.user,
      serverTime: new Date().toISOString(),
    },
    'Protected endpoint authorized'
  );
});

module.exports = router;
