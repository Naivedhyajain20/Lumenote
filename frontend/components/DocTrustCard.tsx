"use client";

import React from "react";
import { FileText, Image as ImageIcon, Mail, FileCode } from "lucide-react";

export interface DocItem {
  id: string;
  filename: string;
  file_type: string;
  status: string;
  doc_type: string;
  page_count: number;
  reliability_score: number;
  ocr_quality: number;
  authority_level: number;
}

interface DocTrustCardProps {
  doc: DocItem;
  isSelected: boolean;
  compact?: boolean;
  onSelect: (doc: DocItem) => void;
}

function getFriendlyDocDetails(doc: DocItem) {
  const name = doc.filename.toLowerCase();
  const ocr = Math.round((doc.ocr_quality ?? 0) * 100);
  const trust = Math.round((doc.reliability_score ?? 0) * 100);
  const pages = doc.page_count || 1;

  if (doc.status !== "ready") {
    return {
      label: doc.filename,
      detail: `Could not index · ${doc.file_type.toUpperCase()}`,
      badge: "Needs attention",
      isHigh: false,
      icon: FileText,
    };
  }

  if (name.includes("contract")) {
    return {
      label: "Supply Contract",
      detail: `Legal agreement · ${pages} ${pages === 1 ? "page" : "pages"}`,
      badge: `${trust}% trust`,
      isHigh: trust >= 80,
      icon: FileText,
    };
  }
  if (name.includes("invoice")) {
    return {
      label: "Northwind Invoice",
      detail: `Scanned document · OCR ${ocr}%`,
      badge: `${ocr}% OCR quality`,
      isHigh: false,
      icon: ImageIcon,
    };
  }
  if (name.includes("vendor")) {
    return {
      label: "Vendor Email",
      detail: `Dispatch correspondence · ${pages} ${pages === 1 ? "page" : "pages"}`,
      badge: `${trust}% trust`,
      isHigh: trust >= 80,
      icon: Mail,
    };
  }
  if (name.includes("client")) {
    return {
      label: "Client Email",
      detail: `Receipt & damage report · ${pages} ${pages === 1 ? "page" : "pages"}`,
      badge: `${trust}% trust`,
      isHigh: trust >= 80,
      icon: Mail,
    };
  }
  if (name.includes("notes")) {
    return {
      label: "Meeting Notes",
      detail: `Internal notes · ${pages} ${pages === 1 ? "page" : "pages"}`,
      badge: `${trust}% trust`,
      isHigh: trust >= 80,
      icon: FileCode,
    };
  }
  if (name.includes("receipt")) {
    return {
      label: "Payment Receipt",
      detail: `Mobile photo capture · OCR ${ocr}%`,
      badge: `${ocr}% OCR quality`,
      isHigh: false,
      icon: ImageIcon,
    };
  }

  return {
    label: doc.filename,
    detail: `${pages} ${pages === 1 ? "page" : "pages"} · ${doc.file_type.toUpperCase()}`,
    badge: `${trust}% trust`,
    isHigh: trust >= 80,
    icon: FileText,
  };
}

export default function DocTrustCard({ doc, isSelected, compact, onSelect }: DocTrustCardProps) {
  const info = getFriendlyDocDetails(doc);
  const IconComponent = info.icon;

  if (compact) {
    return (
      <button
        onClick={() => onSelect(doc)}
        title={doc.filename}
        className={`w-full p-2.5 rounded-lg flex items-center justify-center transition-all ${
          isSelected
            ? "bg-[var(--color-primary)] text-white shadow-xs"
            : "text-[var(--color-muted)] hover:bg-[var(--color-card-soft)]"
        }`}
      >
        <IconComponent className="w-4 h-4" />
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={() => onSelect(doc)}
      aria-pressed={isSelected}
      title={doc.filename}
      className={`p-3 rounded-xl border transition-all cursor-pointer ${
        isSelected
          ? "bg-[var(--color-card-soft)] border-[var(--color-primary)] shadow-xs ring-1 ring-[var(--color-primary)]/20"
          : "bg-[var(--color-surface)] border-[var(--color-line)] hover:border-[var(--color-primary)]/40 hover:bg-[var(--color-panel)]"
      }`}
    >
      <div className="flex items-start justify-between gap-2.5 text-left">
        <div className="flex items-start gap-2.5 min-w-0">
          <div
            className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${
              isSelected
                ? "bg-[var(--color-primary)] text-white shadow-xs"
                : "bg-[var(--color-card-soft)] text-[var(--color-primary)]"
            }`}
          >
            <IconComponent className="w-4 h-4" />
          </div>

          <div className="min-w-0">
            <h4
              className={`text-xs font-bold truncate ${
                isSelected ? "text-[var(--color-navy)]" : "text-[var(--color-ink)]"
              }`}
            >
              {info.label}
            </h4>
            <p className="text-[11px] text-[var(--color-muted)] truncate mt-0.5">
              {info.detail}
            </p>
          </div>
        </div>

        {/* Clean, Simple Badge */}
        <span
          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0 border ${
            info.isHigh
              ? "bg-[var(--color-verified-soft)] text-[var(--color-verified)] border-[var(--color-verified)]/20"
              : "bg-[var(--color-uncertain-soft)] text-[var(--color-uncertain)] border-[var(--color-uncertain)]/20"
          }`}
        >
          {info.badge}
        </span>
      </div>
    </button>
  );
}
