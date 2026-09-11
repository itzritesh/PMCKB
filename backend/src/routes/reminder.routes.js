const express = require('express');
const router = express.Router();
const ReminderController = require('../controllers/reminder.controller');
const { authenticateJwt } = require('../middleware/auth.middleware');
const { verifyOptionalTeamAccess } = require('../middleware/team.middleware');

// All reminder endpoints require authentication
router.use(authenticateJwt);

// Reminder collection routes
router.post('/', ReminderController.create);
router.get('/', verifyOptionalTeamAccess, ReminderController.list);

// Single reminder routes
router.get('/:id', ReminderController.getById);
router.put('/:id', ReminderController.update);
router.delete('/:id', ReminderController.delete);

// Reminder action routes
router.post('/:id/dismiss', ReminderController.dismiss);
router.post('/:id/cancel', ReminderController.cancel);

module.exports = router;
