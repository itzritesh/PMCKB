const { MeetingModel, MeetingAttendeeModel, MeetingMinutesModel, TeamMemberModel } = require('../models');
const { query } = require('../config/db');
const { sendSuccess, sendError } = require('../utils/response');

/**
 * Meetings Controller
 * Manages meetings, attendees, and meeting minutes with workspace isolation.
 */
const MeetingController = {
  // ==========================================
  // 1. MEETINGS CRUD
  // ==========================================

  async createMeeting(req, res, next) {
    try {
      if (req.teamRole !== 'leader') {
        return sendError(res, 'Access denied. Only team leaders can schedule meetings.', 403);
      }

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
        teamId: req.teamId,
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
        teamId: req.teamId,
        userId: req.user.id,
        status,
      });

      return sendSuccess(
        res,
        {
          meetings,
          total: meetings.length,
          teamId: req.teamId,
        },
        'Meetings fetched successfully'
      );
    } catch (error) {
      next(error);
    }
  },

  async getMeetingById(req, res, next) {
    try {
      const attendees = await MeetingAttendeeModel.findAllByMeeting(req.resource.id);
      const minutes = await MeetingMinutesModel.findByMeetingId(req.resource.id);

      const meetingData = {
        ...req.resource,
        attendees,
        minutes: minutes || null,
      };

      return sendSuccess(res, { meeting: meetingData }, 'Meeting retrieved successfully');
    } catch (error) {
      next(error);
    }
  },

  async updateMeeting(req, res, next) {
    try {
      const { title, description, start_datetime, end_datetime, location, status } = req.body;

      if (!title || typeof title !== 'string' || !title.trim()) {
        return sendError(res, 'Meeting title is required.', 400);
      }

      const startDate = start_datetime ? new Date(start_datetime) : new Date(req.resource.start_datetime);
      const endDate = end_datetime ? new Date(end_datetime) : new Date(req.resource.end_datetime);

      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        return sendError(res, 'Invalid start or end date/time format.', 400);
      }

      if (endDate < startDate) {
        return sendError(res, 'End date and time must not be before start date and time.', 400);
      }

      // Permissions: Team Leader
      if (req.teamRole !== 'leader') {
        return sendError(res, 'Access denied. Only team leaders can update meetings.', 403);
      }

      const validStatuses = ['scheduled', 'completed', 'cancelled'];
      const meetingStatus = status && validStatuses.includes(status) ? status : req.resource.status;

      const updated = await MeetingModel.update({
        id: req.resource.id,
        title: title.trim(),
        description: description !== undefined ? (description ? description.trim() : null) : req.resource.description,
        startDatetime: startDate.toISOString(),
        endDatetime: endDate.toISOString(),
        location: location !== undefined ? (location ? location.trim() : null) : req.resource.location,
        status: meetingStatus,
      });

      return sendSuccess(res, { meeting: updated }, 'Meeting updated successfully');
    } catch (error) {
      next(error);
    }
  },

  async deleteMeeting(req, res, next) {
    try {
      if (req.teamRole !== 'leader') {
        return sendError(res, 'Access denied. Only team leaders can delete meetings.', 403);
      }

      await MeetingModel.delete(req.resource.id);
      return sendSuccess(res, { id: req.resource.id }, 'Meeting deleted successfully');
    } catch (error) {
      next(error);
    }
  },

  // ==========================================
  // 2. MEETING ATTENDEES
  // ==========================================

  async addAttendee(req, res, next) {
    try {
      if (req.teamRole !== 'leader') {
        return sendError(res, 'Access denied. Only team leaders can manage attendees.', 403);
      }

      const mid = req.resource.id;
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

      // Ensure attendee is a member of the meeting's workspace (Cross-team defense)
      const membership = await TeamMemberModel.findByTeamAndUser(req.resource.team_id, targetUserId);
      if (!membership) {
        return sendError(res, 'Target attendee must belong to the same team as the meeting. Cross-team attendees are not allowed.', 400);
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

      return sendSuccess(res, { attendee }, 'Attendee added to meeting successfully', 201);
    } catch (error) {
      if (error.code === '23505') {
        return sendError(res, 'User is already an attendee of this meeting.', 409);
      }
      next(error);
    }
  },

  async updateAttendeeResponse(req, res, next) {
    try {
      const mid = req.resource.id;
      const targetUserId = req.params.userId ? parseInt(req.params.userId, 10) : req.user.id;
      const rawStatus = req.body.response_status || req.body.responseStatus || req.body.status;
      const validStatuses = ['accepted', 'declined', 'pending'];

      if (!rawStatus || !validStatuses.includes(rawStatus)) {
        return sendError(res, `Invalid RSVP status. Allowed: ${validStatuses.join(', ')}`, 400);
      }

      // Attendee can update their own status, or organizer/leader can update
      if (req.user.id !== targetUserId && req.resource.organizer_id !== req.user.id && req.teamRole !== 'leader') {
        return sendError(res, 'You can only update your own attendance response.', 403);
      }

      const attendee = await MeetingAttendeeModel.updateResponse({
        meetingId: mid,
        userId: targetUserId,
        responseStatus: rawStatus,
      });

      if (!attendee) {
        return sendError(res, 'You are not listed as an attendee for this meeting.', 404);
      }

      return sendSuccess(res, { attendee }, 'RSVP status updated successfully');
    } catch (error) {
      next(error);
    }
  },

  async updateRsvp(req, res, next) {
    return MeetingController.updateAttendeeResponse(req, res, next);
  },

  async removeAttendee(req, res, next) {
    try {
      const mid = req.resource.id;
      const targetUserId = parseInt(req.params.userId, 10);

      if (isNaN(targetUserId)) {
        return sendError(res, 'Invalid user ID format.', 400);
      }

      // Permissions: Team Leader or Attendee removing self
      const isSelf = targetUserId === req.user.id;
      const isLeader = req.teamRole === 'leader';

      if (!isLeader && !isSelf) {
        return sendError(res, 'Access denied. Only team leaders can remove other attendees.', 403);
      }

      const removed = await MeetingAttendeeModel.removeAttendee({
        meetingId: mid,
        userId: targetUserId,
      });

      if (!removed) {
        return sendError(res, 'Attendee not found.', 404);
      }

      return sendSuccess(res, { userId: targetUserId }, 'Attendee removed from meeting');
    } catch (error) {
      next(error);
    }
  },

  // ==========================================
  // 3. MEETING MINUTES
  // ==========================================

  async getMinutes(req, res, next) {
    try {
      const minutes = await MeetingMinutesModel.findByMeetingId(req.resource.id);
      return sendSuccess(res, { minutes }, 'Meeting minutes retrieved');
    } catch (error) {
      next(error);
    }
  },

  async createMinutes(req, res, next) {
    try {
      if (req.teamRole !== 'leader') {
        return sendError(res, 'Access denied. Only team leaders can record meeting minutes.', 403);
      }

      const mid = req.resource.id;
      const { summary, discussion, decisions, action_items } = req.body;

      if (!summary || typeof summary !== 'string' || !summary.trim()) {
        return sendError(res, 'Meeting summary is required.', 400);
      }

      const minutes = await MeetingMinutesModel.create({
        meetingId: mid,
        summary: summary.trim(),
        discussion: discussion ? discussion.trim() : null,
        decisions: decisions ? decisions.trim() : null,
        actionItems: action_items ? action_items.trim() : null,
        createdBy: req.user.id,
      });

      return sendSuccess(res, { minutes }, 'Meeting minutes recorded successfully', 201);
    } catch (error) {
      if (error.code === '23505') {
        return sendError(res, 'Meeting minutes already exist for this meeting.', 409);
      }
      next(error);
    }
  },

  async updateMinutes(req, res, next) {
    try {
      if (req.teamRole !== 'leader') {
        return sendError(res, 'Access denied. Only team leaders can update meeting minutes.', 403);
      }

      const mid = req.resource.id;
      const { summary, discussion, decisions, action_items } = req.body;

      if (!summary || typeof summary !== 'string' || !summary.trim()) {
        return sendError(res, 'Meeting summary is required.', 400);
      }

      const minutes = await MeetingMinutesModel.update({
        meetingId: mid,
        summary: summary.trim(),
        discussion: discussion ? discussion.trim() : null,
        decisions: decisions ? decisions.trim() : null,
        actionItems: action_items ? action_items.trim() : null,
      });

      if (!minutes) {
        return sendError(res, 'Meeting minutes not found.', 404);
      }

      return sendSuccess(res, { minutes }, 'Meeting minutes updated successfully');
    } catch (error) {
      next(error);
    }
  },

  async deleteMinutes(req, res, next) {
    try {
      if (req.teamRole !== 'leader') {
        return sendError(res, 'Access denied. Only team leaders can delete meeting minutes.', 403);
      }

      const deleted = await MeetingMinutesModel.delete(req.resource.id);
      if (!deleted) {
        return sendError(res, 'Meeting minutes not found.', 404);
      }

      return sendSuccess(res, { meetingId: req.resource.id }, 'Meeting minutes deleted');
    } catch (error) {
      next(error);
    }
  },
};

// Aliases for route handlers
MeetingController.getAttendees = async (req, res, next) => {
  try {
    const attendees = await MeetingAttendeeModel.findAllByMeeting(req.resource.id);
    return sendSuccess(res, { attendees, total: attendees.length }, 'Attendees retrieved');
  } catch (err) {
    next(err);
  }
};
MeetingController.updateRsvp = MeetingController.updateAttendeeResponse;

module.exports = MeetingController;
