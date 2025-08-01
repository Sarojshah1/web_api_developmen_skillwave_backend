const express = require("express");
const { connectionmongoDB } = require("./connection");
const http = require("http");
const fileUpload = require('express-fileupload');
const cors = require("cors");
const socketIo = require('./utils/socket');
const { Server } = require('socket.io');
const morgan = require("morgan");
const chatRoutes = require('./routes/chatRoutes');
const GroupStudy = require('./models/GroupStudy');
const User = require('./models/usersmodel');
const pushNotificationService = require('./utils/pushNotificationService'); 

const app = express();
const corsOptions = {
    origin: true,
    credentials: true, 
    optionSuccessStatus: 201
};

const port = process.env.PORT || 3000;

// Database connection
connectionmongoDB(process.env.MONGO_URI);

// Middleware
app.use(express.json({ limit: "50mb" })); 
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
app.use(fileUpload());
app.use(cors(corsOptions));
app.use(morgan("dev"));
app.use(express.static("./public"));

// Request size logging middleware
app.use((req, res, next) => {
  const size = parseInt(req.headers["content-length"] || "0", 10);
  console.log("Incoming request size:", size / 1024, "KB");
  next();
});

// Server setup
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
      origin: "*", 
      methods: ["GET", "POST"]
    }
});

app.set('io', io);
global.io = io;

