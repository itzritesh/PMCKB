const express = require('express');
const router = express.Router();
const CalendarController = require('../controllers/calendar.controller');
const { authenticateJwt } = require('../middleware/auth.middleware');

// All calendar event routes require authentication
router.use(authenticateJwt);

router.post('/events', CalendarController.createEvent);
router.get('/events', CalendarController.getEvents);
router.get('/events/:id', CalendarController.getEventById);
router.put('/events/:id', CalendarController.updateEvent);
router.delete('/events/:id', CalendarController.deleteEvent);

module.exports = router;
