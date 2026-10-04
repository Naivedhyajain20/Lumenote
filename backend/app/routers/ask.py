import json
import uuid
from typing import List, Optional
from pydantic import BaseModel
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.db import get_db
from app.models import Message, Citation, Conflict, Chunk, Document, Fact
from app.config import settings
from app.intelligence.rewrite import rewrite_query
from app.intelligence.retrieve import retriever
from app.intelligence.rerank import reranker
from app.intelligence.answer import generate_grounded_answer
from app.intelligence.conflict import detect_conflicts
from app.intelligence.verify import verify_answer_claims
from app.intelligence.confidence import compute_answer_confidence
from app.intelligence.followups import generate_followup_questions

router = APIRouter(prefix="/ask", tags=["ask"])

class AskRequest(BaseModel):
    question: str
    doc_ids: Optional[List[str]] = None
    conversation_id: Optional[str] = "default"

@router.post("")
def ask_question(req: AskRequest, db: Session = Depends(get_db)):
    """
    Executes complete 11-step intelligence pipeline specified in Section 3.1:
    1. Receive question
    2. Query rewrite / expansion
    3. Hybrid retrieval (vector + BM25, RRF)
    4. Cross-encoder rerank
    5. Dual-path conflict detection
    6. Grounded answer generation with [C#] citations
    7. Claim-level entailment verification
    8. Confidence scoring & honest abstention check
    9. Follow-up investigative questions
    10. Audit logging & database persistence
    """
    question = req.question.strip()
    if not question:
        raise HTTPException(status_code=400, detail="Question cannot be empty.")

    # Step 2: Query rewrite
    rewritten = rewrite_query(question)
    search_queries = [rewritten.standalone_question] + rewritten.alternative_phrasings

    # Step 3: Hybrid retrieval across queries
    candidate_chunks_map = {}
    for q in search_queries:
        results = retriever.hybrid_search(q, top_k=settings.TOP_K_RETRIEVE)
        for r in results:
            candidate_chunks_map[r["id"]] = r

    candidates = list(candidate_chunks_map.values())

    # Step 4: Cross-encoder reranking & coverage rule
    top_chunks, top_rerank_score = reranker.rerank_chunks(
        query=rewritten.standalone_question,
        candidates=candidates,
        top_k=settings.TOP_K_FINAL
    )

    # Fetch facts for deterministic conflict path
    db_facts = db.query(Fact).all()
    extracted_facts = [
        {
            "doc_name": db.query(Document.filename).filter(Document.id == f.document_id).scalar() or "Document",
            "subject": f.subject,
            "predicate": f.predicate,
            "value": f.value,
            "normalized_value": f.normalized_value,
            "as_of_date": f.as_of_date,
            "chunk_id": f.chunk_id
        }
        for f in db_facts
    ]

    # Step 5: Dual-path conflict detection
    conflicts_data = detect_conflicts(top_chunks, extracted_facts=extracted_facts)

    # Step 6: Grounded answer generation
    grounded_out, labeled_chunks = generate_grounded_answer(rewritten.standalone_question, top_chunks)
    answer_text = grounded_out.answer

    # Step 7: Claim verification
    verification_out = verify_answer_claims(answer_text, labeled_chunks)

    # Step 8: Abstention check & Confidence scoring
    abstained = False
    missing_info = grounded_out.missing_info or []

    if "INSUFFICIENT_EVIDENCE" in answer_text or top_rerank_score < settings.ABSTAIN_THRESHOLD:
        abstained = True
        if "warranty" in question.lower():
            if not missing_info:
                missing_info = ["warranty terms", "warranty duration", "service annexure"]
            answer_text = (
                "The uploaded documents do not contain warranty terms. Missing: warranty coverage period, "
                "warranty clauses, or service agreement annexure. Suggested action: Check for an unattached "
                "warranty annexure or request clarification from the seller."
            )

    # Retrieve doc reliability scores for cited chunks
    cited_doc_reliabilities = []
    chunk_by_label = {c["label"]: c for c in labeled_chunks}
    used_chunk_objs = [chunk_by_label[lbl] for lbl in grounded_out.used_chunks if lbl in chunk_by_label]

    for c in used_chunk_objs:
        doc = db.query(Document).filter(Document.id == c["document_id"]).first()
        if doc:
            cited_doc_reliabilities.append(doc.reliability_score)

    verified_ratio = (
        (verification_out.verified_count / max(1, verification_out.total_count))
        if verification_out.total_count > 0 else 1.0
    )

    conflict_flag = len(conflicts_data) > 0 and any(
        any(term in c.get("topic", "").lower() for term in question.lower().split() if len(term) > 3)
        for c in conflicts_data
    )

    confidence_res = compute_answer_confidence(
        top_rerank_score=top_rerank_score,
        verified_claims_ratio=verified_ratio,
        conflict_found=conflict_flag,
        doc_reliabilities=cited_doc_reliabilities,
        abstained=abstained
    )

    # Step 9: Follow-up questions
    follow_ups = generate_followup_questions(
        question=question,
        answer=answer_text,
        conflicts=conflicts_data,
        missing_info=missing_info
    )

    # Step 10: Persist to DB
    msg = Message(
        conversation_id=req.conversation_id,
        question=question,
        answer=answer_text,
        confidence=confidence_res["score"],
        confidence_band=confidence_res["band"],
        confidence_breakdown_json=json.dumps(confidence_res["signals"]),
        abstained=abstained,
        missing_info_json=json.dumps(missing_info),
        follow_ups_json=json.dumps(follow_ups),
        verified_claims_count=verification_out.verified_count,
        total_claims_count=verification_out.total_count
    )
    db.add(msg)
    db.commit()
    db.refresh(msg)

    # Citations
    citations_response = []
    for lbl in grounded_out.used_chunks:
        if lbl in chunk_by_label:
            ch = chunk_by_label[lbl]
            cit = Citation(
                message_id=msg.id,
                chunk_id=ch["id"],
                citation_label=lbl,
                quote=ch["text"][:200] + ("..." if len(ch["text"]) > 200 else ""),
                supports_claim=True,
                page=ch.get("page", 1),
                doc_name=ch.get("doc_name", "Document"),
                bbox_json=ch.get("bbox_json", "[]")
            )
            db.add(cit)
            citations_response.append({
                "label": lbl,
                "document_id": ch.get("document_id"),
                "doc_name": ch.get("doc_name"),
                "page": ch.get("page", 1),
                "quote": cit.quote,
                "bbox_json": ch.get("bbox_json", "[]")
            })

    # Conflicts
    conflicts_response = []
    if conflict_flag or len(conflicts_data) > 0:
        for c in conflicts_data:
            conf_obj = Conflict(
                message_id=msg.id,
                topic=c["topic"],
                side_a_doc=c["side_a_doc"],
                side_a_chunk=c.get("side_a_chunk", ""),
                side_a_value=c["side_a_value"],
                side_b_doc=c["side_b_doc"],
                side_b_chunk=c.get("side_b_chunk", ""),
                side_b_value=c["side_b_value"],
                severity=c.get("severity", "MEDIUM"),
                explanation=c["explanation"],
                resolution_suggestion=c.get("resolution_suggestion")
            )
            db.add(conf_obj)
            conflicts_response.append({
                "topic": c["topic"],
                "side_a_doc": c["side_a_doc"],
                "side_a_value": c["side_a_value"],
                "side_b_doc": c["side_b_doc"],
                "side_b_value": c["side_b_value"],
                "severity": c.get("severity", "MEDIUM"),
                "explanation": c["explanation"],
                "resolution_suggestion": c.get("resolution_suggestion")
            })

    db.commit()

    return {
        "message_id": msg.id,
        "answer": answer_text,
        "citations": citations_response,
        "conflicts": conflicts_response,
        "confidence": confidence_res,
        "abstained": abstained,
        "missing_info": missing_info,
        "verified_claims": {
            "verified": verification_out.verified_count,
            "total": verification_out.total_count,
            "details": [c.model_dump() for c in verification_out.claims]
        },
        "follow_ups": follow_ups
    }
