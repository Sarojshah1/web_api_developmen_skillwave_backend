# Push Notification System for Call Messages

## Overview

This document describes the push notification system integrated with Socket.IO for handling call-related messages in the E-Learning Backend. The system uses Expo's push notification service to deliver real-time notifications to mobile devices.

## Features

- **Real-time Call Notifications**: Instant push notifications for incoming, missed, accepted, rejected, and ended calls
- **Message Notifications**: Push notifications for direct messages, group messages, and study group messages
- **Group Call Support**: Notifications for group study sessions
- **Offline User Support**: Notifications sent to users who are offline
- **Notification Management**: Mark as read, delete, and manage notification history
- **Push Token Management**: Secure storage and validation of device push tokens
- **Socket.IO Integration**: Real-time updates via WebSocket connections

## Architecture

### Components

1. **Notification Model** (`models/notificationmodel.js`)
   - Stores notification data with TTL (24 hours)
   - Indexed for efficient queries
   - Supports different notification types

2. **Push Notification Service** (`utils/pushNotificationService.js`)
   - Handles Expo push notification delivery
   - Manages notification creation and storage
   - Provides call-specific notification methods

3. **Notification Controller** (`controllers/notificationController.js`)
   - REST API endpoints for notification management
   - Push token validation and updates
   - Notification CRUD operations

4. **Socket Events** (integrated in `index.js`)
   - Real-time call event handling
   - Push notification triggers
   - Push token updates via WebSocket

## API Endpoints

### Notification Management

```
GET /api/notifications
GET /api/notifications/unread-count
PATCH /api/notifications/:notificationId/read
PATCH /api/notifications/mark-all-read
PUT /api/notifications/push-token
DELETE /api/notifications/:notificationId
DELETE /api/notifications
POST /api/notifications/test
```

### Socket Events

#### Call Events
- `callIncoming`: Triggered when a call is initiated
- `callAccepted`: Triggered when a call is accepted
- `callRejected`: Triggered when a call is rejected
- `callEnded`: Triggered when a call ends
- `callMissed`: Triggered when a call is missed

#### Message Events
- `sendDirectMessage`: Send direct message to a user
- `sendGroupMessage`: Send message to a group
- `sendMessage`: Send message in study group (existing)
- `newDirectMessage`: Receive direct message
- `newGroupMessage`: Receive group message
- `newMessage`: Receive study group message (existing)
- `messageSent`: Confirmation of sent message

#### Push Token Events
- `updatePushToken`: Update device push token
- `pushTokenUpdated`: Confirmation of token update
- `pushTokenError`: Error in token update

## Setup Instructions

### 1. Environment Variables

Add to your `.env` file:
```env
EXPO_ACCESS_TOKEN=your_expo_access_token_here
```

### 2. Database Schema Updates

The User model has been updated to include:
```javascript
pushToken: { type: String, default: null }
```

### 3. Frontend Integration

#### Update Push Token
```javascript
// Via REST API
const response = await fetch('/api/notifications/push-token', {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({ pushToken: 'ExponentPushToken[...]' })
});

// Via Socket.IO
socket.emit('updatePushToken', {
  userId: 'user_id',
  pushToken: 'ExponentPushToken[...]'
});
```

#### Listen for Call Events
```javascript
// Listen for incoming calls
socket.on('callIncoming', (data) => {
  console.log('Incoming call from:', data.callerId);
  // Handle incoming call UI
});

// Listen for call responses
socket.on('callAccepted', (data) => {
  console.log('Call accepted by:', data.accepterId);
});

socket.on('callRejected', (data) => {
  console.log('Call rejected by:', data.rejecterId);
});

socket.on('callEnded', (data) => {
  console.log('Call ended by:', data.enderId);
});
```

#### Emit Call Events
```javascript
// Initiate a call
socket.emit('callIncoming', {
  context_id: 'group_id',
  userId: 'caller_id',
  targetUserId: 'target_user_id'
});

// Accept a call
socket.emit('callAccepted', {
  context_id: 'group_id',
  userId: 'accepter_id',
  callerId: 'caller_id'
});

// Reject a call
socket.emit('callRejected', {
  context_id: 'group_id',
  userId: 'rejecter_id',
  callerId: 'caller_id'
});

// End a call
socket.emit('callEnded', {
  context_id: 'group_id',
  userId: 'ender_id'
});
```

