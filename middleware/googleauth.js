require("dotenv").config();
const googleStrategy = require("passport-google-oauth20").Strategy;
const passport = require("passport");
const userModel = require("../models/users.model");

passport.use(
  new googleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "http://localhost:8080/auth/google/callback",
      passReqToCallback: true,
    },
    async (req, accessToken, refreshToken, profile, done) => {
      console.log(profile);

      const userEmail = profile.emails[0].value;
      try {
        const existingUser = await userModel.findOne({
          userID: profile.id,
        });
        if (existingUser) {
          return done(existingUser);
        }
        const newUser = await userModel.create({
          userID: profile.id,
          email: userEmail,
          username: profile.displayName,
          pin: "default",
          status: "pending",
        });
        return done(null, newUser);
      } catch (error) {
        return done(error);
      }
    }
  )
);

passport.serializeUser((user, done) => {
  return done(null, user);
});

passport.deserializeUser((user, done) => {
  return done(null, user);
});
