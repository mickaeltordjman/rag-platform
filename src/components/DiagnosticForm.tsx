"use client";

import { FormEvent, useState } from "react";
import type { DiagnosticAnswer } from "@/lib/study";
import { ConfidenceSlider } from "./ConfidenceSlider";

type Props = {
  title: string;
  submitLabel: string;
  disabled?: boolean;
  lockedAnswer?: DiagnosticAnswer;
  onSubmit: (answer: DiagnosticAnswer) => void;
};

export function DiagnosticForm({ title, submitLabel, disabled, lockedAnswer, onSubmit }: Props) {
  const [mainDiagnosis, setMainDiagnosis] = useState(lockedAnswer?.mainDiagnosis ?? "");
  const [differentials, setDifferentials] = useState<[string, string, string]>(lockedAnswer?.differentials ?? ["", "", ""]);
  const [confidence, setConfidence] = useState<number | null>(lockedAnswer?.confidence ?? null);
  const [error, setError] = useState("");
  const locked = Boolean(lockedAnswer) || disabled;

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!mainDiagnosis.trim()) return setError("Enter a main diagnosis.");
    if (confidence === null) return setError("Select a confidence level.");
    setError("");
    onSubmit({ mainDiagnosis: mainDiagnosis.trim(), differentials: differentials.map((d) => d.trim()) as [string,string,string], confidence, submittedAt: new Date().toISOString() });
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl border border-white/10 bg-slate-900 p-5">
      <h3 className="text-lg font-semibold">{title}</h3>
      <div className="mt-4 grid gap-4">
        <input value={mainDiagnosis} disabled={locked} onChange={(e) => setMainDiagnosis(e.target.value)} placeholder="Main diagnosis" className="field" />
        {differentials.map((value, index) => (
          <input key={index} value={value} disabled={locked} onChange={(e) => { const copy = [...differentials] as [string,string,string]; copy[index] = e.target.value; setDifferentials(copy); }} placeholder={`Differential diagnosis ${index + 1} (optional)`} className="field" />
        ))}
        <ConfidenceSlider value={confidence} disabled={locked} onChange={setConfidence} />
        {error && <p className="text-sm text-rose-300">{error}</p>}
        {lockedAnswer ? (
          <div className="rounded-xl border border-emerald-400/20 bg-emerald-400/10 p-3 text-sm text-emerald-200">Submitted and locked.</div>
        ) : (
          <button disabled={disabled} className="primary-button disabled:cursor-not-allowed disabled:bg-slate-600 disabled:text-slate-300">{submitLabel}</button>
        )}
      </div>
    </form>
  );
}
