import { Router } from "express";
import { FeedbackController } from "./feedback.controller.js";

const router = Router();

const controller = new FeedbackController();

router.post("/", controller.create);

router.get("/", controller.findAll);

export default router;