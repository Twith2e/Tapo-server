const express = require("express");
const router = express.Router();

const { googleAuth } = require("../controllers/users.controller");

router.get("/google", googleAuth);

module.exports = router;
