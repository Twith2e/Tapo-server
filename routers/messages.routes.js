import express from "express";
const router = express.Router();

import { authGuard } from "../middlewares/auth.js";
import {
  getConversations,
  getMessages,
} from "../controllers/messages.controller.js";

router.get("/fetch", authGuard, getConversations);
router.get("/fetch/:conversationId", authGuard, getMessages);

export default router;
