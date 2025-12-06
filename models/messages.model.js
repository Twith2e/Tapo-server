import mongoose from "mongoose";

const { Schema } = mongoose;

const MessageSchema = new Schema({
  conversation: {
    type: mongoose.SchemaTypes.ObjectId,
    ref: "Conversation",
    required: true,
    index: true,
  },
  from: { type: mongoose.SchemaTypes.ObjectId, ref: "User", required: true },
  message: { type: String, trim: true },
  ts: { type: Date, default: Date.now, index: true },
  attachments: [
    {
      url: String,
      format: String,
      size: Number,
      duration: Number, // for audio/video
      fileName: String,
      width: Number,
      height: Number,
    },
  ],
  status: {
    type: String,
    enum: ["sent", "delivered", "read"],
    default: "sent",
  },
  taggedMessage: {
    type: mongoose.SchemaTypes.ObjectId,
    ref: "Message",
    default: null,
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

/**
 * Message schema static helper function
 * @param {conversationId, limit}
 * @return {Promise<Array>}
 */

MessageSchema.statics.getMessages = function (
  conversationId,
  limit = 50,
  beforeTs
) {
  const query = { conversation: conversationId };
  if (beforeTs) {
    query.ts = { $lt: beforeTs };
  }
  return this.find(query).sort({ ts: -1 }).limit(limit).lean();
};

MessageSchema.index({ conversation: 1, ts: -1 });

const messageModel = mongoose.model("Message", MessageSchema);

export default messageModel;
