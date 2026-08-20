import { EmbeddingsClient } from "./embeddings.client.js";

import {
    EXPECTED_EMBEDDING_DIMENSION,
} from "./embeddings.constants.js";

import {
    GenerateEmbeddingResult,
} from "./embeddings.types.js";

export class EmbeddingsService {
    private readonly client =
        new EmbeddingsClient();

    async generate(
        text: string,
    ): Promise<GenerateEmbeddingResult> {

        const response = await this.client.embed(text);
        const embedding = response.embeddings[0];
        const dimensions = embedding.length;

        if (dimensions !== EXPECTED_EMBEDDING_DIMENSION) {
            throw new Error(
                `Invalid embedding dimension. Expected ${EXPECTED_EMBEDDING_DIMENSION}, received ${dimensions}`,
            );
        }

        return {
            embedding,
            dimensions,
        };
    }
}