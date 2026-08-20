import { ChatMessage } from "./interfaces/chat-message.interface.js";

export class ConversationMemoryService {

    private static conversations =
        new Map<string, ChatMessage[]>();

    getHistory(
        conversationId: string,
    ): ChatMessage[] {

        return (
            ConversationMemoryService.conversations.get(
                conversationId,
            ) ?? []
        );
    }

    addUserMessage(
        conversationId: string,
        content: string,
    ): void {

        const history =
            this.getHistory(conversationId);

        history.push({
            role: "user",
            content,
            timestamp: new Date(),
        });

        ConversationMemoryService.conversations.set(
            conversationId,
            history,
        );
    }

    addAssistantMessage(
        conversationId: string,
        content: string,
    ): void {

        const history =
            this.getHistory(conversationId);

        history.push({
            role: "assistant",
            content,
            timestamp: new Date(),
        });

        ConversationMemoryService.conversations.set(
            conversationId,
            history,
        );
    }
}