export default function Home() {
  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <section className="mx-auto flex min-h-screen max-w-6xl flex-col items-center justify-center px-6 py-16 text-center">
        <div className="mb-6 rounded-full border border-cyan-400/30 bg-cyan-400/10 px-4 py-2 text-sm font-medium text-cyan-200">
          RAG-Dx Study Platform
        </div>

        <h1 className="max-w-4xl text-4xl font-bold tracking-tight sm:text-6xl">
          Diagnostic reasoning with and without AI assistance
        </h1>

        <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-300">
          A randomized study platform for evaluating physician diagnostic
          performance across control, LLM, and LLM + OpenScholar/RAG arms.
        </p>

        <div className="mt-10 flex flex-col gap-4 sm:flex-row">
          <a
            href="/register"
            className="rounded-xl bg-cyan-400 px-6 py-3 font-semibold text-slate-950 shadow-lg shadow-cyan-400/20 hover:bg-cyan-300"
          >
            Start study
          </a>

          <a
            href="/dashboard"
            className="rounded-xl border border-white/20 px-6 py-3 font-semibold text-white hover:bg-white/10"
          >
            Resume session
          </a>
        </div>

        <div className="mt-16 grid w-full gap-4 text-left md:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <h2 className="text-lg font-semibold">Randomized workflow</h2>
            <p className="mt-3 text-sm leading-6 text-slate-300">
              Each case is assigned to no AI, LLM, or LLM + RAG after an
              initial unaided answer.
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <h2 className="text-lg font-semibold">Discovery integration</h2>
            <p className="mt-3 text-sm leading-6 text-slate-300">
              The platform will embed Discovery for DICOM/image viewing, LLM
              interaction, and OpenScholar retrieval.
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <h2 className="text-lg font-semibold">Research-grade logging</h2>
            <p className="mt-3 text-sm leading-6 text-slate-300">
              Initial answers, final answers, confidence, timing, prompts, and
              RAG evidence can be exported for analysis.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}