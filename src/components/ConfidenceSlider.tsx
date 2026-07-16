"use client";

type Props = { value: number | null; onChange: (value: number) => void; disabled?: boolean };

export function ConfidenceSlider({ value, onChange, disabled }: Props) {
  return (
    <label className="grid gap-2 text-sm">
      <span className="flex items-center justify-between text-slate-300">
        <span>Confidence that the main diagnosis is correct</span>
        <strong className="text-cyan-200">{value === null ? "Not selected" : `${value}/100`}</strong>
      </span>
      <input
        aria-label="Confidence"
        type="range"
        min="0"
        max="100"
        step="1"
        value={value ?? 50}
        disabled={disabled}
        onChange={(event) => onChange(Number(event.target.value))}
        className="accent-cyan-400"
      />
      <span className="flex justify-between text-xs text-slate-500"><span>Completely uncertain</span><span>Completely certain</span></span>
    </label>
  );
}
