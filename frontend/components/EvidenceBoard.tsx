"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Pin, Plus, Trash2, BookMarked } from "lucide-react";

interface NoteItem {
  id: string;
  message_id?: string;
  text: string;
  topic: string;
  pinned: boolean;
  created_at: string;
}

interface EvidenceBoardProps {
  apiUrl: string;
}

export default function EvidenceBoard({ apiUrl }: EvidenceBoardProps) {
  const [notes, setNotes] = useState<NoteItem[]>([]);
  const [newText, setNewText] = useState("");
  const [newTopic, setNewTopic] = useState("General");
  const [loading, setLoading] = useState(true);

  const fetchNotes = useCallback(async () => {
    try {
      const res = await fetch(`${apiUrl}/notes`);
      if (res.ok) {
        const data = await res.json();
        setNotes(data);
      }
    } catch (e) {
      console.error("Failed to load notes:", e);
    } finally {
      setLoading(false);
    }
  }, [apiUrl]);

  useEffect(() => {
    // Load remote data; state updates occur after the request resolves.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchNotes();
  }, [fetchNotes]);

  const handleCreateNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newText.trim()) return;

    try {
      const res = await fetch(`${apiUrl}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: newText.trim(),
          topic: newTopic || "General",
          pinned: false,
        }),
      });

      if (res.ok) {
        const created = await res.json();
        setNotes([created, ...notes]);
        setNewText("");
      }
    } catch (e) {
      console.error("Failed to create note:", e);
    }
  };

  const togglePin = async (note: NoteItem) => {
    try {
      const res = await fetch(`${apiUrl}/notes/${note.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pinned: !note.pinned }),
      });

      if (res.ok) {
        setNotes(
          notes.map((n) => (n.id === note.id ? { ...n, pinned: !n.pinned } : n))
        );
      }
    } catch (e) {
      console.error("Failed to toggle pin:", e);
    }
  };

  const deleteNote = async (id: string) => {
    try {
      const res = await fetch(`${apiUrl}/notes/${id}`, { method: "DELETE" });
      if (res.ok) {
        setNotes(notes.filter((n) => n.id !== id));
      }
    } catch (e) {
      console.error("Failed to delete note:", e);
    }
  };

  return (
    <div className="h-full flex flex-col p-4 bg-[var(--color-surface)] rounded-2xl border border-[var(--color-line)] overflow-hidden">
      {/* Header */}
      <div className="pb-3 border-b border-[var(--color-line)] flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-bold text-[var(--color-ink)] flex items-center gap-2">
            <BookMarked className="w-4 h-4 text-amber-400" /> Investigation Evidence Board
          </h3>
          <p className="text-xs text-[var(--color-muted)]">
            Pin key answers, record investigator hypotheses, and group evidentiary leads.
          </p>
        </div>
        <span className="text-xs px-2.5 py-1 rounded-full bg-[var(--color-card-soft)] text-[var(--color-ink)] border border-[var(--color-line)]">
          {notes.length} Evidence Cards
        </span>
      </div>

      {/* Add note card */}
      <form onSubmit={handleCreateNote} className="mb-4 p-3 rounded-xl bg-[var(--color-panel)] border border-[var(--color-line)] flex gap-2">
        <input
          type="text"
          value={newText}
          onChange={(e) => setNewText(e.target.value)}
          placeholder="Record a case note, lead, or evidentiary finding..."
          className="flex-1 bg-transparent text-xs text-[var(--color-ink)] placeholder-slate-500 focus:outline-none"
        />
        <select
          value={newTopic}
          onChange={(e) => setNewTopic(e.target.value)}
          className="bg-[var(--color-panel)] border border-[var(--color-line)] rounded-lg text-xs px-2 text-[var(--color-ink)] focus:outline-none"
        >
          <option value="General">General</option>
          <option value="Delivery Dispute">Delivery Dispute</option>
          <option value="Advance Payment">Advance Payment</option>
          <option value="Damaged Goods">Damaged Goods</option>
          <option value="Legal & Penalty">Legal & Penalty</option>
        </select>
        <button
          type="submit"
          className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs flex items-center gap-1 cursor-pointer transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Note</span>
        </button>
      </form>

      {/* Grid of note cards */}
      <div className="flex-1 overflow-y-auto pr-1">
        {loading ? (
          <div className="p-8 text-center text-xs text-[var(--color-muted)]">Loading evidence cards...</div>
        ) : notes.length === 0 ? (
          <div className="p-8 text-center text-xs text-[var(--color-muted)]">
            No notes on the Evidence Board yet. Click &quot;Pin Note&quot; on any answer in Chat or type a note above!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {notes.map((n) => (
              <div
                key={n.id}
                className={`p-3.5 rounded-xl border flex flex-col justify-between transition-all ${
                  n.pinned
                    ? "bg-[var(--color-panel)] border-amber-500/50 shadow-md shadow-amber-500/10 ring-1 ring-amber-500/30"
                    : "bg-[var(--color-panel)] border-[var(--color-line)] hover:border-[var(--color-line)]"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-1 mb-2">
                    <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded bg-[var(--color-card-soft)] text-[var(--color-ink)] border border-[var(--color-line)]">
                      {n.topic}
                    </span>
                    <button
                      onClick={() => togglePin(n)}
                      className={`p-1 rounded hover:bg-[var(--color-card-soft)] transition-colors cursor-pointer ${
                        n.pinned ? "text-amber-400" : "text-[var(--color-muted)] hover:text-[var(--color-ink)]"
                      }`}
                      title={n.pinned ? "Unpin note" : "Pin note"}
                    >
                      <Pin className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <p className="text-xs text-[var(--color-ink)] leading-relaxed">{n.text}</p>
                </div>

                <div className="mt-3 pt-2 border-t border-[var(--color-line)]/70 flex items-center justify-between text-[10px] text-[var(--color-muted)]">
                  <span>{new Date(n.created_at).toLocaleDateString()}</span>
                  <button
                    onClick={() => deleteNote(n.id)}
                    className="text-slate-600 hover:text-rose-400 transition-colors cursor-pointer"
                    title="Delete note"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
