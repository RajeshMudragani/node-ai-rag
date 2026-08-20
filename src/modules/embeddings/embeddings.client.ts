import {
    EmbedResponse,
} from "./embeddings.types.js";

import {
    EMBEDDING_MODEL,
    OLLAMA_EMBED_URL,
} from "./embeddings.constants.js";

export class EmbeddingsClient {
    async embed(
        text: string,
    ): Promise<EmbedResponse> {
        const response = await fetch(
            OLLAMA_EMBED_URL,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    model: EMBEDDING_MODEL,
                    input: text,
                }),
            },
        );

        if (!response.ok) {
            throw new Error(
                `Ollama request failed: ${response.status}`,
            );
        }

        return response.json();
    }
}