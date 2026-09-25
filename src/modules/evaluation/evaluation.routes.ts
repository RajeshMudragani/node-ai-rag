import { Router } from "express";
import { EvaluationController } from "./evaluation.controller.js";

const router = Router();

const controller = new EvaluationController();

router.post("/run", controller.run);

router.get("/history", controller.history);

export default router;
