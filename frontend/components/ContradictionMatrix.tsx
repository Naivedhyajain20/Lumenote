"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Grid, AlertOctagon, CheckCircle2, X } from "lucide-react";
import { ConflictItem } from "./ConflictPanel";

interface ContradictionMatrixProps {
  apiUrl: string;
}

export default function ContradictionMatrix({ apiUrl }: ContradictionMatrixProps) {
  const [docNames, setDocNames] = useState<string[]>([]);
  const [matrix, setMatrix] = useState<Record<string, Record<string, ConflictItem[]>>>({});
  const [selectedConflicts, setSelectedConflicts] = useState<{
    docA: string;
    docB: string;
    conflicts: ConflictItem[];
  } | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchMatrix = useCallback(async () => {
    try {
      const res = await fetch(`${apiUrl}/conflicts`);
      if (res.ok) {
        const data = await res.json();
        setDocNames(data.document_names || []);
        setMatrix(data.matrix || {});
      }
    } catch (e) {
      console.error("Failed to load contradiction matrix:", e);
    } finally {
      setLoading(false);
    }
  }, [apiUrl]);

  useEffect(() => {
    // Load remote data; state updates occur after the request resolves.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchMatrix();
  }, [fetchMatrix]);

  if (loading) {
    return <div className="p-8 text-center text-xs text-[var(--color-muted)]">Loading contradiction matrix...</div>;
  }

  return (
    <div className="h-full flex flex-col p-4 bg-[var(--color-surface)] rounded-2xl border border-[var(--color-line)] overflow-hidden">
      <div className="pb-3 border-b border-[var(--color-line)] mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-[var(--color-ink)] flex items-center gap-2">
            <Grid className="w-4 h-4 text-rose-400" /> Cross-Document Contradiction Matrix
          </h3>
          <p className="text-xs text-[var(--color-muted)]">
            Pairwise disagreement grid. Red cells highlight active factual contradictions between documents.
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        <div className="inline-block min-w-full align-middle">
          <table className="border-collapse text-xs">
            <thead>
              <tr>
                <th className="p-2 border border-[var(--color-line)] bg-[var(--color-card-soft)] text-[var(--color-muted)] text-left font-mono text-[10px]">
                  DOC A \ DOC B
                </th>
                {docNames.map((d, i) => (
                  <th
                    key={i}
                    className="p-2 border border-[var(--color-line)] bg-[var(--color-card-soft)] text-[var(--color-ink)] font-medium max-w-[130px] truncate"
                    title={d}
                  >
                    {d.slice(0, 14)}...
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {docNames.map((rowDoc, rIdx) => (
                <tr key={rIdx}>
                  <td className="p-2 border border-[var(--color-line)] bg-[var(--color-card-soft)] font-medium text-[var(--color-ink)] max-w-[130px] truncate" title={rowDoc}>
                    {rowDoc.slice(0, 14)}...
                  </td>
                  {docNames.map((colDoc, cIdx) => {
                    if (rowDoc === colDoc) {
                      return (
                        <td key={cIdx} className="p-2 border border-[var(--color-line)] bg-[var(--color-panel)] text-center text-[var(--color-muted)]">
                          —
                        </td>
                      );
                    }

                    const conflicts = (matrix[rowDoc] && matrix[rowDoc][colDoc]) || [];
                    const hasConflict = conflicts.length > 0;

                    return (
                      <td
                        key={cIdx}
                        onClick={() => {
                          if (hasConflict) {
                            setSelectedConflicts({ docA: rowDoc, docB: colDoc, conflicts });
                          }
                        }}
                        className={`p-2 border text-center transition-all ${
                          hasConflict
                            ? "bg-rose-950/60 border-rose-500/50 hover:bg-rose-900/80 cursor-pointer font-bold text-rose-300 shadow-sm"
                            : "bg-[var(--color-surface)] border-[var(--color-line)] text-emerald-400/80 hover:bg-[var(--color-card-soft)]/40"
                        }`}
                      >
                        {hasConflict ? (
                          <span className="flex items-center justify-center gap-1">
                            <AlertOctagon className="w-3.5 h-3.5 text-rose-400" />
                            {conflicts.length}
                          </span>
                        ) : (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500/40 mx-auto" />
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Selected conflict detail modal/drawer */}
      {selectedConflicts && (
        <div className="mt-4 p-4 rounded-xl bg-[var(--color-card-soft)] border border-rose-500/40 shadow-2xl relative animate-in fade-in">
          <button
            onClick={() => setSelectedConflicts(null)}
            className="absolute right-3 top-3 text-[var(--color-muted)] hover:text-[var(--color-ink)]"
          >
            <X className="w-4 h-4" />
          </button>

          <h4 className="text-xs font-bold text-rose-300 flex items-center gap-1.5 mb-2">
            <AlertOctagon className="w-4 h-4 text-rose-400" />
            Contradictions between: {selectedConflicts.docA} & {selectedConflicts.docB}
          </h4>

          <div className="space-y-2">
            {selectedConflicts.conflicts.map((c, idx) => (
              <div key={idx} className="p-3 rounded-lg bg-[var(--color-panel)] border border-[var(--color-line)] text-xs">
                <span className="font-semibold text-[var(--color-ink)] block mb-1">{c.topic}</span>
                <p className="text-[var(--color-ink)] text-[11px] mb-2">{c.explanation}</p>
                <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                  <div className="p-2 bg-[var(--color-card-soft)] rounded border border-[var(--color-line)] text-amber-300">
                    <span className="text-[10px] text-[var(--color-muted)] block">{c.side_a_doc}:</span>
                    &quot;{c.side_a_value}&quot;
                  </div>
                  <div className="p-2 bg-[var(--color-card-soft)] rounded border border-[var(--color-line)] text-rose-300">
                    <span className="text-[10px] text-[var(--color-muted)] block">{c.side_b_doc}:</span>
                    &quot;{c.side_b_value}&quot;
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
