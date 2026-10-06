import { sql, eq, and } from "drizzle-orm";
import { db } from "../../config/db.config.js";
import { documentChunks } from "../../database/schema/document_chunks.schema.js";
import { documents } from "../../database/schema/documents.schema.js";
import { RetrievedChunk } from "./interfaces/retrieved-chunk.interface.js";
import { DocumentChunkInput } from "./interfaces/document-chunk-input.interface.js";
import { documentMetadata } from "../../database/schema/document_metadata.schema.js";

export class RetrievalRepository {

    async similaritySearch(
        tenantId: string,
        embedding: number[],
        limit: number,
        documentIds?: string[],
    ): Promise<RetrievedChunk[]> {

        const queryVector = `[${embedding.join(",")}]`;

        const similarity =
            sql<number>`
                1 -
                (
                    ${documentChunks.embedding}
                    <=>
                    ${queryVector}::vector
                )
            `;

        const tenantCondition =
            eq(
                documents.tenantId,
                tenantId,
            );

        const documentCondition =
            documentIds?.length
                ? sql`
                    ${documentChunks.documentId}
                    IN (
                        ${sql.join(
                            documentIds.map(
                                id => sql`${id}`,
                            ),
                            sql`, `,
                        )}
                    )
                `
                : undefined;

        const rows =
            await db
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
                .from(
                    documentChunks,
                )
                .innerJoin(
                    documents,
                    eq(
                        documentChunks.documentId,
                        documents.id,
                    ),
                )
                .where(
                    documentCondition
                        ? and(
                            tenantCondition,
                            documentCondition,
                        )
                        : tenantCondition,
                )
                .limit(
                    limit,
                );

        return rows.map(
            row => ({
                ...row,
                similarity: Number(row.similarity),
            }),
        );
    }

    async addEmbeddings(chunks: DocumentChunkInput[]): Promise<void> {
        await Promise.all(chunks.map(chunk => db.insert(documentChunks).values(chunk)));
    }

    async keywordSearch(
        tenantId: string,
        query: string,
        limit: number,
        documentIds?: string[],
    ): Promise<RetrievedChunk[]> {

        const documentFilter =
            documentIds?.length
                ? sql`
                    AND dc.document_id IN (
                        ${sql.join(
                            documentIds.map(
                                id => sql`${id}`,
                            ),
                            sql`, `,
                        )}
                    )
                `
                : sql``;

        const rows =
            await db.execute(sql`
                SELECT
                    dc.id,
                    dc.document_id AS "documentId",
                    d.filename,
                    dc.content,
                    dc.chunk_index AS "chunkIndex",
                    dc.page_number AS "pageNumber",
                    dc.token_count AS "tokenCount",
                    ts_rank(
                        to_tsvector(
                            'english',
                            dc.content
                        ),
                        plainto_tsquery(
                            'english',
                            ${query}
                        )
                    )
                    AS "keywordScore"
                FROM document_chunks dc
                INNER JOIN documents d
                    ON d.id = dc.document_id
                WHERE 
                    d.tenant_id = ${tenantId}
                AND
                    to_tsvector(
                        'english',
                        dc.content
                    )
                    @@
                    plainto_tsquery(
                        'english',
                        ${query}
                    )
                    ${documentFilter}
                ORDER BY
                    "keywordScore" DESC
                LIMIT
                    ${limit}
            `);

        return rows.rows.map(
            row => ({
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
            }),
        ) as RetrievedChunk[];
    }

    async findMatchingDocumentIds(
        tenantId: string,
        collectionId?: string,
        metadata?: Record<
            string,
            string
        >,
    ): Promise<string[]> {

        console.log({
            repositoryTenantId: tenantId,
        });
        let whereConditions =
            sql`
                d.tenant_id =
                ${tenantId}
            `;

        if (
            collectionId
        ) {

            whereConditions =
                sql`
                    ${whereConditions}
                    AND
                    d.collection_id =
                    ${collectionId}
                `;
        }

        const metadataConditions =
            metadata
                ? Object.entries(
                    metadata,
                ).map(
                    ([key, value]) =>
                        sql`
                            EXISTS (
                                SELECT 1
                                FROM document_metadata dm
                                WHERE
                                    dm.document_id =
                                    d.id
                                AND
                                    dm.key =
                                    ${key}
                                AND
                                    dm.value = ${value}
                            )
                        `,
                )
                : [];

        const rows =
            await db.execute(sql`
                SELECT d.id
                FROM documents d
                WHERE
                ${whereConditions}
                ${
                    metadataConditions.length
                        ? sql`
                            AND
                            ${sql.join(
                                metadataConditions,
                                sql` AND `,
                            )}
                        `
                        : sql``
                    }
            `);

        return rows.rows.map(
            row => String(row.id),
        );
    }
}
