import { Request, Response, NextFunction } from "express";
import { EmbeddingsService } from "./embeddings.service.js";
import { GenerateEmbeddingDtoSchema } from "./dto/generate-embedding.dto.js";
import { EMBEDDING_MODEL } from "./embeddings.constants.js";
import { HTTP_STATUS } from "../../constants/http.constants.js";
import { successResponse } from "../../common/types/index.js";

export class EmbeddingsController {
    private readonly embeddingsService = new EmbeddingsService();

    generate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const dto = GenerateEmbeddingDtoSchema.parse(req.body);
            const result = await this.embeddingsService.generate(dto.text);
            res.status(HTTP_STATUS.OK).json(successResponse({
                model: EMBEDDING_MODEL,
                dimensions: result.dimensions,
                embedding: result.embedding,
            }));
        } catch (error) {
            next(error);
        }
    };
}
