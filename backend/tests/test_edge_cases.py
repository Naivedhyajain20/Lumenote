import sys
from pathlib import Path
import pytest
from fastapi import HTTPException

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.db import SessionLocal, engine, Base
import app.models
from app.routers.documents import process_file_bytes
from app.routers.ask import ask_question, AskRequest
from app.llm.client import clean_json_text

def setup_module():
    Base.metadata.create_all(bind=engine)

def test_empty_upload_rejected():
    db = SessionLocal()
    try:
        with pytest.raises(HTTPException) as excinfo:
            process_file_bytes(db, "empty.pdf", b"")
        assert excinfo.value.status_code == 400
        assert "zero-byte" in excinfo.value.detail.lower()
    finally:
        db.close()

def test_unsupported_file_type():
    db = SessionLocal()
    try:
        with pytest.raises(HTTPException) as excinfo:
            process_file_bytes(db, "malicious.exe", b"MZ\x90\x00\x03\x00\x00\x00")
        assert excinfo.value.status_code == 400
        assert "unsupported" in excinfo.value.detail.lower()
    finally:
        db.close()

def test_json_cleaner_resilience():
    # Markdown wrapped json
    raw = "```json\n{\"topic\": \"test\", \"status\": \"AGREE\"}\n```"
    assert clean_json_text(raw) == "{\"topic\": \"test\", \"status\": \"AGREE\"}"

    # Preamble text before json
    raw2 = "Sure, here is your JSON output:\n{\"result\": true}\nHope this helps!"
    assert clean_json_text(raw2) == "{\"result\": true}"

def test_false_fact_question_abstention():
    db = SessionLocal()
    try:
        req = AskRequest(question="Why did the contract include a warranty clause?")
        res = ask_question(req, db=db)
        # Should correct the premise or abstain due to lack of warranty
        assert res["abstained"] == True or "no warranty" in res["answer"].lower()
    finally:
        db.close()
