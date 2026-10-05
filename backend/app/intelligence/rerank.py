import re
import logging
from typing import List, Dict, Any, Tuple
from app.config import settings

logger = logging.getLogger("investigator.rerank")

class DocumentReranker:
    def __init__(self):
        self.cross_encoder = None
        self._model_initialized = False

    def _init_cross_encoder(self):
        if self._model_initialized:
            return
        self._model_initialized = True
        if getattr(settings, "LOW_MEMORY_MODE", False):
            logger.info("Low memory mode active (Render/container). Using lexical-semantic scoring fallback.")
            return
        try:
            import torch
            torch.set_num_threads(1)
            from sentence_transformers import CrossEncoder
            # Lightweight cross-encoder
            self.cross_encoder = CrossEncoder("cross-encoder/ms-marco-TinyBERT-L-2-v2")
            logger.info("CrossEncoder reranker loaded successfully.")
        except Exception as e:
            logger.warning(f"Could not load CrossEncoder: {e}. Using lexical-semantic scoring fallback.")

    def score_pairs(self, query: str, chunks: List[Dict[str, Any]]) -> List[float]:
        if not chunks:
            return []
        if not self._model_initialized:
            self._init_cross_encoder()

        q_words = set(w.lower() for w in query.split() if len(w) > 2)
        raw_scores = []

        if self.cross_encoder:
            try:
                pairs = [(query, c["text"]) for c in chunks]
                preds = self.cross_encoder.predict(pairs)
                raw_scores = [float(p) for p in preds]
            except Exception as e:
                logger.warning(f"Cross-encoder predict failed: {e}")

        if raw_scores:
            min_s = min(raw_scores)
            max_s = max(raw_scores)
            rng = max_s - min_s if max_s > min_s else 1.0
            
            calibrated = []
            for i, s in enumerate(raw_scores):
                c = chunks[i]
                c_text = c["text"].lower()
                # Keyword presence bonus
                overlap = sum(1 for w in q_words if w in c_text) / max(1, len(q_words))
                norm = (s - min_s) / rng
                combined = 0.6 * norm + 0.4 * overlap
                calibrated.append(round(max(0.1, min(1.0, combined)), 4))
            return calibrated

        # Fallback scoring combining RRF score and token overlap
        scores = []
        for c in chunks:
            text_words = set(c["text"].lower().split())
            overlap = len(q_words.intersection(text_words)) / max(1, len(q_words))
            rrf = c.get("rrf_score", 0.0) * 10
            combined = min(1.0, (overlap * 0.7) + (rrf * 0.3))
            scores.append(round(max(0.1, combined), 4))
        return scores

    def rerank_chunks(
        self,
        query: str,
        candidates: List[Dict[str, Any]],
        top_k: int = 8
    ) -> Tuple[List[Dict[str, Any]], float]:
        """
        Reranks candidate chunks, applies Coverage Rule, returns (top_chunks, top_rerank_score).
        Coverage Rule: If question mentions specific documents or compares them,
        force at least one chunk from each mentioned document into the final set.
        """
        if not candidates:
            return [], 0.0

        scores = self.score_pairs(query, candidates)
        for i, c in enumerate(candidates):
            c["rerank_score"] = scores[i]

        # Sort candidates descending by rerank score
        sorted_candidates = sorted(candidates, key=lambda x: x["rerank_score"], reverse=True)
        top_score = sorted_candidates[0]["rerank_score"] if sorted_candidates else 0.0

        # Coverage Rule check
        q_lower = query.lower()
        mentioned_docs = set()
        for c in candidates:
            doc_name = c.get("doc_name", "").lower()
            # Check if document name parts appear in question
            base_name = doc_name.split(".")[0].lower()
            if any(term in q_lower for term in base_name.split("_") if len(term) > 3):
                mentioned_docs.add(doc_name)

        if "compare" in q_lower or "conflict" in q_lower or "disagree" in q_lower:
            # Multi-document question: ensure multiple docs are represented
            selected = []
            seen_docs = set()
            # First pick best chunk per unique doc
            for c in sorted_candidates:
                d = c.get("doc_name")
                if d not in seen_docs:
                    selected.append(c)
                    seen_docs.add(d)
                if len(selected) >= top_k:
                    break
            # Fill remaining slots with next highest scoring
            for c in sorted_candidates:
                if len(selected) >= top_k:
                    break
                if c not in selected:
                    selected.append(c)
            return selected, top_score

        # Default: keep top_k
        return sorted_candidates[:top_k], top_score

reranker = DocumentReranker()
