const { query } = require('../config/db');

/**
 * User Data Access Model
 */
const UserModel = {
  /**
   * Find a user by their email address (includes password for credential check)
   * @param {string} email
   * @returns {Promise<object|null>}
   */
  async findByEmail(email) {
    const text = 'SELECT id, name, email, password, created_at FROM users WHERE LOWER(email) = LOWER($1) LIMIT 1';
    const res = await query(text, [email.trim()]);
    return res.rows[0] || null;
  },

  /**
   * Find a user by their unique primary key ID (excludes password)
   * @param {number|string} id
   * @returns {Promise<object|null>}
   */
  async findById(id) {
    const text = 'SELECT id, name, email, created_at FROM users WHERE id = $1 LIMIT 1';
    const res = await query(text, [id]);
    return res.rows[0] || null;
  },

  /**
   * Find all registered users (excludes passwords)
   * @returns {Promise<Array<object>>}
   */
  async findAllUsers() {
    const text = 'SELECT id, name, email, created_at FROM users ORDER BY name ASC';
    const res = await query(text);
    return res.rows;
  },

  /**
   * Create a new user record
   * @param {object} params
   * @param {string} params.name
   * @param {string} params.email
   * @param {string} params.passwordHash
   * @returns {Promise<object>} Created user (excluding password)
   */
  async create({ name, email, passwordHash }) {
    const text = `
      INSERT INTO users (name, email, password)
      VALUES ($1, $2, $3)
      RETURNING id, name, email, created_at
    `;
    const values = [name.trim(), email.trim().toLowerCase(), passwordHash];
    const res = await query(text, values);
    return res.rows[0];
  },
};

module.exports = UserModel;
