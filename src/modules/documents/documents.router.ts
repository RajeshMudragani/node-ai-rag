import { Router } from "express";
import multer from "multer";

import { DocumentsController } from "./documents.controller.js";

const router = Router();

const controller = new DocumentsController();

const upload = multer({
    storage: multer.memoryStorage(),

    limits: {
        fileSize: 100 * 1024 * 1024,
    },

    fileFilter: (
        _req,
        file,
        callback,
    ) => {
        const allowedMimeTypes = [
            "application/pdf",
            "text/plain",
            "text/markdown",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        ];

        if (
            allowedMimeTypes.includes(
                file.mimetype,
            )
        ) {
            callback(null, true);
        } else {
            callback(
                new Error(
                    "Unsupported file type",
                ),
            );
        }
    },
});

router.post("/upload", upload.single("file"), controller.upload);

router.get("/", controller.findAll);

router.get("/:id", controller.findById);

router.post("/:id/process", controller.process);

export { router as documentsRouter }