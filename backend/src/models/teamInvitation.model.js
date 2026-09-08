const { query } = require('../config/db');

/**
 * Team Invitation Data Access Model
 * Manages team invitations, tokens, expiration, and status transitions
 */
const TeamInvitationModel = {
  /**
   * Create a new team invitation
   * @param {object} params
   * @param {number|string} params.teamId
   * @param {string} params.email
   * @param {number|string} params.invitedBy
   * @param {string} params.token
   * @param {Date|string} params.expiresAt
   * @returns {Promise<object>}
   */
  async create({ teamId, email, invitedBy, token, expiresAt }) {
    const text = `
      INSERT INTO team_invitations (team_id, email, invited_by, token, status, expires_at)
      VALUES ($1, $2, $3, $4, 'pending', $5)
      RETURNING id, team_id, email, invited_by, token, status, expires_at, created_at
    `;
    const res = await query(text, [teamId, email.toLowerCase().trim(), invitedBy, token, expiresAt]);
    return res.rows[0];
  },

  /**
   * Find an invitation by its unique token
   * @param {string} token
   * @returns {Promise<object|null>}
   */
  async findByToken(token) {
    const text = `
      SELECT 
        ti.id,
        ti.team_id,
        ti.email,
        ti.invited_by,
        ti.token,
        ti.status,
        ti.expires_at,
        ti.created_at,
        t.name AS team_name,
        t.description AS team_description,
        u.name AS invited_by_name,
        u.email AS invited_by_email
      FROM team_invitations ti
      JOIN teams t ON t.id = ti.team_id
      JOIN users u ON u.id = ti.invited_by
      WHERE ti.token = $1
      LIMIT 1
    `;
    const res = await query(text, [token]);
    return res.rows[0] || null;
  },

  /**
   * Find an active pending invitation for a team and email
   * @param {number|string} teamId
   * @param {string} email
   * @returns {Promise<object|null>}
   */
  async findPendingByTeamAndEmail(teamId, email) {
    const text = `
      SELECT *
      FROM team_invitations
      WHERE team_id = $1 
        AND LOWER(email) = LOWER($2) 
        AND status = 'pending'
        AND expires_at > NOW()
      LIMIT 1
    `;
    const res = await query(text, [teamId, email.trim()]);
    return res.rows[0] || null;
  },

  /**
   * Find all active pending invitations for a user by email
   * @param {string} email
   * @returns {Promise<Array<object>>}
   */
  async findAllPendingByUserEmail(email) {
    const text = `
      SELECT 
        ti.id,
        ti.team_id,
        ti.email,
        ti.invited_by,
        ti.token,
        ti.status,
        ti.expires_at,
        ti.created_at,
        t.name AS team_name,
        t.description AS team_description,
        u.name AS invited_by_name,
        u.email AS invited_by_email
      FROM team_invitations ti
      JOIN teams t ON t.id = ti.team_id
      JOIN users u ON u.id = ti.invited_by
      WHERE LOWER(ti.email) = LOWER($1)
        AND ti.status = 'pending'
        AND ti.expires_at > NOW()
      ORDER BY ti.created_at DESC
    `;
    const res = await query(text, [email.trim()]);
    return res.rows;
  },

  /**
   * Find all invitations issued for a specific workspace
   * @param {number|string} teamId
   * @returns {Promise<Array<object>>}
   */
  async findAllByTeam(teamId) {
    const text = `
      SELECT 
        ti.id,
        ti.team_id,
        ti.email,
        ti.invited_by,
        ti.token,
        ti.status,
        ti.expires_at,
        ti.created_at,
        u.name AS invited_by_name,
        u.email AS invited_by_email
      FROM team_invitations ti
      JOIN users u ON u.id = ti.invited_by
      WHERE ti.team_id = $1
      ORDER BY ti.created_at DESC
    `;
    const res = await query(text, [teamId]);
    return res.rows;
  },

  /**
   * Update the status of an invitation
   * @param {number|string} id
   * @param {'pending'|'accepted'|'rejected'|'expired'} status
   * @returns {Promise<object|null>}
   */
  async updateStatus(id, status) {
    const text = `
      UPDATE team_invitations
      SET status = $1
      WHERE id = $2
      RETURNING id, team_id, email, invited_by, token, status, expires_at, created_at
    `;
    const res = await query(text, [status, id]);
    return res.rows[0] || null;
  },
};

module.exports = TeamInvitationModel;
