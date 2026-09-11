const { query } = require('../config/db');
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
    req.teamId = teamId;
    req.teamRole = membership.role;
    req.isLeader = membership.role === 'leader';
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

/**
 * Resolves and verifies team access for general resource routes (e.g. GET /api/projects, POST /api/tasks).
 * Checks header 'x-team-id', query 'teamId'/'team_id', or body 'teamId'/'team_id'.
 * If explicitly provided: strictly verifies the user belongs to that team (returns 403 if not).
 * If omitted: defaults to user's primary team from team_members for backward compatibility.
 */
const verifyTeamAccess = async (req, res, next) => {
  try {
    const explicitTeamId =
      req.headers['x-team-id'] ||
      req.query.teamId ||
      req.query.team_id ||
      (req.body && (req.body.teamId || req.body.team_id));

    let targetTeamId;

    if (explicitTeamId) {
      targetTeamId = parseInt(explicitTeamId, 10);
      if (isNaN(targetTeamId)) {
        return sendError(res, 'Invalid team ID format.', 400);
      }

      // Verify the user actually belongs to this team
      const membership = await TeamModel.findMembership(targetTeamId, req.user.id);
      if (!membership) {
        return sendError(res, 'Access denied. You are not a member of this workspace.', 403);
      }

      req.teamId = targetTeamId;
      req.teamRole = membership.role;
      req.isLeader = membership.role === 'leader';
      req.teamMember = membership;
      return next();
    }

    // If no team_id passed, fallback to user's first enrolled team
    const fallbackRes = await query(
      `SELECT team_id, role 
       FROM team_members 
       WHERE user_id = $1 
       ORDER BY team_id ASC 
       LIMIT 1`,
      [req.user.id]
    );

    if (fallbackRes.rows.length === 0) {
      try {
        const newTeam = await TeamModel.create({
          name: `${req.user.name || 'Personal'}'s Workspace`,
          description: 'Personal workspace',
          createdBy: req.user.id,
        });
        req.teamId = newTeam.id;
        req.teamRole = 'leader';
        req.isLeader = true;
        req.teamMember = { team_id: newTeam.id, user_id: req.user.id, role: 'leader' };
        return next();
      } catch (autoErr) {
        return sendError(
          res,
          'Access denied. You do not belong to any workspace. Please create or join a team first.',
          403
        );
      }
    }

    const primaryMembership = fallbackRes.rows[0];
    req.teamId = primaryMembership.team_id;
    req.teamRole = primaryMembership.role;
    req.isLeader = primaryMembership.role === 'leader';
    req.teamMember = primaryMembership;
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware to require leader role on the verified team
 */
const requireLeader = (req, res, next) => {
  if (!req.isLeader && req.teamRole !== 'leader') {
    return sendError(res, 'Access denied. Team leader permissions required.', 403);
  }
  next();
};

/**
 * Reusable middleware factory for resource access by ID (e.g. GET /api/projects/:id, PUT /api/tasks/:id)
 * Conceptually runs:
 *   SELECT r.*, tm.role AS user_role
 *   FROM <table> r
 *   LEFT JOIN team_members tm ON tm.team_id = r.team_id AND tm.user_id = $2
 *   WHERE r.id = $1
 */
const verifyResourceTeamAccess = (tableName, idParam = 'id', options = {}) => {
  return async (req, res, next) => {
    try {
      const rawId = req.params[idParam];
      const resourceId = parseInt(rawId, 10);

      if (isNaN(resourceId)) {
        return sendError(res, `Invalid ${tableName} ID format.`, 400);
      }

      const queryText = `
        SELECT r.*, tm.role AS user_role
        FROM ${tableName} r
        LEFT JOIN team_members tm ON tm.team_id = r.team_id AND tm.user_id = $2
        WHERE r.id = $1
        LIMIT 1
      `;
      const result = await query(queryText, [resourceId, req.user.id]);

      if (result.rows.length === 0) {
        return sendError(res, `${options.resourceName || 'Resource'} not found.`, 404);
      }

      const resource = result.rows[0];

      // If user is not in team_members for this resource's team
      if (!resource.user_role) {
        return sendError(
          res,
          'Access denied. You do not have permission to access this team resource.',
          403
        );
      }

      // If leader permission is strictly required
      if (options.requireLeader && resource.user_role !== 'leader') {
        return sendError(res, 'Access denied. Team leader permissions required.', 403);
      }

      // Attach context to request
      req.resource = resource;
      req.teamId = resource.team_id;
      req.teamRole = resource.user_role;
      req.isLeader = resource.user_role === 'leader';
      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Resolves optional team access:
 * If explicit team ID is passed (via header, query, body): strictly verifies membership (returns 403 if not).
 * If omitted: leaves req.teamId = null so endpoints can query across all teams the user belongs to.
 */
const verifyOptionalTeamAccess = async (req, res, next) => {
  try {
    const explicitTeamId =
      req.headers['x-team-id'] ||
      req.query.teamId ||
      req.query.team_id ||
      (req.body && (req.body.teamId || req.body.team_id));

    if (explicitTeamId) {
      const targetTeamId = parseInt(explicitTeamId, 10);
      if (isNaN(targetTeamId)) {
        return sendError(res, 'Invalid team ID format.', 400);
      }

      const membership = await TeamModel.findMembership(targetTeamId, req.user.id);
      if (!membership) {
        return sendError(res, 'Access denied. You are not a member of this workspace.', 403);
      }

      req.teamId = targetTeamId;
      req.teamRole = membership.role;
      req.isLeader = membership.role === 'leader';
      req.teamMember = membership;
      return next();
    }

    req.teamId = null;
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  requireTeamMember,
  requireTeamLeader,
  verifyTeamAccess,
  verifyOptionalTeamAccess,
  requireLeader,
  verifyResourceTeamAccess,
};

