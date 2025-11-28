import mongoose from "mongoose";

const { Schema } = mongoose;

const ConversationSchema = new Schema({
  roomId: { type: String, required: true },
  participants: [
    { type: mongoose.SchemaTypes.ObjectId, ref: "User", required: true },
  ],
  lastMessage: { type: mongoose.SchemaTypes.ObjectId, ref: "Message" },
  lastMessageAt: { type: Date, default: null },
  title: { type: String, default: "", trim: true },
  creator: { type: mongoose.SchemaTypes.ObjectId, ref: "User", default: null },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

ConversationSchema.index({ roomId: 1 });
ConversationSchema.index({ roomId: 1, participants: 1 });

ConversationSchema.statics.createDirectConversation = async function (
  userA,
  userB
) {
  const ids = [userA, userB].sort();
  const roomId = `direct:${ids[0]}:${ids[1]}`;

  const update = {
    $set: { updatedAt: new Date() },
    $setOnInsert: {
      roomId,
      participants: ids,
      createdAt: new Date(),
    },
  };

  return this.findOneAndUpdate({ roomId }, update, { upsert: true, new: true });
};

ConversationSchema.methods.updateLastMessage = function (messageId, ts) {
  this.lastMessage = messageId;
  this.lastMessageAt = ts || new Date();
  this.updatedAt = new Date();
  return this.save();
};

const conversationModel = mongoose.model("Conversation", ConversationSchema);

export default conversationModel;
