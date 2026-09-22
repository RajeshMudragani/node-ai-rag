import { randomUUID } from "crypto";
import {
    sql,
    eq,
    desc,
} from "drizzle-orm";
import { db } from "../../config/db.config.js";
import { collections } from "../../database/schema/collections.schema.js";

export class CollectionsRepository {

    async create(
        name: string,
        description?: string,
    ) {

        const id = randomUUID();

        await db
            .insert(collections)
            .values({
                id,
                name,
                description,
            });

        return id;
    }

    async findAll() {

        return db
            .select()
            .from(collections)
            .orderBy(
                desc(
                    collections.createdAt,
                ),
            );
    }

    async findById(
        collectionId: string,
    ) {

        const result = await db
            .select()
            .from(collections)
            .where(
                eq(
                    collections.id,
                    collectionId,
                ),
            )
            .limit(1);

        return result[0] ?? null;
    }

    async update(
        collectionId: string,
        data: {
            name?: string;
            description?: string;
        },
    ) {

        await db.update(collections).set({
            ...data,
            updatedAt: new Date(),
        })
        .where(
            eq(
                collections.id,
                collectionId,
            ),
        );
    }

    async delete(
        collectionId: string,
    ) {

        await db.delete(collections).where(
            eq(
                collections.id,
                collectionId,
            ),
        );
    }

    async findByName(
        name: string,
    ) {

        const result = await db
            .select()
            .from(collections)
            .where(
                eq(
                    collections.name,
                    name,
                ),
            )
            .limit(1);

        return result[0] ?? null;
    }

    async getStats(
        collectionId: string,
    ) {

        const result =
            await db.execute(sql`
                SELECT
                    COUNT(
                        DISTINCT d.id
                    )::int AS documents,

                    COUNT(
                        dc.id
                    )::int AS chunks

                FROM documents d

                LEFT JOIN document_chunks dc
                    ON dc.document_id = d.id

                WHERE
                    d.collection_id = ${collectionId}
            `);

        return result.rows[0];
    }
}
