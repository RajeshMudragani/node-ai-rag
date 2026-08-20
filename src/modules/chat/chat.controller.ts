import { Request, Response, NextFunction } from "express";
import { ChatService } from "./chat.service.js";
import { ChatDtoSchema } from "./dto/chat.dto.js";
import { HTTP_STATUS } from "../../constants/http.constants.js";
import { successResponse } from "../../common/types/index.js";

export class ChatController {
    private readonly chatService = new ChatService();

    chat = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const dto = ChatDtoSchema.parse(req.body);
            const result = await this.chatService.chat(
                dto.question,
                dto.topK,
                dto.promptType,
                dto.conversationId,
            );
            res.status(HTTP_STATUS.OK).json(successResponse(result));
        } catch (error) {
            next(error);
        }
    };
}
