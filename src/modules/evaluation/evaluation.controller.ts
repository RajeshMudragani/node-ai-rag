import {
    Request,
    Response,
    NextFunction,
} from "express";

import { EvaluationService }
from "./evaluation.service.js";

import {
    CreateEvaluationDtoSchema,
} from "./dto/create-evaluation.dto.js";

import {
    successResponse,
} from "../../common/types/index.js";

export class EvaluationController {

    private readonly service =
        new EvaluationService();

    run = async (
        req: Request,
        res: Response,
        next: NextFunction,
    ) => {

        try {

            const dto =
                CreateEvaluationDtoSchema.parse(
                    req.body,
                );

            const result =
                await this.service.run(
                    dto.question,
                    dto.expectedAnswer,
                    dto.topK,
                );

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

    history = async (
        _req: Request,
        res: Response,
        next: NextFunction,
    ) => {

        try {

            const result = await this.service.getHistory();

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