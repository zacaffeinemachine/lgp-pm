import { useState } from "react";

function randomPerm(n: number): number[] {
  const a = Array.from({ length: n }, (_, i) => i + 1);
  for (let i = n - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function FixedPoints() {
  const [n, setN] = useState(4);
  const [trials, setTrials] = useState(0);
  const [a1, setA1] = useState(0);
  const [both, setBoth] = useState(0);
  const [sample, setSample] = useState<number[]>(() => randomPerm(4));

  function run(times: number) {
    let c1 = a1, cb = both, T = trials;
    for (let t = 0; t < times; t++) {
      const p = randomPerm(n);
      if (p[0] === 1) c1++;
      if (p[0] === 1 && p[1] === 2) cb++;
      T++;
    }
    setA1(c1); setBoth(cb); setTrials(T);
    setSample(randomPerm(n));
  }
  function resetN(nn: number) {
    setN(nn); setTrials(0); setA1(0); setBoth(0); setSample(randomPerm(nn));
  }

  const empA1 = trials ? a1 / trials : 0;
  const empBoth = trials ? both / trials : 0;
  const trueBoth = 1 / (n * (n - 1));
  const indepBoth = 1 / (n * n);
  const f = (x: number) => x.toFixed(3);

  return (
    <figure className="not-prose my-8 p-5 rounded-lg border border-[var(--rule)] bg-[var(--surface)] space-y-4">
      <label className="block text-sm">
        <span className="text-[var(--muted)]">Permutation size n = <strong className="text-[var(--ink)]">{n}</strong></span>
        <input type="range" min={2} max={8} step={1} value={n} onChange={(e) => resetN(Number(e.target.value))} className="w-full mt-2 accent-[var(--accent)]" />
      </label>

      {/* one sampled permutation, fixed points highlighted */}
      <div>
        <div className="text-xs uppercase tracking-wider text-[var(--muted)] mb-2">A sample permutation (fixed points highlighted)</div>
        <div className="flex flex-wrap gap-1.5">
          {sample.map((v, i) => {
            const fixed = v === i + 1;
            return (
              <div key={i} className="text-center">
                <div className="text-[10px] text-[var(--muted)]">{i + 1}</div>
                <div
                  className="w-9 h-9 rounded-md flex items-center justify-center font-mono font-semibold"
                  style={{
                    border: `2px solid ${fixed ? "var(--accent)" : "var(--rule)"}`,
                    background: fixed ? "var(--accent-soft)" : "transparent",
                    color: fixed ? "var(--accent)" : "var(--ink)",
                  }}
                >
                  {v}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="text-[var(--muted)] text-left text-xs uppercase tracking-wider">
            <th className="py-1">quantity</th>
            <th className="py-1 text-right">simulated</th>
            <th className="py-1 text-right">theory</th>
          </tr>
        </thead>
        <tbody className="tabular-nums">
          <tr className="border-t border-[var(--rule)]">
            <td className="py-1.5">P(position 1 fixed)</td>
            <td className="py-1.5 text-right">{trials ? f(empA1) : "—"}</td>
            <td className="py-1.5 text-right text-[var(--muted)]">1/n = {f(1 / n)}</td>
          </tr>
          <tr className="border-t border-[var(--rule)]">
            <td className="py-1.5">P(positions 1 and 2 both fixed)</td>
            <td className="py-1.5 text-right" style={{ color: "var(--accent)" }}>{trials ? f(empBoth) : "—"}</td>
            <td className="py-1.5 text-right text-[var(--muted)]">1/n(n−1) = {f(trueBoth)}</td>
          </tr>
          <tr className="border-t border-[var(--rule)]">
            <td className="py-1.5 text-[var(--muted)]">if independent, would be</td>
            <td className="py-1.5 text-right" />
            <td className="py-1.5 text-right text-[var(--muted)]">1/n² = {f(indepBoth)}</td>
          </tr>
        </tbody>
      </table>

      <div className="flex flex-wrap items-center gap-2 text-sm">
        <button onClick={() => run(1000)} className="px-3 py-1.5 rounded-md border border-[var(--rule)] hover:border-[var(--accent)] transition-colors">Sample 1,000</button>
        <button onClick={() => run(20000)} className="px-3 py-1.5 rounded-md border border-[var(--rule)] hover:border-[var(--accent)] transition-colors">Sample 20,000</button>
        <button onClick={() => resetN(n)} className="px-3 py-1.5 rounded-md border border-[var(--rule)] hover:border-[var(--accent)] transition-colors">Reset</button>
        <span className="text-[var(--muted)] tabular-nums ml-auto">{trials.toLocaleString()} permutations</span>
      </div>

      <p className="text-xs text-[var(--muted)]">
        The simulated "both fixed" probability tracks 1/n(n−1), which sits strictly above
        the 1/n² you would get if the two events were independent. Knowing position 1 is
        fixed makes position 2 a little likelier — they are not independent.
      </p>
    </figure>
  );
}
