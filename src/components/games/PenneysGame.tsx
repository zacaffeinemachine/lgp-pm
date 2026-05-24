import { useEffect, useRef, useState } from "react";

// ---------------------------------------------------------------------------
//  Penney's game — pure logic (no React, easy to reason about).
//  A sequence is a 3-character string over {"H","T"}, e.g. "HHT".
// ---------------------------------------------------------------------------

type Bit = "H" | "T";
const opp = (c: string): Bit => (c === "H" ? "T" : "H");

/**
 * The classic optimal counter to a length-3 sequence s1 s2 s3:
 *   choose  (not s2)  s1  s2.
 * Verifies: HHH -> THH, HTH -> HHT.
 */
function counterSeq(seq: string): string {
  return opp(seq[1]) + seq[0] + seq[1];
}

/** One round: flip a fair coin until `a` or `b` first appears. Returns the winner. */
function playRound(a: string, b: string): "a" | "b" {
  let w = "";
  for (;;) {
    w = (w + (Math.random() < 0.5 ? "H" : "T")).slice(-3);
    if (w === a) return "a";
    if (w === b) return "b";
  }
}

/** Simulate `n` independent rounds and tally the winners. */
function simulate(a: string, b: string, n: number): { a: number; b: number } {
  let aWins = 0;
  let bWins = 0;
  for (let i = 0; i < n; i++) {
    if (playRound(a, b) === "a") aWins++;
    else bWins++;
  }
  return { a: aWins, b: bWins };
}

/** Record one round's full flip history, for the step-by-step animation. */
function sampleRound(a: string, b: string): { flips: Bit[]; winner: "a" | "b" } {
  const flips: Bit[] = [];
  let w = "";
  for (;;) {
    const f: Bit = Math.random() < 0.5 ? "H" : "T";
    flips.push(f);
    w = (w + f).slice(-3);
    if (w === a) return { flips, winner: "a" };
    if (w === b) return { flips, winner: "b" };
  }
}

// --- Conway's leading-number algorithm: the exact win probability. ---------

/** Correlation of x over y: sum of 2^(k-1) over k where the last k of x = first k of y. */
function corr(x: string, y: string): number {
  const L = x.length;
  let total = 0;
  for (let k = 1; k <= L; k++) {
    if (x.slice(L - k) === y.slice(0, k)) total += 1 << (k - 1);
  }
  return total;
}

/** Exact probability that sequence `b` appears before sequence `a`. */
function probBWins(a: string, b: string): number {
  const num = corr(a, a) - corr(a, b);
  const den = num + (corr(b, b) - corr(b, a));
  return num / den;
}

// ---------------------------------------------------------------------------
//  UI
// ---------------------------------------------------------------------------

type Mode = "house" | "free";

const YOU_COLOR = "#2563eb"; // blue
const HOUSE_COLOR = "var(--accent)"; // themed red

