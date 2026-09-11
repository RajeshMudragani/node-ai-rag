import { Router } from "express";
import healthRouter from "./health/health.router.js";
import { retrievalRouter } from "./retrieval/retrieval.router.js";
import { embeddingsRouter } from "./embeddings/embeddings.router.js";
import { documentsRouter } from "./documents/documents.router.js";
import chatRouter from "./chat/chat.router.js";
import conversationRouter from "./conversation/conversation.router.js";

const router = Router();

router.use("/health", healthRouter);
router.use("/embeddings", embeddingsRouter);
router.use("/retrieval", retrievalRouter);
router.use("/documents", documentsRouter);
router.use("/chat", chatRouter);
router.use("/conversations", conversationRouter );


export default router;
