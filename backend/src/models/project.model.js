const { query } = require('../config/db');

/**
 * Project Data Access Model
 * All operations enforce owner_id isolation so users can only access their own projects.
 */
const ProjectModel = {
  /**
   * Create a new project for a user
   * @param {object} params
   * @param {string} params.name
   * @param {string} [params.description]
   * @param {string} [params.status='planning']
   * @param {number|string} params.ownerId
   * @returns {Promise<object>} Created project
   */
  async create({ name, description = '', status = 'planning', ownerId }) {
    const text = `
      INSERT INTO projects (name, description, status, owner_id)
      VALUES ($1, $2, $3, $4)
      RETURNING id, name, description, status, owner_id, created_at, updated_at
    `;
    const values = [name.trim(), description ? description.trim() : '', status, ownerId];
    const res = await query(text, values);
    return res.rows[0];
  },

  /**
   * Find all projects owned by a specific user
   * @param {number|string} ownerId
   * @returns {Promise<Array<object>>} List of projects sorted by latest first
   */
  async findAllByOwner(ownerId) {
    const text = `
      SELECT id, name, description, status, owner_id, created_at, updated_at
      FROM projects
      WHERE owner_id = $1
      ORDER BY created_at DESC
    `;
    const res = await query(text, [ownerId]);
    return res.rows;
  },

  /**
   * Find a specific project by ID ensuring ownership
   * @param {number|string} id
   * @param {number|string} ownerId
   * @returns {Promise<object|null>} Project or null
   */
  async findByIdAndOwner(id, ownerId) {
    const text = `
      SELECT id, name, description, status, owner_id, created_at, updated_at
      FROM projects
      WHERE id = $1 AND owner_id = $2
      LIMIT 1
    `;
    const res = await query(text, [id, ownerId]);
    return res.rows[0] || null;
  },

  /**
   * Update an existing project owned by the user
   * @param {object} params
   * @param {number|string} params.id
   * @param {number|string} params.ownerId
   * @param {string} params.name
   * @param {string} params.description
   * @param {string} params.status
   * @returns {Promise<object|null>} Updated project
   */
  async update({ id, ownerId, name, description, status }) {
    const text = `
      UPDATE projects
      SET name = $1,
          description = $2,
          status = $3,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $4 AND owner_id = $5
      RETURNING id, name, description, status, owner_id, created_at, updated_at
    `;
    const values = [name.trim(), description !== undefined ? description.trim() : '', status, id, ownerId];
    const res = await query(text, values);
    return res.rows[0] || null;
  },

  /**
   * Delete a project owned by the user
   * @param {number|string} id
   * @param {number|string} ownerId
   * @returns {Promise<boolean>} True if deleted, false if not found
   */
  async delete(id, ownerId) {
    const text = `
      DELETE FROM projects
      WHERE id = $1 AND owner_id = $2
      RETURNING id
    `;
    const res = await query(text, [id, ownerId]);
    return res.rowCount > 0;
  },
};

module.exports = ProjectModel;
