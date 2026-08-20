import {
    Request,
    Response,
    NextFunction,
} from "express";

import { RetrievalService } from "./retrieval.service.js";
import { SearchDtoSchema } from "./dto/search.dto.js";

export class RetrievalController {
    private readonly retrievalService = new RetrievalService();

    search = async (
        req: Request,
        res: Response,
        next: NextFunction,
    ): Promise<void> => {
        try {
            const dto = SearchDtoSchema.parse(
                req.body,
            );

            const results =
                await this.retrievalService.search(
                    dto.query,
                    dto.limit,
                );

            res.status(200).json({
                success: true,
                data: results,
            });
        } catch (error) {
            next(error);
        }
    };

    context = async (
        req: Request,
        res: Response,
        next: NextFunction,
    ): Promise<void> => {
        try {
            const dto = SearchDtoSchema.parse(
                req.body,
            );

            const context =
                await this.retrievalService.retrieveContext(
                    dto.query,
                    dto.limit,
                );

            res.status(200).json({
                success: true,
                data: context,
            });
        } catch (error) {
            next(error);
        }
    };
}