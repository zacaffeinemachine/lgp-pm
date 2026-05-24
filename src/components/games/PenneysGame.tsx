import { useEffect, useRef, useState } from "react";

// ---------------------------------------------------------------------------
//  Penney's game — pure logic (no React, easy to reason about).
//  A sequence is a 3-character string over {"H","T"}, e.g. "HHT".
// ---------------------------------------------------------------------------

type Bit = "H" | "T";
const opp = (c: string): Bit => (c === "H" ? "T" : "H");

/** The house's reply to a length-3 sequence s1 s2 s3 is (not s2) s1 s2. */
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

// ---------------------------------------------------------------------------
//  UI
// ---------------------------------------------------------------------------

type Winner = "you" | "house";
type Mode = "house" | "free";
type Speed = "slow" | "medium" | "fast" | "instant";

const YOU_COLOR = "#2563eb"; // blue
const HOUSE_COLOR = "var(--accent)"; // themed red

const SPEEDS: Record<Exclude<Speed, "instant">, { flip: number; between: number }> = {
  slow: { flip: 460, between: 720 },
  medium: { flip: 180, between: 340 },
  fast: { flip: 55, between: 150 },
};

const MAX_ROUNDS = 999;

function clampRounds(n: number): number {
  if (!Number.isFinite(n)) return 1;
  return Math.max(1, Math.min(MAX_ROUNDS, Math.floor(n)));
}

