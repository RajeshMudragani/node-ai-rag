import { randomUUID } from "crypto";
import { eq } from "drizzle-orm";
import { db } from "../../../config/db.config.js";
import { authKeys } from "../../../database/schema/auth_keys.schema.js";

type CreateAuthKeyInput =
    Omit<
        typeof authKeys.$inferInsert,
        "id"
    >;

export class AuthKeyRepository {

    async create(
        data: CreateAuthKeyInput,
    ): Promise<string> {

        const id = randomUUID();

        await db.insert(
            authKeys,
        )
        .values({
            id,
            ...data,
        });

        return id;
    }

    async getActiveKey() {

        const result = await db
            .select()
            .from(
                authKeys,
            )
            .where(
                eq(
                    authKeys.isActive,
                    true,
                ),
            )
            .limit(1);

        return result[0] ?? null;
    }

    async deactivateAll() {

        await db.update(
            authKeys,
        )
        .set({
            isActive: false,
            updatedAt: new Date(),
        });
    }

    async findByKid(
        kid: string,
    ) {

        const result = await db
            .select()
            .from(
                authKeys,
            )
            .where(
                eq(
                    authKeys.kid,
                    kid,
                ),
            )
            .limit(1);

        return result[0] ?? null;
    }
}