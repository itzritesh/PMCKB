const { query } = require('../config/db');

/**
 * Project Data Access Model
 * Team-isolated project access
 */
const ProjectModel = {
  /**
   * Create a new project for a team
   */
  async create({ name, description = '', status = 'planning', ownerId, teamId }) {
    const text = `
      INSERT INTO projects (name, description, status, owner_id, team_id)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, name, description, status, owner_id, team_id, created_at, updated_at
    `;
    const values = [name.trim(), description ? description.trim() : '', status, ownerId, teamId];
    const res = await query(text, values);
    return res.rows[0];
  },

  /**
   * Find all projects belonging to the specified team that user has membership in
   */
  async findAllByTeam({ teamId, userId }) {
    const text = `
      SELECT p.id, p.name, p.description, p.status, p.owner_id, p.team_id, p.created_at, p.updated_at,
             u.name AS owner_name, u.email AS owner_email,
             tm.role AS user_role
      FROM projects p
      JOIN team_members tm ON tm.team_id = p.team_id
      JOIN users u ON u.id = p.owner_id
      WHERE p.team_id = $1 AND tm.user_id = $2
      ORDER BY p.created_at DESC
    `;
    const res = await query(text, [teamId, userId]);
    return res.rows;
  },

  /**
   * Find all projects owned by a specific user (legacy compatibility fallback)
   */
  async findAllByOwner(ownerId) {
    const text = `
      SELECT p.id, p.name, p.description, p.status, p.owner_id, p.team_id, p.created_at, p.updated_at,
             u.name AS owner_name, u.email AS owner_email
      FROM projects p
      JOIN users u ON u.id = p.owner_id
      WHERE p.owner_id = $1
      ORDER BY p.created_at DESC
    `;
    const res = await query(text, [ownerId]);
    return res.rows;
  },

  /**
   * Find a specific project by ID ensuring team access
   */
  async findByIdAndTeam(id, userId) {
    const text = `
      SELECT p.id, p.name, p.description, p.status, p.owner_id, p.team_id, p.created_at, p.updated_at,
             u.name AS owner_name, u.email AS owner_email,
             tm.role AS user_role
      FROM projects p
      JOIN team_members tm ON tm.team_id = p.team_id
      JOIN users u ON u.id = p.owner_id
      WHERE p.id = $1 AND tm.user_id = $2
      LIMIT 1
    `;
    const res = await query(text, [id, userId]);
    return res.rows[0] || null;
  },

  /**
   * Legacy findByIdAndOwner for compatibility
   */
  async findByIdAndOwner(id, ownerId) {
    return this.findByIdAndTeam(id, ownerId);
  },

  /**
   * Update project
   */
  async update({ id, name, description, status }) {
    const text = `
      UPDATE projects
      SET name = $1,
          description = $2,
          status = $3,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $4
      RETURNING id, name, description, status, owner_id, team_id, created_at, updated_at
    `;
    const values = [name.trim(), description !== undefined ? description.trim() : '', status, id];
    const res = await query(text, values);
    return res.rows[0] || null;
  },

  /**
   * Delete a project
   */
  async delete(id) {
    const text = `
      DELETE FROM projects
      WHERE id = $1
      RETURNING id
    `;
    const res = await query(text, [id]);
    return res.rowCount > 0;
  },
};

module.exports = ProjectModel;
