const express = require('express');
const router = express.Router();
const UserController = require('../controllers/user.controller');
const { authenticateJwt } = require('../middleware/auth.middleware');

// All user routes require authentication
router.use(authenticateJwt);

router.get('/', UserController.getUsers);

module.exports = router;
