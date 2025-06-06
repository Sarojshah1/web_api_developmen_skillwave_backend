const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { verifyToken } = require('../middlewares/authMiddleware');

// Route to create a new user (registration)
router.post('/register', userController.register);

// Route to log in a user
router.post('/login', userController.login);

router.get('/profile',verifyToken, userController.getUserById);

// Route to get all users
router.get('/', userController.getAllUsers);

router.put('/change-password', verifyToken, userController.changePassword);

router.put('/update-details', verifyToken, userController.updateUserDetails);
router.put('/update-profile-picture', verifyToken, userController.updateProfilePicture);

router.put('/update-password-by-email', userController.updatePasswordByEmail);
router.post("/search-history", verifyToken, userController.addToSearchHistory);
module.exports = router;
