import { randomUUID } from "crypto";
import { db } from "../../config/db.config.js";
import { evaluationRuns } from "../../database/schema/evaluation_runs.schema.js";

type CreateEvaluationRunInput =
    Omit<
        typeof evaluationRuns.$inferInsert,
        "id"
    >;

export class EvaluationRepository {

    async create(
        data: CreateEvaluationRunInput,
    ): Promise<string> {

        const id = randomUUID();

        await db
            .insert(
                evaluationRuns,
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
                evaluationRuns,
            );
    }
}