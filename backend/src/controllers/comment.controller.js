const { CommentModel } = require('../models');
const { query } = require('../config/db');
const { sendSuccess, sendError } = require('../utils/response');

/**
 * Task Comment Controller
 * Handles discussion threads, comment creation, and author-isolated updates/deletions.
 */
const CommentController = {
  /**
   * Get all comments for a specific task
   * GET /api/tasks/:taskId/comments
   */
  async getCommentsByTask(req, res, next) {
    try {
      const { taskId } = req.params;
      const tid = parseInt(taskId, 10);

      if (isNaN(tid)) {
        return sendError(res, 'Invalid task ID format.', 400);
      }

      // Verify task exists
      const taskCheck = await query('SELECT id FROM tasks WHERE id = $1', [tid]);
      if (!taskCheck.rows[0]) {
        return sendError(res, 'Task not found.', 404);
      }

      const comments = await CommentModel.findAllByTask(tid);
      return sendSuccess(res, { comments, total: comments.length }, 'Comments retrieved successfully');
    } catch (error) {
      next(error);
    }
  },

  /**
   * Create a new comment on a task
   * POST /api/tasks/:taskId/comments
   */
  async createComment(req, res, next) {
    try {
      const { taskId } = req.params;
      const tid = parseInt(taskId, 10);

      if (isNaN(tid)) {
        return sendError(res, 'Invalid task ID format.', 400);
      }

      // Verify task exists
      const taskCheck = await query('SELECT id FROM tasks WHERE id = $1', [tid]);
      if (!taskCheck.rows[0]) {
        return sendError(res, 'Task not found.', 404);
      }

      const { comment } = req.body;
      if (!comment || typeof comment !== 'string' || !comment.trim()) {
        return sendError(res, 'Comment text is required and cannot be empty.', 400);
      }

      if (comment.trim().length > 5000) {
        return sendError(res, 'Comment cannot exceed 5000 characters.', 400);
      }

      const created = await CommentModel.create({
        taskId: tid,
        userId: req.user.id,
        comment: comment.trim(),
      });

      return sendSuccess(res, { comment: created }, 'Comment posted successfully', 201);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Update an existing comment (author only)
   * PUT /api/comments/:id
   */
  async updateComment(req, res, next) {
    try {
      const { id } = req.params;
      const commentId = parseInt(id, 10);

      if (isNaN(commentId)) {
        return sendError(res, 'Invalid comment ID format.', 400);
      }

      const { comment } = req.body;
      if (!comment || typeof comment !== 'string' || !comment.trim()) {
        return sendError(res, 'Comment text is required and cannot be empty.', 400);
      }

      if (comment.trim().length > 5000) {
        return sendError(res, 'Comment cannot exceed 5000 characters.', 400);
      }

      // Check existing comment
      const existing = await CommentModel.findById(commentId);
      if (!existing) {
        return sendError(res, 'Comment not found.', 404);
      }

      // Author verification
      if (existing.user_id !== req.user.id) {
        return sendError(res, 'You can only edit your own comments.', 403);
      }

      const updated = await CommentModel.update({
        id: commentId,
        userId: req.user.id,
        comment: comment.trim(),
      });

      return sendSuccess(res, { comment: updated }, 'Comment updated successfully');
    } catch (error) {
      next(error);
    }
  },

  /**
   * Delete an existing comment (author only)
   * DELETE /api/comments/:id
   */
  async deleteComment(req, res, next) {
    try {
      const { id } = req.params;
      const commentId = parseInt(id, 10);

      if (isNaN(commentId)) {
        return sendError(res, 'Invalid comment ID format.', 400);
      }

      // Check existing comment
      const existing = await CommentModel.findById(commentId);
      if (!existing) {
        return sendError(res, 'Comment not found.', 404);
      }

      // Author verification
      if (existing.user_id !== req.user.id) {
        return sendError(res, 'You can only delete your own comments.', 403);
      }

      const deleted = await CommentModel.delete({
        id: commentId,
        userId: req.user.id,
      });

      if (!deleted) {
        return sendError(res, 'Failed to delete comment.', 500);
      }

      return sendSuccess(res, { id: commentId }, 'Comment deleted successfully');
    } catch (error) {
      next(error);
    }
  },
};

module.exports = CommentController;
