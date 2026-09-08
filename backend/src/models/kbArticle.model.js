const { query } = require('../config/db');

/**
 * Knowledge Base Article Data Access Model
 * Team-isolated article management
 */
const KbArticleModel = {
  /**
   * Create a new article
   */
  async create({ title, content, categoryId, authorId, teamId, status = 'draft' }) {
    const text = `
      INSERT INTO kb_articles (title, content, category_id, author_id, team_id, status)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id
    `;
    const values = [
      title.trim(),
      content.trim(),
      categoryId || null,
      authorId,
      teamId || null,
      status === 'published' ? 'published' : 'draft',
    ];
    const res = await query(text, values);
    return this.findById(res.rows[0].id);
  },

  /**
   * Find articles with optional search keyword, category, status, and author visibility
   */
  async findAll({ teamId, userId, search, categoryId, status } = {}) {
    if (teamId && userId) {
      let text = `
        SELECT a.id, a.team_id, a.title, a.content, a.category_id, a.author_id, a.status,
               a.created_at, a.updated_at,
               c.name as category_name,
               u.name as author_name, u.email as author_email,
               tm.role as user_role
        FROM kb_articles a
        JOIN team_members tm ON tm.team_id = a.team_id
        LEFT JOIN kb_categories c ON a.category_id = c.id
        INNER JOIN users u ON a.author_id = u.id
        WHERE a.team_id = $1 AND tm.user_id = $2
          AND (a.status = 'published' OR a.author_id = $2 OR tm.role = 'leader')
      `;
      const values = [teamId, userId];
      let paramIndex = 3;

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
    }

    // Fallback if teamId is not provided
    let text = `
      SELECT a.id, a.team_id, a.title, a.content, a.category_id, a.author_id, a.status,
             a.created_at, a.updated_at,
             c.name as category_name,
             u.name as author_name, u.email as author_email
      FROM kb_articles a
      LEFT JOIN kb_categories c ON a.category_id = c.id
      INNER JOIN users u ON a.author_id = u.id
      WHERE (a.status = 'published' OR a.author_id = $1)
    `;
    const values = [userId || null];
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
   * Search articles within team
   */
  async search({ teamId, userId, query: searchTerm }) {
    return this.findAll({ teamId, userId, search: searchTerm });
  },

  /**
   * Find article by ID
   */
  async findById(id) {
    const text = `
      SELECT a.id, a.team_id, a.title, a.content, a.category_id, a.author_id, a.status,
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
   * Find article by ID verifying team access
   */
  async findByIdAndTeam(id, userId) {
    const text = `
      SELECT a.id, a.team_id, a.title, a.content, a.category_id, a.author_id, a.status,
             a.created_at, a.updated_at,
             c.name as category_name,
             u.name as author_name, u.email as author_email,
             tm.role as user_role
      FROM kb_articles a
      JOIN team_members tm ON tm.team_id = a.team_id
      LEFT JOIN kb_categories c ON a.category_id = c.id
      INNER JOIN users u ON a.author_id = u.id
      WHERE a.id = $1 AND tm.user_id = $2
      LIMIT 1
    `;
    const res = await query(text, [id, userId]);
    return res.rows[0] || null;
  },

  /**
   * Update article
   */
  async update({ id, title, content, categoryId, status }) {
    const text = `
      UPDATE kb_articles
      SET title = $1,
          content = $2,
          category_id = $3,
          status = $4,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $5
      RETURNING id
    `;
    const values = [
      title.trim(),
      content.trim(),
      categoryId || null,
      status === 'published' ? 'published' : 'draft',
      id,
    ];
    const res = await query(text, values);
    if (!res.rows[0]) return null;
    return this.findById(id);
  },

  /**
   * Delete article
   */
  async delete(id) {
    const text = `
      DELETE FROM kb_articles
      WHERE id = $1
      RETURNING id
    `;
    const res = await query(text, [id]);
    return res.rowCount > 0;
  },
};

module.exports = KbArticleModel;
