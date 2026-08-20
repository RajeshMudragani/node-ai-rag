import {
    Request,
    Response,
    NextFunction,
} from "express";

import { DocumentsService } from "./documents.service.js";
import { IngestionService } from "../ingestion/ingestion.service.js";

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
                res.status(400).json({
                    success: false,
                    message: "File is required",
                });

                return;
            }

            const document = await this.documentsService.upload(
                req.file,
            );

            res.status(201).json({
                success: true,
                data: document,
            });
        } catch (error) {
            next(error);
        }
    };

    findAll = async (
        _req: Request,
        res: Response,
        next: NextFunction,
    ): Promise<void> => {
        try {
            const documents = await this.documentsService.findAll();

            res.status(200).json({
                success: true,
                data: documents,
            });
        } catch (error) {
            next(error);
        }
    };

    findById = async (
        req: Request<{ id: string }>,
        res: Response,
        next: NextFunction,
    ): Promise<void> => {
        try {
            const document = await this.documentsService.findById(
                req.params.id,
            );

            if (!document) {
                res.status(404).json({
                    success: false,
                    message: "Document not found",
                });

                return;
            }

            res.status(200).json({
                success: true,
                data: document,
            });
        } catch (error) {
            next(error);
        }
    };

    process = async (
        req: Request<{ id: string }>,
        res: Response,
        next: NextFunction,
    ): Promise<void> => {
        try {
            const result =
                await this.ingestionService.process(
                    req.params.id,
                );

            res.status(200).json({
                success: true,
                data: result,
            });
        } catch (error) {
            next(error);
        }
    };
}
