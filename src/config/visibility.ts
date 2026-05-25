// -----------------------------------------------------------------------
//  Visibility controls — the one file you edit to release material.
// -----------------------------------------------------------------------
//
//  Comment out an entry to hide it from students; uncomment to reveal.
//  Changes take effect on the next `npm run build` (and redeploy).
//
//  Rules of the game:
//    • A hidden day is hidden from the home page. Its landing page
//      and every one of its sub-pages show a polite "not yet released"
//      message if a student URL-guesses them.
//    • A hidden page is hidden from the day's page list and from the
//      in-day TOC and prev/next links. Same "not yet released" wall
//      for URL-guessers.
//    • Hiding a day implicitly hides all its pages — you do NOT need
//      to comment out each sub-page.
//
//  Note: this is listing-level gating, not hard access control. The HTML
//  is still generated; the wall keeps casual URL-guessing students out,
//  but a determined one can inspect the build. For hard gating, add basic
//  auth at the host level.
// -----------------------------------------------------------------------

export const VISIBLE_CHAPTERS: readonly string[] = [
  "day1",
  "day2",  // released.
  "appendix",  // released — the graph primer.
];

export const VISIBLE_PAGES: readonly string[] = [
  "day1/why-formal-language",
  "day1/sample-spaces-and-events",
  "day1/probability-measures",
  "day1/uniform-measure",
  "day1/independence",
  "day1/putting-it-together",
  "day2/random-variables",
  "day2/expectation",
  "day2/indicators",
  "day2/linearity",
  "day2/distribution",
  "day2/degree-sum",
  "day2/key-move",
  "day2/independence",
  // Appendix — A Primer on Graphs (gated by the commented "appendix" chapter above).
  "appendix/knight-moves",
  "appendix/swap-knights",
  "appendix/classical",
  "appendix/greater-challenge",
  "appendix/graphs-vertices-edges",
  "appendix/degree-and-handshake",
  "appendix/complete-paths-cycles",
  "appendix/bipartite-graphs",
  "appendix/subgraphs-and-complements",
  "appendix/cliques-and-independent-sets",
  "appendix/edge-colourings",
  "appendix/glossary",
];

export function isChapterVisible(slug: string): boolean {
  return VISIBLE_CHAPTERS.includes(slug);
}

export function isPageVisible(chapter: string, pageSlug: string): boolean {
  if (!isChapterVisible(chapter)) return false;
  return VISIBLE_PAGES.includes(`${chapter}/${pageSlug}`);
}
