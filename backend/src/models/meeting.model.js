const { query } = require('../config/db');

/**
 * Meeting Data Access Model
 */
const MeetingModel = {
  /**
   * Create a new meeting and automatically add organizer as an accepted attendee
   */
  async create({ title, description, startDatetime, endDatetime, location, organizerId, status = 'scheduled' }) {
    const text = `
      INSERT INTO meetings (title, description, start_datetime, end_datetime, location, organizer_id, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id
    `;
    const values = [
      title.trim(),
      description ? description.trim() : null,
      startDatetime,
      endDatetime,
      location ? location.trim() : null,
      organizerId,
      status,
    ];
    const res = await query(text, values);
    const meetingId = res.rows[0].id;

    // Automatically add organizer as attendee with 'accepted' status
    await query(
      `INSERT INTO meeting_attendees (meeting_id, user_id, response_status)
       VALUES ($1, $2, 'accepted')
       ON CONFLICT (meeting_id, user_id) DO NOTHING`,
      [meetingId, organizerId]
    );

    return this.findById(meetingId);
  },

  /**
   * Find all meetings accessible to the user (organized or attending) with optional status filter
   * Sorted chronologically (start_datetime ASC)
   */
  async findAll({ userId, status }) {
    let text = `
      SELECT m.id, m.title, m.description, m.start_datetime, m.end_datetime,
             m.location, m.organizer_id, m.status, m.created_at, m.updated_at,
             u.name as organizer_name, u.email as organizer_email,
             COUNT(DISTINCT a.id)::int as attendee_count,
             EXISTS(
               SELECT 1 FROM meeting_attendees ma 
               WHERE ma.meeting_id = m.id AND ma.user_id = $1 AND ma.response_status = 'pending'
             ) as is_pending_for_user
      FROM meetings m
      INNER JOIN users u ON m.organizer_id = u.id
      LEFT JOIN meeting_attendees a ON m.id = a.meeting_id
      WHERE (m.organizer_id = $1 OR EXISTS (
        SELECT 1 FROM meeting_attendees ma WHERE ma.meeting_id = m.id AND ma.user_id = $1
      ))
    `;
    const values = [userId];
    let paramIndex = 2;

    if (status && status !== 'all') {
      text += ` AND m.status = $${paramIndex}`;
      values.push(status);
      paramIndex++;
    }

    text += `
      GROUP BY m.id, u.name, u.email
      ORDER BY m.start_datetime ASC
    `;

    const res = await query(text, values);
    return res.rows;
  },

  /**
   * Find single meeting by ID with attendees and minutes
   */
  async findById(id) {
    const meetingText = `
      SELECT m.id, m.title, m.description, m.start_datetime, m.end_datetime,
             m.location, m.organizer_id, m.status, m.created_at, m.updated_at,
             u.name as organizer_name, u.email as organizer_email
      FROM meetings m
      INNER JOIN users u ON m.organizer_id = u.id
      WHERE m.id = $1
      LIMIT 1
    `;
    const meetingRes = await query(meetingText, [id]);
    if (!meetingRes.rows[0]) return null;

    const meeting = meetingRes.rows[0];

    // Fetch attendees
    const attendeesText = `
      SELECT a.id, a.meeting_id, a.user_id, a.response_status, a.created_at,
             u.name, u.email
      FROM meeting_attendees a
      INNER JOIN users u ON a.user_id = u.id
      WHERE a.meeting_id = $1
      ORDER BY u.name ASC
    `;
    const attendeesRes = await query(attendeesText, [id]);
    meeting.attendees = attendeesRes.rows;

    // Fetch minutes if available
    const minutesText = `
      SELECT min.id, min.meeting_id, min.summary, min.discussion, min.decisions,
             min.action_items, min.created_by, min.created_at, min.updated_at,
             u.name as author_name, u.email as author_email
      FROM meeting_minutes min
      INNER JOIN users u ON min.created_by = u.id
      WHERE min.meeting_id = $1
      LIMIT 1
    `;
    const minutesRes = await query(minutesText, [id]);
    meeting.minutes = minutesRes.rows[0] || null;

    return meeting;
  },

  /**
   * Update meeting (organizer only)
   */
  async update({ id, organizerId, title, description, startDatetime, endDatetime, location, status }) {
    const text = `
      UPDATE meetings
      SET title = $1,
          description = $2,
          start_datetime = $3,
          end_datetime = $4,
          location = $5,
          status = $6,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $7 AND organizer_id = $8
      RETURNING id
    `;
    const values = [
      title.trim(),
      description ? description.trim() : null,
      startDatetime,
      endDatetime,
      location ? location.trim() : null,
      status || 'scheduled',
      id,
      organizerId,
    ];
    const res = await query(text, values);
    if (!res.rows[0]) return null;
    return this.findById(id);
  },

  /**
   * Delete meeting (organizer only)
   */
  async delete({ id, organizerId }) {
    const text = `
      DELETE FROM meetings
      WHERE id = $1 AND organizer_id = $2
      RETURNING id
    `;
    const res = await query(text, [id, organizerId]);
    return res.rowCount > 0;
  },
};

module.exports = MeetingModel;
