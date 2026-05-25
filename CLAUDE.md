# Claude Context: Workshop Site

> **Maintenance rule (read first).** This file is the fast-start map of the
> site. **Whenever the site's structure changes — a new day, page, widget,
> layout, config switch, or build step — update this file in the same change.**
> Keep the tables and "Current state" section honest; a stale map is worse than
> none. This file documents *structure*; it does not replace the parent
> `Workshop/CLAUDE.md` writing/pedagogy rules, which still apply to lecture prose.

## What this is

The **web companion** to the probabilistic-method workshop (the LaTeX notes live
in `Workshop/`). A static **Astro 5** site: short lectures + interactive widgets,
one mini-site per "day".

- **Published to GitHub Pages** at `https://zacaffeinemachine.github.io/lgp-pm`.
- **`base: '/lgp-pm'`** in `astro.config.mjs` — every internal link must go
  through `import.meta.env.BASE_URL` (the code already does this; keep doing it,
  or links break in production).
- **Auto-deploy:** `.github/workflows/deploy.yml` runs on every push to `main`
  (`npm ci → npm run build → upload dist/`). No manual deploy step.
- Remote: `origin → github.com/zacaffeinemachine/zaca.github.io`.

## Tech stack

| Concern        | Choice |
|----------------|--------|
| Framework      | Astro 5 (static output) |
| Lecture content| MDX (`@astrojs/mdx`) |
| Interactivity  | React 19 islands (`@astrojs/react`), loaded `client:visible` |
| Styling        | Tailwind v4 via `@tailwindcss/vite`; CSS variables in `global.css` |
| Math           | `remark-math` + `rehype-katex`, rendered **at build time** |

KaTeX macros are defined in `astro.config.mjs` to mirror the LaTeX notes:
`\P \E \Var \Cov \set \abs \one`. Use the same notation in MDX as in the `.tex`
sources. **If you add a macro to the notes' preamble and use it on the site, add
it here too** (in both the `mdx` and `markdown` plugin configs — they duplicate
the same `katexOptions`).

## Directory layout

```
Site/
├── astro.config.mjs        # site/base URL, MDX+KaTeX wiring, KaTeX macros
├── package.json            # scripts: dev / build / preview
├── .github/workflows/deploy.yml
├── src/
│   ├── config/visibility.ts        # ← the release switch (see below)
│   ├── layouts/
│   │   ├── Base.astro              # <html>, header/footer, theme toggle, laser-pointer
│   │   └── Chapter.astro           # per-page chrome: TOC, prev/next, "not released" wall
│   ├── components/
│   │   ├── ChapterCard.astro       # day card on the home page
│   │   ├── lecture/                # the Summary/Detailed lecture mechanism
│   │   │   ├── Lecture.astro        #   wrapper + client script (reveal logic)
│   │   │   ├── Beat.astro           #   one teachable unit (Summary + Detail)
│   │   │   ├── Summary.astro        #   terse headline (shown in both modes)
│   │   │   └── Detail.astro         #   full content (Detailed mode only)
│   │   ├── widgets/*.tsx           # React interactive figures
│   │   ├── games/*.tsx             # React games (PenneysGame; Knight/SwapKnights puzzles)
│   │   └── graphs/*.astro          # static SVG graph figures (appendix)
│   ├── pages/
│   │   ├── index.astro             # home; hand-curated `allChapters` (day + appendix)
│   │   ├── day1/
│   │   │   ├── index.astro         # Day 1 landing (auto-lists visible sub-pages)
│   │   │   └── *.mdx               # the lecture pages
│   │   ├── day2/                   # same shape (index.astro + 8 *.mdx)
│   │   └── appendix/               # "A Primer on Graphs" (index.astro + 12 *.mdx); not a "Day"
│   └── styles/global.css           # theming, .prose, lecture UI, exercises, coins
└── dist/                           # build output (git-ignored content; do not edit)
```

## Content model — how a "day" is built

1. **Home page** (`src/pages/index.astro`): a hand-curated `allChapters` array
   (slug + title + blurb), filtered by `isChapterVisible`. Add a day's entry here.
