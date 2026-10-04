"use client";

import React, { useState, useRef, useEffect } from "react";
import { CheckCircle2, AlertTriangle, AlertCircle, ChevronDown, ChevronUp } from "lucide-react";

interface ConfidenceData {
  score: number;
  band: string;
  signals?: {
    retrieval_strength: number;
    claim_support: number;
    source_agreement: number;
    doc_reliability: number;
    conflict_penalty?: number;
  };
  explanation?: string;
}

interface ConfidenceBadgeProps {
  confidence: ConfidenceData;
}

export default function ConfidenceBadge({ confidence }: ConfidenceBadgeProps) {
  const [showPopover, setShowPopover] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowPopover(false);
      }
    }
    if (showPopover) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showPopover]);

  const band = (confidence.band || "LOW").toUpperCase();
  const pct = Math.round(Math.max(0, Math.min(1, confidence.score ?? 0)) * 100);

  const isHigh = band === "HIGH";
  const isMed = band === "MEDIUM";

  const color = isHigh
    ? "var(--color-verified)"
    : isMed
    ? "var(--color-uncertain)"
    : "var(--color-conflict)";

  const bgColor = isHigh
    ? "var(--color-verified-soft)"
    : isMed
    ? "var(--color-uncertain-soft)"
    : "var(--color-conflict-soft)";

  const Icon = isHigh ? CheckCircle2 : isMed ? AlertTriangle : AlertCircle;

  const signals = confidence.signals;

  const signalRows = signals ? [
    { label: "Retrieval Strength", value: signals.retrieval_strength },
    { label: "Claim Support", value: signals.claim_support },
    { label: "Source Agreement", value: signals.source_agreement },
    { label: "Document Reliability", value: signals.doc_reliability },
  ] : [];

  return (
    <div className="relative inline-block" ref={containerRef}>
      <button
        onClick={() => setShowPopover(!showPopover)}
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer border"
        style={{
          color,
          backgroundColor: bgColor,
          borderColor: `${color}40`,
        }}
        title="Click to view confidence explanation"
      >
        <Icon className="w-3.5 h-3.5" />
        <span className="capitalize">{band.toLowerCase()} Confidence</span>
        <span className="font-mono font-bold text-[11px] opacity-90">{pct}%</span>
        {showPopover ? <ChevronUp className="w-3 h-3 opacity-60" /> : <ChevronDown className="w-3 h-3 opacity-60" />}
      </button>

      {/* "Why this confidence?" Popover */}
      {showPopover && (
        <div className="absolute left-0 bottom-full mb-2 w-72 card-base p-4 z-50 shadow-xl text-xs animate-in fade-in-50">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-[var(--color-line)]">
            <h5 className="font-bold text-[var(--color-navy)] text-xs">
              Why this confidence?
            </h5>
            <span
              className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded"
              style={{ color, backgroundColor: bgColor }}
            >
              {pct}% overall
            </span>
          </div>

          {confidence.explanation && (
            <p className="text-[11px] text-[var(--color-muted)] leading-relaxed mb-3">
              {confidence.explanation}
            </p>
          )}

          {/* 4 Signals as thin bars */}
          {signals ? <div className="space-y-2.5">
            {signalRows.map(({ label, value }) => {
              const sigPct = Math.round((value || 0) * 100);
              const barColor =
                sigPct >= 75
                  ? "var(--color-verified)"
                  : sigPct >= 50
                  ? "var(--color-uncertain)"
                  : "var(--color-conflict)";

              return (
                <div key={label}>
                  <div className="flex justify-between text-[11px] mb-1">
                    <span className="text-[var(--color-muted)]">{label}</span>
                    <span className="font-mono font-semibold text-[var(--color-ink)]">{sigPct}%</span>
                  </div>
                  <div className="h-1 bg-[var(--color-line)] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{ width: `${sigPct}%`, backgroundColor: barColor }}
                    />
                  </div>
                </div>
              );
            })}
          </div> : <p className="text-[11px] text-[var(--color-muted)]">Signal details were not returned for this answer.</p>}

          <div className="mt-3 pt-2 border-t border-[var(--color-line)] flex justify-between items-center text-[10px] text-[var(--color-muted)]">
            <span>{signals ? "Signal breakdown" : "Details unavailable"}</span>
            <button
              onClick={() => setShowPopover(false)}
              className="text-[var(--color-primary)] hover:underline"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
