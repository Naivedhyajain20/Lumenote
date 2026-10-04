"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import Navbar from "@/components/Navbar";
import {
  CheckCircle2, AlertCircle, ShieldCheck, ArrowRight,
  Database, FileCheck, HelpCircle, ChevronDown,
  ChevronUp, Scale, Check
} from "lucide-react";

export default function LandingPage() {
  const [activeStep, setActiveStep] = useState<number>(0);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const PIPELINE_STEPS = [
    {
      title: "1. Upload & Ingest",
      tagline: "Multi-format ingestion with structural normalization",
      desc: "Upload contracts, invoices, emails, receipts, and meeting notes in PDF, DOCX, and image formats. Files are normalized and indexed with structural metadata.",
      checklist: [
        "PDF text extraction & layout geometry preserved",
        "Multilingual Tesseract OCR for scans & photos",
        "Document authority weighting & trust score calculation",
        "Duplicate page filtering & hash integrity logging",
      ],
    },
    {
      title: "2. Extract & Embed",
      tagline: "Hybrid BM25 and semantic vector indexing",
      desc: "Every paragraph, table row, and clause is segmented into discrete evidence chunks with bounding box coordinates for exact retrieval.",
      checklist: [
        "Dense vector embeddings combined with sparse BM25 indexing",
        "Entity identification: People, Organizations, Dates, Currencies",
        "Fact tuple extraction: (Subject, Predicate, Value, Date)",
        "Chronological timestamp normalization",
      ],
    },
    {
      title: "3. Verify & Cross-Check",
      tagline: "Autonomous cross-document conflict detection",
      desc: "The system compares extracted facts across different records to identify discrepancies in delivery dates, advance payments, and legal obligations.",
      checklist: [
        "Pairwise claim comparison across all uploaded documents",
        "Discrepancy categorization: Delivery dates, Amounts, Terms",
        "Severity assessment (High / Medium / Low)",
        "Identification of most legally reliable source",
      ],
    },
    {
      title: "4. Investigate & Ground",
      tagline: "Interactive natural language inquiry with citations",
      desc: "Ask inquiries in natural language. Answers are returned with clickable citations [Contract, p.3] and an explicit confidence breakdown.",
      checklist: [
        "Answers include citations to retrieved evidence",
        "Abstention signals when evidence is weak or missing",
        "Four-signal confidence breakdown (Retrieval, Entailment, Agreement, Trust)",
        "Instant passage highlight in the side-by-side source viewer",
      ],
    },
    {
      title: "5. Synthesize & Report",
      tagline: "A reviewable investigation report",
      desc: "Generate a report that brings together findings, detected conflicts, and citation references for investigator review.",
      checklist: [
        "Executive summary of agreed facts and unresolved disputes",
        "Side-by-side evidence tables with exact document quotes",
        "Document reliability scores & OCR quality breakdown",
        "Exportable as clean Markdown or publication-ready PDF",
      ],
    },
  ];

  const FAQS = [
    {
      q: "What types of documents can be investigated?",
      a: "The uploader accepts PDFs, DOCX, plain text or Markdown files, and JPG, PNG, or TIFF images up to the configured file-size limit.",
    },
    {
      q: "How are answers grounded in the records?",
      a: "Answers can include citations to retrieved passages, and the workspace lets you inspect the cited source. If evidence is weak or missing, the system can flag an abstention. Review generated answers against the original documents.",
    },
    {
      q: "How are document contradictions identified?",
      a: "Extracted entities and predicates are mapped into a matrix. When different documents report incompatible values for the same event (e.g. 15 Feb vs 20 Feb), a Conflict Panel is surfaced above the answer.",
    },
    {
      q: "What constitutes the confidence score?",
      a: "Confidence is computed from four independent signals: Retrieval Strength (40%), Claim Entailment (25%), Source Agreement (20%), and Document Trust Weight (15%).",
    },
    {
      q: "How does the source viewer highlight cited passages?",
      a: "Clicking any citation chip [Contract, p.3] jumps the document viewer to that exact page and covers the cited sentence with a distinct yellow highlight strip (#FFE27A).",
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[var(--color-page)] text-[var(--color-ink)] font-sans">
      <Navbar />

      {/* ── 1. FLAT DEEP-NAVY HERO (Prompt Specification: Flat Navy #0B1F4B, No Gradients/Blobs) ── */}
      <section className="bg-navy-hero py-16 md:py-24 px-6 border-b border-[var(--color-line)]">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-white text-xs font-semibold uppercase tracking-wider">
            <ShieldCheck className="w-3.5 h-3.5 text-[var(--color-verified)]" />
            <span>Forensic Document Investigation Platform</span>
          </div>

          <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-white leading-tight">
            Investigate multiple documents with source citations and visible contradictions
          </h1>

          <p className="text-sm md:text-base text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Upload case records, ask questions in natural language, and review cited passages, detected conflicts, and uncertainty signals alongside the source files.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Link
              href="/login"
              className="btn-pill btn-pill-primary py-2.5 px-6 text-sm font-semibold shadow-xs"
            >
              <span>Open sample case</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
            <Link
              href="/workspace"
              className="btn-pill btn-pill-secondary py-2.5 px-6 text-sm font-semibold bg-white/10 text-white border-white/20 hover:bg-white/20"
            >
              <span>Explore Workspace</span>
            </Link>
            <Link
              href="/predict"
              className="btn-pill py-2.5 px-6 text-sm font-semibold bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover:from-blue-600 hover:to-indigo-700 shadow-md border border-white/20"
            >
              <span>Predict What Happens Next (ALG-DATA-02) →</span>
            </Link>
          </div>

          {/* Value Pillars */}
          <div className="pt-8 border-t border-white/10 grid grid-cols-1 sm:grid-cols-3 gap-6 text-left max-w-3xl mx-auto">
            <div className="space-y-1">
              <div className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-[var(--color-verified)]" />
                Exact Citations
              </div>
              <p className="text-xs text-slate-300 leading-snug">
                Follow answer citations back to the source document and page.
              </p>
            </div>

            <div className="space-y-1">
              <div className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 text-[var(--color-conflict)]" />
                Conflict Detection
              </div>
              <p className="text-xs text-slate-300 leading-snug">
                Side-by-side matrices identify diverging delivery dates and payment sums.
              </p>
            </div>

            <div className="space-y-1">
              <div className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <Scale className="w-3.5 h-3.5 text-[var(--color-uncertain)]" />
                Honest Abstention
              </div>
              <p className="text-xs text-slate-300 leading-snug">
                Explicitly states when records lack evidence instead of generating assumptions.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── 2. ROSSUM PROCESS JOURNEY PIPELINE (Reference B) ── */}
      <section className="py-16 md:py-20 px-6 max-w-5xl mx-auto w-full space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold text-[var(--color-navy)] tracking-tight">
            The Document Investigation Pipeline
          </h2>
          <p className="text-xs md:text-sm text-[var(--color-muted)] max-w-xl mx-auto">
            A structured workflow from document ingestion to investigator-ready reports.
          </p>
        </div>

        {/* Horizontal Tab Strip (Rossum: Raised white surface + underline) */}
        <div className="flex border-b border-[var(--color-line)] bg-[var(--color-panel)] rounded-t-xl overflow-x-auto no-scrollbar">
          {PIPELINE_STEPS.map((step, idx) => (
            <button
              key={idx}
              onClick={() => setActiveStep(idx)}
              className={`flex-1 py-3 px-4 text-xs font-semibold whitespace-nowrap transition-all border-b-2 cursor-pointer text-center ${
                activeStep === idx
                  ? "bg-[var(--color-surface)] border-[var(--color-primary)] text-[var(--color-primary)] shadow-xs"
                  : "border-transparent text-[var(--color-muted)] hover:text-[var(--color-ink)]"
              }`}
            >
              {step.title}
            </button>
          ))}
        </div>

        {/* Active Stage Details & Green Checklist (Rossum Pattern) */}
        <div className="card-base p-6 md:p-8 space-y-6">
          <div className="space-y-1.5">
            <span className="text-[11px] font-mono font-bold text-[var(--color-primary)] uppercase">
              Pipeline Stage {activeStep + 1}
            </span>
            <h3 className="text-lg font-bold text-[var(--color-navy)]">
              {PIPELINE_STEPS[activeStep].tagline}
            </h3>
            <p className="text-xs md:text-sm text-[var(--color-muted)] leading-relaxed max-w-3xl">
              {PIPELINE_STEPS[activeStep].desc}
            </p>
          </div>

          <div className="border-t border-[var(--color-line)] pt-4">
            <h4 className="text-xs font-bold text-[var(--color-navy)] uppercase tracking-wider mb-3">
              Automated Forensic Operations:
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {PIPELINE_STEPS[activeStep].checklist.map((item, i) => (
                <div key={i} className="flex items-start gap-2.5 text-xs text-[var(--color-ink)]">
                  <div className="w-4 h-4 rounded-full bg-[var(--color-verified-soft)] text-[var(--color-verified)] flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="w-2.5 h-2.5" />
                  </div>
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── 3. THREE CORE FORENSIC CAPABILITIES ── */}
      <section className="py-16 px-6 bg-[var(--color-surface)] border-y border-[var(--color-line)]">
        <div className="max-w-5xl mx-auto space-y-12">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold text-[var(--color-navy)] tracking-tight">
              Built for High-Stakes Evidence Verification
            </h2>
            <p className="text-xs md:text-sm text-[var(--color-muted)] max-w-xl mx-auto">
              Eliminate ambiguity with verifiable citations, cross-document contradiction exposure, and confidence breakdowns.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Card 1 */}
            <div className="card-soft p-5 space-y-3">
              <div className="w-8 h-8 rounded-lg bg-[var(--color-surface)] text-[var(--color-primary)] flex items-center justify-center border border-[var(--color-line)] font-bold text-sm">
                [C]
              </div>
              <h3 className="text-sm font-bold text-[var(--color-navy)]">
                Pinpoint Citation Grounding
              </h3>
              <p className="text-xs text-[var(--color-muted)] leading-relaxed">
                Answers include citations to retrieved evidence passages. Select a citation to inspect its source document and page.
              </p>
            </div>

            {/* Card 2 */}
            <div className="card-soft p-5 space-y-3">
              <div className="w-8 h-8 rounded-lg bg-[var(--color-surface)] text-[var(--color-conflict)] flex items-center justify-center border border-[var(--color-line)] font-bold text-sm">
                ≠
              </div>
              <h3 className="text-sm font-bold text-[var(--color-navy)]">
                Contradiction Detection
              </h3>
              <p className="text-xs text-[var(--color-muted)] leading-relaxed">
                When contractual terms mismatch delivery notes or invoices, the platform extracts both statements side-by-side and highlights the legally superior source.
              </p>
            </div>

            {/* Card 3 */}
            <div className="card-soft p-5 space-y-3">
              <div className="w-8 h-8 rounded-lg bg-[var(--color-surface)] text-[var(--color-uncertain)] flex items-center justify-center border border-[var(--color-line)] font-bold text-sm">
                ?
              </div>
              <h3 className="text-sm font-bold text-[var(--color-navy)]">
                Honest Abstention
              </h3>
              <p className="text-xs text-[var(--color-muted)] leading-relaxed">
                If documents omit critical details (e.g. warranty coverage duration), the system clearly declares what is missing rather than inventing false assurances.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── 4. FAQ ACCORDION (Reference B Help Drawer Pattern) ── */}
      <section className="py-16 md:py-20 px-6 max-w-4xl mx-auto w-full space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold text-[var(--color-navy)] tracking-tight">
            Frequently Asked Questions
          </h2>
          <p className="text-xs md:text-sm text-[var(--color-muted)]">
            Technical and methodological details regarding the platform.
          </p>
        </div>

        <div className="space-y-2.5">
          {FAQS.map((faq, i) => (
            <div key={i} className="card-base overflow-hidden">
              <button
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                className="w-full p-4 text-left flex items-center justify-between text-xs md:text-sm font-semibold text-[var(--color-ink)] hover:bg-[var(--color-card-soft)] transition-colors cursor-pointer"
              >
                <span>{faq.q}</span>
                {openFaq === i ? (
                  <ChevronUp className="w-4 h-4 text-[var(--color-primary)] flex-shrink-0" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-[var(--color-muted)] flex-shrink-0" />
                )}
              </button>
              {openFaq === i && (
                <div className="p-4 pt-1 text-xs text-[var(--color-muted)] leading-relaxed border-t border-[var(--color-line)] bg-[var(--color-panel)]">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ── 5. ACCESS CASE PORTAL CTA ── */}
      <section className="py-12 px-6 border-t border-[var(--color-line)] bg-[var(--color-card-soft)]">
        <div className="max-w-3xl mx-auto text-center space-y-4">
          <h3 className="text-xl font-bold text-[var(--color-navy)]">
            Ready to investigate the sample case?
          </h3>
          <p className="text-xs text-[var(--color-muted)] max-w-md mx-auto">
            Access the investigator sign-in page to launch your session or test the pre-loaded Orion vs. Northwind dispute.
          </p>
          <div className="pt-2">
            <Link
              href="/login"
              className="btn-pill btn-pill-primary px-6 py-2.5 text-xs font-semibold"
            >
              <span>Go to Sign In & Case Portal</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── 6. FOOTER ROW OF ICON LINKS (Reference A: Documentation, Help, Feedback) ── */}
      <footer className="border-t border-[var(--color-line)] bg-[var(--color-surface)] py-8 px-6 text-xs text-[var(--color-muted)]">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Image src="/logo.png" alt="Lumenote Logo" width={20} height={20} className="w-5 h-5 object-contain" />
            <span className="font-semibold text-[var(--color-navy)]">Lumenote</span>
            <span>&copy; 2026. All rights reserved.</span>
          </div>

          <div className="flex items-center gap-6">
            <Link href="/" className="hover:text-[var(--color-ink)] flex items-center gap-1">
              <FileCheck className="w-3.5 h-3.5" /> Documentation
            </Link>
            <Link href="/" className="hover:text-[var(--color-ink)] flex items-center gap-1">
              <HelpCircle className="w-3.5 h-3.5" /> Help
            </Link>
            <Link href="/workspace" className="hover:text-[var(--color-ink)] flex items-center gap-1">
              <Database className="w-3.5 h-3.5" /> Workspace
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
