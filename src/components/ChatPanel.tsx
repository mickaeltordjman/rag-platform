"use client";

import { FormEvent, useState } from "react";
import type { CaseSession, ChatMessage } from "@/lib/study";
import { caseText } from "@/lib/study";
import { updateSession } from "@/lib/storage";

type Props = { session: CaseSession; onChange: (session: CaseSession) => void };

export function ChatPanel({ session, onChange }: Props) {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function send(event: FormEvent) {
    event.preventDefault();
    if (!message.trim() || loading) return;
    const prompt = message.trim();
    setMessage(""); setLoading(true); setError("");
    const userMessage: ChatMessage = { role: "user", content: prompt, createdAt: new Date().toISOString() };
    let next = updateSession(session.caseId, (current) => ({ ...current, messages: [...current.messages, userMessage] }));
    onChange(next);
    try {
      const response = await fetch("/api/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ arm: session.arm, caseId: session.caseId, caseText: caseText(session.caseId), message: prompt, history: next.messages }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "AI request failed");
      const assistantMessage: ChatMessage = { role: "assistant", content: data.text, sources: data.sources, createdAt: new Date().toISOString() };
      next = updateSession(session.caseId, (current) => ({ ...current, messages: [...current.messages, assistantMessage] }));
      onChange(next);
    } catch (err) { setError(err instanceof Error ? err.message : "AI request failed"); }
    finally { setLoading(false); }
  }

  return (
    <div className="rounded-2xl border border-cyan-400/30 bg-cyan-400/5 p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-lg font-semibold text-cyan-100">AI assistant</h3>
        <span className="badge">{session.arm === "GPT" ? "GPT alone" : "GPT + OpenScholar"}</span>
      </div>
      <p className="mt-2 text-sm text-slate-300">The automatically inserted case content is stored separately from your manual prompt.</p>
      <div className="mt-4 max-h-96 space-y-3 overflow-y-auto rounded-xl border border-white/10 bg-slate-950 p-4">
        {session.messages.length === 0 && <p className="text-sm text-slate-500">Ask the assistant about the diagnosis, differential, or supporting evidence.</p>}
        {session.messages.map((item, index) => (
          <div key={`${item.createdAt}-${index}`} className={`rounded-xl p-3 text-sm leading-6 ${item.role === "user" ? "ml-8 bg-cyan-400/10 text-cyan-50" : "mr-8 bg-white/5 text-slate-200"}`}>
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">{item.role === "user" ? "Physician" : "Assistant"}</p>
            <p className="whitespace-pre-wrap">{item.content}</p>
            {item.sources?.length ? <div className="mt-3 border-t border-white/10 pt-2 text-xs text-slate-400">Sources: {item.sources.map((source) => source.title).join("; ")}</div> : null}
          </div>
        ))}
        {loading && <p className="text-sm text-cyan-200">Generating response…</p>}
      </div>
      <form onSubmit={send} className="mt-4 grid gap-3">
        <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={3} placeholder="Write your prompt…" className="field" />
        {error && <p className="text-sm text-rose-300">{error}</p>}
        <button disabled={loading || !message.trim()} className="primary-button disabled:opacity-50">Send prompt</button>
      </form>
    </div>
  );
}
