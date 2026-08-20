import { DocumentsRepository } from "../documents/documents.repository.js";
import { DOCUMENT_STATUS } from "../documents/documents.constants.js";
import { MinioService } from "../../storage/minio/minio.service.js";
import { ExtractionService } from "./extraction.service.js";
import { ChunkingService } from "./chunking.service.js";
import { EmbeddingsService } from "../embeddings/embeddings.service.js";
import { RetrievalRepository } from "../retrieval/retrieval.repository.js";
import { sanitizeText } from "../../utils/sanatizer.js";

export class IngestionService {
    private readonly documentsRepository = new DocumentsRepository();
    private readonly minioService = new MinioService();
    private readonly extractionService = new ExtractionService();
    private readonly chunkingService = new ChunkingService();
    private readonly embeddingsService = new EmbeddingsService();
    private readonly retrievalRepository = new RetrievalRepository();

    async process(
        documentId: string,
    ) {

        const document = await this.documentsRepository.findById(
            documentId,
        );

        if (!document) {
            throw new Error(
                "Document not found",
            );
        }

        await this.documentsRepository.updateStatus(
            documentId,
            DOCUMENT_STATUS.PROCESSING,
        );

        try {

            const buffer = await this.minioService.downloadObjectAsBuffer(
                document.storageKey,
            );

            const extractionResult = await this.extractionService.extractPdf(
                buffer,
            );

            const chunks = this.chunkingService.chunk(extractionResult.text);

            const chunkInputs = [];

            for (let i = 0; i < chunks.length; i++) {

                const embeddingResult = await this.embeddingsService.generate(
                    chunks[i].content,
                );

                chunkInputs.push({
                    documentId,
                    content: sanitizeText(chunks[i].content),
                    chunkIndex: chunks[i].chunkIndex,
                    pageNumber: null,
                    tokenCount: chunks[i].tokenCount,
                    embedding: embeddingResult.embedding,
                });
            }

            await this.retrievalRepository.addEmbeddings(
                chunkInputs,
            );

            await this.documentsRepository.updateStatus(
                documentId,
                DOCUMENT_STATUS.READY,
            );

            return {
                documentId,
                chunksCreated: chunks.length,
                status: DOCUMENT_STATUS.READY,
            };
        } catch (error) {
            await this.documentsRepository.updateStatus(
                documentId,
                DOCUMENT_STATUS.FAILED,
            );

            throw error;
        }
    }
}