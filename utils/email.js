import mailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

/**
 * Creates a nodemailer transporter using Google OAuth2 authentication
 * Dynamically generates access token from refresh token to ensure validity
 * @returns {Promise<Object>} Configured nodemailer transporter
 */
async function createTransporter() {
  try {
    const transporter = mailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      auth: {
        user: process.env.email,
        pass: process.env.APP_PASSWORD,
      },
    });
    return transporter;
  } catch (error) {
    console.error("Error creating transporter:", error.message);
    throw error;
  }
}

async function sendEmail(recipient, message, subject) {
  try {
    const transporter = await createTransporter();
    const mailOptions = {
      from: process.env.email,
      to: recipient,
      subject,
      html: message,
    };

    const info = await transporter.sendMail(mailOptions);
    if (!info) return false;
    return true;
  } catch (error) {
    console.log("Error sending mail", error);
    return false;
  }
}

export default sendEmail;
