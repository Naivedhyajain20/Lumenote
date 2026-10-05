"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  AlertTriangle, CheckCircle2, ChevronRight, RefreshCw,
  ShieldAlert, Sliders, Sparkles, UploadCloud, Zap,
  Clock, ExternalLink
} from "lucide-react";
import { API_BASE } from "@/lib/api";

interface ModelMetrics {
  dataset_total_samples: number;
  test_samples: number;
  train_samples: number;
  actual_failures_in_test: number;
  test_roc_auc: number;
  test_f1: number;
  test_precision: number;
  test_recall: number;
  confusion_matrix: {
    true_negative: number;
    false_positive: number;
    false_negative: number;
    true_positive: number;
  };
  failure_mode_counts: Record<string, number>;
}

interface FeatureImportance {
  feature: string;
  importance: number;
}

interface PredictionResult {
  failure_probability_pct: number;
  is_failure_predicted: boolean;
  risk_tier: string;
  primary_expected_outcome: string;
  failure_mode_probabilities: Record<string, number>;
  horizon_minutes_to_critical_wear: number;
  physics_metrics: {
    temp_diff_k: number;
    power_watts: number;
    power_kw: number;
    mechanical_strain: number;
    strain_threshold: number;
    temperature_ratio: number;
  };
  physics_alerts: string[];
  prescriptive_actions: string[];
}

interface UnseenCase {
  udi: number;
  product_id: string;
  type: string;
  air_temperature_k: number;
  process_temperature_k: number;
  rotational_speed_rpm: number;
  torque_nm: number;
  tool_wear_min: number;
  actual_failure: number;
  actual_modes: string[];
  expected_diagnosis: string;
}

