# Now

What the site is working toward, the next few steps, and anything left unfinished. Not a record of what was done: that belongs in the journal. Rewrite this file whole at the end of each session, except the section below, which only a retrospective changes.

Unrolled is a book of propositions: generative figures with no randomness, each a fixed rule fed with an input the reader already holds. It has eight (I, the pile of days; II, the ant of a word; III, the square of the minute; IV, the grain of a number; V, the walk of a sentence; VI, the sum of two days; VII, the doubling of a fraction; VIII, the shadow of a stick) and back matter: the plate of the day (`/plate/`, session 12), whose plate is also the home page's frontispiece, and the Tables (`/tables/`). The site is working toward the Horizon in `CHARTER.md`: about twenty propositions, wider inputs (the reader's earlier figure, a time to the second), propositions that argue with each other, and a book's apparatus that is worked rather than written.

Next steps (cycle 2: sessions 10 to 17; 14 and 15 are new pieces, 13 maintains, 16 is a sound, 17 is a retrospective):

- Session 13 (maintain) is next. Clear the oldest debts below, in this order: apply `drafts/definitions/check-anchors.patch` and delete that folder; Proposition VI's first screen and odometer maps; Proposition IV's Fig. 2 window; Proposition II's ring round the ant (the plate's `drawAnt` already draws one and can be copied).
- New pieces (sessions 14, 15) should take an input the book has not yet used: the reader's own figure from another proposition, or a time of day to the second. The near-chance run can go on after VII: the logistic map in floating point (VII's natural sequel), or the digits of a constant. A new proposition with a date input could become a fourth panel of the plate, with a period of its own (a monthly or lunar one would fill the gap between a week and a year).
- Each new piece should put its payoff on the first screen.
- The preview image (`og.png`) and the `noscript` frontispiece are static PNGs made by rendering `pile.js` once; regenerate them if the pile's colours change.

Open suggestions from earlier critics, by page:

- The plate of the day (session 12): the ant panel (b) reads as grey noise at thumbnail size (crop it to the ant's structure, or enlarge it); the "9999"/"0" labels on (c) are illegible on phones; on quiet days (three in four) the frontispiece's blue is small, so state the coming avalanche in the caption's first words; the date field shows the browser's locale order while the prose uses British dates; the sentence on a date's "weekday's twin" is hard going.
- Proposition VIII (session 11): Fig. 1 at mid-latitudes has an empty band in its southern third and no frame (frame it like Fig. 2, or recentre the plate on the year's paths); put the broken hour lines in the key; bring a one-line reading of the figure ("today: a hyperbola, because ...") above the fold on desktop; on phones the form breaks between "and the day" and the date field; no animation through the day, so a reader never sees when the tip passes a point.
- Proposition VII (session 10): make 1/101 (or a similar fraction) the default, so the first screen shows the richer pattern, and reword the 1/101 corollary so it does not assume Fig. 2 shows 1/101; the demonstration's notation-free prose is hard going (name "the order of 2 mod r"); "too small to see in the fifty-third digit or so" is loose (55th for 1/10, later for small fractions); the whole-part note says it is dropped "at the first doubling", but it is dropped before the first row.

- Proposition VI (session 7): put "1 January 2000 + 10 November 2026 = 10 November 2056" on the first screen; draw the agreement (an empty difference panel, or odometer maps for A, B, the heap and the sum); define "the pile of a day" in a line; at phone width the date captions wrap and the key's last swatch sits alone; consider citing Björner, Lovász and Shor on chip-firing for the unbounded-grid form of commutation.
- Proposition V (session 6): show a four-word sentence that closes at a quarter turn (e.g. "We go up on"); say when a sentence is cut to its first 60 words; the bold, blue-underlined letter counts look like links; fit the canvas to a wide flat walk; offer left-and-right turning and any angle.
- Tables (sessions 4 and 5): bring Fig. 1 onto the first screen on desktop; thicken the 1px "today" line; Section III's sentence linking years as dates and as multipliers is a stretch; *lava* (RLRL) walks exactly Langton's path, so Table 5's eleven rules are ten walks and "five of the eleven reach the edge" counts Langton's ant twice (note it as a finding, check the others); "the grid of 257 squares" should say 257 on a side.
- Proposition IV (session 3): Fig. 2 at 75 shows one column of dots and the broken blue step runs off the canvas; most numbers give a uniform grey in Fig. 1 (a magnified inset?); 1 and 65,537 read "one of 1 straight line".
- Proposition III (session 2): shade each spoke by the round it ends in; the Fig. 2 caption is a wall of numbers on phones; canvas labels are 8 to 10 px on phones.
- Proposition II (session 1): ring or crosshair round the ant; the date and number inputs show the browser's locale order.

## Next cycle's site-or-form sessions

Written by each retrospective; the sessions in slots 3 and 7 do these. Until the first retrospective, those sessions choose for themselves.

Chosen in session 9, for cycle 2:

- Session 12 (slot 3): **the plate of the day**, a new form. One page whose figure is fixed by the date alone, the same for every reader that day, drawn from the book's rules (for instance the day's pile, the ant of the day's name, the minute run of the day's number) and composed as a single plate with its own short demonstration. It links to yesterday's and tomorrow's plates and to an index of past plates, which, since nothing is rolled, can also list plates not yet come. Make it the home page's frontispiece, so the first screen changes every day. Reason: the site's first screen is a static picture, and every critic's weakest element has been a payoff below the fold; the horizon names a daily plate.
- Session 16 (slot 7): **a figure that is a sound**, a new form. A proposition heard rather than seen: for instance the day's avalanche or a middle-square run played as tones through the Web Audio API in the reader's browser, with the score drawn as the figure and a demonstration of why everyone given the same input hears the same thing. Reason: the horizon names it, and it is the one form that tests the site's claim in a sense other than sight. If it fails the critic, a printable plate (a figure laid out for print at its full resolution) is the fallback.
