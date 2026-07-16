"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { saveReader } from "@/lib/storage";

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState("");

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    if (data.get("consent") !== "on") return setError("Consent is required to continue.");
    const email = String(data.get("email") || "").trim();
    const studyId = String(data.get("studyId") || "").trim();
    const country = String(data.get("country") || "").trim();
    const specialty = String(data.get("specialty") || "").trim();
    const trainingLevel = String(data.get("trainingLevel") || "").trim();
    if (!email || !studyId || !country || !specialty || !trainingLevel) return setError("Complete all required fields.");
    saveReader({ email, studyId, country, specialty, trainingLevel, yearsIndependent: Number(data.get("yearsIndependent") || 0), priorLlmUse: String(data.get("priorLlmUse") || "Never"), consentedAt: new Date().toISOString() });
    router.push("/dashboard");
  }

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-10 text-white">
      <div className="mx-auto max-w-4xl">
        <Link href="/" className="text-sm text-cyan-300 hover:text-cyan-200">← Back to home</Link>
        <div className="mt-8 rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl">
          <p className="text-sm font-medium text-cyan-300">Reader registration</p>
          <h1 className="mt-2 text-3xl font-bold">Create your study profile</h1>
          <p className="mt-3 text-slate-300">This MVP stores data in this browser. Production deployment should replace browser storage with authenticated server-side persistence.</p>
          <form onSubmit={submit} className="mt-8 grid gap-6">
            <div className="grid gap-6 md:grid-cols-2">
              <label className="form-label"><span>Email *</span><input name="email" type="email" required placeholder="name@example.com" className="field" /></label>
              <label className="form-label"><span>Pseudonymous study ID *</span><input name="studyId" required placeholder="RAD-US-001" className="field" /></label>
              <label className="form-label"><span>Country *</span><input name="country" required placeholder="United States" className="field" /></label>
              <label className="form-label"><span>Specialty *</span><select name="specialty" required className="field"><option value="">Select specialty</option><option>Radiology</option><option>Internal Medicine</option><option>Cardiology</option><option>Ophthalmology</option><option>Other</option></select></label>
              <label className="form-label"><span>Training level *</span><select name="trainingLevel" required className="field"><option value="">Select level</option><option>Resident</option><option>Fellow</option><option>Attending</option><option>Other</option></select></label>
              <label className="form-label"><span>Years of independent practice</span><input name="yearsIndependent" type="number" min="0" max="70" defaultValue="0" className="field" /></label>
              <label className="form-label"><span>Prior LLM use</span><select name="priorLlmUse" className="field"><option>Never</option><option>Rarely</option><option>Monthly</option><option>Weekly</option><option>Daily</option></select></label>
            </div>
            <label className="flex gap-3 rounded-2xl border border-white/10 bg-slate-900 p-4 text-sm text-slate-300"><input name="consent" type="checkbox" className="mt-1" /><span>I consent to participate and understand that diagnostic responses, confidence, timing, and AI interactions will be recorded.</span></label>
            {error && <p className="text-sm text-rose-300">{error}</p>}
            <button className="primary-button">Continue to dashboard</button>
          </form>
        </div>
      </div>
    </main>
  );
}
