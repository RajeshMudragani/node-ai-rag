import { Router } from "express";
import { EmbeddingsController } from "./embeddings.controller.js";

const router = Router();
const controller = new EmbeddingsController();

router.post("/generate", controller.generate);

export default router;
