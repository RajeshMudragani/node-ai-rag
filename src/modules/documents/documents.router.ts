import { Router } from "express";
import multer from "multer";

import { DocumentsController } from "./documents.controller.js";
import { ALLOWED_MIME_TYPES, UPLOAD_MAX_FILE_SIZE } from "./documents.constants.js";
import { authMiddleware } from "../auth/middleware/auth.middleware.js";
import { tenantMiddleware } from "../auth/middleware/tenant.middleware.js";

const router = Router();
const controller = new DocumentsController();

const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: UPLOAD_MAX_FILE_SIZE,
    },
    fileFilter: (_req, file, callback) => {
        if (ALLOWED_MIME_TYPES.includes(file.mimetype as typeof ALLOWED_MIME_TYPES[number])) {
            callback(null, true);
        } else {
            callback(new Error("Unsupported file type"));
        }
    },
});

router.use(authMiddleware, tenantMiddleware);

router.post("/upload", upload.single("file"), controller.upload);
router.get("/", controller.findAll);
router.get("/:id", controller.findById);
router.post("/:id/process", controller.process);

export default router;
