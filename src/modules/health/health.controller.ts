import { Request, Response } from "express";
import { db } from "../../config/db.config.js";
import { HTTP_STATUS } from "../../constants/http.constants.js";

export class HealthController {
    ping = (_req: Request, res: Response): void => {
        res.status(HTTP_STATUS.OK).json({ status: "ok", message: "OK" });
    };

    dbReadiness = async (_req: Request, res: Response): Promise<void> => {
        try {
            await db.execute("SELECT 1");
            res.status(HTTP_STATUS.OK).json({ status: "ok", message: "DB connected" });
        } catch {
            res.status(HTTP_STATUS.SERVICE_UNAVAILABLE).json({ status: "unavailable", message: "DB not connected" });
        }
    };
}
