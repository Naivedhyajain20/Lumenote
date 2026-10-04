import os
import shutil
from pathlib import Path
from typing import List
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.db import get_db
from app.models import Document, Chunk, Entity, Fact
from app.config import settings
from app.ingestion.detect import detect_file_type, compute_sha256
from app.ingestion.pdf import extract_pdf_pages
from app.ingestion.docx import extract_docx_content, extract_plain_text
from app.ingestion.ocr import perform_ocr_on_image
from app.ingestion.chunker import create_chunks_for_document
from app.ingestion.reliability import compute_document_reliability
from app.extraction.entities import extract_entities_from_text
from app.intelligence.crosscheck import extract_structured_facts_from_chunk
from app.intelligence.retrieve import retriever

router = APIRouter(prefix="/documents", tags=["documents"])

SUPPORTED_TYPES = ["pdf", "docx", "txt", "md", "jpg", "png", "tiff"]

def process_file_bytes(db: Session, filename: str, file_bytes: bytes) -> Document:
    # 1. Validation & Magic byte detection
    if len(file_bytes) == 0:
        raise HTTPException(status_code=400, detail="Cannot upload empty (zero-byte) file.")
    if len(file_bytes) > settings.MAX_FILE_MB * 1024 * 1024:
        raise HTTPException(status_code=400, detail=f"File exceeds maximum size of {settings.MAX_FILE_MB}MB.")

    file_type, _ = detect_file_type(filename, file_bytes)
    if file_type not in SUPPORTED_TYPES:
        raise HTTPException(status_code=400, detail=f"Unsupported file type: '{file_type}'. Supported: {', '.join(SUPPORTED_TYPES)}")

    sha256 = compute_sha256(file_bytes)
    existing = db.query(Document).filter(Document.sha256 == sha256).first()
    if existing:
        return existing

    # Save file to disk
    file_id = str(os.urandom(16).hex())
    safe_name = f"{file_id}_{Path(filename).name}"
    save_path = Path(settings.UPLOAD_DIR) / safe_name
    with open(save_path, "wb") as f:
        f.write(file_bytes)

    # 2. Extract content & calculate OCR quality
    pages_or_sections = []
    ocr_quality = 1.0
    is_ocr = False
    page_count = 1

    try:
        if file_type == "pdf":
            pdf_pages = extract_pdf_pages(file_bytes)
            page_count = max(1, len(pdf_pages))
            pages_or_sections = pdf_pages
            ocr_confs = [p["ocr_confidence"] for p in pdf_pages if p.get("is_ocr")]
            if ocr_confs:
                is_ocr = True
                ocr_quality = sum(ocr_confs) / len(ocr_confs)
        elif file_type in ["jpg", "png", "tiff"]:
            text, boxes, conf = perform_ocr_on_image(file_bytes)
            pages_or_sections = [{
                "page_number": 1,
                "text": text,
                "blocks": boxes,
                "is_ocr": True,
                "ocr_confidence": conf
            }]
            is_ocr = True
            ocr_quality = conf
        elif file_type == "docx":
            pages_or_sections = extract_docx_content(file_bytes)
        elif file_type in ["txt", "md"]:
            pages_or_sections = extract_plain_text(file_bytes.decode("utf-8", errors="ignore"))
    except Exception as e:
        doc = Document(
            filename=filename,
            file_type=file_type,
            sha256=sha256,
            file_path=str(save_path),
            status="failed",
            error_message=f"Extraction failure: {str(e)}"
        )
        db.add(doc)
        db.commit()
        return doc

    # 3. Determine document type & trust score
    name_lower = filename.lower()
    doc_type = "other"
    if "contract" in name_lower or "agreement" in name_lower:
        doc_type = "contract"
    elif "invoice" in name_lower:
        doc_type = "invoice"
    elif "receipt" in name_lower:
        doc_type = "receipt"
    elif "email" in name_lower:
        doc_type = "email"
    elif "notes" in name_lower:
        doc_type = "meeting_notes"

    trust_info = compute_document_reliability(
        doc_type=doc_type,
        ocr_quality=ocr_quality,
        completeness=1.0,
        recency=0.9,
        is_ocr=is_ocr
    )

    doc = Document(
        filename=filename,
        file_type=file_type,
        sha256=sha256,
        page_count=page_count,
        doc_type=doc_type,
        authority_level=trust_info["authority"],
        ocr_quality=trust_info["ocr_quality"],
        completeness=trust_info["completeness"],
        recency=trust_info["recency"],
        reliability_score=trust_info["reliability_score"],
        file_path=str(save_path),
        status="ready"
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)

    # 4. Chunking
    chunks_data = create_chunks_for_document(
        doc_id=doc.id,
        doc_name=filename,
        pages_or_sections=pages_or_sections
    )

    db_chunks = []
    for cd in chunks_data:
        chunk_obj = Chunk(
            document_id=doc.id,
            page=cd["page"],
            page_end=cd["page_end"],
            section_title=cd["section_title"],
            text=cd["text"],
            char_start=cd["char_start"],
            char_end=cd["char_end"],
            bbox_json=cd["bbox_json"],
            token_count=cd["token_count"],
            is_ocr=cd["is_ocr"]
        )
        db.add(chunk_obj)
        db_chunks.append(chunk_obj)

    db.commit()

    # 5. Extract entities and structured facts
    for chunk in db_chunks:
        entities = extract_entities_from_text(chunk.text)
        for ent in entities:
            e_obj = Entity(
                document_id=doc.id,
                chunk_id=chunk.id,
                type=ent["type"],
                value=ent["value"],
                normalized_value=ent["normalized_value"]
            )
            db.add(e_obj)

        facts = extract_structured_facts_from_chunk(chunk.text, doc.filename)
        for f in facts:
            fact_obj = Fact(
                document_id=doc.id,
                chunk_id=chunk.id,
                subject=f["subject"],
                predicate=f["predicate"],
                value=f["value"],
                unit=f.get("unit"),
                normalized_value=f["normalized_value"],
                as_of_date=f.get("as_of_date")
            )
            db.add(fact_obj)

    db.commit()

    # 6. Index into Chroma & BM25
    indexable_chunks = []
    for chunk in db_chunks:
        indexable_chunks.append({
            "id": chunk.id,
            "document_id": doc.id,
            "doc_name": doc.filename,
            "page": chunk.page,
            "section_title": chunk.section_title,
            "text": chunk.text,
            "embedding_text": f"Document: {doc.filename} | Section: {chunk.section_title} | Page {chunk.page}\n\n{chunk.text}",
            "is_ocr": chunk.is_ocr
        })
    retriever.upsert_chunks(indexable_chunks)

    return doc

