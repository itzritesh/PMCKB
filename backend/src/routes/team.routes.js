const express = require('express');
const router = express.Router();
const TeamController = require('../controllers/team.controller');
const InvitationController = require('../controllers/invitation.controller');
const AnnouncementController = require('../controllers/announcement.controller');
const { authenticateJwt } = require('../middleware/auth.middleware');
const { requireTeamMember, requireTeamLeader } = require('../middleware/team.middleware');

// All team routes require authentication
router.use(authenticateJwt);

// Team CRUD
router.post('/', TeamController.createTeam);
router.get('/', TeamController.getTeams);
router.get('/:id', requireTeamMember, TeamController.getTeamById);
router.put('/:id', requireTeamLeader, TeamController.updateTeam);
router.delete('/:id', requireTeamLeader, TeamController.deleteTeam);

// Team Members Management
router.get('/:teamId/members', requireTeamMember, TeamController.getTeamMembers);
router.post('/:teamId/members', requireTeamLeader, TeamController.addTeamMember);
router.put('/:teamId/members/:userId', requireTeamLeader, TeamController.updateMemberRole);
router.delete('/:teamId/members/:userId', requireTeamLeader, TeamController.removeTeamMember);

// Team Invitations (Leader only)
router.post('/:teamId/invitations', requireTeamLeader, InvitationController.createInvitation);
router.get('/:teamId/invitations', requireTeamLeader, InvitationController.getWorkspaceInvitations);

// Team Announcements
router.post('/:teamId/announcements', requireTeamLeader, AnnouncementController.createAnnouncement);
router.get('/:teamId/announcements', requireTeamMember, AnnouncementController.getAnnouncements);

module.exports = router;
