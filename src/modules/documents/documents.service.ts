import { randomUUID } from "node:crypto";
import { MinioService } from "../../storage/minio/minio.service.js";
import { DocumentsRepository } from "./documents.repository.js";
import { DOCUMENT_STATUS, STORAGE_KEY_PREFIX } from "./documents.constants.js";
import { NotFoundError } from "../../common/errors/index.js";
import { CollectionsService } from "../collections/collections.service.js";
import { MetadataService } from "../metadata/metadata.service.js";

export class DocumentsService {
    private readonly documentsRepository = new DocumentsRepository();
    private readonly minioService = new MinioService();
    private readonly collectionsService = new CollectionsService();
    private readonly metadataService = new MetadataService();

    async upload(
        file: Express.Multer.File,
        collectionName?: string,
        metadata?: Record<string, string>,
    ) {

        let collectionId: string | null = null;

        if (
            collectionName &&
            collectionName.trim()
        ) {
            collectionId = await this.collectionsService.findOrCreate(collectionName.trim());
        }

        const extension = file.originalname.split(".").pop();
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, "0");

        const storageKey = `${STORAGE_KEY_PREFIX}/${year}/${month}/${randomUUID()}.${extension}`;

        await this.minioService
            .uploadObject(
                storageKey,
                file.buffer,
                file.mimetype,
            );

        const document = await this.documentsRepository.create({
            filename: file.originalname,
            mimeType: file.mimetype,
            storageKey,
            status: DOCUMENT_STATUS.UPLOADED,
            metadata: {
                size: file.size,
            },
            collectionId,
        });

        if (
            metadata &&
            Object.keys(metadata).length > 0
        ) {
            await this.metadataService.bulkAdd(
                document.id,
                metadata,
            );
        }

        return document;
    }

    async findById(
        documentId: string,
    ) {

        const document = await this.documentsRepository.findById(documentId);

        if (!document) {
            throw new NotFoundError(
                "Document",
            );
        }
        return document;
    }

    async findAll() {
        return this.documentsRepository.findAll();
    }
}
