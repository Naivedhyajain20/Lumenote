from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db import get_db
from app.models import Conflict, Document, Fact
from app.intelligence.crosscheck import find_deterministic_conflicts

router = APIRouter(prefix="/conflicts", tags=["conflicts"])

@router.get("")
def get_case_conflicts(db: Session = Depends(get_db)):
    """
    Returns all case conflicts and computes a pairwise contradiction matrix across documents.
    """
    db_conflicts = db.query(Conflict).all()
    docs = db.query(Document).filter(Document.status == "ready").all()
    doc_names = [d.filename for d in docs]

    # Also compute fresh deterministic conflicts from stored facts
    facts = db.query(Fact).all()
    extracted_facts = []
    doc_map = {d.id: d.filename for d in docs}
    for f in facts:
        extracted_facts.append({
            "doc_name": doc_map.get(f.document_id, "Document"),
            "subject": f.subject,
            "predicate": f.predicate,
            "value": f.value,
            "normalized_value": f.normalized_value,
            "as_of_date": f.as_of_date,
            "chunk_id": f.chunk_id
        })

    computed_conflicts = find_deterministic_conflicts(extracted_facts)

    # Combine conflicts without duplication
    all_conflicts = []
    seen = set()

    for c in db_conflicts:
        key = (c.side_a_doc, c.side_b_doc, c.topic)
        if key not in seen:
            seen.add(key)
            all_conflicts.append({
                "id": c.id,
                "topic": c.topic,
                "side_a_doc": c.side_a_doc,
                "side_a_value": c.side_a_value,
                "side_b_doc": c.side_b_doc,
                "side_b_value": c.side_b_value,
                "severity": c.severity,
                "explanation": c.explanation,
                "resolution_suggestion": c.resolution_suggestion
            })

    for c in computed_conflicts:
        key = (c["side_a_doc"], c["side_b_doc"], c["topic"])
        if key not in seen:
            seen.add(key)
            all_conflicts.append({
                "id": str(len(all_conflicts) + 1),
                "topic": c["topic"],
                "side_a_doc": c["side_a_doc"],
                "side_a_value": c["side_a_value"],
                "side_b_doc": c["side_b_doc"],
                "side_b_value": c["side_b_value"],
                "severity": c["severity"],
                "explanation": c["explanation"],
                "resolution_suggestion": c.get("resolution_suggestion")
            })

    # Build contradiction matrix: doc_a -> doc_b -> conflict list
    matrix = {}
    for d1 in doc_names:
        matrix[d1] = {}
        for d2 in doc_names:
            matrix[d1][d2] = []

    for c in all_conflicts:
        d1 = c["side_a_doc"]
        d2 = c["side_b_doc"]
        if d1 in matrix and d2 in matrix[d1]:
            matrix[d1][d2].append(c)
        if d2 in matrix and d1 in matrix[d2]:
            matrix[d2][d1].append(c)

    return {
        "conflicts": all_conflicts,
        "matrix": matrix,
        "document_names": doc_names,
        "total_conflicts": len(all_conflicts)
    }
