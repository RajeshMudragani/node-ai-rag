import { Router } from "express";
import { dbReadinessController, HealthController } from "./health.controller.js";

const router = Router();

router.get("/", HealthController);

router.get("/db", dbReadinessController);

export default router;
