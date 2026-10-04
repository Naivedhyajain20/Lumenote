import os
import sys
import json
import logging
from pathlib import Path
from typing import Dict, Any, List

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

EVAL_DIR = Path(__file__).resolve().parent

def evaluate_system() -> Dict[str, Any]:
    golden_path = EVAL_DIR / "golden_set.json"
    with open(golden_path, "r", encoding="utf-8") as f:
        cases = json.load(f)

    # Import test engine
    from app.db import SessionLocal
    from app.routers.ask import ask_question, AskRequest

    db = SessionLocal()
    total = len(cases)
    correct_answers = 0
    correct_conflicts = 0
    correct_abstentions = 0
    valid_citations = 0
    total_citations_checked = 0

    results_detail = []

    try:
        for c in cases:
            req = AskRequest(question=c["question"])
            try:
                res = ask_question(req, db=db)
                answer = res["answer"]
                abstained = res["abstained"]
                conflicts = res["conflicts"]
                citations = res["citations"]

                # 1. Abstention accuracy
                abstain_correct = (abstained == c["expect_abstain"])
                if abstain_correct:
                    correct_abstentions += 1

                # 2. Conflict recall & precision
                has_conflict = len(conflicts) > 0
                conflict_correct = (has_conflict == c["expect_conflict"])
                if conflict_correct:
                    correct_conflicts += 1

                # 3. Answer accuracy
                if c["expect_abstain"]:
                    answer_correct = ("INSUFFICIENT_EVIDENCE" in answer or "not contain" in answer)
                else:
                    answer_correct = any(fact.lower() in answer.lower() for fact in c["expected_answer_facts"])
                if answer_correct:
                    correct_answers += 1

                # 4. Citation precision
                if citations:
                    total_citations_checked += len(citations)
                    valid_citations += sum(1 for cit in citations if len(cit.get("quote", "")) > 10)

                results_detail.append({
                    "id": c["id"],
                    "question": c["question"],
                    "passed": answer_correct and conflict_correct and abstain_correct,
                    "answer_correct": answer_correct,
                    "conflict_correct": conflict_correct,
                    "abstain_correct": abstain_correct
                })
            except Exception as e:
                results_detail.append({
                    "id": c["id"],
                    "question": c["question"],
                    "passed": False,
                    "error": str(e)
                })
    finally:
        db.close()

    answer_acc = round(correct_answers / total, 4) if total else 0.0
    abstain_acc = round(correct_abstentions / total, 4) if total else 0.0
    conflict_acc = round(correct_conflicts / total, 4) if total else 0.0
    citation_prec = round(valid_citations / max(1, total_citations_checked), 4)

    summary = {
        "total_evaluated": total,
        "answer_accuracy": answer_acc,
        "abstention_accuracy": abstain_acc,
        "conflict_accuracy": conflict_acc,
        "citation_precision": citation_prec,
        "composite_score": round((answer_acc + abstain_acc + conflict_acc + citation_prec) / 4.0, 4),
        "details": results_detail
    }

    # Save to disk as latest eval
    with open(EVAL_DIR / "latest_results.json", "w", encoding="utf-8") as out:
        json.dump(summary, out, indent=2)

    return summary

if __name__ == "__main__":
    res = evaluate_system()
    print("Evaluation Complete:")
    print(f"Answer Accuracy: {res['answer_accuracy']*100:.1f}%")
    print(f"Abstention Accuracy: {res['abstention_accuracy']*100:.1f}%")
    print(f"Conflict Accuracy: {res['conflict_accuracy']*100:.1f}%")
    print(f"Citation Precision: {res['citation_precision']*100:.1f}%")