export default function PenneysGame() {
  const [mode, setMode] = useState<Mode>("house");
  const [you, setYou] = useState("HHT");
  const [rival, setRival] = useState("THH"); // free-play only
  const [rounds, setRounds] = useState(25);
  const [speed, setSpeed] = useState<Speed>("medium");

  const houseSeq = mode === "house" ? counterSeq(you) : rival;
  const houseLabel = mode === "house" ? "The house" : "Your rival";
  const identical = you === houseSeq;

  const [phase, setPhase] = useState<"idle" | "running" | "done">("idle");
  const [winners, setWinners] = useState<Winner[]>([]);
  const [curFlips, setCurFlips] = useState<Bit[]>([]);

  // Mutable engine state for the flip-by-flip animation, kept in a ref so the
  // timer callback always sees the latest values without stale closures.
  const engine = useRef<{
    a: string;
    b: string;
    total: number;
    flip: number;
    between: number;
    flips: Bit[];
    window: string;
    round: number;
    winners: Winner[];
  } | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function clearTimer() {
    if (timer.current !== null) {
      clearTimeout(timer.current);
      timer.current = null;
    }
  }

  function reset() {
    clearTimer();
    engine.current = null;
    setPhase("idle");
    setWinners([]);
    setCurFlips([]);
  }

  // A change to the setup clears any run in progress.
  useEffect(() => {
    reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [you, rival, mode]);
  useEffect(() => () => clearTimer(), []);

  function tick() {
    const e = engine.current;
    if (!e) return;
    const f: Bit = Math.random() < 0.5 ? "H" : "T";
    e.flips.push(f);
    e.window = (e.window + f).slice(-3);

    let decided: Winner | null = null;
    if (e.window === e.a) decided = "you";
    else if (e.window === e.b) decided = "house";

    if (decided) {
      e.winners.push(decided);
      e.round += 1;
      setWinners([...e.winners]);
      setCurFlips([...e.flips]); // leave the deciding round on screen for a beat
      e.flips = [];
      e.window = "";
      if (e.round >= e.total) {
        clearTimer();
        setPhase("done");
        return;
      }
      timer.current = setTimeout(tick, e.between);
    } else {
      setCurFlips([...e.flips]);
      timer.current = setTimeout(tick, e.flip);
    }
  }

  function watch() {
    if (identical) return;
    clearTimer();
    const total = clampRounds(rounds);

    if (speed === "instant") {
      const ws: Winner[] = [];
      for (let i = 0; i < total; i++) {
        ws.push(playRound(you, houseSeq) === "a" ? "you" : "house");
      }
      engine.current = null;
      setCurFlips([]);
      setWinners(ws);
      setPhase("done");
      return;
    }

    const s = SPEEDS[speed];
    engine.current = {
      a: you,
      b: houseSeq,
      total,
      flip: s.flip,
      between: s.between,
      flips: [],
      window: "",
      round: 0,
      winners: [],
    };
    setWinners([]);
    setCurFlips([]);
    setPhase("running");
    timer.current = setTimeout(tick, s.flip);
  }

  function stop() {
    clearTimer();
    setPhase("done");
  }

  const youWins = winners.filter((w) => w === "you").length;
  const houseWins = winners.length - youWins;
  const youPct = winners.length ? (100 * youWins) / winners.length : 0;
  const housePct = winners.length ? (100 * houseWins) / winners.length : 0;
  const busy = phase === "running";
  const totalPlanned = clampRounds(rounds);

  return (
    <figure className="not-prose my-10 space-y-6">
      {/* Mode toggle */}
      <div className="flex justify-center">
        <div
          className="inline-flex rounded-lg border border-[var(--rule)] overflow-hidden text-sm"
          role="tablist"
          aria-label="Game mode"
        >
          <ModeButton active={mode === "house"} disabled={busy} onClick={() => setMode("house")}>
            You vs. the house
          </ModeButton>
          <ModeButton active={mode === "free"} disabled={busy} onClick={() => setMode("free")}>
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
          editable={!busy}
          onChange={setYou}
        />
        <BetPanel
          label={`${houseLabel}'s bet`}
          color={HOUSE_COLOR}
          seq={houseSeq}
          editable={mode === "free" && !busy}
          onChange={setRival}
        />
      </div>

      {identical && (
        <p className="text-center text-sm" style={{ color: "var(--accent)" }} role="status">
          Both bets are <strong>{you}</strong> — pick two different sequences to play.
        </p>
      )}

      {/* Controls */}
      <div className="flex flex-wrap items-center justify-center gap-4 text-sm">
        <label className="flex items-center gap-2">
          <span className="text-[var(--muted)]">Rounds</span>
          <input
            type="number"
            min={1}
            max={MAX_ROUNDS}
            value={rounds}
            disabled={busy}
            onChange={(e) => setRounds(clampRounds(Number(e.target.value)))}
            className="w-20 px-2 py-1.5 rounded-md border border-[var(--rule)] bg-[var(--bg)] tabular-nums focus:outline-none focus:border-[var(--accent)] disabled:opacity-40"
          />
        </label>

        <div className="flex items-center gap-2">
          <span className="text-[var(--muted)]">Speed</span>
          <div className="inline-flex rounded-md border border-[var(--rule)] overflow-hidden">
            {(["slow", "medium", "fast", "instant"] as Speed[]).map((s) => (
              <button
                key={s}
                onClick={() => setSpeed(s)}
                disabled={busy}
                aria-pressed={speed === s}
                className="px-2.5 py-1.5 capitalize transition-colors disabled:opacity-40"
                style={{
                  background: speed === s ? "var(--accent)" : "transparent",
                  color: speed === s ? "#fff" : "var(--muted)",
                }}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {busy ? (
          <button
            onClick={stop}
            className="px-4 py-1.5 rounded-md border border-[var(--accent)] text-[var(--accent)] hover:bg-[var(--accent-soft)] transition-colors"
          >
            Stop
          </button>
        ) : (
          <button
            onClick={watch}
            disabled={identical}
            className="px-4 py-1.5 rounded-md border border-[var(--rule)] hover:border-[var(--accent)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors font-medium"
          >
            Watch
          </button>
        )}
        {(phase !== "idle" || winners.length > 0) && !busy && (
          <button
            onClick={reset}
            className="px-3 py-1.5 rounded-md border border-[var(--rule)] hover:border-[var(--accent)] transition-colors"
          >
            Reset
          </button>
        )}
      </div>

      {/* Current round, flip by flip */}
      {curFlips.length > 0 && (
        <div className="p-4 rounded-lg border border-[var(--rule)] bg-[var(--surface)]">
          <div className="flex items-baseline justify-between mb-3">
            <span className="text-xs uppercase tracking-wider text-[var(--muted)]">
              Round {Math.min(winners.length + (busy ? 1 : 0), totalPlanned) || winners.length}
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {curFlips.map((f, i) => (
              <Coin key={i} bit={f} size={32} />
            ))}
          </div>
        </div>
      )}

      {/* Tally + stats */}
      {winners.length > 0 && (
        <div className="p-5 rounded-lg border border-[var(--rule)] bg-[var(--surface)] space-y-4">
          <div className="flex items-baseline justify-between">
            <span className="text-xs uppercase tracking-wider text-[var(--muted)]">
              {winners.length.toLocaleString()} of {totalPlanned.toLocaleString()} rounds
            </span>
            {phase === "done" && (
              <span className="text-xs uppercase tracking-wider text-[var(--muted)]">Final</span>
            )}
          </div>

          {/* Stacked bar */}
          <div className="flex h-9 w-full overflow-hidden rounded-md text-xs font-medium text-white">
            <div
              className="flex items-center justify-start pl-2"
              style={{ width: `${youPct}%`, background: YOU_COLOR, transition: "width 200ms ease" }}
            >
              {youPct >= 12 && `${youPct.toFixed(0)}%`}
            </div>
            <div
              className="flex items-center justify-end pr-2"
              style={{ width: `${housePct}%`, background: HOUSE_COLOR, transition: "width 200ms ease" }}
            >
              {housePct >= 12 && `${housePct.toFixed(0)}%`}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <ResultStat label={`You (${you})`} color={YOU_COLOR} wins={youWins} pct={youPct} />
            <ResultStat
              label={`${houseLabel} (${houseSeq})`}
              color={HOUSE_COLOR}
              wins={houseWins}
              pct={housePct}
            />
          </div>

          {/* Colour-coded round-by-round outcomes */}
          <div>
            <div className="flex gap-4 text-xs text-[var(--muted)] mb-2">
              <span className="flex items-center gap-1.5">
                <span className="inline-block w-3 h-3 rounded-sm" style={{ background: YOU_COLOR }} />
                You
              </span>
              <span className="flex items-center gap-1.5">
                <span className="inline-block w-3 h-3 rounded-sm" style={{ background: HOUSE_COLOR }} />
                {houseLabel}
              </span>
            </div>
            <div className="flex flex-wrap gap-1">
              {winners.map((w, i) => (
                <span
                  key={i}
                  title={`Round ${i + 1}`}
                  className="w-3.5 h-3.5 rounded-sm"
                  style={{ background: w === "you" ? YOU_COLOR : HOUSE_COLOR }}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </figure>
  );
}

// --- sub-components --------------------------------------------------------

function ModeButton({
  active,
  disabled,
  onClick,
  children,
}: {
  active: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      role="tab"
      aria-selected={active}
      className="px-4 py-1.5 transition-colors disabled:opacity-40"
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
}: {
  label: string;
  color: string;
  seq: string;
  editable: boolean;
  onChange: (next: string) => void;
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
    </div>
  );
}

function Coin({ bit, size }: { bit: Bit; size: number }) {
  return (
    <span
      className="rounded-full font-mono font-semibold flex items-center justify-center"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.45,
        background: bit === "H" ? "var(--coin-heads)" : "var(--coin-tails)",
        color: "var(--coin-ink)",
      }}
    >
      {bit}
    </span>
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
