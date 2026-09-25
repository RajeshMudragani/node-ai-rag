import { EmbeddingsService } from "../embeddings/embeddings.service.js";
import { RetrievalRepository } from "./retrieval.repository.js";
import { RetrievedChunk } from "./interfaces/retrieved-chunk.interface.js";
import { RerankerService } from "../reranker/reranker.service.js";
import { ContextBuilderService } from "../context-builder/context-builder.service.js";
import {
    MIN_SIMILARITY,
    VECTOR_WEIGHT,
    KEYWORD_WEIGHT,
} from "./retrieval.constants.js";
import { CollectionsService } from "../collections/collections.service.js";
import {
    DEFAULT_RERANK_CANDIDATES,
    RERANK_CANDIDATE_MULTIPLIER,
} from "../reranker/reranker.constants.js";

export class RetrievalService {
    private readonly embeddingsService = new EmbeddingsService();
    private readonly repository = new RetrievalRepository();
    private readonly contextBuilder = new ContextBuilderService();
    private readonly collectionsService = new CollectionsService();
    private readonly rerankerService = new RerankerService();

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

        const embeddingResult = await this.embeddingsService.generate(
            query,
        );

        const rerankCandidateCount = Math.max(
            limit * RERANK_CANDIDATE_MULTIPLIER,
            DEFAULT_RERANK_CANDIDATES,
        );

        const vectorResults =
            (
                await this.repository.similaritySearch(
                    embeddingResult.embedding,
                    rerankCandidateCount,
                    documentIds,
                )
            ).filter(
                chunk => chunk.similarity >= MIN_SIMILARITY,
            );

        const keywordResults = await this.repository.keywordSearch(
            query,
            rerankCandidateCount,
            documentIds,
        );

        const merged = this.mergeResults(
            vectorResults,
            keywordResults,
            rerankCandidateCount,
        );

        return this.rerankerService.rerank(
            query,
            merged,
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