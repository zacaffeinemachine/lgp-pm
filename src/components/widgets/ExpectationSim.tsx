import { useState } from "react";

// Expectation as a long-run average: roll a fair die many times and watch the
// running mean settle toward 3.5 — a value the die itself never shows.

const TARGET = 3.5;

export default function ExpectationSim() {
  const [rolls, setRolls] = useState(0);
  const [sum, setSum] = useState(0);
  const [faces, setFaces] = useState<number[]>([0, 0, 0, 0, 0, 0]);
  const [last, setLast] = useState<number | null>(null);

  function roll(times: number) {
    let s = sum;
    let r = rolls;
    const f = [...faces];
    let lastFace = last;
    for (let i = 0; i < times; i++) {
      lastFace = 1 + Math.floor(Math.random() * 6);
      s += lastFace;
      f[lastFace - 1] += 1;
      r += 1;
    }
    setSum(s);
    setRolls(r);
    setFaces(f);
    setLast(lastFace);
  }
  function reset() {
    setRolls(0);
    setSum(0);
    setFaces([0, 0, 0, 0, 0, 0]);
    setLast(null);
  }

  const mean = rolls ? sum / rolls : 0;
  const maxFace = Math.max(1, ...faces);
  // Position the running-mean needle along a 1..6 axis.
  const needlePct = ((mean - 1) / 5) * 100;
  const targetPct = ((TARGET - 1) / 5) * 100;

  return (
    <figure className="not-prose my-8 p-5 rounded-lg border border-[var(--rule)] bg-[var(--surface)] space-y-5">
      <div className="flex items-baseline justify-between">
        <div>
          <div className="text-xs uppercase tracking-wider text-[var(--muted)]">Running average</div>
          <div className="text-3xl font-semibold tabular-nums" style={{ color: "var(--accent)" }}>
            {rolls ? mean.toFixed(3) : "—"}
          </div>
        </div>
        <div className="text-right">
          <div className="text-xs uppercase tracking-wider text-[var(--muted)]">Target E[X]</div>
          <div className="text-3xl font-semibold tabular-nums text-[var(--muted)]">3.5</div>
        </div>
      </div>

      {/* 1..6 axis with the target and the running mean marked */}
      <div className="relative h-10">
        <div className="absolute top-1/2 left-0 right-0 h-px bg-[var(--rule)]" />
        {[1, 2, 3, 4, 5, 6].map((k) => (
          <div
            key={k}
            className="absolute top-1/2 -translate-y-1/2 text-[10px] text-[var(--muted)] tabular-nums"
            style={{ left: `${((k - 1) / 5) * 100}%`, transform: "translate(-50%,-50%)" }}
          >
            {k}
          </div>
        ))}
        <div
          className="absolute top-0 bottom-0 border-l-2 border-dashed"
          style={{ left: `${targetPct}%`, borderColor: "var(--muted)" }}
          title="E[X] = 3.5"
        />
        {rolls > 0 && (
          <div
            className="absolute top-0 bottom-0 border-l-2"
            style={{ left: `${needlePct}%`, borderColor: "var(--accent)", transition: "left 150ms ease" }}
            title={`running average ${mean.toFixed(3)}`}
          />
        )}
      </div>

      {/* face tally */}
      <div className="grid grid-cols-6 gap-2">
        {faces.map((c, i) => (
          <div key={i} className="text-center">
            <div className="h-16 flex items-end">
              <div
                className="w-full rounded-t"
                style={{
                  height: `${(c / maxFace) * 100}%`,
                  background: last === i + 1 ? "var(--accent)" : "var(--rule)",
                  transition: "height 120ms ease, background 120ms",
                  minHeight: c ? 2 : 0,
                }}
              />
            </div>
            <div className="text-xs font-mono mt-1">{i + 1}</div>
            <div className="text-[10px] text-[var(--muted)] tabular-nums">{c}</div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2 text-sm">
        {[1, 100, 1000].map((t) => (
          <button
            key={t}
            onClick={() => roll(t)}
            className="px-3 py-1.5 rounded-md border border-[var(--rule)] hover:border-[var(--accent)] transition-colors tabular-nums"
          >
            Roll {t === 1 ? "once" : `×${t}`}
          </button>
        ))}
        <button
          onClick={reset}
          className="px-3 py-1.5 rounded-md border border-[var(--rule)] hover:border-[var(--accent)] transition-colors"
        >
          Reset
        </button>
        <span className="text-[var(--muted)] tabular-nums ml-auto">{rolls.toLocaleString()} rolls</span>
      </div>

      <p className="text-xs text-[var(--muted)]">
        The average drifts toward 3.5 and stays there — even though no single roll is ever 3.5.
        Expectation is the balance point of the distribution, not a value the variable must take.
      </p>
    </figure>
  );
}
