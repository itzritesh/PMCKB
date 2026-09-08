const { KbArticleModel, KbCategoryModel } = require('../models');
const { sendSuccess, sendError } = require('../utils/response');

/**
 * Knowledge Base Article Controller
 * Handles article authoring, draft/published workflows, and full-text search with team isolation.
 */
const KbArticleController = {
  async createArticle(req, res, next) {
    try {
      if (req.teamRole !== 'leader') {
        return sendError(res, 'Access denied. Only team leaders can create knowledge base articles.', 403);
      }

      const { title, content, category_id, status } = req.body;

      if (!title || typeof title !== 'string' || !title.trim()) {
        return sendError(res, 'Article title is required.', 400);
      }

      if (!content || typeof content !== 'string' || !content.trim()) {
        return sendError(res, 'Article content is required.', 400);
      }

      let catId = null;
      if (category_id) {
        catId = parseInt(category_id, 10);
        if (isNaN(catId)) {
          return sendError(res, 'Invalid category ID format.', 400);
        }
        const category = await KbCategoryModel.findById(catId);
        if (!category || (category.team_id && category.team_id !== req.teamId)) {
          return sendError(res, 'Selected category does not exist in this workspace.', 404);
        }
      }

      const validStatuses = ['draft', 'published'];
      const articleStatus = status && validStatuses.includes(status) ? status : 'draft';

      const article = await KbArticleModel.create({
        title: title.trim(),
        content: content.trim(),
        categoryId: catId,
        authorId: req.user.id,
        teamId: req.teamId,
        status: articleStatus,
      });

      return sendSuccess(res, { article }, 'Article created successfully', 201);
    } catch (error) {
      next(error);
    }
  },

  async getArticles(req, res, next) {
    try {
      const { search, category, status } = req.query;

      const articles = await KbArticleModel.findAll({
        teamId: req.teamId,
        userId: req.user.id,
        search,
        categoryId: category,
        status,
      });

      return sendSuccess(res, { articles, total: articles.length }, 'Articles retrieved successfully');
    } catch (error) {
      next(error);
    }
  },

  async getArticleById(req, res, next) {
    try {
      const article = req.resource || (await KbArticleModel.findById(req.params.id));
      if (!article) {
        return sendError(res, 'Article not found.', 404);
      }

      // Visibility check: drafts are only visible to the author or leader
      if (article.status === 'draft' && article.author_id !== req.user.id && req.teamRole !== 'leader') {
        return sendError(res, 'You do not have permission to view this draft article.', 403);
      }

      return sendSuccess(res, { article }, 'Article retrieved successfully');
    } catch (error) {
      next(error);
    }
  },

  async updateArticle(req, res, next) {
    try {
      const existing = req.resource || (await KbArticleModel.findById(req.params.id));
      if (!existing) {
        return sendError(res, 'Article not found.', 404);
      }

      if (req.teamRole !== 'leader') {
        return sendError(res, 'Access denied. Only team leaders can edit knowledge base articles.', 403);
      }

      const { title, content, category_id, status } = req.body;

      if (!title || typeof title !== 'string' || !title.trim()) {
        return sendError(res, 'Article title is required.', 400);
      }

      if (!content || typeof content !== 'string' || !content.trim()) {
        return sendError(res, 'Article content is required.', 400);
      }

      let catId = existing.category_id;
      if (category_id !== undefined) {
        if (category_id === null || category_id === '') {
          catId = null;
        } else {
          catId = parseInt(category_id, 10);
          if (isNaN(catId)) {
            return sendError(res, 'Invalid category ID format.', 400);
          }
          const category = await KbCategoryModel.findById(catId);
          if (!category || (category.team_id && category.team_id !== req.teamId)) {
            return sendError(res, 'Selected category does not exist in this workspace.', 404);
          }
        }
      }

      const validStatuses = ['draft', 'published'];
      const articleStatus = status && validStatuses.includes(status) ? status : existing.status;

      const updated = await KbArticleModel.update({
        id: existing.id,
        title: title.trim(),
        content: content.trim(),
        categoryId: catId,
        status: articleStatus,
      });

      return sendSuccess(res, { article: updated }, 'Article updated successfully');
    } catch (error) {
      next(error);
    }
  },

  async deleteArticle(req, res, next) {
    try {
      const existing = req.resource || (await KbArticleModel.findById(req.params.id));
      if (!existing) {
        return sendError(res, 'Article not found.', 404);
      }

      if (req.teamRole !== 'leader') {
        return sendError(res, 'Access denied. Only team leaders can delete knowledge base articles.', 403);
      }

      const deleted = await KbArticleModel.delete(existing.id);
      if (!deleted) {
        return sendError(res, 'Failed to delete article.', 500);
      }

      return sendSuccess(res, { id: existing.id }, 'Article deleted successfully');
    } catch (error) {
      next(error);
    }
  },
};

module.exports = KbArticleController;
