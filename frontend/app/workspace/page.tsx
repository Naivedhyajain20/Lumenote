"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Navbar from "@/components/Navbar";
import DocTrustCard, { DocItem } from "@/components/DocTrustCard";
import ChatPanel, { MessageItem } from "@/components/ChatPanel";
import SourceViewer, { HighlightTarget } from "@/components/SourceViewer";
import Timeline from "@/components/Timeline";
import EntityList from "@/components/EntityList";
import ContradictionMatrix from "@/components/ContradictionMatrix";
import EvidenceBoard from "@/components/EvidenceBoard";
import EvaluationDashboard from "@/components/EvaluationDashboard";
import {
  MessageSquare, Calendar, Users, Grid, BookMarked, Award,
  RefreshCw, FolderOpen, Eye, Check, Download, Upload
} from "lucide-react";
import Link from "next/link";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
type ActiveTab = "chat" | "matrix" | "timeline" | "entities" | "board" | "eval";

const WORKSPACE_TABS: { id: ActiveTab; label: string; icon: React.ElementType }[] = [
  { id: "chat", label: "Investigation Thread", icon: MessageSquare },
  { id: "matrix", label: "Contradiction Matrix", icon: Grid },
  { id: "timeline", label: "Timeline", icon: Calendar },
  { id: "entities", label: "Entities", icon: Users },
  { id: "board", label: "Evidence Board", icon: BookMarked },
  { id: "eval", label: "Evaluation", icon: Award },
];

