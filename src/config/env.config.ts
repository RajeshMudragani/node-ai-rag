import "dotenv/config";
import { z } from "zod";
import { logger } from "../logger/logger.js";

const envSchema = z.object({
    NODE_ENV: z.enum(["development", "test", "production"]),

    PORT: z.coerce.number().int().positive(),

    LOG_LEVEL: z.enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"]),

    DATABASE_URL: z.string().min(1),

    MINIO_ENDPOINT: z.string(),
    MINIO_PORT: z.coerce.number(),
    MINIO_ACCESS_KEY: z.string(),
    MINIO_SECRET_KEY: z.string(),
    MINIO_BUCKET: z.string(),
    MINIO_USE_SSL: z.enum(["true", "false"]).transform((value) => value === "true"),

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
