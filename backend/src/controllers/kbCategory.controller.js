const { KbCategoryModel } = require('../models');
const { sendSuccess, sendError } = require('../utils/response');

/**
 * Knowledge Base Category Controller
 */
const KbCategoryController = {
  async createCategory(req, res, next) {
    try {
      const { name, description } = req.body;

      if (!name || typeof name !== 'string' || !name.trim()) {
        return sendError(res, 'Category name is required.', 400);
      }

      const existing = await KbCategoryModel.findByName(name.trim());
      if (existing) {
        return sendError(res, 'A category with this name already exists.', 409);
      }

      const category = await KbCategoryModel.create({
        name: name.trim(),
        description: description ? description.trim() : null,
        createdBy: req.user.id,
      });

      return sendSuccess(res, { category }, 'Category created successfully', 201);
    } catch (error) {
      next(error);
    }
  },

  async getCategories(req, res, next) {
    try {
      const categories = await KbCategoryModel.findAll();
      return sendSuccess(res, { categories, total: categories.length }, 'Categories retrieved successfully');
    } catch (error) {
      next(error);
    }
  },

  async getCategoryById(req, res, next) {
    try {
      const { id } = req.params;
      const categoryId = parseInt(id, 10);

      if (isNaN(categoryId)) {
        return sendError(res, 'Invalid category ID format.', 400);
      }

      const category = await KbCategoryModel.findById(categoryId);
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
      const { id } = req.params;
      const categoryId = parseInt(id, 10);

      if (isNaN(categoryId)) {
        return sendError(res, 'Invalid category ID format.', 400);
      }

      const existing = await KbCategoryModel.findById(categoryId);
      if (!existing) {
        return sendError(res, 'Category not found.', 404);
      }

      const { name, description } = req.body;
      if (!name || typeof name !== 'string' || !name.trim()) {
        return sendError(res, 'Category name is required.', 400);
      }

      const duplicate = await KbCategoryModel.findByName(name.trim());
      if (duplicate && duplicate.id !== categoryId) {
        return sendError(res, 'Another category with this name already exists.', 409);
      }

      const updated = await KbCategoryModel.update({
        id: categoryId,
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
      const { id } = req.params;
      const categoryId = parseInt(id, 10);

      if (isNaN(categoryId)) {
        return sendError(res, 'Invalid category ID format.', 400);
      }

      const existing = await KbCategoryModel.findById(categoryId);
      if (!existing) {
        return sendError(res, 'Category not found.', 404);
      }

      // Safe deletion guard: check if articles exist
      const articleCount = await KbCategoryModel.countArticles(categoryId);
      if (articleCount > 0) {
        return sendError(
          res,
          `Cannot delete category "${existing.name}" because it contains ${articleCount} article(s). Please reassign or delete articles first.`,
          400
        );
      }

      const deleted = await KbCategoryModel.delete(categoryId);
      if (!deleted) {
        return sendError(res, 'Failed to delete category.', 500);
      }

      return sendSuccess(res, { id: categoryId }, 'Category deleted successfully');
    } catch (error) {
      next(error);
    }
  },
};

module.exports = KbCategoryController;
