const {
  ReminderModel,
  MeetingModel,
  CalendarEventModel,
  TeamModel,
} = require('../models');
const { sendSuccess, sendError } = require('../utils/response');

const ReminderController = {
  /**
   * Create a reminder for a meeting or calendar event
   * POST /api/reminders
   */
  async create(req, res, next) {
    try {
      const { reference_type, reference_id, remind_at } = req.body;

      // 1. Validate reference_type
      if (!reference_type || !['meeting', 'calendar_event'].includes(reference_type)) {
        return sendError(
          res,
          "Invalid reference_type. Must be either 'meeting' or 'calendar_event'.",
          400
        );
      }

      // 2. Validate reference_id
      const refId = parseInt(reference_id, 10);
      if (isNaN(refId) || refId <= 0) {
        return sendError(res, 'A valid positive integer reference_id is required.', 400);
      }

      // 3. Validate remind_at format and future value
      if (!remind_at) {
        return sendError(res, 'remind_at timestamp is required.', 400);
      }

      const remindDate = new Date(remind_at);
      if (isNaN(remindDate.getTime())) {
        return sendError(res, 'Invalid remind_at datetime format.', 400);
      }

      const now = new Date();
      if (remindDate <= now) {
        return sendError(res, 'Reminder time must be in the future.', 400);
      }

      // 4. Fetch target resource and verify team ownership & access
      let resourceTeamId = null;
      let resourceStartDatetime = null;
      let resourceTitle = '';

      if (reference_type === 'meeting') {
        const meeting = await MeetingModel.findById(refId);
        if (!meeting) {
          return sendError(res, 'Meeting not found.', 404);
        }
        resourceTeamId = meeting.team_id;
        resourceStartDatetime = new Date(meeting.start_datetime);
        resourceTitle = meeting.title;
      } else if (reference_type === 'calendar_event') {
        const event = await CalendarEventModel.findById(refId);
        if (!event) {
          return sendError(res, 'Calendar event not found.', 404);
        }
        resourceTeamId = event.team_id;
        resourceStartDatetime = new Date(event.start_datetime);
        resourceTitle = event.title;
      }

      // 5. Verify user belongs to the referenced resource's team (DO NOT trust frontend team_id)
      const membership = await TeamModel.findMembership(resourceTeamId, req.user.id);
      if (!membership) {
        return sendError(
          res,
          'Access denied. You do not belong to the workspace for this event.',
          403
        );
      }

      // 6. Ensure reminder occurs before event start time
      if (remindDate >= resourceStartDatetime) {
        return sendError(
          res,
          `Reminder must be scheduled before the ${
            reference_type === 'meeting' ? 'meeting' : 'calendar event'
          } start time (${resourceStartDatetime.toISOString()}).`,
          400
        );
      }

      // 7. Check for duplicate pending reminder for this user, resource, and time
      const duplicate = await ReminderModel.findDuplicate({
        userId: req.user.id,
        referenceType: reference_type,
        referenceId: refId,
        remindAt: remindDate.toISOString(),
      });

      if (duplicate) {
        return sendError(
          res,
          'A pending reminder for this item at this exact time already exists.',
          409
        );
      }

      // 8. Create reminder
      const reminder = await ReminderModel.create({
        teamId: resourceTeamId,
        userId: req.user.id,
        reminderType: reference_type,
        referenceType: reference_type,
        referenceId: refId,
        remindAt: remindDate.toISOString(),
        status: 'pending',
      });

      return sendSuccess(
        res,
        {
          reminder: {
            ...reminder,
            resource_title: resourceTitle,
            resource_start_datetime: resourceStartDatetime,
          },
        },
        'Reminder scheduled successfully.',
        201
      );
    } catch (error) {
      next(error);
    }
  },

  /**
   * List reminders for the authenticated user in their accessible teams
   * GET /api/reminders
   */
  async list(req, res, next) {
    try {
      const { reference_type, reference_id, status } = req.query;
      const teamId = req.teamId || null;

      const reminders = await ReminderModel.findAll({
        userId: req.user.id,
        teamId,
        referenceType: reference_type || null,
        referenceId: reference_id ? parseInt(reference_id, 10) : null,
        status: status || null,
      });

      return sendSuccess(
        res,
        {
          reminders,
          count: reminders.length,
        },
        'Reminders retrieved successfully.'
      );
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get single reminder by ID
   * GET /api/reminders/:id
   */
  async getById(req, res, next) {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        return sendError(res, 'Invalid reminder ID.', 400);
      }

      const reminder = await ReminderModel.findById(id);
      if (!reminder) {
        return sendError(res, 'Reminder not found.', 404);
      }

      // Verify user owns the reminder or is a member of the team
      const membership = await TeamModel.findMembership(reminder.team_id, req.user.id);
      if (!membership || reminder.user_id !== req.user.id) {
        return sendError(
          res,
          'Access denied. You do not have permission to view this reminder.',
          403
        );
      }

      return sendSuccess(res, { reminder }, 'Reminder retrieved successfully.');
    } catch (error) {
      next(error);
    }
  },

  /**
   * Update reminder time or status
   * PUT /api/reminders/:id
   */
  async update(req, res, next) {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        return sendError(res, 'Invalid reminder ID.', 400);
      }

      const existing = await ReminderModel.findById(id);
      if (!existing) {
        return sendError(res, 'Reminder not found.', 404);
      }

      if (existing.user_id !== req.user.id) {
        return sendError(
          res,
          'Access denied. You can only modify your own reminders.',
          403
        );
      }

      const { remind_at, status } = req.body;
      let newRemindAt = existing.remind_at;

      if (remind_at) {
        const remindDate = new Date(remind_at);
        if (isNaN(remindDate.getTime())) {
          return sendError(res, 'Invalid remind_at datetime format.', 400);
        }
        if (remindDate <= new Date()) {
          return sendError(res, 'Reminder time must be in the future.', 400);
        }

        // Verify still before event start
        let resourceStartDatetime = null;
        if (existing.reference_type === 'meeting') {
          const m = await MeetingModel.findById(existing.reference_id);
          if (m) resourceStartDatetime = new Date(m.start_datetime);
        } else {
          const ce = await CalendarEventModel.findById(existing.reference_id);
          if (ce) resourceStartDatetime = new Date(ce.start_datetime);
        }

        if (resourceStartDatetime && remindDate >= resourceStartDatetime) {
          return sendError(
            res,
            'Reminder must be scheduled before the event starts.',
            400
          );
        }
        newRemindAt = remindDate.toISOString();
      }

      let newStatus = existing.status;
      if (status) {
        const validStatuses = ['pending', 'triggered', 'dismissed', 'cancelled'];
        if (!validStatuses.includes(status)) {
          return sendError(res, `Invalid status. Must be one of: ${validStatuses.join(', ')}`, 400);
        }
        newStatus = status;
      }

      const updated = await ReminderModel.update(id, {
        remindAt: newRemindAt,
        status: newStatus,
      });

      return sendSuccess(res, { reminder: updated }, 'Reminder updated successfully.');
    } catch (error) {
      next(error);
    }
  },

  /**
   * Dismiss a reminder
   * POST /api/reminders/:id/dismiss
   */
  async dismiss(req, res, next) {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        return sendError(res, 'Invalid reminder ID.', 400);
      }

      const existing = await ReminderModel.findById(id);
      if (!existing) {
        return sendError(res, 'Reminder not found.', 404);
      }

      if (existing.user_id !== req.user.id) {
        return sendError(
          res,
          'Access denied. You can only dismiss your own reminders.',
          403
        );
      }

      const updated = await ReminderModel.updateStatus(id, 'dismissed');
      return sendSuccess(res, { reminder: updated }, 'Reminder dismissed successfully.');
    } catch (error) {
      next(error);
    }
  },

  /**
   * Cancel a reminder
   * POST /api/reminders/:id/cancel
   */
  async cancel(req, res, next) {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        return sendError(res, 'Invalid reminder ID.', 400);
      }

      const existing = await ReminderModel.findById(id);
      if (!existing) {
        return sendError(res, 'Reminder not found.', 404);
      }

      if (existing.user_id !== req.user.id) {
        return sendError(
          res,
          'Access denied. You can only cancel your own reminders.',
          403
        );
      }

      const updated = await ReminderModel.updateStatus(id, 'cancelled');
      return sendSuccess(res, { reminder: updated }, 'Reminder cancelled successfully.');
    } catch (error) {
      next(error);
    }
  },

  /**
   * Delete a reminder
   * DELETE /api/reminders/:id
   */
  async delete(req, res, next) {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        return sendError(res, 'Invalid reminder ID.', 400);
      }

      const existing = await ReminderModel.findById(id);
      if (!existing) {
        return sendError(res, 'Reminder not found.', 404);
      }

      // Check if user is owner or leader of the team
      const membership = await TeamModel.findMembership(existing.team_id, req.user.id);
      const isOwner = existing.user_id === req.user.id;
      const isLeader = membership && membership.role === 'leader';

      if (!isOwner && !isLeader) {
        return sendError(
          res,
          'Access denied. You do not have permission to delete this reminder.',
          403
        );
      }

      const deleted = await ReminderModel.delete(id);
      return sendSuccess(res, { reminder: deleted }, 'Reminder deleted successfully.');
    } catch (error) {
      next(error);
    }
  },
};

module.exports = ReminderController;
