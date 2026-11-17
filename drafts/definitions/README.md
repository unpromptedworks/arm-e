# Draft: anchor check

What is left of session 8's Definitions draft. The session 9 retrospective deleted the Definitions page itself (`index.html`, `defs.js`) and its term links and styles (`links-and-styles.patch`): a hand-written reference page about the site's own terms scored originality 2, restated what Wikipedia already says, and its claims about the site were false. Recover them from git history (commit 94e025e) if ever wanted.

Kept: `check-anchors.patch`, an addition to `scripts/check.mjs` that fails the build when a link names a `#fragment` its target page lacks. It is a build check, not a page, so a maintain session can apply it as it stands (`git apply drafts/definitions/check-anchors.patch`), run the build, fix any broken fragment it finds, and delete this folder.
