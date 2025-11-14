import chatHandler from "./chat.js";
import conversationModel from "../models/conversations.model.js";

export default function (io) {
  /**
   * Socket connection handler
   * - Extracts `userId` from handshake (auth/query/headers).
   * - Registers socketId under `io.userSockets` for multi-device support.
   * - Cleans up registry on disconnect.
   */
  io.on("connection", (socket) => {
    // Initialize the registry if missing
    io.userSockets = io.userSockets || new Map();

    // Resolve identity from the handshake
    const rawUserId =
      socket.handshake.auth?.userId ||
      socket.handshake.query?.userId ||
      socket.handshake.headers?.userId;
    const userId = rawUserId ? String(rawUserId) : null;

    // Track this socket under the userId
    if (userId) {
      const set = io.userSockets.get(userId) || new Set();
      set.add(socket.id);
      io.userSockets.set(userId, set);
      socket.userId = userId;
    }

    console.log("Socket connected: ", socket.id);

    socket.on("ping-server", (payload, ack) => {
      if (ack)
        ack({
          ok: true,
          ts: Date.now(),
        });
    });

    chatHandler(io, socket);

    socket.on("disconnect", (reason) => {
      console.log("Socket disconnected: ", socket.id, reason);
      // Remove socket from registry
      if (socket.userId) {
        const set = io.userSockets.get(socket.userId);
        if (set) {
          set.delete(socket.id);
          if (set.size === 0) io.userSockets.delete(socket.userId);
        }
      }
    });
  });
}
