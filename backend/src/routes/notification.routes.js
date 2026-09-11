const express = require('express');
const router = express.Router();
const NotificationController = require('../controllers/notification.controller');
const { authenticateJwt } = require('../middleware/auth.middleware');
const { verifyOptionalTeamAccess } = require('../middleware/team.middleware');

// All notification endpoints require authentication
router.use(authenticateJwt);

// Notification listing and batch read
router.get('/', verifyOptionalTeamAccess, NotificationController.list);
router.patch('/read-all', verifyOptionalTeamAccess, NotificationController.markAllRead);

// Single notification operations
router.patch('/:id/read', NotificationController.markRead);
router.delete('/:id', NotificationController.delete);

module.exports = router;
