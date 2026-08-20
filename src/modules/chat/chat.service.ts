import { randomUUID } from "crypto";

import { RetrievalService } from "../retrieval/retrieval.service.js";
import { PromptBuilderService } from "./prompt-builder.service.js";
import { ChatResponse } from "./interfaces/chat-response.interface.js";
import { OllamaService } from "../llm/ollama.service.js";
import { PromptType } from "./chat.constants.js";
import { ConversationMemoryService } from "./conversation-memory.service.js";
import { QueryRewriterService } from "../query-rewriter/query-rewriter.service.js";

export class ChatService {
    private readonly retrievalService = new RetrievalService();
    private readonly promptBuilder = new PromptBuilderService();
    private readonly ollamaService = new OllamaService();
    private readonly memoryService = new ConversationMemoryService();
    private readonly queryRewriter = new QueryRewriterService();

    async chat(
        question: string,
        topK: number,
        promptType: PromptType,
        conversationId?: string,
    ): Promise<ChatResponse> {

        const currentConversationId = conversationId ?? randomUUID();

        const history = this.memoryService.getHistory(currentConversationId);

        const rewrittenQuery = await this.queryRewriter.rewrite(
            question,
            history,
        );

        const builtContext = await this.retrievalService.retrieveContext(
            rewrittenQuery,
            topK,
        );

        const prompt = this.promptBuilder.build(
            question,
            builtContext.context,
            history,
            promptType,
        );

        const answer = await this.ollamaService.generate(
            prompt,
        );

        this.memoryService.addUserMessage(
            currentConversationId,
            question,
        );

        this.memoryService.addAssistantMessage(
            currentConversationId,
            answer,
        );

        return {
            answer,
            conversationId: currentConversationId,
            promptType,
            sources: builtContext.sources,

            // TEMPORARY
            rewrittenQuery,
        };
    }
}