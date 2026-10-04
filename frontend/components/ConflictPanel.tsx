"use client";

import React from "react";
import { AlertCircle, ExternalLink, Info } from "lucide-react";

export interface ConflictItem {
  id?: string;
  topic: string;
  side_a_doc: string;
  side_a_value: string;
  side_a_quote?: string;
  side_b_doc: string;
  side_b_value: string;
  side_b_quote?: string;
  severity?: string;
  explanation?: string;
  suggested_source?: string;
  resolution_suggestion?: string;
}

interface ConflictPanelProps {
  conflicts: ConflictItem[];
  onSelectDoc?: (docName: string) => void;
}

export default function ConflictPanel({ conflicts, onSelectDoc }: ConflictPanelProps) {
  if (!conflicts || conflicts.length === 0) return null;

  return (
    <div className="space-y-4 mb-4">
      {conflicts.map((c, idx) => {
        const topicLower = (c.topic || "specified terms").toLowerCase();
        return (
          <div
            key={idx}
            className="rounded-xl border border-[var(--color-line)] border-l-4 border-l-[var(--color-conflict)] bg-[var(--color-surface)] shadow-xs overflow-hidden"
          >
            {/* Header: Clear & Bold */}
            <div className="px-4 py-2.5 border-b border-[var(--color-line)] bg-[var(--color-conflict-soft)] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-[var(--color-conflict)] flex-shrink-0" />
                <h4 className="text-xs font-bold text-[var(--color-conflict)] uppercase tracking-wider">
                  Documents Disagree: {topicLower}
                </h4>
              </div>
              <span className="text-[10px] font-bold text-[var(--color-conflict)] bg-[var(--color-surface)] px-2 py-0.5 rounded-full border border-[var(--color-conflict)]/20">
                Discrepancy Detected
              </span>
            </div>

            {/* Side-by-side comparison columns */}
            <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Source A Column */}
              <div className="p-3 rounded-xl bg-[var(--color-card-soft)] border border-[var(--color-line)] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[var(--color-navy)] truncate">
                    {c.side_a_doc}
                  </span>
                  <button
                    onClick={() => onSelectDoc?.(c.side_a_doc)}
                    className="text-[11px] text-[var(--color-primary)] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <span>View</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>
                </div>

                <div className="text-lg font-bold font-mono text-[var(--color-navy)]">
                  {c.side_a_value}
                </div>

                <p className="text-xs text-[var(--color-muted)] leading-relaxed italic">
                  &ldquo;{c.side_a_quote || c.explanation || c.side_a_value}&rdquo;
                </p>
              </div>

              {/* Source B Column */}
              <div className="p-3 rounded-xl bg-[var(--color-conflict-soft)] border border-[var(--color-conflict)]/20 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[var(--color-conflict)] truncate">
                    {c.side_b_doc}
                  </span>
                  <button
                    onClick={() => onSelectDoc?.(c.side_b_doc)}
                    className="text-[11px] text-[var(--color-primary)] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <span>View</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>
                </div>

                <div className="text-lg font-bold font-mono text-[var(--color-conflict)]">
                  {c.side_b_value}
                </div>

                <p className="text-xs text-[var(--color-muted)] leading-relaxed italic">
                  &ldquo;{c.side_b_quote || c.explanation || c.side_b_value}&rdquo;
                </p>
              </div>
            </div>

            {/* Footer: Verdict & Suggested Reliable Source */}
            <div className="px-4 py-2.5 border-t border-[var(--color-line)] bg-[var(--color-panel)] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4 text-[var(--color-primary)] flex-shrink-0" />
                <span className="text-[var(--color-muted)]">
                  {c.suggested_source ? "Suggested source:" : "Source review:"} <strong className="text-[var(--color-ink)]">{c.suggested_source || "Compare both original records; no preferred source was returned."}</strong>
                </span>
              </div>

              {c.resolution_suggestion && (
                <span className="text-[11px] text-[var(--color-muted)]">
                  {c.resolution_suggestion}
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
