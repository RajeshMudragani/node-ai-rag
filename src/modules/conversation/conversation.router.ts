import { Router } from "express";
import { ConversationController } from "./conversation.controller.js";

const router = Router();

const controller = new ConversationController();

router.get("/", controller.getConversations);

router.get("/:id", controller.getConversation);

router.patch("/:id", controller.renameConversation);

router.delete("/:id", controller.deleteConversation);

export default router;