import { Request, Response, NextFunction } from "express";
import { DocumentsService } from "./documents.service.js";
import { IngestionService } from "../ingestion/ingestion.service.js";
import { HTTP_STATUS } from "../../constants/http.constants.js";
import { successResponse } from "../../common/types/index.js";
import { BadRequestError } from "../../common/errors/index.js";

export class DocumentsController {
    private readonly documentsService = new DocumentsService();
    private readonly ingestionService = new IngestionService();

    upload = async (
        req: Request,
        res: Response,
        next: NextFunction,
    ): Promise<void> => {

        try {

            if (!req.file) {
                throw new BadRequestError(
                    "File is required",
                );
            }

            const collectionName = req.body.collectionName;

            const document = await this.documentsService.upload(
                req.file,
                collectionName,
            );

            res.status(
                HTTP_STATUS.CREATED,
            ).json(
                successResponse(
                    document,
                ),
            );
        } catch (error) {
            next(error);
        }
    };

    findAll = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const documents = await this.documentsService.findAll();
            res.status(HTTP_STATUS.OK).json(successResponse(documents));
        } catch (error) {
            next(error);
        }
    };

    findById = async (req: Request<{ id: string }>, res: Response, next: NextFunction): Promise<void> => {
        try {
            const document = await this.documentsService.findById(req.params.id);
            res.status(HTTP_STATUS.OK).json(successResponse(document));
        } catch (error) {
            next(error);
        }
    };

    process = async (req: Request<{ id: string }>, res: Response, next: NextFunction): Promise<void> => {
        try {
            const result = await this.ingestionService.process(req.params.id);
            res.status(HTTP_STATUS.OK).json(successResponse(result));
        } catch (error) {
            next(error);
        }
    };
}
