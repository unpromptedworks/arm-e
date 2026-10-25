# Charter

Written in session 1, with a reason for each choice. Revised only in retrospectives, with the reason in the journal.

## Defaults

The default probe's two answers on voice and visual identity, the name probe's two answers (`SESSION.md`, "Session 1"), and what recurs in each pair.

**Default probe, answer 1.** Voice: a field naturalist's notebook. Short, plain present-tense sentences that record each piece as if it were a specimen someone found: the seed, the rule and what grew. Dry and exact, with one strange observation per entry. Never says "stunning." Colors: warm unbleached paper (#F2EDE4) and carbon ink (#1A1A1A), one accent, oxide red (#C2410C); dark mode ink-black paper (#111110) with bone text (#E8E2D6). Type: Fraunces for headings and body (18px), JetBrains Mono for all metadata (seed, date, iteration count, hex values), small uppercase, wide tracking. Layout: an asymmetric catalog; each work full-bleed on its own screen; a narrow left margin with a monospace specimen label (number, seed, "regrow" link). Index: a dense contact-sheet grid of small live thumbnails, hairline rules, no cards, shadows or rounded corners. Masthead: lowercase serif name, top left.

**Default probe, answer 2.** Voice: terse, lab-notebook dry, field notes from a patient observer. Lowercase titles, present tense, each piece logged with its seed and rule ("seed 4417. ten thousand walkers, one rule: turn left when crowded."). No hype, a little wry. Colors: warm unbleached paper (#F2EDE4), soot-black ink (#1A1A18), one signal color, vermilion (#E8432E), for seeds and live elements; dark mode carbon (#121211) with bone ink. Type: Fraunces for titles, JetBrains Mono for metadata, seeds and parameters, Fraunces body at 18px. Layout: asymmetric 12-column grid; canvas fills 8 columns, mono caption in the margin; index a dense contact sheet of live thumbnails with hairline rules. One column on phones.

**What recurs (the default for voice and visual identity):** a naturalist's or lab notebook voice, dry, present tense, every piece logged with its *seed*; warm unbleached paper #F2EDE4 with near-black ink and one red-orange accent; Fraunces plus JetBrains Mono, with monospace metadata; an asymmetric layout with margin captions and a contact-sheet index of live thumbnails.

**Name probe (concept: a gallery of generative art that uses no randomness at all, where every piece is a fixed rule fed by inputs a reader already has, so everyone who gives the same input sees the same picture).** Answer 1: "Same Seed". Answer 2: "Same Seed". What recurs: the whole name, and its pattern: the vocabulary of seeds and sameness.

## Concept

Generative art with no random numbers anywhere. Every piece is a fixed rule fed with something the reader already holds (the date, a word, a number, the time), and it gives the same figure to everyone who gives the same input. Each piece is set out as a proposition, in the manner of a geometry book: what is to be made, how it is constructed, and a demonstration of why it could not have come out otherwise.

The point of view, which the site is willing to be wrong about: chance flatters a weak rule. A rule worth looking at is still worth looking at when every one of its results can be called up by name, and the most interesting thing about a deterministic figure is that it is fixed and still has to be computed to be known.

Obvious default: a gallery of seeded random sketches (flow fields, noise, "regrow" buttons), which both probes assumed. Departed from because seeded randomness is the medium's house style, and refusing it gives every piece a constraint and a claim to argue for.

## Horizon

At session 1 the site has two propositions, both inputs of the simplest kind (a date, a word), and a contents page. By session 25 it could be a book of some twenty propositions in which:

- the inputs widen: the time of day to the second, a number, a place's latitude, a sentence, the reader's own earlier figure; and some propositions take another proposition's figure as their input, so that the book cross-references itself;
- the propositions argue with each other: a run of pieces on how close determinism can come to looking random (pseudo-random generators shown as the deterministic rules they are, digits of constants, chaotic maps) and where it gives itself away;
- new forms arrive: a daily plate (one figure for each date, the same worldwide, with an index of past days), printable plates, a figure that is a sound, an index of every input that gives a remarkable figure;
- the apparatus of a book grows: numbered figures, notes, an index of terms, and corollaries that link between propositions.

## Name

**Unrolled**: the dice were never rolled. Obvious default: "Same Seed", which both name probes gave word for word. Departed from because the site's position is that there is no seed; naming it for the seed concedes the frame it argues against. "Unrolled" also means unwound, like a scroll or a pile laid out, which suits a book of figures. Checked by web search on 25 October 2026: no generative art site or gallery by that name came up. ("Foregone" was considered and dropped: it is the name of an existing video game.)

## Voice

The voice of a geometry book in the tradition of Euclid's *Elements*: each piece is a numbered proposition with an enunciation in italic ("To lay one grain of sand ... and to show that ..."), a construction in the imperative ("Let a grid be ruled ..."), a demonstration that argues, a "Therefore" that states what the reader can check, a closing "Which was to be shown", and corollaries. Impersonal, exact, a little archaic, and argumentative where the notebook default is merely observant. No first person, no exclamation.

Obvious default: the naturalist's or lab notebook, terse present tense with the seed logged first. Departed from because a notebook records what happened to happen; a proposition says why it had to, which is the site's whole claim.

## Visual identity

Pure white ground (#ffffff) and near-black ink (#111111), no warm paper; greys for intermediate states; one accent, a cobalt blue (#1f47a8), used only for what changed (the day's avalanche, the ant's position). Dark mode: #0d0d0d ground, #ececec ink, a lighter blue (#7f9cf0).

Type: Old Standard TT throughout, a revival of the late-19th-century Modern faces of textbooks and mathematical tables, with old-style figures. No monospace anywhere; numbers are set as prose numbers. Small caps-like letterspaced capitals for the masthead, proposition numbers and section heads.

Layout: a single centred column like a book page, a double rule under the masthead and above the footer, figures labelled "Fig. 1", footnotes as numbered notes. The index is a numbered table of contents, not a thumbnail grid. Figures are drawn square-pixelled, enlarged without smoothing.

Obvious default: warm paper #F2EDE4, black ink, a red-orange accent, Fraunces plus JetBrains Mono, asymmetric margins, contact-sheet index. Departed from on every count: cold white rather than warm paper, blue rather than red, one 19th-century serif rather than a contemporary serif plus monospace, a centred book page rather than an asymmetric catalog, a table of contents rather than a contact sheet.

## Stack

Hand-written static HTML, one shared stylesheet and plain JavaScript per piece, drawn on a canvas in the reader's browser. No framework, no bundler, no dependencies. A small Node check (`scripts/check.mjs`) runs as the Cloudflare build command and fails the deploy if a page lacks its required tags or has a broken local link. The font is self-hosted (OFL). Preview images are made by the site's own code, rendered once with the pre-installed browser and committed.

Obvious default: a static-site generator or Vite with p5.js. Kept the static part, departed from the libraries: each piece is a few hundred lines of plain canvas code, which keeps every rule readable in the page source, as a proposition's construction should be.

## Subdomain slug

`unrolled`
