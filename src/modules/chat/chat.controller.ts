import {
    Request,
    Response,
    NextFunction,
} from "express";

import { ChatService } from "./chat.service.js";
import { ChatDtoSchema } from "./dto/chat.dto.js";

export class ChatController {
    private readonly chatService = new ChatService();

    chat = async (
        req: Request,
        res: Response,
        next: NextFunction,
    ): Promise<void> => {
        try {

            const dto = ChatDtoSchema.parse(
                req.body,
            );

           const result = await this.chatService.chat(
                dto.question,
                dto.topK,
                dto.promptType,
                dto.conversationId,
            );

            res.status(200).json({
                success: true,
                data: result,
            });

        } catch (error) {
            next(error);
        }
    };
}