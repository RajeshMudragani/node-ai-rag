import { RetrievedChunk } from "../retrieval/interfaces/retrieved-chunk.interface.js";
import { ContextCleanerService } from "./context-cleaner.service.js";
import { BuiltContext } from "./interfaces/built-context.interface.js";
import {
    MAX_CONTEXT_CHUNKS,
    MAX_CONTEXT_LENGTH,
    CONTEXT_SEPARATOR,
} from "./context-builder.constants.js";

export class ContextBuilderService {
    private readonly cleaner = new ContextCleanerService();

    build(chunks: RetrievedChunk[]): BuiltContext {
        const context = chunks
            .slice(0, MAX_CONTEXT_CHUNKS)
            .map(chunk => this.cleaner.clean(chunk.content))
            .join(CONTEXT_SEPARATOR)
            .slice(0, MAX_CONTEXT_LENGTH);

        const sources = chunks.map(chunk => ({
            documentId: chunk.documentId,
            filename: chunk.filename,
            chunkIndex: chunk.chunkIndex,
            similarity: chunk.similarity,
            keywordScore: chunk.keywordScore,
            hybridScore: chunk.hybridScore,
        }));

        return { context, sources };
    }
}
