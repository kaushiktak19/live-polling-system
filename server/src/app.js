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
});

let votes = {};
let connectedUsers = {};
let joinedUsers = new Set();

io.on("connection", (socket) => {
  socket.on("createPoll", async (pollData) => {
    votes = {};
    try {
      const poll = await createPoll(pollData);
      io.emit("pollCreated", poll);
    } catch (err) {
      socket.emit("error", { message: "Failed to create poll" });
    }
  });

  socket.on("submitAnswer", async (answerData) => {
    votes[answerData.option] = (votes[answerData.option] || 0) + 1;
    try {
      await voteOnOption(answerData.pollId, answerData.option);
    } catch (err) {}
    io.emit("pollResults", votes);
  });

  socket.on("joinChat", ({ username }) => {
    if (!joinedUsers.has(socket.id)) {
      connectedUsers[socket.id] = username;
      joinedUsers.add(socket.id);
      io.emit("participantsUpdate", Object.values(connectedUsers));
    }

    socket.on("disconnect", () => {
      delete connectedUsers[socket.id];
      joinedUsers.delete(socket.id);
      io.emit("participantsUpdate", Object.values(connectedUsers));
    });
  });

  socket.on("chatMessage", (message) => io.emit("chatMessage", message));

  socket.on("kickOut", (userToKick) => {
    for (let id in connectedUsers) {
      if (connectedUsers[id] === userToKick) {
        io.to(id).emit("kickedOut", { message: "You have been kicked out." });
        const userSocket = io.sockets.sockets.get(id);
        if (userSocket) userSocket.disconnect(true);
        delete connectedUsers[id];
        io.emit("participantsUpdate", Object.values(connectedUsers));
        break;
      }
    }
  });

  socket.on("studentLogin", (name) => socket.emit("loginSuccess", { message: "Login successful", name }));

  socket.on("disconnect", () => {
    delete connectedUsers[socket.id];
    joinedUsers.delete(socket.id);
    io.emit("participantsUpdate", Object.values(connectedUsers));
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
