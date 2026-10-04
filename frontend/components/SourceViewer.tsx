"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  FileText, ChevronLeft, ChevronRight,
  ExternalLink, Image as ImageIcon, Bookmark
} from "lucide-react";
import { DocItem } from "./DocTrustCard";

export interface HighlightTarget {
  docName: string;
  page: number;
  quote?: string;
  bboxJson?: string;
}

interface PageChunk {
  id: string;
  page: number;
  section_title?: string;
  text: string;
  bbox_json?: string;
  is_ocr?: boolean;
}

interface SourceViewerProps {
  currentDoc: DocItem | null;
  targetHighlight: HighlightTarget | null;
  apiUrl: string;
  isMobileSlideOver?: boolean;
  onCloseMobile?: () => void;
}

export default function SourceViewer({
  currentDoc,
  targetHighlight,
  apiUrl,
  isMobileSlideOver = false,
  onCloseMobile,
}: SourceViewerProps) {
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageChunks, setPageChunks] = useState<PageChunk[]>([]);
  const [loadingChunks, setLoadingChunks] = useState(false);
  const highlightedRef = useRef<HTMLDivElement>(null);

  const fetchChunks = async (docId: string, pageNum: number) => {
    setLoadingChunks(true);
    try {
      const res = await fetch(`${apiUrl}/documents/${docId}/chunks?page=${pageNum}`);
      if (!res.ok) throw new Error(`Could not load this page (${res.status}).`);
      const data = await res.json();
      setPageChunks(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("Failed to fetch page chunks:", e);
      setPageChunks([]);
    } finally {
      setLoadingChunks(false);
    }
  };

  useEffect(() => {
    if (targetHighlight?.page) {
      // Sync the selected page from a citation interaction.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCurrentPage(targetHighlight.page);
    }
  }, [targetHighlight]);

  useEffect(() => {
    // Fetch the selected page; state updates occur after the request resolves.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (currentDoc) void fetchChunks(currentDoc.id, currentPage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentDoc?.id, currentPage, apiUrl]);

  useEffect(() => {
    if (highlightedRef.current) {
      setTimeout(() => {
        highlightedRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 150);
    }
  }, [targetHighlight, pageChunks]);

  if (!currentDoc) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 text-center card-base bg-[var(--color-surface)]">
        <div className="w-12 h-12 rounded-full bg-[var(--color-card-soft)] text-[var(--color-primary)] flex items-center justify-center mb-3">
          <FileText className="w-6 h-6" />
        </div>
        <h4 className="text-sm font-bold text-[var(--color-navy)] mb-1">Source Evidence Viewer</h4>
        <p className="text-xs text-[var(--color-muted)] max-w-xs leading-relaxed">
          Select any document or click a citation chip to view the exact original source with passage highlighting.
        </p>
      </div>
    );
  }

  const maxPages = currentDoc.page_count || 1;
  const isImage = ["jpg", "jpeg", "png"].includes(currentDoc.file_type?.toLowerCase());

  // Helper to highlight only the specific cited phrase inside text
  const renderHighlightedText = (text: string, quote?: string) => {
    if (!quote || quote.length < 5) return <span>{text}</span>;

    // Clean up quote for searching
    const cleanQuote = quote.replace(/^[“"']|[”"']$/g, "").trim();
    const searchSnippet = cleanQuote.slice(0, 35).toLowerCase();

    const lowerText = text.toLowerCase();
    const matchIndex = lowerText.indexOf(searchSnippet);

    if (matchIndex === -1) {
      return <span>{text}</span>;
    }

    const before = text.slice(0, matchIndex);
    const matchLength = Math.min(cleanQuote.length, text.length - matchIndex);
    const matched = text.slice(matchIndex, matchIndex + matchLength);
    const after = text.slice(matchIndex + matchLength);

    return (
      <span>
        {before}
        <mark className="bg-amber-200 dark:bg-amber-400/30 text-slate-950 dark:text-amber-100 font-semibold px-1 py-0.5 rounded border-b-2 border-amber-500 shadow-xs">
          {matched}
        </mark>
        {after}
      </span>
    );
  };

  return (
    <div className="h-full flex flex-col card-base bg-[var(--color-surface)] overflow-hidden shadow-xs border border-[var(--color-line)]">
      {/* ── Top Header Toolbar ── */}
      <div className="px-4 py-3 border-b border-[var(--color-line)] bg-[var(--color-panel)] flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-[var(--color-primary)] text-white flex items-center justify-center flex-shrink-0">
            {isImage ? <ImageIcon className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
          </div>
          <div className="min-w-0">
            <h4 className="text-xs font-bold text-[var(--color-navy)] truncate" title={currentDoc.filename}>
              {currentDoc.filename}
            </h4>
            <div className="flex items-center gap-2 text-[11px] text-[var(--color-muted)]">
              <span>Page {currentPage} of {maxPages}</span>
              <span>·</span>
              <span className="font-semibold text-[var(--color-primary)]">
                {Math.round((currentDoc.ocr_quality || 1.0) * 100)}% OCR Quality
              </span>
            </div>
          </div>
        </div>

        {/* Page Nav & Controls */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="flex items-center bg-[var(--color-surface)] border border-[var(--color-line)] rounded-lg px-1 py-0.5 text-xs">
            <button
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="p-1 text-[var(--color-muted)] hover:text-[var(--color-ink)] disabled:opacity-30 cursor-pointer"
              title="Previous Page"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <span className="font-mono text-xs font-bold px-2 text-[var(--color-ink)]">
              {currentPage} / {maxPages}
            </span>
            <button
              disabled={currentPage >= maxPages}
              onClick={() => setCurrentPage((p) => Math.min(maxPages, p + 1))}
              className="p-1 text-[var(--color-muted)] hover:text-[var(--color-ink)] disabled:opacity-30 cursor-pointer"
              title="Next Page"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <a
            href={`${apiUrl}/documents/${currentDoc.id}/file`}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1.5 rounded-lg bg-[var(--color-surface)] border border-[var(--color-line)] text-[var(--color-muted)] hover:text-[var(--color-primary)] transition-colors"
            title="Open raw document"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </a>

          {isMobileSlideOver && onCloseMobile && (
            <button
              onClick={onCloseMobile}
              className="px-2.5 py-1 rounded bg-[var(--color-card-soft)] text-xs font-bold text-[var(--color-ink)]"
            >
              Done
            </button>
          )}
        </div>
      </div>

      {/* ── Active Citation Indicator Banner (Clean, Calm, Not Blinding) ── */}
      {targetHighlight && (
        <div className="px-4 py-2 bg-[var(--color-card-soft)] border-b border-[var(--color-line)] flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 truncate">
            <Bookmark className="w-3.5 h-3.5 text-[var(--color-primary)] flex-shrink-0" />
            <span className="font-semibold text-[var(--color-navy)] truncate">
              Cited on Page {targetHighlight.page}
            </span>
            {targetHighlight.quote && (
              <span className="text-[var(--color-muted)] italic truncate hidden sm:inline text-[11px]">
                &ldquo;{targetHighlight.quote.slice(0, 45)}…&rdquo;
              </span>
            )}
          </div>
          <span className="text-[10px] font-bold text-[var(--color-verified)] bg-[var(--color-verified-soft)] px-2 py-0.5 rounded-full flex-shrink-0 border border-[var(--color-verified)]/20">
            Passage Located
          </span>
        </div>
      )}

      {/* ── Main Document Reading Sheet (Paper look) ── */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-[var(--color-page)] space-y-4">
        {/* Scanned Image Preview */}
        {isImage && (
          <div className="p-3 bg-[var(--color-surface)] rounded-xl border border-[var(--color-line)] shadow-xs flex items-center justify-center">
            {/* This API host is configurable; keep the remote source image unoptimized. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`${apiUrl}/documents/${currentDoc.id}/file`}
              alt={currentDoc.filename}
              className="max-h-72 w-auto object-contain rounded border border-[var(--color-line)]"
            />
          </div>
        )}

        {/* Text passages list */}
        <div className="space-y-3">
          {loadingChunks ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-20 rounded-xl bg-[var(--color-surface)] border border-[var(--color-line)] animate-pulse" />
              ))}
            </div>
          ) : pageChunks.length === 0 ? (
            <div className="p-8 text-center text-xs text-[var(--color-muted)] bg-[var(--color-surface)] rounded-xl border border-[var(--color-line)]">
              No text passages available for page {currentPage}.
            </div>
          ) : (
            pageChunks.map((chunk, idx) => {
              const isCited =
                targetHighlight?.quote &&
                (chunk.text.toLowerCase().includes(targetHighlight.quote.slice(0, 30).toLowerCase()) ||
                  targetHighlight.quote.toLowerCase().includes(chunk.text.slice(0, 30).toLowerCase()));

              return (
                <div
                  key={idx}
                  ref={isCited ? highlightedRef : null}
                  className={`p-4 rounded-xl text-xs md:text-sm leading-relaxed transition-all border ${
                    isCited
                      ? "bg-[var(--color-surface)] border-2 border-[var(--color-primary)] shadow-md ring-2 ring-[var(--color-primary)]/10"
                      : "bg-[var(--color-surface)] text-[var(--color-ink)] border-[var(--color-line)] hover:border-[var(--color-muted)]/40"
                  }`}
                >
                  <div className="flex items-center justify-between text-[10px] text-[var(--color-muted)] font-mono mb-2 pb-1.5 border-b border-[var(--color-line)]">
                    <span className="font-semibold text-[var(--color-navy)]">
                      Passage #{idx + 1} · Page {currentPage}
                    </span>
                    {isCited && (
                      <span className="font-bold text-[var(--color-primary)] uppercase tracking-wider bg-[var(--color-card-soft)] px-2 py-0.5 rounded-full">
                        Cited Evidence
                      </span>
                    )}
                  </div>

                  <p className="whitespace-pre-wrap font-sans text-[var(--color-ink)] leading-relaxed">
                    {isCited ? renderHighlightedText(chunk.text, targetHighlight?.quote) : chunk.text}
                  </p>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
