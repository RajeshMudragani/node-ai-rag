import { Router } from "express";
import { RetrievalController } from "./retrieval.controller.js";

const router = Router();

const controller = new RetrievalController();

router.post("/search", controller.search);
router.post("/context", controller.context);



export { router as retrievalRouter };