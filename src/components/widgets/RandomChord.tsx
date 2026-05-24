import { useEffect, useRef, useState } from "react";

type Method = "endpoints" | "radius" | "midpoint";
const SQRT3 = Math.sqrt(3);

const METHODS: { id: Method; label: string; theory: string }[] = [
  { id: "endpoints", label: "Two endpoints", theory: "1/3" },
  { id: "radius", label: "Random radius", theory: "1/2" },
  { id: "midpoint", label: "Random midpoint", theory: "1/4" },
];

type Chord = { x1: number; y1: number; x2: number; y2: number; long: boolean };

// One chord in the unit disc, by the chosen method. "long" = longer than the
// inscribed equilateral triangle's side (length > √3 in the unit circle).
function sampleChord(method: Method): Chord {
  let mx = 0, my = 0, half = 0, px = 0, py = 0;
  if (method === "endpoints") {
    const t1 = 2 * Math.PI * Math.random();
    const t2 = 2 * Math.PI * Math.random();
    const x1 = Math.cos(t1), y1 = Math.sin(t1), x2 = Math.cos(t2), y2 = Math.sin(t2);
    const len = Math.hypot(x1 - x2, y1 - y2);
    return { x1, y1, x2, y2, long: len > SQRT3 };
  }
  if (method === "radius") {
    const phi = 2 * Math.PI * Math.random();
    const r = Math.random();
    mx = r * Math.cos(phi); my = r * Math.sin(phi);
    half = Math.sqrt(Math.max(0, 1 - r * r));
    px = -Math.sin(phi); py = Math.cos(phi);
  } else {
    // midpoint uniform in disc (rejection sampling)
    let x = 0, y = 0, d = 2;
    while (d > 1) { x = 2 * Math.random() - 1; y = 2 * Math.random() - 1; d = Math.hypot(x, y); }
    mx = x; my = y;
    half = Math.sqrt(Math.max(0, 1 - d * d));
    if (d > 1e-9) { px = -y / d; py = x / d; } else { px = 1; py = 0; }
  }
  const X1 = mx + half * px, Y1 = my + half * py;
  const X2 = mx - half * px, Y2 = my - half * py;
  const len = Math.hypot(X1 - X2, Y1 - Y2);
  return { x1: X1, y1: Y1, x2: X2, y2: Y2, long: len > SQRT3 };
}

export default function RandomChord() {
  const [method, setMethod] = useState<Method>("endpoints");
  const [chords, setChords] = useState<Chord[]>([]);
  const [total, setTotal] = useState(0);
  const [long, setLong] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  function sample(times: number) {
    const batch: Chord[] = [];
    let l = long, t = total;
    for (let i = 0; i < times; i++) {
      const c = sampleChord(method);
      batch.push(c);
      if (c.long) l++;
      t++;
    }
    setChords((prev) => [...prev, ...batch].slice(-400));
    setLong(l); setTotal(t);
  }
  function reset() { setChords([]); setTotal(0); setLong(0); }
  function pick(m: Method) { setMethod(m); reset(); }

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    const S = 280;
    canvas.width = S * dpr; canvas.height = S * dpr;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, S, S);
    const cx = S / 2, cy = S / 2, R = S / 2 - 12;
    const map = (x: number, y: number): [number, number] => [cx + x * R, cy - y * R];

    const css = getComputedStyle(document.documentElement);
    const rule = css.getPropertyValue("--rule").trim() || "#e4e4e7";
    const muted = css.getPropertyValue("--muted").trim() || "#9ca3af";
    const accent = css.getPropertyValue("--accent").trim() || "#b91c1c";

    // circle
    ctx.strokeStyle = rule; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(cx, cy, R, 0, 2 * Math.PI); ctx.stroke();

    // inscribed equilateral triangle (reference)
    ctx.strokeStyle = rule; ctx.lineWidth = 1;
    ctx.beginPath();
    [Math.PI / 2, Math.PI / 2 + (2 * Math.PI) / 3, Math.PI / 2 + (4 * Math.PI) / 3].forEach((a, i) => {
      const [px, py] = map(Math.cos(a), Math.sin(a));
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    });
    ctx.closePath(); ctx.stroke();

    // chords
    ctx.lineWidth = 1;
    chords.forEach((c) => {
      const [ax, ay] = map(c.x1, c.y1);
      const [bx, by] = map(c.x2, c.y2);
      ctx.strokeStyle = c.long ? accent : muted;
      ctx.globalAlpha = 0.55;
      ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(bx, by); ctx.stroke();
    });
    ctx.globalAlpha = 1;
  }, [chords]);

  const frac = total ? long / total : 0;
  const theory = METHODS.find((m) => m.id === method)!.theory;

  return (
    <figure className="not-prose my-8 p-5 rounded-lg border border-[var(--rule)] bg-[var(--surface)] space-y-4">
      <div className="inline-flex flex-wrap rounded-md border border-[var(--rule)] overflow-hidden text-sm">
        {METHODS.map((m) => (
          <button
            key={m.id}
            onClick={() => pick(m.id)}
            className="px-3 py-1.5 transition-colors"
            style={{ background: method === m.id ? "var(--accent)" : "transparent", color: method === m.id ? "#fff" : "var(--muted)" }}
          >
            {m.label}
          </button>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-5 items-center">
        <canvas ref={canvasRef} style={{ width: 280, height: 280, maxWidth: "100%" }} />
        <div className="flex-1 space-y-3 text-sm w-full">
          <div>
            <div className="text-[var(--muted)]">Fraction longer than the triangle's side</div>
            <div className="text-3xl font-semibold tabular-nums" style={{ color: "var(--accent)" }}>
              {total ? frac.toFixed(3) : "—"}
            </div>
            <div className="text-xs text-[var(--muted)]">
              theoretical value for this method: <strong>{theory}</strong> ·{" "}
              {total.toLocaleString()} chords
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => sample(300)} className="px-3 py-1.5 rounded-md border border-[var(--rule)] hover:border-[var(--accent)] transition-colors">Sample 300</button>
            <button onClick={() => sample(3000)} className="px-3 py-1.5 rounded-md border border-[var(--rule)] hover:border-[var(--accent)] transition-colors">Sample 3,000</button>
            <button onClick={reset} className="px-3 py-1.5 rounded-md border border-[var(--rule)] hover:border-[var(--accent)] transition-colors">Reset</button>
          </div>
          <div className="flex gap-4 text-xs text-[var(--muted)]">
            <span className="flex items-center gap-1.5"><span className="inline-block w-3 h-0.5" style={{ background: "var(--accent)" }} /> longer</span>
            <span className="flex items-center gap-1.5"><span className="inline-block w-3 h-0.5" style={{ background: "var(--muted)" }} /> shorter</span>
          </div>
        </div>
      </div>

      <p className="text-xs text-[var(--muted)]">
        Three honest readings of "a random chord" — three different answers (1/3, 1/2,
        1/4). The English sentence alone does not pick one; the experiment does.
      </p>
    </figure>
  );
}
