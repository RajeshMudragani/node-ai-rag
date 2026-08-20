import { Request, Response, NextFunction } from "express";
import { logger } from "../logger/logger.js";

export const errorsMiddleware = (err: Error, req: Request, res: Response, next: NextFunction) => {
    logger.error({
        err: err,
        method: req.method,
        url: req.originalUrl
    });

    if(res.headersSent) {
        return;
    }

    return res.status(500).json({
        success: false,
        error: {
            code: "INTERANL_SERVER_ERROR",
            message: err.message || "Internal server error."
        },
    });
};