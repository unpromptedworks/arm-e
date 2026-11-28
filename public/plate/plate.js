// The plate of the day. Three of the book's rules fed the same date:
// (a) the pile of days (Proposition I), (b) the ant of the weekday's name
// (Proposition II), (c) the middle-square run of the day and month read as
// four figures (Proposition III). No random numbers. The same script draws
// the home page's frontispiece, which is today's plate.
(function () {
  const DAY = 86400000;
  const EPOCH = Date.UTC(1970, 0, 1);
  const MIN = "1970-01-01", MAX = "2099-12-31";
  const WEEKDAYS = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
  const fmt = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
  const fmtMonth = new Intl.DateTimeFormat("en-GB", { month: "long", year: "numeric", timeZone: "UTC" });
  const num = (k) => k.toLocaleString("en-GB");
  const t = (iso) => { const [y, m, d] = iso.split("-").map(Number); return Date.UTC(y, m - 1, d); };
  const iso = (ms) => new Date(ms).toISOString().slice(0, 10);
  const named = (s) => fmt.format(new Date(t(s)));
  const today = () => iso(Date.now());
  const css = (name) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  const rgb = (hex) => { const n = parseInt(hex.replace("#", ""), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
  const mix = (a, b, k) => a.map((v, i) => Math.round(v * (1 - k) + b[i] * k));

  // ---- (a) the pile: as in Proposition I ----
  const grainsFor = (s) => Math.round((t(s) - EPOCH) / DAY) + 1;
  function settle(n, size) {
    size = size || 2 * Math.ceil(0.7 * Math.sqrt(n)) + 7;
    const h = new Uint32Array(size * size);
    const c = (size >> 1) * size + (size >> 1);
    h[c] = n;
    let stack = [c];
    while (stack.length) {
      const next = [];
      for (const i of stack) {
        const v = h[i];
        if (v < 4) continue;
        const q = v >> 2;
        h[i] = v & 3;
        for (const j of [i - 1, i + 1, i - size, i + size]) { h[j] += q; if (h[j] >= 4) next.push(j); }
      }
      stack = next;
    }
    return { h, size, c };
  }
  function drop(pile, mark) {
    const { h, size, c } = pile;
    const fell = mark ? new Uint8Array(size * size) : null;
    let count = 0;
    h[c] += 1;
    const stack = [c];
    while (stack.length) {
      const i = stack.pop();
      if (h[i] < 4) continue;
      h[i] -= 4;
      if (fell) { if (!fell[i]) { fell[i] = 1; count++; } } else count++;
      for (const j of [i - 1, i + 1, i - size, i + size]) { h[j] += 1; if (h[j] >= 4) stack.push(j); }
      if (h[i] >= 4) stack.push(i);
    }
    return { fell, count };
  }
  // The pile on day s, the squares its grain toppled, or on a quiet day the
  // squares the next avalanche will topple and how many days off it is.
  function pileOf(s) {
    const n = grainsFor(s);
    const pile = settle(n - 1);
    const today = n > 1 ? drop(pile, true) : { fell: null, count: 0 };
    if (n === 1) pile.h[pile.c] = 1;
    let soon = null, ahead = 0, soonCount = 0;
    if (!today.count) {
      const copy = { h: pile.h.slice(), size: pile.size, c: pile.c };
      let next = { count: 0 };
      while (!next.count && ahead < 4) { ahead++; next = drop(copy, true); }
      soon = next.fell; soonCount = next.count;
    }
    return { n, pile, fell: today.fell, count: today.count, soon, ahead, soonCount };
  }
  function drawPile(canvas, P) {
    const { h, size } = P.pile;
    let lo = size, hi = 0;
    for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) if (h[y * size + x]) { lo = Math.min(lo, x, y); hi = Math.max(hi, x, y); }
    lo = Math.max(0, lo - 2); hi = Math.min(size - 1, hi + 2);
    const w = hi - lo + 1;
    canvas.width = w; canvas.height = w;
    const ctx = canvas.getContext("2d");
    const img = ctx.createImageData(w, w);
    const shade = [css("--ground"), css("--g1"), css("--g2"), css("--g3")].map(rgb);
    const mark = rgb(css("--mark"));
    const { fell, soon } = P;
    let x0 = w, x1 = -1, y0 = w, y1 = -1;
    for (let y = 0; y < w; y++) for (let x = 0; x < w; x++) {
      const i = (y + lo) * size + (x + lo);
      let col = shade[h[i]];
      if (fell && fell[i]) col = mix(col, mark, [0.35, 0.55, 0.75, 1][h[i]]);
      else if (soon && soon[i]) {
        const edge = !(soon[i - 1] && soon[i + 1] && soon[i - size] && soon[i + size]);
        col = mix(col, mark, edge ? 1 : 0.12);
      }
      if ((fell && fell[i]) || (soon && soon[i])) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
      const o = (y * w + x) * 4;
      img.data[o] = col[0]; img.data[o + 1] = col[1]; img.data[o + 2] = col[2]; img.data[o + 3] = 255;
    }
    ctx.putImageData(img, 0, 0);
    // a small avalanche is a few pixels at this scale, so ring it
    const halo = el("halo");
    if (halo) {
      if (x1 < 0 || x1 - x0 > w / 8) halo.hidden = true;
      else {
        const cx = (x0 + x1 + 1) / 2 / w, cy = (y0 + y1 + 1) / 2 / w, r = Math.max((x1 - x0 + 1) / w, 0.05);
        halo.style.left = (cx - r) * 100 + "%"; halo.style.top = (cy - r) * 100 + "%";
        halo.style.width = halo.style.height = 2 * r * 100 + "%";
        halo.hidden = false;
      }
    }
    return w;
  }

  // ---- (b) the ant of the weekday's name: as in Proposition II ----
  const ruleOf = (word) => [...word].map((ch) => ("aeiou".includes(ch) ? "L" : "R")).join("");
  function drawAnt(canvas, word) {
    const SIZE = 257, STEPS = 400000, VIEW = 514;
    const rule = ruleOf(word), k = rule.length;
    const turn = [...rule].map((r) => (r === "L" ? 3 : 1));
    const g = new Uint8Array(SIZE * SIZE);
    let x = SIZE >> 1, y = SIZE >> 1, dir = 0, x0 = x, x1 = x, y0 = y, y1 = y;
    const DX = [0, 1, 0, -1], DY = [-1, 0, 1, 0];
    for (let i = 0; i < STEPS; i++) {
      const j = y * SIZE + x, s = g[j];
      dir = (dir + turn[s]) & 3;
      g[j] = (s + 1) % k;
      x = (x + DX[dir] + SIZE) % SIZE; y = (y + DY[dir] + SIZE) % SIZE;
      if (x < x0) x0 = x; else if (x > x1) x1 = x;
      if (y < y0) y0 = y; else if (y > y1) y1 = y;
    }
    const a = rgb(css("--ground")), b = rgb(css("--g3")), mark = rgb(css("--mark"));
    const pal = Array.from({ length: k }, (_, s) => mix(a, b, s / Math.max(1, k - 1)));
    const grid = document.createElement("canvas");
    grid.width = grid.height = SIZE;
    const gctx = grid.getContext("2d");
    const img = gctx.createImageData(SIZE, SIZE);
    for (let i = 0; i < SIZE * SIZE; i++) {
      const c = i === y * SIZE + x ? mark : pal[g[i]];
      img.data[i * 4] = c[0]; img.data[i * 4 + 1] = c[1]; img.data[i * 4 + 2] = c[2]; img.data[i * 4 + 3] = 255;
    }
    gctx.putImageData(img, 0, 0);
    const side = Math.min(SIZE, Math.max(17, x1 - x0 + 7, y1 - y0 + 7));
    const sx = Math.max(0, Math.min(SIZE - side, Math.round((x0 + x1 - side) / 2)));
    const sy = Math.max(0, Math.min(SIZE - side, Math.round((y0 + y1 - side) / 2)));
    canvas.width = canvas.height = VIEW;
    const ctx = canvas.getContext("2d");
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(grid, sx, sy, side, side, 0, 0, VIEW, VIEW);
    // a ring round the ant, which is one square
    const ax = ((x - sx + 0.5) / side) * VIEW, ay = ((y - sy + 0.5) / side) * VIEW;
    ctx.strokeStyle = css("--mark"); ctx.lineWidth = 8;
    ctx.beginPath(); ctx.arc(ax, ay, 34, 0, 2 * Math.PI); ctx.stroke();
    return rule;
  }

  // ---- (c) the middle-square run of the day and month: as in Proposition III ----
  const sq = (n) => Math.floor((n * n) / 100) % 10000;
  const four = (n) => String(n).padStart(4, "0");
  function runOf(start) {
    const seq = [], seen = new Map();
    for (let x = start; !seen.has(x); x = sq(x)) { seen.set(x, seq.length); seq.push(x); }
    return { seq, r: seen.get(sq(seq[seq.length - 1])) };
  }
  const ddmm = (s) => Number(s.slice(8, 10) + s.slice(5, 7));
  function drawRun(canvas, run) {
    const S = 514;
    canvas.width = canvas.height = S;
    const ctx = canvas.getContext("2d");
    const { seq, r } = run;
    const round = seq.slice(r);
    const shown = seq.concat(round, round, round).slice(0, Math.max(seq.length + round.length * 2, 16));
    const L = 26, T = 26, W = S - 2 * L, H = S - 2 * T;
    const X = (i) => L + (W * i) / Math.max(1, shown.length - 1), Y = (n) => T + H - (H * n) / 9999;
    ctx.strokeStyle = css("--g2"); ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(L, T); ctx.lineTo(L, T + H); ctx.lineTo(L + W, T + H); ctx.stroke();
    const ink = css("--ink"), mark = css("--mark");
    ctx.fillStyle = css("--quiet"); ctx.font = "22px 'Old Standard', serif";
    ctx.textAlign = "left"; ctx.textBaseline = "top";
    ctx.fillText("9999", L + 8, 4); ctx.textBaseline = "bottom"; ctx.fillText("0", L + 8, T + H - 4);
    for (let i = 1; i < shown.length; i++) {
      ctx.strokeStyle = i <= r ? mark : ink; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(X(i - 1), Y(shown[i - 1])); ctx.lineTo(X(i), Y(shown[i])); ctx.stroke();
    }
    for (let i = 0; i < shown.length; i++) {
      ctx.fillStyle = i < r ? mark : ink;
      ctx.beginPath(); ctx.arc(X(i), Y(shown[i]), i === 0 ? 9 : 5, 0, 2 * Math.PI); ctx.fill();
    }
  }

  // ---- when each panel comes back ----
  const weekdayOf = (s) => new Date(t(s)).getUTCDay();
  const sameAnt = (a, b) => ruleOf(WEEKDAYS[weekdayOf(a)]) === ruleOf(WEEKDAYS[weekdayOf(b)]);
  const sameRun = (a, b) => a.slice(5) === b.slice(5);
  function seek(s, k, test) { // the nearest day before (k = -1) or after (k = 1) passing test
    for (let m = t(s) + k * DAY; ; m += k * DAY) {
      const d = iso(m);
      if (d < MIN || d > MAX) return null;
      if (test(d)) return d;
    }
  }
  const short = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
  const link = (d, base) => d ? '<a href="' + base + "?d=" + d + '">' + short.format(new Date(t(d))) + "</a>" : "&mdash;";

  // ---- the page ----
  const home = !document.getElementById("given");
  const base = home ? "/plate/" : "";
  const input = document.getElementById("day");
  const el = (id) => document.getElementById(id);

  function render() {
    let s = home ? today() : input.value;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(s) || s < MIN || s > MAX) s = today();
    if (input) input.value = s;
    const P = pileOf(s);
    const w = drawPile(el("pa"), P);
    const word = WEEKDAYS[weekdayOf(s)];
    const rule = drawAnt(el("pb"), word);
    const start = ddmm(s), run = runOf(start);
    drawRun(el("pc"), run);
    const round = run.seq.slice(run.r);
    const roundText = round.length === 1 ? (round[0] === 0 ? "nought" : four(round[0]) + ", its own successor") : "a round of " + round.length;

    const avalanche = P.count
      ? "the day&rsquo;s grain toppled <b>" + num(P.count) + "</b> square" + (P.count === 1 ? "" : "s") + ", in blue"
      : "the day&rsquo;s grain toppled nothing; the avalanche " + (P.ahead === 1 ? "tomorrow" : "in " + ["", "", "two", "three"][P.ahead] + " days") +
        " will topple <b>" + num(P.soonCount) + "</b>, outlined in blue";
    el("ca").innerHTML = "(a) The pile of " + num(P.n) + " grains: " + avalanche + ".";
    el("cb").innerHTML = "(b) The ant of <b>" + word + "</b>, rule " + rule + ", ringed in blue.";
    el("cc").innerHTML = "(c) " + four(start) + ", squared and cut: " + (run.r ? run.r + " steps, in blue, then " : "at once ") + roundText + ".";
    el("caption").innerHTML = (home ? "Frontispiece. The plate of " : "Plate. ") + named(s) +
      (home ? ", the same for every reader today. It changes at midnight, Greenwich time. <a href=\"/plate/\">How it is made, and every other day&rsquo;s.</a>" : ".");

    if (home) return;
    el("pa-link").href = "/pile/?d=" + s;
    el("pb-link").href = "/word/?w=" + word;
    el("pc-link").href = "/minute/?t=" + four(start);

    // when the panels were last seen and will next be seen
    const antPrev = seek(s, -1, (d) => sameAnt(d, s)), antNext = seek(s, 1, (d) => sameAnt(d, s));
    const runPrev = seek(s, -1, (d) => sameRun(d, s)), runNext = seek(s, 1, (d) => sameRun(d, s));
    const bothPrev = seek(s, -1, (d) => sameRun(d, s) && sameAnt(d, s)), bothNext = seek(s, 1, (d) => sameRun(d, s) && sameAnt(d, s));
    el("again").innerHTML = [
      ["(a) the pile", "never before", "never again"],
      ["(b) the ant", link(antPrev, ""), link(antNext, "")],
      ["(c) the run", link(runPrev, ""), link(runNext, "")],
      ["(b) and (c) together", link(bothPrev, ""), link(bothNext, "")],
    ].map((r) => "<tr><td>" + r[0] + "</td><td>" + r[1] + "</td><td>" + r[2] + "</td></tr>").join("");
    const twin = word === "sunday" || word === "monday";
    el("twin").innerHTML = twin
      ? "Today&rsquo;s ant is one of the two that share a rule: <i>sunday</i> and <i>monday</i> both read RLRRLR, so (b) comes back the next or the previous day, not a week later."
      : "Today&rsquo;s ant, " + rule + ", belongs to " + word + " alone, so (b) comes back a week later.";
    el("prev").onclick = () => go(iso(t(s) - DAY));
    el("next").onclick = () => go(iso(t(s) + DAY));
    month(s);
    const url = new URL(location.href);
    if (s === today()) url.searchParams.delete("d"); else url.searchParams.set("d", s);
    history.replaceState(null, "", url);
  }

  // The index: every plate of the given day's month, past or to come,
  // with the size of each day's avalanche, counted grain by grain.
  function month(s) {
    const [y, m] = s.split("-").map(Number);
    const first = Date.UTC(y, m - 1, 1), last = Date.UTC(y, m, 0);
    const d0 = iso(Math.max(first, t(MIN))), d1 = iso(Math.min(last, t(MAX)));
    const pile = settle(grainsFor(d0) - 1, 2 * Math.ceil(0.7 * Math.sqrt(grainsFor(d1))) + 9);
    const rows = [];
    let biggest = 0;
    for (let ms = t(d0); ms <= t(d1); ms += DAY) {
      const d = iso(ms);
      const c = grainsFor(d) === 1 ? 0 : drop(pile, true).count;
      if (grainsFor(d) === 1) pile.h[pile.c] = 1;
      biggest = Math.max(biggest, c);
      rows.push({ d, c });
    }
    const now = today();
    el("month-name").textContent = fmtMonth.format(new Date(first));
    el("month").innerHTML = rows.map(({ d, c }) => {
      const wd = WEEKDAYS[weekdayOf(d)];
      const bar = c ? '<span class="bar" style="width:' + Math.max(2, (100 * c) / biggest).toFixed(1) + '%"></span>' : "";
      const tag = d === now ? " (today)" : "";
      return "<tr" + (d === s ? ' class="here"' : "") + '><td><a href="?d=' + d + '">' + Number(d.slice(8)) + "</a>" + tag + "</td><td>" +
        wd[0].toUpperCase() + wd.slice(1, 3) + '</td><td class="r">' + four(ddmm(d)) + '</td><td class="r">' + (c ? num(c) : "&middot;") +
        '</td><td class="barcell">' + bar + "</td></tr>";
    }).join("");
    const prevM = iso(first - DAY).slice(0, 8) + "01", nextM = iso(last + DAY);
    el("month-prev").innerHTML = prevM >= MIN.slice(0, 8) + "01" && first > t(MIN) ? '<a href="?d=' + prevM + '">&larr; ' + fmtMonth.format(new Date(t(prevM))) + "</a>" : "";
    el("month-next").innerHTML = nextM <= MAX ? '<a href="?d=' + nextM + '">' + fmtMonth.format(new Date(t(nextM))) + " &rarr;</a>" : "";
  }

  function go(d) { input.value = d; render(); }
  if (!home) {
    input.min = MIN; input.max = MAX;
    input.value = new URL(location.href).searchParams.get("d") || today();
    el("given").addEventListener("submit", (e) => { e.preventDefault(); render(); });
    input.addEventListener("change", render);
  }
  matchMedia("(prefers-color-scheme: dark)").addEventListener("change", render);
  render();
  // the home page's plate turns over at midnight, Greenwich time
  if (home) { let shown = today(); setInterval(() => { if (today() !== shown) { shown = today(); render(); } }, 60000); }
})();
