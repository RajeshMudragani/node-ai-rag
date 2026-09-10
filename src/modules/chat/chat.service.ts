import { RetrievalService } from "../retrieval/retrieval.service.js";
import { PromptBuilderService } from "./prompt-builder.service.js";
import { ChatResponse } from "./interfaces/chat-response.interface.js";
import { OllamaService } from "../llm/ollama.service.js";
import { PromptType } from "./chat.constants.js";

import {
    ConversationService,
} from "../conversation/index.js";

import { QueryRewriterService } from "../query-rewriter/query-rewriter.service.js";

export class ChatService {

    private readonly retrievalService = new RetrievalService();
    private readonly promptBuilder = new PromptBuilderService();
    private readonly ollamaService = new OllamaService();
    private readonly conversationService = new ConversationService();
    private readonly queryRewriter = new QueryRewriterService();

    async chat(
        question: string,
        topK: number,
        promptType: PromptType,
        conversationId?: string,
    ): Promise<ChatResponse> {

        const currentConversationId =
            await this.conversationService
                .ensureConversation(
                    conversationId,
                );

        const history =
            await this.conversationService
                .getHistory(
                    currentConversationId,
                );

        const rewrittenQuery =
            await this.queryRewriter.rewrite(
                question,
                history,
            );

        const builtContext =
            await this.retrievalService
                .retrieveContext(
                    rewrittenQuery,
                    topK,
                );

        const prompt =
            this.promptBuilder.build(
                question,
                builtContext.context,
                history,
                promptType,
            );

        const answer =
            await this.ollamaService.generate(
                prompt,
            );

        await this.conversationService
            .addUserMessage(
                currentConversationId,
                question,
            );

        await this.conversationService
            .addAssistantMessage(
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