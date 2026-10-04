import sys
from pathlib import Path

# Add backend to path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.db import SessionLocal, engine, Base
import app.models  # ensure models are registered
from app.routers.documents import load_demo_dataset, list_documents
from app.routers.ask import ask_question, AskRequest

def test_full_flow():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        print("1. Loading demo dataset...")
        res = load_demo_dataset(db=db)
        print(f"Loaded {res['loaded_count']} documents.")
        assert res["loaded_count"] == 6, f"Expected 6 documents, got {res['loaded_count']}"

        print("\n2. Checking documents list...")
        docs = list_documents(db=db)
        for d in docs:
            print(f"- {d['filename']}: status={d['status']}, trust={d['reliability_score']}, ocr_qual={d['ocr_quality']}")
            assert d["status"] == "ready", f"Doc {d['filename']} not ready"

        print("\n3. Testing Scripted Question 1: Total contract value")
        q1 = ask_question(AskRequest(question="What is the total contract value?"), db=db)
        print("Answer 1:", q1["answer"])
        print("Confidence 1:", q1["confidence"]["band"], q1["confidence"]["score"])
        assert "5,00,000" in q1["answer"] or "5,90,000" in q1["answer"]
        assert q1["confidence"]["band"] in ["HIGH", "MEDIUM"]

        print("\n4. Testing Scripted Question 2: Delivery conflict")
        q2 = ask_question(AskRequest(question="When was the furniture delivered?"), db=db)
        print("Answer 2:", q2["answer"])
        print("Conflicts found:", len(q2["conflicts"]))
        assert len(q2["conflicts"]) > 0 or "disagree" in q2["answer"].lower() or "conflict" in q2["answer"].lower()

        print("\n5. Testing Scripted Question 3: Advance paid conflict")
        q3 = ask_question(AskRequest(question="How much advance was paid?"), db=db)
        print("Answer 3:", q3["answer"])
        print("Conflicts found:", len(q3["conflicts"]))
        assert "2,50,000" in q3["answer"] or "2,00,000" in q3["answer"]

        print("\n6. Testing Scripted Question 4: Warranty period (Unanswerable/Abstain)")
        q4 = ask_question(AskRequest(question="What is the warranty period?"), db=db)
        print("Answer 4:", q4["answer"])
        print("Abstained:", q4["abstained"])
        assert q4["abstained"] == True

        print("\nAll core tests passed successfully!")
    finally:
        db.close()

if __name__ == "__main__":
    test_full_flow()