@router.post("")
def upload_documents(files: List[UploadFile] = File(...), db: Session = Depends(get_db)):
    results = []
    for file in files:
        file_bytes = file.file.read()
        doc = process_file_bytes(db, file.filename, file_bytes)
        results.append({
            "id": doc.id,
            "filename": doc.filename,
            "status": doc.status,
            "doc_type": doc.doc_type,
            "reliability": doc.reliability_score,
            "ocr_quality": doc.ocr_quality
        })
    return results

@router.get("")
def list_documents(db: Session = Depends(get_db)):
    docs = db.query(Document).order_by(Document.uploaded_at.desc()).all()
    return [
        {
            "id": d.id,
            "filename": d.filename,
            "file_type": d.file_type,
            "status": d.status,
            "doc_type": d.doc_type,
            "page_count": d.page_count,
            "reliability_score": d.reliability_score,
            "ocr_quality": d.ocr_quality,
            "authority_level": d.authority_level,
            "error_message": d.error_message
        }
        for d in docs
    ]

@router.get("/{doc_id}/file")
def get_document_file(doc_id: str, db: Session = Depends(get_db)):
    doc = db.query(Document).filter(Document.id == doc_id).first()
    if not doc or not os.path.exists(doc.file_path):
        raise HTTPException(status_code=404, detail="Document file not found.")
    return FileResponse(doc.file_path, filename=doc.filename)

@router.get("/{doc_id}/chunks")
def get_document_chunks(doc_id: str, page: int = None, db: Session = Depends(get_db)):
    query = db.query(Chunk).filter(Chunk.document_id == doc_id)
    if page is not None:
        query = query.filter(Chunk.page == page)
    chunks = query.all()
    return [
        {
            "id": c.id,
            "page": c.page,
            "section_title": c.section_title,
            "text": c.text,
            "bbox_json": c.bbox_json,
            "is_ocr": c.is_ocr
        }
        for c in chunks
    ]

@router.delete("/{doc_id}")
def delete_document(doc_id: str, db: Session = Depends(get_db)):
    doc = db.query(Document).filter(Document.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found.")

    retriever.delete_document_chunks(doc_id)
    if os.path.exists(doc.file_path):
        try:
            os.remove(doc.file_path)
        except Exception:
            pass

    db.delete(doc)
    db.commit()
    return {"status": "success", "deleted_id": doc_id}

@router.post("/load-demo")
def load_demo_dataset(db: Session = Depends(get_db)):
    """Loads all 6 prepared demo documents in one click (Section 10.1)."""
    demo_files = [
        "1_Supply_Contract.pdf",
        "2_Invoice.jpg",
        "3_Email_Vendor.docx",
        "4_Email_Client.docx",
        "5_Meeting_Notes.txt",
        "6_Payment_Receipt.png"
    ]
    loaded = []
    for fname in demo_files:
        fpath = Path(settings.DEMO_DATA_DIR) / fname
        if fpath.exists():
            with open(fpath, "rb") as f:
                doc = process_file_bytes(db, fname, f.read())
                loaded.append({
                    "id": doc.id,
                    "filename": doc.filename,
                    "status": doc.status,
                    "reliability": doc.reliability_score
                })
    return {"loaded_count": len(loaded), "documents": loaded}
