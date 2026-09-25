import { OllamaService }
from "../llm/ollama.service.js";

export class RerankerProvider {

    private readonly ollama = new OllamaService();

    async rerank(
        prompt: string,
    ): Promise<string> {

        return this.ollama.generate(
            prompt,
        );
    }
}