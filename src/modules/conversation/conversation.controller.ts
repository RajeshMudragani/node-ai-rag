import {
    Request,
    Response,
    NextFunction,
} from "express";
import { ConversationService } from "./conversation.service.js";
import { successResponse } from "../../common/types/index.js";
import { HTTP_STATUS } from "../../constants/http.constants.js";
import { RenameConversationDtoSchema } from "./dto/rename-conversation.dto.js";
import { ListConversationsDtoSchema } from "./dto/list-conversations.dto.js";

export class ConversationController {

    private readonly service = new ConversationService();

    getConversations = async (
        req: Request,
        res: Response,
        next: NextFunction,
    ) => {

        try {

            const {
                page,
                pageSize,
                search,
            } = ListConversationsDtoSchema.parse(req.query);

            const result = await this.service.getConversations(
                page,
                pageSize,
                search,
            );

            res.status(
                HTTP_STATUS.OK,
            )
            .json(
                successResponse({
                    items: result.items,
                    page,
                    pageSize,
                    total: result.total,
                }),
            );

        } catch (error) {
            next(error);
        }
    };

    getConversation = async (
        req: Request,
        res: Response,
        next: NextFunction,
    ) => {

        try {

            const result = await this.service.getConversation(
                String(req.params.id),
            );

            res.status(HTTP_STATUS.OK)
                .json(
                    successResponse(
                        result,
                    ),
                );

        } catch (error) {
            next(error);
        }
    };

    deleteConversation = async (
        req: Request,
        res: Response,
        next: NextFunction,
    ) => {

        try {

            await this.service.deleteConversation(String(req.params.id));

            res.status(
                    HTTP_STATUS.OK,
                )
                .json(
                    successResponse({
                        deleted: true,
                    }),
                );

        } catch (error) {
            next(error);
        }
    };

    renameConversation = async (
        req: Request,
        res: Response,
        next: NextFunction,
    ) => {

        try {

            const body = RenameConversationDtoSchema.parse(req.body);

            await this.service.renameConversation(
                String(req.params.id),
                body.title,
            );

            res.status(
                HTTP_STATUS.OK,
            )
            .json(
                successResponse({
                    updated: true,
                }),
            );

        } catch (error) {

            next(error);

        }
    };
}