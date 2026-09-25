import {
    Request,
    Response,
    NextFunction,
} from "express";
import { successResponse } from "../../common/types/index.js";
import { FeedbackService } from "./feedback.service.js";
import { CreateFeedbackDtoSchema } from "./dto/create-feedback.dto.js";

export class FeedbackController {

    private readonly service = new FeedbackService();

    create = async (
        req: Request,
        res: Response,
        next: NextFunction,
    ) => {

        try {

            const dto = CreateFeedbackDtoSchema.parse(req.body);

            const result = await this.service.create(dto);

            res.json(
                successResponse(
                    result,
                ),
            );

        } catch (
            error
        ) {
            next(
                error,
            );
        }
    };

    findAll = async (
        _req: Request,
        res: Response,
        next: NextFunction,
    ) => {

        try {

            const result = await this.service.findAll();

            res.json(
                successResponse(
                    result,
                ),
            );

        } catch (
            error
        ) {
            next(
                error,
            );
        }
    };
}