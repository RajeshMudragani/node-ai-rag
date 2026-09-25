import { Router } from "express";
import { ChatController } from "./chat.controller.js";

const router = Router();

const controller = new ChatController();

router.post("/", controller.chat);

router.post("/stream", controller.stream);

export default router;