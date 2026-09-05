const { query } = require('../config/db');

/**
 * Knowledge Base Category Data Access Model
 */
const KbCategoryModel = {
  /**
   * Create a new category
   */
  async create({ name, description, createdBy }) {
    const text = `
      INSERT INTO kb_categories (name, description, created_by)
      VALUES ($1, $2, $3)
      RETURNING id
    `;
    const values = [name.trim(), description ? description.trim() : null, createdBy];
    const res = await query(text, values);
    return this.findById(res.rows[0].id);
  },

  /**
   * Find all categories with article count
   */
  async findAll() {
    const text = `
      SELECT c.id, c.name, c.description, c.created_by, c.created_at,
             COUNT(a.id)::int as article_count
      FROM kb_categories c
      LEFT JOIN kb_articles a ON c.id = a.category_id
      GROUP BY c.id
      ORDER BY c.name ASC
    `;
    const res = await query(text);
    return res.rows;
  },

  /**
   * Find category by ID
   */
  async findById(id) {
    const text = `
      SELECT c.id, c.name, c.description, c.created_by, c.created_at,
             COUNT(a.id)::int as article_count
      FROM kb_categories c
      LEFT JOIN kb_articles a ON c.id = a.category_id
      WHERE c.id = $1
      GROUP BY c.id
      LIMIT 1
    `;
    const res = await query(text, [id]);
    return res.rows[0] || null;
  },

  /**
   * Find category by name (for duplicate detection)
   */
  async findByName(name) {
    const text = `
      SELECT id, name FROM kb_categories
      WHERE LOWER(name) = LOWER($1)
      LIMIT 1
    `;
    const res = await query(text, [name.trim()]);
    return res.rows[0] || null;
  },

  /**
   * Update category
   */
  async update({ id, name, description }) {
    const text = `
      UPDATE kb_categories
      SET name = $1, description = $2
      WHERE id = $3
      RETURNING id
    `;
    const values = [name.trim(), description !== undefined ? (description ? description.trim() : null) : null, id];
    const res = await query(text, values);
    if (!res.rows[0]) return null;
    return this.findById(id);
  },

  /**
   * Count articles in category
   */
  async countArticles(categoryId) {
    const res = await query('SELECT COUNT(*)::int as count FROM kb_articles WHERE category_id = $1', [categoryId]);
    return res.rows[0]?.count || 0;
  },

  /**
   * Delete category
   */
  async delete(id) {
    const text = `
      DELETE FROM kb_categories
      WHERE id = $1
      RETURNING id
    `;
    const res = await query(text, [id]);
    return res.rowCount > 0;
  },
};

module.exports = KbCategoryModel;
