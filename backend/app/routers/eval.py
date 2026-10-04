import os
import json
from pathlib import Path
from fastapi import APIRouter
from eval.run_eval import evaluate_system, EVAL_DIR

router = APIRouter(prefix="/eval", tags=["evaluation"])

@router.post("/run")
def run_evaluation():
    results = evaluate_system()
    return results

@router.get("/latest")
def get_latest_evaluation():
    latest_path = EVAL_DIR / "latest_results.json"
    if latest_path.exists():
        with open(latest_path, "r", encoding="utf-8") as f:
            return json.load(f)
    # If not yet run, run once
    return evaluate_system()
