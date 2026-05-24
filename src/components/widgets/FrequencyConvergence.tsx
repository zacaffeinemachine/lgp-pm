import { useEffect, useRef, useState } from "react";

// Long-run frequency of heads converging to 1/2 for a fair coin.
export default function FrequencyConvergence() {
  const [fractions, setFractions] = useState<number[]>([]);
  const headsRef = useRef(0);
  const nRef = useRef(0);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const n = nRef.current;
  const current = fractions.length ? fractions[fractions.length - 1] : 0;

  function flip(times: number) {
    const next = fractions.slice();
    for (let i = 0; i < times; i++) {
      if (Math.random() < 0.5) headsRef.current += 1;
      nRef.current += 1;
      next.push(headsRef.current / nRef.current);
    }
    // Keep the array bounded for drawing.
    setFractions(next.length > 4000 ? next.slice(next.length - 4000) : next);
  }

  function reset() {
    headsRef.current = 0;
    nRef.current = 0;
    setFractions([]);
  }

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    const W = canvas.clientWidth || 600;
    const H = 200;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);

    const padL = 34, padR = 8, padT = 10, padB = 18;
    const x0 = padL, x1 = W - padR, y0 = padT, y1 = H - padB;
    const yFor = (f: number) => y1 - f * (y1 - y0);

    const css = getComputedStyle(document.documentElement);
    const rule = css.getPropertyValue("--rule").trim() || "#e4e4e7";
    const muted = css.getPropertyValue("--muted").trim() || "#71717a";
    const accent = css.getPropertyValue("--accent").trim() || "#b91c1c";

    // axes + gridlines at 0, 0.5, 1
    ctx.strokeStyle = rule;
    ctx.fillStyle = muted;
    ctx.font = "11px ui-sans-serif, system-ui, sans-serif";
    ctx.lineWidth = 1;
    [0, 0.5, 1].forEach((g) => {
      const y = yFor(g);
      ctx.beginPath();
      ctx.moveTo(x0, y);
      ctx.lineTo(x1, y);
      ctx.stroke();
      ctx.fillText(g.toFixed(1), 6, y + 3);
    });

    // target line at 0.5
    ctx.strokeStyle = muted;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(x0, yFor(0.5));
    ctx.lineTo(x1, yFor(0.5));
    ctx.stroke();
    ctx.setLineDash([]);

    // running fraction
    if (fractions.length > 1) {
      ctx.strokeStyle = accent;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      fractions.forEach((f, i) => {
        const x = x0 + (i / (fractions.length - 1)) * (x1 - x0);
        const y = yFor(f);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();
    }
  }, [fractions]);

  return (
    <figure className="not-prose my-8 p-5 rounded-lg border border-[var(--rule)] bg-[var(--surface)] space-y-3">
      <canvas ref={canvasRef} style={{ width: "100%", height: 200 }} />
      <div className="flex flex-wrap items-center gap-2 text-sm">
        {[50, 500, 5000].map((t) => (
          <button
            key={t}
            onClick={() => flip(t)}
            className="px-3 py-1.5 rounded-md border border-[var(--rule)] hover:border-[var(--accent)] transition-colors tabular-nums"
          >
            Flip {t.toLocaleString()}
          </button>
        ))}
        <button onClick={reset} className="px-3 py-1.5 rounded-md border border-[var(--rule)] hover:border-[var(--accent)] transition-colors">
          Reset
        </button>
        <span className="text-[var(--muted)] tabular-nums ml-auto">
          {n.toLocaleString()} flips · fraction heads ={" "}
          <strong style={{ color: "var(--accent)" }}>{n ? current.toFixed(3) : "—"}</strong>
        </span>
      </div>
      <p className="text-xs text-[var(--muted)]">
        The fraction lurches early on, then settles toward the dashed line at 0.5. That
        long-run value is what we call P(heads).
      </p>
    </figure>
  );
}
