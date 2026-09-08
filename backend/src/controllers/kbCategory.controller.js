const { KbCategoryModel } = require('../models');
const { sendSuccess, sendError } = require('../utils/response');

/**
 * Knowledge Base Category Controller
 * Strictly enforces team isolation and leader-only category management.
 */
const KbCategoryController = {
  async createCategory(req, res, next) {
    try {
      if (req.teamRole !== 'leader') {
        return sendError(res, 'Only team leaders can create categories.', 403);
      }

      const { name, description } = req.body;

      if (!name || typeof name !== 'string' || !name.trim()) {
        return sendError(res, 'Category name is required.', 400);
      }

      const existing = await KbCategoryModel.findByName(name.trim(), req.teamId);
      if (existing) {
        return sendError(res, 'A category with this name already exists in this workspace.', 409);
      }

      const category = await KbCategoryModel.create({
        name: name.trim(),
        description: description ? description.trim() : null,
        createdBy: req.user.id,
        teamId: req.teamId,
      });

      return sendSuccess(res, { category }, 'Category created successfully', 201);
    } catch (error) {
      next(error);
    }
  },

  async getCategories(req, res, next) {
    try {
      const categories = await KbCategoryModel.findAll({
        teamId: req.teamId,
        userId: req.user.id,
      });
      return sendSuccess(res, { categories, total: categories.length }, 'Categories retrieved successfully');
    } catch (error) {
      next(error);
    }
  },

  async getCategoryById(req, res, next) {
    try {
      const category = req.resource || (await KbCategoryModel.findById(req.params.id));
      if (!category) {
        return sendError(res, 'Category not found.', 404);
      }

      return sendSuccess(res, { category }, 'Category retrieved successfully');
    } catch (error) {
      next(error);
    }
  },

  async updateCategory(req, res, next) {
    try {
      if (req.teamRole !== 'leader') {
        return sendError(res, 'Only team leaders can update categories.', 403);
      }

      const existing = req.resource || (await KbCategoryModel.findById(req.params.id));
      if (!existing) {
        return sendError(res, 'Category not found.', 404);
      }

      const { name, description } = req.body;
      if (!name || typeof name !== 'string' || !name.trim()) {
        return sendError(res, 'Category name is required.', 400);
      }

      const duplicate = await KbCategoryModel.findByName(name.trim(), req.teamId);
      if (duplicate && duplicate.id !== existing.id) {
        return sendError(res, 'Another category with this name already exists in this workspace.', 409);
      }

      const updated = await KbCategoryModel.update({
        id: existing.id,
        name: name.trim(),
        description: description !== undefined ? (description ? description.trim() : null) : existing.description,
      });

      return sendSuccess(res, { category: updated }, 'Category updated successfully');
    } catch (error) {
      next(error);
    }
  },

  async deleteCategory(req, res, next) {
    try {
      if (req.teamRole !== 'leader') {
        return sendError(res, 'Only team leaders can delete categories.', 403);
      }

      const existing = req.resource || (await KbCategoryModel.findById(req.params.id));
      if (!existing) {
        return sendError(res, 'Category not found.', 404);
      }

      // Safe deletion guard: check if articles exist
      const articleCount = await KbCategoryModel.countArticles(existing.id);
      if (articleCount > 0) {
        return sendError(
          res,
          `Cannot delete category "${existing.name}" because it contains ${articleCount} article(s). Please reassign or delete articles first.`,
          400
        );
      }

      const deleted = await KbCategoryModel.delete(existing.id);
      if (!deleted) {
        return sendError(res, 'Failed to delete category.', 500);
      }

      return sendSuccess(res, { id: existing.id }, 'Category deleted successfully');
    } catch (error) {
      next(error);
    }
  },
};

module.exports = KbCategoryController;
