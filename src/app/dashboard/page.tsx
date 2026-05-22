export default function DashboardPage() {
  return (
    <main className="min-h-screen bg-slate-950 px-6 py-10 text-white">
      <div className="mx-auto max-w-6xl">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-cyan-300">
              RAG-Dx Study Platform
            </p>
            <h1 className="mt-2 text-3xl font-bold">Reader dashboard</h1>
            <p className="mt-2 text-slate-300">
              Track your assigned diagnostic cases and continue the study.
            </p>
          </div>

          <a
            href="/"
            className="rounded-xl border border-white/20 px-4 py-2 text-sm font-semibold hover:bg-white/10"
          >
            Home
          </a>
        </div>

        <section className="mt-10 grid gap-6 md:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <p className="text-sm text-slate-400">Specialty track</p>
            <p className="mt-2 text-2xl font-bold">Demo reader</p>
            <p className="mt-2 text-sm text-slate-300">
              Specialty-specific cases will appear here after registration.
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <p className="text-sm text-slate-400">Cases completed</p>
            <p className="mt-2 text-4xl font-bold">0 / 8</p>
            <p className="mt-2 text-sm text-slate-300">
              Demo mode uses synthetic placeholder cases.
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <p className="text-sm text-slate-400">Current mode</p>
            <p className="mt-2 text-2xl font-bold">MVP demo</p>
            <p className="mt-2 text-sm text-slate-300">
              Discovery viewer and LLM are represented by placeholders.
            </p>
          </div>
        </section>

        <section className="mt-8 rounded-3xl border border-white/10 bg-white/5 p-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-2xl font-bold">Next assigned case</h2>
              <p className="mt-2 max-w-2xl text-slate-300">
                Start a demo case to test the full workflow: initial answer,
                randomized intervention, and final answer submission.
              </p>
            </div>

            <a
              href="/case/demo"
              className="rounded-xl bg-cyan-400 px-6 py-3 text-center font-semibold text-slate-950 shadow-lg shadow-cyan-400/20 hover:bg-cyan-300"
            >
              Start next case
            </a>
          </div>
        </section>

        <section className="mt-8 rounded-3xl border border-white/10 bg-white/5 p-8">
          <h2 className="text-xl font-bold">MVP checklist</h2>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {[
              "Reader registration page",
              "Dashboard page",
              "Demo case workspace",
              "Initial answer form",
              "Randomized intervention panel",
              "Final answer form",
              "Discovery viewer placeholder",
              "Export-ready data structure",
            ].map((item, index) => (
              <div
                key={item}
                className="flex items-center gap-3 rounded-xl border border-white/10 bg-slate-900 p-4"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-cyan-400/10 text-sm font-bold text-cyan-300">
                  {index + 1}
                </div>
                <p className="text-sm text-slate-200">{item}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}