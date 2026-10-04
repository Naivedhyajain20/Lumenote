import csv
import io
from typing import List, Optional
from fastapi import APIRouter, HTTPException, UploadFile, File
from pydantic import BaseModel, Field
from app.ml.predictive_engine import predictive_engine

router = APIRouter(prefix="/api/predict", tags=["Predict What Happens Next (ALG-DATA-02)"])

class TelemetryInput(BaseModel):
    machine_type: str = Field(default="L", description="Machine quality variant: L, M, or H")
    air_temperature_k: float = Field(default=300.0, description="Air temperature in Kelvin (295 - 305 K)")
    process_temperature_k: float = Field(default=310.0, description="Process temperature in Kelvin (305 - 315 K)")
    rotational_speed_rpm: float = Field(default=1500.0, description="Rotational speed in RPM (1100 - 2900 RPM)")
    torque_nm: float = Field(default=40.0, description="Torque in Newton-meters (3.8 - 77.0 Nm)")
    tool_wear_min: float = Field(default=30.0, description="Tool wear time in minutes (0 - 255 min)")

class BatchPredictInput(BaseModel):
    cases: List[TelemetryInput]

@router.get("/metrics")
def get_metrics():
    """Return model architecture, validation metrics on 2,000 unseen holdout samples, and feature importances."""
    return {
        "status": "success",
        "problem_statement": "ALG-DATA-02 — Predict What Happens Next",
        "dataset_name": "AI4I 2020 Predictive Maintenance Dataset",
        "dataset_source": "UCI Machine Learning Repository",
        "dataset_url": "https://archive.ics.uci.edu/dataset/601/ai4i+2020+predictive+maintenance+dataset",
        "model_architecture": "Physics-Augmented Multi-Output Ensemble (Random Forest + Domain Constraints)",
        "metrics": predictive_engine.metrics,
        "feature_importances": predictive_engine.feature_importances,
    }

@router.post("/telemetry")
def predict_telemetry(payload: TelemetryInput):
    """Predict what happens next from real-time operational sensor telemetry."""
    try:
        result = predictive_engine.predict_telemetry(
            machine_type=payload.machine_type,
            air_temp_k=payload.air_temperature_k,
            process_temp_k=payload.process_temperature_k,
            rotational_speed_rpm=payload.rotational_speed_rpm,
            torque_nm=payload.torque_nm,
            tool_wear_min=payload.tool_wear_min
        )
        return {
            "status": "success",
            "inputs": payload.model_dump(),
            "prediction": result
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/unseen-cases")
def get_unseen_cases():
    """Return curated holdout unseen cases from the AI4I test partition to test predictions."""
    return {
        "status": "success",
        "count": len(predictive_engine.holdout_test_cases),
        "cases": predictive_engine.holdout_test_cases
    }

@router.post("/batch")
def predict_batch(payload: BatchPredictInput):
    """Batch prediction on multiple unseen machine cases."""
    raw_cases = [c.model_dump() for c in payload.cases]
    results = predictive_engine.predict_batch(raw_cases)
    failures_detected = sum(1 for r in results if r["is_failure_predicted"])
    return {
        "status": "success",
        "total_cases": len(results),
        "failures_predicted": failures_detected,
        "safe_cases": len(results) - failures_detected,
        "results": results
    }

@router.post("/upload-csv")
async def upload_csv_and_predict(file: UploadFile = File(...)):
    """Upload unseen operational CSV file and predict failures and failure modes."""
    content = await file.read()
    decoded = content.decode("utf-8")
    reader = csv.DictReader(io.StringIO(decoded))
    cases = []
    for row in reader:
        try:
            cases.append({
                "type": row.get("Type", "L"),
                "air_temperature_k": float(row.get("Air temperature [K]", 300)),
                "process_temperature_k": float(row.get("Process temperature [K]", 310)),
                "rotational_speed_rpm": float(row.get("Rotational speed [rpm]", 1500)),
                "torque_nm": float(row.get("Torque [Nm]", 40)),
                "tool_wear_min": float(row.get("Tool wear [min]", 0)),
                "product_id": row.get("Product ID", "N/A"),
                "udi": row.get("UDI", "N/A"),
                "actual_failure": int(row.get("Machine failure", 0)) if "Machine failure" in row else None
            })
        except Exception:
            continue

    if not cases:
        raise HTTPException(status_code=400, detail="No valid sensor rows found in CSV.")

    batch_res = predictive_engine.predict_batch(cases[:100])  # score up to 100
    return {
        "status": "success",
        "total_processed": len(batch_res),
        "failures_predicted": sum(1 for r in batch_res if r["is_failure_predicted"]),
        "results": batch_res
    }
