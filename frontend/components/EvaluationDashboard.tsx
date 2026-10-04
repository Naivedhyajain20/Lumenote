"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Award, Play, CheckCircle2, BarChart3, AlertCircle } from "lucide-react";

interface EvalSummary {
  total_evaluated: number;
  answer_accuracy: number;
  abstention_accuracy: number;
  conflict_accuracy: number;
  citation_precision: number;
  composite_score: number;
  details: Array<{
    id: number;
    question: string;
    passed: boolean;
    answer_correct: boolean;
    conflict_correct: boolean;
    abstain_correct: boolean;
  }>;
}

interface EvaluationDashboardProps {
  apiUrl: string;
}

export default function EvaluationDashboard({ apiUrl }: EvaluationDashboardProps) {
  const [evalData, setEvalData] = useState<EvalSummary | null>(null);
  const [running, setRunning] = useState(false);

  const fetchLatest = useCallback(async () => {
    try {
      const res = await fetch(`${apiUrl}/eval/latest`);
      if (res.ok) {
        const data = await res.json();
        setEvalData(data);
      }
    } catch (e) {
      console.error("Failed to load evaluation data:", e);
    }
  }, [apiUrl]);

  useEffect(() => {
    // Load remote data; state updates occur after the request resolves.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchLatest();
  }, [fetchLatest]);

  const handleRunEvaluation = async () => {
    setRunning(true);
    try {
      const res = await fetch(`${apiUrl}/eval/run`, { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        setEvalData(data);
      }
    } catch (e) {
      console.error("Evaluation run error:", e);
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="h-full flex flex-col p-4 bg-[var(--color-surface)] rounded-2xl border border-[var(--color-line)] overflow-hidden">
      {/* Header */}
      <div className="pb-3 border-b border-[var(--color-line)] flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-bold text-[var(--color-ink)] flex items-center gap-2">
            <Award className="w-4 h-4 text-amber-400" /> Automated Evaluation & Reliability Benchmark
          </h3>
          <p className="text-xs text-[var(--color-muted)]">
            Automated test harness over 25 labeled golden test questions (Section 12.1).
          </p>
        </div>
        <button
          onClick={handleRunEvaluation}
          disabled={running}
          className="px-3.5 py-1.5 rounded-lg bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] disabled:opacity-50 text-white font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
        >
          <Play className="w-3.5 h-3.5" />
          <span>{running ? "Evaluating..." : "Run Golden Benchmark"}</span>
        </button>
      </div>

      {/* Metrics Row */}
      {evalData && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
          <div className="p-3 rounded-xl bg-[var(--color-panel)] border border-[var(--color-line)]">
            <span className="text-[11px] text-[var(--color-muted)] block mb-1">Answer Accuracy</span>
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-bold font-mono text-emerald-400">
                {(evalData.answer_accuracy * 100).toFixed(0)}%
              </span>
              <span className="text-[10px] text-[var(--color-muted)]">factual match</span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-[var(--color-panel)] border border-[var(--color-line)]">
            <span className="text-[11px] text-[var(--color-muted)] block mb-1">Citation Precision</span>
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-bold font-mono text-blue-400">
                {(evalData.citation_precision * 100).toFixed(0)}%
              </span>
              <span className="text-[10px] text-[var(--color-muted)]">grounded text</span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-[var(--color-panel)] border border-[var(--color-line)]">
            <span className="text-[11px] text-[var(--color-muted)] block mb-1">Abstention Accuracy</span>
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-bold font-mono text-amber-400">
                {(evalData.abstention_accuracy * 100).toFixed(0)}%
              </span>
              <span className="text-[10px] text-[var(--color-muted)]">honest uncertainty</span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-[var(--color-panel)] border border-[var(--color-line)]">
            <span className="text-[11px] text-[var(--color-muted)] block mb-1">Conflict Detection</span>
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-bold font-mono text-rose-400">
                {(evalData.conflict_accuracy * 100).toFixed(0)}%
              </span>
              <span className="text-[10px] text-[var(--color-muted)]">contradiction recall</span>
            </div>
          </div>
        </div>
      )}

      {/* Benchmark details table */}
      <div className="flex-1 overflow-y-auto">
        <h4 className="text-xs font-semibold text-[var(--color-ink)] mb-2 flex items-center gap-1.5">
          <BarChart3 className="w-3.5 h-3.5 text-blue-400" /> Golden Evaluation Case Breakdown
        </h4>

        {evalData?.details ? (
          <div className="space-y-1.5">
            {evalData.details.map((item) => (
              <div
                key={item.id}
                className="p-2.5 rounded-xl bg-[var(--color-panel)] border border-[var(--color-line)] flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-2.5 overflow-hidden">
                  <span className="font-mono text-[10px] text-[var(--color-muted)] w-5">#{item.id}</span>
                  <span className="text-[var(--color-ink)] truncate font-medium">{item.question}</span>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-semibold flex items-center gap-1 ${
                      item.passed
                        ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"
                        : "bg-[var(--color-card-soft)] text-[var(--color-muted)] border border-[var(--color-line)]"
                    }`}
                  >
                    {item.passed ? (
                      <>
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" /> PASSED
                      </>
                    ) : (
                      <>
                        <AlertCircle className="w-3 h-3 text-amber-400" /> REVIEW
                      </>
                    )}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center text-xs text-[var(--color-muted)]">No evaluation results yet. Click above to run!</div>
        )}
      </div>
    </div>
  );
}
