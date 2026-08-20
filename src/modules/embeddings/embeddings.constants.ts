import { env } from "../../config/env.config.js";

export const EMBEDDING_MODEL = env.OLLAMA_EMBED_MODEL;
export const EXPECTED_EMBEDDING_DIMENSION = env.EMBEDDING_DIMENSIONS;
export const OLLAMA_EMBED_URL = `${env.OLLAMA_BASE_URL}/api/embed`;