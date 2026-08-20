import { Chunk } from "./interfaces/chunk.interface.js";
import { CHUNK_SIZE, CHUNK_OVERLAP, TOKEN_ESTIMATE_DIVISOR } from "./ingestion.constants.js";

export class ChunkingService {
    chunk(text: string): Chunk[] {
        const normalizedText = text
            .replace(/\r/g, "")
            .replace(/\t/g, " ")
            .replace(/\n{3,}/g, "\n\n")
            .trim();

        const chunks: Chunk[] = [];
        let start = 0;
        let chunkIndex = 0;

        while (start < normalizedText.length) {
            const end = Math.min(start + CHUNK_SIZE, normalizedText.length);
            const content = normalizedText.slice(start, end).trim();

            chunks.push({
                content,
                chunkIndex,
                tokenCount: this.estimateTokens(content),
            });

            if (end === normalizedText.length) break;

            start = end - CHUNK_OVERLAP;
            chunkIndex++;
        }

        return chunks;
    }

    private estimateTokens(text: string): number {
        return Math.ceil(text.length / TOKEN_ESTIMATE_DIVISOR);
    }
}
