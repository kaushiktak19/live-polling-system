const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const http = require("http");
require("dotenv").config();
const { Server } = require("socket.io");
const { TeacherLogin } = require("./controllers/login");
const { createPoll, voteOnOption, getPolls } = require("../src/controllers/poll");

const app = express();

const FRONTEND_URL = process.env.FRONTEND_URL || 'https://live-polling-system-kohl.vercel.app';

console.log('Frontend URL:', FRONTEND_URL);

app.use(cors({
  origin: FRONTEND_URL,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));

app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    frontendUrl: FRONTEND_URL,
    origin: req.headers.origin 
  });
});

const DB = process.env.MONGODB_URL;

mongoose.set("strictQuery", true);

mongoose.connect(DB, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => {
    console.error("Failed to connect to MongoDB:", err);
    process.exit(1);
  });

const port = process.env.PORT || 3000;
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: FRONTEND_URL,
    methods: ["GET", "POST"],
    credentials: true,
  },
  pingTimeout: 60000,
  pingInterval: 25000,
  transports: ['websocket', 'polling'],
  allowEIO3: true,
});

let votes = {};
let connectedUsers = {};
let joinedUsers = new Set();

io.on("connection", (socket) => {
  console.log(`User connected: ${socket.id}`);
  
  // Handle connection errors
  socket.on("connect_error", (error) => {
    console.error("Socket connection error:", error);
  });

  socket.on("createPoll", async (pollData) => {
    votes = {};
    try {
      const poll = await createPoll(pollData);
      io.emit("pollCreated", poll);
    } catch (err) {
      console.error("Error creating poll:", err);
      socket.emit("error", { message: "Failed to create poll" });
    }
  });

  socket.on("submitAnswer", async (answerData) => {
    votes[answerData.option] = (votes[answerData.option] || 0) + 1;
    try {
      await voteOnOption(answerData.pollId, answerData.option);
    } catch (err) {
      console.error("Error submitting vote:", err);
    }
    io.emit("pollResults", votes);
  });

  socket.on("joinChat", ({ username }) => {
    console.log(`User ${username} joining chat with socket ${socket.id}`);
    
    if (!joinedUsers.has(socket.id)) {
      connectedUsers[socket.id] = username;
      joinedUsers.add(socket.id);
      console.log(`Updated connected users:`, Object.values(connectedUsers));
      
      // Emit to all clients with a small delay to ensure connection is stable
      setTimeout(() => {
        io.emit("participantsUpdate", Object.values(connectedUsers));
      }, 100);
    } else {
      console.log(`User ${username} already joined with socket ${socket.id}`);
    }
  });

  socket.on("chatMessage", (message) => {
    console.log(`Chat message from ${message.username}: ${message.text}`);
    io.emit("chatMessage", message);
  });

  socket.on("kickOut", (userToKick) => {
    console.log(`Attempting to kick out user: ${userToKick}`);
    for (let id in connectedUsers) {
      if (connectedUsers[id] === userToKick) {
        console.log(`Kicking out user ${userToKick} with socket ${id}`);
        io.to(id).emit("kickedOut", { message: "You have been kicked out." });
        const userSocket = io.sockets.sockets.get(id);
        if (userSocket) userSocket.disconnect(true);
        delete connectedUsers[id];
        joinedUsers.delete(id);
        io.emit("participantsUpdate", Object.values(connectedUsers));
        break;
      }
    }
  });

  socket.on("studentLogin", (name) => {
    console.log(`Student login: ${name}`);
    socket.emit("loginSuccess", { message: "Login successful", name });
  });

  // Handle disconnection
  socket.on("disconnect", (reason) => {
    console.log(`User disconnected: ${socket.id}, reason: ${reason}`);
    const username = connectedUsers[socket.id];
    if (username) {
      console.log(`Removing user ${username} from connected users`);
    }
    delete connectedUsers[socket.id];
    joinedUsers.delete(socket.id);
    
    // Emit participants update with delay to ensure cleanup is complete
    setTimeout(() => {
      io.emit("participantsUpdate", Object.values(connectedUsers));
    }, 100);
  });

  // Handle reconnection
  socket.on("reconnect", (attemptNumber) => {
    console.log(`User reconnected: ${socket.id}, attempt: ${attemptNumber}`);
  });
});

app.get("/", (req, res) => res.send("Live Polling System Backend"));

app.post("/teacher-login", (req, res) => TeacherLogin(req, res));

app.get("/polls/:teacherUsername", async (req, res) => {
  try {
    await getPolls(req, res);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch polls" });
  }
});

server.listen(port, () => console.log(`Server running on port ${port}...`));
