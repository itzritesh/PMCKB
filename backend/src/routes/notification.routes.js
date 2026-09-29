const express = require('express');
const router = express.Router();
const NotificationController = require('../controllers/notification.controller');
const { authenticateJwt } = require('../middleware/auth.middleware');
const { verifyOptionalTeamAccess } = require('../middleware/team.middleware');

// All notification endpoints require authentication
router.use(authenticateJwt);

// Web Push VAPID and Subscription management
router.get('/push/vapid-public-key', NotificationController.getVapidPublicKey);
router.post('/push/subscribe', NotificationController.subscribePush);
router.post('/push/unsubscribe', NotificationController.unsubscribePush);
router.get('/push/status', NotificationController.getPushStatus);

// Notification listing and batch read
router.get('/', verifyOptionalTeamAccess, NotificationController.list);
router.patch('/read-all', verifyOptionalTeamAccess, NotificationController.markAllRead);

// Dev test endpoints
router.post('/test', verifyOptionalTeamAccess, NotificationController.sendTestNotification);
router.post('/trigger-reminders', NotificationController.triggerReminderCycle);

// Single notification operations (Lifecycle: read, dismiss, delete)
router.patch('/:id/read', NotificationController.markRead);
router.patch('/:id/dismiss', NotificationController.dismiss);
router.delete('/:id', NotificationController.delete);

module.exports = router;
