const express = require("express");
const router = express.Router();

const {
  googleOAuthReq,
  googleOAuthCallback,
} = require("../controllers/users.controller");

router.post("/request", googleOAuthReq);
router.get("/callback", googleOAuthCallback);

module.exports = router;
