// src/socket/index.js
import { Server } from "socket.io";

let io;

export function initSocket(server) {
  if (io) return io;
  io = new Server(server, {
    cors: {
      origin: ["http://localhost:5173", "https://pleadingly-misshapen-wilber.ngrok-free.dev"],
      credentials: true,
    },
    path: "/socket.io", // default; keep if you reverse-proxy
  });

  io.on("connection", (socket) => {
    const room = socket.handshake.query?.room || "orders";
    socket.join(room);
    console.log(`🔌 Socket connected: ${socket.id}, room=${room}`);

    socket.on("disconnect", (reason) => {
      console.log(`🔌 Socket disconnected: ${socket.id}, reason=${reason}`);
    });
  });

  return io;
}

export function getIO() {
  if (!io) throw new Error("Socket.io not initialized");
  return io;
}
