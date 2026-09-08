const { TeamModel, TeamMemberModel, UserModel } = require('../models');
const { sendSuccess, sendError } = require('../utils/response');

const ALLOWED_ROLES = ['leader', 'member'];

/**
 * Team and Member Controller
 */
const TeamController = {
  /**
   * Create a new team/workspace
   * POST /api/teams
   */
  async createTeam(req, res, next) {
    try {
      const { name, description } = req.body;

      if (!name || typeof name !== 'string' || !name.trim()) {
        return sendError(res, 'Team name is required and cannot be empty.', 400);
      }

      if (name.trim().length > 255) {
        return sendError(res, 'Team name cannot exceed 255 characters.', 400);
      }

      const team = await TeamModel.create({
        name,
        description,
        createdBy: req.user.id,
      });

      return sendSuccess(res, { team }, 'Workspace created successfully', 201);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get all teams the authenticated user belongs to
   * GET /api/teams
   */
  async getTeams(req, res, next) {
    try {
      const teams = await TeamModel.findAllByUser(req.user.id);
      return sendSuccess(
        res,
        {
          teams,
          total: teams.length,
        },
        'Workspaces fetched successfully'
      );
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get team details by ID (membership required)
   * GET /api/teams/:id
   */
  async getTeamById(req, res, next) {
    try {
      // req.team and req.teamMember are populated by requireTeamMember
      const team = {
        ...req.team,
        user_role: req.teamMember.role,
        joined_at: req.teamMember.joined_at,
      };

      return sendSuccess(res, { team }, 'Workspace retrieved successfully');
    } catch (error) {
      next(error);
    }
  },

  /**
   * Update team name and description (leader required)
   * PUT /api/teams/:id
   */
  async updateTeam(req, res, next) {
    try {
      const { name, description } = req.body;

      if (!name || typeof name !== 'string' || !name.trim()) {
        return sendError(res, 'Team name is required and cannot be empty.', 400);
      }

      if (name.trim().length > 255) {
        return sendError(res, 'Team name cannot exceed 255 characters.', 400);
      }

      const updatedTeam = await TeamModel.update({
        id: req.team.id,
        name,
        description,
      });

      return sendSuccess(res, { team: updatedTeam }, 'Workspace updated successfully');
    } catch (error) {
      next(error);
    }
  },

  /**
   * Delete team (leader required)
   * DELETE /api/teams/:id
   */
  async deleteTeam(req, res, next) {
    try {
      const deleted = await TeamModel.delete(req.team.id);
      if (!deleted) {
        return sendError(res, 'Workspace not found or could not be deleted.', 404);
      }

      return sendSuccess(res, { id: req.team.id }, 'Workspace deleted successfully');
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get all members of a team (membership required)
   * GET /api/teams/:teamId/members
   */
  async getTeamMembers(req, res, next) {
    try {
      const teamId = req.team.id;
      const members = await TeamMemberModel.findAllByTeam(teamId);

      return sendSuccess(
        res,
        {
          members,
          total: members.length,
        },
        'Team members fetched successfully'
      );
    } catch (error) {
      next(error);
    }
  },

  /**
   * Add a member to the team (leader required)
   * POST /api/teams/:teamId/members
   */
  async addTeamMember(req, res, next) {
    try {
      const teamId = req.team.id;
      const { email, role = 'member' } = req.body;
      const userId = req.body.userId || req.body.user_id;

      // Validate role
      if (!ALLOWED_ROLES.includes(role)) {
        return sendError(
          res,
          `Invalid role. Allowed roles are: ${ALLOWED_ROLES.join(', ')}`,
          400
        );
      }

      let targetUser = null;

      if (userId) {
        targetUser = await UserModel.findById(userId);
        if (!targetUser) {
          return sendError(res, `User with ID ${userId} not found.`, 404);
        }
      } else if (email && typeof email === 'string' && email.trim()) {
        targetUser = await UserModel.findByEmail(email.trim());
        if (!targetUser) {
          return sendError(res, `User with email "${email.trim()}" not found.`, 404);
        }
      } else {
        return sendError(res, 'User ID or valid email is required to add a team member.', 400);
      }

      // Check for duplicate membership
      const existingMembership = await TeamMemberModel.findByTeamAndUser(teamId, targetUser.id);
      if (existingMembership) {
        return sendError(
          res,
          `User "${targetUser.email}" is already a member of this workspace.`,
          409
        );
      }

      const newMemberRecord = await TeamMemberModel.addMember({
        teamId,
        userId: targetUser.id,
        role,
      });

      const member = {
        id: newMemberRecord.id,
        team_id: teamId,
        user_id: targetUser.id,
        role: newMemberRecord.role,
        joined_at: newMemberRecord.joined_at,
        name: targetUser.name,
        email: targetUser.email,
      };

      return sendSuccess(res, { member }, 'Member added to workspace successfully', 201);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Update member role (leader required)
   * PUT /api/teams/:teamId/members/:userId
   */
  async updateMemberRole(req, res, next) {
    try {
      const teamId = req.team.id;
      const targetUserId = parseInt(req.params.userId, 10);

      if (isNaN(targetUserId)) {
        return sendError(res, 'Invalid user ID format.', 400);
      }

      const { role } = req.body;
      if (!role || !ALLOWED_ROLES.includes(role)) {
        return sendError(
          res,
          `Invalid role. Allowed roles are: ${ALLOWED_ROLES.join(', ')}`,
          400
        );
      }

      const existingMember = await TeamMemberModel.findByTeamAndUser(teamId, targetUserId);
      if (!existingMember) {
        return sendError(res, 'User is not a member of this workspace.', 404);
      }

      // Last-Leader Protection: prevent demoting the only remaining leader
      if (existingMember.role === 'leader' && role === 'member') {
        const leaderCount = await TeamMemberModel.countLeaders(teamId);
        if (leaderCount <= 1) {
          return sendError(
            res,
            'Cannot demote the sole team leader. Promote another member to leader before changing this role.',
            400
          );
        }
      }

      const updated = await TeamMemberModel.updateRole({
        teamId,
        userId: targetUserId,
        role,
      });

      const member = {
        ...updated,
        name: existingMember.name,
        email: existingMember.email,
      };

      return sendSuccess(res, { member }, 'Member role updated successfully');
    } catch (error) {
      next(error);
    }
  },

  /**
   * Remove member from team (leader required)
   * DELETE /api/teams/:teamId/members/:userId
   */
  async removeTeamMember(req, res, next) {
    try {
      const teamId = req.team.id;
      const targetUserId = parseInt(req.params.userId, 10);

      if (isNaN(targetUserId)) {
        return sendError(res, 'Invalid user ID format.', 400);
      }

      const existingMember = await TeamMemberModel.findByTeamAndUser(teamId, targetUserId);
      if (!existingMember) {
        return sendError(res, 'User is not a member of this workspace.', 404);
      }

      // Last-Leader Protection: prevent deleting the only remaining leader
      if (existingMember.role === 'leader') {
        const leaderCount = await TeamMemberModel.countLeaders(teamId);
        if (leaderCount <= 1) {
          return sendError(
            res,
            'Cannot remove the sole team leader. Transfer leadership or promote another member first.',
            400
          );
        }
      }

      await TeamMemberModel.removeMember(teamId, targetUserId);

      return sendSuccess(
        res,
        { userId: targetUserId, teamId },
        'Member removed from workspace successfully'
      );
    } catch (error) {
      next(error);
    }
  },
};

module.exports = TeamController;
