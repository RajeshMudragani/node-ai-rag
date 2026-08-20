import { z } from "zod";

export const SearchDtoSchema = z.object({
    query: z
        .string()
        .trim()
        .min(1),

    limit: z
        .number()
        .int()
        .positive()
        .max(20)
        .default(5),
});

export type SearchDto = z.infer<typeof SearchDtoSchema>;