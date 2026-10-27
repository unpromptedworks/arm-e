// Proposition IV. The multiplicative rule x -> a x mod 65537, the one the
// ZX Spectrum's RND used with a = 75. The multiplier is the reader's number.
// Every pair (x, a x mod M) is a point of the lattice spanned by (1, a) and
// (0, M); Gauss's reduction finds its shortest step. No random numbers.
(function () {
  const M = 65537;

  // Gauss (Lagrange) reduction of the lattice spanned by (1, a) and (0, M).
  // Returns the shortest step s and a second step t, together a basis.
  function reduce(a) {
    let p = [0, M], q = [1, a];
    const n = (v) => v[0] * v[0] + v[1] * v[1];
    if (n(p) < n(q)) [p, q] = [q, p];
    for (;;) {
      const mu = Math.round((p[0] * q[0] + p[1] * q[1]) / n(q));
      p = [p[0] - mu * q[0], p[1] - mu * q[1]];
      if (n(p) >= n(q)) break;
      [p, q] = [q, p];
    }
    let s = q, t = p;
    if (s[0] < 0 || (s[0] === 0 && s[1] < 0)) s = [-s[0], -s[1]];
    return { s, t, len: Math.hypot(s[0], s[1]) };
  }
  // how many steps before a x mod M comes back to 1: the length of its run
  function order(a) {
    if (a === 0) return 0;
    let x = a, k = 1;
    while (x !== 1) { x = (x * a) % M; k++; }
    return k;
  }
  // the number of parallel lines, along the shortest step, that hold every point
  function lines(a, s) {
    const u = -s[1], v = s[0], seen = new Set();
    for (let x = 0; x < M; x++) seen.add(Math.round((u * x + v * ((x * a) % M)) / M));
    return seen.size;
  }

  // every multiplier from 2 to 65536, by the length of its shortest step
  const grain = new Float64Array(M);
  for (let a = 2; a < M; a++) grain[a] = reduce(a).len;
  const sorted = Array.from(grain.subarray(2)).sort((x, y) => x - y);
  function finer(len) { // how many multipliers have a shorter shortest step
    let lo = 0, hi = sorted.length;
    while (lo < hi) { const m = (lo + hi) >> 1; if (sorted[m] < len - 1e-9) lo = m + 1; else hi = m; }
    return lo;
  }

  if (typeof document === "undefined") { // for checking the corollaries in Node
    module.exports = { M, reduce, order, lines, grain, finer };
    return;
  }

  function css(name) { return getComputedStyle(document.documentElement).getPropertyValue(name).trim(); }
  function num(n) { return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ","); } // exact for any length

  const form = document.getElementById("given");
  const input = document.getElementById("number");
  const whole = document.getElementById("whole");
  const near = document.getElementById("near");
  const caption = document.getElementById("caption");
  const caption2 = document.getElementById("caption2");
  const S = 800;
  near.width = near.height = S;
  const wctx = whole.getContext("2d");
  const nctx = near.getContext("2d");
  let job = 0, current = "75";

  // Fig. 1: every pair the rule can give, laid down in the order the rule gives
  // them, starting from 1; then any starts its run never reaches. The canvas is
  // drawn at the screen's own pixels, each pixel as dark as the dots it holds,
  // so that the rows are not broken into a moire by scaling.
  function rgb(hex) {
    const h = hex.replace("#", "");
    return [0, 2, 4].map((i) => parseInt(h.length === 3 ? h[i / 2] + h[i / 2] : h.slice(i, i + 2), 16));
  }
  let S1 = 800, counts = null, img = null, done = 0, inkC, groundC;
  function startWhole() {
    const css1 = whole.getBoundingClientRect().width || 540;
    S1 = Math.max(200, Math.min(1600, Math.round(css1 * (window.devicePixelRatio || 1))));
    whole.width = whole.height = S1;
    counts = new Uint16Array(S1 * S1);
    img = wctx.createImageData(S1, S1);
    inkC = rgb(css("--ink")); groundC = rgb(css("--ground"));
    for (let p = 0; p < S1 * S1; p++) { img.data.set(groundC, p * 4); img.data[p * 4 + 3] = 255; }
    done = 0;
  }
  function drawWhole(upto) {
    const k = S1 / M, full = Math.max(1, (2 * M) / (S1 * S1) * 1.5);
    for (; done < upto && done < pairs.length; done += 2) {
      const p = (S1 - 1 - Math.floor(pairs[done + 1] * k)) * S1 + Math.floor(pairs[done] * k);
      const c = ++counts[p], f = Math.min(1, 0.55 + 0.45 * (c - 1) / full);
      for (let j = 0; j < 3; j++) img.data[p * 4 + j] = Math.round(groundC[j] + (inkC[j] - groundC[j]) * f);
    }
    wctx.putImageData(img, 0, 0);
  }
  let pairs = [];
  function makePairs(a) {
    const out = new Uint32Array(2 * M), seen = new Uint8Array(M);
    let j = 0;
    for (let start = 1; start < M; start++) {
      if (seen[start]) continue;
      let x = start;
      while (!seen[x]) { seen[x] = 1; const y = (x * a) % M; out[j++] = x; out[j++] = y; x = y; }
    }
    out[j++] = 0; out[j++] = 0;
    return out.subarray(0, j);
  }

  // Fig. 2: the middle of the square, magnified until the grain shows.
  function drawNear(a, r) {
    const ink = css("--ink"), grey = css("--g2"), mark = css("--mark"), ground = css("--ground");
    nctx.fillStyle = ground; nctx.fillRect(0, 0, S, S);
    const W = Math.min(M, Math.max(1400, Math.min(9 * (M / r.len), 22 * r.len))), c = M / 2;
    const x0 = c - W / 2, y0 = c - W / 2, k = S / W;
    const X = (x) => (x - x0) * k, Y = (y) => S - (y - y0) * k;
    // the lines along the shortest step that hold every point
    const [sx, sy] = r.s, L = Math.hypot(sx, sy);
    const nx = -sy / L, ny = sx / L, gap = M / L;
    nctx.strokeStyle = grey; nctx.lineWidth = 1;
    const proj = [[x0, y0], [x0 + W, y0], [x0, y0 + W], [x0 + W, y0 + W]].map(([x, y]) => (x * nx + y * ny) / gap);
    const d0 = Math.floor(Math.min(...proj)) - 1, d1 = Math.ceil(Math.max(...proj)) + 1;
    // the line through the corner of the square passes through every dot's row
    for (let d = d0; d <= d1; d++) {
      const px = nx * d * gap, py = ny * d * gap; // a point on this line
      nctx.beginPath();
      nctx.moveTo(X(px - sx / L * 2 * M), Y(py - sy / L * 2 * M));
      nctx.lineTo(X(px + sx / L * 2 * M), Y(py + sy / L * 2 * M));
      nctx.stroke();
    }
    // the points themselves
    const dot = Math.max(1.4, Math.min(6, 0.22 * L * k));
    nctx.fillStyle = ink;
    let best = null, bd = Infinity;
    for (let x = Math.max(0, Math.floor(x0)); x <= Math.min(M - 1, Math.ceil(x0 + W)); x++) {
      const y = (x * a) % M;
      if (y < y0 || y > y0 + W) continue;
      nctx.beginPath(); nctx.arc(X(x), Y(y), dot, 0, 2 * Math.PI); nctx.fill();
      const dd = (x - c) ** 2 + (y - c) ** 2;
      if (dd < bd) { bd = dd; best = [x, y]; }
    }
    // the two shortest steps, from the point nearest the middle
    if (best) {
      nctx.strokeStyle = mark; nctx.fillStyle = mark;
      [[r.s, []], [r.t, [14, 10]]].forEach(([v, dash]) => { // shortest solid, the next broken
        const ex = best[0] + v[0], ey = best[1] + v[1];
        nctx.lineWidth = 5; nctx.setLineDash(dash);
        nctx.beginPath(); nctx.moveTo(X(best[0]), Y(best[1])); nctx.lineTo(X(ex), Y(ey)); nctx.stroke();
        nctx.setLineDash([]);
        nctx.beginPath(); nctx.arc(X(ex), Y(ey), dot + 2, 0, 2 * Math.PI); nctx.fill();
      });
      nctx.beginPath(); nctx.arc(X(best[0]), Y(best[1]), dot + 3, 0, 2 * Math.PI); nctx.fill();
    }
    return W;
  }

  function parse(s) {
    const d = String(s).replace(/[\s,._']/g, "");
    return /^[0-9]{1,200}$/.test(d) ? d.replace(/^0+(?=.)/, "") : null;
  }
  function residue(d) { return Number(BigInt(d) % BigInt(M)); }

  function show(d) {
    current = d;
    input.value = d;
    const a = residue(d);
    const r = reduce(a);
    const run = order(a);
    const n = lines(a, r.s);
    const taken = String(a) === d ? "The multiplier " + num(a) : "The number " + (d.length > 24 ? d.slice(0, 20) + "&hellip;" : num(d)) + ", taken to its remainder " + num(a) + " on dividing by 65,537,";
    let runText;
    if (a === 0) runText = " sends every number to nought";
    else if (a === 1) runText = " leaves every number where it was";
    else runText = " comes back to where it started after " + num(run) + " step" + (run === 1 ? "" : "s") +
      (run === M - 1 ? ", the longest run there can be" : "");
    caption.innerHTML = "Fig. 1. " + taken + runText + ". Every pair it can give, a number across and its successor up, " +
      "lies on one of <b>" + num(n) + "</b> straight line" + (n === 1 ? "" : "s") + ".";
    pairs = makePairs(a);
    const W = drawNear(a, r), seen = (r.len * S) / W >= 12;
    const rank = a < 2 ? null : finer(r.len);
    caption2.innerHTML = "Fig. 2. The middle of the square, " + (W >= M ? "not magnified, for the grain is coarse already" : "magnified " + num(Math.round(M / W)) + " times") +
      ". The shortest step from one dot to the next, " + (seen ? "in solid blue" : "too short to see at this size") + ", is " + num(Math.abs(r.s[0])) + " across and " + num(Math.abs(r.s[1])) + (r.s[0] * r.s[1] < 0 ? " down" : " up") +
      ", " + r.len.toFixed(1) + " long; the next shortest is the broken blue stroke" +
      (rank === null ? "." : "; of the 65,535 multipliers from 2 to 65,536, " + (rank === 0 ? "none has a shorter" : num(rank) + (rank === 1 ? " has" : " have") + " a shorter shortest step, and so a coarser grain") + ".");
    const id = ++job;
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    startWhole();
    let i = still ? pairs.length : 0;
    const per = Math.ceil(pairs.length / 90);
    (function step() {
      if (id !== job) return;
      drawWhole(i);
      if (i < pairs.length) { i += per; requestAnimationFrame(step); }
    })();
  }

  const q = new URLSearchParams(location.search).get("n");
  const given = q !== null ? parse(q) : null;
  show(given !== null ? given : "75");

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const d = parse(input.value);
    if (d === null) { caption.textContent = "Give a whole number, in figures."; return; }
    history.replaceState(null, "", "?n=" + d);
    show(d);
  });
  window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => show(current));
  let wide = whole.getBoundingClientRect().width;
  window.addEventListener("resize", () => { const w = whole.getBoundingClientRect().width; if (Math.abs(w - wide) > 40) { wide = w; show(current); } });
})();
