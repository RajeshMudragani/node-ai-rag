import { randomUUID } from "crypto";

import {
    eq,
    asc,
    desc,
    ilike,
    sql,
} from "drizzle-orm";

import { db } from "../../config/db.config.js";
import { conversations } from "../../database/schema/conversations.schema.js";
import { messages } from "../../database/schema/messages.schema.js";

export class ConversationRepository {

    async createConversation(title?: string): Promise<string> {

        const id = randomUUID();

        await db.insert(conversations).values({id, title});

        return id;
    }

    async listConversations(
        page: number,
        pageSize: number,
        search?: string,
    ) {

        const offset =
            (page - 1) * pageSize;

        const whereClause =
            search
                ? ilike(
                    conversations.title,
                    `%${search}%`,
                )
                : undefined;

        const items =
            await db
                .select({
                    id: conversations.id,
                    title: conversations.title,
                    createdAt: conversations.createdAt,
                    updatedAt: conversations.updatedAt,

                    messageCount: sql<number>`
                        (
                            SELECT COUNT(*)
                            FROM messages
                            WHERE messages.conversation_id =
                            conversations.id
                        )
                    `,
                })
                .from(conversations)
                .where(whereClause)
                .orderBy(
                    desc(
                        conversations.updatedAt,
                    ),
                )
                .limit(pageSize)
                .offset(offset);

        const totalResult = await db
                .select({
                    count:
                        sql<number>`
                            COUNT(*)
                        `,
                })
                .from(conversations)
                .where(whereClause);

        return {
            items,
            total: Number( totalResult[0]?.count ?? 0 ),
        };
    }

    async getConversationById(
        conversationId: string,
    ) {

        const result =
            await db
                .select()
                .from(conversations)
                .where(
                    eq(
                        conversations.id,
                        conversationId,
                    ),
                )
                .limit(1);

        return result[0] ?? null;
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

        const latest = await db
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

    async updateTitle(
        conversationId: string,
        title: string,
    ): Promise<void> {

        await db
            .update(conversations)
            .set({
                title,
            })
            .where(
                eq(
                    conversations.id,
                    conversationId,
                ),
            );
    }

    async deleteConversation(
        conversationId: string,
    ): Promise<void> {

        await db
            .delete(conversations)
            .where(
                eq(
                    conversations.id,
                    conversationId,
                ),
            );
    }

    async renameConversation(
        conversationId: string,
        title: string,
    ): Promise<void> {

        await db
            .update(conversations)
            .set({
                title,
            })
            .where(
                eq(
                    conversations.id,
                    conversationId,
                ),
            );
    }
}