2. **Day landing** (`src/pages/dayN/index.astro`): sets `chapter`/`chapterTitle`,
   auto-discovers its `*.mdx` sub-pages via `import.meta.glob("./*.mdx")`, sorts
   by `order`, filters by `isPageVisible`. To add a new day, copy `day1/index.astro`
   and change `chapter`/`chapterTitle` + the intro prose.
3. **Lecture pages** (`src/pages/dayN/slug.mdx`): each needs frontmatter

   ```yaml
   layout: ../../layouts/Chapter.astro
   title: Sample Spaces and Events
   order: 2                         # position within the day
   chapter: day1
   chapterTitle: Day 1 — Foundations
   blurb: one-liner for the day-landing list
   description: longer SEO/meta description
   ```

   The `Chapter.astro` layout reads frontmatter from `Astro.props.frontmatter`,
   builds the in-day TOC and prev/next from sibling `.mdx` files, and renders the
   "Not yet released" wall when the page isn't in the visibility list.

### Appendices (non-numbered chapters)

A chapter can be an **appendix** instead of a "Day". The only differences:

- In `index.astro`, each `allChapters` entry carries a `kind` (`"day"` |
  `"appendix"`). Days are numbered `Day 1, Day 2, …`; appendices show an
  `"Appendix"` kicker. Day numbering counts only `kind: "day"` entries, so an
  appendix anywhere in the list does not shift Day numbers. `ChapterCard.astro`
  takes a generic `kicker` string (no longer a `number`).
- `Chapter.astro` swaps the breadcrumb root ("Days" → "Home") and the TOC label
  ("In this day" → "In this appendix") when `frontmatter.chapter === "appendix"`.
- The landing page (`pages/appendix/index.astro`) and each `*.mdx` set
  `chapter: appendix`, `chapterTitle: Appendix — A Primer on Graphs`. Otherwise
  identical to a day: same `<Lecture>`/`<Beat>` mechanism, same visibility gating.

## The lecture mechanism

Structure inside an MDX body:

```mdx
<Lecture>
  <Beat>
    <Summary>terse headline (KaTeX ok)</Summary>
    <Detail>the full explanation, examples, widgets…</Detail>
  </Beat>
  …more beats…
  <Beat full>            {/* `full` → detail shows even in Summary mode */}
    <Summary>**Exercises**</Summary>
    <Detail><div class="exercises"> … </div></Detail>
  </Beat>
</Lecture>
```

- Two views, toggled in a sticky bar: **Summary** (reveal beats one at a time
  with →/space/click; counter `n / N`) and **Detailed** (everything expanded).
  Mode persists in `localStorage` (`lectureMode`). Logic is the inline `<script>`
  in `Lecture.astro` — plain DOM, no React.
- `<Beat full>` is for content that must appear in full at the end (the closing
  Exercises block).
- **Widgets surface in Summary mode.** A normal beat hides its `<Detail>` in
  Summary mode, *except* that if the detail contains an interactive widget
  (`<astro-island>`), the widget alone is revealed once the beat is reached
  (its prose siblings stay hidden) — so it can be demoed live in class. This is
  the `.widgets-only` path in `Lecture.astro` + `global.css`; clicks inside a
  revealed detail no longer advance the lecture. Relies on each widget being a
  direct child of its `<Detail>` (own line, blank-line separated in MDX).

## Interactive widgets

React components dropped into MDX as `<Foo client:visible />`. They use the
themed CSS variables (`var(--accent)`, `var(--surface)`, coin colors) so they
follow dark mode. **Keep this table current.**

