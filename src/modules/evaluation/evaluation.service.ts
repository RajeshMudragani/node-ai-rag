import { RetrievalService } from "../retrieval/retrieval.service.js";
import { ChatService } from "../chat/chat.service.js";
import { PromptType } from "../chat/chat.constants.js";
import { EvaluationRepository } from "./evaluation.repository.js";

export class EvaluationService {

    private readonly retrievalService = new RetrievalService();
    private readonly chatService = new ChatService();
    private readonly repository = new EvaluationRepository();

    async run(
        question: string,
        expectedAnswer: string,
        topK: number,
        tenantId: string,
    ) {

        const chunks = await this.retrievalService.search(
            question,
            topK,
            tenantId,
        );

        console.log({
            serviceTenantId: tenantId,
        });
        
        const response = await this.chatService.chat(
            question,
            topK,
            PromptType.DEFAULT,
            tenantId,
        );

        const generatedAnswer = response.answer;

        const retrievalPrecision = chunks.length > 0 ? 1 : 0;

        const answerRelevance =
            generatedAnswer
                .toLowerCase()
                .includes(
                    expectedAnswer
                        .split(" ")[0]
                        .toLowerCase(),
                )
                ? 1
                : 0.5;

        const groundedness = chunks.some( chunk =>
                generatedAnswer.includes(
                    chunk.content.substring(
                        0,
                        25,
                    ),
                ),
            ) ? 1 : 0.5;

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
            }
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
}