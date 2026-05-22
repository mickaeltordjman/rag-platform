"use client";

import { useState } from "react";

export default function DemoCasePage() {
  const [initialSubmitted, setInitialSubmitted] = useState(false);
  const [finalSubmitted, setFinalSubmitted] = useState(false);

  const [assignedArm] = useState<"control" | "llm" | "llm_rag">(() => {
  const arms = ["control", "llm", "llm_rag"] as const;
  return arms[Math.floor(Math.random() * arms.length)];
});

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="border-b border-white/10 bg-slate-950 px-6 py-4">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div>
            <p className="text-sm font-medium text-cyan-300">
              RAG-Dx Study Platform
            </p>

            <h1 className="text-xl font-bold">Demo Case IM-001</h1>
            <p className="mt-1 text-xs text-slate-400">
             Demo assignment arm:{" "}
            <span className="font-semibold text-cyan-300">{assignedArm}</span>
           </p>

          </div>

          <a
            href="/dashboard"
            className="rounded-xl border border-white/20 px-4 py-2 text-sm font-semibold hover:bg-white/10"
          >
            Back to dashboard
          </a>
        </div>
      </div>

      <div className="mx-auto grid max-w-7xl gap-6 px-6 py-6 lg:grid-cols-2">
        <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Case + Viewer</h2>
              <p className="mt-1 text-sm text-slate-300">
                Initial review should be completed before AI access.
              </p>
            </div>

            <span className="rounded-full bg-cyan-400/10 px-3 py-1 text-xs font-medium text-cyan-300">
              Internal Medicine
            </span>
          </div>

          <div className="grid gap-4">
            <div className="rounded-2xl border border-white/10 bg-slate-900 p-5">
              <h3 className="font-semibold text-cyan-200">Chief complaint</h3>
              <p className="mt-2 text-sm leading-6 text-slate-200">
                A 46-year-old man presents with fever, rash, and progressive
                joint pain.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-slate-900 p-5">
              <h3 className="font-semibold text-cyan-200">History</h3>
              <p className="mt-2 text-sm leading-6 text-slate-200">
                The patient reports one week of intermittent lightheadedness,
                followed by swelling and pain involving both wrists and ankles.
                He also noticed an evanescent salmon-colored rash and daily
                fevers. He denies recent travel, sick contacts, or new
                medications.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-slate-900 p-5">
              <h3 className="font-semibold text-cyan-200">
                Physical examination
              </h3>
              <p className="mt-2 text-sm leading-6 text-slate-200">
                Temperature 38.7°C, blood pressure 147/80 mm Hg, pulse 109
                beats/min, oxygen saturation 100% on room air. Swelling and
                tenderness of the wrists and ankles are present. A faint
                macular rash is seen on the trunk.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-slate-900 p-5">
              <h3 className="font-semibold text-cyan-200">Laboratory results</h3>
              <p className="mt-2 text-sm leading-6 text-slate-200">
                ESR 104 mm/h, ferritin markedly elevated, alkaline phosphatase
                mildly elevated. CBC, kidney function, AST, ALT, and urinalysis
                are otherwise unremarkable.
              </p>
            </div>

            <div className="rounded-2xl border border-dashed border-cyan-400/30 bg-cyan-400/5 p-6">
              <h3 className="font-semibold text-cyan-200">
                Discovery viewer placeholder
              </h3>
              <div className="mt-4 flex h-64 items-center justify-center rounded-xl border border-white/10 bg-slate-950 text-center text-sm text-slate-400">
                Discovery DICOM / image viewer will be embedded here.
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-2xl font-bold">Answers + Intervention</h2>
          <p className="mt-1 text-sm text-slate-300">
            Demo version shows all sections on one page. Later, AI will unlock
            only after the initial answer is submitted.
          </p>

          <div className="mt-6 rounded-2xl border border-white/10 bg-slate-900 p-5">
            <h3 className="text-lg font-semibold">Initial diagnostic assessment</h3>

            <div className="mt-4 grid gap-4">
              <input
                placeholder="Initial diagnosis"
                className="rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none focus:border-cyan-400"
              />

              <input
                placeholder="Differential diagnosis 1"
                className="rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none focus:border-cyan-400"
              />

              <input
                placeholder="Differential diagnosis 2"
                className="rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none focus:border-cyan-400"
              />

              <input
                placeholder="Differential diagnosis 3"
                className="rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none focus:border-cyan-400"
              />

              <label className="grid gap-2 text-sm">
                <span className="text-slate-300">Initial confidence: 0–100</span>
                <input type="range" min="0" max="100" />
              </label>

              <textarea
                placeholder="Brief reasoning, 2–3 bullet points"
                rows={4}
                className="rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none focus:border-cyan-400"
              />

              <button
              type="button"
              onClick={() => setInitialSubmitted(true)}
              className="rounded-xl bg-cyan-400 px-5 py-3 font-semibold text-slate-950 hover:bg-cyan-300"
              >
              {initialSubmitted ? "Initial answer submitted" : "Submit initial answer"}
              </button>
            </div>
          </div>

          <div className="mt-6 rounded-2xl border border-dashed border-cyan-400/30 bg-cyan-400/5 p-5">
         <h3 className="text-lg font-semibold text-cyan-200">
           Randomized intervention
           </h3>

           {!initialSubmitted ? (
            <div className="mt-4 rounded-xl border border-white/10 bg-slate-950 p-4 text-sm text-slate-400">
            Submit the initial diagnostic assessment to unlock the randomized
          intervention.
          </div>
         ) : assignedArm === "control" ? (
          <div className="mt-4 rounded-xl border border-white/10 bg-slate-950 p-4">
         <p className="font-semibold text-white">Assigned arm: No AI</p>
         <p className="mt-2 text-sm leading-6 text-slate-300">
          Please continue reviewing the case and images without AI assistance,
         then submit your final answer.
          </p>
         </div>
         ) : assignedArm === "llm" ? (
           <div className="mt-4 rounded-xl border border-white/10 bg-slate-950 p-4">
         <p className="font-semibold text-white">Assigned arm: LLM</p>
         <p className="mt-2 text-sm leading-6 text-slate-300">
          Discovery LLM chat will be embedded here.
          </p>

         <div className="mt-4 h-56 rounded-xl border border-white/10 bg-slate-900 p-4 text-sm text-slate-400">
          Discovery LLM placeholder
         </div>
          </div>
          ) : (
         <div className="mt-4 rounded-xl border border-white/10 bg-slate-950 p-4">
          <p className="font-semibold text-white">
           Assigned arm: LLM + OpenScholar/RAG
          </p>
          <p className="mt-2 text-sm leading-6 text-slate-300">
           Discovery LLM + OpenScholar retrieval will be embedded here.
          </p>

          <div className="mt-4 h-40 rounded-xl border border-white/10 bg-slate-900 p-4 text-sm text-slate-400">
           Discovery LLM chat placeholder
          </div>

          <div className="mt-4 rounded-xl border border-cyan-400/20 bg-cyan-400/5 p-4">
          <p className="text-sm font-semibold text-cyan-200">
             Retrieved evidence placeholder
           </p>
          <p className="mt-2 text-sm text-slate-300">
            OpenScholar source snippets and clicked references will appear here.
           </p>
         </div>
         </div>
          )}
         </div>

          <div className="mt-6 rounded-2xl border border-white/10 bg-slate-900 p-5">
            <h3 className="text-lg font-semibold">Final diagnostic assessment</h3>

            <div className="mt-4 grid gap-4">
              <input
                placeholder="Final diagnosis"
                className="rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none focus:border-cyan-400"
              />

              <input
                placeholder="Final differential diagnosis 1"
                className="rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none focus:border-cyan-400"
              />

              <input
                placeholder="Final differential diagnosis 2"
                className="rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none focus:border-cyan-400"
              />

              <input
                placeholder="Final differential diagnosis 3"
                className="rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none focus:border-cyan-400"
              />

              <label className="grid gap-2 text-sm">
                <span className="text-slate-300">Final confidence: 0–100</span>
                <input type="range" min="0" max="100" />
              </label>

              <textarea
                placeholder="Final reasoning"
                rows={4}
                className="rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none focus:border-cyan-400"
              />

              <button
             type="button"
             onClick={() => setFinalSubmitted(true)}
             disabled={!initialSubmitted}
              className="rounded-xl bg-cyan-400 px-5 py-3 font-semibold text-slate-950 hover:bg-cyan-300 disabled:cursor-not-allowed disabled:bg-slate-600 disabled:text-slate-300"
              >
              {finalSubmitted ? "Final answer submitted" : "Submit final answer"}
              </button>
               
                 {finalSubmitted && (
                 <div className="rounded-xl border border-emerald-400/30 bg-emerald-400/10 p-4 text-sm text-emerald-200">
                   Demo case completed. In the real platform, this would save the final
                   response and return the reader to the dashboard.
                 </div>
                  )}


            </div>
          </div>
        </section>
      </div>
    </main>
  );
}