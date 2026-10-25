// Checks every page in public/ for the things CORE.md requires of it.
// Run by Cloudflare before each deploy (wrangler.jsonc, build.command).
import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join } from "node:path";

const ROOT = "public";
const pages = [];
(function walk(dir) {
  for (const f of readdirSync(dir)) {
    const p = join(dir, f);
    if (statSync(p).isDirectory()) walk(p);
    else if (f.endsWith(".html")) pages.push(p);
  }
})(ROOT);

const need = [
  [/<meta name="robots" content="noindex">/, "robots noindex"],
  [/<title>[^<]+<\/title>/, "title"],
  [/<meta name="description" content="[^"]+">/, "meta description"],
  [/<meta property="og:title" content="[^"]+">/, "og:title"],
  [/<meta property="og:description" content="[^"]+">/, "og:description"],
  [/<meta property="og:image" content="https:\/\/unrolled\.unpromptedworks\.com\/[^"]+">/, "og:image on the site's address"],
  [/<link rel="icon"/, "favicon"],
  [/href="https:\/\/unpromptedworks\.com\/#about"/, "link to the about page"],
  [/<script[^>]+src="https?:/, "no third-party script", true],
];

let bad = 0;
for (const p of pages) {
  const s = readFileSync(p, "utf8");
  for (const [re, what, forbid] of need) {
    if (forbid ? re.test(s) : !re.test(s)) { console.error(`${p}: ${forbid ? "has" : "missing"} ${what}`); bad++; }
  }
  for (const m of s.matchAll(/(?:href|src|srcset)="(\/[^"#?]*)/g)) {
    let t = join(ROOT, m[1]);
    if (m[1].endsWith("/")) t = join(t, "index.html");
    if (!existsSync(t)) { console.error(`${p}: broken local link ${m[1]}`); bad++; }
  }
}
const headers = existsSync(join(ROOT, "_headers")) ? readFileSync(join(ROOT, "_headers"), "utf8") : "";
if (!/X-Robots-Tag: noindex/.test(headers)) { console.error("_headers: missing X-Robots-Tag"); bad++; }
for (const f of ["favicon.svg", "og.png"]) if (!existsSync(join(ROOT, f))) { console.error(`missing ${f}`); bad++; }

if (bad) { console.error(`${bad} problem(s)`); process.exit(1); }
console.log(`checked ${pages.length} pages: ok`);
