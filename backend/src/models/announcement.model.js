const { query } = require('../config/db');

/**
 * Announcement Data Access Model
 * Manages team announcements in PostgreSQL
 */
const AnnouncementModel = {
  /**
   * Create an announcement for a team
   */
  async create({ teamId, title, message, createdBy }) {
    const text = `
      INSERT INTO announcements (team_id, title, message, created_by)
      VALUES ($1, $2, $3, $4)
      RETURNING id, team_id, title, message, created_by, created_at, updated_at
    `;
    const values = [teamId, title.trim(), message.trim(), createdBy];
    const res = await query(text, values);
    return res.rows[0];
  },

  /**
   * Find all announcements for a team ensuring user has membership
   */
  async findAllByTeam({ teamId, userId }) {
    const text = `
      SELECT 
        a.id, 
        a.team_id, 
        a.title, 
        a.message, 
        a.created_by, 
        a.created_at, 
        a.updated_at,
        u.name AS creator_name,
        u.email AS creator_email,
        tm.role AS user_role
      FROM announcements a
      JOIN team_members tm ON tm.team_id = a.team_id
      JOIN users u ON u.id = a.created_by
      WHERE a.team_id = $1 AND tm.user_id = $2
      ORDER BY a.created_at DESC
    `;
    const res = await query(text, [teamId, userId]);
    return res.rows;
  },

  /**
   * Find an announcement by ID ensuring user belongs to its team
   */
  async findByIdAndTeam(id, userId) {
    const text = `
      SELECT 
        a.id, 
        a.team_id, 
        a.title, 
        a.message, 
        a.created_by, 
        a.created_at, 
        a.updated_at,
        u.name AS creator_name,
        u.email AS creator_email,
        tm.role AS user_role
      FROM announcements a
      JOIN team_members tm ON tm.team_id = a.team_id
      JOIN users u ON u.id = a.created_by
      WHERE a.id = $1 AND tm.user_id = $2
      LIMIT 1
    `;
    const res = await query(text, [id, userId]);
    return res.rows[0] || null;
  },

  /**
   * Update announcement
   */
  async update({ id, teamId, title, message }) {
    const text = `
      UPDATE announcements
      SET title = $1,
          message = $2,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $3 AND team_id = $4
      RETURNING id, team_id, title, message, created_by, created_at, updated_at
    `;
    const values = [title.trim(), message.trim(), id, teamId];
    const res = await query(text, values);
    return res.rows[0] || null;
  },

  /**
   * Delete announcement
   */
  async delete(id, teamId) {
    const text = `
      DELETE FROM announcements
      WHERE id = $1 AND team_id = $2
      RETURNING id
    `;
    const res = await query(text, [id, teamId]);
    return res.rowCount > 0;
  },
};

module.exports = AnnouncementModel;
