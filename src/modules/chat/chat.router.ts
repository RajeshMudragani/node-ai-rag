import { Router } from "express";
import { ChatController } from "./chat.controller.js";
import { chatRateLimit } from "../../common/middleware/rate-limit.middleware.js";

const router = Router();

const controller = new ChatController();

router.post("/", chatRateLimit, controller.chat);

router.post("/stream", chatRateLimit, controller.stream);

export default router;