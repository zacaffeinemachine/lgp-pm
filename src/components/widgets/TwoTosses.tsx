import { useState } from "react";

type Outcome = "HH" | "HT" | "TH" | "TT";
const OUTCOMES: Outcome[] = ["HH", "HT", "TH", "TT"];

export default function TwoTosses() {
  const [counts, setCounts] = useState<Record<Outcome, number>>({ HH: 0, HT: 0, TH: 0, TT: 0 });
  const total = OUTCOMES.reduce((s, o) => s + counts[o], 0);

  function flip(times: number) {
    const next = { ...counts };
    for (let i = 0; i < times; i++) {
      const a = Math.random() < 0.5 ? "H" : "T";
      const b = Math.random() < 0.5 ? "H" : "T";
      next[(a + b) as Outcome] += 1;
    }
    setCounts(next);
  }
  const reset = () => setCounts({ HH: 0, HT: 0, TH: 0, TT: 0 });

  const frac = (c: number) => (total ? c / total : 0);
  const pct = (c: number) => (total ? `${(100 * c / total).toFixed(0)}%` : "—");

  // The "one of each" group merges two distinct outcomes.
  const groups = [
    { label: "two heads", outs: ["HH"] as Outcome[] },
    { label: "one of each", outs: ["HT", "TH"] as Outcome[] },
    { label: "two tails", outs: ["TT"] as Outcome[] },
  ];

  return (
    <figure className="not-prose my-8 p-5 rounded-lg border border-[var(--rule)] bg-[var(--surface)] space-y-5">
      <div>
        <div className="text-xs uppercase tracking-wider text-[var(--muted)] mb-2">
          The four equally likely outcomes
        </div>
        <div className="grid grid-cols-4 gap-2">
          {OUTCOMES.map((o) => (
            <div key={o} className="rounded-md border border-[var(--rule)] p-2 text-center">
              <div className="font-mono font-semibold text-lg">{o}</div>
              <div className="mt-2 h-16 flex items-end">
                <div
                  className="w-full rounded-t"
                  style={{ height: `${frac(counts[o]) * 100}%`, background: "var(--accent)", transition: "height 120ms ease", minHeight: counts[o] ? 2 : 0 }}
                />
              </div>
              <div className="text-xs text-[var(--muted)] tabular-nums mt-1">{pct(counts[o])}</div>
              <div className="text-[10px] text-[var(--muted)] tabular-nums">{counts[o]}</div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <div className="text-xs uppercase tracking-wider text-[var(--muted)] mb-2">
          Grouped as the first student counted them (1 : 2 : 1)
        </div>
        <div className="grid grid-cols-3 gap-2 text-sm">
          {groups.map((g) => {
            const c = g.outs.reduce((s, o) => s + counts[o], 0);
            return (
              <div key={g.label} className="rounded-md border border-[var(--rule)] p-2 text-center">
                <div className="text-[var(--muted)]">{g.label}</div>
                <div className="font-semibold tabular-nums" style={{ color: "var(--accent)" }}>{pct(c)}</div>
                <div className="text-[10px] text-[var(--muted)]">
                  {g.outs.join(" + ")}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-sm">
        {[1, 100, 1000].map((t) => (
          <button key={t} onClick={() => flip(t)} className="px-3 py-1.5 rounded-md border border-[var(--rule)] hover:border-[var(--accent)] transition-colors tabular-nums">
            Flip {t === 1 ? "once" : `×${t}`}
          </button>
        ))}
        <button onClick={reset} className="px-3 py-1.5 rounded-md border border-[var(--rule)] hover:border-[var(--accent)] transition-colors">Reset</button>
        <span className="text-[var(--muted)] tabular-nums ml-auto">{total.toLocaleString()} trials</span>
      </div>

      <p className="text-xs text-[var(--muted)]">
        "One of each" lands about twice as often as "two heads" — because it bundles two
        distinct outcomes, <span className="font-mono">HT</span> and{" "}
        <span className="font-mono">TH</span>. That is exactly the mistake behind the
        answer 1/3.
      </p>
    </figure>
  );
}
