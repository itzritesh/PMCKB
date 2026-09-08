const crypto = require('crypto');
const { TeamInvitationModel, TeamMemberModel, UserModel, TeamModel } = require('../models');
const { sendSuccess, sendError } = require('../utils/response');

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const INVITATION_EXPIRY_DAYS = 7;

/**
 * Controller for Team Invitations
 */
const InvitationController = {
  /**
   * Leader invites a user by email to the workspace
   * POST /api/teams/:teamId/invitations
   */
  async createInvitation(req, res, next) {
    try {
      const teamId = req.team ? req.team.id : parseInt(req.params.teamId, 10);
      const { email } = req.body;

      // 1. Validate email
      if (!email || typeof email !== 'string' || !email.trim()) {
        return sendError(res, 'Email address is required.', 400);
      }

      const cleanEmail = email.trim().toLowerCase();
      if (!EMAIL_REGEX.test(cleanEmail)) {
        return sendError(res, 'Please provide a valid email address.', 400);
      }

      // 2. Check if user with this email is already a member of the workspace
      const existingUser = await UserModel.findByEmail(cleanEmail);
      if (existingUser) {
        const existingMember = await TeamMemberModel.findByTeamAndUser(teamId, existingUser.id);
        if (existingMember) {
          return sendError(res, 'User is already a member of this workspace.', 409);
        }
      }

      // 3. Prevent duplicate active pending invitations
      const pendingInvite = await TeamInvitationModel.findPendingByTeamAndEmail(teamId, cleanEmail);
      if (pendingInvite) {
        return sendError(
          res,
          'A pending invitation has already been sent to this email for this workspace.',
          409
        );
      }

      // 4. Generate cryptographically secure token
      const token = crypto.randomBytes(32).toString('hex');

      // 5. Calculate expiration timestamp (7 days)
      const expiresAt = new Date(Date.now() + INVITATION_EXPIRY_DAYS * 24 * 60 * 60 * 1000);

      // 6. Persist invitation
      const invitation = await TeamInvitationModel.create({
        teamId,
        email: cleanEmail,
        invitedBy: req.user.id,
        token,
        expiresAt,
      });

      return sendSuccess(
        res,
        {
          invitation: {
            ...invitation,
            team_name: req.team ? req.team.name : undefined,
          },
          invitationLink: `/invite/${token}`,
        },
        'Invitation created successfully.',
        201
      );
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get pending invitations for the authenticated user
   * GET /api/invitations
   */
  async getUserInvitations(req, res, next) {
    try {
      const userEmail = req.user.email;
      const invitations = await TeamInvitationModel.findAllPendingByUserEmail(userEmail);

      return sendSuccess(
        res,
        {
          invitations,
          total: invitations.length,
        },
        'Pending invitations retrieved successfully.'
      );
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get all invitations issued for a workspace (Leader overview)
   * GET /api/teams/:teamId/invitations
   */
  async getWorkspaceInvitations(req, res, next) {
    try {
      const teamId = req.team ? req.team.id : parseInt(req.params.teamId, 10);
      const invitations = await TeamInvitationModel.findAllByTeam(teamId);

      return sendSuccess(
        res,
        {
          invitations,
          total: invitations.length,
        },
        'Workspace invitations retrieved successfully.'
      );
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get invitation preview metadata by token
   * GET /api/invitations/:token
   */
  async getInvitationByToken(req, res, next) {
    try {
      const { token } = req.params;

      if (!token || typeof token !== 'string') {
        return sendError(res, 'Invalid invitation token.', 400);
      }

      const invitation = await TeamInvitationModel.findByToken(token);
      if (!invitation) {
        return sendError(res, 'Invitation not found or invalid token.', 404);
      }

      // Check if expired
      const isExpired =
        invitation.status === 'expired' || new Date(invitation.expires_at) <= new Date();

      if (isExpired && invitation.status === 'pending') {
        await TeamInvitationModel.updateStatus(invitation.id, 'expired');
        invitation.status = 'expired';
      }

      return sendSuccess(
        res,
        {
          invitation: {
            id: invitation.id,
            team_id: invitation.team_id,
            team_name: invitation.team_name,
            team_description: invitation.team_description,
            invited_by_name: invitation.invited_by_name,
            invited_by_email: invitation.invited_by_email,
            email: invitation.email,
            status: invitation.status,
            expires_at: invitation.expires_at,
            created_at: invitation.created_at,
            isExpired,
          },
        },
        'Invitation details retrieved successfully.'
      );
    } catch (error) {
      next(error);
    }
  },

  /**
   * Accept an invitation and enroll user into the workspace
   * POST /api/invitations/:token/accept
   */
  async acceptInvitation(req, res, next) {
    try {
      const { token } = req.params;

      if (!token || typeof token !== 'string') {
        return sendError(res, 'Invalid invitation token.', 400);
      }

      const invitation = await TeamInvitationModel.findByToken(token);
      if (!invitation) {
        return sendError(res, 'Invitation not found.', 404);
      }

      // 1. Validate status
      if (invitation.status === 'accepted') {
        return sendError(res, 'Invitation has already been accepted.', 400);
      }

      if (invitation.status === 'rejected') {
        return sendError(res, 'Invitation has already been rejected.', 400);
      }

      // 2. Validate expiration
      const now = new Date();
      if (invitation.status === 'expired' || new Date(invitation.expires_at) <= now) {
        if (invitation.status !== 'expired') {
          await TeamInvitationModel.updateStatus(invitation.id, 'expired');
        }
        return sendError(res, 'Invitation has expired.', 400);
      }

      // 3. Validate recipient email matches authenticated user
      if (req.user.email.toLowerCase() !== invitation.email.toLowerCase()) {
        return sendError(
          res,
          'Access denied. This invitation was sent to a different email address.',
          403
        );
      }

      // 4. Check if already a member
      const existingMember = await TeamMemberModel.findByTeamAndUser(invitation.team_id, req.user.id);
      if (existingMember) {
        await TeamInvitationModel.updateStatus(invitation.id, 'accepted');
        return sendSuccess(
          res,
          {
            teamId: invitation.team_id,
            role: existingMember.role,
            teamName: invitation.team_name,
          },
          'You are already a member of this workspace.'
        );
      }

      // 5. Add user to workspace with default role = 'member' (strictly non-leader)
      const membership = await TeamMemberModel.addMember({
        teamId: invitation.team_id,
        userId: req.user.id,
        role: 'member',
      });

      // 6. Update invitation status to accepted
      await TeamInvitationModel.updateStatus(invitation.id, 'accepted');

      return sendSuccess(
        res,
        {
          teamId: invitation.team_id,
          teamName: invitation.team_name,
          role: membership.role,
          joinedAt: membership.joined_at,
        },
        'Invitation accepted successfully. You have joined the workspace.'
      );
    } catch (error) {
      next(error);
    }
  },

  /**
   * Reject an invitation
   * POST /api/invitations/:token/reject
   */
  async rejectInvitation(req, res, next) {
    try {
      const { token } = req.params;

      if (!token || typeof token !== 'string') {
        return sendError(res, 'Invalid invitation token.', 400);
      }

      const invitation = await TeamInvitationModel.findByToken(token);
      if (!invitation) {
        return sendError(res, 'Invitation not found.', 404);
      }

      // 1. Validate status
      if (invitation.status === 'accepted') {
        return sendError(res, 'Invitation has already been accepted.', 400);
      }

      if (invitation.status === 'rejected') {
        return sendError(res, 'Invitation has already been rejected.', 400);
      }

      // 2. Validate recipient email matches authenticated user
      if (req.user.email.toLowerCase() !== invitation.email.toLowerCase()) {
        return sendError(
          res,
          'Access denied. This invitation was sent to a different email address.',
          403
        );
      }

      // 3. Mark as rejected
      await TeamInvitationModel.updateStatus(invitation.id, 'rejected');

      return sendSuccess(
        res,
        {
          id: invitation.id,
          status: 'rejected',
        },
        'Invitation rejected successfully.'
      );
    } catch (error) {
      next(error);
    }
  },
};

module.exports = InvitationController;
