import conversationModel from "../models/conversations.model.js";
import messageModel from "../models/messages.model.js";
import userModel from "../models/users.model.js";

export default function (io, socket) {
  socket.on("join-room", ({ roomId, user }) => {
    socket.join(roomId);
    socket.to(roomId).emit("user-joined", { user, socketId: socket.id });
  });

  socket.on("leave-room", ({ roomId }) => {
    socket.leave(roomId);
    socket.to(roomId).emit("user-left", { socketId: socket.id });
  });

  /**
   * initiate-chat
   * - Validates contact by email, upserts/fetches the direct conversation.
   * - Joins BOTH participants’ sockets (initiator and contact) to the room.
   * - Notifies the initiator (and optionally the room) that chat is initialized.
   */
  socket.on("initiate-chat", async ({ userId, contactId, room }) => {
    let conversation;
    const contact = await userModel.findOne({ email: contactId });
    if (!contact) {
      return socket.emit("error", {
        status: "error",
        error: "Contact not found",
      });
    }
    conversation = await conversationModel.findOne({ room });
    if (!conversation) {
      conversation = await conversationModel.createDirectConversation(
        userId,
        contact._id
      );
    }

    const roomId = conversation._id.toString();

    // Join the current socket to the room
    socket.join(roomId);

    // Also join all sockets for both participants
    const initiatorUserId = String(userId);
    const contactUserId = contact._id.toString();

    const joinAllSockets = (uid) => {
      const set = io.userSockets?.get(uid);
      if (!set) return;
      for (const sid of set) {
        const s = io.sockets.sockets.get(sid);
        s?.join(roomId);
      }
    };

    joinAllSockets(initiatorUserId);
    joinAllSockets(contactUserId);

    // Notify the initiator and optionally the whole room
    socket.emit("chat-initialized", { roomId });
    io.to(roomId).emit("user-joined", {
      userId: initiatorUserId,
      socketId: socket.id,
    });
  });

  socket.on(
    "send-message",
    async ({ userA, userB, roomId, message, from }, ack) => {
      let conversation;
      try {
        conversation = await conversationModel.findOne({ roomId });
        if (!conversation) {
          conversation = await conversationModel.createDirectConversation(
            userA,
            userB
          );
        }
        const savedMessage = await messageModel.create({
          conversation: conversation._id,
          from,
          message,
          ts: new Date(),
        });

        console.log(message);

        await conversation.updateLastMessage(savedMessage._id, savedMessage.ts);
        const payload = {
          id: savedMessage._id.toString(),
          conversationId: conversation._id.toString(),
          from: savedMessage.from.toString(),
          message: savedMessage.message,
          ts: savedMessage.ts.toISOString(),
        };
        socket.to(roomId).emit("chat-message", payload);
        return ack({ status: "success", payload });
      } catch (error) {
        console.log(error);
        ack({ status: "error", error: error.message });
      }
    }
  );
}
