import { randomUUID } from "node:crypto";
import { MinioService } from "../../storage/minio/minio.service.js";
import { DocumentsRepository } from "./documents.repository.js";
import { DOCUMENT_STATUS } from "./documents.constants.js";
import { ExtractionService } from "../ingestion/extraction.service.js";
import { ChunkingService } from "../ingestion/chunking.service.js";
import { IngestionService } from "../ingestion/ingestion.service.js";


export class DocumentsService {
    private readonly documentsRepository = new DocumentsRepository();
    private readonly minioService = new MinioService();
    private readonly extractionService = new ExtractionService();
    private readonly chunkingService = new ChunkingService();
    private readonly ingestionService = new IngestionService();

    async upload(
        file: Express.Multer.File,
    ) {
        const extension = file.originalname.split(".").pop();

        const storageKey =
            `documents/${new Date().getFullYear()}/${String(new Date().getMonth() + 1).padStart(2, "0")}/${randomUUID()}.${extension}`;

        await this.minioService.uploadObject(
            storageKey,
            file.buffer,
            file.mimetype,
        );

        const document = await this.documentsRepository.create({
            filename: file.originalname,
            mimeType: file.mimetype,
            storageKey,
            status:
                DOCUMENT_STATUS.UPLOADED,
            metadata: {
                size: file.size,
            },
        });

        return document;
    }

    async findById(
        documentId: string,
    ) {
        return this.documentsRepository.findById(
            documentId,
        );
    }

    async findAll() {
        return this.documentsRepository.findAll();
    }

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

            await this.documentsRepository.updateStatus(
                documentId,
                DOCUMENT_STATUS.READY,
            );

            return {
                documentId: document.id,
                filename: document.filename,
                pageCount: extractionResult.pageCount,
                textLength: extractionResult.text.length,
                chunksCreated: chunks.length,
                preview: extractionResult.text.substring(0, 1000),
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


