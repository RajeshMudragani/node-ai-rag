import { randomUUID } from "node:crypto";
import { MinioService } from "../../storage/minio/minio.service.js";
import { DocumentsRepository } from "./documents.repository.js";
import { DOCUMENT_STATUS, DOCUMENT_PREVIEW_LENGTH, STORAGE_KEY_PREFIX } from "./documents.constants.js";
import { NotFoundError } from "../../common/errors/index.js";

export class DocumentsService {
    private readonly documentsRepository = new DocumentsRepository();
    private readonly minioService = new MinioService();

    async upload(file: Express.Multer.File) {
        const extension = file.originalname.split(".").pop();
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, "0");
        const storageKey = `${STORAGE_KEY_PREFIX}/${year}/${month}/${randomUUID()}.${extension}`;

        await this.minioService.uploadObject(storageKey, file.buffer, file.mimetype);

        return this.documentsRepository.create({
            filename: file.originalname,
            mimeType: file.mimetype,
            storageKey,
            status: DOCUMENT_STATUS.UPLOADED,
            metadata: { size: file.size },
        });
    }

    async findById(documentId: string) {
        const document = await this.documentsRepository.findById(documentId);
        if (!document) throw new NotFoundError("Document");
        return document;
    }

    async findAll() {
        return this.documentsRepository.findAll();
    }
}
