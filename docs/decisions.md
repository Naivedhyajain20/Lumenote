# Architectural Decisions & Technical Tradeoffs

**Project:** Document Investigator (ALGOTHON'26 | ID: ALG-AI-02)  
**Domain:** AI / ML - Multi-Document Contradiction & Honest Uncertainty Engine

---

## 1. Core Architecture Decisions

### 1.1 Dual-Path Conflict Detection (Path A + Path B)
- **Decision:** Conflict detection is performed through two decoupled parallel paths:
  1. **Path A (LLM Contradiction Analysis):** Semantic evaluation over top-reranked passages prompt-instructed to evaluate claims on identical topics.
  2. **Path B (Deterministic Fact Cross-Check):** Rule-based regex and entity/fact extraction normalizing numbers (`INR 5,00,000` -> `500000 INR`) and dates (`15 Feb 2026` -> `2026-02-15`).
- **Rationale:** LLMs alone frequently hallucinate or overlook subtle numerical discrepancies (e.g. 2,00,000 vs 2,50,000 advance payment). The deterministic cross-check provides mathematical precision, while the LLM provides semantic reasoning.

### 1.2 Hybrid Retrieval with Reciprocal Rank Fusion (RRF)
- **Decision:** Merge vector search (dense embeddings) with BM25 Okapi (sparse keyword search) using $k=60$ RRF.
- **Rationale:** Technical terms, invoice numbers (`INV-2026-088`), clause numbers (`Clause 3.1`), and monetary values (`INR 5,00,000`) are often missed by purely semantic dense embeddings. BM25 guarantees 100% exact token recall.

### 1.3 Cross-Encoder Reranking with Coverage Rule
- **Decision:** Top 20 retrieved candidates are reranked via a cross-encoder model down to the top 8 chunks. If a question compares multiple documents, at least one chunk from each mentioned document is forced into the candidate window.
- **Rationale:** Bi-encoders (vector cosine similarity) calculate representations independently. Cross-encoders examine query-document interactions jointly, increasing precision.

### 1.4 Calibrated 4-Signal Confidence Scoring & Honest Abstention
- **Decision:** Confidence score is computed as:
  $$\text{Confidence} = 0.40 \cdot \text{retrieval} + 0.25 \cdot \text{claim\_support} + 0.20 \cdot \text{source\_agreement} + 0.15 \cdot \text{doc\_reliability} - (0.25 \text{ if conflict})$$
- **Rationale:** Prevents sycophantic, over-confident hallucination. When retrieval score is below 0.25 or `INSUFFICIENT_EVIDENCE` is triggered, the engine abstains honestly and itemizes missing evidence.

---

## 2. Technology Choices & Justification

| Layer | Chosen Technology | Reason |
| :--- | :--- | :--- |
| **Backend** | Python 3.11 + FastAPI | Async performance, strict Pydantic schemas, auto OpenAPI docs |
| **Database** | SQLite + SQLAlchemy | Zero external server configuration, portable, fully ACID |
| **Vector DB** | ChromaDB (Persistent) | Embedded local vector store, cosine indexing, no Docker container overhead |
| **Embeddings** | `sentence-transformers/all-MiniLM-L6-v2` | Fast CPU-friendly inference, high semantic recall |
| **PDF Extraction** | PyMuPDF (fitz) | Word/block-level bounding boxes for exact citation highlighting |
| **OCR Fallback** | Tesseract OCR (`eng+hin`) | Dual Hindi & English OCR with per-page confidence scoring |
| **Frontend** | Next.js 14/15 + React + Tailwind CSS | Ultra-responsive 3-column split-screen layout, glassmorphic dark theme |
