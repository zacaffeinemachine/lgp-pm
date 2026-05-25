import { useState } from "react";

// Degree-sum formula made tangible: build a graph by clicking vertices to
// toggle edges, and watch Σ deg(v) stay locked to 2|E| (the handshake lemma).

const SIZE = 260;
const R = 100;
const CX = SIZE / 2;
const CY = SIZE / 2;

function edgeKey(a: number, b: number) {
  return a < b ? `${a}-${b}` : `${b}-${a}`;
}

type Preset = "empty" | "triangle" | "star" | "cycle" | "complete";

function buildPreset(p: Preset, n: number): Set<string> {
  const s = new Set<string>();
  const add = (a: number, b: number) => s.add(edgeKey(a, b));
  if (p === "triangle") {
    for (let i = 0; i < Math.min(3, n); i++) add(i, (i + 1) % Math.min(3, n));
  } else if (p === "cycle") {
    for (let i = 0; i < n; i++) add(i, (i + 1) % n);
  } else if (p === "star") {
    for (let i = 1; i < n; i++) add(0, i);
  } else if (p === "complete") {
    for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) add(i, j);
  }
  return s;
}

export default function DegreeSum() {
  const [n, setN] = useState(5);
  const [edges, setEdges] = useState<Set<string>>(() => buildPreset("cycle", 5));
  const [pending, setPending] = useState<number | null>(null);

  const pos = Array.from({ length: n }, (_, i) => {
    const ang = (2 * Math.PI * i) / n - Math.PI / 2;
    return { x: CX + R * Math.cos(ang), y: CY + R * Math.sin(ang) };
  });

  const deg = Array.from({ length: n }, (_, i) =>
    [...edges].filter((e) => e.split("-").map(Number).includes(i)).length
  );
  const degSum = deg.reduce((a, b) => a + b, 0);
  const numEdges = edges.size;
  const oddCount = deg.filter((d) => d % 2 === 1).length;

  function clickVertex(i: number) {
    if (pending === null) {
      setPending(i);
    } else if (pending === i) {
      setPending(null);
    } else {
      const k = edgeKey(pending, i);
      const next = new Set(edges);
      if (next.has(k)) next.delete(k);
      else next.add(k);
      setEdges(next);
      setPending(null);
    }
  }
  function setSize(nn: number) {
    setN(nn);
    setEdges(buildPreset("empty", nn));
    setPending(null);
  }

  return (
    <figure className="not-prose my-8 p-5 rounded-lg border border-[var(--rule)] bg-[var(--surface)] space-y-4">
      <p className="text-xs text-[var(--muted)]">
        Click one vertex, then another, to add or remove the edge between them.
      </p>

      <div className="flex flex-col sm:flex-row gap-5 items-center">
        <svg width={SIZE} height={SIZE} className="shrink-0" role="img" aria-label="Editable graph">
          {[...edges].map((e) => {
            const [a, b] = e.split("-").map(Number);
            return (
              <line
                key={e}
                x1={pos[a].x}
                y1={pos[a].y}
                x2={pos[b].x}
                y2={pos[b].y}
                stroke="var(--accent)"
                strokeWidth={2}
              />
            );
          })}
          {pos.map((p, i) => {
            const selected = pending === i;
            return (
              <g key={i} onClick={() => clickVertex(i)} style={{ cursor: "pointer" }}>
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={16}
                  fill={selected ? "var(--accent)" : "var(--surface)"}
                  stroke={selected ? "var(--accent)" : "var(--rule)"}
                  strokeWidth={2}
                />
                <text
                  x={p.x}
                  y={p.y}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontSize={12}
                  fontWeight={600}
                  fill={selected ? "#fff" : "var(--ink)"}
                >
                  {deg[i]}
                </text>
              </g>
            );
          })}
        </svg>

        <div className="w-full space-y-3">
          <div className="grid grid-cols-2 gap-3 text-center">
            <div className="rounded-md border border-[var(--rule)] p-3">
              <div className="text-xs uppercase tracking-wider text-[var(--muted)]">Σ deg(v)</div>
              <div className="text-2xl font-semibold tabular-nums" style={{ color: "var(--accent)" }}>
                {degSum}
              </div>
            </div>
            <div className="rounded-md border border-[var(--rule)] p-3">
              <div className="text-xs uppercase tracking-wider text-[var(--muted)]">2|E|</div>
              <div className="text-2xl font-semibold tabular-nums text-[var(--muted)]">
                {2 * numEdges}
              </div>
            </div>
          </div>
          <p className="text-sm text-center text-[var(--muted)]">
            {numEdges} edge{numEdges === 1 ? "" : "s"} · {oddCount} vertices of odd degree
            {" "}
            <span style={{ color: oddCount % 2 === 0 ? "var(--accent)" : "inherit" }}>
              (always even)
            </span>
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span className="text-[var(--muted)] text-xs uppercase tracking-wider">Presets</span>
        {(["empty", "cycle", "star", "complete"] as Preset[]).map((p) => (
          <button
            key={p}
            onClick={() => {
              setEdges(buildPreset(p, n));
              setPending(null);
            }}
            className="px-2.5 py-1 rounded-md border border-[var(--rule)] hover:border-[var(--accent)] transition-colors capitalize"
          >
            {p}
          </button>
        ))}
        <label className="flex items-center gap-2 ml-auto">
          <span className="text-[var(--muted)]">vertices</span>
          <select
            value={n}
            onChange={(e) => setSize(Number(e.target.value))}
            className="px-2 py-1 rounded-md border border-[var(--rule)] bg-[var(--bg)]"
          >
            {[3, 4, 5, 6, 7].map((k) => (
              <option key={k} value={k}>
                {k}
              </option>
            ))}
          </select>
        </label>
      </div>

      <p className="text-xs text-[var(--muted)]">
        Each number inside a vertex is its degree. Add or delete any edge: Σ deg(v) and 2|E| move
        in lockstep, because every edge contributes exactly 2 to the degree sum.
      </p>
    </figure>
  );
}