export default function PredictPage() {
  // Telemetry Inputs
  const [machineType, setMachineType] = useState<string>("L");
  const [airTemp, setAirTemp] = useState<number>(298.5);
  const [processTemp, setProcessTemp] = useState<number>(308.6);
  const [rpm, setRpm] = useState<number>(1500);
  const [torque, setTorque] = useState<number>(42.0);
  const [toolWear, setToolWear] = useState<number>(45);

  // States
  const [prediction, setPrediction] = useState<PredictionResult | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [metrics, setMetrics] = useState<ModelMetrics | null>(null);
  const [features, setFeatures] = useState<FeatureImportance[]>([]);
  const [unseenCases, setUnseenCases] = useState<UnseenCase[]>([]);
  const [activeTab, setActiveTab] = useState<"simulator" | "unseen" | "metrics">("simulator");
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);

  const fetchMetrics = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/predict/metrics`);
      if (res.ok) {
        const data = await res.json();
        setMetrics(data.metrics);
        setFeatures(data.feature_importances || []);
      }
    } catch (e) {
      console.error("Failed to fetch model metrics", e);
    }
  };

  const fetchUnseenCases = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/predict/unseen-cases`);
      if (res.ok) {
        const data = await res.json();
        setUnseenCases(data.cases || []);
      }
    } catch (e) {
      console.error("Failed to fetch unseen cases", e);
    }
  };

  const runPrediction = async (
    typeVal = machineType,
    airVal = airTemp,
    procVal = processTemp,
    rpmVal = rpm,
    torqVal = torque,
    wearVal = toolWear
  ) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/predict/telemetry`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          machine_type: typeVal,
          air_temperature_k: airVal,
          process_temperature_k: procVal,
          rotational_speed_rpm: rpmVal,
          torque_nm: torqVal,
          tool_wear_min: wearVal
        })
      });
      if (res.ok) {
        const data = await res.json();
        setPrediction(data.prediction);
      }
    } catch (e) {
      console.error("Prediction failed", e);
    } finally {
      setLoading(false);
    }
  };

  // Load the initial dashboard snapshot once; controls trigger fresh predictions explicitly.
  useEffect(() => {
    const initialValues = { machineType, airTemp, processTemp, rpm, torque, toolWear };
    void Promise.resolve().then(() => {
      void fetchMetrics();
      void fetchUnseenCases();
      void runPrediction(initialValues.machineType, initialValues.airTemp, initialValues.processTemp, initialValues.rpm, initialValues.torque, initialValues.toolWear);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Preset Handlers
  const applyPreset = (presetName: string) => {
    if (presetName === "normal") {
      setMachineType("L");
      setAirTemp(298.1);
      setProcessTemp(308.6);
      setRpm(1551);
      setTorque(42.8);
      setToolWear(18);
      runPrediction("L", 298.1, 308.6, 1551, 42.8, 18);
    } else if (presetName === "hdf") {
      // Heat Dissipation Failure: small temp delta < 8.6K, low RPM < 1380
      setMachineType("L");
      setAirTemp(300.5);
      setProcessTemp(307.2); // delta = 6.7 K (< 8.6 K)
      setRpm(1260); // < 1380 rpm
      setTorque(62.0);
      setToolWear(90);
      runPrediction("L", 300.5, 307.2, 1260, 62.0, 90);
    } else if (presetName === "pwf") {
      // Power Failure: Power > 9000 W
      setMachineType("M");
      setAirTemp(298.2);
      setProcessTemp(308.5);
      setRpm(1980);
      setTorque(65.0); // Power = 65 * 1980 * 2pi/60 = 13,477 W (> 9000 W)
      setToolWear(60);
      runPrediction("M", 298.2, 308.5, 1980, 65.0, 60);
    } else if (presetName === "osf") {
      // Overstrain Failure: Torque * Tool Wear > 11000 (for L)
      setMachineType("L");
      setAirTemp(298.5);
      setProcessTemp(309.0);
      setRpm(1410);
      setTorque(68.5);
      setToolWear(205); // Strain = 68.5 * 205 = 14,042 (> 11,000)
      runPrediction("L", 298.5, 309.0, 1410, 68.5, 205);
    } else if (presetName === "twf") {
      // Tool Wear Failure: wear > 215 min
      setMachineType("H");
      setAirTemp(297.8);
      setProcessTemp(308.2);
      setRpm(1520);
      setTorque(45.0);
      setToolWear(228); // Critical window
      runPrediction("H", 297.8, 308.2, 1520, 45.0, 228);
    }
  };

  const loadUnseenCase = (c: UnseenCase) => {
    setMachineType(c.type);
    setAirTemp(c.air_temperature_k);
    setProcessTemp(c.process_temperature_k);
    setRpm(c.rotational_speed_rpm);
    setTorque(c.torque_nm);
    setToolWear(c.tool_wear_min);
    runPrediction(c.type, c.air_temperature_k, c.process_temperature_k, c.rotational_speed_rpm, c.torque_nm, c.tool_wear_min);
    setActiveTab("simulator");
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadStatus("Scoring batch telemetry from CSV...");
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await fetch(`${API_BASE}/api/predict/upload-csv`, {
        method: "POST",
        body: formData
      });
      if (res.ok) {
        const data = await res.json();
        setUploadStatus(`Batch complete! Scored ${data.total_processed} machines: ${data.failures_predicted} potential failures detected.`);
      } else {
        setUploadStatus("Failed to parse CSV. Make sure headers match AI4I dataset format.");
      }
    } catch {
      setUploadStatus("Network error scoring CSV.");
    }
  };

  return (
    <div className="app-route-enter min-h-screen bg-[var(--color-page)] pb-16">
      {/* ── HERO BANNER ── */}
      <section className="bg-navy-hero px-4 md:px-8 pt-8 pb-10 text-white relative overflow-hidden">
        {/* Soft specular ambient glow */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 left-10 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-500 text-white tracking-wide uppercase">
                  ALG-DATA-02
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-white/10 text-blue-200 border border-white/15">
                  AI4I 2020 Predictive Maintenance
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                  ROC-AUC {metrics?.test_roc_auc ?? "0.9728"}
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                Predict What Happens Next
              </h1>
              <p className="text-slate-300 text-sm max-w-2xl mt-1 leading-relaxed">
                Physics-augmented machine learning engine evaluating sensor telemetry to anticipate machine failure modes, remaining useful tool life, and prescriptive interventions before catastrophic breakdown.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <a
                href="https://archive.ics.uci.edu/dataset/601/ai4i+2020+predictive+maintenance+dataset"
                target="_blank"
                rel="noreferrer"
                className="liquid-glass-pill px-3.5 py-2 rounded-full text-xs font-semibold text-white flex items-center gap-1.5 hover:bg-white/20 transition-all"
              >
                <span>UCI AI4I Dataset</span>
                <ExternalLink className="w-3.5 h-3.5 opacity-80" />
              </a>

              <Link
                href="/workspace"
                className="liquid-glass-pill px-3.5 py-2 rounded-full text-xs font-semibold text-white flex items-center gap-1.5 hover:bg-white/20 transition-all"
              >
                <span>Document Engine (ALG-AI-02)</span>
                <ChevronRight className="w-3.5 h-3.5 opacity-80" />
              </Link>
            </div>
          </div>

          {/* Quick Metrics Ribbon */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
            <div className="p-3 rounded-xl bg-white/5 border border-white/10 backdrop-blur-md">
              <div className="text-[10px] text-slate-400 uppercase font-semibold">Test Sample Holdout</div>
              <div className="text-lg font-bold text-white mt-0.5">2,000 Unseen Cases</div>
              <div className="text-[11px] text-blue-300">from 10,000 dataset rows</div>
            </div>
            <div className="p-3 rounded-xl bg-white/5 border border-white/10 backdrop-blur-md">
              <div className="text-[10px] text-slate-400 uppercase font-semibold">ROC-AUC Score</div>
              <div className="text-lg font-bold text-emerald-400 mt-0.5">{metrics?.test_roc_auc ?? "0.9728"}</div>
              <div className="text-[11px] text-slate-300">Near-perfect separation</div>
            </div>
            <div className="p-3 rounded-xl bg-white/5 border border-white/10 backdrop-blur-md">
              <div className="text-[10px] text-slate-400 uppercase font-semibold">Failure Recall Rate</div>
              <div className="text-lg font-bold text-blue-400 mt-0.5">
                {metrics ? `${(metrics.test_recall * 100).toFixed(1)}%` : "85.3%"}
              </div>
              <div className="text-[11px] text-slate-300">Caught 58 of 68 test failures</div>
            </div>
            <div className="p-3 rounded-xl bg-white/5 border border-white/10 backdrop-blur-md">
              <div className="text-[10px] text-slate-400 uppercase font-semibold">Failure Modes Modeled</div>
              <div className="text-lg font-bold text-amber-400 mt-0.5">5 Physics Classes</div>
              <div className="text-[11px] text-slate-300">TWF · HDF · PWF · OSF · RNF</div>
            </div>
          </div>
        </div>
      </section>

      {/* ── MAIN INTERACTIVE CONTAINER ── */}
      <main className="max-w-7xl mx-auto px-4 md:px-8 mt-6">
        {/* Navigation Tabs */}
        <div className="flex items-center justify-between border-b border-[var(--color-line)] pb-3 mb-6">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab("simulator")}
              className={`px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
                activeTab === "simulator"
                  ? "bg-[var(--color-primary)] text-white shadow-xs"
                  : "text-[var(--color-muted)] hover:bg-[var(--color-card-soft)]"
              }`}
            >
              1. Real-Time Telemetry Simulator
            </button>
            <button
              onClick={() => setActiveTab("unseen")}
              className={`px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
                activeTab === "unseen"
                  ? "bg-[var(--color-primary)] text-white shadow-xs"
                  : "text-[var(--color-muted)] hover:bg-[var(--color-card-soft)]"
              }`}
            >
              2. Test on Unseen Validation Cases ({unseenCases.length})
            </button>
            <button
              onClick={() => setActiveTab("metrics")}
              className={`px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
                activeTab === "metrics"
                  ? "bg-[var(--color-primary)] text-white shadow-xs"
                  : "text-[var(--color-muted)] hover:bg-[var(--color-card-soft)]"
              }`}
            >
              3. Model Architecture & Confusion Matrix
            </button>
          </div>

          {/* CSV Quick Upload Button */}
          <label className="hidden sm:inline-flex items-center gap-2 px-3 py-1.5 rounded-full liquid-glass-pill text-xs font-semibold text-[var(--color-ink)] hover:text-[var(--color-primary)] cursor-pointer">
            <UploadCloud className="w-3.5 h-3.5 text-[var(--color-primary)]" />
            <span>Score CSV File</span>
            <input
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
        </div>

        {uploadStatus && (
          <div className="mb-6 p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-xs text-blue-900 dark:text-blue-200 flex items-center justify-between">
            <span>{uploadStatus}</span>
            <button onClick={() => setUploadStatus(null)} className="text-blue-500 font-bold ml-4">✕</button>
          </div>
        )}

        {/* ── TAB 1: SIMULATOR & PREDICTIVE DECK ── */}
        {activeTab === "simulator" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left 5 Cols: Sliders & Parameter Controls */}
            <div className="lg:col-span-5 flex flex-col gap-5">
              {/* Presets card */}
              <div className="card-base p-4">
                <div className="flex items-center justify-between mb-2.5">
                  <span className="text-xs font-bold uppercase tracking-wider text-[var(--color-muted)]">
                    1-Click Failure Scenarios
                  </span>
                  <span className="text-[10px] text-[var(--color-muted)]">Live Benchmark Profiles</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <button
                    onClick={() => applyPreset("normal")}
                    className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 hover:bg-emerald-100 text-emerald-800 dark:text-emerald-300 font-medium text-left border border-emerald-200 dark:border-emerald-800/40 cursor-pointer"
                  >
                    🟢 Normal Operation
                  </button>
                  <button
                    onClick={() => applyPreset("hdf")}
                    className="p-2 rounded-lg bg-red-50 dark:bg-red-950/30 hover:bg-red-100 text-red-800 dark:text-red-300 font-medium text-left border border-red-200 dark:border-red-800/40 cursor-pointer"
                  >
                    🔥 Heat Dissipation (HDF)
                  </button>
                  <button
                    onClick={() => applyPreset("pwf")}
                    className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/30 hover:bg-amber-100 text-amber-800 dark:text-amber-300 font-medium text-left border border-amber-200 dark:border-amber-800/40 cursor-pointer"
                  >
                    ⚡ Power Failure (PWF)
                  </button>
                  <button
                    onClick={() => applyPreset("osf")}
                    className="p-2 rounded-lg bg-purple-50 dark:bg-purple-950/30 hover:bg-purple-100 text-purple-800 dark:text-purple-300 font-medium text-left border border-purple-200 dark:border-purple-800/40 cursor-pointer"
                  >
                    💥 Overstrain (OSF)
                  </button>
                </div>
                <button
                  onClick={() => applyPreset("twf")}
                  className="w-full mt-2 p-2 rounded-lg bg-blue-50 dark:bg-blue-950/30 hover:bg-blue-100 text-blue-800 dark:text-blue-300 font-medium text-xs text-left border border-blue-200 dark:border-blue-800/40 cursor-pointer flex items-center justify-between"
                >
                  <span>⏱️ Critical Tool Wear Horizon (TWF - 228 min)</span>
                  <ChevronRight className="w-3.5 h-3.5 opacity-60" />
                </button>
              </div>

              {/* Sensor Controls */}
              <div className="card-base p-5">
                <div className="flex items-center justify-between border-b border-[var(--color-line)] pb-3 mb-4">
                  <h3 className="font-bold text-sm text-[var(--color-navy)] flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-[var(--color-primary)]" />
                    Machine Operational Telemetry
                  </h3>
                  <button
                    onClick={() => runPrediction()}
                    disabled={loading}
                    className="btn-pill btn-pill-primary text-xs py-1 px-3"
                  >
                    {loading ? <RefreshCw className="w-3 h-3 animate-spin" /> : "Predict"}
                  </button>
                </div>

                <div className="space-y-4 text-xs">
                  {/* Quality Type */}
                  <div>
                    <label className="font-semibold text-[var(--color-ink)] block mb-1.5">
                      Machine Variant (Quality Tier)
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { key: "L", label: "Type L (Low - 50%)" },
                        { key: "M", label: "Type M (Medium - 30%)" },
                        { key: "H", label: "Type H (High - 20%)" }
                      ].map(t => (
                        <button
                          key={t.key}
                          onClick={() => {
                            setMachineType(t.key);
                            runPrediction(t.key, airTemp, processTemp, rpm, torque, toolWear);
                          }}
                          className={`py-1.5 px-2 rounded-lg font-semibold text-center border cursor-pointer ${
                            machineType === t.key
                              ? "bg-[var(--color-primary)] text-white border-[var(--color-primary)]"
                              : "bg-[var(--color-card-soft)] text-[var(--color-muted)] border-[var(--color-line)] hover:bg-[var(--color-page)]"
                          }`}
                        >
                          {t.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Rotational Speed */}
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-semibold text-[var(--color-ink)]">Rotational Speed [RPM]</span>
                      <span className="font-mono font-bold text-[var(--color-primary)]">{rpm} rpm</span>
                    </div>
                    <input
                      type="range"
                      min={1150}
                      max={2900}
                      step={10}
                      value={rpm}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setRpm(val);
                        runPrediction(machineType, airTemp, processTemp, val, torque, toolWear);
                      }}
                      className="w-full accent-[var(--color-primary)] cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] text-[var(--color-muted)] mt-0.5">
                      <span>1,150 rpm (Low Speed Zone)</span>
                      <span>2,900 rpm</span>
                    </div>
                  </div>

                  {/* Torque */}
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-semibold text-[var(--color-ink)]">Torque [Nm]</span>
                      <span className="font-mono font-bold text-[var(--color-primary)]">{torque.toFixed(1)} Nm</span>
                    </div>
                    <input
                      type="range"
                      min={3.8}
                      max={76.6}
                      step={0.5}
                      value={torque}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setTorque(val);
                        runPrediction(machineType, airTemp, processTemp, rpm, val, toolWear);
                      }}
                      className="w-full accent-[var(--color-primary)] cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] text-[var(--color-muted)] mt-0.5">
                      <span>3.8 Nm (Light Load)</span>
                      <span>76.6 Nm (Heavy Overload)</span>
                    </div>
                  </div>

                  {/* Tool Wear Horizon Slider */}
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-semibold text-[var(--color-ink)]">Tool Wear [minutes]</span>
                      <span className={`font-mono font-bold ${toolWear > 200 ? "text-red-600" : "text-[var(--color-primary)]"}`}>
                        {toolWear} min {toolWear > 200 ? "(CRITICAL)" : ""}
                      </span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={253}
                      step={1}
                      value={toolWear}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setToolWear(val);
                        runPrediction(machineType, airTemp, processTemp, rpm, torque, val);
                      }}
                      className="w-full accent-blue-600 cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] text-[var(--color-muted)] mt-0.5">
                      <span>0 min (Fresh Tool)</span>
                      <span className="text-amber-600">200 min (Limit)</span>
                      <span className="text-red-600">253 min</span>
                    </div>
                  </div>

                  {/* Temperatures */}
                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="font-semibold text-[var(--color-ink)] block mb-1">
                        Air Temp: {airTemp.toFixed(1)} K ({(airTemp - 273.15).toFixed(1)}°C)
                      </label>
                      <input
                        type="range"
                        min={295.0}
                        max={305.0}
                        step={0.1}
                        value={airTemp}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setAirTemp(val);
                          runPrediction(machineType, val, processTemp, rpm, torque, toolWear);
                        }}
                        className="w-full accent-blue-600 cursor-pointer"
                      />
                    </div>
                    <div>
                      <label className="font-semibold text-[var(--color-ink)] block mb-1">
                        Process Temp: {processTemp.toFixed(1)} K ({(processTemp - 273.15).toFixed(1)}°C)
                      </label>
                      <input
                        type="range"
                        min={305.0}
                        max={315.0}
                        step={0.1}
                        value={processTemp}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setProcessTemp(val);
                          runPrediction(machineType, airTemp, val, rpm, torque, toolWear);
                        }}
                        className="w-full accent-blue-600 cursor-pointer"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right 7 Cols: Apple Liquid Glass Predictive Outcome Card */}
            <div className="lg:col-span-7 flex flex-col gap-5">
              {prediction ? (
                <div className="liquid-glass rounded-2xl p-6 relative overflow-hidden">
                  {/* Status Header */}
                  <div className="flex items-start justify-between gap-4 pb-4 border-b border-[var(--color-line)]">
                    <div>
                      <span className="text-[10px] uppercase font-bold tracking-widest text-[var(--color-muted)]">
                        What Happens Next Forecast
                      </span>
                      <h2 className="text-xl sm:text-2xl font-black text-[var(--color-navy)] flex items-center gap-2 mt-0.5">
                        {prediction.is_failure_predicted ? (
                          <ShieldAlert className="w-6 h-6 text-red-500" />
                        ) : (
                          <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                        )}
                        {prediction.primary_expected_outcome}
                      </h2>
                    </div>

                    <div className="text-right">
                      <div className="text-[10px] text-[var(--color-muted)] font-semibold uppercase">Failure Probability</div>
                      <div
                        className={`text-2xl font-extrabold ${
                          prediction.failure_probability_pct > 50 ? "text-red-600" : "text-emerald-600"
                        }`}
                      >
                        {prediction.failure_probability_pct.toFixed(1)}%
                      </div>
                    </div>
                  </div>

                  {/* Progress Probability Bar */}
                  <div className="mt-4">
                    <div className="w-full h-3 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden relative">
                      <div
                        className={`h-full transition-all duration-300 rounded-full ${
                          prediction.failure_probability_pct > 65
                            ? "bg-gradient-to-r from-amber-500 to-red-600 shadow-sm"
                            : prediction.failure_probability_pct > 30
                            ? "bg-gradient-to-r from-emerald-500 to-amber-500"
                            : "bg-emerald-500"
                        }`}
                        style={{ width: `${Math.max(5, prediction.failure_probability_pct)}%` }}
                      />
                    </div>
                  </div>

                  {/* RUL Horizon Counter */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-5">
                    <div className="p-3.5 rounded-xl bg-white/60 dark:bg-white/5 border border-white/50 dark:border-white/10">
                      <div className="text-[10px] font-bold uppercase text-[var(--color-muted)] flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-blue-500" />
                        Tool Remaining Useful Life (RUL)
                      </div>
                      <div className="text-lg font-extrabold text-[var(--color-navy)] mt-1">
                        ~{prediction.horizon_minutes_to_critical_wear} Operating Minutes
                      </div>
                      <div className="text-[11px] text-[var(--color-muted)] mt-0.5">
                        Based on safe tool wear boundary limit (215 min)
                      </div>
                    </div>

                    <div className="p-3.5 rounded-xl bg-white/60 dark:bg-white/5 border border-white/50 dark:border-white/10">
                      <div className="text-[10px] font-bold uppercase text-[var(--color-muted)] flex items-center gap-1.5">
                        <Zap className="w-3.5 h-3.5 text-amber-500" />
                        Mechanical Power Delivered
                      </div>
                      <div className="text-lg font-extrabold text-[var(--color-navy)] mt-1">
                        {prediction.physics_metrics.power_kw} kW ({prediction.physics_metrics.power_watts.toLocaleString()} W)
                      </div>
                      <div className="text-[11px] text-[var(--color-muted)] mt-0.5">
                        Safe corridor: 3.5 kW to 9.0 kW
                      </div>
                    </div>
                  </div>

                  {/* Multi-Output Failure Mode Breakdown */}
                  <div className="mt-5">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--color-muted)] mb-2.5">
                      Individual Failure Mode Probabilities (Multi-Label Classifier)
                    </h4>
                    <div className="space-y-2">
                      {[
                        { code: "HDF", label: "Heat Dissipation Failure (HDF)", desc: "Delta < 8.6K and RPM < 1380" },
                        { code: "PWF", label: "Power Overload Failure (PWF)", desc: "Power < 3500W or > 9000W" },
                        { code: "OSF", label: "Mechanical Overstrain Failure (OSF)", desc: "Torque × Wear exceeds threshold" },
                        { code: "TWF", label: "Tool Wear Limit Reached (TWF)", desc: "Wear reaches 200–240 minutes" },
                        { code: "RNF", label: "Random Component Failure (RNF)", desc: "0.1% baseline chance" }
                      ].map(m => {
                        const prob = prediction.failure_mode_probabilities[m.code] ?? 0;
                        return (
                          <div key={m.code} className="p-2.5 rounded-xl bg-white/40 dark:bg-white/5 border border-white/40 text-xs">
                            <div className="flex justify-between items-center mb-1">
                              <span className="font-bold text-[var(--color-ink)]">{m.label}</span>
                              <span className={`font-mono font-bold ${prob > 40 ? "text-red-600" : "text-[var(--color-muted)]"}`}>
                                {prob.toFixed(1)}%
                              </span>
                            </div>
                            <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${prob > 50 ? "bg-red-500" : prob > 20 ? "bg-amber-500" : "bg-blue-400"}`}
                                style={{ width: `${Math.max(2, prob)}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Physics Rule Diagnostics */}
                  {prediction.physics_alerts.length > 0 && (
                    <div className="mt-5 p-3.5 rounded-xl bg-red-50/80 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60">
                      <div className="flex items-center gap-2 text-xs font-bold text-red-800 dark:text-red-300 mb-1">
                        <AlertTriangle className="w-4 h-4 text-red-600" />
                        Physics Threshold Violations Detected:
                      </div>
                      <ul className="list-disc list-inside space-y-1 text-xs text-red-700 dark:text-red-200">
                        {prediction.physics_alerts.map((alert, idx) => (
                          <li key={idx}>{alert}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Prescriptive Interventions */}
                  <div className="mt-5 p-3.5 rounded-xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/40">
                    <div className="text-xs font-bold text-blue-900 dark:text-blue-300 flex items-center gap-1.5 mb-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                      Prescriptive Maintenance Recommendation (Avert Failure)
                    </div>
                    <ul className="space-y-1 text-xs text-slate-700 dark:text-slate-300">
                      {prediction.prescriptive_actions.map((act, idx) => (
                        <li key={idx} className="flex items-start gap-1.5">
                          <span className="text-blue-600 font-bold">•</span>
                          <span>{act}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ) : (
                <div className="card-base p-12 text-center text-xs text-[var(--color-muted)]">
                  Adjust sensor parameters on the left to compute live predictions.
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── TAB 2: UNSEEN VALIDATION CASES ── */}
        {activeTab === "unseen" && (
          <div className="card-base p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-base text-[var(--color-navy)]">
                  Validation on Unseen Test Cases (AI4I 2020 Holdout Partition)
                </h3>
                <p className="text-xs text-[var(--color-muted)] mt-0.5">
                  Click any unseen case below to load its raw parameters into the predictive simulator and verify accuracy against the actual ground-truth label.
                </p>
              </div>
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                {unseenCases.length} Curated Cases
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[var(--color-line)] text-[var(--color-muted)] font-semibold">
                    <th className="py-2.5 px-3">Product ID</th>
                    <th className="py-2.5 px-3">Variant</th>
                    <th className="py-2.5 px-3">Speed (RPM)</th>
                    <th className="py-2.5 px-3">Torque (Nm)</th>
                    <th className="py-2.5 px-3">Tool Wear</th>
                    <th className="py-2.5 px-3">Ground Truth</th>
                    <th className="py-2.5 px-3">Expected Outcome</th>
                    <th className="py-2.5 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-line)]">
                  {unseenCases.map((c, i) => (
                    <tr key={i} className="hover:bg-[var(--color-card-soft)] transition-colors">
                      <td className="py-2.5 px-3 font-mono font-bold text-[var(--color-navy)]">{c.product_id}</td>
                      <td className="py-2.5 px-3 font-semibold">Type {c.type}</td>
                      <td className="py-2.5 px-3 font-mono">{c.rotational_speed_rpm} rpm</td>
                      <td className="py-2.5 px-3 font-mono">{c.torque_nm} Nm</td>
                      <td className="py-2.5 px-3 font-mono">{c.tool_wear_min} min</td>
                      <td className="py-2.5 px-3">
                        {c.actual_failure === 1 ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300">
                            Failure ({c.actual_modes.join(", ") || "Fail"})
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                            Normal Operation
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 font-medium text-[var(--color-ink)]">{c.expected_diagnosis}</td>
                      <td className="py-2.5 px-3 text-right">
                        <button
                          onClick={() => loadUnseenCase(c)}
                          className="px-2.5 py-1 rounded-lg bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-hover)] text-[11px] font-bold cursor-pointer"
                        >
                          Test In Simulator →
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── TAB 3: MODEL ARCHITECTURE & METRICS ── */}
        {activeTab === "metrics" && metrics && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Confusion Matrix */}
            <div className="card-base p-6">
              <h3 className="font-bold text-sm text-[var(--color-navy)] mb-1">
                Holdout Confusion Matrix (2,000 Test Samples)
              </h3>
              <p className="text-xs text-[var(--color-muted)] mb-4">
                Demonstrates high detection sensitivity on imbalanced failure classes (~3.4% failure rate).
              </p>

              <div className="grid grid-cols-2 gap-3 text-center text-xs">
                <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200">
                  <div className="text-[10px] uppercase font-bold text-emerald-700">True Negatives (TN)</div>
                  <div className="text-2xl font-black text-emerald-800 dark:text-emerald-200 mt-1">
                    {metrics.confusion_matrix.true_negative}
                  </div>
                  <div className="text-[11px] text-emerald-600">Correctly classified safe</div>
                </div>

                <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200">
                  <div className="text-[10px] uppercase font-bold text-amber-700">False Positives (FP)</div>
                  <div className="text-2xl font-black text-amber-800 dark:text-amber-200 mt-1">
                    {metrics.confusion_matrix.false_positive}
                  </div>
                  <div className="text-[11px] text-amber-600">False alerts (1.1%)</div>
                </div>

                <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200">
                  <div className="text-[10px] uppercase font-bold text-red-700">False Negatives (FN)</div>
                  <div className="text-2xl font-black text-red-800 dark:text-red-200 mt-1">
                    {metrics.confusion_matrix.false_negative}
                  </div>
                  <div className="text-[11px] text-red-600">Missed failures (only 10)</div>
                </div>

                <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200">
                  <div className="text-[10px] uppercase font-bold text-blue-700">True Positives (TP)</div>
                  <div className="text-2xl font-black text-blue-800 dark:text-blue-200 mt-1">
                    {metrics.confusion_matrix.true_positive}
                  </div>
                  <div className="text-[11px] text-blue-600">Failures caught (85.3%)</div>
                </div>
              </div>

              <div className="mt-5 space-y-2 text-xs">
                <div className="flex justify-between py-1.5 border-b border-[var(--color-line)]">
                  <span className="text-[var(--color-muted)]">Test ROC-AUC</span>
                  <span className="font-bold text-emerald-600">{metrics.test_roc_auc}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-[var(--color-line)]">
                  <span className="text-[var(--color-muted)]">Test F1-Score</span>
                  <span className="font-bold text-[var(--color-ink)]">{metrics.test_f1}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-[var(--color-line)]">
                  <span className="text-[var(--color-muted)]">Precision</span>
                  <span className="font-bold text-[var(--color-ink)]">{(metrics.test_precision * 100).toFixed(1)}%</span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-[var(--color-muted)]">Recall</span>
                  <span className="font-bold text-[var(--color-ink)]">{(metrics.test_recall * 100).toFixed(1)}%</span>
                </div>
              </div>
            </div>

            {/* Feature Importances */}
            <div className="card-base p-6">
              <h3 className="font-bold text-sm text-[var(--color-navy)] mb-1">
                Top Physics Feature Importances
              </h3>
              <p className="text-xs text-[var(--color-muted)] mb-4">
                Relative contribution of engineered physical features in separating normal states from catastrophic failure.
              </p>

              <div className="space-y-3">
                {features.map((f, i) => (
                  <div key={i} className="text-xs">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-semibold text-[var(--color-ink)] font-mono">{f.feature}</span>
                      <span className="font-bold text-[var(--color-primary)]">{(f.importance * 100).toFixed(1)}%</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-[var(--color-primary)]"
                        style={{ width: `${Math.min(100, f.importance * 350)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
