import admin from "firebase-admin";
import dotenv from "dotenv";

dotenv.config();

/**
 * initFirebaseAdmin
 * Initializes Firebase Admin exactly once using environment variables.
 * - Reads `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`.
 * - Converts escaped `\n` to real newlines and strips accidental quotes.
 * - Avoids double initialization across imports/hot reloads.
 */
function initFirebaseAdmin() {
  if (!admin.apps.length) {
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    let privateKey = process.env.FIREBASE_PRIVATE_KEY;

    if (!projectId || !clientEmail || !privateKey) {
      throw new Error(
        "Missing Firebase Admin env vars: FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY"
      );
    }

    // Strip accidental wrapping quotes (common when copying .env values)
    if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
      privateKey = privateKey.slice(1, -1);
    }
    // Convert escaped newlines to real newlines
    privateKey = privateKey.replace(/\\n/g, "\n");

    admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey,
      }),
    });
  }
  return admin;
}

/**
 * firebaseAdmin
 * Returns the initialized Admin SDK instance for use across the app.
 */
const firebaseAdmin = initFirebaseAdmin();
export default firebaseAdmin;