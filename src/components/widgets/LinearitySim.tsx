import { useState } from "react";

// Linearity of expectation: a count X = 1_{A_1} + ... + 1_{A_n} has
// E[X] = sum of P(A_i), whether or not the events interact. Three counts,
// one slider for n; the empirical mean tracks the theory in every case —
// even fixed points, whose events are not independent.

type Key = "heads" | "sixes" | "fixed";

function randomPerm(n: number): number[] {
  const a = Array.from({ length: n }, (_, i) => i + 1);
  for (let i = n - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const SCENARIOS: Record<
  Key,
  {
    label: string;
    sample: (n: number) => number;
    theory: (n: number) => number;
    theoryLabel: (n: number) => string;
    note: string;
    independent: boolean;
  }
> = {
  heads: {
    label: "Heads in n coins",
    sample: (n) => {
      let c = 0;
      for (let i = 0; i < n; i++) if (Math.random() < 0.5) c++;
      return c;
    },
    theory: (n) => n / 2,
    theoryLabel: (n) => `n/2 = ${(n / 2).toFixed(2)}`,
    note: "Each toss is heads with probability 1/2; the n events are independent.",
    independent: true,
  },
  sixes: {
    label: "Sixes in n dice",
    sample: (n) => {
      let c = 0;
      for (let i = 0; i < n; i++) if (Math.floor(Math.random() * 6) === 0) c++;
      return c;
    },
    theory: (n) => n / 6,
    theoryLabel: (n) => `n/6 = ${(n / 6).toFixed(2)}`,
    note: "Each die shows a six with probability 1/6; the n events are independent.",
    independent: true,
  },
  fixed: {
    label: "Fixed points of a random permutation",
    sample: (n) => {
      const p = randomPerm(n);
      let c = 0;
      for (let i = 0; i < n; i++) if (p[i] === i + 1) c++;
      return c;
    },
    theory: () => 1,
    theoryLabel: () => "1 (for every n)",
    note: "Each position is fixed with probability 1/n, so the sum is n · (1/n) = 1 — even though the events are NOT independent.",
    independent: false,
  },
};

export default function LinearitySim() {
  const [key, setKey] = useState<Key>("heads");
  const [n, setN] = useState(10);
  const [trials, setTrials] = useState(0);
  const [sum, setSum] = useState(0);

  const sc = SCENARIOS[key];
  const mean = trials ? sum / trials : 0;
  const theory = sc.theory(n);

  function run(times: number) {
    let s = sum;
    let t = trials;
    for (let i = 0; i < times; i++) {
      s += sc.sample(n);
      t += 1;
    }
    setSum(s);
    setTrials(t);
  }
  function resetAll(nextKey: Key, nextN: number) {
    setKey(nextKey);
    setN(nextN);
    setTrials(0);
    setSum(0);
  }

  return (
    <figure className="not-prose my-8 p-5 rounded-lg border border-[var(--rule)] bg-[var(--surface)] space-y-5">
      <div className="flex flex-wrap gap-2 text-sm">
        {(Object.keys(SCENARIOS) as Key[]).map((k) => (
          <button
            key={k}
            onClick={() => resetAll(k, n)}
            aria-pressed={key === k}
            className="px-3 py-1.5 rounded-md border transition-colors"
            style={{
              borderColor: key === k ? "var(--accent)" : "var(--rule)",
              background: key === k ? "var(--accent-soft)" : "transparent",
              color: key === k ? "var(--accent)" : "var(--muted)",
            }}
          >
            {SCENARIOS[k].label}
          </button>
        ))}
      </div>

      <label className="block text-sm">
        <span className="text-[var(--muted)]">
          n = <strong className="text-[var(--ink)]">{n}</strong>
        </span>
        <input
          type="range"
          min={2}
          max={50}
          step={1}
          value={n}
          onChange={(e) => resetAll(key, Number(e.target.value))}
          className="w-full mt-2 accent-[var(--accent)]"
        />
      </label>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <div className="text-xs uppercase tracking-wider text-[var(--muted)]">Simulated mean count</div>
          <div className="text-3xl font-semibold tabular-nums" style={{ color: "var(--accent)" }}>
            {trials ? mean.toFixed(3) : "—"}
          </div>
        </div>
        <div className="text-right">
          <div className="text-xs uppercase tracking-wider text-[var(--muted)]">Theory: Σ P(Aᵢ)</div>
          <div className="text-3xl font-semibold tabular-nums text-[var(--muted)]">{sc.theoryLabel(n)}</div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-sm">
        <button onClick={() => run(1000)} className="px-3 py-1.5 rounded-md border border-[var(--rule)] hover:border-[var(--accent)] transition-colors">
          Sample 1,000
        </button>
        <button onClick={() => run(20000)} className="px-3 py-1.5 rounded-md border border-[var(--rule)] hover:border-[var(--accent)] transition-colors">
          Sample 20,000
        </button>
        <button onClick={() => resetAll(key, n)} className="px-3 py-1.5 rounded-md border border-[var(--rule)] hover:border-[var(--accent)] transition-colors">
          Reset
        </button>
        <span className="text-[var(--muted)] tabular-nums ml-auto">{trials.toLocaleString()} trials</span>
      </div>

      <p className="text-xs text-[var(--muted)]">
        {sc.note}
        {!sc.independent && " Linearity does not care: the expected count is still exactly the sum of the individual probabilities."}
      </p>
    </figure>
  );
}
