const express = require('express');
const router = express.Router();
const CommentController = require('../controllers/comment.controller');
const { authenticateJwt } = require('../middleware/auth.middleware');

router.use(authenticateJwt);

router.put('/:id', CommentController.updateComment);
router.delete('/:id', CommentController.deleteComment);

module.exports = router;
