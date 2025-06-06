const express = require('express');
const router = express.Router();
const questionController = require('../controllers/questionController');
const { verifyToken } = require('../middlewares/authMiddleware');

// Routes for Questions
router.post('/questions', verifyToken, questionController.createQuestion);
router.get('/questions', verifyToken, questionController.getAllQuestions);
router.get('/questions/:id', verifyToken, questionController.getQuestionById);
router.put('/questions/:id', verifyToken, questionController.updateQuestion);
router.delete('/questions/:id', verifyToken, questionController.deleteQuestion);

module.exports = router;
