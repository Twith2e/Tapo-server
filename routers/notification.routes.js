import express from "express";
const router = express.Router();

import {
  subscribe,
  unsubscribe,
} from "../controllers/notification.controller.js";
import { authGuard } from "../middlewares/auth.js";

router.post("/subscribe", authGuard, subscribe);
router.post("/unsubscribe", authGuard, unsubscribe);

export default router;
