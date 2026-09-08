const express = require('express');
const router = express.Router();
const AnnouncementController = require('../controllers/announcement.controller');
const { authenticateJwt } = require('../middleware/auth.middleware');
const {
  verifyTeamAccess,
  requireLeader,
  verifyResourceTeamAccess,
} = require('../middleware/team.middleware');

router.use(authenticateJwt);

router.get('/', verifyTeamAccess, AnnouncementController.getAnnouncements);
router.post('/', verifyTeamAccess, requireLeader, AnnouncementController.createAnnouncement);

router.get(
  '/:id',
  verifyResourceTeamAccess('announcements', 'id', { resourceName: 'Announcement' }),
  AnnouncementController.getAnnouncementById
);

router.put(
  '/:id',
  verifyResourceTeamAccess('announcements', 'id', {
    resourceName: 'Announcement',
    requireLeader: true,
  }),
  AnnouncementController.updateAnnouncement
);

router.delete(
  '/:id',
  verifyResourceTeamAccess('announcements', 'id', {
    resourceName: 'Announcement',
    requireLeader: true,
  }),
  AnnouncementController.deleteAnnouncement
);

module.exports = router;
