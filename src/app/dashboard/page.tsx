"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CASES, type StudyState } from "@/lib/study";
import { clearStudy, loadState } from "@/lib/storage";

export default function DashboardPage() {
  const [state, setState] = useState<StudyState>({ sessions: {} });
  useEffect(() => { const timer = window.setTimeout(() => setState(loadState()), 0); return () => window.clearTimeout(timer); }, []);
  const completed = Object.values(state.sessions).filter((session) => session.phase === "completed").length;

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-10 text-white">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div><p className="text-sm font-medium text-cyan-300">RAG-Dx Study Platform</p><h1 className="mt-2 text-3xl font-bold">Reader dashboard</h1><p className="mt-2 text-slate-300">Every case begins unaided, then unlocks GPT alone or GPT + OpenScholar.</p></div>
          <div className="flex gap-2"><Link href="/" className="secondary-button">Home</Link><button onClick={() => { clearStudy(); location.href = "/register"; }} className="secondary-button">Reset demo</button></div>
        </div>
        {!state.reader ? <div className="mt-8 rounded-2xl border border-amber-400/30 bg-amber-400/10 p-5 text-amber-100">No reader profile found. <a className="underline" href="/register">Register first</a>.</div> : null}
        <section className="mt-10 grid gap-6 md:grid-cols-3">
          <div className="stat-card"><p className="text-sm text-slate-400">Reader</p><p className="mt-2 text-2xl font-bold">{state.reader?.studyId || "Not registered"}</p><p className="mt-2 text-sm text-slate-300">{state.reader?.specialty || "—"}</p></div>
          <div className="stat-card"><p className="text-sm text-slate-400">Cases completed</p><p className="mt-2 text-4xl font-bold">{completed} / {CASES.length}</p><p className="mt-2 text-sm text-slate-300">Baseline and post-AI answers are both required.</p></div>
          <div className="stat-card"><p className="text-sm text-slate-400">Storage mode</p><p className="mt-2 text-2xl font-bold">Browser MVP</p><p className="mt-2 text-sm text-slate-300">Ready for pilot UI testing; not yet research production infrastructure.</p></div>
        </section>
        <section className="mt-8 overflow-hidden rounded-3xl border border-white/10 bg-white/5">
          <div className="border-b border-white/10 p-6"><h2 className="text-2xl font-bold">Assigned cases</h2></div>
          <div className="divide-y divide-white/10">
            {CASES.map((studyCase, index) => { const session = state.sessions[studyCase.id]; const status = session?.phase || "not started"; return (
              <div key={studyCase.id} className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
                <div><p className="text-xs font-semibold uppercase tracking-wide text-cyan-300">Case {index + 1} · {studyCase.specialty}</p><h3 className="mt-1 text-lg font-semibold">{studyCase.id}</h3><p className="mt-1 text-sm text-slate-400">Status: {status.replace("_", " ")}</p></div>
                <a href={`/case/${studyCase.id}`} className="primary-button text-center">{status === "completed" ? "Review locked case" : session ? "Continue case" : "Start case"}</a>
              </div>
            ); })}
          </div>
        </section>
      </div>
    </main>
  );
}
