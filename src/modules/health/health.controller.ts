import { Request, Response } from "express";
import { db } from "../../config/db.config.js";

export const HealthController = (req: Request, res: Response) => {
    return res.status(200).json({
        status: 200,
        message: "OK"
    });
};

export const dbReadinessController = async (req: Request, res: Response) => {
    try {
        await db.query("SELECT 1;");
        return res.status(200).json({
            status: "ok",
            message: "DB connected"
        });
    } catch {
        return res.status(503).json({
            status: "unavailable",
            message: "DB not connected"
        });

    }
}