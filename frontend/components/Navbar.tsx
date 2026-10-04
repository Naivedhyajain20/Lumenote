"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  FileText, ChevronDown,
  Sun, Moon, Download, Activity, Layers
} from "lucide-react";

export default function Navbar() {
  const pathname = usePathname();
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    // Detect stored theme or system preference
    const saved = localStorage.getItem("di_theme") as "light" | "dark" | null;
    if (saved) {
      // Hydrate the persisted theme after mount to avoid reading browser storage during prerender.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setTheme(saved);
      document.documentElement.classList.toggle("dark", saved === "dark");
      document.documentElement.setAttribute("data-theme", saved);
    } else {
      setTheme("light");
      document.documentElement.classList.remove("dark");
      document.documentElement.setAttribute("data-theme", "light");
    }

    const handleScroll = () => {
      setScrolled(window.scrollY > 12);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const toggleTheme = () => {
    const next = theme === "light" ? "dark" : "light";
    setTheme(next);
    localStorage.setItem("di_theme", next);
    document.documentElement.classList.toggle("dark", next === "dark");
    document.documentElement.setAttribute("data-theme", next);
  };

  return (
    <header className="sticky top-0 z-50 px-3 sm:px-6 py-2.5 transition-all duration-300">
      <div
        className={`max-w-7xl mx-auto rounded-2xl liquid-glass px-3.5 sm:px-5 py-2 flex items-center justify-between transition-all duration-300 ${scrolled ? "shadow-lg border-white/60 dark:border-white/15" : ""
          }`}
      >
        {/* ── LEFT: Apple Glass Brand Badge & Module Menu ── */}
        <div className="flex items-center gap-4 sm:gap-6">
          <Link href="/" className="flex items-center gap-2.5 group text-decoration-none">
            <div className="relative p-1 rounded-xl bg-white/70 dark:bg-white/10 shadow-xs border border-white/40 dark:border-white/15 transition-transform duration-200 group-hover:scale-105">
              <Image
                src="/logo.png"
                alt="Lumenote Logo"
                width={40}
                height={40}
                className="w-8
                 h-8 object-contain rounded-lg"
              />
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-[var(--color-navy)] text-sm tracking-tight leading-tight">
                Lumenote
              </span>
              <span className="text-[9px] font-semibold text-[var(--color-muted)] tracking-wider uppercase">
                ALG-AI-02 · ALG-DATA-02
              </span>
            </div>
          </Link>

          {/* Module Selector Dropdown */}
          <div className="relative hidden md:block">
            <button
              onClick={() => setActiveDropdown(activeDropdown === "modules" ? null : "modules")}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full liquid-glass-pill text-xs font-semibold text-[var(--color-ink)] hover:text-[var(--color-primary)] cursor-pointer"
            >
              <Layers className="w-3.5 h-3.5 text-[var(--color-primary)]" />
              <span>Platform Modules</span>
              <ChevronDown className={`w-3 h-3 opacity-60 transition-transform ${activeDropdown === "modules" ? "rotate-180" : ""}`} />
            </button>

            {activeDropdown === "modules" && (
              <div
                className="absolute top-full left-0 mt-2 w-80 rounded-2xl liquid-glass-dropdown p-2.5 shadow-2xl z-50 animate-in fade-in-50 zoom-in-95"
                onMouseLeave={() => setActiveDropdown(null)}
              >
                <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-[var(--color-muted)]">
                  Algothon &apos;26 Tracks
                </div>

                <Link
                  href="/predict"
                  onClick={() => setActiveDropdown(null)}
                  className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-blue-50/70 dark:hover:bg-blue-950/40 text-xs text-[var(--color-ink)] transition-colors group"
                >
                  <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 group-hover:scale-105 transition-transform">
                    <Activity className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-[var(--color-navy)] flex items-center gap-1.5">
                      Predict What Happens Next
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-blue-500 text-white">ALG-DATA-02</span>
                    </div>
                    <div className="text-[11px] text-[var(--color-muted)] mt-0.5">
                      AI4I 2020 predictive maintenance, failure classification & real-time telemetry.
                    </div>
                  </div>
                </Link>

                <Link
                  href="/workspace"
                  onClick={() => setActiveDropdown(null)}
                  className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-emerald-50/70 dark:hover:bg-emerald-950/40 text-xs text-[var(--color-ink)] transition-colors group mt-1"
                >
                  <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 group-hover:scale-105 transition-transform">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-[var(--color-navy)] flex items-center gap-1.5">
                      Document Investigation
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-600 text-white">ALG-AI-02</span>
                    </div>
                    <div className="text-[11px] text-[var(--color-muted)] mt-0.5">
                      Multi-document contradiction detection, citations & honest uncertainty.
                    </div>
                  </div>
                </Link>

                <div className="border-t border-[var(--color-line)] my-1.5" />

                <Link
                  href="/report"
                  onClick={() => setActiveDropdown(null)}
                  className="flex items-center gap-2 px-2.5 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-xs text-[var(--color-ink)]"
                >
                  <Download className="w-3.5 h-3.5 text-[var(--color-primary)]" />
                  <span className="font-medium">Export Compliance & Model Audit PDF</span>
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* ── CENTER: Floating Apple Pill Navigation ── */}
        <nav className="flex items-center gap-1 p-1 rounded-full bg-white/40 dark:bg-white/5 border border-white/60 dark:border-white/10 backdrop-blur-md shadow-xs">
          <Link
            href="/"
            className={`px-3 sm:px-3.5 py-1 sm:py-1.5 rounded-full text-xs font-semibold transition-all duration-200 ${pathname === "/"
              ? "bg-white dark:bg-white/15 text-[var(--color-primary)] shadow-xs"
              : "text-[var(--color-muted)] hover:text-[var(--color-ink)] hover:bg-white/30 dark:hover:bg-white/5"
              }`}
          >
            Overview
          </Link>

          <Link
            href="/workspace"
            className={`px-3 sm:px-3.5 py-1 sm:py-1.5 rounded-full text-xs font-semibold transition-all duration-200 ${pathname === "/workspace"
              ? "bg-[var(--color-primary)] text-white shadow-xs"
              : "text-[var(--color-muted)] hover:text-[var(--color-ink)] hover:bg-white/30 dark:hover:bg-white/5"
              }`}
          >
            Investigation
          </Link>

          <Link
            href="/predict"
            className={`flex items-center gap-1 px-3 sm:px-3.5 py-1 sm:py-1.5 rounded-full text-xs font-semibold transition-all duration-200 ${pathname === "/predict"
              ? "bg-blue-600 text-white shadow-xs"
              : "text-[var(--color-muted)] hover:text-blue-600 dark:hover:text-blue-400 hover:bg-white/30 dark:hover:bg-white/5"
              }`}
          >
            <Activity className="w-3 h-3 animate-pulse" />
            <span>Predict Next</span>
            <span className="hidden sm:inline-block text-[9px] px-1 py-0.2 rounded bg-blue-500/20 text-blue-700 dark:text-blue-300 font-bold ml-0.5">
              DATA-02
            </span>
          </Link>

          <Link
            href="/report"
            className={`hidden md:inline-flex px-3 sm:px-3.5 py-1 sm:py-1.5 rounded-full text-xs font-semibold transition-all duration-200 ${pathname === "/report"
              ? "bg-white dark:bg-white/15 text-[var(--color-primary)] shadow-xs"
              : "text-[var(--color-muted)] hover:text-[var(--color-ink)] hover:bg-white/30 dark:hover:bg-white/5"
              }`}
          >
            Audit Report
          </Link>
        </nav>

        {/* ── RIGHT: Theme Toggle & Quick Action Pill ── */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Quick Demo Case Trigger */}
          <Link
            href="/login"
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full liquid-glass-pill text-xs font-semibold text-[var(--color-primary)] hover:bg-blue-50 dark:hover:bg-blue-950/40"
          >
            <span>Open sample case</span>
          </Link>

          {/* Liquid Glass Theme Toggle */}
          <button
            onClick={toggleTheme}
            title={theme === "light" ? "Switch to Dark Mode" : "Switch to Light Mode"}
            className="p-2 rounded-full liquid-glass-pill text-[var(--color-muted)] hover:text-[var(--color-ink)] transition-colors cursor-pointer"
          >
            {theme === "light" ? (
              <Moon className="w-4 h-4 text-slate-700" />
            ) : (
              <Sun className="w-4 h-4 text-amber-400" />
            )}
          </button>

          {/* User Initials Avatar with Glass Border */}
          <div
            title="Sample investigation workspace"
            aria-label="Sample investigation workspace"
            className="w-8 h-8 rounded-full bg-gradient-to-br from-[var(--color-navy)] to-[var(--color-primary)] text-white text-xs font-bold flex items-center justify-center border-2 border-white/80 dark:border-white/20 shadow-xs select-none"
          >
            D
          </div>
        </div>
      </div>
    </header>
  );
}
