import chatHandler from "./chat.js";

export default function (io) {
  io.on("connection", (socket) => {
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
    });
  });
}
