const { KbArticleModel, KbCategoryModel } = require('../models');
const { sendSuccess, sendError } = require('../utils/response');

/**
 * Knowledge Base Article Controller
 * Handles article authoring, draft/published workflows, and full-text search.
 */
const KbArticleController = {
  async createArticle(req, res, next) {
    try {
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
        if (!category) {
          return sendError(res, 'Selected category does not exist.', 404);
        }
      }

      const validStatuses = ['draft', 'published'];
      const articleStatus = status && validStatuses.includes(status) ? status : 'draft';

      const article = await KbArticleModel.create({
        title: title.trim(),
        content: content.trim(),
        categoryId: catId,
        authorId: req.user.id,
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
      const { id } = req.params;
      const articleId = parseInt(id, 10);

      if (isNaN(articleId)) {
        return sendError(res, 'Invalid article ID format.', 400);
      }

      const article = await KbArticleModel.findById(articleId);
      if (!article) {
        return sendError(res, 'Article not found.', 404);
      }

      // Visibility check: drafts are only visible to the author
      if (article.status === 'draft' && article.author_id !== req.user.id) {
        return sendError(res, 'You do not have permission to view this draft article.', 403);
      }

      return sendSuccess(res, { article }, 'Article retrieved successfully');
    } catch (error) {
      next(error);
    }
  },

  async updateArticle(req, res, next) {
    try {
      const { id } = req.params;
      const articleId = parseInt(id, 10);

      if (isNaN(articleId)) {
        return sendError(res, 'Invalid article ID format.', 400);
      }

      const existing = await KbArticleModel.findById(articleId);
      if (!existing) {
        return sendError(res, 'Article not found.', 404);
      }

      if (existing.author_id !== req.user.id) {
        return sendError(res, 'You can only edit articles you authored.', 403);
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
          if (!category) {
            return sendError(res, 'Selected category does not exist.', 404);
          }
        }
      }

      const validStatuses = ['draft', 'published'];
      const articleStatus = status && validStatuses.includes(status) ? status : existing.status;

      const updated = await KbArticleModel.update({
        id: articleId,
        authorId: req.user.id,
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
      const { id } = req.params;
      const articleId = parseInt(id, 10);

      if (isNaN(articleId)) {
        return sendError(res, 'Invalid article ID format.', 400);
      }

      const existing = await KbArticleModel.findById(articleId);
      if (!existing) {
        return sendError(res, 'Article not found.', 404);
      }

      if (existing.author_id !== req.user.id) {
        return sendError(res, 'You can only delete articles you authored.', 403);
      }

      const deleted = await KbArticleModel.delete({ id: articleId, authorId: req.user.id });
      if (!deleted) {
        return sendError(res, 'Failed to delete article.', 500);
      }

      return sendSuccess(res, { id: articleId }, 'Article deleted successfully');
    } catch (error) {
      next(error);
    }
  },
};

module.exports = KbArticleController;
