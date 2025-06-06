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
const app = express();
const corsOptions = {
    origin: true,
    credentials: true, 
    optionSuccessStatus: 201
  };
const port = process.env.PORT || 3000;
connectionmongoDB("mongodb://localhost:27017/E-learning");
app.use(express.json());
app.use(fileUpload());
app.use(express.json());
app.use(cors(corsOptions));
app.use(express.urlencoded({limit: '10mb', extended: true }));
app.use(morgan("dev"));
app.use(express.static("./public"))

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
      origin: "*", 
      methods: ["GET", "POST"]
    }
});
app.set('io', io);
global.io = io;
let activeRooms = {}; 
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  socket.on('joinRoom', async ({ context_id, userId }) => {
    try {
      if (!context_id || !userId) {
        console.error('Missing context_id or userId');
        socket.emit('error', 'Invalid data');
        return;
      }

      const group = await GroupStudy.findById(context_id);

      if (!group) {
        socket.emit('error', 'Group not found');
        return;
      }

      const isMember = group.members.some(member => member.toString() === userId);
      if (!isMember) {
        socket.emit('error', 'You are not a member of this group');
        return;
      }
      socket.userId = userId;
      socket.groupId = context_id;

      socket.join(context_id);

      if (!activeRooms[context_id]) {
        activeRooms[context_id] = [];
      }

      activeRooms[context_id].push(socket.id);

      socket.emit("joinedRoom", context_id);
      console.log(`User ${userId} joined room ${context_id}`);

      if (activeRooms[context_id].length === 5) {
        io.to(context_id).emit('startCall', context_id);
      }

    } catch (err) {
      console.error('joinRoom error:', err.message);
      socket.emit('error', 'Internal server error');
    }
  });
  socket.on("new-comment", (data) => {
    console.log("🗨️ New comment received via socket:", data);
  });
  socket.on('typing', (context_id, userId) => {
    socket.broadcast.to(context_id).emit('userTyping', userId);  
  });
 
  socket.on("offer", async ({ offer, context_id, userId }) => {
    const isAllowed = await verifyGroupMember(context_id, userId);
    if (!isAllowed) {
      socket.emit("error", "Unauthorized to send offer in this group");
      return;
    }
    socket.to(context_id).emit("offer", offer);
  });

  socket.on("answer", async ({ answer, context_id, userId }) => {
    const isAllowed = await verifyGroupMember(context_id, userId);
    if (!isAllowed) {
      socket.emit("error", "Unauthorized to send answer in this group");
      return;
    }
    socket.to(context_id).emit("answer", answer);
  });

  socket.on("ice-candidate", async ({ candidate, context_id, userId }) => {
    const isAllowed = await verifyGroupMember(context_id, userId);
    if (!isAllowed) {
      socket.emit("error", "Unauthorized to send ICE candidate in this group");
      return;
    }
    socket.to(context_id).emit("ice-candidate", candidate);
  });

  socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id);

      for (let context_id in activeRooms) {
          const index = activeRooms[context_id].indexOf(socket.id);
          if (index !== -1) {
              activeRooms[context_id].splice(index, 1);
              console.log(`User removed from room ${context_id}. Users remaining: ${activeRooms[context_id].join(", ")}`);
          }
      }
  });
});

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



app.use("/api/user",require("./routes/userRoutes"))
app.use("/api/category",require("./routes/categoryRoutes"))
app.use("/api/courses",require("./routes/courseRoutes"))
app.use("/api/blog",require("./routes/blogRoutes"))
app.use("/api/lesson",require("./routes/lessonRoutes"))
app.use("/api/review",require("./routes/reviewRoutes"))
app.use("/api/quiz",require("./routes/quizRoutes"))
app.use("/api/question",require("./routes/questionRoutes"))
app.use("/api/enroll",require("./routes/enrollmentRoutes"))
app.use("/api/result",require("./routes/userQuizResultRoutes"))
app.use("/api/certificate",require("./routes/certificateRoutes"))
app.use("/api/payment",require("./routes/paymentRoutes"))
app.use("/api/post",require("./routes/fourmpostroutes"))
app.use("/api/groupstudy",require("./routes/groupStudyRoutes"))
app.use("/api/otp",require("./routes/otproutes"))
app.use("/api/verify",require("./routes/verifyotproute"))
app.use('/api/chats', require("./routes/chatRoutes"));

server.listen(port, () => console.log(`Starting app at ${port}`));