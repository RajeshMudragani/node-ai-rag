import jwt from "jsonwebtoken";
import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../interfaces/authenticated-request.interface.js";
import { JwtPayload } from "../interfaces/jwt-payload.interface.js";
import { AuthKeyService } from "../auth_key/auth-key.service.js";

export const authMiddleware = async (
    req: AuthenticatedRequest,
    _res: Response,
    next: NextFunction,
) => {

    try {

        const authorization = req.headers.authorization;

        if (!authorization) {
            throw new Error(
                "Authorization header missing",
            );
        }

        const token = authorization.replace(
            "Bearer ",
            "",
        );

        const decoded = jwt.decode(
            token,
            { complete: true },
        );

        if (
            !decoded ||
            typeof decoded === "string"
        ) {
            throw new Error(
                "Invalid token",
            );
        }

        const kid = decoded.header.kid;
        const authKeyService = new AuthKeyService();

        const key = await authKeyService.findByKid(String(kid));

        if (
            !key
        ) {

            throw new Error(
                "Key not found",
            );
        }

        const payload = jwt.verify(
                token,
                key.publicKey,
                {
                    algorithms: ["RS256"],
                },
            ) as JwtPayload;

        req.user = payload;

        next();

    } catch (error) {
        next(error);
    }
};