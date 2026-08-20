import { z } from "zod";
import { PromptType } from "../chat.constants.js";

export const ChatDtoSchema = z.object({
    question: z.string().trim().min(1),

    topK: z.number()
        .int()
        .positive()
        .max(20)
        .default(5),

    promptType: z.nativeEnum(
        PromptType,
    ).default(
        PromptType.DEFAULT,
    ),

    conversationId: z
        .string()
        .uuid()
        .optional(),
});