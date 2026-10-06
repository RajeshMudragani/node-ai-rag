import "dotenv/config";
import { z } from "zod";
import { logger } from "../logger/logger.js";

const envSchema = z.object({
    NODE_ENV: z.enum(["development", "test", "production"]),

    PORT: z.coerce.number().int().positive(),

    LOG_LEVEL: z.enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"]),

    DATABASE_URL: z.string().min(1),
    DB_POOL_MAX: z.coerce.number().int().positive().default(20),
    DB_POOL_MIN: z.coerce.number().int().nonnegative().default(2),
    DB_IDLE_TIMEOUT_MS: z.coerce.number().int().positive().default(30_000),
    DB_CONNECTION_TIMEOUT_MS: z.coerce.number().int().positive().default(5_000),

    OLLAMA_BASE_URL: z.string().url(),
    OLLAMA_LLM_MODEL: z.string().min(1),
    OLLAMA_EMBED_MODEL: z.string().min(1),
    EMBEDDING_DIMENSIONS: z.coerce.number().int().positive(),

    MINIO_ENDPOINT: z.string(),
    MINIO_PORT: z.coerce.number(),
    MINIO_ACCESS_KEY: z.string(),
    MINIO_SECRET_KEY: z.string(),
    MINIO_BUCKET: z.string(),
    MINIO_USE_SSL: z.enum(["true", "false"]).transform((value) => value === "true"),
    MINIO_REGION: z.string().default("us-east-1"),

    API_PREFIX: z.string().default("/api/v1"),
    SHUTDOWN_TIMEOUT_MS: z.coerce.number().int().positive().default(10_000),
    REQUEST_BODY_LIMIT: z.string().default("50mb"),
    UPLOAD_MAX_FILE_SIZE_MB: z.coerce.number().int().positive().default(100),

    JWT_ACCESS_EXPIRES_IN: z.enum(["15m", "30m", "1h", "12h"]),
    JWT_REFRESH_EXPIRES_IN: z.enum(["7d", "30d"]),

});


const result = envSchema.safeParse(process.env);

if (!result.success) {
    logger.error("Environment validation failed");

    for (const issue of result.error.issues) {
        logger.error(`${issue.path.join(".")}: ${issue.message}`);
    }

    logger.error("Server startup aborted.");

    process.exit(1);
}

export const env = result.data;
