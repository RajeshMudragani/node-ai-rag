<p align="center">
  <h1 align="center">🧠 node-ai-rag</h1>
  <p align="center">
    A production-grade Retrieval-Augmented Generation (RAG) API built with Node.js, TypeScript, and Ollama.<br/>
    Upload your documents. Ask questions. Get answers grounded in your own data.
  </p>
</p>

---

## What is RAG and Why Does It Matter?

Large Language Models (LLMs) like LLaMA are powerful, but they have a fundamental limitation — **they only know what they were trained on**. They cannot answer questions about your internal documents, your company's knowledge base, or anything that happened after their training cutoff.

**Retrieval-Augmented Generation (RAG)** solves this by giving the LLM access to your own data at query time. Instead of relying on memorized knowledge, the model is shown the most relevant excerpts from your documents and asked to answer based on that context.

```
Without RAG:   User Question → LLM → Answer (from training data only)

With RAG:      User Question → Search Your Documents → Relevant Excerpts
                                                              ↓
                              LLM sees: Question + Your Data → Grounded Answer
```

This project is a complete, self-hosted RAG backend. You own the data, you own the models, nothing leaves your infrastructure.

---

## Table of Contents

- [Features](#features)
- [How It Works — The Full Pipeline](#how-it-works--the-full-pipeline)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [API Reference](#api-reference)
- [Project Structure](#project-structure)
- [Core Concepts Explained](#core-concepts-explained)
- [Configuration Tuning Guide](#configuration-tuning-guide)
- [Scripts](#scripts)

---

## Features

- **Document ingestion** — Upload PDF, TXT, Markdown, and DOCX files
- **Automatic chunking** — Documents are split into overlapping chunks for better retrieval coverage
- **Vector embeddings** — Each chunk is converted to a numerical vector using Ollama's embedding models
- **Hybrid search** — Combines semantic vector search (meaning-based) with keyword full-text search for best-of-both-worlds retrieval
- **Query rewriting** — Short follow-up questions are automatically expanded using conversation history before searching
- **Multi-turn conversations** — Conversation memory is maintained per session via a unique `conversationId`
- **Multiple prompt modes** — Choose between `default`, `strict` (evidence-only), and `concise` (bullet points) response styles
- **Fully local** — Runs entirely on your own infrastructure using Ollama. No OpenAI API keys, no data leaving your network
- **Structured error handling** — Every error returns a consistent JSON shape with typed error codes
- **Production-ready** — Graceful shutdown, structured logging with Pino, request ID tracing, Helmet security headers

---

## How It Works — The Full Pipeline

Understanding the pipeline is the key to understanding this entire codebase. There are two distinct flows.

### Flow 1 — Document Ingestion

This is how a document goes from a raw file to a searchable knowledge base.

```
┌─────────────────────────────────────────────────────────────────────┐
│                        INGESTION PIPELINE                           │
│                                                                     │
│  1. Upload        2. Store          3. Extract       4. Chunk       │
│  ─────────        ───────           ────────         ──────         │
│  User uploads  →  File saved    →   PDF text     →   Text split     │
│  PDF via API      to MinIO          extracted        into 1000-char  │
│                   object store      by pdf-parse      overlapping    │
│                                                       windows        │
│                                                                     │
│  5. Embed                    6. Store Vectors                       │
│  ──────                      ─────────────────                      │
│  Each chunk sent  →          Chunk + its vector                     │
│  to Ollama embed             saved to PostgreSQL                    │
│  model (bge-m3)              with pgvector extension                │
│  → 1024-dim vector                                                  │
└─────────────────────────────────────────────────────────────────────┘
```

### Flow 2 — Chat / Question Answering

This is what happens every time a user asks a question.

```
┌─────────────────────────────────────────────────────────────────────┐
│                          CHAT PIPELINE                              │
│                                                                     │
│  User Question                                                      │
│       │                                                             │
│       ▼                                                             │
│  ┌─────────────────┐                                                │
│  │  Query Rewriter  │  If short follow-up + conversation history,   │
│  │  (Ollama LLM)    │  rewrite "What about it?" →                   │
│  └────────┬────────┘  "What are the performance implications of     │
│           │            React useEffect?"                            │
│           ▼                                                         │
│  ┌──────────────────────────────────────────────────┐              │
│  │              Hybrid Search                        │              │
│  │                                                   │              │
│  │  ┌─────────────────┐    ┌──────────────────────┐ │              │
│  │  │  Vector Search   │    │   Keyword Search      │ │              │
│  │  │  (pgvector       │    │   (PostgreSQL         │ │              │
│  │  │   cosine sim)    │    │    full-text ts_rank) │ │              │
│  │  └────────┬────────┘    └──────────┬───────────┘ │              │
│  │           │                        │              │              │
│  │           └──────────┬─────────────┘              │              │
│  │                      ▼                            │              │
│  │           Score Fusion (60% vector,               │              │
│  │           40% keyword) → ranked chunks            │              │
│  └──────────────────────┬───────────────────────────┘              │
│                         │                                           │
│                         ▼                                           │
│  ┌──────────────────────────────┐                                   │
│  │      Context Builder         │  Top 5 chunks cleaned,            │
│  │                              │  joined, truncated to 8000 chars  │
│  └──────────────┬───────────────┘                                   │
│                 │                                                   │
│                 ▼                                                   │
│  ┌──────────────────────────────┐                                   │
│  │      Prompt Builder          │  Injects: History + Context +     │
│  │                              │  Question into chosen template    │
│  └──────────────┬───────────────┘                                   │
│                 │                                                   │
│                 ▼                                                   │
│  ┌──────────────────────────────┐                                   │
│  │      Ollama LLM              │  Generates the final answer       │
│  │      (llama3.2)              │                                   │
│  └──────────────┬───────────────┘                                   │
│                 │                                                   │
│                 ▼                                                   │
│  Response: { answer, sources, conversationId, promptType }         │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Tech Stack

| Layer            | Technology            | Purpose                                                       |
| ---------------- | --------------------- | ------------------------------------------------------------- |
| Runtime          | Node.js (ESM)         | Server runtime                                                |
| Language         | TypeScript 7          | Type safety across the entire codebase                        |
| Framework        | Express 5             | HTTP server and routing                                       |
| ORM              | Drizzle ORM           | Type-safe PostgreSQL queries                                  |
| Database         | PostgreSQL + pgvector | Stores documents, chunks, and vector embeddings               |
| Object Storage   | MinIO                 | Stores raw uploaded files (S3-compatible)                     |
| LLM & Embeddings | Ollama                | Runs LLM (llama3.2) and embedding model (bge-m3) locally      |
| Validation       | Zod v4                | Runtime schema validation for all request bodies and env vars |
| Logging          | Pino + pino-http      | Structured JSON logging with request tracing                  |
| Security         | Helmet + CORS         | HTTP security headers                                         |

---

## Prerequisites

Before running this project you need the following installed and running:

### 1. PostgreSQL with pgvector

pgvector is a PostgreSQL extension that adds vector similarity search. It must be installed in your PostgreSQL instance.

```bash
# Using Docker (recommended for local dev)
docker run -d \
  --name pgvector \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=ragdb \
  -p 5432:5432 \
  pgvector/pgvector:pg16
```

### 2. MinIO

MinIO is an S3-compatible object store used to store uploaded files.

```bash
docker run -d \
  --name minio \
  -e MINIO_ROOT_USER=admin \
  -e MINIO_ROOT_PASSWORD=admin@123 \
  -p 9000:9000 \
  -p 9001:9001 \
  minio/minio server /data --console-address ":9001"
```

MinIO console is available at `http://localhost:9001` (admin / admin@123).

### 3. Ollama

Ollama runs LLMs and embedding models locally.

```bash
# Install Ollama — https://ollama.com/download

# Pull the LLM used for chat
ollama pull llama3.2

# Pull the embedding model
ollama pull bge-m3
```

Verify Ollama is running at `http://localhost:11434`.

### 4. Node.js

Node.js 20 or higher is required.

```bash
node --version  # should be >= 20
```

---

## Getting Started

```bash
# 1. Clone the repository
git clone <your-repo-url>
cd node-ai

# 2. Install dependencies
npm install

# 3. Copy the environment file and fill in your values
cp .env.example .env

# 4. Run database migrations
npm run db:migrate

# 5. Start the development server
npm run dev
```

The server starts at `http://localhost:7892` (or whatever `PORT` you set).

---

## Environment Variables

All configuration is driven by environment variables. The application validates every variable at startup using Zod — if anything is missing or invalid, the server will not start and will print exactly which variable failed.

```env
# ─── Server ───────────────────────────────────────────────────────────
PORT=3000                          # Port the HTTP server listens on
NODE_ENV=development               # development | test | production
LOG_LEVEL=info                     # fatal | error | warn | info | debug | trace | silent
API_PREFIX=/api/v1                 # Global prefix for all routes
SHUTDOWN_TIMEOUT_MS=10000          # How long to wait for graceful shutdown (ms)
REQUEST_BODY_LIMIT=50mb            # Max JSON body size

# ─── Database ─────────────────────────────────────────────────────────
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/ragdb
DB_POOL_MAX=20                     # Max connections in the pool
DB_POOL_MIN=2                      # Min idle connections kept alive
DB_IDLE_TIMEOUT_MS=30000           # Close idle connections after this many ms
DB_CONNECTION_TIMEOUT_MS=5000      # Fail if connection not acquired within this ms

# ─── Ollama ───────────────────────────────────────────────────────────
OLLAMA_BASE_URL=http://localhost:11434   # Ollama server URL
OLLAMA_LLM_MODEL=llama3.2               # Model used for chat generation
OLLAMA_EMBED_MODEL=bge-m3               # Model used for generating embeddings
EMBEDDING_DIMENSIONS=1024               # Must match the embedding model's output size

# ─── MinIO ────────────────────────────────────────────────────────────
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_ACCESS_KEY=admin
MINIO_SECRET_KEY=admin@123
MINIO_BUCKET=documents
MINIO_USE_SSL=false
MINIO_REGION=us-east-1

# ─── Upload ───────────────────────────────────────────────────────────
UPLOAD_MAX_FILE_SIZE_MB=100        # Max file size for document uploads
```

> **Important:** `EMBEDDING_DIMENSIONS` must exactly match the output dimensions of your `OLLAMA_EMBED_MODEL`. For `bge-m3` this is `1024`. If you switch models, update this value and re-run migrations.

---

## API Reference

All routes are prefixed with `/api/v1`.

### Health

| Method  | Endpoint              | Description                                                          |
| ------- | --------------------- | -------------------------------------------------------------------- |
| `GET` | `/api/v1/health`    | Liveness check — returns`200 OK` if server is up                  |
| `GET` | `/api/v1/health/db` | Readiness check — returns`200` if DB is reachable, `503` if not |

---

### Documents

#### Upload a Document

```
POST /api/v1/documents/upload
Content-Type: multipart/form-data
```

| Field    | Type | Required | Description            |
| -------- | ---- | -------- | ---------------------- |
| `file` | File | Yes      | The document to upload |

Supported file types: `application/pdf`, `text/plain`, `text/markdown`, `application/vnd.openxmlformats-officedocument.wordprocessingml.document`

**Response `201`**

```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "filename": "company-handbook.pdf",
    "mimeType": "application/pdf",
    "storageKey": "documents/2025/01/uuid.pdf",
    "status": "UPLOADED",
    "metadata": { "size": 204800 },
    "createdAt": "2025-01-15T10:30:00.000Z",
    "updatedAt": "2025-01-15T10:30:00.000Z"
  }
}
```

---

#### Process a Document (Trigger Ingestion)

After uploading, you must trigger processing to extract text, generate embeddings, and make the document searchable.

```
POST /api/v1/documents/:id/process
```

This is an async-style operation that runs the full ingestion pipeline:

1. Downloads the file from MinIO
2. Extracts text (PDF parsing)
3. Splits into overlapping chunks
4. Generates an embedding vector for each chunk via Ollama
5. Stores all chunks + vectors in PostgreSQL

**Response `200`**

```json
{
  "success": true,
  "data": {
    "documentId": "550e8400-e29b-41d4-a716-446655440000",
    "chunksCreated": 42,
    "status": "READY"
  }
}
```

Document status lifecycle: `UPLOADED` → `PROCESSING` → `READY` (or `FAILED`)

---

#### List All Documents

```
GET /api/v1/documents
```

**Response `200`**

```json
{
  "success": true,
  "data": [
    {
      "id": "550e8400-...",
      "filename": "company-handbook.pdf",
      "status": "READY",
      ...
    }
  ]
}
```

---

#### Get a Document by ID

```
GET /api/v1/documents/:id
```

**Response `200`** — returns the document record
**Response `404`** — `{ "success": false, "error": { "code": "NOT_FOUND", "message": "Document not found" } }`

---

### Retrieval

These endpoints let you search your document knowledge base directly, without going through the chat pipeline. Useful for debugging retrieval quality.

#### Hybrid Search

Returns ranked document chunks matching the query.

```
POST /api/v1/retrieval/search
Content-Type: application/json
```

```json
{
  "query": "What is the vacation policy?",
  "limit": 5
}
```

| Field     | Type   | Required | Default | Max    |
| --------- | ------ | -------- | ------- | ------ |
| `query` | string | Yes      | —      | —     |
| `limit` | number | No       | `5`   | `20` |

**Response `200`**

```json
{
  "success": true,
  "data": [
    {
      "id": "chunk-uuid",
      "documentId": "doc-uuid",
      "filename": "company-handbook.pdf",
      "content": "Employees are entitled to 20 days of paid vacation...",
      "chunkIndex": 7,
      "similarity": 0.87,
      "keywordScore": 0.43,
      "hybridScore": 0.69
    }
  ]
}
```

---

#### Retrieve Context

Same as search but returns the chunks already assembled into a single context string, ready to be injected into a prompt. Useful for inspecting what the LLM will actually see.

```
POST /api/v1/retrieval/context
Content-Type: application/json
```

```json
{
  "query": "What is the vacation policy?",
  "limit": 5
}
```

**Response `200`**

```json
{
  "success": true,
  "data": {
    "context": "Employees are entitled to 20 days...\n\n---\n\nVacation requests must be submitted...",
    "sources": [
      {
        "documentId": "doc-uuid",
        "filename": "company-handbook.pdf",
        "chunkIndex": 7,
        "similarity": 0.87,
        "keywordScore": 0.43,
        "hybridScore": 0.69
      }
    ]
  }
}
```

---

### Chat

The main endpoint. Ask questions in natural language and get answers grounded in your documents.

```
POST /api/v1/chat
Content-Type: application/json
```

```json
{
  "question": "How many vacation days do employees get?",
  "topK": 5,
  "promptType": "default",
  "conversationId": "optional-uuid-for-multi-turn"
}
```

| Field              | Type   | Required | Default        | Description                                                     |
| ------------------ | ------ | -------- | -------------- | --------------------------------------------------------------- |
| `question`       | string | Yes      | —             | The user's question                                             |
| `topK`           | number | No       | `5`          | Number of document chunks to retrieve (max 20)                  |
| `promptType`     | string | No       | `default`    | `default` \| `strict` \| `concise`                        |
| `conversationId` | UUID   | No       | auto-generated | Pass the ID from a previous response to continue a conversation |

#### Prompt Types

| Type        | Behaviour                                                                                | Best For                               |
| ----------- | ---------------------------------------------------------------------------------------- | -------------------------------------- |
| `default` | Helpful assistant, uses context but can supplement with general knowledge                | General Q&A                            |
| `strict`  | Answers ONLY from provided context. Returns evidence quotes. Refuses if answer not found | Compliance, legal, auditable use cases |
| `concise` | Returns bullet-point answers only                                                        | Quick lookups, summaries               |

**Response `200`**

```json
{
  "success": true,
  "data": {
    "answer": "Employees are entitled to 20 days of paid vacation per year, as outlined in Section 4 of the company handbook.",
    "conversationId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "promptType": "default",
    "sources": [
      {
        "documentId": "550e8400-e29b-41d4-a716-446655440000",
        "filename": "company-handbook.pdf",
        "chunkIndex": 7,
        "similarity": 0.87
      }
    ]
  }
}
```

#### Multi-turn Conversation Example

```bash
# First message — no conversationId needed
curl -X POST http://localhost:3000/api/v1/chat \
  -H "Content-Type: application/json" \
  -d '{ "question": "What are React Hooks?" }'

# Response includes: "conversationId": "abc-123"

# Follow-up — pass the conversationId back
curl -X POST http://localhost:3000/api/v1/chat \
  -H "Content-Type: application/json" \
  -d '{ "question": "Tell me more about useEffect", "conversationId": "abc-123" }'

# The query rewriter will expand "Tell me more about useEffect"
# into "Explain the React useEffect hook" before searching,
# using the conversation history for context.
```

---

### Embeddings

Direct access to the embedding model. Useful for testing or building custom search tooling.

```
POST /api/v1/embeddings/generate
Content-Type: application/json
```

```json
{
  "text": "What is the capital of France?"
}
```

**Response `200`**

```json
{
  "success": true,
  "data": {
    "model": "bge-m3",
    "dimensions": 1024,
    "embedding": [0.023, -0.041, 0.187, ...]
  }
}
```

---

### Error Responses

All errors follow a consistent shape:

```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Document not found"
  }
}
```

Validation errors (invalid request body) include a `details` array:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": [
      { "path": ["question"], "message": "Required" }
    ]
  }
}
```

| HTTP Status | Code                      | Meaning                                        |
| ----------- | ------------------------- | ---------------------------------------------- |
| `200`     | —                        | Success                                        |
| `201`     | —                        | Resource created                               |
| `400`     | `BAD_REQUEST`           | Missing required field (e.g. no file uploaded) |
| `404`     | `NOT_FOUND`             | Resource does not exist                        |
| `409`     | `CONFLICT`              | Resource already exists                        |
| `422`     | `VALIDATION_ERROR`      | Request body failed schema validation          |
| `500`     | `INTERNAL_SERVER_ERROR` | Unexpected server error                        |
| `503`     | —                        | Dependency unavailable (e.g. DB down)          |

---

## Project Structure

```
src/
├── common/                    # Shared cross-cutting concerns
│   ├── errors/                # AppError base class + typed HTTP errors
│   ├── types/                 # ApiResponse types + successResponse() helper
│   └── utils/                 # sanitizeText() and other shared utilities
│
├── config/
│   ├── env.config.ts          # Zod-validated environment schema
│   └── db.config.ts           # PostgreSQL pool + Drizzle instance
│
├── constants/
│   └── http.constants.ts      # HTTP_STATUS and ERROR_CODES enums
│
├── database/
│   └── schema/                # Drizzle table definitions
│       ├── documents.schema.ts
│       └── document_chunks.schema.ts
│
├── logger/
│   └── logger.ts              # Pino logger instance
│
├── middlewares/
│   ├── errors.middleware.ts   # Global error handler
│   └── request-logger.middleware.ts
│
├── modules/
│   ├── chat/                  # Chat pipeline, prompt building, conversation memory
│   ├── context-builder/       # Assembles retrieved chunks into LLM-ready context
│   ├── documents/             # Document upload, storage, metadata management
│   ├── embeddings/            # Embedding generation via Ollama
│   ├── health/                # Liveness and readiness endpoints
│   ├── ingestion/             # Text extraction, chunking, embedding pipeline
│   ├── llm/                   # Ollama LLM adapter
│   ├── query-rewriter/        # Rewrites follow-up questions into standalone queries
│   └── retrieval/             # Hybrid vector + keyword search
│
├── storage/
│   └── minio/                 # MinIO client and service
│
├── app.ts                     # Express app setup
└── server.ts                  # Server bootstrap and graceful shutdown
```

---

## Core Concepts Explained

### What is a Vector Embedding?

When text is passed to an embedding model, it outputs a list of numbers (a vector) that represents the *meaning* of that text in high-dimensional space. Texts with similar meanings produce vectors that are close together in that space.

```
"vacation policy"     → [0.023, -0.041, 0.187, ...]  (1024 numbers)
"annual leave rules"  → [0.019, -0.038, 0.191, ...]  (very similar!)
"quarterly earnings"  → [-0.412, 0.203, -0.087, ...] (very different)
```

This is how semantic search works — we embed the user's question and find document chunks whose vectors are closest to it, regardless of whether they share the exact same words.

### Why Chunking?

LLMs have a context window limit — they can only process a certain amount of text at once. A 100-page PDF cannot be fed directly to the model. Chunking splits the document into smaller pieces (1000 characters with 200-character overlap) so each piece fits in the context window.

The overlap ensures that sentences at chunk boundaries are not lost — the end of one chunk appears at the start of the next.

```
Document: [-------- chunk 1 --------][-------- chunk 2 --------]
With overlap:
  Chunk 1: [========================]
  Chunk 2:               [========================]
                         ↑ 200-char overlap
```

### Why Hybrid Search?

Neither pure vector search nor pure keyword search is perfect on its own:

|          | Vector Search                                                | Keyword Search                                   |
| -------- | ------------------------------------------------------------ | ------------------------------------------------ |
| Strength | Finds semantically similar content even with different words | Exact term matching, great for names, codes, IDs |
| Weakness | Can miss exact matches for specific terms                    | Misses paraphrased or synonymous content         |

This system combines both using a weighted score:

```
hybridScore = (vectorSimilarity × 0.6) + (normalizedKeywordScore × 0.4)
```

Results from both searches are merged, deduplicated by `documentId + chunkIndex`, and re-ranked by the hybrid score.

### What is Query Rewriting?

In a multi-turn conversation, users often ask follow-up questions with pronouns or references:

```
Turn 1: "What are React Hooks?"
Turn 2: "Tell me more about useEffect"   ← ambiguous without context
Turn 3: "When should I use it?"          ← "it" refers to useEffect
```

Before searching, the query rewriter sends the question + recent conversation history to the LLM and asks it to produce a standalone, self-contained search query:

```
"When should I use it?" + history → "When should the React useEffect hook be used?"
```

This dramatically improves retrieval quality for follow-up questions. The rewriter only activates when there is conversation history AND the question is short (≤50 characters), to avoid unnecessary LLM calls.

### Prompt Modes

The system supports three prompt templates that change how the LLM responds:

- **`default`** — General helpful assistant. Uses context but can draw on general knowledge to fill gaps.
- **`strict`** — Enterprise knowledge assistant. Answers ONLY from the provided document context. Returns a quoted evidence section. Responds with "I could not find that information" if the answer is not in the documents. Use this for compliance-sensitive applications.
- **`concise`** — Returns bullet-point answers only. Best for quick lookups.

---

## Configuration Tuning Guide

These are the key constants that control retrieval and generation quality. All are in their respective `*.constants.ts` files and driven by environment variables where appropriate.

| Constant                 | Location                         | Default         | Effect of increasing                    | Effect of decreasing                           |
| ------------------------ | -------------------------------- | --------------- | --------------------------------------- | ---------------------------------------------- |
| `CHUNK_SIZE`           | `ingestion.constants.ts`       | `1000` chars  | More context per chunk, fewer chunks    | Less context per chunk, more precise retrieval |
| `CHUNK_OVERLAP`        | `ingestion.constants.ts`       | `200` chars   | Better boundary coverage, more storage  | Risk of losing context at boundaries           |
| `MIN_SIMILARITY`       | `retrieval.constants.ts`       | `0.55`        | Fewer but more relevant vector results  | More results but potentially noisy             |
| `VECTOR_WEIGHT`        | `retrieval.constants.ts`       | `0.6`         | More semantic, less keyword influence   | More keyword, less semantic influence          |
| `KEYWORD_WEIGHT`       | `retrieval.constants.ts`       | `0.4`         | More keyword, less semantic influence   | More semantic, less keyword influence          |
| `MAX_CONTEXT_CHUNKS`   | `context-builder.constants.ts` | `5`           | More context for LLM, higher token cost | Less context, faster and cheaper               |
| `MAX_CONTEXT_LENGTH`   | `context-builder.constants.ts` | `8000` chars  | More context passed to LLM              | Less context, fits smaller models              |
| `DEFAULT_TOP_K`        | `retrieval.constants.ts`       | `5`           | More candidates retrieved               | Fewer candidates                               |
| `PROMPT_HISTORY_LIMIT` | `chat.constants.ts`            | `10` messages | Longer memory, higher token cost        | Shorter memory                                 |

> **Rule of thumb:** If answers are missing relevant information → increase `MAX_CONTEXT_CHUNKS` or `DEFAULT_TOP_K`. If answers are noisy or off-topic → increase `MIN_SIMILARITY` or decrease `VECTOR_WEIGHT`.

---

## Scripts

```bash
# Start development server with hot reload
npm run dev

# Build TypeScript to dist/
npm run build

# Start production server (requires build first)
npm start

# Type-check without emitting files
npm run typecheck

# Generate a new database migration from schema changes
npm run db:generate

# Apply pending migrations to the database
npm run db:migrate
```

---

## Logging

The application uses [Pino](https://getpino.io/) for structured JSON logging. In development, logs are pretty-printed with colors. In production, logs are emitted as JSON for ingestion into log aggregators (Datadog, CloudWatch, ELK, etc.).

Every HTTP request is automatically logged with a unique `x-request-id` header. Pass `x-request-id` in your request to trace it through the logs.

```bash
# Development output (pretty-printed)
[10:30:00] INFO: Server is running on port 3000
[10:30:01] INFO: POST /api/v1/documents/upload 201 - 142ms

# Production output (JSON)
{"level":30,"time":"2025-01-15T10:30:00.000Z","msg":"Server is running on port 3000"}
```

---

## License

ISC
