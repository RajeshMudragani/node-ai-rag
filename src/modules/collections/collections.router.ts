import { Router } from "express";
import { CollectionsController } from "./collections.controller.js";

const router = Router();

const controller = new CollectionsController();

router.post("/", controller.create);

router.get("/", controller.getAll);

router.get("/:id", controller.getById);

router.patch("/:id", controller.update);

router.delete("/:id", controller.delete);

export default router;