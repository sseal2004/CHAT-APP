import { Server } from "socket.io";
import http from "http";
import express from "express";

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: [
      "http://localhost:5173",
      "http://localhost:5174",
      "http://localhost:5175",
      "http://localhost:5176",
      "http://localhost:5177",
      "http://127.0.0.1:5173",
      "http://localhost:3000",
    ],
    credentials: true,
  },
});

// { userId: socketId }
const userSocketMap = {};

/**
 * Get receiver socket id by user id
 */
export function getReceiverSocketId(userId) {
  return userSocketMap[userId];
}

io.on("connection", (socket) => {
  console.log("🟢 User connected:", socket.id);

  const userId = socket.handshake.query.userId;

  if (userId) {
    // If user reconnects, overwrite old socket
    userSocketMap[userId] = socket.id;
  }

  // Send online users list to all clients
  io.emit("getOnlineUsers", Object.keys(userSocketMap));

  socket.on("disconnect", () => {
    console.log("🔴 User disconnected:", socket.id);

    if (userId) {
      delete userSocketMap[userId];
    }

    io.emit("getOnlineUsers", Object.keys(userSocketMap));
  });
});

export { io, app, server };
