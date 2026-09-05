const { query } = require('../config/db');

/**
 * Knowledge Base Article Data Access Model
 */
const KbArticleModel = {
  /**
   * Create a new article
   */
  async create({ title, content, categoryId, authorId, status = 'draft' }) {
    const text = `
      INSERT INTO kb_articles (title, content, category_id, author_id, status)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id
    `;
    const values = [
      title.trim(),
      content.trim(),
      categoryId || null,
      authorId,
      status === 'published' ? 'published' : 'draft',
    ];
    const res = await query(text, values);
    return this.findById(res.rows[0].id);
  },

  /**
   * Find articles with optional search keyword, category, status, and author visibility
   */
  async findAll({ userId, search, categoryId, status }) {
    let text = `
      SELECT a.id, a.title, a.content, a.category_id, a.author_id, a.status,
             a.created_at, a.updated_at,
             c.name as category_name,
             u.name as author_name, u.email as author_email
      FROM kb_articles a
      LEFT JOIN kb_categories c ON a.category_id = c.id
      INNER JOIN users u ON a.author_id = u.id
      WHERE (a.status = 'published' OR a.author_id = $1)
    `;
    const values = [userId];
    let paramIndex = 2;

    if (categoryId && categoryId !== 'all') {
      text += ` AND a.category_id = $${paramIndex}`;
      values.push(parseInt(categoryId, 10));
      paramIndex++;
    }

    if (status && status !== 'all') {
      text += ` AND a.status = $${paramIndex}`;
      values.push(status);
      paramIndex++;
    }

    if (search && search.trim()) {
      text += ` AND (a.title ILIKE $${paramIndex} OR a.content ILIKE $${paramIndex})`;
      values.push(`%${search.trim()}%`);
      paramIndex++;
    }

    text += ` ORDER BY a.updated_at DESC`;

    const res = await query(text, values);
    return res.rows;
  },

  /**
   * Find article by ID
   */
  async findById(id) {
    const text = `
      SELECT a.id, a.title, a.content, a.category_id, a.author_id, a.status,
             a.created_at, a.updated_at,
             c.name as category_name,
             u.name as author_name, u.email as author_email
      FROM kb_articles a
      LEFT JOIN kb_categories c ON a.category_id = c.id
      INNER JOIN users u ON a.author_id = u.id
      WHERE a.id = $1
      LIMIT 1
    `;
    const res = await query(text, [id]);
    return res.rows[0] || null;
  },

  /**
   * Update article (author only)
   */
  async update({ id, authorId, title, content, categoryId, status }) {
    const text = `
      UPDATE kb_articles
      SET title = $1,
          content = $2,
          category_id = $3,
          status = $4,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $5 AND author_id = $6
      RETURNING id
    `;
    const values = [
      title.trim(),
      content.trim(),
      categoryId || null,
      status === 'published' ? 'published' : 'draft',
      id,
      authorId,
    ];
    const res = await query(text, values);
    if (!res.rows[0]) return null;
    return this.findById(id);
  },

  /**
   * Delete article (author only)
   */
  async delete({ id, authorId }) {
    const text = `
      DELETE FROM kb_articles
      WHERE id = $1 AND author_id = $2
      RETURNING id
    `;
    const res = await query(text, [id, authorId]);
    return res.rowCount > 0;
  },
};

module.exports = KbArticleModel;
