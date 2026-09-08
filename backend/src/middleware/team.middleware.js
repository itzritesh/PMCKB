const { TeamModel } = require('../models');
const { sendError } = require('../utils/response');

/**
 * Middleware to verify that the authenticated user is a member of the target team/workspace.
 * Extracts team ID from req.params.teamId or req.params.id.
 * Attaches req.team and req.teamMember to request object.
 */
const requireTeamMember = async (req, res, next) => {
  try {
    const rawTeamId = req.params.teamId || req.params.id;
    const teamId = parseInt(rawTeamId, 10);

    if (isNaN(teamId)) {
      return sendError(res, 'Invalid team ID format.', 400);
    }

    const team = await TeamModel.findById(teamId);
    if (!team) {
      return sendError(res, 'Workspace not found.', 404);
    }

    const membership = await TeamModel.findMembership(teamId, req.user.id);
    if (!membership) {
      return sendError(res, 'Access denied. You are not a member of this workspace.', 403);
    }

    req.team = team;
    req.teamMember = membership;
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware to verify that the authenticated user is a leader of the target team.
 * Must be used after requireTeamMember or handles membership check automatically.
 */
const requireTeamLeader = async (req, res, next) => {
  try {
    if (!req.teamMember) {
      // Run member check first if not already run
      return requireTeamMember(req, res, () => {
        if (req.teamMember.role !== 'leader') {
          return sendError(res, 'Access denied. Team leader permissions required.', 403);
        }
        next();
      });
    }

    if (req.teamMember.role !== 'leader') {
      return sendError(res, 'Access denied. Team leader permissions required.', 403);
    }

    next();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  requireTeamMember,
  requireTeamLeader,
};
