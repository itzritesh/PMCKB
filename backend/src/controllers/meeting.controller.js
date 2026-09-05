const { MeetingModel, MeetingAttendeeModel, MeetingMinutesModel } = require('../models');
const { query } = require('../config/db');
const { sendSuccess, sendError } = require('../utils/response');

/**
 * Meetings Controller
 * Manages meetings, attendees, and meeting minutes.
 */
const MeetingController = {
  // ==========================================
  // 1. MEETINGS CRUD
  // ==========================================

  async createMeeting(req, res, next) {
    try {
      const { title, description, start_datetime, end_datetime, location, status } = req.body;

      if (!title || typeof title !== 'string' || !title.trim()) {
        return sendError(res, 'Meeting title is required.', 400);
      }

      if (!start_datetime) {
        return sendError(res, 'Start date and time is required.', 400);
      }

      if (!end_datetime) {
        return sendError(res, 'End date and time is required.', 400);
      }

      const startDate = new Date(start_datetime);
      const endDate = new Date(end_datetime);

      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        return sendError(res, 'Invalid start or end date/time format.', 400);
      }

      if (endDate < startDate) {
        return sendError(res, 'End date and time must not be before start date and time.', 400);
      }

      const validStatuses = ['scheduled', 'completed', 'cancelled'];
      const meetingStatus = status && validStatuses.includes(status) ? status : 'scheduled';

      const meeting = await MeetingModel.create({
        title: title.trim(),
        description: description ? description.trim() : null,
        startDatetime: startDate.toISOString(),
        endDatetime: endDate.toISOString(),
        location: location ? location.trim() : null,
        organizerId: req.user.id,
        status: meetingStatus,
      });

      return sendSuccess(res, { meeting }, 'Meeting scheduled successfully', 201);
    } catch (error) {
      next(error);
    }
  },

  async getMeetings(req, res, next) {
    try {
      const { status } = req.query;
      const meetings = await MeetingModel.findAll({
        userId: req.user.id,
        status,
      });
      return sendSuccess(res, { meetings, total: meetings.length }, 'Meetings retrieved successfully');
    } catch (error) {
      next(error);
    }
  },

  async getMeetingById(req, res, next) {
    try {
      const { id } = req.params;
      const meetingId = parseInt(id, 10);

      if (isNaN(meetingId)) {
        return sendError(res, 'Invalid meeting ID format.', 400);
      }

      const meeting = await MeetingModel.findById(meetingId);
      if (!meeting) {
        return sendError(res, 'Meeting not found.', 404);
      }

      return sendSuccess(res, { meeting }, 'Meeting details retrieved successfully');
    } catch (error) {
      next(error);
    }
  },

  async updateMeeting(req, res, next) {
    try {
      const { id } = req.params;
      const meetingId = parseInt(id, 10);

      if (isNaN(meetingId)) {
        return sendError(res, 'Invalid meeting ID format.', 400);
      }

      const existing = await MeetingModel.findById(meetingId);
      if (!existing) {
        return sendError(res, 'Meeting not found.', 404);
      }

      if (existing.organizer_id !== req.user.id) {
        return sendError(res, 'Only the organizer can modify this meeting.', 403);
      }

      const { title, description, start_datetime, end_datetime, location, status } = req.body;

      if (!title || typeof title !== 'string' || !title.trim()) {
        return sendError(res, 'Meeting title is required.', 400);
      }

      const start = start_datetime || existing.start_datetime;
      const end = end_datetime || existing.end_datetime;

      const startDate = new Date(start);
      const endDate = new Date(end);

      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        return sendError(res, 'Invalid start or end date format.', 400);
      }

      if (endDate < startDate) {
        return sendError(res, 'End date and time must not be before start date and time.', 400);
      }

      const validStatuses = ['scheduled', 'completed', 'cancelled'];
      const meetingStatus = status && validStatuses.includes(status) ? status : existing.status;

      const updated = await MeetingModel.update({
        id: meetingId,
        organizerId: req.user.id,
        title: title.trim(),
        description: description !== undefined ? (description ? description.trim() : null) : existing.description,
        startDatetime: startDate.toISOString(),
        endDatetime: endDate.toISOString(),
        location: location !== undefined ? (location ? location.trim() : null) : existing.location,
        status: meetingStatus,
      });

      return sendSuccess(res, { meeting: updated }, 'Meeting updated successfully');
    } catch (error) {
      next(error);
    }
  },

  async deleteMeeting(req, res, next) {
    try {
      const { id } = req.params;
      const meetingId = parseInt(id, 10);

      if (isNaN(meetingId)) {
        return sendError(res, 'Invalid meeting ID format.', 400);
      }

      const existing = await MeetingModel.findById(meetingId);
      if (!existing) {
        return sendError(res, 'Meeting not found.', 404);
      }

      if (existing.organizer_id !== req.user.id) {
        return sendError(res, 'Only the organizer can delete this meeting.', 403);
      }

      const deleted = await MeetingModel.delete({ id: meetingId, organizerId: req.user.id });
      if (!deleted) {
        return sendError(res, 'Failed to delete meeting.', 500);
      }

      return sendSuccess(res, { id: meetingId }, 'Meeting deleted successfully');
    } catch (error) {
      next(error);
    }
  },

  // ==========================================
  // 2. MEETING ATTENDEES
  // ==========================================

  async addAttendee(req, res, next) {
    try {
      const { meetingId } = req.params;
      const mid = parseInt(meetingId, 10);

      if (isNaN(mid)) {
        return sendError(res, 'Invalid meeting ID format.', 400);
      }

      const meeting = await MeetingModel.findById(mid);
      if (!meeting) {
        return sendError(res, 'Meeting not found.', 404);
      }

      const rawUserId = req.body.userId !== undefined ? req.body.userId : req.body.user_id;
      const targetUserId = parseInt(rawUserId, 10);

      if (isNaN(targetUserId)) {
        return sendError(res, 'Invalid attendee user ID.', 400);
      }

      // Check user exists
      const userRes = await query('SELECT id FROM users WHERE id = $1', [targetUserId]);
      if (!userRes.rows[0]) {
        return sendError(res, 'Selected user does not exist.', 404);
      }

      const validStatuses = ['pending', 'accepted', 'declined'];
      const rawStatus = req.body.responseStatus || req.body.response_status;
      const status = rawStatus && validStatuses.includes(rawStatus) ? rawStatus : 'pending';

      const attendee = await MeetingAttendeeModel.addAttendee({
        meetingId: mid,
        userId: targetUserId,
        responseStatus: status,
      });

      if (!attendee) {
        return sendError(res, 'User is already an attendee of this meeting.', 409);
      }

      return sendSuccess(res, { attendee }, 'Attendee added successfully', 201);
    } catch (error) {
      next(error);
    }
  },

  async getAttendees(req, res, next) {
    try {
      const { meetingId } = req.params;
      const mid = parseInt(meetingId, 10);

      if (isNaN(mid)) {
        return sendError(res, 'Invalid meeting ID format.', 400);
      }

      const attendees = await MeetingAttendeeModel.getAttendees(mid);
      return sendSuccess(res, { attendees, total: attendees.length }, 'Attendees retrieved successfully');
    } catch (error) {
      next(error);
    }
  },

  async updateAttendeeResponse(req, res, next) {
    try {
      const { meetingId, userId } = req.params;
      const mid = parseInt(meetingId, 10);
      const uid = parseInt(userId, 10);

      if (isNaN(mid) || isNaN(uid)) {
        return sendError(res, 'Invalid meeting or user ID format.', 400);
      }

      const meeting = await MeetingModel.findById(mid);
      if (!meeting) {
        return sendError(res, 'Meeting not found.', 404);
      }

      // Authorization: user can update own RSVP, or organizer can update
      if (req.user.id !== uid && req.user.id !== meeting.organizer_id) {
        return sendError(res, 'You can only update your own attendance status.', 403);
      }

      const rawStatus = req.body.responseStatus || req.body.response_status;
      const validStatuses = ['pending', 'accepted', 'declined'];
      if (!rawStatus || !validStatuses.includes(rawStatus)) {
        return sendError(res, 'Valid response status is required (pending, accepted, declined).', 400);
      }

      const updated = await MeetingAttendeeModel.updateResponse({
        meetingId: mid,
        userId: uid,
        responseStatus: rawStatus,
      });

      if (!updated) {
        return sendError(res, 'Attendee record not found.', 404);
      }

      return sendSuccess(res, { attendee: updated }, 'Attendance response updated successfully');
    } catch (error) {
      next(error);
    }
  },

  async removeAttendee(req, res, next) {
    try {
      const { meetingId, userId } = req.params;
      const mid = parseInt(meetingId, 10);
      const uid = parseInt(userId, 10);

      if (isNaN(mid) || isNaN(uid)) {
        return sendError(res, 'Invalid meeting or user ID format.', 400);
      }

      const meeting = await MeetingModel.findById(mid);
      if (!meeting) {
        return sendError(res, 'Meeting not found.', 404);
      }

      // Authorization: user can remove themselves, or organizer can remove attendees
      if (req.user.id !== uid && req.user.id !== meeting.organizer_id) {
        return sendError(res, 'You are not authorized to remove this attendee.', 403);
      }

      const removed = await MeetingAttendeeModel.removeAttendee({ meetingId: mid, userId: uid });
      if (!removed) {
        return sendError(res, 'Attendee record not found.', 404);
      }

      return sendSuccess(res, { meetingId: mid, userId: uid }, 'Attendee removed successfully');
    } catch (error) {
      next(error);
    }
  },

  // ==========================================
  // 3. MEETING MINUTES
  // ==========================================

  async createMinutes(req, res, next) {
    try {
      const { meetingId } = req.params;
      const mid = parseInt(meetingId, 10);

      if (isNaN(mid)) {
        return sendError(res, 'Invalid meeting ID format.', 400);
      }

      const meeting = await MeetingModel.findById(mid);
      if (!meeting) {
        return sendError(res, 'Meeting not found.', 404);
      }

      // Check if minutes already exist
      const existingMinutes = await MeetingMinutesModel.findByMeetingId(mid);
      if (existingMinutes) {
        return sendError(res, 'Minutes already exist for this meeting. Please update the existing record.', 409);
      }

      const { summary, discussion, decisions, action_items } = req.body;

      const minutes = await MeetingMinutesModel.create({
        meetingId: mid,
        summary,
        discussion,
        decisions,
        actionItems: action_items,
        createdBy: req.user.id,
      });

      return sendSuccess(res, { minutes }, 'Meeting minutes recorded successfully', 201);
    } catch (error) {
      next(error);
    }
  },

  async getMinutes(req, res, next) {
    try {
      const { meetingId } = req.params;
      const mid = parseInt(meetingId, 10);

      if (isNaN(mid)) {
        return sendError(res, 'Invalid meeting ID format.', 400);
      }

      const minutes = await MeetingMinutesModel.findByMeetingId(mid);
      if (!minutes) {
        return sendError(res, 'No minutes recorded for this meeting.', 404);
      }

      return sendSuccess(res, { minutes }, 'Meeting minutes retrieved successfully');
    } catch (error) {
      next(error);
    }
  },

  async updateMinutes(req, res, next) {
    try {
      const { meetingId } = req.params;
      const mid = parseInt(meetingId, 10);

      if (isNaN(mid)) {
        return sendError(res, 'Invalid meeting ID format.', 400);
      }

      const existing = await MeetingMinutesModel.findByMeetingId(mid);
      if (!existing) {
        return sendError(res, 'Meeting minutes not found.', 404);
      }

      const { summary, discussion, decisions, action_items } = req.body;

      const updated = await MeetingMinutesModel.update({
        meetingId: mid,
        summary,
        discussion,
        decisions,
        actionItems: action_items,
      });

      return sendSuccess(res, { minutes: updated }, 'Meeting minutes updated successfully');
    } catch (error) {
      next(error);
    }
  },

  async deleteMinutes(req, res, next) {
    try {
      const { meetingId } = req.params;
      const mid = parseInt(meetingId, 10);

      if (isNaN(mid)) {
        return sendError(res, 'Invalid meeting ID format.', 400);
      }

      const existing = await MeetingMinutesModel.findByMeetingId(mid);
      if (!existing) {
        return sendError(res, 'Meeting minutes not found.', 404);
      }

      const deleted = await MeetingMinutesModel.delete(mid);
      if (!deleted) {
        return sendError(res, 'Failed to delete meeting minutes.', 500);
      }

      return sendSuccess(res, { meetingId: mid }, 'Meeting minutes deleted successfully');
    } catch (error) {
      next(error);
    }
  },
};

module.exports = MeetingController;
