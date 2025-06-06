const express = require('express');
const router = express.Router();
const lessonController = require('../controllers/lessonController');
const { verifyToken } = require('../middlewares/authMiddleware');

// Create a new lesson
router.post('/lessons', verifyToken, lessonController.createLesson);

// Get all lessons
router.get('/lessons', verifyToken, lessonController.getAllLessons);

// Get a specific lesson by ID
router.get('/lessons/:id', verifyToken, lessonController.getLessonById);

// Update a lesson by ID
router.put('/lessons/:id', verifyToken, lessonController.updateLesson);

// Delete a lesson by ID
router.delete('/lessons/:id', verifyToken, lessonController.deleteLesson);

module.exports = router;
