const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const {verifyToken} = require('../middlewares/authMiddleware');

// Apply authentication middleware to all routes
router.use(verifyToken);

// Get user's notifications
router.get('/', notificationController.getUserNotifications);

// Get unread notification count
router.get('/unread-count', notificationController.getUnreadCount);

// Mark notification as read
router.patch('/:notificationId/read', notificationController.markAsRead);

// Mark all notifications as read
router.patch('/mark-all-read', notificationController.markAllAsRead);

// Update user's push token
router.put('/push-token', notificationController.updatePushToken);

// Delete specific notification
router.delete('/:notificationId', notificationController.deleteNotification);

// Delete all notifications for user
router.delete('/', notificationController.deleteAllNotifications);

// Test push notification (development only)
router.post('/test', notificationController.testPushNotification);

// Get push token status
router.get('/push-token-status', notificationController.getPushTokenStatus);

// Web push subscription endpoint
router.post('/web-push-subscribe', notificationController.subscribeWebPush);

module.exports = router; 