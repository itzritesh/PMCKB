const express = require('express');
const router = express.Router();
const MeetingController = require('../controllers/meeting.controller');
const { authenticateJwt } = require('../middleware/auth.middleware');

// All meeting routes require authentication
router.use(authenticateJwt);

// Meeting CRUD
router.post('/', MeetingController.createMeeting);
router.get('/', MeetingController.getMeetings);
router.get('/:id', MeetingController.getMeetingById);
router.put('/:id', MeetingController.updateMeeting);
router.delete('/:id', MeetingController.deleteMeeting);

// Meeting Attendees
router.post('/:meetingId/attendees', MeetingController.addAttendee);
router.get('/:meetingId/attendees', MeetingController.getAttendees);
router.put('/:meetingId/attendees/:userId', MeetingController.updateAttendeeResponse);
router.delete('/:meetingId/attendees/:userId', MeetingController.removeAttendee);

// Meeting Minutes
router.post('/:meetingId/minutes', MeetingController.createMinutes);
router.get('/:meetingId/minutes', MeetingController.getMinutes);
router.put('/:meetingId/minutes', MeetingController.updateMinutes);
router.delete('/:meetingId/minutes', MeetingController.deleteMinutes);

module.exports = router;
