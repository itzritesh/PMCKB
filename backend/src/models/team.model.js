const { query, pool } = require('../config/db');

/**
 * Team Data Access Model
 * Manages teams and workspaces in PostgreSQL
 */
const TeamModel = {
  /**
   * Create a new team and add creator as leader within a transaction
   * @param {object} params
   * @param {string} params.name
   * @param {string} [params.description='']
   * @param {number|string} params.createdBy
   * @returns {Promise<object>} Created team with leader role
   */
  async create({ name, description = '', createdBy }) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // 1. Insert Team
      const teamInsertText = `
        INSERT INTO teams (name, description, created_by)
        VALUES ($1, $2, $3)
        RETURNING id, name, description, created_by, created_at, updated_at
      `;
      const teamRes = await client.query(teamInsertText, [
        name.trim(),
        description ? description.trim() : '',
        createdBy,
      ]);
      const team = teamRes.rows[0];

      // 2. Insert creator as 'leader' in team_members
      const memberInsertText = `
        INSERT INTO team_members (team_id, user_id, role)
        VALUES ($1, $2, 'leader')
        RETURNING id, role, joined_at
      `;
      const memberRes = await client.query(memberInsertText, [team.id, createdBy]);
      const member = memberRes.rows[0];

      await client.query('COMMIT');

      return {
        ...team,
        user_role: member.role,
        joined_at: member.joined_at,
        member_count: 1,
      };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  },

  /**
   * Find all teams that the given user belongs to
   * @param {number|string} userId
   * @returns {Promise<Array<object>>}
   */
  async findAllByUser(userId) {
    const text = `
      SELECT 
        t.id, 
        t.name, 
        t.description, 
        t.created_by, 
        t.created_at, 
        t.updated_at,
        tm.role AS user_role,
        tm.joined_at,
        (SELECT COUNT(*)::int FROM team_members WHERE team_id = t.id) AS member_count
      FROM teams t
      JOIN team_members tm ON tm.team_id = t.id
      WHERE tm.user_id = $1
      ORDER BY t.created_at ASC
    `;
    const res = await query(text, [userId]);
    return res.rows;
  },

  /**
   * Find a specific team by ID
   * @param {number|string} id
   * @returns {Promise<object|null>}
   */
  async findById(id) {
    const text = `
      SELECT 
        t.id, 
        t.name, 
        t.description, 
        t.created_by, 
        t.created_at, 
        t.updated_at,
        (SELECT COUNT(*)::int FROM team_members WHERE team_id = t.id) AS member_count
      FROM teams t
      WHERE t.id = $1
      LIMIT 1
    `;
    const res = await query(text, [id]);
    return res.rows[0] || null;
  },

  /**
   * Find membership record for a specific user and team
   * @param {number|string} teamId
   * @param {number|string} userId
   * @returns {Promise<object|null>}
   */
  async findMembership(teamId, userId) {
    const text = `
      SELECT id, team_id, user_id, role, joined_at
      FROM team_members
      WHERE team_id = $1 AND user_id = $2
      LIMIT 1
    `;
    const res = await query(text, [teamId, userId]);
    return res.rows[0] || null;
  },

  /**
   * Update team name and description
   * @param {object} params
   * @param {number|string} params.id
   * @param {string} params.name
   * @param {string} [params.description]
   * @returns {Promise<object|null>}
   */
  async update({ id, name, description }) {
    const text = `
      UPDATE teams
      SET name = $1,
          description = $2,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $3
      RETURNING id, name, description, created_by, created_at, updated_at
    `;
    const values = [name.trim(), description !== undefined ? description.trim() : '', id];
    const res = await query(text, values);
    return res.rows[0] || null;
  },

  /**
   * Delete team (cascades automatically to team_members, invitations, announcements, etc.)
   * @param {number|string} id
   * @returns {Promise<boolean>}
   */
  async delete(id) {
    const text = `
      DELETE FROM teams
      WHERE id = $1
      RETURNING id
    `;
    const res = await query(text, [id]);
    return res.rowCount > 0;
  },
};

module.exports = TeamModel;
