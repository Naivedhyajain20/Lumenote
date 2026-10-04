"use client";

import React, { useState, useRef, useEffect } from "react";
import { FileText, AlertCircle, CornerDownLeft, CheckCircle2 } from "lucide-react";
import ConfidenceBadge from "./ConfidenceBadge";
import ConflictPanel, { ConflictItem } from "./ConflictPanel";
import { HighlightTarget } from "./SourceViewer";

export interface CitationItem {
  label: string;
  document_id: string;
  doc_name: string;
  page: number;
  quote: string;
  bbox_json?: string;
}

interface ConfidenceSignals {
  retrieval_strength: number;
  claim_support: number;
  source_agreement: number;
  doc_reliability: number;
  conflict_penalty?: number;
}

export interface MessageItem {
  id: string;
  question: string;
  answer: string;
  confidence: {
    score: number;
    band: string;
    signals?: ConfidenceSignals;
    explanation?: string;
  };
  citations: CitationItem[];
  conflicts: ConflictItem[];
  abstained: boolean;
  missing_info: string[];
  verified_claims?: {
    verified: number;
    total: number;
  };
  follow_ups?: string[];
}

interface ChatPanelProps {
  messages: MessageItem[];
  onSendMessage: (query: string) => Promise<void>;
  onSelectCitation: (target: HighlightTarget) => void;
  onSelectDoc?: (docName: string) => void;
  isLoading: boolean;
  statusLine: string;
  errorMessage?: string;
}

const INQUIRY_CARDS = [
  {
    question: "When was the furniture delivered?",
    tag: "Delivery Conflict",
    badge: "15 Feb vs 20 Feb vs 28 Feb",
    icon: "🚚",
  },
  {
    question: "How much advance was paid?",
    tag: "Payment Conflict",
    badge: "₹2,50,000 vs ₹2,00,000",
    icon: "💰",
  },
  {
    question: "What is the warranty period?",
    tag: "Honest Abstention",
    badge: "Warranty Clause Missing",
    icon: "🛡️",
  },
];

const DEFAULT_FOLLOW_UPS: Record<string, string[]> = {
  "furniture": [
    "What penalty applies for delivery after 15 Feb 2026?",
    "Why did Orion Interiors claim goods arrived on 28 Feb?",
    "Did Northwind provide proof of delivery for 20 Feb?",
  ],
  "advance": [
    "Why does the invoice only record INR 2,00,000 advance?",
    "Does the bank payment receipt show INR 2,50,000?",
    "When is the remaining 50% balance legally payable?",
  ],
  "warranty": [
    "Is there an unattached warranty schedule mentioned?",
    "What replacement remedies apply for damaged goods?",
    "What does Indian law say when warranty terms are omitted?",
  ],
};

function getFollowUps(question: string, explicitFollowUps?: string[]): string[] {
  if (explicitFollowUps && explicitFollowUps.length >= 3) return explicitFollowUps.slice(0, 3);
  const q = question.toLowerCase();
  if (q.includes("deliver") || q.includes("date") || q.includes("furniture")) {
    return DEFAULT_FOLLOW_UPS["furniture"];
  }
  if (q.includes("advance") || q.includes("paid") || q.includes("amount") || q.includes("inr")) {
    return DEFAULT_FOLLOW_UPS["advance"];
  }
  if (q.includes("warranty")) {
    return DEFAULT_FOLLOW_UPS["warranty"];
  }
  return [
    "What is the most legally authoritative document?",
    "Are there other conflicting clauses in the emails?",
    "What liquidated damages are stipulated in Clause 3.2?",
  ];
}

