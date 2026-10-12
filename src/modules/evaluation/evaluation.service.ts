import { RetrievalService } from "../retrieval/retrieval.service.js";
import { ChatService } from "../chat/chat.service.js";
import { PromptType } from "../chat/chat.constants.js";
import { EvaluationRepository } from "./evaluation.repository.js";
import { QueueService } from "../jobs/queue/queue.service.js";
import { logger } from "../../logger/logger.js";

export class EvaluationService {

    private readonly retrievalService = new RetrievalService();
    private readonly chatService = new ChatService();
    private readonly repository = new EvaluationRepository();
    private readonly queueService = new QueueService();

    async processEvaluation(
        question: string,
        expectedAnswer: string,
        topK: number,
        tenantId: string,
    ) {

        const chunks = await this.retrievalService.searchWithoutRerank(
            question,
            topK,
            tenantId,
        );

        const response = await this.chatService.chat(
            question,
            topK,
            PromptType.DEFAULT,
            tenantId,
        );

        const generatedAnswer = response.answer;

        const retrievalPrecision = chunks.length > 0 ? 1 : 0;

        const answerRelevance = generatedAnswer
            .toLowerCase()
            .includes(
                expectedAnswer
                    .split(" ")[0]
                    .toLowerCase(),
            )
            ? 1
            : 0.5;

        const groundedness = chunks.some(
            chunk =>
                generatedAnswer.includes(
                    chunk.content.substring(
                        0,
                        25,
                    ),
                ),
        )
            ? 1
            : 0.5;

        const overallScore = (
            retrievalPrecision +
            answerRelevance +
            groundedness
        ) / 3;

        await this.repository.create(
            tenantId,
            {
                question,
                expectedAnswer,
                generatedAnswer,
                retrievalPrecision,
                answerRelevance,
                groundedness,
                overallScore,
            },
        );

        return {
            retrievalPrecision,
            answerRelevance,
            groundedness,
            overallScore,
            generatedAnswer,
        };
    }


    async getHistory(tenantId: string) {
        return this.repository.findAll(tenantId);
    }

    async run(
        question: string,
        expectedAnswer: string,
        topK: number,
        tenantId: string,
    ) {
        return this.processEvaluation(
            question,
            expectedAnswer,
            topK,
            tenantId,
        );
    }

      async queueEvaluation(
        question: string,
        expectedAnswer: string,
        topK: number,
        tenantId: string,
    ) {

        await this.queueService.enqueueEvaluation({
            tenantId,
            question,
            expectedAnswer,
            topK,
        });

        return {
            status: "QUEUED",
        };
    }
}