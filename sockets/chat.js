export default function (io, socket) {
  socket.on("join-room", ({ roomId, user }) => {
    socket.join(roomId);
    socket.to(roomId).emit("user-joined", { user, socketId: socket.id });
  });

  socket.on("leave-room", ({ roomId }) => {
    socket.leave(roomId);
    socket.to(roomId).emit("user-left", { socketId: socket.id });
  });

  socket.on("send-message", ({ roomId, message, from }, ack) => {
    const msg = { id: Date.now(), from, message, ts: new Date().toISOString() };
    socket.to(roomId).emit("chat-message", msg);
    if (ack) ack({ status: "sent", id: msg.id });
  });
}
