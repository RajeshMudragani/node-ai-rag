import { Router, Request, Response, NextFunction } from "express";

import { EmbeddingsService } from "./embeddings.service.js";
import { GenerateEmbeddingDtoSchema } from "./dto/generate-embedding.dto.js";

const router = Router();

const embeddingsService =
    new EmbeddingsService();

router.post(
    "/generate",
    async (
        req: Request,
        res: Response,
        next: NextFunction,
    ): Promise<void> => {
        try {
            const dto =
                GenerateEmbeddingDtoSchema.parse(
                    req.body,
                );

            const result =
                await embeddingsService.generate(
                    dto.text,
                );

            res.status(200).json({
                success: true,
                data: {
                    dimensions:
                        result.dimensions,

                    embedding:
                        result.embedding,

                    model: "bge-m3",
                },
            });
        } catch (error) {
            next(error);
        }
    },
);

export { router as embeddingsRouter };