import { OllamaService } from "../llm/ollama.service.js";
import { ChatMessage } from "../chat/interfaces/chat-message.interface.js";
import { QUERY_REWRITE_PROMPT } from "./prompts/rewrite.prompt.js";

export class QueryRewriterService {

    private readonly ollamaService = new OllamaService();

    async rewrite(
        question: string,
        history: ChatMessage[],
    ): Promise<string> {

        if (
            history.length === 0 ||
            question.length > 50
        ) {
            return question;
        }

        const historyText = history
            .slice(-6)
            .map(
                message =>
                    `${message.role.toUpperCase()}: ${message.content}`,
            )
            .join("\n");

        const prompt = QUERY_REWRITE_PROMPT
            .replace(
                "{{HISTORY}}",
                historyText,
            )
            .replace(
                "{{QUESTION}}",
                question,
            );

        const rewrittenQuery =
            await this.ollamaService.generate(
                prompt,
            );

        const cleaned =
            rewrittenQuery
                .replace(/"/g, "")
                .replace(/^Output:/i, "")
                .replace(/^Rewritten Query:/i, "")
                .trim();


        if (
            cleaned.length < 5 ||
            cleaned.length > 300
        ) {
            return question;
        }

        return cleaned;


    }
}