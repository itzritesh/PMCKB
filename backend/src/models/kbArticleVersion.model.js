const { query } = require('../config/db');

/**
 * Knowledge Base Article Version Data Access Model
 * Full-snapshot immutable history tracking for KB articles
 */
const KbArticleVersionModel = {
  /**
   * Insert a new version snapshot
   */
  async create({
    articleId,
    teamId,
    versionNumber,
    title,
    content,
    categoryId,
    status = 'draft',
    createdBy,
    changeSummary = null,
  }) {
    const text = `
      INSERT INTO kb_article_versions (
        article_id, team_id, version_number, title, content, category_id, status, created_by, change_summary, created_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, CURRENT_TIMESTAMP)
      RETURNING *
    `;
    const values = [
      articleId,
      teamId,
      versionNumber,
      title.trim(),
      content.trim(),
      categoryId || null,
      status === 'published' ? 'published' : 'draft',
      createdBy,
      changeSummary ? changeSummary.trim() : null,
    ];
    const res = await query(text, values);
    return res.rows[0];
  },

  /**
   * Determine next version number for an article (starts at 1)
   */
  async getNextVersionNumber(articleId) {
    const text = `
      SELECT COALESCE(MAX(version_number), 0) + 1 AS next_version
      FROM kb_article_versions
      WHERE article_id = $1
    `;
    const res = await query(text, [articleId]);
    return parseInt(res.rows[0].next_version, 10);
  },

  /**
   * Retrieve all versions for an article, ordered newest first
   */
  async findAllByArticleId(articleId, teamId) {
    let text = `
      SELECT v.id, v.article_id, v.team_id, v.version_number, v.title, v.content,
             v.category_id, v.status, v.created_by, v.created_at, v.change_summary,
             c.name AS category_name,
             u.name AS author_name, u.email AS author_email
      FROM kb_article_versions v
      LEFT JOIN kb_categories c ON v.category_id = c.id
      INNER JOIN users u ON v.created_by = u.id
      WHERE v.article_id = $1
    `;
    const values = [articleId];

    if (teamId) {
      text += ` AND v.team_id = $2`;
      values.push(teamId);
    }

    text += ` ORDER BY v.version_number DESC`;
    const res = await query(text, values);
    return res.rows;
  },

  /**
   * Retrieve a specific version snapshot
   */
  async findByVersionNumber(articleId, versionNumber, teamId) {
    let text = `
      SELECT v.id, v.article_id, v.team_id, v.version_number, v.title, v.content,
             v.category_id, v.status, v.created_by, v.created_at, v.change_summary,
             c.name AS category_name,
             u.name AS author_name, u.email AS author_email
      FROM kb_article_versions v
      LEFT JOIN kb_categories c ON v.category_id = c.id
      INNER JOIN users u ON v.created_by = u.id
      WHERE v.article_id = $1 AND v.version_number = $2
    `;
    const values = [articleId, versionNumber];

    if (teamId) {
      text += ` AND v.team_id = $3`;
      values.push(teamId);
    }

    text += ` LIMIT 1`;
    const res = await query(text, values);
    return res.rows[0] || null;
  },

  /**
   * Retrieve the latest version snapshot
   */
  async findLatestByArticleId(articleId, teamId) {
    let text = `
      SELECT v.id, v.article_id, v.team_id, v.version_number, v.title, v.content,
             v.category_id, v.status, v.created_by, v.created_at, v.change_summary,
             c.name AS category_name,
             u.name AS author_name, u.email AS author_email
      FROM kb_article_versions v
      LEFT JOIN kb_categories c ON v.category_id = c.id
      INNER JOIN users u ON v.created_by = u.id
      WHERE v.article_id = $1
    `;
    const values = [articleId];

    if (teamId) {
      text += ` AND v.team_id = $2`;
      values.push(teamId);
    }

    text += ` ORDER BY v.version_number DESC LIMIT 1`;
    const res = await query(text, values);
    return res.rows[0] || null;
  },
};

module.exports = KbArticleVersionModel;
