"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CASES, type CaseSession, type DiagnosticAnswer } from "@/lib/study";
import { ensureSession, submitAnswer } from "@/lib/storage";
import { DiagnosticForm } from "@/components/DiagnosticForm";
import { ChatPanel } from "@/components/ChatPanel";

export default function CasePage({ params }: { params: Promise<{ caseId: string }> }) {
  const { caseId } = use(params);
  const router = useRouter();
  const studyCase = CASES.find((item) => item.id === caseId);
  const [session, setSession] = useState<CaseSession | null>(null);
  useEffect(() => { if (!studyCase) return; const timer = window.setTimeout(() => setSession(ensureSession(caseId)), 0); return () => window.clearTimeout(timer); }, [caseId, studyCase]);
  if (!studyCase) return <main className="min-h-screen bg-slate-950 p-10 text-white">Case not found.</main>;
  if (!session) return <main className="min-h-screen bg-slate-950 p-10 text-white">Loading case…</main>;

  function save(phase: "baseline" | "final", answer: DiagnosticAnswer) {
    const next = submitAnswer(caseId, phase, answer); setSession({ ...next });
    if (phase === "final") setTimeout(() => router.push("/dashboard"), 900);
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <header className="border-b border-white/10 px-6 py-4"><div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3"><div><p className="text-sm font-medium text-cyan-300">RAG-Dx Study Platform</p><h1 className="text-xl font-bold">Case {studyCase.id}</h1></div><a href="/dashboard" className="secondary-button">Back to dashboard</a></div></header>
      <div className="mx-auto grid max-w-7xl gap-6 px-6 py-6 lg:grid-cols-2">
        <section className="panel"><div className="mb-5 flex items-center justify-between"><div><h2 className="text-2xl font-bold">Case information</h2><p className="mt-1 text-sm text-slate-300">Complete the unaided assessment before accessing AI.</p></div><span className="badge">{studyCase.specialty}</span></div>
          <div className="grid gap-4">{studyCase.sections.map(([heading, text]) => <div key={heading} className="rounded-2xl border border-white/10 bg-slate-900 p-5"><h3 className="font-semibold text-cyan-200">{heading}</h3><p className="mt-2 text-sm leading-6 text-slate-200">{text}</p></div>)}
            <div className="rounded-2xl border border-dashed border-cyan-400/30 bg-cyan-400/5 p-6"><h3 className="font-semibold text-cyan-200">Image / DICOM viewer integration point</h3><div className="mt-4 flex h-56 items-center justify-center rounded-xl border border-white/10 bg-slate-950 text-center text-sm text-slate-400">Embed the Discovery viewer here using its approved URL/token contract.</div></div>
          </div>
        </section>
        <section className="panel"><h2 className="text-2xl font-bold">Diagnostic workflow</h2><p className="mt-1 text-sm text-slate-300">Baseline responses are locked before the randomized AI condition is revealed.</p>
          <div className="mt-6"><DiagnosticForm title="1. Unaided diagnostic assessment" submitLabel="Submit and lock baseline answer" lockedAnswer={session.baseline} onSubmit={(answer) => save("baseline", answer)} /></div>
          <div className="mt-6">{session.phase === "baseline" ? <div className="rounded-2xl border border-white/10 bg-slate-900 p-5 text-sm text-slate-400">The AI assistant unlocks after baseline submission.</div> : <ChatPanel session={session} onChange={setSession} />}</div>
          <div className="mt-6"><DiagnosticForm title="2. Post-AI diagnostic assessment" submitLabel="Submit final answer" disabled={session.phase === "baseline"} lockedAnswer={session.final} onSubmit={(answer) => save("final", answer)} /></div>
          {session.phase === "completed" && <div className="mt-4 rounded-xl border border-emerald-400/30 bg-emerald-400/10 p-4 text-sm text-emerald-200">Case completed. Returning to dashboard…</div>}
        </section>
      </div>
    </main>
  );
}
