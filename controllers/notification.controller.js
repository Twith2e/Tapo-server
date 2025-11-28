import subscriptionModel from "../models/subscriptions.model.js";

/**
 * subscribe
 * Upserts a device token for the authenticated user.
 * - Ensures unique `token` and associates it with `user`.
 */
const subscribe = async (req, res) => {
  try {
    const user = req.user._id;
    const { token, platform } = req.body;
    if (!token) return res.status(400).json({ error: "token required" });

    await subscriptionModel.updateOne(
      { token },
      { $set: { user, token, platform, createdAt: new Date() } },
      { upsert: true }
    );
    return res.status(200).json({ status: true, message: "subscribed" });
  } catch (error) {
    console.error("subscribe error", error);
    return res.status(500).json({ error: "server error" });
  }
};

/**
 * unsubscribe
 * Removes a device token for the authenticated user.
 */
const unsubscribe = async (req, res) => {
  try {
    const user = req.user._id;
    const { token } = req.body;
    if (!token) return res.status(400).json({ error: "token required" });

    await subscriptionModel.deleteOne({ token, user });
    return res.status(200).json({ status: true, message: "unsubscribed" });
  } catch (error) {
    console.error("unsubscribe error", error);
    return res.status(500).json({ error: "server error" });
  }
};

export { subscribe, unsubscribe };