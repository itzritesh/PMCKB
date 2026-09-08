const { AnnouncementModel } = require('../models');
const { sendSuccess, sendError } = require('../utils/response');

const AnnouncementController = {
  /**
   * Get all announcements for the verified workspace
   * GET /api/announcements
   */
  async getAnnouncements(req, res, next) {
    try {
      const announcements = await AnnouncementModel.findAllByTeam({
        teamId: req.teamId,
        userId: req.user.id,
      });

      return sendSuccess(
        res,
        {
          announcements,
          total: announcements.length,
          teamId: req.teamId,
        },
        'Announcements fetched successfully'
      );
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get single announcement by ID
   * GET /api/announcements/:id
   */
  async getAnnouncementById(req, res, next) {
    try {
      // req.resource is populated by verifyResourceTeamAccess
      return sendSuccess(res, { announcement: req.resource }, 'Announcement retrieved successfully');
    } catch (error) {
      next(error);
    }
  },

  /**
   * Create an announcement (leader only)
   * POST /api/announcements
   */
  async createAnnouncement(req, res, next) {
    try {
      const { title } = req.body;
      const message = req.body.message || req.body.content;

      if (!title || typeof title !== 'string' || !title.trim()) {
        return sendError(res, 'Announcement title is required.', 400);
      }

      if (!message || typeof message !== 'string' || !message.trim()) {
        return sendError(res, 'Announcement message content is required.', 400);
      }

      const announcement = await AnnouncementModel.create({
        teamId: req.teamId,
        title,
        message,
        createdBy: req.user.id,
      });

      return sendSuccess(res, { announcement }, 'Announcement created successfully', 201);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Update an announcement (leader only)
   * PUT /api/announcements/:id
   */
  async updateAnnouncement(req, res, next) {
    try {
      const { title } = req.body;
      const message = req.body.message || req.body.content;

      if (!title || typeof title !== 'string' || !title.trim()) {
        return sendError(res, 'Announcement title is required.', 400);
      }

      if (!message || typeof message !== 'string' || !message.trim()) {
        return sendError(res, 'Announcement message content is required.', 400);
      }

      const updated = await AnnouncementModel.update({
        id: req.resource.id,
        teamId: req.teamId,
        title,
        message,
      });

      return sendSuccess(res, { announcement: updated }, 'Announcement updated successfully');
    } catch (error) {
      next(error);
    }
  },

  /**
   * Delete an announcement (leader only)
   * DELETE /api/announcements/:id
   */
  async deleteAnnouncement(req, res, next) {
    try {
      await AnnouncementModel.delete(req.resource.id, req.teamId);
      return sendSuccess(res, { id: req.resource.id }, 'Announcement deleted successfully');
    } catch (error) {
      next(error);
    }
  },
};

module.exports = AnnouncementController;
