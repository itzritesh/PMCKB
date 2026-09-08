const express = require('express');
const router = express.Router();
const InvitationController = require('../controllers/invitation.controller');
const { authenticateJwt } = require('../middleware/auth.middleware');

// Public/preview invitation details
router.get('/:token', InvitationController.getInvitationByToken);

// User Pending Invitations list
router.get('/', authenticateJwt, InvitationController.getUserInvitations);

// Accept and Reject actions (require user authentication)
router.post('/:token/accept', authenticateJwt, InvitationController.acceptInvitation);
router.post('/:token/reject', authenticateJwt, InvitationController.rejectInvitation);

module.exports = router;
