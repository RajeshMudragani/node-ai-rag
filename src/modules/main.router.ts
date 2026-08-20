import { Router } from "express";
import healthRouter from "./health/health.router.js";
import { retrievalRouter } from "./retrieval/retrieval.router.js";
import { embeddingsRouter } from "./embeddings/embeddings.routes.js";
import { documentsRouter } from "./documents/documents.router.js";
import chatRouter from "./chat/chat.router.js";


const router = Router();

router.use("/health", healthRouter);
router.use("/embeddings", embeddingsRouter);
router.use("/retrieval", retrievalRouter);
router.use("/documents", documentsRouter);
router.use("/chat", chatRouter);


export default router;
