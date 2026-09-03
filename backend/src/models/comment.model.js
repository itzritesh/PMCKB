const { query } = require('../config/db');

/**
 * Task Comment Data Access Model
 * Enforces author-only modifications and joins user profile metadata.
 */
const CommentModel = {
  /**
   * Create a new comment on a task
   * @param {object} params
   * @param {number|string} params.taskId
   * @param {number|string} params.userId
   * @param {string} params.comment
   * @returns {Promise<object>} Created comment with author details
   */
  async create({ taskId, userId, comment }) {
    const text = `
      INSERT INTO task_comments (task_id, user_id, comment)
      VALUES ($1, $2, $3)
      RETURNING id
    `;
    const values = [taskId, userId, comment.trim()];
    const res = await query(text, values);
    return this.findById(res.rows[0].id);
  },

  /**
   * Find all comments for a specific task
   * @param {number|string} taskId
   * @returns {Promise<Array<object>>}
   */
  async findAllByTask(taskId) {
    const text = `
      SELECT c.id, c.task_id, c.user_id, c.comment, c.created_at, c.updated_at,
             u.name as user_name, u.email as user_email
      FROM task_comments c
      INNER JOIN users u ON c.user_id = u.id
      WHERE c.task_id = $1
      ORDER BY c.created_at ASC
    `;
    const res = await query(text, [taskId]);
    return res.rows;
  },

  /**
   * Find a single comment by ID
   * @param {number|string} id
   * @returns {Promise<object|null>}
   */
  async findById(id) {
    const text = `
      SELECT c.id, c.task_id, c.user_id, c.comment, c.created_at, c.updated_at,
             u.name as user_name, u.email as user_email
      FROM task_comments c
      INNER JOIN users u ON c.user_id = u.id
      WHERE c.id = $1
      LIMIT 1
    `;
    const res = await query(text, [id]);
    return res.rows[0] || null;
  },

  /**
   * Update a comment ensuring user is the author
   * @param {object} params
   * @param {number|string} params.id
   * @param {number|string} params.userId
   * @param {string} params.comment
   * @returns {Promise<object|null>}
   */
  async update({ id, userId, comment }) {
    const text = `
      UPDATE task_comments
      SET comment = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2 AND user_id = $3
      RETURNING id
    `;
    const values = [comment.trim(), id, userId];
    const res = await query(text, values);
    if (!res.rows[0]) return null;
    return this.findById(id);
  },

  /**
   * Delete a comment ensuring user is the author
   * @param {object} params
   * @param {number|string} params.id
   * @param {number|string} params.userId
   * @returns {Promise<boolean>}
   */
  async delete({ id, userId }) {
    const text = `
      DELETE FROM task_comments
      WHERE id = $1 AND user_id = $2
      RETURNING id
    `;
    const res = await query(text, [id, userId]);
    return res.rowCount > 0;
  },
};

module.exports = CommentModel;