export default function PenneysGame() {
  const [mode, setMode] = useState<Mode>("house");
  const [you, setYou] = useState("HHT");
  const [rival, setRival] = useState("THH"); // used only in free mode

  // The house/rival's actual sequence depends on the mode.
  const houseSeq = mode === "house" ? counterSeq(you) : rival;
  const houseLabel = mode === "house" ? "The house" : "Your rival";

  const identical = you === houseSeq;

  const [results, setResults] = useState<{ you: number; house: number; n: number } | null>(null);

  // One illustrative round, revealed flip by flip.
  const [sample, setSample] = useState<{ flips: Bit[]; winner: "a" | "b" } | null>(null);
  const [revealed, setRevealed] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Whenever the bets change, clear stale output.
  useEffect(() => {
    setResults(null);
    stopSample();
    setSample(null);
    setRevealed(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [you, rival, mode]);

  useEffect(() => () => stopSample(), []);

  function stopSample() {
    if (timerRef.current !== null) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }

  function run(n: number) {
    if (identical) return;
    const tally = simulate(you, houseSeq, n);
    setResults({ you: tally.a, house: tally.b, n });
  }

  function watchOne() {
    if (identical) return;
    stopSample();
    const s = sampleRound(you, houseSeq);
    setSample(s);
    setRevealed(0);
    let i = 0;
    timerRef.current = setInterval(() => {
      i += 1;
      setRevealed(i);
      if (i >= s.flips.length) stopSample();
    }, 260);
  }

  const theory = !identical ? probBWins(you, houseSeq) : null;
  const youPct = results ? (100 * results.you) / results.n : 0;
  const housePct = results ? (100 * results.house) / results.n : 0;

  return (
    <figure className="not-prose my-10 space-y-6">
      {/* Mode toggle */}
      <div className="flex justify-center">
        <div
          className="inline-flex rounded-lg border border-[var(--rule)] overflow-hidden text-sm"
          role="tablist"
          aria-label="Game mode"
        >
          <ModeButton active={mode === "house"} onClick={() => setMode("house")}>
            House auto-beats you
          </ModeButton>
          <ModeButton active={mode === "free"} onClick={() => setMode("free")}>
            Free play
          </ModeButton>
        </div>
      </div>

      {/* The two bets */}
      <div className="grid gap-4 sm:grid-cols-2">
        <BetPanel
          label="Your bet"
          color={YOU_COLOR}
          seq={you}
          editable
          onChange={setYou}
        />
        <BetPanel
          label={`${houseLabel}'s bet`}
          color={HOUSE_COLOR}
          seq={houseSeq}
          editable={mode === "free"}
          onChange={setRival}
          note={
            mode === "house"
              ? "Auto-chosen to beat you: flip your 2nd symbol, then copy your 1st and 2nd."
              : undefined
          }
        />
      </div>

      {identical && (
        <p className="text-center text-sm" style={{ color: "var(--accent)" }} role="status">
          Both bets are <strong>{you}</strong> — pick two different sequences to play.
        </p>
      )}

      {/* Controls */}
      <div className="flex flex-wrap items-center justify-center gap-2 text-sm">
        <span className="text-[var(--muted)] mr-1">Play</span>
        {[100, 1000, 10000].map((n) => (
          <button
            key={n}
            onClick={() => run(n)}
            disabled={identical}
            className="px-3 py-1.5 rounded-md border border-[var(--rule)] hover:border-[var(--accent)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors tabular-nums"
          >
            {n.toLocaleString()} rounds
          </button>
        ))}
        <span className="mx-1 text-[var(--muted)]">·</span>
        <button
          onClick={watchOne}
          disabled={identical}
          className="px-3 py-1.5 rounded-md border border-[var(--rule)] hover:border-[var(--accent)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          Watch one round
        </button>
      </div>

      {/* Single-round animation */}
      {sample && (
        <SampleStrip
          flips={sample.flips}
          revealed={revealed}
          done={revealed >= sample.flips.length}
          winner={sample.winner === "a" ? "you" : "house"}
          youColor={YOU_COLOR}
          houseColor={HOUSE_COLOR}
        />
      )}

      {/* Batch results */}
      {results && (
        <div className="p-5 rounded-lg border border-[var(--rule)] bg-[var(--surface)] space-y-4">
          <div className="text-xs uppercase tracking-wider text-[var(--muted)]">
            {results.n.toLocaleString()} rounds
          </div>

          {/* Stacked bar */}
          <div className="flex h-9 w-full overflow-hidden rounded-md text-xs font-medium text-white">
            <div
              className="flex items-center justify-start pl-2"
              style={{ width: `${youPct}%`, background: YOU_COLOR, transition: "width 300ms ease" }}
            >
              {youPct >= 12 && `${youPct.toFixed(1)}%`}
            </div>
            <div
              className="flex items-center justify-end pr-2"
              style={{ width: `${housePct}%`, background: HOUSE_COLOR, transition: "width 300ms ease" }}
            >
              {housePct >= 12 && `${housePct.toFixed(1)}%`}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <ResultStat
              label={`You (${you})`}
              color={YOU_COLOR}
              wins={results.you}
              pct={youPct}
            />
            <ResultStat
              label={`${houseLabel} (${houseSeq})`}
              color={HOUSE_COLOR}
              wins={results.house}
              pct={housePct}
            />
          </div>

          {theory !== null && (
            <p className="text-xs text-[var(--muted)] pt-1 border-t border-[var(--rule)]">
              Exact probability the {mode === "house" ? "house" : "rival"} wins:{" "}
              <strong style={{ color: HOUSE_COLOR }}>{(100 * theory).toFixed(1)}%</strong>{" "}
              (Conway's formula). The simulated share above should sit close to this — and
              closer the more rounds you play.
            </p>
          )}
        </div>
      )}
    </figure>
  );
}

// --- sub-components --------------------------------------------------------

function ModeButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      role="tab"
      aria-selected={active}
      className="px-4 py-1.5 transition-colors"
      style={{
        background: active ? "var(--accent)" : "transparent",
        color: active ? "#fff" : "var(--muted)",
      }}
    >
      {children}
    </button>
  );
}

function BetPanel({
  label,
  color,
  seq,
  editable,
  onChange,
  note,
}: {
  label: string;
  color: string;
  seq: string;
  editable: boolean;
  onChange: (next: string) => void;
  note?: string;
}) {
  const setPos = (i: number, bit: Bit) => {
    onChange(seq.slice(0, i) + bit + seq.slice(i + 1));
  };
  return (
    <div className="p-4 rounded-lg border border-[var(--rule)] bg-[var(--surface)]">
      <div className="text-xs uppercase tracking-wider mb-3" style={{ color }}>
        {label}
      </div>
      <div className="flex gap-2">
        {[0, 1, 2].map((i) => (
          <CoinToggle
            key={i}
            bit={seq[i] as Bit}
            editable={editable}
            color={color}
            onSet={(bit) => setPos(i, bit)}
          />
        ))}
      </div>
      {note && <p className="text-xs text-[var(--muted)] mt-3 leading-relaxed">{note}</p>}
    </div>
  );
}

function CoinToggle({
  bit,
  editable,
  color,
  onSet,
}: {
  bit: Bit;
  editable: boolean;
  color: string;
  onSet: (bit: Bit) => void;
}) {
  const flip = () => editable && onSet(bit === "H" ? "T" : "H");
  return (
    <button
      type="button"
      onClick={flip}
      disabled={!editable}
      aria-label={`Coin showing ${bit === "H" ? "heads" : "tails"}${editable ? ", click to flip" : ""}`}
      title={editable ? "Click to flip" : undefined}
      className="w-12 h-12 rounded-full font-mono text-lg font-semibold flex items-center justify-center transition-transform"
      style={{
        background: bit === "H" ? "var(--coin-heads)" : "var(--coin-tails)",
        color: "var(--coin-ink)",
        border: `2px solid ${editable ? color : "var(--rule)"}`,
        cursor: editable ? "pointer" : "default",
      }}
    >
      {bit}
    </button>
  );
}

function ResultStat({
  label,
  color,
  wins,
  pct,
}: {
  label: string;
  color: string;
  wins: number;
  pct: number;
}) {
  return (
    <div>
      <div className="flex items-center gap-2">
        <span className="inline-block w-3 h-3 rounded-sm" style={{ background: color }} />
        <span className="font-mono">{label}</span>
      </div>
      <div className="mt-1 text-2xl font-semibold tabular-nums" style={{ color }}>
        {pct.toFixed(1)}%
      </div>
      <div className="text-xs text-[var(--muted)] tabular-nums">{wins.toLocaleString()} wins</div>
    </div>
  );
}

function SampleStrip({
  flips,
  revealed,
  done,
  winner,
  youColor,
  houseColor,
}: {
  flips: Bit[];
  revealed: number;
  done: boolean;
  winner: "you" | "house";
  youColor: string;
  houseColor: string;
}) {
  const winColor = winner === "you" ? youColor : houseColor;
  const shown = flips.slice(0, revealed);
  return (
    <div className="p-4 rounded-lg border border-[var(--rule)] bg-[var(--surface)]">
      <div className="text-xs uppercase tracking-wider text-[var(--muted)] mb-3">
        One round, flip by flip
      </div>
      <div className="flex flex-wrap gap-1.5">
        {shown.map((f, i) => {
          // Highlight the final three flips once the round is decided.
          const isWinTriple = done && i >= flips.length - 3;
          return (
            <span
              key={i}
              className="w-8 h-8 rounded-full font-mono text-sm font-semibold flex items-center justify-center"
              style={{
                background: f === "H" ? "var(--coin-heads)" : "var(--coin-tails)",
                color: "var(--coin-ink)",
                outline: isWinTriple ? `2px solid ${winColor}` : "none",
                outlineOffset: 1,
              }}
            >
              {f}
            </span>
          );
        })}
      </div>
      {done && (
        <p className="text-sm mt-3" role="status">
          Won by{" "}
          <strong style={{ color: winColor }}>{winner === "you" ? "you" : "the house"}</strong>{" "}
          after {flips.length} flips.
        </p>
      )}
    </div>
  );
}