/* ─── Friendly Abstention Card ─── */
function AbstentionCard({ missing }: { missing: string[] }) {
  const missingText = missing.length > 0
    ? missing.join(", ")
    : "the requested detail or a supporting record";

  return (
    <div className="rounded-xl border border-[var(--color-line)] border-l-4 border-l-[var(--color-uncertain)] bg-[var(--color-uncertain-soft)] p-4 mb-4 shadow-xs">
      <div className="flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-[var(--color-uncertain)] flex-shrink-0 mt-0.5" />
        <div className="space-y-1.5 flex-1">
          <h4 className="text-xs font-bold text-[var(--color-uncertain)] uppercase tracking-wider">
            Not enough evidence in the available records
          </h4>
          <p className="text-xs text-[var(--color-ink)] leading-relaxed">
            <strong className="text-[var(--color-navy)]">Missing from records: </strong>
            {missingText}
          </p>
          <div className="pt-1 text-[11px] text-[var(--color-muted)] flex items-center gap-1.5">
            <span className="font-semibold text-[var(--color-navy)]">Recommended Action: </span>
            Request a supporting document or written clarification from the relevant record holder.
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ChatPanel({
  messages,
  onSendMessage,
  onSelectCitation,
  onSelectDoc,
  isLoading,
  statusLine,
  errorMessage,
}: ChatPanelProps) {
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading, statusLine]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isLoading) {
      onSendMessage(input.trim());
      setInput("");
    }
  };

  const handleQuickQuestion = (q: string) => {
    if (!isLoading) {
      onSendMessage(q);
    }
  };

  const renderAnswerWithCitations = (msg: MessageItem) => {
    const text = msg.answer;
    const parts = text.split(/(\[C\d+\])/g);

    return parts.map((part, i) => {
      const match = part.match(/\[C(\d+)\]/);
      if (match) {
        const label = `C${match[1]}`;
        const cit = msg.citations.find((c) => c.label === label || c.label === `[C${match[1]}]`);
        const docName = cit ? cit.doc_name.replace(/^\d+_/, "").replace(/\.[^/.]+$/, "") : "Document";
        const pageNum = cit ? cit.page : 1;
        const chipText = `[${docName}, p.${pageNum}]`;

        return (
          <span key={i} className="relative group inline-block mx-1">
            <button
              onClick={() =>
                cit &&
                onSelectCitation({
                  docName: cit.doc_name,
                  page: cit.page,
                  quote: cit.quote,
                  bboxJson: cit.bbox_json,
                })
              }
              className="citation-chip bg-[var(--color-card-soft)] text-[var(--color-primary)] hover:bg-[var(--color-highlight)] hover:text-slate-900 border border-[var(--color-line)] px-2 py-0.5 rounded-md font-mono text-xs font-semibold shadow-2xs transition-all cursor-pointer"
              title={cit ? `"${cit.quote}"` : "Click to view original passage"}
            >
              {chipText}
            </button>
          </span>
        );
      }
      return <span key={i}>{part}</span>;
    });
  };

  return (
    <div className="h-full flex flex-col card-base bg-[var(--color-surface)] border border-[var(--color-line)] overflow-hidden shadow-xs">
      {/* ── TOP: Step 2 Guided Inquiry Cards ── */}
      <div className="p-3 border-b border-[var(--color-line)] bg-[var(--color-panel)]">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-bold text-[var(--color-navy)] uppercase tracking-wider">
            Step 2: Choose an Inquiry or Ask Your Own
          </span>
          <span className="text-[10px] text-[var(--color-muted)]">Click any inquiry to run</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {INQUIRY_CARDS.map((card, idx) => (
            <button
              key={idx}
              onClick={() => handleQuickQuestion(card.question)}
              disabled={isLoading}
              className="p-2.5 rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] hover:border-[var(--color-primary)] hover:bg-[var(--color-card-soft)] text-left transition-all cursor-pointer group disabled:opacity-50"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-base">{card.icon}</span>
                <span className="text-[9px] font-bold uppercase tracking-wider text-[var(--color-muted)] group-hover:text-[var(--color-primary)]">
                  {card.tag}
                </span>
              </div>
              <h4 className="text-xs font-bold text-[var(--color-navy)] group-hover:text-[var(--color-primary)] leading-snug">
                {card.question}
              </h4>
              <p className="text-[10px] font-mono text-[var(--color-muted)] mt-1 truncate">
                {card.badge}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* ── CENTER: Investigation Thread Stream ── */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 bg-[var(--color-page)]">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-8 max-w-md mx-auto">
            <div className="w-12 h-12 rounded-full bg-[var(--color-card-soft)] text-[var(--color-primary)] flex items-center justify-center mb-3">
              <FileText className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-[var(--color-navy)] mb-1">
              Select an Inquiry Above to Begin
            </h3>
            <p className="text-xs text-[var(--color-muted)] leading-relaxed">
              Ask about the indexed records, inspect source citations, and review any detected contradictions.
            </p>
          </div>
        ) : (
          messages.map((msg, index) => {
            const verifiedCount = msg.verified_claims?.verified;
            const totalClaims = msg.verified_claims?.total;
            const followUps = getFollowUps(msg.question, msg.follow_ups);

            return (
              <div key={msg.id || index} className="space-y-4 p-4 md:p-5 card-base bg-[var(--color-surface)] border border-[var(--color-line)] shadow-xs rounded-xl">
                {/* 1. Question Title */}
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[var(--color-primary)]" />
                  <h3 className="text-base md:text-lg font-bold text-[var(--color-navy)] tracking-tight">
                    {msg.question}
                  </h3>
                </div>

                {/* 2. Discrepancy / Conflict Panel (Above answer) */}
                {msg.conflicts && msg.conflicts.length > 0 && (
                  <ConflictPanel conflicts={msg.conflicts} onSelectDoc={onSelectDoc} />
                )}

                {/* 3. Abstention Alert (When missing) */}
                {msg.abstained && (
                  <AbstentionCard missing={msg.missing_info} />
                )}

                {/* 4. Plain Readable Answer with Citations */}
                <div className="p-4 rounded-xl bg-[var(--color-card-soft)] text-xs md:text-sm text-[var(--color-ink)] leading-relaxed border border-[var(--color-line)]">
                  {renderAnswerWithCitations(msg)}
                </div>

                {/* 5. Verification line & Confidence */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-[var(--color-line)]">
                  <div className="flex items-center gap-3">
                    <ConfidenceBadge confidence={msg.confidence} />
                    {verifiedCount !== undefined && totalClaims !== undefined && <span className="text-xs text-[var(--color-muted)] flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[var(--color-verified)]" />
                      Claims verified: <strong className="font-mono text-[var(--color-ink)]">{verifiedCount} of {totalClaims}</strong>
                    </span>}
                  </div>
                </div>

                {/* 6. Follow-up suggestions */}
                <div className="pt-2">
                  <p className="text-[11px] font-bold text-[var(--color-muted)] uppercase tracking-wider mb-1.5">
                    Suggested Next Inquiries:
                  </p>
                  <div className="space-y-1">
                    {followUps.map((fu, fuIdx) => (
                      <button
                        key={fuIdx}
                        onClick={() => handleQuickQuestion(fu)}
                        disabled={isLoading}
                        className="block text-xs text-[var(--color-primary)] hover:underline text-left cursor-pointer transition-colors"
                      >
                        &rarr; {fu}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            );
          })
        )}

        {/* Loading status */}
        {isLoading && (
          <div className="p-4 rounded-xl bg-[var(--color-surface)] border border-[var(--color-line)] text-xs text-[var(--color-muted)] flex items-center gap-3 shadow-xs">
            <div className="w-4 h-4 border-2 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
            <span>{statusLine || "Cross-referencing dispute records and checking contradiction matrix..."}</span>
          </div>
        )}

        <div ref={scrollRef} />
      </div>

      {errorMessage && (
        <div role="alert" className="mx-3 mb-2 rounded-lg border border-[var(--color-conflict)]/30 bg-[var(--color-conflict-soft)] px-3 py-2.5 text-xs text-[var(--color-ink)]">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 text-[var(--color-conflict)]" />
            <p>{errorMessage}</p>
          </div>
        </div>
      )}

      {/* ── BOTTOM: Inquiry Text Input ── */}
      <form onSubmit={handleSubmit} className="p-3 border-t border-[var(--color-line)] bg-[var(--color-surface)]">
        <div className="flex items-center gap-2 card-base bg-[var(--color-panel)] p-1.5 focus-within:border-[var(--color-primary)] transition-colors">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isLoading}
            placeholder="Ask a question about the evidence in this case…"
            className="flex-1 px-3 py-1.5 text-xs text-[var(--color-ink)] bg-transparent outline-none placeholder:text-[var(--color-muted)]"
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="btn-pill btn-pill-primary px-4 py-1.5 text-xs disabled:opacity-40"
          >
            <span>Ask</span>
            <CornerDownLeft className="w-3.5 h-3.5 ml-0.5" />
          </button>
        </div>
      </form>
    </div>
  );
}
