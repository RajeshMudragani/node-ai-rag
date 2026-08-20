import ollama from "ollama";
import { OLLAMA_LLM_MODEL } from "./llm.constants.js";

export class OllamaService {
    async generate(prompt: string): Promise<string> {
        const response = await ollama.generate({
            model: OLLAMA_LLM_MODEL,
            prompt,
            stream: false,
        });

        return response.response;
    }
}
