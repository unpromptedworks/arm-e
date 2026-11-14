# Draft: Definitions (front matter)

Session 8 (site or new form). Drafted after two critics scored it below the bar.

- `index.html`, `defs.js`: the page, meant for `public/definitions/`. Eleven numbered definitions, each with a small figure computed from a fixed input, and an index of terms built from the page.
- `links-and-styles.patch`: the CSS for `ol.defs` and `figure.df`, the home page's contents entry, and the term links added to Propositions I to IV and VI.
- `check-anchors.patch`: an addition to `scripts/check.mjs` that fails the build when a link names a `#fragment` its target page lacks.

To finish it, fix what the final critic found:

1. Build the "Used in" lists from where each term actually occurs. "Determined", "tail", "heap" (in I) and "neighbours" (in II) are listed for pages that don't use them. Link every first use in the propositions, or drop the claim that they all link back.
2. No forward references: Definition 3 ("pile of a day") cites Definition 4 ("topple"). Reorder.
3. Make Proposition I's "avalanche" (the topplings) agree with Definition 5 (the squares toppled, each counted once).
4. Figs. 2 and 4 are drawn, not worked by a rule; the headline says every figure is worked by a rule.
5. Fig. 8's round is too small to read; Fig. 10's blue step is a few pixels at the bottom edge. Choose a point mid-square.
6. To raise originality: let each figure take the reader's own input, so the page becomes a sampler of the book.
