const { query } = require('../config/db');

/**
 * Team Invitation Data Access Model
 * Manages team invitations with SHA-256 token hashing, email delivery status,
 * and atomic state transitions for race condition prevention.
 */
const TeamInvitationModel = {
  /**
   * Create a new team invitation
   * @param {object} params
   * @param {number|string} params.teamId
   * @param {string} params.email
   * @param {number|string} params.invitedBy
   * @param {string} params.tokenHash - SHA-256 hash of the invitation token
   * @param {Date|string} params.expiresAt
   * @param {string} [params.emailStatus='pending']
   * @returns {Promise<object>}
   */
  async create({ teamId, email, invitedBy, tokenHash, expiresAt, emailStatus = 'pending' }) {
    const text = `
      INSERT INTO team_invitations (
        team_id, 
        email, 
        invited_by, 
        token, 
        status, 
        email_status, 
        expires_at
      )
      VALUES ($1, $2, $3, $4, 'pending', $5, $6)
      RETURNING 
        id, 
        team_id, 
        email, 
        invited_by, 
        status, 
        email_status, 
        email_sent_at, 
        last_email_error, 
        expires_at, 
        created_at, 
        updated_at
    `;
    const res = await query(text, [
      teamId,
      email.toLowerCase().trim(),
      invitedBy,
      tokenHash,
      emailStatus,
      expiresAt,
    ]);
    return res.rows[0];
  },

  /**
   * Find an invitation by its token SHA-256 hash
   * @param {string} tokenHash
   * @returns {Promise<object|null>}
   */
  async findByToken(tokenHash) {
    const text = `
      SELECT 
        ti.id,
        ti.team_id,
        ti.email,
        ti.invited_by,
        ti.token,
        ti.status,
        ti.email_status,
        ti.email_sent_at,
        ti.last_email_error,
        ti.expires_at,
        ti.created_at,
        ti.updated_at,
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
    const res = await query(text, [tokenHash]);
    return res.rows[0] || null;
  },

  /**
   * Find an invitation by its database primary key ID
   * @param {number|string} id
   * @returns {Promise<object|null>}
   */
  async findById(id) {
    const text = `
      SELECT 
        ti.id,
        ti.team_id,
        ti.email,
        ti.invited_by,
        ti.token,
        ti.status,
        ti.email_status,
        ti.email_sent_at,
        ti.last_email_error,
        ti.expires_at,
        ti.created_at,
        ti.updated_at,
        t.name AS team_name,
        t.description AS team_description,
        u.name AS invited_by_name,
        u.email AS invited_by_email
      FROM team_invitations ti
      JOIN teams t ON t.id = ti.team_id
      JOIN users u ON u.id = ti.invited_by
      WHERE ti.id = $1
      LIMIT 1
    `;
    const res = await query(text, [id]);
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
        ti.status,
        ti.email_status,
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
   * Find all invitations issued for a specific workspace (Leader overview)
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
        ti.status,
        ti.email_status,
        ti.email_sent_at,
        ti.last_email_error,
        ti.expires_at,
        ti.created_at,
        ti.updated_at,
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
   * Atomic state transition: Accept invitation
   * Only transitions if current status is 'pending' and not expired.
   * Prevents race conditions.
   * @param {string} tokenHash
   * @returns {Promise<object|null>}
   */
  async atomicAccept(tokenHash) {
    const text = `
      UPDATE team_invitations
      SET status = 'accepted', updated_at = NOW()
      WHERE token = $1 
        AND status = 'pending' 
        AND expires_at > NOW()
      RETURNING id, team_id, email, invited_by, status, expires_at, updated_at
    `;
    const res = await query(text, [tokenHash]);
    return res.rows[0] || null;
  },

  /**
   * Atomic state transition: Cancel invitation
   * Only transitions if current status is 'pending'.
   * @param {number|string} id
   * @param {number|string} teamId
   * @returns {Promise<object|null>}
   */
  async atomicCancel(id, teamId) {
    const text = `
      UPDATE team_invitations
      SET status = 'cancelled', updated_at = NOW()
      WHERE id = $1 AND team_id = $2 AND status = 'pending'
      RETURNING id, team_id, email, status, updated_at
    `;
    const res = await query(text, [id, teamId]);
    return res.rows[0] || null;
  },

  /**
   * Atomic state transition: Resend / Refresh invitation
   * Resets status to pending, updates token hash and expiration.
   * @param {number|string} id
   * @param {object} params
   * @param {string} params.tokenHash
   * @param {Date|string} params.expiresAt
   * @returns {Promise<object|null>}
   */
  async atomicResend(id, { tokenHash, expiresAt }) {
    const text = `
      UPDATE team_invitations
      SET 
        token = $1, 
        expires_at = $2, 
        status = 'pending', 
        email_status = 'pending', 
        last_email_error = NULL, 
        updated_at = NOW()
      WHERE id = $3 AND status IN ('pending', 'expired')
      RETURNING id, team_id, email, status, email_status, expires_at, updated_at
    `;
    const res = await query(text, [tokenHash, expiresAt, id]);
    return res.rows[0] || null;
  },

  /**
   * Update delivery status of an invitation email
   * @param {number|string} id
   * @param {object} params
   * @param {'pending'|'sent'|'failed'|'unconfigured'} params.emailStatus
   * @param {string|null} [params.lastError=null]
   * @param {Date|string|null} [params.sentAt=null]
   * @returns {Promise<object|null>}
   */
  async updateEmailStatus(id, { emailStatus, lastError = null, sentAt = null }) {
    const text = `
      UPDATE team_invitations
      SET 
        email_status = $1, 
        last_email_error = $2, 
        email_sent_at = CASE WHEN $3::timestamp with time zone IS NOT NULL THEN $3 ELSE email_sent_at END,
        updated_at = NOW()
      WHERE id = $4
      RETURNING id, email_status, email_sent_at, last_email_error
    `;
    const res = await query(text, [emailStatus, lastError, sentAt, id]);
    return res.rows[0] || null;
  },

  /**
   * Update the status of an invitation
   * @param {number|string} id
   * @param {'pending'|'accepted'|'rejected'|'expired'|'cancelled'} status
   * @returns {Promise<object|null>}
   */
  async updateStatus(id, status) {
    const text = `
      UPDATE team_invitations
      SET status = $1, updated_at = NOW()
      WHERE id = $2
      RETURNING id, team_id, email, invited_by, status, expires_at, created_at, updated_at
    `;
    const res = await query(text, [status, id]);
    return res.rows[0] || null;
  },

  /**
   * Count invitations created by an inviter within a recent time window (minutes)
   * Used for rate limiting anti-abuse checks.
   * @param {number|string} invitedBy
   * @param {number} windowMinutes
   * @returns {Promise<number>}
   */
  async countRecentByInviter(invitedBy, windowMinutes = 60) {
    const text = `
      SELECT COUNT(*) AS count
      FROM team_invitations
      WHERE invited_by = $1 
        AND created_at > NOW() - ($2 || ' minutes')::INTERVAL
    `;
    const res = await query(text, [invitedBy, windowMinutes]);
    return parseInt(res.rows[0]?.count || 0, 10);
  },

  /**
   * Get the most recent invitation timestamp created by an inviter
   * Used for short-window burst throttle (e.g. 3-second cooldown).
   * @param {number|string} invitedBy
   * @returns {Promise<Date|null>}
   */
  async getLatestCreatedAtByInviter(invitedBy) {
    const text = `
      SELECT created_at
      FROM team_invitations
      WHERE invited_by = $1
      ORDER BY created_at DESC
      LIMIT 1
    `;
    const res = await query(text, [invitedBy]);
    return res.rows[0]?.created_at ? new Date(res.rows[0].created_at) : null;
  },
};

module.exports = TeamInvitationModel;
