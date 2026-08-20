import { Pool } from "pg";
import { env } from "./env.config.js";
import { logger } from "../logger/logger.js";
import { drizzle } from "drizzle-orm/node-postgres";

export const pool = new Pool({
    connectionString: env.DATABASE_URL,

    max: 20,
    min: 2,

    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 5_000,
});

export const checkDatabaseConnection = async (): Promise<void> => {
    const client = await pool.connect();

    try {
        await client.query("SELECT 1");
        logger.info("Database connected successfully");
    } finally {
        client.release();
    }
};

export const db = drizzle(pool, {
    logger: false,
});