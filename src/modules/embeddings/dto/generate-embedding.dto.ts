import { z } from "zod";

export const GenerateEmbeddingDtoSchema = z.object({
    text: z
        .string()
        .trim()
        .min(1, "Text is required")
        .max(10_000, "Text is too long"),
});

export type GenerateEmbeddingDto = z.infer<typeof GenerateEmbeddingDtoSchema>;