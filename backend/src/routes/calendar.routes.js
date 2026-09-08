const express = require('express');
const router = express.Router();
const CalendarController = require('../controllers/calendar.controller');
const { authenticateJwt } = require('../middleware/auth.middleware');
const { verifyTeamAccess, verifyResourceTeamAccess } = require('../middleware/team.middleware');

// All calendar event routes require authentication & team context
router.use(authenticateJwt);
router.use(verifyTeamAccess);

router.post('/events', CalendarController.createEvent);
router.get('/events', CalendarController.getEvents);
router.get('/events/:id', verifyResourceTeamAccess('calendar_events', 'id'), CalendarController.getEventById);
router.put('/events/:id', verifyResourceTeamAccess('calendar_events', 'id'), CalendarController.updateEvent);
router.delete('/events/:id', verifyResourceTeamAccess('calendar_events', 'id'), CalendarController.deleteEvent);

module.exports = router;
