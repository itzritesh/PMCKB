const { CalendarEventModel } = require('../models');
const { sendSuccess, sendError } = require('../utils/response');

/**
 * Calendar Event Controller
 */
const CalendarController = {
  /**
   * Create a new calendar event
   * POST /api/calendar/events
   */
  async createEvent(req, res, next) {
    try {
      if (req.teamRole !== 'leader') {
        return sendError(res, 'Access denied. Only team leaders can create calendar events.', 403);
      }

      const { title, description, start_datetime, end_datetime, location } = req.body;

      if (!title || typeof title !== 'string' || !title.trim()) {
        return sendError(res, 'Event title is required.', 400);
      }

      if (!start_datetime) {
        return sendError(res, 'Start date and time is required.', 400);
      }

      if (!end_datetime) {
        return sendError(res, 'End date and time is required.', 400);
      }

      const startDate = new Date(start_datetime);
      const endDate = new Date(end_datetime);

      if (isNaN(startDate.getTime())) {
        return sendError(res, 'Invalid start date/time format.', 400);
      }

      if (isNaN(endDate.getTime())) {
        return sendError(res, 'Invalid end date/time format.', 400);
      }

      if (endDate < startDate) {
        return sendError(res, 'End date and time must not be before start date and time.', 400);
      }

      const event = await CalendarEventModel.create({
        title: title.trim(),
        description: description ? description.trim() : null,
        startDatetime: startDate.toISOString(),
        endDatetime: endDate.toISOString(),
        location: location ? location.trim() : null,
        createdBy: req.user.id,
        teamId: req.teamId,
      });

      return sendSuccess(res, { event }, 'Calendar event created successfully', 201);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get calendar events with date-range filtering
   * GET /api/calendar/events
   */
  async getEvents(req, res, next) {
    try {
      const { start_date, end_date } = req.query;

      let startDateIso = null;
      let endDateIso = null;

      if (start_date) {
        const d = new Date(start_date);
        if (!isNaN(d.getTime())) startDateIso = d.toISOString();
      }

      if (end_date) {
        const d = new Date(end_date);
        if (!isNaN(d.getTime())) endDateIso = d.toISOString();
      }

      const events = await CalendarEventModel.findAll({
        teamId: req.teamId,
        userId: req.user.id,
        startDate: startDateIso,
        endDate: endDateIso,
      });

      return sendSuccess(res, { events, total: events.length }, 'Calendar events retrieved successfully');
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get single calendar event
   * GET /api/calendar/events/:id
   */
  async getEventById(req, res, next) {
    try {
      const event = req.resource || (await CalendarEventModel.findById(req.params.id));
      if (!event) {
        return sendError(res, 'Calendar event not found.', 404);
      }

      return sendSuccess(res, { event }, 'Calendar event retrieved successfully');
    } catch (error) {
      next(error);
    }
  },

  /**
   * Update calendar event (creator or leader)
   * PUT /api/calendar/events/:id
   */
  async updateEvent(req, res, next) {
    try {
      const existing = req.resource || (await CalendarEventModel.findById(req.params.id));
      if (!existing) {
        return sendError(res, 'Calendar event not found.', 404);
      }

      if (req.teamRole !== 'leader') {
        return sendError(res, 'Access denied. Only team leaders can edit calendar events.', 403);
      }

      const { title, description, start_datetime, end_datetime, location } = req.body;

      if (!title || typeof title !== 'string' || !title.trim()) {
        return sendError(res, 'Event title is required.', 400);
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

      const updated = await CalendarEventModel.update({
        id: existing.id,
        title: title.trim(),
        description: description !== undefined ? (description ? description.trim() : null) : existing.description,
        startDatetime: startDate.toISOString(),
        endDatetime: endDate.toISOString(),
        location: location !== undefined ? (location ? location.trim() : null) : existing.location,
      });

      return sendSuccess(res, { event: updated }, 'Calendar event updated successfully');
    } catch (error) {
      next(error);
    }
  },

  /**
   * Delete calendar event (creator or leader)
   * DELETE /api/calendar/events/:id
   */
  async deleteEvent(req, res, next) {
    try {
      const existing = req.resource || (await CalendarEventModel.findById(req.params.id));
      if (!existing) {
        return sendError(res, 'Calendar event not found.', 404);
      }

      if (req.teamRole !== 'leader') {
        return sendError(res, 'Access denied. Only team leaders can delete calendar events.', 403);
      }

      const deleted = await CalendarEventModel.delete(existing.id);
      if (!deleted) {
        return sendError(res, 'Failed to delete calendar event.', 500);
      }

      return sendSuccess(res, { id: existing.id }, 'Calendar event deleted successfully');
    } catch (error) {
      next(error);
    }
  },
};

module.exports = CalendarController;
