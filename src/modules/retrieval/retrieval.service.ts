import { EmbeddingsService } from "../embeddings/embeddings.service.js";
import { RetrievalRepository } from "./retrieval.repository.js";
import { RetrievedChunk } from "./interfaces/retrieved-chunk.interface.js";

import { BuiltContext } from "../context-builder/interfaces/built-context.interface.js";
import { ContextBuilderService } from "../context-builder/context-builder.service.js";
import {
    MIN_SIMILARITY,
    VECTOR_WEIGHT,
    KEYWORD_WEIGHT,
} from "./retrieval.constants.js";
import { CollectionsService } from "../collections/collections.service.js";

export class RetrievalService {
    private readonly embeddingsService = new EmbeddingsService();
    private readonly repository = new RetrievalRepository();
    private readonly contextBuilder = new ContextBuilderService();
    private readonly collectionsService = new CollectionsService();

    async search(
        query: string,
        limit: number,
        collectionName?: string,
        metadata?: Record<string, string>,
    ): Promise<RetrievedChunk[]> {

        return this.hybridSearch(
            query,
            limit,
            collectionName,
            metadata,
        );
    }

    async retrieveContext(
        query: string,
        limit: number,
        collectionName?: string,
        metadata?: Record<
            string,
            string
        >,
    ) {

        const chunks = await this.hybridSearch(
            query,
            limit,
            collectionName,
        );

        return this.contextBuilder.build(
            chunks,
        );
    }

    private async hybridSearch(
        query: string,
        limit: number,
        collectionName?: string,
        metadata?: Record<
            string,
            string
        >,
    ) {

        let collectionId: string | undefined;

        if (collectionName) {
            const collection = await this.collectionsService.findByName(
                collectionName,
            );
            collectionId = collection?.id;
        }

        const documentIds = await this.repository.findMatchingDocumentIds(
            collectionId,
            metadata
        );

        console.log("Metadata:", metadata);

        const embeddingResult = await this.embeddingsService.generate(
            query,
        );

        const vectorResults =
            (
                await this.repository.similaritySearch(
                    embeddingResult.embedding,
                    limit,
                    documentIds,
                )
            ).filter(
                chunk => chunk.similarity >= MIN_SIMILARITY,
            );

        const keywordResults = await this.repository.keywordSearch(
            query,
            limit,
            documentIds,
        );

        return this.mergeResults(
            vectorResults,
            keywordResults,
            limit,
        );
    }

    private mergeResults(
        vectorResults: RetrievedChunk[],
        keywordResults: RetrievedChunk[],
        limit: number,
    ): RetrievedChunk[] {

        const merged = new Map<string, RetrievedChunk>();

        
        const keywordScores =
            keywordResults.map(
                chunk => chunk.keywordScore ?? 0,
            );

        const maxKeywordScore = keywordScores.length > 0 ? Math.max(...keywordScores) : 0;

        vectorResults.forEach(chunk => {

            const key = `${chunk.documentId}-${chunk.chunkIndex}`;

            merged.set(key, {
                ...chunk,
                keywordScore: 0,
                hybridScore: chunk.similarity * VECTOR_WEIGHT,
            });
        });

        keywordResults.forEach(chunk => {

            const key = `${chunk.documentId}-${chunk.chunkIndex}`;
            
            const normalizedKeywordScore =
                maxKeywordScore > 0
                    ? (
                        (chunk.keywordScore ?? 0) / maxKeywordScore
                    )
                    : 0;

            const existing = merged.get(key);

            if (existing) {

                existing.keywordScore = normalizedKeywordScore;

                existing.hybridScore =
                    (
                        existing.similarity *
                        VECTOR_WEIGHT
                    )
                    +
                    (
                        normalizedKeywordScore *
                        KEYWORD_WEIGHT
                    );

                merged.set(
                    key,
                    existing,
                );

                return;
            }

            merged.set(key, {
                ...chunk,
                keywordScore: normalizedKeywordScore,
                hybridScore: normalizedKeywordScore * KEYWORD_WEIGHT,
            });
        });

        return Array
            .from(
                merged.values(),
            )
            .sort(
                (a, b) =>
                    (b.hybridScore ?? 0)
                    -
                    (a.hybridScore ?? 0),
            )
            .slice(
                0,
                limit,
            );
    }
}