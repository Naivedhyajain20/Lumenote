import sys
from pathlib import Path
import pytest

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.extraction.money import normalize_money
from app.extraction.dates import normalize_date
from app.ingestion.chunker import create_chunks_for_document
from app.intelligence.crosscheck import extract_structured_facts_from_chunk, find_deterministic_conflicts
from app.intelligence.confidence import compute_answer_confidence
from app.intelligence.retrieve import HybridRetriever

def test_money_normalizer():
    assert normalize_money("INR 5,00,000") == (500000, "INR")
    assert normalize_money("Rs 2,50,000") == (250000, "INR")
    assert normalize_money("5,90,000") == (590000, "INR")

def test_date_normalizer():
    assert normalize_date("10 Jan 2026") == "2026-01-10"
    assert normalize_date("20th Feb 2026") == "2026-02-20"
    assert normalize_date("2026-02-15") == "2026-02-15"

def test_chunker_boundaries():
    sample_text = "Clause 1.1: General terms.\n\nClause 1.2: Payment obligations amounting to INR 5,00,000."
    chunks = create_chunks_for_document(
        doc_id="test_doc",
        doc_name="contract.pdf",
        pages_or_sections=[{"page_number": 1, "text": sample_text}],
        chunk_size_tokens=350,
        overlap_tokens=60
    )
    assert len(chunks) >= 1
    assert "Document: contract.pdf" in chunks[0]["embedding_text"]
    assert "Page 1" in chunks[0]["embedding_text"]

def test_fact_crosscheck_deterministic_conflict():
    facts = [
        {
            "doc_name": "Contract.pdf",
            "subject": "delivery",
            "predicate": "completion_date",
            "value": "15 Feb 2026",
            "normalized_value": "2026-02-15"
        },
        {
            "doc_name": "Email_Vendor.docx",
            "subject": "delivery",
            "predicate": "completion_date",
            "value": "20 Feb 2026",
            "normalized_value": "2026-02-20"
        }
    ]
    conflicts = find_deterministic_conflicts(facts)
    assert len(conflicts) == 1
    assert conflicts[0]["severity"] == "HIGH"
    assert "Contract.pdf" in conflicts[0]["explanation"]
    assert "Email_Vendor.docx" in conflicts[0]["explanation"]

def test_confidence_formula():
    # High confidence with good agreement
    res_high = compute_answer_confidence(
        top_rerank_score=0.9,
        verified_claims_ratio=1.0,
        conflict_found=False,
        doc_reliabilities=[0.95],
        abstained=False
    )
    assert res_high["score"] >= 0.75
    assert res_high["band"] == "HIGH"

    # Penalty applied when conflict detected
    res_conf = compute_answer_confidence(
        top_rerank_score=0.9,
        verified_claims_ratio=1.0,
        conflict_found=True,
        doc_reliabilities=[0.95],
        abstained=False
    )
    assert res_conf["score"] < res_high["score"]
    assert res_conf["signals"]["conflict_penalty"] == 0.25

    # Abstention returns low confidence
    res_abstain = compute_answer_confidence(
        top_rerank_score=0.1,
        verified_claims_ratio=0.0,
        conflict_found=False,
        doc_reliabilities=[],
        abstained=True
    )
    assert res_abstain["band"] == "LOW"
