import mongoose from "mongoose";

const { Schema } = mongoose;

const NotificationSchema = new Schema({
  user: { type: mongoose.SchemaTypes.ObjectId, ref: "User", required: true },
  author: { type: mongoose.SchemaTypes.ObjectId, ref: "User", required: true },
  type: { type: String, required: true },
  data: { type: Object, default: {} },
  read: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

NotificationSchema.index({ user: 1, read: 1, createdAt: -1 });

const notificationModel = mongoose.model("Notification", NotificationSchema);

export default notificationModel;
