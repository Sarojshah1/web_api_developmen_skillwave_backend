const pushNotificationService = require('../utils/pushNotificationService');
const Notification = require('../models/notificationmodel');
const User = require('../models/usersmodel');
const webpush = require('web-push');
webpush.setVapidDetails(
  'mailto:your@email.com',
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

// Get user's notifications
const getUserNotifications = async (req, res) => {
  try {
    const { limit = 20, offset = 0 } = req.query;
    const userId = req.user._id;

    const notifications = await pushNotificationService.getUserNotifications(
      userId,
      parseInt(limit),
      parseInt(offset)
    );

    res.status(200).json({
      success: true,
      data: notifications
    });
  } catch (error) {
    console.error('Error getting user notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get notifications'
    });
  }
};

// Mark notification as read
const markAsRead = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const userId = req.user.id;

    const notification = await pushNotificationService.markAsRead(notificationId, userId);
    
    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    res.status(200).json({
      success: true,
      data: notification
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark notification as read'
    });
  }
};

// Mark all notifications as read
const markAllAsRead = async (req, res) => {
  try {
    const userId = req.user._id;

    const result = await pushNotificationService.markAllAsRead(userId);

    res.status(200).json({
      success: true,
      message: 'All notifications marked as read',
      data: result
    });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark notifications as read'
    });
  }
};

// Get unread notification count
const getUnreadCount = async (req, res) => {
  try {
    const userId = req.user._id;

    const count = await pushNotificationService.getUnreadCount(userId);

    res.status(200).json({
      success: true,
      data: { count }
    });
  } catch (error) {
    console.error('Error getting unread count:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get unread count'
    });
  }
};

// Update user's push token
const updatePushToken = async (req, res) => {
  try {
    const { pushToken } = req.body;
    const userId = req.user._id;

    if (!pushToken) {
      return res.status(400).json({
        success: false,
        message: 'Push token is required'
      });
    }

    // Validate Expo push token format
    const { Expo } = require('expo-server-sdk');
    if (!Expo.isExpoPushToken(pushToken)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid push token format'
      });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { pushToken },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Push token updated successfully',
      data: { pushToken: user.pushToken }
    });
  } catch (error) {
    console.error('Error updating push token:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update push token'
    });
  }
};

// Delete notification
const deleteNotification = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const userId = req.user._id;

    const notification = await Notification.findOneAndDelete({
      _id: notificationId,
      recipient: userId
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Notification deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete notification'
    });
  }
};

// Delete all notifications for user
const deleteAllNotifications = async (req, res) => {
  try {
    const userId = req.user._id;

    const result = await Notification.deleteMany({ recipient: userId });

    res.status(200).json({
      success: true,
      message: 'All notifications deleted successfully',
      data: { deletedCount: result.deletedCount }
    });
  } catch (error) {
    console.error('Error deleting all notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete notifications'
    });
  }
};

// Test push notification (for development)
const testPushNotification = async (req, res) => {
  try {
    const userId = req.user._id;
    const { title = 'Test Notification', body = 'This is a test notification' } = req.body;

    // Check if user has push token
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (!user.pushToken) {
      return res.status(400).json({
        success: false,
        message: 'Push token not set for this user. Please set a push token first.',
        data: {
          userId: user._id,
          userName: user.name,
          hasPushToken: false
        }
      });
    }

    console.log(`Testing notification for user: ${user.name} with token: ${user.pushToken}`);

    const success = await pushNotificationService.sendPushNotification(
      userId,
      userId, 
      'message_group',
      title,
      body,
      { test: true }
    );

    if (success) {
      res.status(200).json({
        success: true,
        message: 'Test notification sent successfully',
        data: {
          userId: user._id,
          userName: user.name,
          pushToken: user.pushToken
        }
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Failed to send test notification. Check server logs for details.',
        data: {
          userId: user._id,
          userName: user.name,
          pushToken: user.pushToken
        }
      });
    }
  } catch (error) {
    console.error('Error sending test notification:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send test notification',
      error: error.message
    });
  }
};

const subscribeWebPush = async (req, res) => {
  try {
    const { subscription } = req.body;
    const userId = req.user._id;
    await User.findByIdAndUpdate(userId, { webPushSubscription: subscription });
    res.status(200).json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to save subscription' });
  }
};

module.exports = {
  getUserNotifications,
  markAsRead,
  markAllAsRead,
  getUnreadCount,
  updatePushToken,
  deleteNotification,
  deleteAllNotifications,
  testPushNotification,
  subscribeWebPush
};

// Get user's push token status
const getPushTokenStatus = async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        userId: user._id,
        userName: user.name,
        hasPushToken: !!user.pushToken,
        pushToken: user.pushToken || null
      }
    });
  } catch (error) {
    console.error('Error getting push token status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get push token status'
    });
  }
};

module.exports = {
  getUserNotifications,
  markAsRead,
  markAllAsRead,
  getUnreadCount,
  updatePushToken,
  deleteNotification,
  deleteAllNotifications,
  testPushNotification,
  subscribeWebPush,
  getPushTokenStatus
}; 