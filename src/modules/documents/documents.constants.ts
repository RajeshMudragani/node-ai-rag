import { env } from "../../config/env.config.js";

export const DOCUMENT_STATUS = {
    UPLOADED: "UPLOADED",
    PROCESSING: "PROCESSING",
    READY: "READY",
    FAILED: "FAILED",
} as const;

export type DocumentStatus = (typeof DOCUMENT_STATUS)[keyof typeof DOCUMENT_STATUS];

export const ALLOWED_MIME_TYPES = [
    "application/pdf",
    "text/plain",
    "text/markdown",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
] as const;

export const UPLOAD_MAX_FILE_SIZE = env.UPLOAD_MAX_FILE_SIZE_MB * 1024 * 1024;

export const STORAGE_KEY_PREFIX = "documents";

export const DOCUMENT_PREVIEW_LENGTH = 1000;
