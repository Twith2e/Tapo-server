import messageModel from "../models/messages.model.js";
import conversationModel from "../models/conversations.model.js";
import userModel from "../models/users.model.js";

const getConversations = async (req, res) => {
  try {
    const userId = req.user._id;
    const conversations = await conversationModel
      .find({
        participants: userId,
      })
      .sort({ lastMessageAt: -1 })
      .populate("participants", "email displayName profilePic")
      .populate("lastMessage");

    if (!conversations)
      return res.status(404).json({ message: "No conversations found" });
    res.status(200).json({ status: true, conversations });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getMessages = async (req, res) => {
  try {
    const conversationId = req.params.conversationId;
    const messages = await messageModel
      .find({ conversation: conversationId })
      .populate("from", "email displayName profilePic")
      .populate("taggedMessage")
      .populate("taggedMessage.from", "email displayName profilePic");
    if (!messages)
      return res.status(404).json({ message: "No messages found" });
    res.status(200).json({ status: true, messages });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export { getConversations, getMessages };
