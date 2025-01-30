require("dotenv").config();
const fetch = require("node-fetch");
const { OAuth2Client } = require("google-auth-library");
const redirectURL = "http://localhost:3000/auth/callback";

const googleOAuthReq = async (req, res, next) => {
  res.header("Access-Control-Allow-Origin", "http://localhost:5173");
  res.header("Referrer-Policy", "no-referrer-when-downgrade");

  const oAuth2Client = new OAuth2Client(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    redirectURL
  );

  const authorizeUrl = oAuth2Client.generateAuthUrl({
    access_type: "offline",
    scope: ["email", "profile"],
    prompt: "consent",
  });

  res.json({ url: authorizeUrl });
};

async function getUserInfoFromGoogle(access_token) {
  const response = await fetch(
    `https://www.googleapis.com/oauth2/v1/userinfo?alt=json&access_token=${access_token}`
  );

  const data = await response.json();
  console.log(data);
}

const googleOAuthCallback = async (req, res, next) => {
  const { code } = req.query;
  try {
    const oAuth2Client = new OAuth2Client(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      redirectURL
    );

    const tokenResponse = await oAuth2Client.getToken(code);
    const { access_token } = tokenResponse.tokens;
    await oAuth2Client.setCredentials({ access_token });
    const user = oAuth2Client.credentials;
    console.log("credentials:", user);
    const userInfo = await getUserInfoFromGoogle(access_token);
    res
      .status(200)
      .json({ message: "User logged in", user: userInfo, status: true });
  } catch (error) {
    console.log(error);
    res
      .status(500)
      .json({
        error: error.message,
        message: "Error logging in",
        status: false,
      });
  }
};

module.exports = { googleOAuthReq, googleOAuthCallback };
