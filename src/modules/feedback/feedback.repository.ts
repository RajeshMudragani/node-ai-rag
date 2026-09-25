import { randomUUID } from "crypto";
import { db } from "../../config/db.config.js";
import { feedbacks } from "../../database/schema/feedbacks.schema.js";

type CreateFeedbackInput = Omit<
        typeof feedbacks.$inferInsert,
        "id"
    >;

export class FeedbackRepository {

    async create(
        data: CreateFeedbackInput,
    ): Promise<string> {

        const id = randomUUID();

        await db
            .insert(
                feedbacks,
            )
            .values({
                id,
                ...data,
            });

        return id;
    }

    async findAll() {

        return db
            .select()
            .from(
                feedbacks,
            );
    }
}