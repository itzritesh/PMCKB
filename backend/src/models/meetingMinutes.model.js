const { query } = require('../config/db');

/**
 * Meeting Minutes Data Access Model
 */
const MeetingMinutesModel = {
  /**
   * Create minutes for a meeting (1:1 relationship)
   */
  async create({ meetingId, summary, discussion, decisions, actionItems, createdBy }) {
    const text = `
      INSERT INTO meeting_minutes (meeting_id, summary, discussion, decisions, action_items, created_by)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id
    `;
    const values = [
      meetingId,
      summary ? summary.trim() : null,
      discussion ? discussion.trim() : null,
      decisions ? decisions.trim() : null,
      actionItems ? actionItems.trim() : null,
      createdBy,
    ];
    const res = await query(text, values);
    return this.findById(res.rows[0].id);
  },

  /**
   * Find minutes by meeting ID
   */
  async findByMeetingId(meetingId) {
    const text = `
      SELECT m.id, m.meeting_id, m.summary, m.discussion, m.decisions,
             m.action_items, m.created_by, m.created_at, m.updated_at,
             u.name as author_name, u.email as author_email
      FROM meeting_minutes m
      INNER JOIN users u ON m.created_by = u.id
      WHERE m.meeting_id = $1
      LIMIT 1
    `;
    const res = await query(text, [meetingId]);
    return res.rows[0] || null;
  },

  /**
   * Find minutes by ID
   */
  async findById(id) {
    const text = `
      SELECT m.id, m.meeting_id, m.summary, m.discussion, m.decisions,
             m.action_items, m.created_by, m.created_at, m.updated_at,
             u.name as author_name, u.email as author_email
      FROM meeting_minutes m
      INNER JOIN users u ON m.created_by = u.id
      WHERE m.id = $1
      LIMIT 1
    `;
    const res = await query(text, [id]);
    return res.rows[0] || null;
  },

  /**
   * Update minutes
   */
  async update({ meetingId, summary, discussion, decisions, actionItems }) {
    const text = `
      UPDATE meeting_minutes
      SET summary = $1,
          discussion = $2,
          decisions = $3,
          action_items = $4,
          updated_at = CURRENT_TIMESTAMP
      WHERE meeting_id = $5
      RETURNING id
    `;
    const values = [
      summary !== undefined ? (summary ? summary.trim() : null) : null,
      discussion !== undefined ? (discussion ? discussion.trim() : null) : null,
      decisions !== undefined ? (decisions ? decisions.trim() : null) : null,
      actionItems !== undefined ? (actionItems ? actionItems.trim() : null) : null,
      meetingId,
    ];
    const res = await query(text, values);
    if (!res.rows[0]) return null;
    return this.findById(res.rows[0].id);
  },

  /**
   * Delete minutes
   */
  async delete(meetingId) {
    const text = `
      DELETE FROM meeting_minutes
      WHERE meeting_id = $1
      RETURNING id
    `;
    const res = await query(text, [meetingId]);
    return res.rowCount > 0;
  },
};

module.exports = MeetingMinutesModel;
