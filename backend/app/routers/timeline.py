from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db import get_db
from app.models import Fact, Conflict, Document
from app.extraction.timeline import build_timeline_events

router = APIRouter(prefix="/timeline", tags=["timeline"])

@router.get("")
def get_timeline(db: Session = Depends(get_db)):
    facts = db.query(Fact).all()
    conflicts = db.query(Conflict).all()
    docs = {d.id: d.filename for d in db.query(Document).all()}

    fact_dicts = [
        {
            "doc_name": docs.get(f.document_id, "Document"),
            "subject": f.subject,
            "predicate": f.predicate,
            "value": f.value,
            "normalized_value": f.normalized_value,
            "as_of_date": f.as_of_date
        }
        for f in facts
    ]

    conflict_dicts = [
        {
            "topic": c.topic,
            "side_a_value": c.side_a_value,
            "side_b_value": c.side_b_value
        }
        for c in conflicts
    ]

    events = build_timeline_events(fact_dicts, conflict_dicts)
    return {"events": events, "total_events": len(events)}
