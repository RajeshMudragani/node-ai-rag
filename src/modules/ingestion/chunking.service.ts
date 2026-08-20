import { Chunk } from "./interfaces/chunk.interface.js";

export class ChunkingService {
    private readonly chunkSize = 1000;

    private readonly chunkOverlap = 200;

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
            const end = Math.min(
                start + this.chunkSize,
                normalizedText.length,
            );

            const content = normalizedText
                .slice(start, end)
                .trim();

            chunks.push({
                content,
                chunkIndex,
                tokenCount:
                    this.estimateTokens(content),
            });

            if (
                end ===
                normalizedText.length
            ) {
                break;
            }

            start =
                end -
                this.chunkOverlap;

            chunkIndex++;
        }

        return chunks;
    }

    private estimateTokens(
        text: string,
    ): number {
        return Math.ceil(
            text.length / 4,
        );
    }
}