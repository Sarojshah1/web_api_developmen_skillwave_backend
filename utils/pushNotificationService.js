const { Expo } = require('expo-server-sdk');
const Notification = require('../models/notificationmodel');
const User = require('../models/usersmodel');
const webpush = require('web-push');
webpush.setVapidDetails(
  'mailto:sarojahah152@email.com',
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

// Initialize Expo SDK
const expo = new Expo();

class PushNotificationService {
  constructor() {
    this.expo = expo;
  }

  // Send push notification to a single user
  async sendPushNotification(recipientId, senderId, type, title, body, data = {}) {
    try {
      // Get recipient user info
      const recipient = await User.findById(recipientId);
      if (!recipient) {
        console.log(`No recipient found for user ${recipientId}`);
        return false;
      }

      // Get sender user info
      const sender = await User.findById(senderId);
      if (!sender) {
        console.log(`Sender not found: ${senderId}`);
        return false;
      }

      // Create notification record
      const notification = new Notification({
        recipient: recipientId,
        sender: senderId,
        type,
        title,
        body,
        data: {
          ...data,
          senderName: sender.name,
          senderProfilePicture: sender.profile_picture
        },
        groupId: data.groupId,
        pushToken: recipient.pushToken
      });

      // Save notification to database
      await notification.save();

      // Send Expo push notification if pushToken exists
      if (recipient.pushToken && Expo.isExpoPushToken(recipient.pushToken)) {
        const pushMessage = {
          to: recipient.pushToken,
          sound: 'default',
          title,
          body,
          data: {
            ...data,
            notificationId: notification._id.toString(),
            type,
            senderId: senderId.toString(),
            senderName: sender.name,
            senderProfilePicture: sender.profile_picture
          },
          priority: 'high',
          channelId: 'calls',
          badge: 1
        };
        const chunks = expo.chunkPushNotifications([pushMessage]);
        const tickets = [];
        for (let chunk of chunks) {
          try {
            const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
            tickets.push(...ticketChunk);
          } catch (error) {
            console.error('Error sending push notification chunk:', error);
          }
        }
        // Check for errors in tickets
        const errors = [];
        for (let ticket of tickets) {
          if (ticket.status === 'error') {
            errors.push(ticket.message);
          }
        }
        if (errors.length > 0) {
          console.error('Push notification errors:', errors);
          notification.isDelivered = false;
          await notification.save();
          return false;
        }
      }

      // Send Web Push notification if webPushSubscription exists
      if (recipient.webPushSubscription) {
        try {
          await webpush.sendNotification(
            recipient.webPushSubscription,
            JSON.stringify({ title, body })
          );
        } catch (err) {
          console.error('Error sending web push notification:', err);
        }
      }

      // Mark as delivered
      notification.isDelivered = true;
      await notification.save();

      console.log(`Push notification sent successfully to ${recipientId}`);
      return true;

    } catch (error) {
      console.error('Error sending push notification:', error);
      return false;
    }
  }

  // Send call notification to group members
  async sendCallNotificationToGroup(groupId, senderId, type, title, body, excludeUserId = null) {
    try {
      const GroupStudy = require('../models/GroupStudy');
      const group = await GroupStudy.findById(groupId).populate('members');
      
      if (!group) {
        console.error(`Group not found: ${groupId}`);
        return false;
      }

      const results = [];
      for (let member of group.members) {
        // Skip sender and excluded user
        if (member._id.toString() === senderId.toString() || 
            (excludeUserId && member._id.toString() === excludeUserId.toString())) {
          continue;
        }

        const success = await this.sendPushNotification(
          member._id,
          senderId,
          type,
          title,
          body,
          { groupId }
        );
        
        results.push({
          userId: member._id,
          success
        });
      }

      return results;

    } catch (error) {
      console.error('Error sending call notification to group:', error);
      return false;
    }
  }

  // Handle call-specific notifications
  async handleCallNotification(senderId, groupId, callType, callData = {}) {
    const sender = await User.findById(senderId);
    if (!sender) return false;

    const group = await GroupStudy.findById(groupId);
    if (!group) return false;

    let title, body, type;

    switch (callType) {
      case 'incoming':
        title = `Incoming Call`;
        body = `${sender.name} is calling you`;
        type = 'call_incoming';
        break;
      
      case 'missed':
        title = `Missed Call`;
        body = `You missed a call from ${sender.name}`;
        type = 'call_missed';
        break;
      
      case 'ended':
        title = `Call Ended`;
        body = `Call with ${sender.name} has ended`;
        type = 'call_ended';
        break;
      
      case 'rejected':
        title = `Call Rejected`;
        body = `${sender.name} rejected your call`;
        type = 'call_rejected';
        break;
      
      case 'accepted':
        title = `Call Accepted`;
        body = `${sender.name} accepted your call`;
        type = 'call_accepted';
        break;
      
      default:
        return false;
    }

    return await this.sendCallNotificationToGroup(
      groupId,
      senderId,
      type,
      title,
      body,
      callData.excludeUserId
    );
  }

  // Handle message notifications
  async handleMessageNotification(senderId, recipientId, messageType, messageData = {}) {
    try {
      const sender = await User.findById(senderId);
      if (!sender) return false;

      let title, body, type, data = {};

      switch (messageType) {
        case 'direct':
          title = `New Message`;
          body = `${sender.name}: ${messageData.message || 'Sent you a message'}`;
          type = 'message_direct';
          data = {
            chatId: messageData.chatId,
            messageId: messageData.messageId,
            messagePreview: messageData.message?.substring(0, 100) || '',
            senderName: sender.name,
            senderProfilePicture: sender.profile_picture
          };
          break;
        
        case 'group':
          title = `Group Message`;
          body = `${sender.name} in ${messageData.groupName || 'Group'}: ${messageData.message || 'Sent a message'}`;
          type = 'message_group';
          data = {
            groupId: messageData.groupId,
            groupName: messageData.groupName,
            messageId: messageData.messageId,
            messagePreview: messageData.message?.substring(0, 100) || '',
            senderName: sender.name,
            senderProfilePicture: sender.profile_picture
          };
          break;
        
        case 'study_group':
          title = `Study Group Message`;
          body = `${sender.name} in ${messageData.groupName || 'Study Group'}: ${messageData.message || 'Sent a message'}`;
          type = 'message_group';
          data = {
            groupId: messageData.groupId,
            groupName: messageData.groupName,
            messageId: messageData.messageId,
            messagePreview: messageData.message?.substring(0, 100) || '',
            senderName: sender.name,
            senderProfilePicture: sender.profile_picture,
            isStudyGroup: true
          };
          break;
        
        default:
          return false;
      }

      // Send notification to recipient
      return await this.sendPushNotification(
        recipientId,
        senderId,
        type,
        title,
        body,
        data
      );

    } catch (error) {
      console.error('Error handling message notification:', error);
      return false;
    }
  }

  // Send message notification to multiple recipients
  async sendMessageNotificationToMultiple(recipients, senderId, messageType, messageData = {}) {
    try {
      const results = [];
      
      for (let recipientId of recipients) {
        // Skip sender
        if (recipientId.toString() === senderId.toString()) {
          continue;
        }

        const success = await this.handleMessageNotification(
          senderId,
          recipientId,
          messageType,
          messageData
        );
        
        results.push({
          userId: recipientId,
          success
        });
      }

      return results;
    } catch (error) {
      console.error('Error sending message notification to multiple recipients:', error);
      return false;
    }
  }

  // Get user's notifications
  async getUserNotifications(userId, limit = 20, offset = 0) {
    try {
      const notifications = await Notification.find({ recipient: userId })
        .populate('sender', 'name profile_picture')
        .populate('groupId', 'name')
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip(offset);

      return notifications;
    } catch (error) {
      console.error('Error getting user notifications:', error);
      return [];
    }
  }

  // Mark notification as read
  async markAsRead(notificationId, userId) {
    try {
      const notification = await Notification.findOneAndUpdate(
        { _id: notificationId, recipient: userId },
        { isRead: true },
        { new: true }
      );
      return notification;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      return null;
    }
  }

  // Mark all notifications as read for user
  async markAllAsRead(userId) {
    try {
      const result = await Notification.updateMany(
        { recipient: userId, isRead: false },
        { isRead: true }
      );
      return result;
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      return null;
    }
  }

  // Get unread notification count
  async getUnreadCount(userId) {
    try {
      const count = await Notification.countDocuments({
        recipient: userId,
        isRead: false
      });
      return count;
    } catch (error) {
      console.error('Error getting unread count:', error);
      return 0;
    }
  }
}

module.exports = new PushNotificationService(); 