// Room management
let activeRooms = {}; 
let userSockets = {}; // Map userId to socketId
let socketUsers = {}; // Map socketId to userId

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Join room event
  socket.on('joinRoom', async ({ context_id, userId }) => {
    try {
      if (!context_id || !userId) {
        console.error('Missing context_id or userId');
        socket.emit('error', 'Invalid data');
        return;
      }

      // Verify group exists and user is a member
      const group = await GroupStudy.findById(context_id).populate('members', 'name profile_picture');
      if (!group) {
        socket.emit('error', 'Group not found');
        return;
      }

      const isMember = group.members.some(member => member._id.toString() === userId);
      if (!isMember) {
        socket.emit('error', 'You are not a member of this group');
        return;
      }

      // Store user info
      socket.userId = userId;
      socket.groupId = context_id;
      userSockets[userId] = socket.id;
      socketUsers[socket.id] = userId;

      // Join the room
      socket.join(context_id);

      // Initialize room if it doesn't exist
      if (!activeRooms[context_id]) {
        activeRooms[context_id] = [];
      }

      // Add user to room if not already present
      const existingUser = activeRooms[context_id].find(user => user.userId === userId);
      if (!existingUser) {
        const userInfo = group.members.find(member => member._id.toString() === userId);
        activeRooms[context_id].push({
          userId,
          socketId: socket.id,
          name: userInfo?.name || 'Unknown User',
          profile_picture: userInfo?.profile_picture || null,
          joinedAt: new Date()
        });
      }

      // Emit success to the joining user
      socket.emit("joinedRoom", {
        context_id,
        participants: activeRooms[context_id]
      });

      // Notify other users in the room about the new participant
      socket.to(context_id).emit('userJoined', {
        socketId: socket.id,
        userId,
        name: group.members.find(member => member._id.toString() === userId)?.name || 'Unknown User',
        participants: activeRooms[context_id]
      });

      console.log(`User ${userId} joined room ${context_id}. Total participants: ${activeRooms[context_id].length}`);

    } catch (err) {
      console.error('joinRoom error:', err.message);
      socket.emit('error', 'Internal server error');
    }
  });

  // Leave room event
  socket.on('leaveRoom', async ({ context_id, userId }) => {
    try {
      if (activeRooms[context_id]) {
        activeRooms[context_id] = activeRooms[context_id].filter(user => user.userId !== userId);
        
        // Notify other users
        socket.to(context_id).emit('userLeft', {
          socketId: socket.id,
          userId,
          participants: activeRooms[context_id]
        });

        // Leave the socket room
        socket.leave(context_id);
        
        console.log(`User ${userId} left room ${context_id}. Remaining participants: ${activeRooms[context_id].length}`);
      }
    } catch (err) {
      console.error('leaveRoom error:', err.message);
    }
  });

  // WebRTC Signaling Events
  socket.on("offer", async ({ offer, context_id, userId, targetSocketId }) => {
    try {
      const isAllowed = await verifyGroupMember(context_id, userId);
      if (!isAllowed) {
        socket.emit("error", "Unauthorized to send offer in this group");
        return;
      }

      if (targetSocketId) {
        // Send to specific user
        socket.to(targetSocketId).emit("offer", {
          offer,
          socketId: socket.id,
          userId
        });
      } else {
        // Broadcast to room (fallback)
        socket.to(context_id).emit("offer", {
          offer,
          socketId: socket.id,
          userId
        });
      }

      console.log(`Offer sent from ${userId} to ${targetSocketId || 'room'}`);
    } catch (err) {
      console.error('offer error:', err.message);
      socket.emit('error', 'Failed to send offer');
    }
  });

  socket.on("answer", async ({ answer, context_id, userId, targetSocketId }) => {
    try {
      const isAllowed = await verifyGroupMember(context_id, userId);
      if (!isAllowed) {
        socket.emit("error", "Unauthorized to send answer in this group");
        return;
      }

      if (targetSocketId) {
        socket.to(targetSocketId).emit("answer", {
          answer,
          socketId: socket.id,
          userId
        });
      } else {
        socket.to(context_id).emit("answer", {
          answer,
          socketId: socket.id,
          userId
        });
      }

      console.log(`Answer sent from ${userId} to ${targetSocketId || 'room'}`);
    } catch (err) {
      console.error('answer error:', err.message);
      socket.emit('error', 'Failed to send answer');
    }
  });

  socket.on("ice-candidate", async ({ candidate, context_id, userId, targetSocketId }) => {
    try {
      const isAllowed = await verifyGroupMember(context_id, userId);
      if (!isAllowed) {
        socket.emit("error", "Unauthorized to send ICE candidate in this group");
        return;
      }

      if (targetSocketId) {
        socket.to(targetSocketId).emit("ice-candidate", {
          candidate,
          socketId: socket.id,
          userId
        });
      } else {
        socket.to(context_id).emit("ice-candidate", {
          candidate,
          socketId: socket.id,
          userId
        });
      }

      console.log(`ICE candidate sent from ${userId} to ${targetSocketId || 'room'}`);
    } catch (err) {
      console.error('ice-candidate error:', err.message);
      socket.emit('error', 'Failed to send ICE candidate');
    }
  });

  // Media control events
  socket.on('toggleAudio', async ({ context_id, userId, isMuted }) => {
    try {
      const isAllowed = await verifyGroupMember(context_id, userId);
      if (!isAllowed) {
        socket.emit("error", "Unauthorized");
        return;
      }

      // Update room participant state
      if (activeRooms[context_id]) {
        const participant = activeRooms[context_id].find(user => user.userId === userId);
        if (participant) {
          participant.isMuted = isMuted;
        }
      }

      // Notify other participants
      socket.to(context_id).emit('audioToggled', {
        socketId: socket.id,
        userId,
        isMuted
      });

      console.log(`User ${userId} ${isMuted ? 'muted' : 'unmuted'} audio`);
    } catch (err) {
      console.error('toggleAudio error:', err.message);
    }
  });

  socket.on('toggleVideo', async ({ context_id, userId, isVideoOff }) => {
    try {
      const isAllowed = await verifyGroupMember(context_id, userId);
      if (!isAllowed) {
        socket.emit("error", "Unauthorized");
        return;
      }

      // Update room participant state
      if (activeRooms[context_id]) {
        const participant = activeRooms[context_id].find(user => user.userId === userId);
        if (participant) {
          participant.isVideoOff = isVideoOff;
        }
      }

      // Notify other participants
      socket.to(context_id).emit('videoToggled', {
        socketId: socket.id,
        userId,
        isVideoOff
      });

      console.log(`User ${userId} turned ${isVideoOff ? 'off' : 'on'} video`);
    } catch (err) {
      console.error('toggleVideo error:', err.message);
    }
  });

  socket.on('toggleScreenShare', async ({ context_id, userId, isScreenSharing }) => {
    try {
      const isAllowed = await verifyGroupMember(context_id, userId);
      if (!isAllowed) {
        socket.emit("error", "Unauthorized");
        return;
      }

      // Update room participant state
      if (activeRooms[context_id]) {
        const participant = activeRooms[context_id].find(user => user.userId === userId);
        if (participant) {
          participant.isScreenSharing = isScreenSharing;
        }
      }

      // Notify other participants
      socket.to(context_id).emit('screenShareToggled', {
        socketId: socket.id,
        userId,
        isScreenSharing
      });

      console.log(`User ${userId} ${isScreenSharing ? 'started' : 'stopped'} screen sharing`);
    } catch (err) {
      console.error('toggleScreenShare error:', err.message);
    }
  });

  // Chat events
  socket.on('typing', (context_id, userId) => {
    socket.broadcast.to(context_id).emit('userTyping', userId);  
  });

  socket.on('stopTyping', ({ context_id, userId }) => {
    socket.to(context_id).emit('userStoppedTyping', { userId });
  });

  socket.on('sendMessage', async ({ context_id, userId, message, messageType = 'text' }) => {
    try {
      const isAllowed = await verifyGroupMember(context_id, userId);
      if (!isAllowed) {
        socket.emit("error", "Unauthorized to send message");
        return;
      }

      // Get user info
      const user = await User.findById(userId).select('name profile_picture');
      
      const messageData = {
        _id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        group_id: context_id,
        sender: {
          _id: userId,
          name: user?.name || 'Unknown User',
          profile_picture: user?.profile_picture || null
        },
        message,
        timestamp: new Date().toISOString(),
        type: messageType
      };

      // Broadcast message to all users in the room
      io.to(context_id).emit('newMessage', messageData);

      // Send push notifications to offline users
      try {
        const group = await GroupStudy.findById(context_id).populate('members');
        if (group) {
          const offlineMembers = group.members.filter(member => 
            member._id.toString() !== userId.toString() && 
            !activeRooms[context_id]?.some(participant => 
              participant.userId === member._id.toString()
            )
          );

          if (offlineMembers.length > 0) {
            await pushNotificationService.sendMessageNotificationToMultiple(
              offlineMembers.map(member => member._id),
              userId,
              'study_group',
              {
                groupId: context_id,
                groupName: group.name,
                messageId: messageData._id,
                message: message
              }
            );
          }
        }
      } catch (notificationError) {
        console.error('Error sending message notifications:', notificationError);
      }

      console.log(`Message sent in room ${context_id} by ${userId}`);
    } catch (err) {
      console.error('sendMessage error:', err.message);
      socket.emit('error', 'Failed to send message');
    }
  });

  // Generic comment event (keeping for backward compatibility)
  socket.on("new-comment", (data) => {
    console.log("🗨️ New comment received via socket:", data);
  });

  // Disconnect event
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    
    const userId = socketUsers[socket.id];
    
    // Remove from all active rooms
    for (let context_id in activeRooms) {
      const userIndex = activeRooms[context_id].findIndex(user => user.socketId === socket.id);
      if (userIndex !== -1) {
        activeRooms[context_id].splice(userIndex, 1);
        
        // Notify other users in the room
        socket.to(context_id).emit('userLeft', {
          socketId: socket.id,
          userId,
          participants: activeRooms[context_id]
        });
        
        console.log(`User ${userId} removed from room ${context_id}. Users remaining: ${activeRooms[context_id].length}`);
        
        // Clean up empty rooms
        if (activeRooms[context_id].length === 0) {
          delete activeRooms[context_id];
          console.log(`Room ${context_id} deleted (empty)`);
        }
      }
    }
    
    // Clean up user mappings
    if (userId) {
      delete userSockets[userId];
    }
    delete socketUsers[socket.id];
  });

  // Get room participants
  socket.on('getRoomParticipants', async ({ context_id, userId }) => {
    try {
      const isAllowed = await verifyGroupMember(context_id, userId);
      if (!isAllowed) {
        socket.emit("error", "Unauthorized");
        return;
      }

      const participants = activeRooms[context_id] || [];
      socket.emit('roomParticipants', { context_id, participants });
    } catch (err) {
      console.error('getRoomParticipants error:', err.message);
      socket.emit('error', 'Failed to get participants');
    }
  });

  // Call-related events with push notifications
  socket.on('callIncoming', async ({ context_id, userId, targetUserId }) => {
    try {
      const isAllowed = await verifyGroupMember(context_id, userId);
      if (!isAllowed) {
        socket.emit("error", "Unauthorized to initiate call");
        return;
      }

      // Send push notification to target user
      if (targetUserId) {
        await pushNotificationService.handleCallNotification(
          userId,
          context_id,
          'incoming',
          { excludeUserId: userId }
        );
      }

      // Emit to room
      socket.to(context_id).emit('callIncoming', {
        callerId: userId,
        context_id,
        timestamp: new Date().toISOString()
      });

      console.log(`Call incoming from ${userId} in group ${context_id}`);
    } catch (err) {
      console.error('callIncoming error:', err.message);
      socket.emit('error', 'Failed to initiate call');
    }
  });

  socket.on('callAccepted', async ({ context_id, userId, callerId }) => {
    try {
      const isAllowed = await verifyGroupMember(context_id, userId);
      if (!isAllowed) {
        socket.emit("error", "Unauthorized");
        return;
      }

      // Send push notification to caller
      await pushNotificationService.handleCallNotification(
        userId,
        context_id,
        'accepted',
        { excludeUserId: userId }
      );

      // Emit to room
      socket.to(context_id).emit('callAccepted', {
        accepterId: userId,
        callerId,
        context_id,
        timestamp: new Date().toISOString()
      });

      console.log(`Call accepted by ${userId} in group ${context_id}`);
    } catch (err) {
      console.error('callAccepted error:', err.message);
    }
  });

  socket.on('callRejected', async ({ context_id, userId, callerId }) => {
    try {
      const isAllowed = await verifyGroupMember(context_id, userId);
      if (!isAllowed) {
        socket.emit("error", "Unauthorized");
        return;
      }

      // Send push notification to caller
      await pushNotificationService.handleCallNotification(
        userId,
        context_id,
        'rejected',
        { excludeUserId: userId }
      );

      // Emit to room
      socket.to(context_id).emit('callRejected', {
        rejecterId: userId,
        callerId,
        context_id,
        timestamp: new Date().toISOString()
      });

      console.log(`Call rejected by ${userId} in group ${context_id}`);
    } catch (err) {
      console.error('callRejected error:', err.message);
    }
  });

  socket.on('callEnded', async ({ context_id, userId }) => {
    try {
      const isAllowed = await verifyGroupMember(context_id, userId);
      if (!isAllowed) {
        socket.emit("error", "Unauthorized");
        return;
      }

      // Send push notification to other participants
      await pushNotificationService.handleCallNotification(
        userId,
        context_id,
        'ended',
        { excludeUserId: userId }
      );

      // Emit to room
      socket.to(context_id).emit('callEnded', {
        enderId: userId,
        context_id,
        timestamp: new Date().toISOString()
      });

      console.log(`Call ended by ${userId} in group ${context_id}`);
    } catch (err) {
      console.error('callEnded error:', err.message);
    }
  });

  socket.on('callMissed', async ({ context_id, userId, targetUserId }) => {
    try {
      const isAllowed = await verifyGroupMember(context_id, userId);
      if (!isAllowed) {
        socket.emit("error", "Unauthorized");
        return;
      }

      // Send push notification to target user
      if (targetUserId) {
        await pushNotificationService.handleCallNotification(
          userId,
          context_id,
          'missed',
          { excludeUserId: userId }
        );
      }

      console.log(`Call missed by ${targetUserId} from ${userId} in group ${context_id}`);
    } catch (err) {
      console.error('callMissed error:', err.message);
    }
  });

  // Update push token via socket
  socket.on('updatePushToken', async ({ userId, pushToken }) => {
    try {
      // Validate push token format
      const { Expo } = require('expo-server-sdk');
      if (!Expo.isExpoPushToken(pushToken)) {
        socket.emit('pushTokenError', 'Invalid push token format');
        return;
      }

      // Update user's push token
      const user = await User.findByIdAndUpdate(
        userId,
        { pushToken },
        { new: true }
      );

      if (!user) {
        socket.emit('pushTokenError', 'User not found');
        return;
      }

      socket.emit('pushTokenUpdated', { success: true, pushToken });
      console.log(`Push token updated for user ${userId}`);
    } catch (err) {
      console.error('updatePushToken error:', err.message);
      socket.emit('pushTokenError', 'Failed to update push token');
    }
  });

  // Direct message events
  socket.on('sendDirectMessage', async ({ recipientId, userId, message, messageType = 'text' }) => {
    try {
      // Verify sender exists
      const sender = await User.findById(userId);
      if (!sender) {
        socket.emit("error", "Sender not found");
        return;
      }

      // Verify recipient exists
      const recipient = await User.findById(recipientId);
      if (!recipient) {
        socket.emit("error", "Recipient not found");
        return;
      }

      const messageData = {
        _id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        sender: {
          _id: userId,
          name: sender.name,
          profile_picture: sender.profile_picture
        },
        recipient: {
          _id: recipientId,
          name: recipient.name,
          profile_picture: recipient.profile_picture
        },
        message,
        timestamp: new Date().toISOString(),
        type: messageType
      };

      // Send to recipient if online
      const recipientSocketId = userSockets[recipientId];
      if (recipientSocketId) {
        socket.to(recipientSocketId).emit('newDirectMessage', messageData);
      }

      // Send push notification to recipient if offline
      if (!recipientSocketId) {
        await pushNotificationService.handleMessageNotification(
          userId,
          recipientId,
          'direct',
          {
            chatId: `chat_${userId}_${recipientId}`,
            messageId: messageData._id,
            message: message
          }
        );
      }

      // Confirm to sender
      socket.emit('messageSent', messageData);

      console.log(`Direct message sent from ${userId} to ${recipientId}`);
    } catch (err) {
      console.error('sendDirectMessage error:', err.message);
      socket.emit('error', 'Failed to send direct message');
    }
  });

  // Group chat message events
  socket.on('sendGroupMessage', async ({ groupId, userId, message, messageType = 'text' }) => {
    try {
      // Verify group exists and user is member
      const group = await GroupStudy.findById(groupId).populate('members');
      if (!group) {
        socket.emit("error", "Group not found");
        return;
      }

      const isMember = group.members.some(member => member._id.toString() === userId);
      if (!isMember) {
        socket.emit("error", "You are not a member of this group");
        return;
      }

      const sender = await User.findById(userId);
      if (!sender) {
        socket.emit("error", "Sender not found");
        return;
      }

      const messageData = {
        _id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        group_id: groupId,
        sender: {
          _id: userId,
          name: sender.name,
          profile_picture: sender.profile_picture
        },
        message,
        timestamp: new Date().toISOString(),
        type: messageType
      };

      // Broadcast to all online members
      io.to(groupId).emit('newGroupMessage', messageData);

      // Send push notifications to offline members
      const onlineMemberIds = activeRooms[groupId]?.map(p => p.userId) || [];
      const offlineMembers = group.members.filter(member => 
        member._id.toString() !== userId.toString() && 
        !onlineMemberIds.includes(member._id.toString())
      );

      if (offlineMembers.length > 0) {
        await pushNotificationService.sendMessageNotificationToMultiple(
          offlineMembers.map(member => member._id),
          userId,
          'group',
          {
            groupId: groupId,
            groupName: group.name,
            messageId: messageData._id,
            message: message
          }
        );
      }

      console.log(`Group message sent in ${groupId} by ${userId}`);
    } catch (err) {
      console.error('sendGroupMessage error:', err.message);
      socket.emit('error', 'Failed to send group message');
    }
  });
});

