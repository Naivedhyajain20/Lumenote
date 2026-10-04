from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.db import get_db
from app.models import Entity, Document, Chunk

router = APIRouter(prefix="/entities", tags=["entities"])

@router.get("")
def list_entities(q: Optional[str] = None, type: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(Entity)
    if q:
        query = query.filter(Entity.normalized_value.ilike(f"%{q}%"))
    if type:
        query = query.filter(Entity.type == type.upper())

    entities = query.all()
    
    # Group by normalized_value
    grouped = {}
    for e in entities:
        doc = db.query(Document).filter(Document.id == e.document_id).first()
        chunk = db.query(Chunk).filter(Chunk.id == e.chunk_id).first() if e.chunk_id else None
        
        name = e.normalized_value
        if name not in grouped:
            grouped[name] = {
                "name": name,
                "type": e.type,
                "occurrences": 0,
                "references": []
            }
        grouped[name]["occurrences"] += 1
        grouped[name]["references"].append({
            "doc_id": e.document_id,
            "doc_name": doc.filename if doc else "Document",
            "page": chunk.page if chunk else 1,
            "passage": chunk.text[:120] if chunk else ""
        })

    return sorted(list(grouped.values()), key=lambda x: x["occurrences"], reverse=True)
