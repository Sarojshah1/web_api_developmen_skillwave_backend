
const express = require('express');
const router = express.Router();
const groupStudyController = require('../controllers/groupStudyController');
const { verifyToken } = require('../middlewares/authMiddleware');
// Route to create a new group study
router.post('/create',verifyToken, groupStudyController.createGroup);
router.get('/',verifyToken, groupStudyController.getAllGroups);

// Route to add a member to a group by groupId and memberId
router.post('/:groupId/addMember',verifyToken, groupStudyController.addMember);

// Route to send a chat message to a specific group by groupId
router.post('/:groupId/sendChat',verifyToken, groupStudyController.sendChat);

// Route to get group details (including chats and members) by groupId
router.get('/:groupId',verifyToken, groupStudyController.getGroup);

// Route to get all groups a user has joined by their userId
router.get('/user/:userId',verifyToken, groupStudyController.getGroupsByUserId);

module.exports = router;

