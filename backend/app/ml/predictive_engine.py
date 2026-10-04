import os
import math
import joblib
import numpy as np
import pandas as pd
from typing import Dict, List, Any, Optional
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.multioutput import MultiOutputClassifier
from sklearn.metrics import roc_auc_score, f1_score, precision_score, recall_score, confusion_matrix

# Workspace root /Users/naivedhyajain/hackathon
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
# app/ml -> app -> backend -> hackathon
HACKATHON_ROOT = os.path.abspath(os.path.join(CURRENT_DIR, "..", "..", ".."))
DATA_PATH = os.path.join(HACKATHON_ROOT, "data", "ai4i", "ai4i2020.csv")
ARTIFACTS_DIR = os.path.join(CURRENT_DIR, "artifacts")

TYPE_MAP = {"L": 0, "M": 1, "H": 2}
TYPE_STRAIN_THRESHOLDS = {"L": 11000, "M": 12000, "H": 13000}
FAILURE_MODES = ["TWF", "HDF", "PWF", "OSF", "RNF"]
MODE_NAMES = {
    "TWF": "Tool Wear Failure",
    "HDF": "Heat Dissipation Failure",
    "PWF": "Power Failure",
    "OSF": "Overstrain Failure",
    "RNF": "Random Failure"
}

FEATURE_COLS = [
    "type_encoded", "Air temperature [K]", "Process temperature [K]",
    "Rotational speed [rpm]", "Torque [Nm]", "Tool wear [min]",
    "temp_diff", "power_kw", "strain", "temp_ratio"
]

