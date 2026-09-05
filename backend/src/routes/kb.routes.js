const express = require('express');
const router = express.Router();
const KbCategoryController = require('../controllers/kbCategory.controller');
const KbArticleController = require('../controllers/kbArticle.controller');
const { authenticateJwt } = require('../middleware/auth.middleware');

// All Knowledge Base routes require authentication
router.use(authenticateJwt);

// Categories
router.post('/categories', KbCategoryController.createCategory);
router.get('/categories', KbCategoryController.getCategories);
router.get('/categories/:id', KbCategoryController.getCategoryById);
router.put('/categories/:id', KbCategoryController.updateCategory);
router.delete('/categories/:id', KbCategoryController.deleteCategory);

// Articles
router.post('/articles', KbArticleController.createArticle);
router.get('/articles', KbArticleController.getArticles);
router.get('/articles/:id', KbArticleController.getArticleById);
router.put('/articles/:id', KbArticleController.updateArticle);
router.delete('/articles/:id', KbArticleController.deleteArticle);

module.exports = router;
