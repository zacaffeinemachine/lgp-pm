import { useState } from "react";

// Fair/biased coin builder: drag P(H); the two masses always sum to 1.
export default function CoinBuilder() {
  const [pH, setPH] = useState(0.5);
  const pT = 1 - pH;
  const pct = (x: number) => `${(100 * x).toFixed(0)}%`;

  return (
    <figure className="not-prose my-8 p-5 rounded-lg border border-[var(--rule)] bg-[var(--surface)] space-y-4">
      <label className="block text-sm">
        <span className="text-[var(--muted)]">
          Probability of heads, <code>P(H)</code> ={" "}
          <strong className="text-[var(--ink)] tabular-nums">{pH.toFixed(2)}</strong>
        </span>
        <input
          type="range"
          min={0}
          max={1}
          step={0.05}
          value={pH}
          onChange={(e) => setPH(Number(e.target.value))}
          className="w-full mt-2 accent-[var(--accent)]"
        />
      </label>

      <div className="space-y-2">
        <Bar label="H" value={pH} color="var(--coin-heads)" pct={pct(pH)} />
        <Bar label="T" value={pT} color="var(--coin-tails)" pct={pct(pT)} />
      </div>

      <p className="text-xs text-[var(--muted)]">
        The two masses always sum to 100%, so every setting is a valid probability
        measure on the same sample space. The coin is fair only at the midpoint;
        everywhere else, same Ω, different P.
      </p>
    </figure>
  );
}

function Bar({ label, value, color, pct }: { label: string; value: number; color: string; pct: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="w-6 font-mono font-semibold text-center">{label}</span>
      <div className="flex-1 h-7 rounded bg-[var(--bg)] overflow-hidden border border-[var(--rule)]">
        <div
          className="h-full flex items-center justify-end pr-2 text-xs font-medium"
          style={{ width: `${Math.max(value * 100, 0)}%`, background: color, color: "#18181b", transition: "width 120ms ease" }}
        >
          {value >= 0.15 && pct}
        </div>
      </div>
    </div>
  );
}
