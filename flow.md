User Uploads Document
    ↓
Document API
    ↓
Ingestion Worker
    ↓
Chunking
    ↓
bge-m3 Embeddings
    ↓
PostgreSQL + pgvector
    ↓
HNSW Index

---

User Question
    ↓
Chat API
    ↓
bge-m3 Query Embedding
    ↓
Vector Search
    ↓
Top Chunks
    ↓
Prompt Builder
    ↓
qwen2.5:7b
    ↓
Answer + Sources




* **✅** **MinIO** **client/service**
* **✅** **Documents** **upload** **API**
* **✅** **Documents** **repository**
* **✅** **Document** **metadata** **storage** **in** **PostgreSQL**
* **✅** **Process** **document** **API**
* **✅** **PDF** **text** **extraction**
* **✅** **Chunking**
* **✅** **Embedding** **generation**
* **✅** **Store** **vectors** **in** `<span class="___xxxjie0 f1w7gpdv f1gqqdtu">document_chunks</span>`
* **✅** **Retrieval** **using** **real** **uploaded** **content**