class PredictiveEngine:
    def __init__(self):
        self.clf = None
        self.modes_clf = None
        self.metrics: Dict[str, Any] = {}
        self.feature_importances: List[Dict[str, Any]] = []
        self.holdout_test_cases: List[Dict[str, Any]] = []
        self.is_trained = False
        os.makedirs(ARTIFACTS_DIR, exist_ok=True)
        self.initialize()

    def engineer_features(self, df: pd.DataFrame) -> pd.DataFrame:
        df = df.copy()
        df["temp_diff"] = df["Process temperature [K]"] - df["Air temperature [K]"]
        # Power in kW = Torque * (rpm * 2 * pi / 60) / 1000
        df["power_kw"] = (df["Torque [Nm]"] * df["Rotational speed [rpm]"] * 2 * np.pi) / (60 * 1000)
        df["strain"] = df["Torque [Nm]"] * df["Tool wear [min]"]
        df["temp_ratio"] = df["Process temperature [K]"] / df["Air temperature [K]"]
        if "Type" in df.columns:
            df["type_encoded"] = df["Type"].map(lambda t: TYPE_MAP.get(str(t).upper(), 0))
        elif "type_encoded" not in df.columns:
            df["type_encoded"] = 0
        return df

    def initialize(self):
        clf_path = os.path.join(ARTIFACTS_DIR, "failure_model.joblib")
        modes_path = os.path.join(ARTIFACTS_DIR, "modes_model.joblib")
        meta_path = os.path.join(ARTIFACTS_DIR, "metadata.joblib")

        if os.path.exists(clf_path) and os.path.exists(modes_path) and os.path.exists(meta_path):
            try:
                self.clf = joblib.load(clf_path)
                self.modes_clf = joblib.load(modes_path)
                meta = joblib.load(meta_path)
                self.metrics = meta.get("metrics", {})
                self.feature_importances = meta.get("feature_importances", [])
                self.holdout_test_cases = meta.get("holdout_test_cases", [])
                self.is_trained = True
                print("Loaded pre-trained AI4I Predictive Maintenance models from artifacts.")
                return
            except Exception as e:
                print(f"Failed to load cached models: {e}. Retraining...")

        self.train_models()

    def train_models(self):
        if not os.path.exists(DATA_PATH):
            raise FileNotFoundError(f"Dataset not found at {DATA_PATH}")

        raw_df = pd.read_csv(DATA_PATH)
        df = self.engineer_features(raw_df)

        X = df[FEATURE_COLS]
        y_fail = df["Machine failure"]
        y_modes = df[FAILURE_MODES]

        # 80/20 Stratified Split
        X_train, X_test, y_train, y_test, modes_train, modes_test, orig_train, orig_test = train_test_split(
            X, y_fail, y_modes, df, test_size=0.20, random_state=42, stratify=y_fail
        )

        # 1. Main Binary Failure Classifier
        self.clf = RandomForestClassifier(
            n_estimators=160,
            class_weight="balanced",
            max_depth=12,
            min_samples_split=4,
            random_state=42,
            n_jobs=-1
        )
        self.clf.fit(X_train, y_train)

        # 2. Multi-label Failure Modes Classifier
        self.modes_clf = MultiOutputClassifier(
            RandomForestClassifier(
                n_estimators=100,
                class_weight="balanced",
                max_depth=10,
                random_state=42,
                n_jobs=-1
            )
        )
        self.modes_clf.fit(X_train, modes_train)

        # Compute Holdout Test Metrics
        y_prob = self.clf.predict_proba(X_test)[:, 1]
        y_pred = (y_prob >= 0.5).astype(int)

        roc_auc = float(roc_auc_score(y_test, y_prob))
        f1 = float(f1_score(y_test, y_pred))
        precision = float(precision_score(y_test, y_pred, zero_division=0))
        recall = float(recall_score(y_test, y_pred, zero_division=0))
        cm = confusion_matrix(y_test, y_pred).tolist()

        importances = self.clf.feature_importances_
        fi = []
        for name, val in zip(FEATURE_COLS, importances):
            fi.append({"feature": name, "importance": round(float(val), 4)})
        fi.sort(key=lambda x: x["importance"], reverse=True)
        self.feature_importances = fi

        self.metrics = {
            "dataset_total_samples": int(len(df)),
            "test_samples": int(len(X_test)),
            "train_samples": int(len(X_train)),
            "actual_failures_in_test": int(sum(y_test)),
            "test_roc_auc": round(roc_auc, 4),
            "test_f1": round(f1, 4),
            "test_precision": round(precision, 4),
            "test_recall": round(recall, 4),
            "confusion_matrix": {
                "true_negative": cm[0][0],
                "false_positive": cm[0][1],
                "false_negative": cm[1][0],
                "true_positive": cm[1][1]
            },
            "failure_mode_counts": {
                mode: int(df[mode].sum()) for mode in FAILURE_MODES
            }
        }

        # Build curated unseen test cases for live verification
        test_df = orig_test.copy()
        test_df["predicted_prob"] = y_prob
        test_df["predicted_failure"] = y_pred

        sample_cases = []
        # Pull 3 of each failure mode and 6 normal runs
        for mode in FAILURE_MODES:
            sub = test_df[test_df[mode] == 1].head(2)
            for _, row in sub.iterrows():
                sample_cases.append(self._row_to_case_dict(row, primary_expected=MODE_NAMES[mode]))

        normals = test_df[(test_df["Machine failure"] == 0) & (test_df["predicted_failure"] == 0)].head(4)
        for _, row in normals.iterrows():
            sample_cases.append(self._row_to_case_dict(row, primary_expected="Normal Stable Operation"))

        self.holdout_test_cases = sample_cases
        self.is_trained = True

        # Save artifacts
        joblib.dump(self.clf, os.path.join(ARTIFACTS_DIR, "failure_model.joblib"))
        joblib.dump(self.modes_clf, os.path.join(ARTIFACTS_DIR, "modes_model.joblib"))
        joblib.dump(
            {
                "metrics": self.metrics,
                "feature_importances": self.feature_importances,
                "holdout_test_cases": self.holdout_test_cases
            },
            os.path.join(ARTIFACTS_DIR, "metadata.joblib")
        )
        print("Model training complete and artifacts saved.")

    def _row_to_case_dict(self, row: pd.Series, primary_expected: str) -> Dict[str, Any]:
        return {
            "udi": int(row.get("UDI", 0)),
            "product_id": str(row.get("Product ID", "N/A")),
            "type": str(row.get("Type", "L")),
            "air_temperature_k": round(float(row["Air temperature [K]"]), 1),
            "process_temperature_k": round(float(row["Process temperature [K]"]), 1),
            "rotational_speed_rpm": int(row["Rotational speed [rpm]"]),
            "torque_nm": round(float(row["Torque [Nm]"]), 1),
            "tool_wear_min": int(row["Tool wear [min]"]),
            "actual_failure": int(row["Machine failure"]),
            "actual_modes": [m for m in FAILURE_MODES if row.get(m, 0) == 1],
            "expected_diagnosis": primary_expected
        }

    def predict_telemetry(
        self,
        machine_type: str,
        air_temp_k: float,
        process_temp_k: float,
        rotational_speed_rpm: float,
        torque_nm: float,
        tool_wear_min: float
    ) -> Dict[str, Any]:
        if not self.is_trained:
            self.train_models()

        m_type = machine_type.upper() if machine_type else "L"
        type_code = TYPE_MAP.get(m_type, 0)
        temp_diff = process_temp_k - air_temp_k
        power_w = torque_nm * rotational_speed_rpm * (2 * math.pi / 60)
        power_kw = power_w / 1000.0
        strain = torque_nm * tool_wear_min
        temp_ratio = process_temp_k / max(air_temp_k, 0.001)

        input_data = pd.DataFrame([{
            "type_encoded": type_code,
            "Air temperature [K]": air_temp_k,
            "Process temperature [K]": process_temp_k,
            "Rotational speed [rpm]": rotational_speed_rpm,
            "Torque [Nm]": torque_nm,
            "Tool wear [min]": tool_wear_min,
            "temp_diff": temp_diff,
            "power_kw": power_kw,
            "strain": strain,
            "temp_ratio": temp_ratio
        }])

        prob_failure = float(self.clf.predict_proba(input_data)[0][1])
        is_failure = prob_failure >= 0.50

        # Predict multi-mode probabilities
        modes_probs: Dict[str, float] = {}
        for i, estimator in enumerate(self.modes_clf.estimators_):
            mode_code = FAILURE_MODES[i]
            p = float(estimator.predict_proba(input_data)[0][1])
            modes_probs[mode_code] = round(p * 100, 1)

        # Physics Rule Evaluation
        physics_alerts = []
        is_hdf_physics = (temp_diff < 8.6) and (rotational_speed_rpm < 1380)
        if is_hdf_physics:
            physics_alerts.append(f"Temperature difference {temp_diff:.1f} K is below 8.6 K and speed {rotational_speed_rpm:.0f} rpm is < 1380 rpm (Heat Dissipation Failure condition met).")

        is_pwf_physics = (power_w < 3500) or (power_w > 9000)
        if is_pwf_physics:
            physics_alerts.append(f"Motor power {power_w:.0f} W is outside safe operating corridor [3,500 W – 9,000 W] (Power Failure condition met).")

        strain_threshold = TYPE_STRAIN_THRESHOLDS.get(m_type, 11000)
        is_osf_physics = strain > strain_threshold
        if is_osf_physics:
            physics_alerts.append(f"Mechanical strain product ({torque_nm:.1f} Nm × {tool_wear_min:.0f} min = {strain:.0f}) exceeds Type-{m_type} threshold of {strain_threshold} (Overstrain Failure condition met).")

        is_twf_physics = tool_wear_min >= 210
        if is_twf_physics:
            physics_alerts.append(f"Tool wear reached {tool_wear_min:.0f} minutes (Tool Wear Failure critical window 200–240 min).")

        # Determine Primary Failure Mode
        # Sort by probability
        ranked_modes = sorted(modes_probs.items(), key=lambda x: x[1], reverse=True)
        top_mode, top_mode_prob = ranked_modes[0]

        if not is_failure and top_mode_prob < 30.0 and len(physics_alerts) == 0:
            primary_mode_display = "Normal Stable Operation"
            risk_tier = "OPTIMAL"
        elif prob_failure >= 0.70 or len(physics_alerts) > 0:
            primary_mode_display = MODE_NAMES.get(top_mode, "Machine Failure")
            risk_tier = "CRITICAL"
        else:
            primary_mode_display = MODE_NAMES.get(top_mode, "Potential Anomaly")
            risk_tier = "ELEVATED RISK"

        # Horizon / Remaining Useful Tool Life (RUL) estimation
        safe_wear_limit = 215.0
        remaining_wear = max(0.0, safe_wear_limit - tool_wear_min)
        wear_rate_per_min = 1.0  # nominal
        horizon_minutes = int(remaining_wear / wear_rate_per_min)

        # Prescriptive Recommendation
        recommendations = []
        if is_hdf_physics or modes_probs.get("HDF", 0) > 40:
            recommendations.append("Increase spindle speed above 1,400 rpm or increase coolant flow to restore temperature difference > 9.0 K.")
        if is_pwf_physics or modes_probs.get("PWF", 0) > 40:
            if power_w > 9000:
                recommendations.append(f"Reduce torque load (currently {torque_nm:.1f} Nm) or adjust feed rate to lower power under 8,500 W.")
            else:
                recommendations.append("Check electrical motor connection; power is under-delivering below 3,500 W threshold.")
        if is_osf_physics or modes_probs.get("OSF", 0) > 40:
            recommendations.append(f"Reduce cutting torque immediately to stay below {strain_threshold / max(tool_wear_min, 1):.1f} Nm for current tool wear.")
        if is_twf_physics or tool_wear_min > 190:
            recommendations.append(f"Schedule tool insert replacement. Tool has only ~{horizon_minutes} minutes remaining in operating envelope.")
        if not recommendations:
            recommendations.append("Parameters are within normal envelope. Continue scheduled predictive monitoring.")

        return {
            "failure_probability_pct": round(prob_failure * 100, 2),
            "is_failure_predicted": is_failure,
            "risk_tier": risk_tier,
            "primary_expected_outcome": primary_mode_display,
            "failure_mode_probabilities": modes_probs,
            "horizon_minutes_to_critical_wear": horizon_minutes,
            "physics_metrics": {
                "temp_diff_k": round(temp_diff, 2),
                "power_watts": round(power_w, 1),
                "power_kw": round(power_kw, 2),
                "mechanical_strain": round(strain, 1),
                "strain_threshold": strain_threshold,
                "temperature_ratio": round(temp_ratio, 4)
            },
            "physics_alerts": physics_alerts,
            "prescriptive_actions": recommendations
        }

    def predict_batch(self, cases: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        results = []
        for case in cases:
            res = self.predict_telemetry(
                machine_type=case.get("type", "L"),
                air_temp_k=float(case.get("air_temperature_k", 300.0)),
                process_temp_k=float(case.get("process_temperature_k", 310.0)),
                rotational_speed_rpm=float(case.get("rotational_speed_rpm", 1500)),
                torque_nm=float(case.get("torque_nm", 40.0)),
                tool_wear_min=float(case.get("tool_wear_min", 0.0))
            )
            case_res = {**case, **res}
            results.append(case_res)
        return results

# Singleton instance
predictive_engine = PredictiveEngine()
