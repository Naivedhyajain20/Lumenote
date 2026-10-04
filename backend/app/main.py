import os
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from app.config import settings
from app.db import engine, Base, get_db
from app.models import Message, Chunk, Document
from app.llm.client import llm_client

# Routers
from app.routers.documents import router as documents_router
from app.routers.ask import router as ask_router
from app.routers.conflicts import router as conflicts_router
from app.routers.entities import router as entities_router
from app.routers.timeline import router as timeline_router
from app.routers.notes import router as notes_router
from app.routers.report import router as report_router
from app.routers.eval import router as eval_router
from app.routers.predict import router as predict_router

# Create tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Lumenote Core & Predictive Intelligence API",
    description="Dual Platform: ALG-AI-02 Document Forensic Engine & ALG-DATA-02 Predictive Maintenance Engine",
    version="2.0.0"
)

# Enable CORS for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount all routers
app.include_router(documents_router)
app.include_router(ask_router)
app.include_router(conflicts_router)
app.include_router(entities_router)
app.include_router(timeline_router)
app.include_router(notes_router)
app.include_router(report_router)
app.include_router(eval_router)
app.include_router(predict_router)

@app.get("/health")
def health_check():
    return {
        "status": "ok",
        "provider": settings.LLM_PROVIDER,
        "model": settings.LLM_MODEL,
        "embedding_model": settings.EMBEDDING_MODEL,
        "rerank_model": settings.RERANK_MODEL,
        "tesseract_ocr": True
    }

@app.get("/health/llm-test")
def test_llm():
    response = llm_client.call_raw(
        system_prompt="You are a test assistant.",
        user_prompt="Say 'INVESTIGATOR_READY'"
    )
    return {"status": "ok", "response": response.strip()}

@app.get("/audit/{message_id}")
def get_audit_trail(message_id: str, db: Session = Depends(get_db)):
    msg = db.query(Message).filter(Message.id == message_id).first()
    if not msg:
        raise HTTPException(status_code=404, detail="Message not found")

    citations = [
        {
            "label": c.citation_label,
            "doc_name": c.doc_name,
            "page": c.page,
            "quote": c.quote,
            "chunk_id": c.chunk_id
        }
        for c in msg.citations
    ]

    return {
        "message_id": msg.id,
        "question": msg.question,
        "model": settings.LLM_MODEL,
        "provider": settings.LLM_PROVIDER,
        "prompt_version": "1.0",
        "confidence_score": msg.confidence,
        "confidence_band": msg.confidence_band,
        "abstained": msg.abstained,
        "citations": citations,
        "verified_claims": f"{msg.verified_claims_count} of {msg.total_claims_count}"
    }
