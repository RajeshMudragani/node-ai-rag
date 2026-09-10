import { randomUUID } from "crypto";

import {
    eq,
    asc,
    desc,
} from "drizzle-orm";

import { db } from "../../config/db.config.js";
import { conversations } from "../../database/schema/conversations.schema.js";
import { messages } from "../../database/schema/messages.schema.js";

export class ConversationRepository {

    async createConversation(): Promise<string> {

        const id = randomUUID();

        await db
            .insert(conversations)
            .values({
                id,
            });

        return id;
    }

    async conversationExists(
        conversationId: string,
    ): Promise<boolean> {

        const result =
            await db
                .select({
                    id: conversations.id,
                })
                .from(conversations)
                .where(
                    eq(
                        conversations.id,
                        conversationId,
                    ),
                )
                .limit(1);

        return result.length > 0;
    }

    async addMessage(
        conversationId: string,
        role: string,
        content: string,
        sequenceNumber: number,
    ): Promise<void> {

        await db
            .insert(messages)
            .values({
                id: randomUUID(),
                conversationId,
                role,
                content,
                sequenceNumber,
            });
    }

    async getMessages(
        conversationId: string,
        limit: number,
    ) {

        return db
            .select()
            .from(messages)
            .where(
                eq(
                    messages.conversationId,
                    conversationId,
                ),
            )
            .orderBy(
                asc(
                    messages.sequenceNumber,
                ),
            )
            .limit(limit);
    }

    async getLatestSequenceNumber(
        conversationId: string,
    ): Promise<number> {

        const latest =
            await db
                .select({
                    sequenceNumber:
                        messages.sequenceNumber,
                })
                .from(messages)
                .where(
                    eq(
                        messages.conversationId,
                        conversationId,
                    ),
                )
                .orderBy(
                    desc(
                        messages.sequenceNumber,
                    ),
                )
                .limit(1);

        return (
            latest[0]?.sequenceNumber ??
            0
        );
    }
}