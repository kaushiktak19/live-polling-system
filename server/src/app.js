const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const http = require("http");
require("dotenv").config();
const { Server } = require("socket.io");
const { TeacherLogin } = require("./controllers/login");
const {
  createPoll,
  voteOnOption,
  getPolls,
} = require("../src/controllers/poll");

const app = express();
app.use(cors());
app.use(express.json());

const port = process.env.PORT || 3000;

const DB = process.env.MONGODB_URL;

mongoose
  .connect(DB)
  .then(() => {
    console.log("Connected to MongoDB");
  })
  .catch((e) => {
    console.error("Failed to connect to MongoDB:", e);
  });

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

let votes = {};
let connectedUsers = {};
let joinedUsers = new Set(); 

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("createPoll", async (pollData) => {
    console.log("Teacher creating poll:", pollData);
    console.log("Connected users:", connectedUsers);
    votes = {};
    const poll = await createPoll(pollData);
    console.log("Poll created and broadcasting to all clients:", poll);
    io.emit("pollCreated", poll);
  });

  socket.on("kickOut", (userToKick) => {
    console.log("Attempting to kick out user:", userToKick);
    console.log("Current connected users:", connectedUsers);
    
    for (let id in connectedUsers) {
      if (connectedUsers[id] === userToKick) {
        console.log("Found user to kick:", userToKick, "with socket id:", id);
        
        io.to(id).emit("kickedOut", { message: "You have been kicked out." });
        
        const userSocket = io.sockets.sockets.get(id);
        if (userSocket) {
          userSocket.disconnect(true);
        }
        
        delete connectedUsers[id];
        
        io.emit("participantsUpdate", Object.values(connectedUsers));
        console.log("User kicked out successfully");
        break;
      }
    }
  });

  socket.on("joinChat", ({ username }) => {
    if (!joinedUsers.has(socket.id)) {
      console.log("User joining chat:", username, "with socket id:", socket.id);
      connectedUsers[socket.id] = username;
      joinedUsers.add(socket.id);
      console.log("Updated connected users:", connectedUsers);
      io.emit("participantsUpdate", Object.values(connectedUsers));
    } else {
      console.log("User already joined:", username, "socket id:", socket.id);
    }

    socket.on("disconnect", () => {
      console.log("User disconnecting:", username, "socket id:", socket.id);
      delete connectedUsers[socket.id];
      joinedUsers.delete(socket.id);
      io.emit("participantsUpdate", Object.values(connectedUsers));
    });
  });

  socket.on("studentLogin", (name) => {
    socket.emit("loginSuccess", { message: "Login successful", name });
  });

  socket.on("chatMessage", (message) => {
    io.emit("chatMessage", message);
  });

  socket.on("submitAnswer", (answerData) => {
    votes[answerData.option] = (votes[answerData.option] || 0) + 1;
    voteOnOption(answerData.pollId, answerData.option);
    io.emit("pollResults", votes);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

app.get("/", (req, res) => {
  res.send("Live Polling System Backend");
});

app.post("/teacher-login", (req, res) => {
  TeacherLogin(req, res);
});

app.get("/polls/:teacherUsername", (req, res) => {
  getPolls(req, res);
});

server.listen(port, () => {
  console.log(`Server running on port ${port}...`);
});
