// Top-level imports
import admin from "../firebase/firebaseAdmin.js";
import subscriptionModel from "../models/subscriptions.model.js";

/**
 * sendPushToTokens
 * Sends FCM notifications to a list of device tokens using multicast.
 * - Uses Firebase Admin `sendEachForMulticast` for per-token responses.
 * - Cleans up invalid tokens from the `Subscription` collection.
 */
/**
 * sendPushToTokens
 * Sends FCM push notifications to multiple tokens using multicast.
 * - Ensures `data` values are strings (FCM requirement).
 * - Cleans invalid tokens from the Subscription collection.
 */
async function sendPushToTokens(tokens, payload) {
  if (!tokens || !tokens.length) return { success: 0, failure: 0 };

  // Ensure data values are strings
  const stringData = Object.fromEntries(
    Object.entries(payload.data || {}).map(([k, v]) => [k, String(v)])
  );

  const message = {
    tokens,
    notification: payload.notification, // only title/body allowed here
    data: stringData,
    android: payload.android || { priority: "high" },
    apns: payload.apns || { payload: { aps: { sound: "default" } } },
  };

  const result = await admin.messaging().sendEachForMulticast(message);

  const cleanupTokens = [];
  result.responses.forEach((resp, i) => {
    if (!resp.success) {
      const err = resp.error;
      const badToken = tokens[i];
      if (
        err &&
        (err.code === "messaging/registration-token-not-registered" ||
          err.code === "messaging/invalid-registration-token")
      ) {
        cleanupTokens.push(badToken);
      } else {
        console.warn("FCM error code", err?.code, "msg:", err?.message);
      }
    }
  });

  if (cleanupTokens.length) {
    await subscriptionModel.deleteMany({ token: { $in: cleanupTokens } });
    console.log("Removed invalid tokens:", cleanupTokens.length);
  }

  return { success: result.successCount, failure: result.failureCount };
}

export { sendPushToTokens };
