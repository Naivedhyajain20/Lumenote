"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Users, Search, Building2, Calendar, DollarSign, MapPin, Percent, FileText, ChevronRight } from "lucide-react";
import { HighlightTarget } from "./SourceViewer";

interface EntityRef {
  doc_id: string;
  doc_name: string;
  page: number;
  passage: string;
}

interface EntityGroup {
  name: string;
  type: string;
  occurrences: number;
  references: EntityRef[];
}

interface EntityListProps {
  apiUrl: string;
  onSelectPassage: (target: HighlightTarget) => void;
}

export default function EntityList({ apiUrl, onSelectPassage }: EntityListProps) {
  const [entities, setEntities] = useState<EntityGroup[]>([]);
  const [search, setSearch] = useState("");
  const [selectedType, setSelectedType] = useState<string>("ALL");
  const [loading, setLoading] = useState(true);
  const [selectedEntity, setSelectedEntity] = useState<EntityGroup | null>(null);

  const fetchEntities = useCallback(async () => {
    setLoading(true);
    try {
      let url = `${apiUrl}/entities?`;
      if (search) url += `q=${encodeURIComponent(search)}&`;
      if (selectedType !== "ALL") url += `type=${selectedType}&`;

      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setEntities(data);
        if (data.length > 0) setSelectedEntity((current) => current || data[0]);
      }
    } catch (e) {
      console.error("Failed to load entities:", e);
    } finally {
      setLoading(false);
    }
  }, [apiUrl, search, selectedType]);

  useEffect(() => {
    // Load remote data; state updates occur after the request resolves.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchEntities();
  }, [fetchEntities]);

  const getTypeIcon = (type: string) => {
    switch (type.toUpperCase()) {
      case "PERSON":
        return <Users className="w-3.5 h-3.5 text-blue-400" />;
      case "ORG":
        return <Building2 className="w-3.5 h-3.5 text-indigo-400" />;
      case "DATE":
        return <Calendar className="w-3.5 h-3.5 text-amber-400" />;
      case "AMOUNT":
        return <DollarSign className="w-3.5 h-3.5 text-emerald-400" />;
      case "PLACE":
        return <MapPin className="w-3.5 h-3.5 text-rose-400" />;
      case "PERCENT":
        return <Percent className="w-3.5 h-3.5 text-purple-400" />;
      default:
        return <FileText className="w-3.5 h-3.5 text-[var(--color-muted)]" />;
    }
  };

  return (
    <div className="h-full flex flex-col p-4 bg-[var(--color-surface)] rounded-2xl border border-[var(--color-line)] overflow-hidden">
      {/* Header & Search */}
      <div className="pb-3 border-b border-[var(--color-line)] space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-[var(--color-ink)] flex items-center gap-2">
            <Users className="w-4 h-4 text-blue-400" /> Extracted Entities & Cross-References
          </h3>
          <span className="text-xs text-[var(--color-muted)]">{entities.length} Unique Entities</span>
        </div>

        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-[var(--color-muted)] absolute left-3 top-3" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search people, orgs, amounts, dates..."
              className="w-full pl-8 pr-3 py-2 bg-[var(--color-card-soft)] border border-[var(--color-line)] rounded-xl text-xs text-[var(--color-ink)] placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="bg-[var(--color-card-soft)] border border-[var(--color-line)] rounded-xl text-xs px-2.5 py-2 text-[var(--color-ink)] focus:outline-none"
          >
            <option value="ALL">All Types</option>
            <option value="PERSON">Persons</option>
            <option value="ORG">Organizations</option>
            <option value="AMOUNT">Amounts</option>
            <option value="DATE">Dates</option>
            <option value="PERCENT">Percentages</option>
            <option value="PLACE">Places</option>
          </select>
        </div>
      </div>

      {/* Two columns: Entity list & Occurrences view */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 overflow-hidden">
        {/* Left entity selector */}
        <div className="overflow-y-auto space-y-1.5 pr-2">
          {loading ? (
            <div className="p-8 text-center text-xs text-[var(--color-muted)]">Searching entities...</div>
          ) : entities.length === 0 ? (
            <div className="p-8 text-center text-xs text-[var(--color-muted)]">No entities found.</div>
          ) : (
            entities.map((e, idx) => (
              <div
                key={idx}
                onClick={() => setSelectedEntity(e)}
                className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                  selectedEntity?.name === e.name
                    ? "bg-[var(--color-card-soft)] border-blue-500 text-[var(--color-ink)] shadow-sm"
                    : "bg-[var(--color-panel)]/60 border-[var(--color-line)] text-[var(--color-ink)] hover:bg-[var(--color-card-soft)]/40"
                }`}
              >
                <div className="flex items-center gap-2 overflow-hidden">
                  <div className="p-1.5 rounded-lg bg-[var(--color-card-soft)] border border-[var(--color-line)]">
                    {getTypeIcon(e.type)}
                  </div>
                  <div className="overflow-hidden">
                    <span className="text-xs font-medium truncate block">{e.name}</span>
                    <span className="text-[10px] text-[var(--color-muted)] uppercase">{e.type}</span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--color-card-soft)] text-[var(--color-muted)] border border-[var(--color-line)]">
                    {e.occurrences} mentions
                  </span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
                </div>
              </div>
            ))
          )}
        </div>

        {/* Right occurrences list */}
        <div className="overflow-y-auto bg-[var(--color-panel)] rounded-xl p-3 border border-[var(--color-line)] space-y-3">
          {selectedEntity ? (
            <>
              <div className="pb-2 border-b border-[var(--color-line)]">
                <span className="text-[10px] uppercase font-bold text-[var(--color-muted)] tracking-wider">
                  Mentions & Citations for
                </span>
                <h4 className="text-sm font-bold text-[var(--color-ink)] mt-0.5">{selectedEntity.name}</h4>
              </div>

              <div className="space-y-2">
                {selectedEntity.references.map((ref, i) => (
                  <div
                    key={i}
                    onClick={() =>
                      onSelectPassage({
                        docName: ref.doc_name,
                        page: ref.page,
                        quote: ref.passage,
                      })
                    }
                    className="p-3 rounded-xl bg-[var(--color-panel)] border border-[var(--color-line)] hover:border-blue-500/50 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center justify-between text-[11px] text-blue-400 font-medium mb-1">
                      <span>{ref.doc_name}</span>
                      <span className="text-[var(--color-muted)] text-[10px]">Page {ref.page}</span>
                    </div>
                    <p className="text-xs text-[var(--color-ink)] italic">&quot;{ref.passage}...&quot;</p>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="p-8 text-center text-xs text-[var(--color-muted)]">Select an entity to view citations.</div>
          )}
        </div>
      </div>
    </div>
  );
}
