import { z } from "zod";
import { DEFAULT_TOP_K, MAX_TOP_K } from "../retrieval.constants.js";

export const SearchDtoSchema =
    z.object({
        query: z.string().trim().min(1),

        limit: z.number()
            .int()
            .positive()
            .max(MAX_TOP_K)
            .default(DEFAULT_TOP_K),

        collectionName: z
            .string()
            .trim()
            .optional(),
    });

export type SearchDto = z.infer<typeof SearchDtoSchema>;
