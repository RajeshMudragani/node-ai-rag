import { eq } from "drizzle-orm";
import { db } from "../../config/db.config.js";
import { documents } from "../../database/schema/documents.schema.js";
import { CreateDocumentInput } from "./interfaces/create-document.interface.js";

export class DocumentsRepository {
    async create(
        input: CreateDocumentInput,
    ) {
        const [document] = await db
            .insert(documents)
            .values({
                filename: input.filename,
                mimeType: input.mimeType,
                storageKey: input.storageKey,
                status: input.status,
                metadata: input.metadata,
            })
            .returning();

        return document;
    }

    async findById(
        documentId: string,
    ) {
        const [document] = await db
            .select()
            .from(documents)
            .where(
                eq(
                    documents.id,
                    documentId,
                ),
            );

        return document ?? null;
    }

    async updateStatus(
        documentId: string,
        status: string,
    ) {
        const [document] = await db
            .update(documents)
            .set({
                status,
                updatedAt: new Date(),
            })
            .where(
                eq(
                    documents.id,
                    documentId,
                ),
            )
            .returning();

        return document;
    }

    async findAll() {
        return db
            .select()
            .from(documents);
    }
}