const express = require('express');
const router = express.Router();
const TeamController = require('../controllers/team.controller');
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

module.exports = router;
