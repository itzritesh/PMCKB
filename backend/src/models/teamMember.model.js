const { query } = require('../config/db');

/**
 * Team Member Data Access Model
 * Manages memberships and roles ('leader', 'member') for teams
 */
const TeamMemberModel = {
  /**
   * Find all members of a team with user details
   * @param {number|string} teamId
   * @returns {Promise<Array<object>>}
   */
  async findAllByTeam(teamId) {
    const text = `
      SELECT 
        tm.id,
        tm.team_id,
        tm.user_id,
        tm.role,
        tm.joined_at,
        u.name,
        u.email
      FROM team_members tm
      JOIN users u ON u.id = tm.user_id
      WHERE tm.team_id = $1
      ORDER BY 
        CASE WHEN tm.role = 'leader' THEN 0 ELSE 1 END,
        tm.joined_at ASC
    `;
    const res = await query(text, [teamId]);
    return res.rows;
  },

  /**
   * Find specific membership for a team and user
   * @param {number|string} teamId
   * @param {number|string} userId
   * @returns {Promise<object|null>}
   */
  async findByTeamAndUser(teamId, userId) {
    const text = `
      SELECT 
        tm.id,
        tm.team_id,
        tm.user_id,
        tm.role,
        tm.joined_at,
        u.name,
        u.email
      FROM team_members tm
      JOIN users u ON u.id = tm.user_id
      WHERE tm.team_id = $1 AND tm.user_id = $2
      LIMIT 1
    `;
    const res = await query(text, [teamId, userId]);
    return res.rows[0] || null;
  },

  /**
   * Add a member to a team
   * @param {object} params
   * @param {number|string} params.teamId
   * @param {number|string} params.userId
   * @param {string} [params.role='member']
   * @returns {Promise<object>}
   */
  async addMember({ teamId, userId, role = 'member' }) {
    const text = `
      INSERT INTO team_members (team_id, user_id, role)
      VALUES ($1, $2, $3)
      RETURNING id, team_id, user_id, role, joined_at
    `;
    const res = await query(text, [teamId, userId, role]);
    return res.rows[0];
  },

  /**
   * Update a member's role
   * @param {object} params
   * @param {number|string} params.teamId
   * @param {number|string} params.userId
   * @param {string} params.role
   * @returns {Promise<object|null>}
   */
  async updateRole({ teamId, userId, role }) {
    const text = `
      UPDATE team_members
      SET role = $1
      WHERE team_id = $2 AND user_id = $3
      RETURNING id, team_id, user_id, role, joined_at
    `;
    const res = await query(text, [role, teamId, userId]);
    return res.rows[0] || null;
  },

  /**
   * Remove a member from a team
   * @param {number|string} teamId
   * @param {number|string} userId
   * @returns {Promise<boolean>}
   */
  async removeMember(teamId, userId) {
    const text = `
      DELETE FROM team_members
      WHERE team_id = $1 AND user_id = $2
      RETURNING id
    `;
    const res = await query(text, [teamId, userId]);
    return res.rowCount > 0;
  },

  /**
   * Count active leaders in a team
   * @param {number|string} teamId
   * @returns {Promise<number>}
   */
  async countLeaders(teamId) {
    const text = `
      SELECT COUNT(*)::int AS count
      FROM team_members
      WHERE team_id = $1 AND role = 'leader'
    `;
    const res = await query(text, [teamId]);
    return parseInt(res.rows[0].count, 10) || 0;
  },
};

module.exports = TeamMemberModel;
