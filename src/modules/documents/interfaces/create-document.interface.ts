import { DocumentStatus } from "../documents.constants.js";

export interface CreateDocumentInput {
    filename: string;
    mimeType: string;
    storageKey: string;
    status: DocumentStatus;
    metadata?: Record<string, unknown>;
}