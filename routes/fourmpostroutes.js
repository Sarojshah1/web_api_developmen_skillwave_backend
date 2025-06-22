const express = require('express');
const router = express.Router();
const forumPostController = require('../controllers/forumPostController');
const { verifyToken } = require('../middlewares/authMiddleware');

// Route to create a new forum post
router.post('/', verifyToken, forumPostController.createForumPost);

// Route to get all forum posts with integrated recommendation system
router.get('/', verifyToken, forumPostController.getAllForumPosts);

// Route to get a specific forum post by ID
router.get('/:id', forumPostController.getForumPostById);

// Route to increment view count
router.post('/:id/view', forumPostController.incrementView);

// Route to update a forum post by ID
router.put('/:id', verifyToken, forumPostController.updateForumPost);

// Route to delete a forum post by ID
router.delete('/:id', verifyToken, forumPostController.deleteForumPost);

// Route to add a like to a forum post
router.post('/:id/like', verifyToken, forumPostController.addLike);

// Route to add a comment to a forum post
router.post('/:id/comments', verifyToken, forumPostController.addComment);
router.get('/:id/comments', verifyToken, forumPostController.getComments);

// Route to add a reply to a comment
router.post('/:postId/comments/:commentId/replies', verifyToken, forumPostController.addReply);

module.exports = router;
