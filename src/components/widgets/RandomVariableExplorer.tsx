import { useState } from "react";

// A random variable is a readout of an experiment. Pick one of three readouts,
// sample it, and watch the empirical distribution fill in toward the theory.

type RVKey = "heads3" | "sum2" | "max3";

const RVS: Record<
  RVKey,
  {
    label: string;
    symbol: string;
    values: number[];
    sample: () => number;
    prob: (v: number) => number;
    caption: string;
  }
> = {
  heads3: {
    label: "Heads in 3 tosses",
    symbol: "X",
    values: [0, 1, 2, 3],
    sample: () => {
      let h = 0;
      for (let i = 0; i < 3; i++) if (Math.random() < 0.5) h++;
      return h;
    },
    prob: (v) => [1, 3, 3, 1][v] / 8,
    caption: "Three fair coins; X counts the heads. Values 1 and 2 bundle three outcomes each.",
  },
  sum2: {
    label: "Sum of 2 dice",
    symbol: "S",
    values: [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    sample: () =>
      1 + Math.floor(Math.random() * 6) + 1 + Math.floor(Math.random() * 6),
    prob: (v) => (6 - Math.abs(v - 7)) / 36,
    caption: "Two fair dice; S is their sum. The distribution peaks at 7.",
  },
  max3: {
    label: "Max of 3 dice",
    symbol: "M",
    values: [1, 2, 3, 4, 5, 6],
    sample: () => {
      let m = 0;
      for (let i = 0; i < 3; i++) m = Math.max(m, 1 + Math.floor(Math.random() * 6));
      return m;
    },
    prob: (v) => (v ** 3 - (v - 1) ** 3) / 216,
    caption: "Three fair dice; M is the largest. Big values dominate, since P(M ≤ k) = (k/6)³.",
  },
};

export default function RandomVariableExplorer() {
  const [key, setKey] = useState<RVKey>("heads3");
  const [counts, setCounts] = useState<Record<number, number>>({});

  const rv = RVS[key];
  const total = Object.values(counts).reduce((s, c) => s + c, 0);
  const maxProb = Math.max(...rv.values.map(rv.prob));

  function draw(times: number) {
    const next = { ...counts };
    for (let i = 0; i < times; i++) {
      const v = rv.sample();
      next[v] = (next[v] ?? 0) + 1;
    }
    setCounts(next);
  }
  function switchRV(k: RVKey) {
    setKey(k);
    setCounts({});
  }

  const frac = (v: number) => (total ? (counts[v] ?? 0) / total : 0);

  return (
    <figure className="not-prose my-8 p-5 rounded-lg border border-[var(--rule)] bg-[var(--surface)] space-y-5">
      <div className="flex flex-wrap gap-2 text-sm">
        {(Object.keys(RVS) as RVKey[]).map((k) => (
          <button
            key={k}
            onClick={() => switchRV(k)}
            aria-pressed={key === k}
            className="px-3 py-1.5 rounded-md border transition-colors"
            style={{
              borderColor: key === k ? "var(--accent)" : "var(--rule)",
              background: key === k ? "var(--accent-soft)" : "transparent",
              color: key === k ? "var(--accent)" : "var(--muted)",
            }}
          >
            {RVS[k].label}
          </button>
        ))}
      </div>

      <div>
        <div className="text-xs uppercase tracking-wider text-[var(--muted)] mb-2">
          Distribution of {rv.symbol} — bars are simulated, ticks are exact
        </div>
        <div
          className="grid gap-1.5 items-end"
          style={{ gridTemplateColumns: `repeat(${rv.values.length}, minmax(0, 1fr))` }}
        >
          {rv.values.map((v) => {
            const h = total ? (frac(v) / maxProb) * 100 : 0;
            const tick = (rv.prob(v) / maxProb) * 100;
            return (
              <div key={v} className="text-center">
                <div className="relative h-28 flex items-end">
                  <div
                    className="w-full rounded-t"
                    style={{
                      height: `${h}%`,
                      background: "var(--accent)",
                      transition: "height 120ms ease",
                      minHeight: counts[v] ? 2 : 0,
                    }}
                  />
                  <div
                    className="absolute left-0 right-0 border-t-2 border-dashed"
                    style={{ bottom: `${tick}%`, borderColor: "var(--muted)" }}
                    title={`exact P = ${rv.prob(v).toFixed(3)}`}
                  />
                </div>
                <div className="text-xs font-mono mt-1">{v}</div>
                <div className="text-[10px] text-[var(--muted)] tabular-nums">
                  {total ? `${(100 * frac(v)).toFixed(0)}%` : "—"}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-sm">
        {[1, 100, 1000].map((t) => (
          <button
            key={t}
            onClick={() => draw(t)}
            className="px-3 py-1.5 rounded-md border border-[var(--rule)] hover:border-[var(--accent)] transition-colors tabular-nums"
          >
            Sample {t === 1 ? "once" : `×${t}`}
          </button>
        ))}
        <button
          onClick={() => setCounts({})}
          className="px-3 py-1.5 rounded-md border border-[var(--rule)] hover:border-[var(--accent)] transition-colors"
        >
          Reset
        </button>
        <span className="text-[var(--muted)] tabular-nums ml-auto">
          {total.toLocaleString()} samples
        </span>
      </div>

      <p className="text-xs text-[var(--muted)]">{rv.caption}</p>
    </figure>
  );
}
