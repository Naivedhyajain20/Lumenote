from typing import Optional
from pydantic import BaseModel
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db import get_db
from app.models import Note

router = APIRouter(prefix="/notes", tags=["notes"])

class CreateNoteRequest(BaseModel):
    text: str
    message_id: Optional[str] = None
    topic: Optional[str] = "General"
    pinned: Optional[bool] = False

class UpdateNoteRequest(BaseModel):
    text: Optional[str] = None
    pinned: Optional[bool] = None
    topic: Optional[str] = None

@router.get("")
def list_notes(db: Session = Depends(get_db)):
    notes = db.query(Note).order_by(Note.pinned.desc(), Note.created_at.desc()).all()
    return [
        {
            "id": n.id,
            "message_id": n.message_id,
            "text": n.text,
            "topic": n.topic,
            "pinned": n.pinned,
            "created_at": n.created_at.isoformat()
        }
        for n in notes
    ]

@router.post("")
def create_note(req: CreateNoteRequest, db: Session = Depends(get_db)):
    note = Note(
        text=req.text,
        message_id=req.message_id,
        topic=req.topic or "General",
        pinned=req.pinned or False
    )
    db.add(note)
    db.commit()
    db.refresh(note)
    return {
        "id": note.id,
        "text": note.text,
        "topic": note.topic,
        "pinned": note.pinned,
        "created_at": note.created_at.isoformat()
    }

@router.patch("/{note_id}")
def update_note(note_id: str, req: UpdateNoteRequest, db: Session = Depends(get_db)):
    note = db.query(Note).filter(Note.id == note_id).first()
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    if req.text is not None:
        note.text = req.text
    if req.pinned is not None:
        note.pinned = req.pinned
    if req.topic is not None:
        note.topic = req.topic
    db.commit()
    return {"status": "updated", "id": note.id, "pinned": note.pinned}

@router.delete("/{note_id}")
def delete_note(note_id: str, db: Session = Depends(get_db)):
    note = db.query(Note).filter(Note.id == note_id).first()
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    db.delete(note)
    db.commit()
    return {"status": "deleted"}
