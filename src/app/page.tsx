export default function Home() {
  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <section className="mx-auto flex min-h-screen max-w-6xl flex-col items-center justify-center px-6 py-16 text-center">
        <div className="mb-6 rounded-full border border-cyan-400/30 bg-cyan-400/10 px-4 py-2 text-sm font-medium text-cyan-200">RAG-Dx Study Platform</div>
        <h1 className="max-w-4xl text-4xl font-bold tracking-tight sm:text-6xl">Measure the incremental diagnostic value of literature-grounded AI</h1>
        <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-300">Every reader first records a main diagnosis, up to three differentials, and confidence without AI. Each reader-case is then assigned to GPT alone or GPT + OpenScholar before the same assessment is repeated.</p>
        <div className="mt-10 flex flex-col gap-4 sm:flex-row"><a href="/register" className="primary-button">Register reader</a><a href="/dashboard" className="secondary-button">Open dashboard</a></div>
        <div className="mt-16 grid w-full gap-4 text-left md:grid-cols-3">
          <div className="stat-card"><h2 className="text-lg font-semibold">Universal baseline</h2><p className="mt-3 text-sm leading-6 text-slate-300">The AI interface remains locked until the unaided response and confidence score are submitted.</p></div>
          <div className="stat-card"><h2 className="text-lg font-semibold">Two randomized conditions</h2><p className="mt-3 text-sm leading-6 text-slate-300">A deterministic reader-case assignment provides GPT alone or GPT with OpenScholar retrieval.</p></div>
          <div className="stat-card"><h2 className="text-lg font-semibold">Prompt separation</h2><p className="mt-3 text-sm leading-6 text-slate-300">Physician-written prompts remain distinguishable from automatically inserted case content.</p></div>
        </div>
      </section>
    </main>
  );
}