#### Emit Message Events
```javascript
// Send direct message
socket.emit('sendDirectMessage', {
  recipientId: 'recipient_user_id',
  userId: 'sender_id',
  message: 'Hello!',
  messageType: 'text'
});

// Send group message
socket.emit('sendGroupMessage', {
  groupId: 'group_id',
  userId: 'sender_id',
  message: 'Hello group!',
  messageType: 'text'
});

// Send study group message (existing)
socket.emit('sendMessage', {
  context_id: 'study_group_id',
  userId: 'sender_id',
  message: 'Hello study group!',
  messageType: 'text'
});
```

## Notification Types

### Call Notifications

1. **call_incoming**
   - Title: "Incoming Call"
   - Body: "{sender_name} is calling you"
   - Triggered when: User initiates a call

2. **call_missed**
   - Title: "Missed Call"
   - Body: "You missed a call from {sender_name}"
   - Triggered when: Call is not answered

3. **call_ended**
   - Title: "Call Ended"
   - Body: "Call with {sender_name} has ended"
   - Triggered when: Call is terminated

4. **call_rejected**
   - Title: "Call Rejected"
   - Body: "{sender_name} rejected your call"
   - Triggered when: Call is rejected

5. **call_accepted**
   - Title: "Call Accepted"
   - Body: "{sender_name} accepted your call"
   - Triggered when: Call is accepted

### Message Notifications

6. **message_direct**
   - Title: "New Message"
   - Body: "{sender_name}: {message_preview}"
   - Triggered when: Direct message received
   - Data includes: chatId, messageId, messagePreview

7. **message_group**
   - Title: "Group Message" or "Study Group Message"
   - Body: "{sender_name} in {group_name}: {message_preview}"
   - Triggered when: Group message received
   - Data includes: groupId, groupName, messageId, messagePreview

8. **message_received** (legacy)
   - Generic message notification
   - Used for backward compatibility

## Security Features

- **Authentication Required**: All notification endpoints require valid JWT token
- **Group Membership Verification**: Only group members can send call notifications
- **Push Token Validation**: Expo push token format validation
- **User Authorization**: Users can only access their own notifications

## Error Handling

### Common Errors

1. **Invalid Push Token**
   - Error: "Invalid push token format"
   - Solution: Ensure token follows Expo format

2. **User Not Found**
   - Error: "User not found"
   - Solution: Verify user ID exists

3. **Unauthorized**
   - Error: "Unauthorized to send notification"
   - Solution: Verify user is group member

4. **Group Not Found**
   - Error: "Group not found"
   - Solution: Verify group ID exists

### Error Responses

```javascript
{
  "success": false,
  "message": "Error description"
}
```

## Testing

### Test Push Notification
```bash
curl -X POST http://localhost:3000/api/notifications/test \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Call",
    "body": "This is a test call notification"
  }'
```

### Socket.IO Testing
```javascript
// Test call events
socket.emit('callIncoming', {
  context_id: 'test_group_id',
  userId: 'test_user_id',
  targetUserId: 'target_user_id'
});

// Test push token update
socket.emit('updatePushToken', {
  userId: 'test_user_id',
  pushToken: 'ExponentPushToken[test_token]'
});
```

## Performance Considerations

1. **Notification TTL**: Notifications expire after 24 hours
2. **Database Indexing**: Optimized queries for user notifications
3. **Chunked Delivery**: Expo notifications are sent in chunks
4. **Error Handling**: Failed notifications are marked as undelivered
5. **Rate Limiting**: Consider implementing rate limiting for production

## Monitoring

### Health Check
```bash
GET /health
```

Response includes:
- Active rooms count
- Total participants
- Server status

### Logs
- All push notification attempts are logged
- Failed deliveries are marked in database
- Socket connection events are logged

## Future Enhancements

1. **Notification Preferences**: Allow users to customize notification types
2. **Rich Notifications**: Support for images and actions
3. **Notification History**: Extended history with pagination
4. **Analytics**: Track notification delivery rates
5. **Multi-platform**: Support for iOS and Android specific features 