// Helper function to verify group membership
async function verifyGroupMember(groupId, userId) {
  try {
    const group = await GroupStudy.findById(groupId);
    if (!group) return false;
    return group.members.some(member => member.toString() === userId);
  } catch (error) {
    console.error('verifyGroupMember error:', error.message);
    return false;
  }
}

// API Routes
app.use("/api/user", require("./routes/userRoutes"));
app.use("/api/category", require("./routes/categoryRoutes"));
app.use("/api/courses", require("./routes/courseRoutes"));
app.use("/api/blog", require("./routes/blogRoutes"));
app.use("/api/lesson", require("./routes/lessonRoutes"));
app.use("/api/review", require("./routes/reviewRoutes"));
app.use("/api/quiz", require("./routes/quizRoutes"));
app.use("/api/question", require("./routes/questionRoutes"));
app.use("/api/enroll", require("./routes/enrollmentRoutes"));
app.use("/api/result", require("./routes/userQuizResultRoutes"));
app.use("/api/certificate", require("./routes/certificateRoutes"));
app.use("/api/payment", require("./routes/paymentRoutes"));
app.use("/api/post", require("./routes/fourmpostroutes"));
app.use("/api/groupstudy", require("./routes/groupStudyRoutes"));
app.use("/api/otp", require("./routes/otproutes"));
app.use("/api/verify", require("./routes/verifyotproute"));
app.use('/api/chats', require("./routes/chatRoutes"));
app.use('/api/notifications', require("./routes/notificationRoutes"));

app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    activeRooms: Object.keys(activeRooms).length,
    totalParticipants: Object.values(activeRooms).reduce((total, room) => total + room.length, 0)
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Only start server if not in test mode
if (process.env.NODE_ENV !== 'test') {
server.listen(port, () => {
  console.log(` Server starting at port ${port}`);
  console.log(` Socket.IO server ready for connections`);
  console.log(`Health check available at http://localhost:${port}/health`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});
}

module.exports = { app, server, io };
