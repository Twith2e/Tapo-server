import mongoose from "mongoose";
const { Schema } = mongoose;

const SubscriptionSchema = new Schema({
  user: { type: mongoose.SchemaTypes.ObjectId, ref: "User", required: true },
  token: { type: String, required: true, unique: true },
  platform: { type: String, default: "web" },
  createdAt: { type: Date, default: Date.now },
});

const subscriptionModel = mongoose.model("Subscription", SubscriptionSchema);

export default subscriptionModel;
