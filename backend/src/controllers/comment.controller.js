const { CommentModel } = require('../models');
const { query } = require('../config/db');
const { sendSuccess, sendError } = require('../utils/response');

/**
 * Task Comment Controller
 * Handles discussion threads, comment creation, and team/author isolation.
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

      // Verify task exists and user belongs to task's team
      const taskCheck = await query(
        `SELECT t.id, t.team_id, tm.role as user_role 
         FROM tasks t 
         LEFT JOIN team_members tm ON tm.team_id = t.team_id AND tm.user_id = $2
         WHERE t.id = $1`,
        [tid, req.user.id]
      );
      if (!taskCheck.rows[0]) {
        return sendError(res, 'Task not found.', 404);
      }
      if (!taskCheck.rows[0].user_role) {
        return sendError(res, 'Access denied. You do not have access to this workspace task.', 403);
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

      // Verify task exists and user belongs to task's team
      const taskCheck = await query(
        `SELECT t.id, t.team_id, tm.role as user_role 
         FROM tasks t 
         LEFT JOIN team_members tm ON tm.team_id = t.team_id AND tm.user_id = $2
         WHERE t.id = $1`,
        [tid, req.user.id]
      );
      if (!taskCheck.rows[0]) {
        return sendError(res, 'Task not found.', 404);
      }
      if (!taskCheck.rows[0].user_role) {
        return sendError(res, 'Access denied. You do not have access to this workspace task.', 403);
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

      // Check existing comment and team access
      const checkRes = await query(
        `SELECT c.*, t.team_id, tm.role as user_role
         FROM task_comments c
         JOIN tasks t ON t.id = c.task_id
         LEFT JOIN team_members tm ON tm.team_id = t.team_id AND tm.user_id = $2
         WHERE c.id = $1`,
        [commentId, req.user.id]
      );

      if (!checkRes.rows[0]) {
        return sendError(res, 'Comment not found.', 404);
      }

      const existing = checkRes.rows[0];
      if (!existing.user_role) {
        return sendError(res, 'Access denied. You do not belong to this workspace.', 403);
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
   * Delete an existing comment (author or team leader)
   * DELETE /api/comments/:id
   */
  async deleteComment(req, res, next) {
    try {
      const { id } = req.params;
      const commentId = parseInt(id, 10);

      if (isNaN(commentId)) {
        return sendError(res, 'Invalid comment ID format.', 400);
      }

      const checkRes = await query(
        `SELECT c.*, t.team_id, tm.role as user_role
         FROM task_comments c
         JOIN tasks t ON t.id = c.task_id
         LEFT JOIN team_members tm ON tm.team_id = t.team_id AND tm.user_id = $2
         WHERE c.id = $1`,
        [commentId, req.user.id]
      );

      if (!checkRes.rows[0]) {
        return sendError(res, 'Comment not found.', 404);
      }

      const existing = checkRes.rows[0];
      if (!existing.user_role) {
        return sendError(res, 'Access denied. You do not belong to this workspace.', 403);
      }

      // Author or Team Leader can delete comment
      if (existing.user_id !== req.user.id && existing.user_role !== 'leader') {
        return sendError(res, 'You can only delete your own comments.', 403);
      }

      await query('DELETE FROM task_comments WHERE id = $1', [commentId]);

      return sendSuccess(res, { id: commentId }, 'Comment deleted successfully');
    } catch (error) {
      next(error);
    }
  },
};

module.exports = CommentController;
