const express = require('express');
const router = express.Router();
const quizController = require('../controllers/quizController');
const { verifyToken } = require('../middlewares/authMiddleware');

// Routes for Quizzes
router.post('/quizzes', verifyToken, quizController.createQuiz);
router.get('/quizzes', verifyToken, quizController.getAllQuizzes);
router.get('/quizzes/:id', verifyToken, quizController.getQuizById);
router.put('/quizzes/:id', verifyToken, quizController.updateQuiz);
router.delete('/quizzes/:id', verifyToken, quizController.deleteQuiz);

module.exports = router;
