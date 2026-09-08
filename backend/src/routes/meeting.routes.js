const express = require('express');
const router = express.Router();
const MeetingController = require('../controllers/meeting.controller');
const { authenticateJwt } = require('../middleware/auth.middleware');
const {
  verifyTeamAccess,
  verifyResourceTeamAccess,
} = require('../middleware/team.middleware');

// All meeting routes require authentication
router.use(authenticateJwt);

// Meeting CRUD
router.post('/', verifyTeamAccess, MeetingController.createMeeting);
router.get('/', verifyTeamAccess, MeetingController.getMeetings);

router.get(
  '/:id',
  verifyResourceTeamAccess('meetings', 'id', { resourceName: 'Meeting' }),
  MeetingController.getMeetingById
);

router.put(
  '/:id',
  verifyResourceTeamAccess('meetings', 'id', { resourceName: 'Meeting' }),
  MeetingController.updateMeeting
);

router.delete(
  '/:id',
  verifyResourceTeamAccess('meetings', 'id', { resourceName: 'Meeting' }),
  MeetingController.deleteMeeting
);

// Meeting Attendees
router.post(
  '/:meetingId/attendees',
  verifyResourceTeamAccess('meetings', 'meetingId', { resourceName: 'Meeting' }),
  MeetingController.addAttendee
);

router.get(
  '/:meetingId/attendees',
  verifyResourceTeamAccess('meetings', 'meetingId', { resourceName: 'Meeting' }),
  MeetingController.getAttendees
);

router.put(
  '/:meetingId/attendees/:userId',
  verifyResourceTeamAccess('meetings', 'meetingId', { resourceName: 'Meeting' }),
  MeetingController.updateAttendeeResponse
);

router.delete(
  '/:meetingId/attendees/:userId',
  verifyResourceTeamAccess('meetings', 'meetingId', { resourceName: 'Meeting' }),
  MeetingController.removeAttendee
);

// Meeting Minutes
router.post(
  '/:meetingId/minutes',
  verifyResourceTeamAccess('meetings', 'meetingId', { resourceName: 'Meeting' }),
  MeetingController.createMinutes
);

router.get(
  '/:meetingId/minutes',
  verifyResourceTeamAccess('meetings', 'meetingId', { resourceName: 'Meeting' }),
  MeetingController.getMinutes
);

router.put(
  '/:meetingId/minutes',
  verifyResourceTeamAccess('meetings', 'meetingId', { resourceName: 'Meeting' }),
  MeetingController.updateMinutes
);

router.delete(
  '/:meetingId/minutes',
  verifyResourceTeamAccess('meetings', 'meetingId', { resourceName: 'Meeting' }),
  MeetingController.deleteMinutes
);

module.exports = router;
