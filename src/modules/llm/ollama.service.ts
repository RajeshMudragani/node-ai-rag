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

    async stream(
        prompt: string,
        onToken: (
            token: string,
        ) => void,
    ): Promise<string> {

        const stream = await ollama.generate({
            model: OLLAMA_LLM_MODEL,
            prompt,
            stream: true,
        });

        let fullResponse = "";

        for await (
            const chunk
            of stream
        ) {

            const token = chunk.response ?? "";

            fullResponse += token;

            onToken(
                token,
            );
        }

        return fullResponse;
    }
}