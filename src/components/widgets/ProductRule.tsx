import { useState } from "react";

// The product rule E[XY] = E[X]E[Y] holds for independent variables and can
// fail otherwise. Compare two dice rolled independently against the degenerate
// case Y = X, where the gap E[XY] - E[X]E[Y] is exactly the variance.

type Mode = "indep" | "same";

const d6 = () => 1 + Math.floor(Math.random() * 6);

export default function ProductRule() {
  const [mode, setMode] = useState<Mode>("indep");
  const [n, setN] = useState(0);
  const [sx, setSx] = useState(0);
  const [sy, setSy] = useState(0);
  const [sxy, setSxy] = useState(0);

  function run(times: number) {
    let nx = sx,
      ny = sy,
      nxy = sxy,
      nn = n;
    for (let i = 0; i < times; i++) {
      const x = d6();
      const y = mode === "indep" ? d6() : x;
      nx += x;
      ny += y;
      nxy += x * y;
      nn += 1;
    }
    setSx(nx);
    setSy(ny);
    setSxy(nxy);
    setN(nn);
  }
  function switchMode(m: Mode) {
    setMode(m);
    setN(0);
    setSx(0);
    setSy(0);
    setSxy(0);
  }

  const ex = n ? sx / n : 0;
  const ey = n ? sy / n : 0;
  const exy = n ? sxy / n : 0;
  const prod = ex * ey;
  const gap = exy - prod;

  const f = (x: number) => (n ? x.toFixed(3) : "—");

  return (
    <figure className="not-prose my-8 p-5 rounded-lg border border-[var(--rule)] bg-[var(--surface)] space-y-4">
      <div className="inline-flex rounded-lg border border-[var(--rule)] overflow-hidden text-sm">
        <button
          onClick={() => switchMode("indep")}
          aria-selected={mode === "indep"}
          className="px-4 py-1.5 transition-colors"
          style={{
            background: mode === "indep" ? "var(--accent)" : "transparent",
            color: mode === "indep" ? "#fff" : "var(--muted)",
          }}
        >
          Independent dice
        </button>
        <button
          onClick={() => switchMode("same")}
          aria-selected={mode === "same"}
          className="px-4 py-1.5 transition-colors"
          style={{
            background: mode === "same" ? "var(--accent)" : "transparent",
            color: mode === "same" ? "#fff" : "var(--muted)",
          }}
        >
          Same die (Y = X)
        </button>
      </div>

      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="text-[var(--muted)] text-left text-xs uppercase tracking-wider">
            <th className="py-1">quantity</th>
            <th className="py-1 text-right">simulated</th>
            <th className="py-1 text-right">exact</th>
          </tr>
        </thead>
        <tbody className="tabular-nums">
          <tr className="border-t border-[var(--rule)]">
            <td className="py-1.5">E[X]</td>
            <td className="py-1.5 text-right">{f(ex)}</td>
            <td className="py-1.5 text-right text-[var(--muted)]">3.5</td>
          </tr>
          <tr className="border-t border-[var(--rule)]">
            <td className="py-1.5">E[Y]</td>
            <td className="py-1.5 text-right">{f(ey)}</td>
            <td className="py-1.5 text-right text-[var(--muted)]">3.5</td>
          </tr>
          <tr className="border-t border-[var(--rule)]">
            <td className="py-1.5">E[X]·E[Y]</td>
            <td className="py-1.5 text-right">{f(prod)}</td>
            <td className="py-1.5 text-right text-[var(--muted)]">12.25</td>
          </tr>
          <tr className="border-t border-[var(--rule)]">
            <td className="py-1.5" style={{ color: "var(--accent)" }}>
              E[XY]
            </td>
            <td className="py-1.5 text-right" style={{ color: "var(--accent)" }}>
              {f(exy)}
            </td>
            <td className="py-1.5 text-right text-[var(--muted)]">
              {mode === "indep" ? "12.25" : "15.17"}
            </td>
          </tr>
          <tr className="border-t border-[var(--rule)]">
            <td className="py-1.5 text-[var(--muted)]">gap E[XY] − E[X]E[Y]</td>
            <td className="py-1.5 text-right text-[var(--muted)]">{f(gap)}</td>
            <td className="py-1.5 text-right text-[var(--muted)]">
              {mode === "indep" ? "0" : "≈ 2.92"}
            </td>
          </tr>
        </tbody>
      </table>

      <div className="flex flex-wrap items-center gap-2 text-sm">
        <button onClick={() => run(1000)} className="px-3 py-1.5 rounded-md border border-[var(--rule)] hover:border-[var(--accent)] transition-colors">
          Sample 1,000
        </button>
        <button onClick={() => run(50000)} className="px-3 py-1.5 rounded-md border border-[var(--rule)] hover:border-[var(--accent)] transition-colors">
          Sample 50,000
        </button>
        <button onClick={() => switchMode(mode)} className="px-3 py-1.5 rounded-md border border-[var(--rule)] hover:border-[var(--accent)] transition-colors">
          Reset
        </button>
        <span className="text-[var(--muted)] tabular-nums ml-auto">{n.toLocaleString()} trials</span>
      </div>

      <p className="text-xs text-[var(--muted)]">
        {mode === "indep"
          ? "With independent dice the product rule holds: E[XY] matches E[X]·E[Y], so the gap sits at zero."
          : "With Y = X the rule fails: E[XY] = E[X²] ≈ 15.17 while E[X]·E[Y] = 12.25. The gap, ≈ 2.92, is exactly the variance of a fair die — the star of Day 5."}
      </p>
    </figure>
  );
}
