import conversationModel from "../models/conversations.model.js";
import messageModel from "../models/messages.model.js";
import userModel from "../models/users.model.js";
import { v4 as uuidv4 } from "uuid";
import {
  anySocketVisibleForUser,
  getUserSocketIds,
} from "../utils/redis-helpers.js";
import subscriptionModel from "../models/subscriptions.model.js";
import { sendPushToTokens } from "../utils/notify.js";

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
  socket.on("initiate-chat", async ({ userId, contactId, room }, ack) => {
    console.log("initiate-chat:", userId, contactId, room);
    const contact = await userModel.findOne({ _id: contactId });
    if (!contact) {
      return socket.emit("error", {
        status: "error",
        error: "Contact not found",
      });
    }
    const conversation = await conversationModel.createDirectConversation(
      userId,
      contact._id
    );

    console.log("conversation:", conversation);

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

    ack({ status: "success" });

    // Notify the initiator and optionally the whole room
    socket.emit("chat-initialized", { roomId });
    io.to(roomId).emit("user-joined", {
      userId: initiatorUserId,
      socketId: socket.id,
    });

    try {
      const connectedUserId = String(socket.userId.toString());

      console.log("conversationId:", conversation._id);

      const pending = await messageModel
        .find({
          conversation: conversation._id,
          status: "sent",
          from: { $ne: connectedUserId },
        })
        .select("_id")
        .lean();

      console.log("pending:", pending);

      if (pending.length > 0) {
        const updatedMessages = await messageModel.updateMany(
          {
            conversation: conversation._id,
            status: "sent",
            from: { $ne: connectedUserId },
          },
          { $set: { status: "delivered" } }
        );

        if (!updatedMessages) {
          throw err;
        }

        for (const m of pending) {
          io.to(roomId).emit("message:delivered", {
            messageId: String(m._id),
          });
        }
      }
    } catch (err) {
      console.log("initiate-chat delivery catch-up error:", err);
    }
  });

  socket.on("join:conversation", ({ roomId }) => {
    socket.join(roomId);
  });

  socket.on(
    "send-message",
    async ({ roomId, message, from, tempId, taggedMessage }, ack) => {
      try {
        const conversation = await conversationModel.findById(roomId);
        if (!conversation) {
          return ack({ status: "error", error: "Conversation not found" });
        }
        const savedMessage = await messageModel.create({
          conversation: conversation._id,
          from,
          message,
          ts: new Date(),
          taggedMessage: taggedMessage ? taggedMessage : null,
        });

        if (!savedMessage) {
          return ack({ status: "failed" });
        }
        console.log(message);

        await conversation.updateLastMessage(savedMessage._id, savedMessage.ts);
        const payload = {
          id: savedMessage._id.toString(),
          conversationId: conversation._id.toString(),
          from: savedMessage.from.toString(),
          message: savedMessage.message,
          ts: savedMessage.ts.toISOString(),
          tempId,
        };
        socket.to(roomId).emit("chat-message", payload);
        ack({ status: "success", payload });
        process.nextTick(async () => {
          try {
            const recipients = conversation.participants
              .map(String)
              .filter((id) => id !== String(from));
            const tokensToNotify = new Map();
            for (const rid of recipients) {
              const isAnyVisible = await anySocketVisibleForUser(rid);
              if (isAnyVisible) {
                continue;
              }
              const socketIds = await getUserSocketIds(rid);
              if (socketIds.length === 0) {
                const subs = await subscriptionModel.find({ user: rid });
                for (const s of subs) {
                  if (s.token) tokensToNotify.set(s.token, true);
                }
              } else {
                continue;
              }

              const tokens = Array.from(tokensToNotify.keys());
              const BATCH = 500;

              for (let i = 0; i < tokens.length; i += BATCH) {
                const batch = tokens.slice(i, i + BATCH);
                if (batch.length === 0) break;

                await sendPushToTokens(batch, {
                  notification: {
                    title: "New Message",
                    body:
                      message.length > 120 ? message.slice(0, 120) : message,
                  },
                  data: {
                    conversationId: conversation._id.toString(),
                    messageId: savedMessage._id.toString(),
                  },
                });
              }
            }
          } catch (error) {
            console.log(error);
          }
        });
      } catch (error) {
        console.log(error);
        ack({ status: "error", error: error.message });
      }
    }
  );

  socket.on("message:received", async ({ messageId, roomId }) => {
    console.log("messageId: ", messageId);
    console.log("roomId: ", roomId);
    const message = await messageModel.findById(messageId);
    if (!message) {
      console.log("could not find message");
      return;
    }
    const conversation = await conversationModel.findById(roomId);
    if (!conversation) {
      console.log("could not find conversation");
      return;
    }
    message.status = "delivered";
    const savedMessage = await message.save();
    if (!savedMessage) {
      console.log("could not save message");
      return;
    }

    console.log("saved message: ", savedMessage._id.toString());

    socket
      .to(roomId)
      .emit("message:delivered", { messageId: message._id.toString() });
  });

  socket.on("messages:readUpTo", async ({ conversationId, upToId }, ack) => {
    const upToMsg = await messageModel.findById(upToId);
    if (!upToMsg) return ack?.({ status: "error", error: "not_found" });

    const updatedMessages = await messageModel.updateMany(
      {
        conversation: conversationId,
        ts: { $lte: upToMsg.ts },
        from: { $ne: socket.userId },
      },
      { $set: { status: "read" } }
    );

    if (!updatedMessages) {
      return ack?.({ status: "error", error: "update_failed" });
    }

    socket.to(conversationId).emit("messages:read", {
      conversationId,
      upToId,
      readerId: socket.userId,
    });

    return ack?.({ status: "ok" });
  });

  socket.on("create:group", async ({ participants, title, creator }, ack) => {
    console.log("emission received");

    try {
      const users = await userModel.find({ _id: { $in: participants } });
      const validCreator = await userModel.findById(creator);
      if (!validCreator) {
        return ack?.({
          status: "error",
          error: "Creator is not a registered user",
        });
      }
      if (users.length !== participants.length) {
        console.log(users);

        return ack?.({
          status: "error",
          error: "One or more participants are not registered users",
        });
      }

      const uniqueParticipants = [...new Set(users.map((user) => user._id))];

      const roomId = uuidv4();
      const conversation = await conversationModel.create({
        roomId,
        title,
        participants: uniqueParticipants,
        creator: validCreator._id,
      });

      await conversation.populate(
        "participants",
        "_id email displayName profilePic"
      );

      if (!conversation) {
        console.log("could not create convo");
        return ack?.({
          status: "error",
          message: "Failed to create conversation",
        });
      }

      console.log(conversation);
      return ack?.({ status: "ok", conversation });
    } catch (error) {
      ack?.({ status: "error", message: error.message });
      console.log(error);
    }
  });
}
