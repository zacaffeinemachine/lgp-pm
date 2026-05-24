import { useState } from "react";

const DAYS = 365;

function exactShared(k: number): number {
  if (k < 2) return 0;
  let distinct = 1;
  for (let i = 0; i < k; i++) distinct *= (DAYS - i) / DAYS;
  return 1 - distinct;
}

function simulateShared(k: number, trials: number): number {
  let hits = 0;
  for (let t = 0; t < trials; t++) {
    const seen = new Set<number>();
    let collision = false;
    for (let i = 0; i < k; i++) {
      const b = Math.floor(Math.random() * DAYS);
      if (seen.has(b)) { collision = true; break; }
      seen.add(b);
    }
    if (collision) hits++;
  }
  return hits / trials;
}

export default function BirthdayProblem() {
  const [k, setK] = useState(23);
  const [sim, setSim] = useState<number | null>(null);

  const p = exactShared(k);
  const pct = (x: number) => `${(100 * x).toFixed(1)}%`;

  return (
    <figure className="not-prose my-8 p-5 rounded-lg border border-[var(--rule)] bg-[var(--surface)] space-y-4">
      <label className="block text-sm">
        <span className="text-[var(--muted)]">
          Class size: <strong className="text-[var(--ink)] tabular-nums">{k}</strong> students
        </span>
        <input
          type="range"
          min={2}
          max={60}
          step={1}
          value={k}
          onChange={(e) => { setK(Number(e.target.value)); setSim(null); }}
          className="w-full mt-2 accent-[var(--accent)]"
        />
      </label>

      <div>
        <div className="flex items-baseline justify-between text-sm mb-1">
          <span className="text-[var(--muted)]">Probability some two share a birthday</span>
          <span className="text-2xl font-semibold tabular-nums" style={{ color: "var(--accent)" }}>{pct(p)}</span>
        </div>
        <div className="h-3 w-full rounded bg-[var(--bg)] border border-[var(--rule)] overflow-hidden">
          <div style={{ width: `${p * 100}%`, height: "100%", background: "var(--accent)", transition: "width 120ms ease" }} />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-sm">
        <button
          onClick={() => setSim(simulateShared(k, 5000))}
          className="px-3 py-1.5 rounded-md border border-[var(--rule)] hover:border-[var(--accent)] transition-colors"
        >
          Simulate 5,000 classes
        </button>
        {sim !== null && (
          <span className="text-[var(--muted)] tabular-nums">
            simulated: <strong className="text-[var(--ink)]">{pct(sim)}</strong>
          </span>
        )}
        <span className="text-[var(--muted)] ml-auto text-xs">
          crosses 50% at 23 · 99% at 57
        </span>
      </div>

      <p className="text-xs text-[var(--muted)]">
        With just 23 students a shared birthday is already more likely than not — far
        sooner than the 365 days might suggest.
      </p>
    </figure>
  );
}
