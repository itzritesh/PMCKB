const crypto = require('crypto');
const { TeamInvitationModel, TeamMemberModel, UserModel, TeamModel } = require('../models');
const { sendSuccess, sendError } = require('../utils/response');
const emailService = require('../services/emailService');
const env = require('../config/env');

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const INVITATION_EXPIRY_DAYS = 7;
const MAX_INVITES_PER_HOUR = 20;
const THROTTLE_BURST_MS = 3000;
const RESEND_COOLDOWN_SECONDS = 60;

/**
 * Compute SHA-256 hash of a raw invitation token.
 * Tokens are never stored in plaintext in the database.
 */
function hashToken(rawToken) {
  if (!rawToken || typeof rawToken !== 'string') return '';
  return crypto.createHash('sha256').update(rawToken.trim()).digest('hex');
}

/**
 * Controller for Team Invitations
 * Handles secure invitation generation, token hashing, email dispatch,
 * atomic transitions, and rate-limiting anti-abuse safeguards.
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

      // 2. Verify team exists
      const targetTeam = req.team || (await TeamModel.findById(teamId));
      if (!targetTeam) {
        return sendError(res, 'Workspace not found.', 404);
      }

      // 3. Verify requester is team leader
      if (req.teamMember && req.teamMember.role !== 'leader') {
        return sendError(res, 'Access denied. Team leader permissions required.', 403);
      }

      // 4. Check if user with this email is already a member of the SAME team
      const existingUser = await UserModel.findByEmail(cleanEmail);
      if (existingUser) {
        const existingMember = await TeamMemberModel.findByTeamAndUser(teamId, existingUser.id);
        if (existingMember) {
          return sendError(res, 'This user is already a member of this team.', 409);
        }
      }

      // 5. Prevent duplicate active pending invitations
      const pendingInvite = await TeamInvitationModel.findPendingByTeamAndEmail(teamId, cleanEmail);
      if (pendingInvite) {
        return sendError(
          res,
          'An invitation is already pending for this email.',
          409
        );
      }

      // 6. Anti-abuse / rate limiting safeguards
      const recentCount = await TeamInvitationModel.countRecentByInviter(req.user.id, 60);
      if (recentCount >= MAX_INVITES_PER_HOUR) {
        return sendError(
          res,
          `Invitation limit reached. You may send up to ${MAX_INVITES_PER_HOUR} invitations per hour.`,
          429
        );
      }

      const latestCreated = await TeamInvitationModel.getLatestCreatedAtByInviter(req.user.id);
      if (latestCreated && Date.now() - latestCreated.getTime() < THROTTLE_BURST_MS) {
        return sendError(res, 'Please wait a moment before sending another invitation.', 429);
      }

      // 7. Generate cryptographically secure token & hash it
      const rawToken = crypto.randomBytes(32).toString('hex');
      const tokenHash = hashToken(rawToken);

      // 8. Calculate expiration timestamp (7 days)
      const expiresAt = new Date(Date.now() + INVITATION_EXPIRY_DAYS * 24 * 60 * 60 * 1000);

      const initialEmailStatus = emailService.isConfigured() ? 'pending' : 'unconfigured';

      // 9. Persist invitation (saving tokenHash ONLY)
      const invitation = await TeamInvitationModel.create({
        teamId,
        email: cleanEmail,
        invitedBy: req.user.id,
        tokenHash,
        expiresAt,
        emailStatus: initialEmailStatus,
      });

      // 10. Generate validated invitation URL (HTTPS strictly enforced in production)
      const baseUrl = env.getInvitationBaseUrl();
      const invitationUrl = `${baseUrl}/invitations/accept/${rawToken}`;

      // 11. Dispatch real email via emailService
      let emailSent = false;
      let emailError = null;

      if (emailService.isConfigured()) {
        const sendResult = await emailService.sendTeamInvitationEmail({
          to: cleanEmail,
          inviterName: req.user.name,
          teamName: targetTeam.name,
          inviteUrl: invitationUrl,
          expiresAt,
          invitationId: invitation.id,
        });

        if (sendResult.success) {
          emailSent = true;
          await TeamInvitationModel.updateEmailStatus(invitation.id, {
            emailStatus: 'sent',
            sentAt: new Date(),
          });
        } else {
          emailError = sendResult.error;
          await TeamInvitationModel.updateEmailStatus(invitation.id, {
            emailStatus: 'failed',
            lastError: emailError,
          });
        }
      } else {
        emailError = 'Email service is not configured. Please configure EMAIL_USER and EMAIL_PASSWORD.';
        await TeamInvitationModel.updateEmailStatus(invitation.id, {
          emailStatus: 'unconfigured',
          lastError: emailError,
        });
      }

      // 12. Return clear response preserving invitation state
      const responseMessage = emailSent
        ? `Invitation sent successfully to ${cleanEmail}.`
        : `Invitation created, but email could not be sent. Please configure email settings or resend.`;

      return sendSuccess(
        res,
        {
          invitation: {
            ...invitation,
            team_name: targetTeam.name,
            email_status: emailSent ? 'sent' : initialEmailStatus === 'unconfigured' ? 'unconfigured' : 'failed',
          },
          emailSent,
          emailError,
          invitationLink: `/invitations/accept/${rawToken}`,
        },
        responseMessage,
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
   * Get invitation preview metadata by raw token
   * GET /api/invitations/:token
   */
  async getInvitationByToken(req, res, next) {
    try {
      const { token } = req.params;

      if (!token || typeof token !== 'string') {
        return sendError(res, 'Invalid invitation token.', 400);
      }

      const tokenHash = hashToken(token);
      const invitation = await TeamInvitationModel.findByToken(tokenHash);

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
            email_status: invitation.email_status,
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

      const tokenHash = hashToken(token);
      const invitation = await TeamInvitationModel.findByToken(tokenHash);

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

      if (invitation.status === 'cancelled') {
        return sendError(res, 'Invitation has been cancelled.', 400);
      }

      // 2. Validate expiration
      const now = new Date();
      if (invitation.status === 'expired' || new Date(invitation.expires_at) <= now) {
        if (invitation.status !== 'expired') {
          await TeamInvitationModel.updateStatus(invitation.id, 'expired');
        }
        return sendError(res, 'Invitation has expired.', 400);
      }

      // 3. Recipient identity verification: authenticated email must match invitation
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

      // 5. Atomic state transition: mark invitation as accepted
      const transitioned = await TeamInvitationModel.atomicAccept(tokenHash);
      if (!transitioned) {
        return sendError(
          res,
          'Invitation is no longer valid, has expired, or was already accepted.',
          400
        );
      }

      // 6. Add user to workspace with default role = 'member' (strictly non-leader)
      const membership = await TeamMemberModel.addMember({
        teamId: invitation.team_id,
        userId: req.user.id,
        role: 'member',
      });

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

      const tokenHash = hashToken(token);
      const invitation = await TeamInvitationModel.findByToken(tokenHash);

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

      if (invitation.status === 'cancelled') {
        return sendError(res, 'Invitation has been cancelled.', 400);
      }

      // 2. Recipient identity verification
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

  /**
   * Leader cancels a pending invitation
   * PATCH /api/invitations/:id/cancel
   */
  async cancelInvitation(req, res, next) {
    try {
      const invitationId = parseInt(req.params.id, 10);
      if (isNaN(invitationId)) {
        return sendError(res, 'Invalid invitation ID.', 400);
      }

      const invitation = await TeamInvitationModel.findById(invitationId);
      if (!invitation) {
        return sendError(res, 'Invitation not found.', 404);
      }

      // Verify requester is a leader of the team that issued the invitation
      const membership = await TeamModel.findMembership(invitation.team_id, req.user.id);
      if (!membership || membership.role !== 'leader') {
        return sendError(res, 'Access denied. Team leader permissions required.', 403);
      }

      if (invitation.status === 'accepted') {
        return sendError(res, 'Cannot cancel an invitation that has already been accepted.', 400);
      }

      if (invitation.status === 'cancelled') {
        return sendError(res, 'Invitation is already cancelled.', 400);
      }

      // Atomic cancellation
      const cancelled = await TeamInvitationModel.atomicCancel(invitationId, invitation.team_id);
      if (!cancelled) {
        return sendError(res, 'Could not cancel invitation. It may have already transitioned.', 400);
      }

      return sendSuccess(
        res,
        {
          id: cancelled.id,
          status: 'cancelled',
        },
        'Invitation cancelled successfully.'
      );
    } catch (error) {
      next(error);
    }
  },

  /**
   * Leader resends a pending/expired invitation with updated token & expiration
   * POST /api/invitations/:id/resend
   */
  async resendInvitation(req, res, next) {
    try {
      const invitationId = parseInt(req.params.id, 10);
      if (isNaN(invitationId)) {
        return sendError(res, 'Invalid invitation ID.', 400);
      }

      const invitation = await TeamInvitationModel.findById(invitationId);
      if (!invitation) {
        return sendError(res, 'Invitation not found.', 404);
      }

      // Verify requester is a leader of the team
      const membership = await TeamModel.findMembership(invitation.team_id, req.user.id);
      if (!membership || membership.role !== 'leader') {
        return sendError(res, 'Access denied. Team leader permissions required.', 403);
      }

      if (invitation.status === 'accepted') {
        return sendError(res, 'Cannot resend an invitation that has already been accepted.', 400);
      }

      // Check if user is already a member of the team
      const targetUser = await UserModel.findByEmail(invitation.email);
      if (targetUser) {
        const isMember = await TeamMemberModel.findByTeamAndUser(invitation.team_id, targetUser.id);
        if (isMember) {
          return sendError(res, 'This user is already a member of this team.', 409);
        }
      }

      // Anti-abuse cooldown check (60 seconds)
      if (invitation.updated_at) {
        const secondsSinceUpdate =
          (Date.now() - new Date(invitation.updated_at).getTime()) / 1000;
        if (secondsSinceUpdate < RESEND_COOLDOWN_SECONDS) {
          const remaining = Math.ceil(RESEND_COOLDOWN_SECONDS - secondsSinceUpdate);
          return sendError(
            res,
            `Please wait ${remaining} second${remaining !== 1 ? 's' : ''} before resending this invitation.`,
            429
          );
        }
      }

      // Generate new token & hash
      const rawToken = crypto.randomBytes(32).toString('hex');
      const tokenHash = hashToken(rawToken);
      const expiresAt = new Date(Date.now() + INVITATION_EXPIRY_DAYS * 24 * 60 * 60 * 1000);

      // Atomic resend update
      const updated = await TeamInvitationModel.atomicResend(invitationId, {
        tokenHash,
        expiresAt,
      });

      if (!updated) {
        return sendError(res, 'Could not refresh invitation for resend.', 400);
      }

      const baseUrl = env.getInvitationBaseUrl();
      const invitationUrl = `${baseUrl}/invitations/accept/${rawToken}`;

      let emailSent = false;
      let emailError = null;

      if (emailService.isConfigured()) {
        const sendResult = await emailService.sendTeamInvitationEmail({
          to: invitation.email,
          inviterName: req.user.name,
          teamName: invitation.team_name,
          inviteUrl: invitationUrl,
          expiresAt,
          invitationId,
        });

        if (sendResult.success) {
          emailSent = true;
          await TeamInvitationModel.updateEmailStatus(invitationId, {
            emailStatus: 'sent',
            sentAt: new Date(),
          });
        } else {
          emailError = sendResult.error;
          await TeamInvitationModel.updateEmailStatus(invitationId, {
            emailStatus: 'failed',
            lastError: emailError,
          });
        }
      } else {
        emailError = 'Email service is not configured. Please configure EMAIL_USER and EMAIL_PASSWORD.';
        await TeamInvitationModel.updateEmailStatus(invitationId, {
          emailStatus: 'unconfigured',
          lastError: emailError,
        });
      }

      return sendSuccess(
        res,
        {
          id: invitationId,
          emailSent,
          emailError,
          email_status: emailSent ? 'sent' : emailService.isConfigured() ? 'failed' : 'unconfigured',
          invitationLink: `/invitations/accept/${rawToken}`,
        },
        emailSent
          ? `Invitation resent successfully to ${invitation.email}.`
          : `Invitation refreshed, but email could not be sent. Please check email configuration.`
      );
    } catch (error) {
      next(error);
    }
  },
};

module.exports = InvitationController;
