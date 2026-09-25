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
    ) {

        const chunks = await this.retrievalService.search(
            question,
            topK,
        );

        const response = await this.chatService.chat(
            question,
            topK,
            PromptType.DEFAULT,
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
            )
                ? 1
                : 0.5;

        const overallScore = (
                retrievalPrecision +
                answerRelevance +
                groundedness
            ) / 3;

        await this.repository.create({
            question,
            expectedAnswer,
            generatedAnswer,
            retrievalPrecision,
            answerRelevance,
            groundedness,
            overallScore,
        });

        return {
            retrievalPrecision,
            answerRelevance,
            groundedness,
            overallScore,
            generatedAnswer,
        };
    }

    async getHistory() {
        return this.repository.findAll();
    }
}