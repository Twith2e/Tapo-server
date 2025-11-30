import express from "express";
import multer from "multer";
import {
  getSigned,
  uploadMedia,
  saveStatus,
  getStatuses,
} from "../controllers/upload.controller.js";
import { authGuard } from "../middlewares/auth.js";
const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 },
});

router.get("/sign", authGuard, getSigned);
router.post("/media", authGuard, upload.single("file"), uploadMedia);
router.post("/status", authGuard, saveStatus);
router.get("/statuses", authGuard, getStatuses);

export default router;
