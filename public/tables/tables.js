// Tables. Every case of four of the book's rules, worked in the reader's
// browser, sorted, and the remarkable ones set out with links.
// The same code runs in Node to check the claims in the text. No random numbers.
(function () {
  const DAY = 86400000, EPOCH = Date.UTC(1970, 0, 1);
  const dayNo = (iso) => { const [y, m, d] = iso.split("-").map(Number); return Math.round((Date.UTC(y, m - 1, d) - EPOCH) / DAY) + 1; };
  const isoOf = (n) => new Date(EPOCH + (n - 1) * DAY).toISOString().slice(0, 10);
  const LAST = dayNo("2099-12-31");

  // Proposition I, every day at once: drop the grains one by one and count
  // the squares each day's grain topples.
  function pileRecord(last) {
    const size = 2 * Math.ceil(0.7 * Math.sqrt(last)) + 7;
    const h = new Uint32Array(size * size), c = (size >> 1) * size + (size >> 1);
    const mark = new Int32Array(size * size).fill(-1);
    const stack = new Int32Array(size * size * 4);
    const sizes = new Int32Array(last + 1);
    for (let n = 1; n <= last; n++) {
      h[c]++;
      let sp = 0, count = 0;
      stack[sp++] = c;
      while (sp) {
        const i = stack[--sp];
        if (h[i] < 4) continue;
        h[i] -= 4;
        if (mark[i] !== n) { mark[i] = n; count++; }
        for (const j of [i - 1, i + 1, i - size, i + size]) { h[j]++; if (h[j] >= 4) stack[sp++] = j; }
        if (h[i] >= 4) stack[sp++] = i;
      }
      sizes[n] = count;
    }
    return sizes;
  }

  // Proposition III: von Neumann's middle square on four figures; the tail is
  // the number of steps before a number repeats.
  function minuteTails() {
    const next = (n) => Math.floor((n * n) / 100) % 10000;
    const out = [];
    for (let m = 0; m < 1440; m++) {
      const s = Math.floor(m / 60) * 100 + (m % 60);
      const seq = [], seen = new Set();
      let x = s;
      while (!seen.has(x)) { seen.add(x); seq.push(x); x = next(x); }
      out.push({ s, steps: seq.indexOf(x), round: seq.length - seq.indexOf(x), end: Math.min(...seq.slice(seq.indexOf(x))) });
    }
    return out;
  }

  // Proposition IV: the shortest step of the lattice of x -> a x mod 65537.
  const M = 65537;
  function shortest(a) {
    let p = [0, M], q = [1, a % M];
    const n = (v) => v[0] * v[0] + v[1] * v[1];
    if (n(p) < n(q)) [p, q] = [q, p];
    for (;;) {
      const mu = Math.round((p[0] * q[0] + p[1] * q[1]) / n(q));
      p = [p[0] - mu * q[0], p[1] - mu * q[1]];
      if (n(p) >= n(q)) break;
      [p, q] = [q, p];
    }
    return Math.hypot(q[0], q[1]);
  }

  // Proposition II: the ant of a rule on the closed grid of 257, 400,000 steps.
  function ant(rule) {
    const SIZE = 257, k = rule.length, turn = [...rule].map((r) => (r === "L" ? 3 : 1));
    const g = new Uint8Array(SIZE * SIZE), DX = [0, 1, 0, -1], DY = [-1, 0, 1, 0];
    let x = SIZE >> 1, y = SIZE >> 1, dir = 0, x0 = x, x1 = x, y0 = y, y1 = y;
    for (let t = 0; t < 400000; t++) {
      const i = y * SIZE + x, s = g[i];
      dir = (dir + turn[s]) & 3;
      g[i] = (s + 1) % k;
      x = (x + DX[dir] + SIZE) % SIZE; y = (y + DY[dir] + SIZE) % SIZE;
      if (x < x0) x0 = x; else if (x > x1) x1 = x;
      if (y < y0) y0 = y; else if (y > y1) y1 = y;
    }
    let touched = 0;
    for (let i = 0; i < g.length; i++) if (g[i]) touched++;
    const across = Math.max(x1 - x0, y1 - y0) + 1;
    return { g, SIZE, k, across, touched };
  }
  const ANTS = ["moon", "tree", "aeon", "stop", "cats", "lava", "ciao", "la", "oak", "ago", "zoo"];
  const ruleOf = (w) => [...w].map((ch) => ("aeiou".includes(ch) ? "L" : "R")).join("");

  if (typeof document === "undefined") {
    module.exports = { dayNo, isoOf, LAST, pileRecord, minuteTails, shortest, ant, ANTS, ruleOf };
    return;
  }

  // ---- the page ----
  const css = (name) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  const num = (n) => n.toLocaleString("en-GB");
  const fmt = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
  const longDate = (n) => fmt.format(new Date(EPOCH + (n - 1) * DAY));
  const todayNo = dayNo(new Date().toISOString().slice(0, 10));
  const fill = (id, rows) => { document.getElementById(id).innerHTML = rows.join(""); };
  const say = (id, html) => { document.getElementById(id).innerHTML = html; };

  let sizes = null;
  function drawRecord() {
    const cv = document.getElementById("record");
    const W = 1200, H = 520, L = 20, R = 20, T = 20, B = 50;
    cv.width = W; cv.height = H;
    const ctx = cv.getContext("2d");
    const ink = css("--ink"), past = css("--g3"), future = css("--g2"), mark = css("--mark"), quiet = css("--quiet");
    ctx.clearRect(0, 0, W, H);
    let top = 0;
    for (let n = 1; n <= LAST; n++) top = Math.max(top, sizes[n]);
    const X = (n) => L + ((n - 1) / (LAST - 1)) * (W - L - R);
    const Y = (v) => H - B - (v / top) * (H - T - B);
    for (let n = 4; n <= LAST; n += 4) {
      ctx.fillStyle = n <= todayNo ? past : future;
      ctx.fillRect(Math.round(X(n)), Math.round(Y(sizes[n])) - 1, 1.6, 1.6);
    }
    // the records, a staircase
    ctx.strokeStyle = ink; ctx.lineWidth = 1.2; ctx.beginPath();
    let best = 0;
    ctx.moveTo(X(1), Y(0));
    for (let n = 1; n <= LAST; n++) if (sizes[n] > best) { ctx.lineTo(X(n), Y(best)); best = sizes[n]; ctx.lineTo(X(n), Y(best)); }
    ctx.lineTo(X(LAST), Y(best)); ctx.stroke();
    // today
    ctx.strokeStyle = mark; ctx.lineWidth = 2; ctx.beginPath();
    ctx.moveTo(X(todayNo), T); ctx.lineTo(X(todayNo), H - B); ctx.stroke();
    // years
    ctx.strokeStyle = ink; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(L, H - B + 0.5); ctx.lineTo(W - R, H - B + 0.5); ctx.stroke();
    ctx.fillStyle = quiet; ctx.font = "26px 'Old Standard', serif"; ctx.textBaseline = "top";
    for (const y of [1970, 2000, 2030, 2060, 2099]) {
      const x = X(dayNo(y + "-01-01"));
      ctx.textAlign = y === 1970 ? "left" : y === 2099 ? "right" : "center";
      ctx.fillRect(x, H - B, 1, 8);
      ctx.fillText(String(y), x, H - B + 14);
    }
  }

  function pileTables() {
    sizes = pileRecord(LAST);
    drawRecord();
    const upto = Math.min(todayNo, LAST);
    const big = [];
    for (let n = 1; n <= upto; n++) if (sizes[n]) big.push(n);
    big.sort((a, b) => sizes[b] - sizes[a]);
    fill("t1", big.slice(0, 10).map((n, i) =>
      '<tr><td class="r">' + (i + 1) + '</td><td><a href="/pile/?d=' + isoOf(n) + '">' + longDate(n) + '</a></td><td class="r">' + num(sizes[n]) + "</td></tr>"));
    let best = 0;
    for (let n = 1; n <= upto; n++) best = Math.max(best, sizes[n]);
    const come = [];
    let b = best;
    for (let n = upto + 1; n <= LAST && come.length < 8; n++) if (sizes[n] > b) { b = sizes[n]; come.push(n); }
    fill("t2", come.map((n) =>
      '<tr><td><a href="/pile/?d=' + isoOf(n) + '">' + longDate(n) + '</a></td><td class="r">' + num(n) + '</td><td class="r">' + num(sizes[n]) + "</td></tr>"));
    let quiet = 0;
    for (let n = 1; n <= upto; n++) if (!sizes[n]) quiet++;
    const t = sizes[upto];
    say("c1", "Fig. 1. Every fourth day&rsquo;s avalanche from 1970 to 2099, one dot for each such day, its height the squares toppled: grey after today, which is the blue line. The staircase in ink is the record. Of the " + num(upto) +
      " days to " + longDate(upto) + ", <b>" + num(quiet) + "</b> toppled nothing; today&rsquo;s grain, the " + num(upto) + "th, topples <b>" + num(t) + "</b>.");
  }

  function minuteTable() {
    const all = minuteTails().sort((a, b) => b.steps - a.steps || a.s - b.s);
    const hm = (s) => String(Math.floor(s / 100)).padStart(2, "0") + ":" + String(s % 100).padStart(2, "0");
    fill("t3", all.slice(0, 8).map((r, i) =>
      '<tr><td class="r">' + (i + 1) + '</td><td><a href="/minute/?t=' + String(r.s).padStart(4, "0") + '">' + hm(r.s) + '</a></td><td class="r">' + r.steps + "</td></tr>"));
  }

  function yearTable() {
    const ys = [];
    for (let y = 1970; y <= 2099; y++) ys.push({ y, len: shortest(y) });
    ys.sort((a, b) => b.len - a.len || a.y - b.y);
    const row = (r) => { const rank = ys.indexOf(r) + 1; return '<tr><td class="r">' + rank + '</td><td><a href="/grain/?n=' + r.y + '">' + r.y + '</a></td><td class="r">' + r.len.toFixed(1) + "</td></tr>"; };
    const now = new Date().getUTCFullYear();
    const shown = ys.slice(0, 5).concat(ys.slice(-3));
    const mine = ys.find((r) => r.y === now);
    fill("t4", ys.slice(0, 5).map(row).concat(['<tr class="gap"><td colspan="3">&hellip;</td></tr>'], ys.slice(-3).map(row)));
    if (mine) say("c4", "This year, " + now + ", has a shortest step of " + mine.len.toFixed(1) + " and ranks " + (ys.indexOf(mine) + 1) + " of 130" + (shown.includes(mine) ? "." : ", between the two ends of the table."));
  }

  function antTable() {
    const a = css("--ground"), b = css("--g3");
    const rgb = (hex) => { const n = parseInt(hex.replace("#", ""), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
    const ca = rgb(a), cb = rgb(b);
    const rows = ANTS.map((w) => ({ w, rule: ruleOf(w), r: ant(ruleOf(w)) }));
    rows.sort((p, q) => p.rule.length - q.rule.length || p.r.across - q.r.across);
    fill("t5", rows.map((o, i) => {
      const mirror = [...o.rule].map((c) => (c === "L" ? "R" : "L")).join("");
      return '<tr><td><canvas class="thumb" id="ant' + i + '" width="257" height="257"></canvas></td><td><a href="/word/?w=' + o.w + '"><i>' + o.w + "</i></a></td><td>" + o.rule + " <span class=\"quiet\">/ " + mirror + '</span></td><td class="r">' + (o.r.across >= 257 ? "all" : o.r.across) + '</td><td class="r">' + num(o.r.touched) + "</td></tr>";
    }));
    rows.forEach((o, i) => {
      const cv = document.getElementById("ant" + i), ctx = cv.getContext("2d");
      const img = ctx.createImageData(257, 257), k = o.r.k;
      for (let j = 0; j < o.r.g.length; j++) {
        const t = o.r.g[j] / Math.max(1, k - 1);
        img.data[j * 4] = ca[0] + (cb[0] - ca[0]) * t; img.data[j * 4 + 1] = ca[1] + (cb[1] - ca[1]) * t;
        img.data[j * 4 + 2] = ca[2] + (cb[2] - ca[2]) * t; img.data[j * 4 + 3] = 255;
      }
      ctx.putImageData(img, 0, 0);
    });
  }

  function all() {
    minuteTable(); yearTable(); antTable();
    setTimeout(pileTables, 30); // the heaviest, about a second; let the page paint first
  }
  all();
  document.fonts.ready.then(() => { if (sizes) drawRecord(); });
  matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => { antTable(); if (sizes) drawRecord(); });
})();
