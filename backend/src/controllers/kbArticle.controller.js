const { KbArticleModel, KbCategoryModel, KbArticleVersionModel } = require('../models');
const { sendSuccess, sendError } = require('../utils/response');

/**
 * Knowledge Base Article Controller
 * Handles article authoring, draft/published workflows, version history, and full-text search with team isolation.
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

      // Automatically create Version 1 snapshot
      const version1 = await KbArticleVersionModel.create({
        articleId: article.id,
        teamId: req.teamId,
        versionNumber: 1,
        title: article.title,
        content: article.content,
        categoryId: article.category_id,
        status: article.status,
        createdBy: req.user.id,
        changeSummary: 'Initial version',
      });

      return sendSuccess(
        res,
        { article, version: version1, version_number: 1 },
        'Article created successfully',
        201
      );
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

      const { title, content, category_id, status, change_summary } = req.body;

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

      // Determine next version number and create new version snapshot
      const nextVersion = await KbArticleVersionModel.getNextVersionNumber(existing.id);
      const newVersion = await KbArticleVersionModel.create({
        articleId: existing.id,
        teamId: req.teamId,
        versionNumber: nextVersion,
        title: updated.title,
        content: updated.content,
        categoryId: updated.category_id,
        status: updated.status,
        createdBy: req.user.id,
        changeSummary: change_summary ? change_summary.trim() : null,
      });

      return sendSuccess(
        res,
        { article: updated, version: newVersion, version_number: nextVersion },
        'Article updated successfully'
      );
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

  /**
   * Retrieve version history for an article
   * GET /api/kb/articles/:articleId/versions
   */
  async getArticleVersions(req, res, next) {
    try {
      const article = req.resource;
      if (!article) {
        return sendError(res, 'Article not found.', 404);
      }

      // Visibility check for draft articles
      if (article.status === 'draft' && article.author_id !== req.user.id && req.teamRole !== 'leader') {
        return sendError(res, 'You do not have permission to view history for this draft article.', 403);
      }

      const versions = await KbArticleVersionModel.findAllByArticleId(article.id, req.teamId);
      return sendSuccess(
        res,
        { versions, total: versions.length },
        'Article version history retrieved successfully'
      );
    } catch (error) {
      next(error);
    }
  },

  /**
   * Retrieve details of a specific version snapshot
   * GET /api/kb/articles/:articleId/versions/:versionNumber
   */
  async getArticleVersionByNumber(req, res, next) {
    try {
      const article = req.resource;
      if (!article) {
        return sendError(res, 'Article not found.', 404);
      }

      const versionNumber = parseInt(req.params.versionNumber, 10);
      if (isNaN(versionNumber) || versionNumber < 1) {
        return sendError(res, 'Invalid version number format.', 400);
      }

      // Visibility check for draft articles
      if (article.status === 'draft' && article.author_id !== req.user.id && req.teamRole !== 'leader') {
        return sendError(res, 'You do not have permission to view this version snapshot.', 403);
      }

      const version = await KbArticleVersionModel.findByVersionNumber(article.id, versionNumber, req.teamId);
      if (!version) {
        return sendError(res, `Version ${versionNumber} not found for this article.`, 404);
      }

      return sendSuccess(res, { version }, `Version ${versionNumber} retrieved successfully`);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Restore article from a previous version snapshot
   * POST /api/kb/articles/:articleId/versions/:versionNumber/restore
   */
  async restoreArticleVersion(req, res, next) {
    try {
      const article = req.resource;
      if (!article) {
        return sendError(res, 'Article not found.', 404);
      }

      if (req.teamRole !== 'leader') {
        return sendError(res, 'Access denied. Only team leaders can restore knowledge base article versions.', 403);
      }

      const versionNumber = parseInt(req.params.versionNumber, 10);
      if (isNaN(versionNumber) || versionNumber < 1) {
        return sendError(res, 'Invalid version number format.', 400);
      }

      const versionToRestore = await KbArticleVersionModel.findByVersionNumber(article.id, versionNumber, req.teamId);
      if (!versionToRestore) {
        return sendError(res, `Target version ${versionNumber} not found to restore.`, 404);
      }

      // Update current article with snapshot values
      const updated = await KbArticleModel.update({
        id: article.id,
        title: versionToRestore.title,
        content: versionToRestore.content,
        categoryId: versionToRestore.category_id,
        status: versionToRestore.status,
      });

      // Calculate next version number and create new restored version snapshot
      const nextVersion = await KbArticleVersionModel.getNextVersionNumber(article.id);
      const customSummary = req.body?.change_summary ? req.body.change_summary.trim() : null;
      const changeSummary = customSummary || `Restored from version ${versionNumber}`;

      const restoredVersion = await KbArticleVersionModel.create({
        articleId: article.id,
        teamId: req.teamId,
        versionNumber: nextVersion,
        title: versionToRestore.title,
        content: versionToRestore.content,
        categoryId: versionToRestore.category_id,
        status: versionToRestore.status,
        createdBy: req.user.id,
        changeSummary,
      });

      return sendSuccess(
        res,
        {
          article: updated,
          version: restoredVersion,
          version_number: nextVersion,
          restored_from: versionNumber,
        },
        `Article successfully restored from version ${versionNumber}`
      );
    } catch (error) {
      next(error);
    }
  },
};

module.exports = KbArticleController;
