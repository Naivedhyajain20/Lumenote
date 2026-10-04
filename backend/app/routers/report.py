from fastapi import APIRouter, Depends, Response
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.db import get_db
from app.models import Document, Message, Conflict, Note
from app.report.builder import generate_markdown_report, generate_pdf_report

router = APIRouter(prefix="/report", tags=["report"])

class ReportRequest(BaseModel):
    format: str = "pdf"  # pdf | md
    case_title: str = "Orion Interiors vs Northwind Supplies Dispute"

@router.post("")
def generate_report(req: ReportRequest, db: Session = Depends(get_db)):
    docs = db.query(Document).all()
    messages = db.query(Message).all()
    conflicts = db.query(Conflict).all()
    notes = db.query(Note).all()

    doc_dicts = [
        {
            "filename": d.filename,
            "doc_type": d.doc_type,
            "reliability_score": d.reliability_score,
            "ocr_quality": d.ocr_quality,
            "authority_level": d.authority_level
        }
        for d in docs
    ]

    msg_dicts = []
    for m in messages:
        msg_dicts.append({
            "question": m.question,
            "answer": m.answer,
            "confidence": m.confidence,
            "confidence_band": m.confidence_band,
            "verified_claims_count": m.verified_claims_count,
            "total_claims_count": m.total_claims_count,
            "citations": [
                {
                    "citation_label": c.citation_label,
                    "quote": c.quote,
                    "page": c.page,
                    "doc_name": c.doc_name
                }
                for c in m.citations
            ]
        })

    conf_dicts = [
        {
            "topic": c.topic,
            "side_a_doc": c.side_a_doc,
            "side_a_value": c.side_a_value,
            "side_b_doc": c.side_b_doc,
            "side_b_value": c.side_b_value,
            "severity": c.severity,
            "explanation": c.explanation
        }
        for c in conflicts
    ]

    note_dicts = [
        {
            "text": n.text,
            "topic": n.topic,
            "pinned": n.pinned
        }
        for n in notes
    ]

    if req.format.lower() == "md" or req.format.lower() == "markdown":
        md_text = generate_markdown_report(req.case_title, doc_dicts, msg_dicts, conf_dicts, note_dicts)
        return Response(
            content=md_text,
            media_type="text/markdown",
            headers={"Content-Disposition": f"attachment; filename=investigation_report.md"}
        )
    else:
        pdf_bytes = generate_pdf_report(req.case_title, doc_dicts, msg_dicts, conf_dicts, note_dicts)
        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={"Content-Disposition": f"attachment; filename=investigation_report.pdf"}
        )