export default function WorkspacePage() {
  const [documents, setDocuments] = useState<DocItem[]>([]);
  const [selectedDoc, setSelectedDoc] = useState<DocItem | null>(null);
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [activeTab, setActiveTab] = useState<ActiveTab>("chat");
  const [highlightTarget, setHighlightTarget] = useState<HighlightTarget | null>(null);
  const [isLoadingAnswer, setIsLoadingAnswer] = useState(false);
  const [statusLine, setStatusLine] = useState("");
  const [mobileViewerOpen, setMobileViewerOpen] = useState(false);
  const [documentsLoading, setDocumentsLoading] = useState(true);
  const [workspaceError, setWorkspaceError] = useState("");
  const [uploadStatus, setUploadStatus] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const uploadInputRef = useRef<HTMLInputElement>(null);
  const initialized = useRef(false);
  const readyDocumentCount = documents.filter((doc) => doc.status === "ready").length;

  const loadDocuments = useCallback(async (): Promise<DocItem[]> => {
    setDocumentsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/documents`);
      if (!res.ok) throw new Error(`Could not load evidence files (${res.status}).`);
      const data = await res.json();
      if (Array.isArray(data)) {
        const filtered = data as DocItem[];
        setDocuments(filtered);

        if (filtered.length > 0) {
          const contractDoc = filtered.find((d: DocItem) => d.status === "ready" && d.filename.toLowerCase().includes("contract")) || filtered.find((d: DocItem) => d.status === "ready") || filtered[0];
          setSelectedDoc((current) => current || contractDoc);
        }
        if (filtered.length === 0) setWorkspaceError("No evidence files are available yet. Launch the demo case or upload documents to begin.");
        return filtered;
      } else {
        throw new Error("The evidence service returned an unexpected response.");
      }
    } catch (e) {
      setWorkspaceError(e instanceof Error ? e.message : "Unable to connect to the evidence service.");
      return [];
    } finally {
      setDocumentsLoading(false);
    }
  }, []);

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    event.target.value = "";
    if (files.length === 0) return;

    const formData = new FormData();
    files.forEach((file) => formData.append("files", file));
    setIsUploading(true);
    setUploadStatus("");
    setWorkspaceError("");
    try {
      const response = await fetch(`${API_BASE}/documents`, { method: "POST", body: formData });
      if (!response.ok) {
        const detail = await response.json().catch(() => null);
        throw new Error(detail?.detail || `The selected files could not be uploaded (${response.status}).`);
      }
      const result = await response.json();
      const refreshedDocuments = await loadDocuments();
      const firstUploaded = Array.isArray(result) ? result[0] : null;
      const uploadedDocument = refreshedDocuments.find((doc) => doc.id === firstUploaded?.id);
      if (uploadedDocument) {
        setSelectedDoc(uploadedDocument);
        setHighlightTarget(null);
      }
      const failedCount = Array.isArray(result) ? result.filter((doc) => doc.status !== "ready").length : 0;
      const successCount = Array.isArray(result) ? result.length - failedCount : 0;
      setUploadStatus(`${successCount} file${successCount === 1 ? "" : "s"} indexed${failedCount ? ` · ${failedCount} need attention` : ""}.`);
    } catch (e) {
      setWorkspaceError(e instanceof Error ? e.message : "Unable to upload the selected files.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleCitationClick = useCallback((target: HighlightTarget) => {
    setHighlightTarget(target);
    const match = documents.find(
      (d) =>
        d.filename.toLowerCase() === target.docName.toLowerCase() ||
        d.filename.toLowerCase().includes(target.docName.toLowerCase()) ||
        target.docName.toLowerCase().includes(d.filename.toLowerCase())
    );
    if (match) setSelectedDoc(match);
    if (window.innerWidth < 900) setMobileViewerOpen(true);
  }, [documents]);

  const handleSendMessage = useCallback(async (query: string) => {
    if (!query.trim()) return;
    setIsLoadingAnswer(true);
    setWorkspaceError("");
    setStatusLine(`Cross-examining dispute records for: "${query}"...`);
    try {
      const res = await fetch(`${API_BASE}/ask`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: query }),
      });
      if (!res.ok) {
        const detail = await res.json().catch(() => null);
        throw new Error(detail?.detail || `The inquiry could not be completed (${res.status}).`);
      }
      const data = await res.json();
      if (typeof data.answer !== "string" || !data.confidence) {
        throw new Error("The inquiry service returned an incomplete answer. Please try again.");
      }
      const msg: MessageItem = {
        id: data.message_id || crypto.randomUUID(),
        question: query,
        answer: data.answer,
        confidence: data.confidence,
        citations: data.citations || [],
        conflicts: data.conflicts || [],
        abstained: data.abstained || false,
        missing_info: data.missing_info || [],
        verified_claims: data.verified_claims,
        follow_ups: data.follow_ups || [],
      };

      setMessages((prev) => [...prev, msg]);

      if (data.citations && data.citations.length > 0) {
        const c = data.citations[0];
        handleCitationClick({
          docName: c.doc_name,
          page: c.page,
          quote: c.quote,
          bboxJson: c.bbox_json,
        });
      }
    } catch (e) {
      setWorkspaceError(e instanceof Error ? e.message : "The inquiry failed. Please try again.");
    } finally {
      setIsLoadingAnswer(false);
      setStatusLine("");
    }
  }, [handleCitationClick]);

  const handleDocSelection = useCallback((docName: string) => {
    const match = documents.find(
      (d) =>
        d.filename.toLowerCase() === docName.toLowerCase() ||
        d.filename.toLowerCase().includes(docName.toLowerCase()) ||
        docName.toLowerCase().includes(d.filename.toLowerCase())
    );
    if (match) {
      setSelectedDoc(match);
      if (window.innerWidth < 900) {
        setMobileViewerOpen(true);
      }
    }
  }, [documents]);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    void loadDocuments().then((loaded) => {
      if (loaded.some((doc) => doc.status === "ready")) {
        void handleSendMessage("When was the furniture delivered?");
      }
    });
  }, [loadDocuments, handleSendMessage]);

  return (
    <div className="app-route-enter h-screen flex flex-col bg-[var(--color-page)] text-[var(--color-ink)] overflow-hidden font-sans">
      <Navbar />

      {/* ── Sequential 3-Step Guided Header ── */}
      <div className="border-b border-[var(--color-line)] bg-[var(--color-surface)] px-4 md:px-6 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs flex-shrink-0 shadow-2xs">
        <div className="flex items-center gap-2.5">
          <span className="font-bold text-[var(--color-navy)] uppercase tracking-wider text-[11px]">
            Active Dispute:
          </span>
          <span className="font-bold text-[var(--color-primary)] text-sm">
            Orion Interiors vs. Northwind Supplies
          </span>
          <span className="text-[var(--color-muted)] hidden md:inline">|</span>
          <span className="text-[var(--color-muted)] hidden md:inline">
            {readyDocumentCount} evidence {readyDocumentCount === 1 ? "record" : "records"} ready
          </span>
        </div>

        <div className="flex items-center gap-4">
          <Link
            href="/report"
            className="btn-pill btn-pill-outline py-1 px-3 text-xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Official PDF Report</span>
          </Link>
        </div>
      </div>

      {workspaceError && activeTab !== "chat" && <div role="alert" className="mx-4 mt-3 rounded-lg border border-[var(--color-conflict)]/30 bg-[var(--color-conflict-soft)] px-3 py-2 text-xs">{workspaceError}</div>}

      {/* ── Main 3-Column Workspace (Max 1440px) ── */}
      <main className="flex-1 w-full max-w-[1440px] mx-auto p-3 md:p-4 flex gap-3 overflow-hidden">
        {/* ── COLUMN 1 (Left 280px): Clean Document Drawer ── */}
        <aside className="w-[280px] flex-shrink-0 flex flex-col card-base bg-[var(--color-surface)] border border-[var(--color-line)] overflow-hidden hidden md:flex shadow-xs">
          {/* Header */}
          <div className="p-3 border-b border-[var(--color-line)] bg-[var(--color-panel)] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FolderOpen className="w-4 h-4 text-[var(--color-primary)]" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--color-navy)]">
                Step 1: Evidence Files ({documents.length})
              </h3>
            </div>
            <div className="flex items-center gap-1">
              <input ref={uploadInputRef} type="file" accept=".pdf,.docx,.txt,.md,.jpg,.jpeg,.png,.tiff" multiple className="sr-only" onChange={handleUpload} />
              <button type="button" onClick={() => uploadInputRef.current?.click()} disabled={isUploading} title="Add evidence files" aria-label="Add evidence files" className="p-1.5 rounded-md text-[var(--color-primary)] hover:bg-[var(--color-card-soft)] disabled:opacity-50">
                <Upload className="w-3.5 h-3.5" />
              </button>
              <button type="button" onClick={() => void loadDocuments()} disabled={documentsLoading} title="Refresh documents" aria-label="Refresh documents" className="p-1.5 rounded-md text-[var(--color-muted)] hover:bg-[var(--color-card-soft)] disabled:opacity-50">
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Simple, uncluttered document cards */}
          <div className="flex-1 overflow-y-auto p-2.5 space-y-2 no-scrollbar">
            {uploadStatus && <p role="status" className="rounded-lg bg-[var(--color-verified-soft)] px-2.5 py-2 text-[11px] text-[var(--color-verified)]">{uploadStatus}</p>}
            {isUploading && <p role="status" className="rounded-lg bg-[var(--color-card-soft)] px-2.5 py-2 text-[11px] text-[var(--color-muted)]">Uploading and indexing files…</p>}
            {documents.length === 0 ? (
              <div className="p-6 text-center text-xs text-[var(--color-muted)]">
                {documentsLoading ? "Loading evidence files…" : "No evidence files loaded. Use Launch Demo Case to add the sample records."}
              </div>
            ) : (
              documents.map((doc) => (
                <DocTrustCard
                  key={doc.id}
                  doc={doc}
                  isSelected={selectedDoc?.id === doc.id}
                  onSelect={(d) => {
                    setSelectedDoc(d);
                    setHighlightTarget(null);
                  }}
                />
              ))
            )}
          </div>

          {/* Footer note */}
          <div className="p-2.5 border-t border-[var(--color-line)] bg-[var(--color-panel)] text-[11px] text-[var(--color-muted)] flex items-center justify-between">
            <span>Click any file to inspect</span>
              <span className={`font-semibold flex items-center gap-1 ${readyDocumentCount ? "text-[var(--color-verified)]" : "text-[var(--color-muted)]"}`}>
              {documentsLoading ? "Checking…" : readyDocumentCount ? <><Check className="w-3 h-3" /> {readyDocumentCount} ready</> : "Not indexed"}
            </span>
          </div>
        </aside>

        {/* ── COLUMN 2 (Center): Investigation Thread & Tabs ── */}
        <section className="flex-1 min-w-0 flex flex-col overflow-hidden">
          {/* Tabs Bar */}
          <div className="flex items-center gap-1 mb-2.5 border-b border-[var(--color-line)] bg-[var(--color-surface)] px-2 rounded-t-xl overflow-x-auto no-scrollbar flex-shrink-0 shadow-2xs">
            {WORKSPACE_TABS.map(({ id, label, icon: Icon }) => {
              const active = activeTab === id;
              return (
                <button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  className={`flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-semibold whitespace-nowrap transition-all border-b-2 cursor-pointer ${
                    active
                      ? "border-[var(--color-primary)] text-[var(--color-primary)] bg-[var(--color-card-soft)]"
                      : "border-transparent text-[var(--color-muted)] hover:text-[var(--color-ink)]"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{label}</span>
                </button>
              );
            })}
          </div>

          {/* Active Tab Screen */}
          <div className="flex-1 overflow-hidden">
            {activeTab === "chat" && (
              <ChatPanel
                messages={messages}
                onSendMessage={handleSendMessage}
                onSelectCitation={handleCitationClick}
                onSelectDoc={handleDocSelection}
                isLoading={isLoadingAnswer}
                statusLine={statusLine}
                errorMessage={workspaceError}
              />
            )}
            {activeTab === "matrix" && <ContradictionMatrix apiUrl={API_BASE} />}
            {activeTab === "timeline" && (
              <Timeline
                apiUrl={API_BASE}
                onSelectDoc={(dn) => handleDocSelection(dn)}
              />
            )}
            {activeTab === "entities" && (
              <EntityList apiUrl={API_BASE} onSelectPassage={handleCitationClick} />
            )}
            {activeTab === "board" && <EvidenceBoard apiUrl={API_BASE} />}
            {activeTab === "eval" && <EvaluationDashboard apiUrl={API_BASE} />}
          </div>
        </section>

        {/* ── COLUMN 3 (Right 45%): Clean Document Viewer ── */}
        <aside className="w-[44%] lg:w-[42%] flex-shrink-0 overflow-hidden hidden md:block">
          <SourceViewer
            currentDoc={selectedDoc}
            targetHighlight={highlightTarget}
            apiUrl={API_BASE}
          />
        </aside>
      </main>

      {/* ── Mobile Slide-Over Viewer (< 900px) ── */}
      {mobileViewerOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 md:hidden flex justify-end">
          <div className="w-[92%] max-w-md h-full bg-[var(--color-surface)] shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
            <SourceViewer
              currentDoc={selectedDoc}
              targetHighlight={highlightTarget}
              apiUrl={API_BASE}
              isMobileSlideOver={true}
              onCloseMobile={() => setMobileViewerOpen(false)}
            />
          </div>
        </div>
      )}

      {/* Mobile Floating Viewer Button (< 900px) */}
      <div className="md:hidden fixed bottom-4 right-4 z-40">
        <button
          onClick={() => setMobileViewerOpen(!mobileViewerOpen)}
          className="btn-pill btn-pill-primary shadow-lg flex items-center gap-1.5 text-xs py-2 px-4"
        >
          <Eye className="w-4 h-4" />
          <span>{mobileViewerOpen ? "Close Viewer" : "View Source Evidence"}</span>
        </button>
      </div>
    </div>
  );
}
