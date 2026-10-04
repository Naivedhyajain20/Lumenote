"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Calendar, AlertCircle, Clock } from "lucide-react";

interface TimelineEvent {
  date: string;
  label: string;
  predicate: string;
  value: string;
  document: string;
  has_conflict: boolean;
  severity?: string;
}

interface TimelineProps {
  apiUrl: string;
  onSelectDoc?: (docName: string) => void;
}

export default function Timeline({ apiUrl, onSelectDoc }: TimelineProps) {
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTimeline = useCallback(async () => {
    try {
      const res = await fetch(`${apiUrl}/timeline`);
      if (res.ok) {
        const data = await res.json();
        setEvents(data.events || []);
      }
    } catch (e) {
      console.error("Failed to load timeline:", e);
    } finally {
      setLoading(false);
    }
  }, [apiUrl]);

  useEffect(() => {
    // Load remote data; state updates occur after the request resolves.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchTimeline();
  }, [fetchTimeline]);

  if (loading) {
    return <div className="p-8 text-center text-xs text-[var(--color-muted)]">Loading chronological timeline...</div>;
  }

  return (
    <div className="h-full flex flex-col p-4 bg-[var(--color-surface)] rounded-2xl border border-[var(--color-line)] overflow-hidden">
      <div className="flex items-center justify-between pb-3 border-b border-[var(--color-line)] mb-4">
        <div>
          <h3 className="text-sm font-bold text-[var(--color-ink)] flex items-center gap-2">
            <Calendar className="w-4 h-4 text-blue-400" /> Multi-Document Chronological Timeline
          </h3>
          <p className="text-xs text-[var(--color-muted)]">Events color-coded by source. Red markers indicate conflicting event records.</p>
        </div>
        <span className="text-xs px-2.5 py-1 rounded-full bg-[var(--color-card-soft)] border border-[var(--color-line)] text-[var(--color-ink)]">
          {events.length} Dated Events
        </span>
      </div>

      <div className="flex-1 overflow-y-auto pr-2 space-y-6">
        {events.length === 0 ? (
          <div className="p-8 text-center text-xs text-[var(--color-muted)]">No dated facts extracted yet.</div>
        ) : (
          <div className="relative border-l-2 border-[var(--color-line)] ml-4 space-y-6">
            {events.map((ev, idx) => {
              const isConflicting = ev.has_conflict;

              return (
                <div key={idx} className="relative pl-6">
                  {/* Timeline marker icon */}
                  <div
                    className={`absolute -left-[9px] top-1.5 w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                      isConflicting
                        ? "bg-rose-500 border-rose-300 ring-4 ring-rose-500/20 shadow-lg shadow-rose-500/50"
                        : "bg-blue-600 border-[var(--color-page)]"
                    }`}
                  />

                  <div
                    className={`p-3.5 rounded-xl border transition-all ${
                      isConflicting
                        ? "bg-rose-950/20 border-rose-500/40 shadow-md shadow-rose-950/10"
                        : "bg-[var(--color-panel)] border-[var(--color-line)]"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <span className="font-mono text-xs font-bold text-blue-400 flex items-center gap-1.5">
                        <Clock className="w-3 h-3 text-[var(--color-muted)]" /> {ev.date}
                      </span>
                      {isConflicting && (
                        <span className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                          <AlertCircle className="w-3 h-3 text-rose-400" /> CONFLICT RECORD
                        </span>
                      )}
                    </div>

                    <h4 className="text-xs font-semibold text-[var(--color-ink)] mb-0.5">
                      {ev.label} - <span className="text-[var(--color-muted)] font-normal">{ev.predicate}</span>
                    </h4>

                    <div className="text-xs font-mono font-medium text-amber-300 bg-[var(--color-panel)] px-2 py-1 rounded border border-[var(--color-line)] inline-block mb-2">
                      &quot;{ev.value}&quot;
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-[var(--color-muted)] pt-2 border-t border-[var(--color-line)]">
                      <span>Source: <strong className="text-[var(--color-muted)]">{ev.document}</strong></span>
                      {onSelectDoc && (
                        <button
                          onClick={() => onSelectDoc(ev.document)}
                          className="text-blue-400 hover:text-blue-300 text-[10px] underline cursor-pointer"
                        >
                          View Source
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
