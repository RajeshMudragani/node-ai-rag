import ollama from "ollama";

export class OllamaService {

    async generate(
        prompt: string,
    ): Promise<string> {

        const response =
            await ollama.generate({
                model: "llama3.2",
                prompt,
                stream: false,
            });

        return response.response;
    }
}
