import { io } from "socket.io-client";

let socket = null;

export const getSocket = () => {
  if (!socket) {
    const apiBase =
      import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";
    const socketUrl =
      import.meta.env.VITE_SOCKET_URL || apiBase.replace(/\/api\/?$/, "");

    socket = io(socketUrl, {
      autoConnect: false,
      transports: ["websocket", "polling"],
    });
  }
  return socket;
};
