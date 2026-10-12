import { logger } from "../../../logger/logger.js";
import { documentWorker, closeDocumentWorker } from "./document.worker.js";
import { evaluationWorker, closeEvaluationWorker } from "./evaluation.worker.js";
import { notificationWorker, closeNotificationWorker } from "./notification.worker.js";

export function startWorkers(): void {
    logger.info("Workers started: document, evaluation, notification");

    // Workers start automatically on instantiation via import.
    // This function exists to make the import explicit and log startup.
    void documentWorker;
    void evaluationWorker;
    void notificationWorker;
}

export async function closeWorkers(): Promise<void> {
    await Promise.all([
        closeDocumentWorker(),
        closeEvaluationWorker(),
        closeNotificationWorker(),
    ]);
    logger.info("All workers closed");
}
