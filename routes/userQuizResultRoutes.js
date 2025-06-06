const express = require('express');
const router = express.Router();
const userQuizResultController = require('../controllers/userQuizResultController');
const { verifyToken } = require('../middlewares/authMiddleware');

// Route to create a new quiz result
router.post('/', verifyToken, userQuizResultController.createUserQuizResult);

// Route to get all quiz results
router.get('/', verifyToken, userQuizResultController.getAllUserQuizResults);

// Route to get a specific quiz result by ID
router.get('/:id', verifyToken, userQuizResultController.getUserQuizResultById);

// Route to update a quiz result by ID
router.put('/:id', verifyToken, userQuizResultController.updateUserQuizResult);

// Route to delete a quiz result by ID
router.delete('/:id', verifyToken, userQuizResultController.deleteUserQuizResult);

module.exports = router;
