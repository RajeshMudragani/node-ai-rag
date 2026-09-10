import { ConversationRepository } from "./conversation.repository.js";
import { MAX_HISTORY_MESSAGES } from "./conversation.constants.js";
import { ChatMessage } from "../chat/interfaces/chat-message.interface.js";

export class ConversationService {

    private readonly repository = new ConversationRepository();

    async ensureConversation(
        conversationId?: string,
    ): Promise<string> {

        if (!conversationId) {
            return this.repository.createConversation();
        }

        const exists = await this.repository.conversationExists(
            conversationId,
        );

        if (exists) {
            return conversationId;
        }

        return this.repository.createConversation();
    }

    async getHistory(
        conversationId: string,
    ): Promise<ChatMessage[]> {

        const messages = await this.repository.getMessages(
            conversationId,
            MAX_HISTORY_MESSAGES,
        );

        return messages.map(
            message => ({
                role:
                    message.role as
                        | "user"
                        | "assistant",

                content: message.content,
                timestamp: message.createdAt,
            }),
        );
    }

    async addUserMessage(
        conversationId: string,
        content: string,
    ): Promise<void> {

        const nextSequence =
            (
                await this.repository.getLatestSequenceNumber(
                    conversationId,
                )
            ) + 1;

        await this.repository.addMessage(
            conversationId,
            "user",
            content,
            nextSequence,
        );
    }

    async addAssistantMessage(
        conversationId: string,
        content: string,
    ): Promise<void> {

        const nextSequence =
            (
                await this.repository.getLatestSequenceNumber(
                    conversationId,
                )
            ) + 1;

        await this.repository.addMessage(
            conversationId,
            "assistant",
            content,
            nextSequence,
        );
    }
}