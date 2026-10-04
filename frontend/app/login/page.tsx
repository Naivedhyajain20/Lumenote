"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Navbar from "@/components/Navbar";
import { ArrowRight, FileSearch, ShieldCheck, AlertCircle } from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLaunchDemo = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`${API_BASE}/documents/load-demo`, { method: "POST" });
      if (!response.ok) {
        const detail = await response.json().catch(() => null);
        throw new Error(detail?.detail || `The sample case could not be prepared (${response.status}).`);
      }
      const result = await response.json();
      if (!result.documents?.length) throw new Error("No sample documents were found. Check the backend demo_data folder.");
      router.push("/workspace");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to connect to the investigation service.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[var(--color-page)] text-[var(--color-ink)]">
      <Navbar />
      <main className="flex-1 grid lg:grid-cols-[1fr_1fr]">
        <section className="hidden lg:flex flex-col justify-between bg-navy-hero px-14 py-12 text-white">
          <div className="flex items-center gap-3">
            <Image src="/logo.png" alt="" width={36} height={36} className="h-9 w-9 rounded-lg" />
            <span className="text-lg font-bold tracking-tight">Lumenote</span>
          </div>
          <div className="max-w-lg space-y-6">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs text-slate-200">
              <ShieldCheck className="h-4 w-4 text-emerald-300" /> Evidence-first investigation
            </span>
            <h1 className="text-4xl font-semibold leading-tight tracking-tight">See what the record says. And where it disagrees.</h1>
            <p className="text-sm leading-7 text-slate-300">Review source documents, compare conflicting accounts, and ask questions with citations you can inspect.</p>
          </div>
          <p className="text-xs text-slate-400">Private local demo · Sample case data</p>
        </section>

        <section className="flex items-center justify-center px-5 py-14">
          <div className="w-full max-w-md">
            <div className="mb-8 lg:hidden flex items-center gap-3">
              <Image src="/logo.png" alt="" width={36} height={36} className="h-9 w-9 rounded-lg" />
              <span className="text-lg font-bold tracking-tight text-[var(--color-navy)]">Lumenote</span>
            </div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-primary)]">Investigation workspace</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-[var(--color-navy)]">Start with a sample case</h2>
            <p className="mt-3 text-sm leading-6 text-[var(--color-muted)]">Load the Orion Interiors and Northwind Supplies records to explore document review, citations, and conflict analysis.</p>

            <div className="mt-8 rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] p-5 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--color-card-soft)] text-[var(--color-primary)]">
                  <FileSearch className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-[var(--color-ink)]">Orion Interiors vs. Northwind Supplies</h3>
                  <p className="mt-1 text-xs leading-5 text-[var(--color-muted)]">Six sample records · Contracts, correspondence, receipts, and notes</p>
                </div>
              </div>
              <button onClick={handleLaunchDemo} disabled={loading} className="btn-pill btn-pill-primary mt-6 w-full justify-center py-3 text-sm disabled:cursor-wait disabled:opacity-60">
                {loading ? "Preparing sample records…" : "Open sample investigation"}
                {!loading && <ArrowRight className="h-4 w-4" />}
              </button>
              {error && <div role="alert" className="mt-4 flex gap-2 rounded-lg border border-[var(--color-conflict)]/30 bg-[var(--color-conflict-soft)] p-3 text-xs leading-5 text-[var(--color-ink)]"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-conflict)]" />{error}</div>}
            </div>
            <p className="mt-5 text-center text-xs leading-5 text-[var(--color-muted)]">Authentication is not enabled in this demo. Sample records stay in the configured local backend.</p>
          </div>
        </section>
      </main>
    </div>
  );
}
