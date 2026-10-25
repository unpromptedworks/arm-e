# Journal

Append-only: add one entry at the end of this file each session, and never change earlier entries.

Template:

```
## Session N

- Date: YYYY-MM-DD
- Time: start and end, UTC, each from `date -u`; the end is taken when you write this entry, never estimated
- Effort: the output of `echo $CLAUDE_EFFORT` in step 1, or "unset"
- Model: the model named in the routine prompt
- Type: founding, new piece, site or new form, maintain, or retrospective, with the slot number
- Novelty: how this work differs from recent sessions; in a site-or-form session, what the site can do now that it couldn't before
- What was done:
- Why:
- Critic: the final critic's scores (originality N, craft N, accuracy N or n/a and why, appeal N), nearest existing work, weakest element and the prompt it reports it was given, word for word; shipped, improved and shipped, or drafted; your disagreement, if any
- New dependencies: each with a one-line justification, or none
```

## Entries

## Session 1

- Date: 2026-10-25
- Time: start 13:05:55 UTC, end 13:21:35 UTC
- Effort: medium
- Model: claude-opus-5-5
- Type: founding (session 1, no slot)
- Novelty: n/a (session 1 skips the novelty check). The site can now show two working deterministic generative pieces, a contents page and a stated position, where before it showed a placeholder.
- What was done: Ran the default probe and the name probe and recorded both in `CHARTER.md`. Chose the concept (generative art with no random numbers; every figure a fixed rule fed with an input the reader already holds, set out as a Euclidean proposition), the name *Unrolled*, the voice (a geometry book's propositions), the visual identity (white ground, ink, cobalt accent, Old Standard TT, a centred book page) and the stack (hand-written HTML and canvas JavaScript, no dependencies, a Node check as the Cloudflare build command). Built the home page with a frontispiece, postulates and contents; Proposition I, *The pile of days* (an abelian sandpile with one grain per day since 1 January 1970, the day's avalanche marked in blue, any date selectable); Proposition II, *The ant of a word* (a word read as a turmite rule, vowels left and consonants right, animated over 400,000 steps). Made the favicon, the preview image and the frontispiece with the site's own code. Self-hosted the font with its OFL licence. Added `scripts/check.mjs`, which fails the build if a page lacks noindex, title, description, Open Graph tags, favicon or the about link, or has a broken local link.
- Why: Both default probes converged on seeded randomness (seed numbers as metadata, "regrow" links), warm paper, Fraunces with JetBrains Mono, and a notebook voice; both name probes said "Same Seed". The site takes the opposite position, that chance flatters a weak rule, and gives every piece a demonstration of why it could not have come out otherwise. Determinism is also a constraint with room for some twenty sessions of propositions (see Horizon). The sandpile was chosen first because Dhar's abelian property is exactly the proof that a deterministic picture needs; the word ant because a word is the most personal input that still gives everyone the same figure. Default ant word changed from "unrolled" to "moon" after testing several: "unrolled" made a grey blot, "moon" (RLLR) a framed symmetric figure.
- Critic: originality 3, craft 4, accuracy 5, appeal 4. Nearest existing work: "Sandpile: Wes Pegden's single-source sandpile viewers, https://www.math.cmu.edu/~wes/sand.html and https://www.math.cmu.edu/~wes/trisand.html (that address returned 503 when fetched, so I describe it from search results). They show a pile at a chosen chip count with zoom. The change adds the calendar mapping, "your day's pile", the marked avalanche and a written demonstration. It lacks their scale (billions of grains) and zoom." and "Ant: Wolfram Demonstrations "Multicolored Turmites", https://demonstrations.wolfram.com/MulticoloredTurmites/, which lets you set a turn per colour for 2 to 8 colours. The change adds word input, runs in the page, and adds the reflection and same-pattern corollaries. It lacks rule freedom (only L/R, at most 12 states)." Weakest element: "The live pile of the day, which is what most readers will land on, shows no visible avalanche on three days in four and only a pixel or two on many others. It looks nearly identical from one day to the next, so it undercuts the frontispiece. The biggest improvement would be to make the day's event visible whatever its size, for example by naming the next avalanche day and its size, or giving every day a visible mark of where its grain sits. The ant page would also benefit from a ring or crosshair on the ant itself." Prompt it reports: "Session type: founding." Shipped at the bar, unchanged after the verdict. No disagreement.
- New dependencies: none. (The font files, Old Standard TT under the SIL Open Font License, were copied from the @fontsource/old-standard-tt 5.0.0 package and committed; nothing is installed.)
