import { sql, eq } from "drizzle-orm";
import { db } from "../../config/db.config.js";
import { documentChunks } from "../../database/schema/document_chunks.schema.js";
import { documents } from "../../database/schema/documents.schema.js";
import { RetrievedChunk } from "./interfaces/retrieved-chunk.interface.js";
import { DocumentChunkInput } from "./interfaces/document-chunk-input.interface.js";

export class RetrievalRepository {
    async similaritySearch(embedding: number[], limit: number): Promise<RetrievedChunk[]> {
        const queryVector = `[${embedding.join(",")}]`;

        const similarity = sql<number>`1 - (${documentChunks.embedding} <=> ${queryVector}::vector)`;
        const distance = sql<number>`${documentChunks.embedding} <=> ${queryVector}::vector`;

        const rows = await db
            .select({
                id: documentChunks.id,
                documentId: documentChunks.documentId,
                filename: documents.filename,
                content: documentChunks.content,
                chunkIndex: documentChunks.chunkIndex,
                pageNumber: documentChunks.pageNumber,
                tokenCount: documentChunks.tokenCount,
                similarity,
            })
            .from(documentChunks)
            .innerJoin(documents, eq(documentChunks.documentId, documents.id))
            .orderBy(distance)
            .limit(limit);

        return rows.map(row => ({ ...row, similarity: Number(row.similarity) }));
    }

    async addEmbeddings(chunks: DocumentChunkInput[]): Promise<void> {
        await Promise.all(chunks.map(chunk => db.insert(documentChunks).values(chunk)));
    }

    async keywordSearch(query: string, limit: number): Promise<RetrievedChunk[]> {
        const rows = await db.execute(sql`
            SELECT
                dc.id,
                dc.document_id AS "documentId",
                d.filename,
                dc.content,
                dc.chunk_index AS "chunkIndex",
                dc.page_number AS "pageNumber",
                dc.token_count AS "tokenCount",
                ts_rank(
                    to_tsvector('english', dc.content),
                    plainto_tsquery('english', ${query})
                ) AS "keywordScore"
            FROM document_chunks dc
            INNER JOIN documents d ON d.id = dc.document_id
            WHERE to_tsvector('english', dc.content) @@ plainto_tsquery('english', ${query})
            ORDER BY "keywordScore" DESC
            LIMIT ${limit}
        `);

        return rows.rows.map(row => ({
            id: String(row.id),
            documentId: String(row.documentId),
            filename: String(row.filename),
            content: String(row.content),
            chunkIndex: Number(row.chunkIndex),
            pageNumber: row.pageNumber !== null ? Number(row.pageNumber) : null,
            tokenCount: row.tokenCount !== null ? Number(row.tokenCount) : null,
            similarity: 0,
            keywordScore: Number(row.keywordScore),
            hybridScore: 0,
        })) as RetrievedChunk[];
    }
}
