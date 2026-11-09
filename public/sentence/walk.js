// Proposition V. A sentence becomes a walk: each word is a step as long
// as its letters, and after each word the pen turns right through 1/m of
// a full turn. The sentence is read again and again until the pen stands
// where it began, facing the way it began, or is shown never to.
// No random numbers.
(function () {
  const DEFAULT = "To draw a straight line from any point to any point.";
  const DRIFT_READINGS = 4; // readings drawn of a walk that never closes

  function gcd(a, b) { return b ? gcd(b, a % b) : a; }

  // a word is anything between spaces; its length counts its letters and digits
  function lengthsOf(s) {
    return s.split(/\s+/).map((w) => w.replace(/[^\p{L}\p{N}]/gu, "").length).filter((n) => n > 0).slice(0, 60);
  }

  // the walk: points visited, the ends of readings, and how it ends
  function walk(L, m) {
    const k = L.length;
    const closes = k % m !== 0;
    const readings = closes ? m / gcd(k, m) : DRIFT_READINGS;
    const pts = [[0, 0]], ends = [[0, 0]];
    let x = 0, y = 0, h = 0;
    for (let r = 0; r < readings; r++) {
      for (const l of L) {
        const a = (2 * Math.PI * h) / m;
        x += l * Math.sin(a); y -= l * Math.cos(a);
        pts.push([x, y]);
        h = (h + 1) % m;
      }
      ends.push([x, y]);
    }
    // one reading's step: where the first reading ends
    const D = Math.hypot(ends[1][0], ends[1][1]);
    return { k, closes, readings, pts, ends, D, zero: D < 1e-9 };
  }

  function css(name) { return getComputedStyle(document.documentElement).getPropertyValue(name).trim(); }

  function draw(canvas, w, k, opts) {
    const dpr = Math.min(3, window.devicePixelRatio || 1);
    const side = Math.round(canvas.clientWidth * dpr) || opts.fallback;
    canvas.width = side; canvas.height = side;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = css("--ground"); ctx.fillRect(0, 0, side, side);
    let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
    for (const [x, y] of w.pts) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
    const span = Math.max(x1 - x0, y1 - y0, 1);
    const pad = side * 0.06;
    const s = (side - 2 * pad) / span;
    const ox = pad + (side - 2 * pad - (x1 - x0) * s) / 2 - x0 * s;
    const oy = pad + (side - 2 * pad - (y1 - y0) * s) / 2 - y0 * s;
    const P = ([x, y]) => [ox + x * s, oy + y * s];
    ctx.lineJoin = "round"; ctx.lineCap = "round";
    // later readings in grey, the first in ink, so the sentence itself can be traced
    const n = w.k;
    ctx.lineWidth = Math.max(1, opts.line * dpr);
    for (let pass = 1; pass >= 0; pass--) {
      ctx.strokeStyle = pass ? css("--g2") : css("--ink");
      ctx.beginPath();
      const from = pass ? n : 0, to = pass ? w.pts.length - 1 : n;
      ctx.moveTo(...P(w.pts[from]));
      for (let i = from + 1; i <= to; i++) ctx.lineTo(...P(w.pts[i]));
      if (to > from) ctx.stroke();
    }
    // the ends of the readings, joined in blue
    if (opts.ends && !w.zero) {
      ctx.strokeStyle = css("--mark"); ctx.lineWidth = Math.max(1, opts.line * 1.2 * dpr);
      ctx.setLineDash([5 * dpr, 4 * dpr]);
      ctx.beginPath(); ctx.moveTo(...P(w.ends[0]));
      for (let i = 1; i < w.ends.length; i++) ctx.lineTo(...P(w.ends[i]));
      ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = css("--mark");
      for (let i = 0; i < w.ends.length - (w.closes ? 1 : 0); i++) {
        ctx.beginPath(); ctx.arc(...P(w.ends[i]), (i ? 2.6 : 4) * dpr, 0, 2 * Math.PI); ctx.fill();
      }
    } else {
      ctx.fillStyle = css("--mark");
      ctx.beginPath(); ctx.arc(...P(w.pts[0]), (opts.ends ? 4 : 2.5) * dpr, 0, 2 * Math.PI); ctx.fill();
    }
  }

  const NUM = ["no", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve"];
  const num = (n) => (n < NUM.length ? NUM[n] : n.toLocaleString("en-GB"));
  const TURN = { 3: "a third", 4: "a quarter", 5: "a fifth", 6: "a sixth", 7: "a seventh", 8: "an eighth", 9: "a ninth", 10: "a tenth", 11: "an eleventh", 12: "a twelfth" };
  const fmt = (x) => (Math.abs(x - Math.round(x)) < 1e-9 ? Math.round(x).toLocaleString("en-GB") : x.toFixed(2));
  const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

  const form = document.getElementById("given");
  const input = document.getElementById("sentence");
  const turnSel = document.getElementById("turn");
  const canvas = document.getElementById("figure");
  const caption = document.getElementById("caption");
  const run = document.getElementById("run");
  const row = document.getElementById("row");

  function verdict(w, m) {
    if (w.closes) return "closes after " + num(w.readings) + (w.readings === 1 ? " reading" : " readings");
    return w.zero ? "closes after one reading" : "never closes";
  }

  function render() {
    let text = input.value.trim().slice(0, 400);
    let L = lengthsOf(text);
    if (!L.length) { text = DEFAULT; L = lengthsOf(text); }
    input.value = text;
    const m = +turnSel.value;
    const w = walk(L, m);
    draw(canvas, w, m, { line: 1.4, ends: true, fallback: 900 });
    run.innerHTML = "Words of <b>" + L.join(", ") + "</b> letters: " + num(w.k) + (w.k === 1 ? " word" : " words") +
      ", turning " + TURN[m] + " of a full turn after each.";
    let c = "Fig. 1. The walk of the sentence, turning " + TURN[m] + " right after each word. It <b>" + verdict(w, m) + "</b>";
    if (w.closes) {
      c += ": " + num(w.k) + " words of " + TURN[m] + " turn each come to " + w.k + "/" + m + " of a turn, and the pen faces the way it began only after " +
        num(w.readings) + ". The first reading is in ink, the rest in grey; the blue points, where each reading ends, stand at the corners of a" +
        (w.readings === 2 ? " line drawn twice, out and back." : " regular figure of " + num(w.readings) + " sides.");
    } else if (w.zero) {
      c += ": the words make a whole number of turns and the first reading already ends where it began.";
    } else {
      c += ": the words make a whole number of turns, so every reading starts facing the same way and moves the pen the same " + fmt(w.D) +
        (fmt(w.D) === "1" ? " unit" : " units") + " on. Four readings are drawn; the blue points march off in a straight line.";
    }
    caption.innerHTML = c;

    row.innerHTML = "";
    for (const mm of [3, 4, 5, 6, 7, 8]) {
      const ww = walk(L, mm);
      const fig = document.createElement("a");
      fig.href = "?" + new URLSearchParams(mm === 4 ? { s: text } : { s: text, m: mm });
      fig.className = mm === m ? "cell here" : "cell";
      fig.innerHTML = '<canvas class="smooth" role="img" aria-label="The sentence turning ' + TURN[mm] + ' at each word."></canvas><span>' +
        TURN[mm].replace(/^an? /, "") + "s: " + verdict(ww, mm).replace("closes after ", "closes in ").replace(/ readings?/, "") + "</span>";
      fig.addEventListener("click", (e) => { e.preventDefault(); turnSel.value = mm; render(); window.scrollTo({ top: 0, behavior: "smooth" }); });
      row.appendChild(fig);
      draw(fig.querySelector("canvas"), ww, mm, { line: 1, ends: false, fallback: 240 });
    }

    const url = new URL(location.href);
    if (text === DEFAULT) url.searchParams.delete("s"); else url.searchParams.set("s", text);
    if (m === 4) url.searchParams.delete("m"); else url.searchParams.set("m", m);
    history.replaceState(null, "", url);
  }

  const q = new URL(location.href).searchParams;
  input.value = q.get("s") || DEFAULT;
  const m0 = +q.get("m");
  turnSel.value = [...turnSel.options].some((o) => +o.value === m0) ? m0 : 4;
  form.addEventListener("submit", (e) => { e.preventDefault(); render(); });
  turnSel.addEventListener("change", render);
  matchMedia("(prefers-color-scheme: dark)").addEventListener("change", render);
  let rw = 0;
  addEventListener("resize", () => { if (canvas.clientWidth !== rw) { rw = canvas.clientWidth; render(); } });
  render();
})();
