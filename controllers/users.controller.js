require("dotenv").config();
const passport = require("passport");

const googleAuth = (req, res, next) => {
  passport.authenticate("google", { scope: ["email", "profile"] })(
    req,
    res,
    next
  );
};

const googleCallback = (req, res, next) => {
  passport.authenticate("google", {
    successRedirect: "/dashboard",
    failureRedirect: "/failed",
  })(req, res, next);
};

module.exports = { googleAuth, googleCallback };
