import { Router } from "express";
import healthRouter from "./health/health.router.js";
import retrievalRouter from "./retrieval/retrieval.router.js";
import embeddingsRouter from "./embeddings/embeddings.router.js";
import documentsRouter from "./documents/documents.router.js";
import chatRouter from "./chat/chat.router.js";
import conversationRouter from "./conversation/conversation.router.js";
import collectionsRouter from "./collections/collections.router.js";
import metadataRouter from "./metadata/metadata.router.js";
import evaluationRouter from "./evaluation/evaluation.routes.js";
import feedbackRouter from "./feedback/feedback.router.js";
import usersRouter from "./users/users.router.js";
import authRouter from "./auth/auth.router.js";
import tenantsRouter from "./tenants/tenants.router.js";

const router = Router();

router.use("/health", healthRouter);
router.use("/embeddings", embeddingsRouter);
router.use("/retrieval", retrievalRouter);
router.use("/documents", documentsRouter);
router.use("/chat", chatRouter);
router.use("/conversations", conversationRouter );
router.use("/collections", collectionsRouter);
router.use("/", metadataRouter);
router.use("/evaluations", evaluationRouter);
router.use("/feedback", feedbackRouter);
router.use("/users", usersRouter);
router.use("/auth", authRouter);
router.use("/tenants", tenantsRouter);

export default router;
