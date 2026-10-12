import { Worker, Job } from "bullmq";
import { bullMQConnection } from "../../../config/bullmq.config.js";
import { env } from "../../../config/env.config.js";
import { logger } from "../../../logger/logger.js";
import { EvaluationService } from "../../evaluation/evaluation.service.js";
import { EvaluationJobData } from "../interfaces/evaluation-job.interface.js";
import { QUEUES } from "../queue/queue.constants.js";

const evaluationService = new EvaluationService();

async function processEvaluationJob(job: Job<EvaluationJobData>): Promise<void> {

    const {
        tenantId,
        question,
        expectedAnswer,
        topK,
    } = job.data;

    logger.info(
        {
            jobId: job.id,
            tenantId,
            question,
        },
        "Evaluation job started",
    );

    const startedAt = Date.now();

    try {

        await job.updateProgress(10);

        const result = await evaluationService.processEvaluation(
            question,
            expectedAnswer,
            topK,
            tenantId,
        );

        await job.updateProgress(100);

        logger.info(
            {
                jobId: job.id,
                tenantId,
                overallScore: result.overallScore,
                processingTimeMs: Date.now() - startedAt,
            },
            "Evaluation job completed",
        );

    } catch (
        error
    ) {

        logger.error(
            {
                jobId: job.id,
                tenantId,
                question,
                err: error,
            },
            "Evaluation job failed",
        );

        throw error;
    }
}

export const evaluationWorker = new Worker<EvaluationJobData>(
    QUEUES.EVALUATION,
    processEvaluationJob,
    {
        connection: bullMQConnection,
        concurrency: env.WORKER_CONCURRENCY,
        stalledInterval: 300_000, // 5 minutes
        maxStalledCount: 0,
    },
);

evaluationWorker.on(
    "completed",
    job => {

        logger.info(
            {
                jobId: job.id,
                jobName: job.name,
            },
            "Evaluation worker: job completed",
        );
    },
);

evaluationWorker.on(
    "failed",
    (
        job,
        error,
    ) => {

        logger.error(
            {
                jobId: job?.id,
                jobName: job?.name,
                err: error,
                attemptsMade:
                    job?.attemptsMade,
            },
            "Evaluation worker: job failed",
        );
    },
);

evaluationWorker.on(
    "stalled",
    (
        jobId,
    ) => {

        logger.warn(
            {
                jobId,
            },
            "Evaluation worker: job stalled",
        );
    },
);

evaluationWorker.on(
    "error",
    error => {

        logger.error(
            {
                err: error,
            },
            "Evaluation worker: worker error",
        );
    },
);

export async function closeEvaluationWorker(): Promise<void> {

    await evaluationWorker.close();

    logger.info(
        "Evaluation worker closed",
    );
}