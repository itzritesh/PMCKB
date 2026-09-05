const { query } = require('../config/db');

/**
 * Meeting Attendee Data Access Model
 */
const MeetingAttendeeModel = {
  /**
   * Add attendee to meeting
   */
  async addAttendee({ meetingId, userId, responseStatus = 'pending' }) {
    const text = `
      INSERT INTO meeting_attendees (meeting_id, user_id, response_status)
      VALUES ($1, $2, $3)
      ON CONFLICT (meeting_id, user_id) DO NOTHING
      RETURNING id, meeting_id, user_id, response_status, created_at
    `;
    const res = await query(text, [meetingId, userId, responseStatus]);
    if (!res.rows[0]) {
      return null; // Already exists
    }

    // Join user details
    const attendeeRes = await query(`
      SELECT a.id, a.meeting_id, a.user_id, a.response_status, a.created_at,
             u.name, u.email
      FROM meeting_attendees a
      INNER JOIN users u ON a.user_id = u.id
      WHERE a.id = $1
    `, [res.rows[0].id]);

    return attendeeRes.rows[0];
  },

  /**
   * Get all attendees for a meeting
   */
  async getAttendees(meetingId) {
    const text = `
      SELECT a.id, a.meeting_id, a.user_id, a.response_status, a.created_at,
             u.name, u.email
      FROM meeting_attendees a
      INNER JOIN users u ON a.user_id = u.id
      WHERE a.meeting_id = $1
      ORDER BY u.name ASC
    `;
    const res = await query(text, [meetingId]);
    return res.rows;
  },

  /**
   * Update attendee response status
   */
  async updateResponse({ meetingId, userId, responseStatus }) {
    const text = `
      UPDATE meeting_attendees
      SET response_status = $1
      WHERE meeting_id = $2 AND user_id = $3
      RETURNING id, meeting_id, user_id, response_status, created_at
    `;
    const res = await query(text, [responseStatus, meetingId, userId]);
    if (!res.rows[0]) return null;

    const attendeeRes = await query(`
      SELECT a.id, a.meeting_id, a.user_id, a.response_status, a.created_at,
             u.name, u.email
      FROM meeting_attendees a
      INNER JOIN users u ON a.user_id = u.id
      WHERE a.id = $1
    `, [res.rows[0].id]);

    return attendeeRes.rows[0];
  },

  /**
   * Remove attendee from meeting
   */
  async removeAttendee({ meetingId, userId }) {
    const text = `
      DELETE FROM meeting_attendees
      WHERE meeting_id = $1 AND user_id = $2
      RETURNING id
    `;
    const res = await query(text, [meetingId, userId]);
    return res.rowCount > 0;
  },
};

module.exports = MeetingAttendeeModel;
