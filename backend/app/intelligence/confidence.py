from typing import Dict, Any, List
from app.config import settings

def compute_answer_confidence(
    top_rerank_score: float,
    verified_claims_ratio: float,
    conflict_found: bool,
    doc_reliabilities: List[float],
    abstained: bool = False
) -> Dict[str, Any]:
    """
    Computes answer confidence score and explanatory signals according to Section 7.8 formula:
    confidence = 0.40 * retrieval_strength
               + 0.25 * claim_support
               + 0.20 * source_agreement
               + 0.15 * doc_reliability
    if conflict_found: confidence -= 0.25
    bands: >= 0.75 HIGH | 0.50 - 0.74 MEDIUM | < 0.50 LOW
    """
    if abstained:
        return {
            "score": 0.10,
            "band": "LOW",
            "signals": {
                "retrieval_strength": round(top_rerank_score, 2),
                "claim_support": 0.0,
                "source_agreement": 0.0,
                "doc_reliability": 0.0,
                "conflict_penalty": 0.0
            },
            "explanation": "Abstained due to insufficient evidence in the provided documents."
        }

    retrieval_strength = max(0.0, min(1.0, top_rerank_score))
    claim_support = max(0.0, min(1.0, verified_claims_ratio))
    source_agreement = 0.4 if conflict_found else 1.0
    
    mean_doc_rel = (sum(doc_reliabilities) / len(doc_reliabilities)) if doc_reliabilities else 0.8
    mean_doc_rel = max(0.0, min(1.0, mean_doc_rel))

    base_score = (
        0.40 * retrieval_strength +
        0.25 * claim_support +
        0.20 * source_agreement +
        0.15 * mean_doc_rel
    )

    penalty = 0.25 if conflict_found else 0.0
    final_score = max(0.05, min(1.0, base_score - penalty))
    final_score = round(final_score, 2)

    if final_score >= 0.75:
        band = "HIGH"
    elif final_score >= 0.50:
        band = "MEDIUM"
    else:
        band = "LOW"

    return {
        "score": final_score,
        "band": band,
        "signals": {
            "retrieval_strength": round(retrieval_strength, 2),
            "claim_support": round(claim_support, 2),
            "source_agreement": round(source_agreement, 2),
            "doc_reliability": round(mean_doc_rel, 2),
            "conflict_penalty": round(penalty, 2)
        },
        "explanation": (
            f"Retrieval strength: {int(retrieval_strength*100)}%, Claim verification: {int(claim_support*100)}%, "
            f"Source agreement: {int(source_agreement*100)}%, Document trust: {int(mean_doc_rel*100)}%"
            + (f" with a -25% penalty due to detected document conflict." if conflict_found else ".")
        )
    }
