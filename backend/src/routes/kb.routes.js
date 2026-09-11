const express = require('express');
const router = express.Router();
const KbCategoryController = require('../controllers/kbCategory.controller');
const KbArticleController = require('../controllers/kbArticle.controller');
const { authenticateJwt } = require('../middleware/auth.middleware');
const { verifyTeamAccess, verifyResourceTeamAccess, requireLeader } = require('../middleware/team.middleware');

// All Knowledge Base routes require authentication & team context
router.use(authenticateJwt);
router.use(verifyTeamAccess);

// Categories (Leader-only for create/update/delete)
router.post('/categories', requireLeader, KbCategoryController.createCategory);
router.get('/categories', KbCategoryController.getCategories);
router.get('/categories/:id', verifyResourceTeamAccess('kb_categories', 'id'), KbCategoryController.getCategoryById);
router.put('/categories/:id', verifyResourceTeamAccess('kb_categories', 'id'), requireLeader, KbCategoryController.updateCategory);
router.delete('/categories/:id', verifyResourceTeamAccess('kb_categories', 'id'), requireLeader, KbCategoryController.deleteCategory);

// Articles
router.post('/articles', KbArticleController.createArticle);
router.get('/articles', KbArticleController.getArticles);
router.get('/articles/search', (req, res, next) => {
  req.query.search = req.query.search || req.query.q;
  return KbArticleController.getArticles(req, res, next);
});
router.get('/articles/:id', verifyResourceTeamAccess('kb_articles', 'id'), KbArticleController.getArticleById);
router.put('/articles/:id', verifyResourceTeamAccess('kb_articles', 'id'), KbArticleController.updateArticle);
router.delete('/articles/:id', verifyResourceTeamAccess('kb_articles', 'id'), KbArticleController.deleteArticle);

module.exports = router;
