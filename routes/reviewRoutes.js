const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');
const { verifyToken } = require('../middlewares/authMiddleware');

// Routes for Reviews
router.post('/reviews', verifyToken, reviewController.createReview);
router.get('/reviews', verifyToken, reviewController.getAllReviews);
router.get('/reviews/:id', verifyToken, reviewController.getReviewById);
router.put('/reviews/:id', verifyToken, reviewController.updateReview);
router.delete('/reviews/:id', verifyToken, reviewController.deleteReview);
router.get('/reviews/course/:courseId', reviewController.getReviewsByCourseId);
module.exports = router;
