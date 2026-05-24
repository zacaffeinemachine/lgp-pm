import { useState } from "react";

export default function AvoidEvents() {
  const [n, setN] = useState(20);
  const [p, setP] = useState(0.05);
  const [sim, setSim] = useState<number | null>(null);

  const product = Math.pow(1 - p, n);     // exact P(none occur)
  const bound = Math.exp(-n * p);          // 1 - x <= e^{-x}
  const pct = (x: number) => `${(100 * x).toFixed(1)}%`;

  function simulate() {
    const trials = 5000;
    let none = 0;
    for (let t = 0; t < trials; t++) {
      let any = false;
      for (let i = 0; i < n; i++) { if (Math.random() < p) { any = true; break; } }
      if (!any) none++;
    }
    setSim(none / trials);
  }

  return (
    <figure className="not-prose my-8 p-5 rounded-lg border border-[var(--rule)] bg-[var(--surface)] space-y-4">
      <div className="grid sm:grid-cols-2 gap-4 text-sm">
        <label className="block">
          <span className="text-[var(--muted)]">Number of events n = <strong className="text-[var(--ink)]">{n}</strong></span>
          <input type="range" min={1} max={50} step={1} value={n} onChange={(e) => { setN(Number(e.target.value)); setSim(null); }} className="w-full mt-2 accent-[var(--accent)]" />
        </label>
        <label className="block">
          <span className="text-[var(--muted)]">Each probability p = <strong className="text-[var(--ink)] tabular-nums">{p.toFixed(2)}</strong></span>
          <input type="range" min={0.01} max={0.3} step={0.01} value={p} onChange={(e) => { setP(Number(e.target.value)); setSim(null); }} className="w-full mt-2 accent-[var(--accent)]" />
        </label>
      </div>

      <div className="space-y-2 text-sm">
        <Row label="Exact: (1 − p)ⁿ" value={product} pct={pct(product)} color="var(--accent)" />
        <Row label="Bound: e^(−np)" value={bound} pct={pct(bound)} color="var(--muted)" />
        {sim !== null && <Row label="Simulated (5,000 trials)" value={sim} pct={pct(sim)} color="#2563eb" />}
      </div>

      <div className="flex flex-wrap items-center gap-2 text-sm">
        <button onClick={simulate} className="px-3 py-1.5 rounded-md border border-[var(--rule)] hover:border-[var(--accent)] transition-colors">Simulate</button>
        <span className="text-[var(--muted)] text-xs ml-auto">
          (1 − p)ⁿ ≤ e^(−np) always — the product never exceeds the bound.
        </span>
      </div>

      <p className="text-xs text-[var(--muted)]">
        The probability that <em>none</em> of the n independent events occurs is exactly
        (1 − p)ⁿ, and the clean exponential e^(−np) sits just above it — a sharp,
        easy-to-use upper bound on how often we avoid them all.
      </p>
    </figure>
  );
}

function Row({ label, value, pct, color }: { label: string; value: number; pct: string; color: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="w-44 text-[var(--muted)]">{label}</span>
      <div className="flex-1 h-6 rounded bg-[var(--bg)] border border-[var(--rule)] overflow-hidden">
        <div style={{ width: `${Math.min(value * 100, 100)}%`, height: "100%", background: color, transition: "width 120ms ease" }} />
      </div>
      <span className="w-16 text-right tabular-nums" style={{ color }}>{pct}</span>
    </div>
  );
}
