export default function RegisterPage() {
  return (
    <main className="min-h-screen bg-slate-950 px-6 py-10 text-white">
      <div className="mx-auto max-w-4xl">
        <a href="/" className="text-sm text-cyan-300 hover:text-cyan-200">
          ← Back to home
        </a>

        <div className="mt-8 rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl">
          <div className="mb-8">
            <p className="text-sm font-medium text-cyan-300">
              Reader registration
            </p>
            <h1 className="mt-2 text-3xl font-bold">
              Create your study profile
            </h1>
            <p className="mt-3 text-slate-300">
              This information will be used to assign cases by specialty and to
              analyze diagnostic performance by training background and prior AI
              use.
            </p>
          </div>

          <form className="grid gap-6">
            <div className="grid gap-6 md:grid-cols-2">
              <label className="grid gap-2">
                <span className="text-sm font-medium text-slate-200">
                  Email
                </span>
                <input
                  type="email"
                  placeholder="name@example.com"
                  className="rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none focus:border-cyan-400"
                />
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-medium text-slate-200">
                  Name or study ID
                </span>
                <input
                  type="text"
                  placeholder="Dr. Smith or R001"
                  className="rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none focus:border-cyan-400"
                />
              </label>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <label className="grid gap-2">
                <span className="text-sm font-medium text-slate-200">
                  Specialty
                </span>
                <select className="rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none focus:border-cyan-400">
                  <option>Select specialty</option>
                  <option>Radiology</option>
                  <option>Internal Medicine</option>
                  <option>Emergency Medicine</option>
                  <option>Cardiology</option>
                  <option>Ophthalmology</option>
                  <option>General Practice</option>
                  <option>Other</option>
                </select>
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-medium text-slate-200">
                  Training level
                </span>
                <select className="rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none focus:border-cyan-400">
                  <option>Select level</option>
                  <option>Medical student</option>
                  <option>Resident</option>
                  <option>Fellow</option>
                  <option>Attending</option>
                  <option>Other</option>
                </select>
              </label>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <label className="grid gap-2">
                <span className="text-sm font-medium text-slate-200">
                  Years of independent practice
                </span>
                <input
                  type="number"
                  min="0"
                  placeholder="0"
                  className="rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none focus:border-cyan-400"
                />
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-medium text-slate-200">
                  Prior LLM use
                </span>
                <select className="rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none focus:border-cyan-400">
                  <option>Select frequency</option>
                  <option>Never</option>
                  <option>Rarely</option>
                  <option>Monthly</option>
                  <option>Weekly</option>
                  <option>Daily</option>
                </select>
              </label>
            </div>

            <label className="flex gap-3 rounded-2xl border border-white/10 bg-slate-900 p-4 text-sm text-slate-300">
              <input type="checkbox" className="mt-1" />
              <span>
                I consent to participate in this research study and understand
                that my diagnostic responses, timing, and AI interactions may be
                recorded for research analysis.
              </span>
            </label>

            <div className="flex flex-col gap-3 sm:flex-row">
              <a
                href="/dashboard"
                className="rounded-xl bg-cyan-400 px-6 py-3 text-center font-semibold text-slate-950 shadow-lg shadow-cyan-400/20 hover:bg-cyan-300"
              >
                Continue to dashboard
              </a>

              <a
                href="/"
                className="rounded-xl border border-white/20 px-6 py-3 text-center font-semibold text-white hover:bg-white/10"
              >
                Cancel
              </a>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}