import { io, Socket } from "socket.io-client";

const SERVER_URL =  "http://localhost:5000";

// Singleton socket
let socket: Socket | null = null;

export function getSocket() {
  if (!socket) {
    socket = io(SERVER_URL, {
      transports: ["websocket"],               // fast + stable
      withCredentials: true,
      path: "/socket.io",                      // must match server if customized
      query: { room: "orders" },               // same room your server emits to
      // auth: { token: yourJWT },             // if you secure sockets
    });
  }
  return socket;
}

export function closeSocket() {
  if (socket) {
    socket.close();
    socket = null;
  }
}
