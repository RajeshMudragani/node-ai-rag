import { Worker, Job } from "bullmq";
import { bullMQConnection } from "../../../config/bullmq.config.js";
import { env } from "../../../config/env.config.js";
import { logger } from "../../../logger/logger.js";
import { IngestionService } from "../../ingestion/ingestion.service.js";
import { DocumentJobData } from "../interfaces/document-job.interface.js";
import { QUEUES } from "../queue/queue.constants.js";
import { DOCUMENT_JOBS } from "../jobs/document.job.js";

const ingestionService = new IngestionService();

async function processDocumentJob(job: Job<DocumentJobData>): Promise<void> {
    const { documentId, tenantId, filename } = job.data;


    await job.updateProgress(10);

    const result = await ingestionService.process(documentId);

    await job.updateProgress(100);

    logger.info(
        { jobId: job.id, documentId, chunksCreated: result.chunksCreated },
        "Document job completed",
    );
}

export const documentWorker = new Worker<DocumentJobData>(
    QUEUES.DOCUMENT,
    processDocumentJob,
    {
        connection: bullMQConnection,
        concurrency: env.WORKER_CONCURRENCY,
        limiter: {
            max: 10,
            duration: 1000,
        },
    },
);

documentWorker.on("completed", (job) => {
    logger.info({ jobId: job.id, jobName: job.name }, "Document worker: job completed");
});

documentWorker.on("failed", (job, error) => {
    logger.error(
        { jobId: job?.id, jobName: job?.name, err: error, attemptsMade: job?.attemptsMade },
        "Document worker: job failed",
    );
});

documentWorker.on("stalled", (jobId) => {
    logger.warn({ jobId }, "Document worker: job stalled");
});

documentWorker.on("error", (error) => {
    logger.error({ err: error }, "Document worker: worker error");
});

export async function closeDocumentWorker(): Promise<void> {
    await documentWorker.close();
    logger.info("Document worker closed");
}