| Component (`src/components/…`)         | Used in                              |
|----------------------------------------|--------------------------------------|
| `games/PenneysGame.tsx`                | day1/why-formal-language             |
| `widgets/RandomChord.tsx`              | day1/why-formal-language             |
| `widgets/TwoTosses.tsx`                | day1/sample-spaces-and-events        |
| `widgets/CoinBuilder.tsx`              | day1/probability-measures            |
| `widgets/FrequencyConvergence.tsx`     | day1/probability-measures            |
| `widgets/BirthdayProblem.tsx`          | day1/uniform-measure                 |
| `widgets/FixedPoints.tsx`              | day1/independence, day2/independence |
| `widgets/AvoidEvents.tsx`              | day1/independence                    |
| `widgets/RandomVariableExplorer.tsx`   | day2/random-variables                |
| `widgets/ExpectationSim.tsx`           | day2/expectation                     |
| `widgets/LinearitySim.tsx`             | day2/linearity                       |
| `widgets/DegreeSum.tsx`                | day2/degree-sum, appendix/degree-and-handshake |
| `widgets/ProductRule.tsx`              | day2/independence                    |
| `games/KnightPuzzle.tsx`               | appendix/knight-moves                |
| `games/SwapKnightsPuzzle.tsx`          | appendix/swap-knights, appendix/row-swap, appendix/classical |
| `games/GreaterChallengePuzzle.tsx`     | appendix/greater-challenge           |

(Day 2's `indicators`, `distribution`, and `key-move` pages are text-only by design.)

## Release gating — `src/config/visibility.ts`

The **one file you edit to release material.** Two arrays:

- `VISIBLE_CHAPTERS` — days shown on the home page / reachable.
- `VISIBLE_PAGES` — `"chapter/slug"` entries shown in lists and reachable.

Hiding a chapter hides all its pages. Hidden routes **still build** but render a
"Not yet released" wall — this is listing-level gating, not hard access control.
Changes take effect on the next build/deploy.

## Styling & theming (`src/styles/global.css`)

- CSS-variable themes for light/dark (`--bg --surface --ink --muted --rule
  --accent --accent-soft` + coin colors). Toggle + persistence live in
  `Base.astro`; the no-flash theme script runs in `<head>`.
- `.prose` typography system; `.exercises` callout; lecture UI classes; KaTeX CSS
  imported at the top.
- Easter egg: **laser-pointer mode** — press `L` (Esc to exit), implemented as an
  inline script in `Base.astro`. Handy when presenting.

## Commands

```bash
cd Site
npm install          # first time
npm run dev          # local dev server (hot reload)
npm run build        # production build → dist/
npm run preview      # serve the built dist/ locally
```

Prefer `npm run build` to catch errors before pushing (push = deploy).

## Current state

- **Day 1 — Foundations:** fully built, all 6 pages released
  (`why-formal-language`, `sample-spaces-and-events`, `probability-measures`,
  `uniform-measure`, `independence`, `putting-it-together`).
- **Day 2 — Random Variables, Expectation, and Linearity:** fully built and
  **released** — `"day2"` is active in `VISIBLE_CHAPTERS`. All 8 pages exist
  (`random-variables`, `expectation`,
  `indicators`, `linearity`, `distribution`, `degree-sum`, `key-move`,
  `independence`): one page per section of `Days/Day2.tex`, each closing with that
  section's three exercises.
- **Days 3–5 + Bonus:** not built yet (placeholder comment in `index.astro`).
- **Appendix — A Primer on Graphs:** fully built and **released** —
  `"appendix"` is active in `VISIBLE_CHAPTERS`; all 13 pages are live. Four ported Guarini
  knight-puzzle pages (`knight-moves`, `swap-knights`, `row-swap`, `classical`) + a bridge
  puzzle (`greater-challenge`, the ten-square tree-board variant ported from the
  MathematicalThinking site, with a riddle-gated hidden-graph overlay), then
  eight lecture pages mirroring `Appendices/Graphs.tex` (`graphs-vertices-edges`,
  `degree-and-handshake`, `complete-paths-cycles`, `bipartite-graphs`,
  `subgraphs-and-complements`, `cliques-and-independent-sets`, `edge-colourings`,
  `glossary`). Figures are static SVG `components/graphs/*.astro`; the puzzle
  boards reuse the ported `games/{KnightPuzzle,SwapKnightsPuzzle,GreaterChallengePuzzle}.tsx`.
- The downloadable `WorkshopNotes.pdf` is served from `public/notes/` and linked
  in every page header (`Base.astro`).

<!-- When you finish a structural change, update the table(s) above and this
     "Current state" list, then commit alongside the change. -->
