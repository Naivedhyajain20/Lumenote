import os
import logging
from typing import List, Dict, Any, Tuple
import chromadb
from chromadb.config import Settings as ChromaSettings
from rank_bm25 import BM25Okapi
from app.config import settings

logger = logging.getLogger("investigator.retrieve")

class HybridRetriever:
    def __init__(self):
        self.chroma_client = chromadb.PersistentClient(
            path=settings.CHROMA_PERSIST_DIR,
            settings=ChromaSettings(anonymized_telemetry=False)
        )
        self.collection = self.chroma_client.get_or_create_collection(
            name="document_chunks",
            metadata={"hnsw:space": "cosine"}
        )
        self.bm25: BM25Okapi = None
        self.indexed_chunks: List[Dict[str, Any]] = []
        self.embed_model = None
        self._model_initialized = False

    def _init_embedding_model(self):
        """Initialize sentence transformers model or fallback embedder on demand."""
        if self._model_initialized:
            return
        self._model_initialized = True
        try:
            import torch
            torch.set_num_threads(1)
            from sentence_transformers import SentenceTransformer
            # Lightweight, high performance local embedding
            self.embed_model = SentenceTransformer("all-MiniLM-L6-v2")
            logger.info("SentenceTransformer embedding model loaded successfully.")
        except Exception as e:
            logger.warning(f"Could not load SentenceTransformer: {e}. Using hash-based embeddings fallback.")

    def embed_texts(self, texts: List[str]) -> List[List[float]]:
        if not self._model_initialized:
            self._init_embedding_model()
        if self.embed_model:
            try:
                embeddings = self.embed_model.encode(texts, convert_to_numpy=True, normalize_embeddings=True)
                return embeddings.tolist()
            except Exception as e:
                logger.warning(f"Embedding failed: {e}")

        # Fallback pseudo-embedding
        dim = 384
        res = []
        for t in texts:
            vec = [0.0] * dim
            tokens = t.lower().split()
            for i, tok in enumerate(tokens):
                idx = abs(hash(tok)) % dim
                vec[idx] += 1.0 / (1.0 + (i * 0.1))
            norm = sum(x**2 for x in vec)**0.5 or 1.0
            res.append([x / norm for x in vec])
        return res

    def upsert_chunks(self, chunks: List[Dict[str, Any]]):
        """Index chunks into both ChromaDB and in-memory BM25 index."""
        if not chunks:
            return

        ids = [c["id"] for c in chunks]
        texts = [c.get("embedding_text", c["text"]) for c in chunks]
        metadatas = [
            {
                "document_id": c["document_id"],
                "doc_name": c.get("doc_name", ""),
                "page": int(c.get("page", 1)),
                "section_title": str(c.get("section_title", "")),
                "is_ocr": bool(c.get("is_ocr", False))
            }
            for c in chunks
        ]

        embeddings = self.embed_texts(texts)
        self.collection.upsert(
            ids=ids,
            documents=texts,
            embeddings=embeddings,
            metadatas=metadatas
        )

        # Update in-memory BM25 index
        for c in chunks:
            # Replace existing if already present
            self.indexed_chunks = [ch for ch in self.indexed_chunks if ch["id"] != c["id"]]
            self.indexed_chunks.append(c)

        tokenized_corpus = [c["text"].lower().split() for c in self.indexed_chunks]
        if tokenized_corpus:
            self.bm25 = BM25Okapi(tokenized_corpus)

    def delete_document_chunks(self, document_id: str):
        """Deletes chunks for document from Chroma and BM25."""
        try:
            self.collection.delete(where={"document_id": document_id})
        except Exception as e:
            logger.warning(f"Chroma delete error: {e}")

        self.indexed_chunks = [c for c in self.indexed_chunks if c.get("document_id") != document_id]
        tokenized_corpus = [c["text"].lower().split() for c in self.indexed_chunks]
        if tokenized_corpus:
            self.bm25 = BM25Okapi(tokenized_corpus)
        else:
            self.bm25 = None

    def _ensure_chunks_loaded(self):
        if not self.indexed_chunks:
            try:
                from app.db import SessionLocal
                from app.models import Chunk, Document
                db = SessionLocal()
                try:
                    chunks = db.query(Chunk).all()
                    if chunks:
                        doc_map = {d.id: d.filename for d in db.query(Document).all()}
                        self.indexed_chunks = [
                            {
                                "id": c.id,
                                "document_id": c.document_id,
                                "doc_name": doc_map.get(c.document_id, "Document"),
                                "page": c.page,
                                "section_title": c.section_title,
                                "text": c.text,
                                "embedding_text": f"Document: {doc_map.get(c.document_id, 'Document')} | Section: {c.section_title} | Page {c.page}\n\n{c.text}",
                                "bbox_json": c.bbox_json,
                                "is_ocr": c.is_ocr
                            }
                            for c in chunks
                        ]
                        tokenized_corpus = [c["text"].lower().split() for c in self.indexed_chunks]
                        if tokenized_corpus:
                            self.bm25 = BM25Okapi(tokenized_corpus)
                finally:
                    db.close()
            except Exception as e:
                logger.warning(f"Error loading chunks from db: {e}")

    def hybrid_search(self, query: str, top_k: int = 20) -> List[Dict[str, Any]]:
        self._ensure_chunks_loaded()
        if not self.indexed_chunks:
            return []

        # 1. Vector Search
        vector_results = []
        try:
            q_emb = self.embed_texts([query])
            count = self.collection.count()
            if count > 0:
                k_search = min(top_k, count)
                res = self.collection.query(
                    query_embeddings=q_emb,
                    n_results=k_search
                )
                if res and res["ids"] and res["ids"][0]:
                    vector_results = res["ids"][0]
        except Exception as e:
            logger.warning(f"Vector search failed: {e}")

        # 2. BM25 Search
        bm25_results = []
        if self.bm25:
            q_tokens = query.lower().split()
            scores = self.bm25.get_scores(q_tokens)
            sorted_indices = sorted(range(len(scores)), key=lambda i: scores[i], reverse=True)
            bm25_results = [self.indexed_chunks[i]["id"] for i in sorted_indices[:top_k] if scores[i] > 0]

        # 3. Reciprocal Rank Fusion (RRF) with k = 60
        RRF_K = 60
        rrf_scores = {}

        for rank, cid in enumerate(vector_results):
            rrf_scores[cid] = rrf_scores.get(cid, 0.0) + (1.0 / (RRF_K + rank + 1))

        for rank, cid in enumerate(bm25_results):
            rrf_scores[cid] = rrf_scores.get(cid, 0.0) + (1.0 / (RRF_K + rank + 1))

        chunk_lookup = {c["id"]: c for c in self.indexed_chunks}
        sorted_cids = sorted(rrf_scores.keys(), key=lambda x: rrf_scores[x], reverse=True)

        merged = []
        for cid in sorted_cids[:top_k]:
            if cid in chunk_lookup:
                item = dict(chunk_lookup[cid])
                item["rrf_score"] = rrf_scores[cid]
                merged.append(item)

        return merged

retriever = HybridRetriever()
