"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Download, FileText, ArrowLeft } from "lucide-react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { API_BASE } from "@/lib/api";


export default function ReportPage() {
  const [markdownContent, setMarkdownContent] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [error, setError] = useState("");

  const fetchMarkdownReport = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          format: "md",
          case_title: "Orion Interiors vs Northwind Supplies Dispute",
        }),
      });
      if (!res.ok) throw new Error(`Report could not be generated (${res.status}).`);
      const text = await res.text();
      if (!text.trim()) throw new Error("The report service returned an empty report.");
      setMarkdownContent(text);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to connect to the report service.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Fetching is an external synchronization; state changes when the request resolves.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchMarkdownReport();
  }, [fetchMarkdownReport]);

  const handleDownloadPdf = async () => {
    setDownloadingPdf(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE}/report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          format: "pdf",
          case_title: "Orion Interiors vs Northwind Supplies Dispute",
        }),
      });

      if (!res.ok) throw new Error(`PDF export failed (${res.status}).`);
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "investigation_report.pdf";
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.setTimeout(() => window.URL.revokeObjectURL(url), 1000);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to generate the PDF.");
    } finally {
      setDownloadingPdf(false);
    }
  };

  const handleDownloadMarkdown = () => {
    const blob = new Blob([markdownContent], { type: "text/markdown" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "investigation_report.md";
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[var(--color-page)] text-[var(--color-ink)]">
      <Navbar />

      <main className="flex-1 max-w-5xl w-full mx-auto p-6 md:p-8 flex flex-col">
        {/* Header with actions */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-[var(--color-line)] mb-6">
          <div>
            <div className="flex items-center gap-2 text-xs text-blue-400 font-semibold mb-1.5">
              <Link href="/workspace" className="hover:underline flex items-center gap-1">
                <ArrowLeft className="w-3.5 h-3.5" /> Back to Investigation Studio
              </Link>
            </div>
            <h1 className="text-2xl font-bold text-[var(--color-navy)] flex items-center gap-2 tracking-tight">
              <FileText className="w-6 h-6 text-[var(--color-primary)]" /> Investigation report
            </h1>
            <p className="text-sm text-[var(--color-muted)] mt-1">
              Review the generated findings and evidence references before exporting.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleDownloadMarkdown}
              disabled={loading || !markdownContent}
              className="btn-pill btn-pill-secondary text-xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Markdown</span>
            </button>
            <button
              onClick={handleDownloadPdf}
              disabled={downloadingPdf || loading}
              className="btn-pill btn-pill-primary text-xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{downloadingPdf ? "Generating PDF..." : "Download Official PDF"}</span>
            </button>
          </div>
        </div>

        {/* Report Preview */}
        {error && <div role="alert" className="mb-4 rounded-lg border border-[var(--color-conflict)]/30 bg-[var(--color-conflict-soft)] px-4 py-3 text-sm">{error}</div>}
        <div className="flex-1 min-h-[360px] card-base rounded-2xl p-6 md:p-8 overflow-y-auto">
          {loading ? (
            <div className="p-12 text-center text-xs text-slate-500">
              <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              Generating forensic audit synthesis...
            </div>
          ) : (
              <pre className="whitespace-pre-wrap font-sans text-sm text-[var(--color-ink)] leading-7 font-normal">
              {markdownContent}
            </pre>
          )}
        </div>
      </main>
    </div>
  );
}
