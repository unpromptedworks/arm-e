// Definitions. Each figure is one of the propositions' rules cut down to a
// few squares or a small divisor, worked from a fixed given. No random numbers.
(function () {
  const css = (n) => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
  const C = { ground: css("--ground"), ink: css("--ink"), quiet: css("--quiet"), mark: css("--mark"), g1: css("--g1"), g2: css("--g2"), g3: css("--g3") };
  const SHADE = [C.ground, C.g1, C.g2, C.g3];
  const FONT = '"Old Standard", "Times New Roman", serif';
  const fmt = (n) => n.toLocaleString("en-GB");

  // a canvas of w by h squares, each drawn s pixels wide
  function cells(id, w, h, s, colour) {
    const cv = document.getElementById(id);
    cv.width = w * s; cv.height = h * s;
    const g = cv.getContext("2d");
    g.fillStyle = C.ground; g.fillRect(0, 0, w * s, h * s);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const c = colour(x, y);
      if (c) { g.fillStyle = c; g.fillRect(x * s, y * s, s, s); }
    }
    return g;
  }
  // a canvas for lines and letters, drawn at twice its shown size
  function smooth(id, w, h) {
    const cv = document.getElementById(id);
    cv.classList.add("smooth");
    cv.width = w * 2; cv.height = h * 2;
    const g = cv.getContext("2d");
    g.scale(2, 2);
    g.fillStyle = C.ground; g.fillRect(0, 0, w, h);
    return g;
  }
  function grid(g, w, h, s, colour) {
    g.strokeStyle = colour; g.lineWidth = 1;
    for (let i = 0; i <= w; i++) { g.beginPath(); g.moveTo(i * s + 0.5, 0); g.lineTo(i * s + 0.5, h * s); g.stroke(); }
    for (let j = 0; j <= h; j++) { g.beginPath(); g.moveTo(0, j * s + 0.5); g.lineTo(w * s, j * s + 0.5); g.stroke(); }
  }

  // Fig. 1. The word "given" as the shades of Proposition II's ant.
  (function () {
    const word = "given", W = 300, H = 110, n = word.length, cw = W / n;
    const g = smooth("f1", W, H);
    for (let i = 0; i < n; i++) {
      const t = i / (n - 1), a = hex(C.ground), b = hex(C.ink);
      g.fillStyle = `rgb(${a.map((v, k) => Math.round(v + (b[k] - v) * t)).join(",")})`;
      g.fillRect(i * cw + 4, 8, cw - 8, 56);
      g.strokeStyle = C.ink; g.lineWidth = 1; g.strokeRect(i * cw + 4.5, 8.5, cw - 9, 55);
      g.fillStyle = C.ink; g.font = `italic 26px ${FONT}`; g.textAlign = "center";
      g.fillText(word[i], i * cw + cw / 2, 96);
      if ("aeiou".includes(word[i])) { g.fillStyle = C.mark; g.fillRect(i * cw + cw / 2 - 9, 101, 18, 2); }
    }
  })();

  // Fig. 2. A square and its four neighbours.
  (function () {
    const N = 7, s = 20, m = 3;
    const g = cells("f2", N, N, s, (x, y) => (x === m && y === m ? C.ink : Math.abs(x - m) + Math.abs(y - m) === 1 ? C.g2 : null));
    grid(g, N, N, s, C.g1);
  })();

  // The sandpile of Propositions I and VI, on a grid big enough for these few grains.
  const S = 25, M = 12, mid = M * S + M;
  function settle(h, od, toppled) {
    const st = [];
    for (let i = 0; i < h.length; i++) if (h[i] >= 4) st.push(i);
    while (st.length) {
      const i = st.pop();
      if (h[i] < 4) continue;
      const q = h[i] >> 2;
      h[i] -= 4 * q;
      if (od) od[i] += q;
      if (toppled) toppled.add(i);
      for (const j of [i - 1, i + 1, i - S, i + S]) { h[j] += q; if (h[j] >= 4) st.push(j); }
    }
  }
  const GRAINS = 484; // a grain whose avalanche takes part of the pile, not all of it
  const pile = new Int32Array(S * S);
  pile[mid] = GRAINS - 1; settle(pile);
  pile[mid] += 1;
  const aval = new Set(); settle(pile, null, aval);
  const day = new Date(Date.UTC(1970, 0, 1) + (GRAINS - 1) * 86400000);
  const dayName = day.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
  let r = 0;
  for (let i = 0; i < S * S; i++) if (pile[i]) r = Math.max(r, Math.abs((i % S) - M), Math.abs(((i / S) | 0) - M));
  const lo = M - r - 1, w = 2 * r + 3;
  let nz = 0; for (const v of pile) if (v) nz++;

  cells("f3", w, w, 12, (x, y) => SHADE[pile[(y + lo) * S + x + lo]]);
  document.getElementById("c3").innerHTML = `Fig. 3. The pile of ${fmt(GRAINS)} grains, which is the <a href="/pile/?d=${day.toISOString().slice(0, 10)}">pile of ${dayName}</a>. The darker a square, the more grains it holds, from none to three.`;

  cells("f5", w, w, 12, (x, y) => { const i = (y + lo) * S + x + lo; return aval.has(i) ? C.mark : SHADE[pile[i]]; });
  document.getElementById("c5").innerHTML = `Fig. 5. The avalanche of the ${fmt(GRAINS)}th grain, ${aval.size} squares, in blue, of the ${fmt(nz)} squares that hold grains. The day&rsquo;s blue in Proposition I is drawn the same way.`;

  // Fig. 6. The odometer of 468 grains laid on one square at once.
  const h = new Int32Array(S * S), od = new Int32Array(S * S);
  h[mid] = GRAINS; settle(h, od);
  const top = od[mid];
  let total = 0; for (const v of od) total += v;
  const ramp = (t) => {
    const a = hex(C.ground), b = hex(C.ink);
    return `rgb(${a.map((v, k) => Math.round(v + (b[k] - v) * Math.sqrt(t))).join(",")})`;
  };
  function hex(s) { const n = parseInt(s.replace("#", ""), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
  cells("f6", w, w, 12, (x, y) => { const v = od[(y + lo) * S + x + lo]; return v ? ramp(v / top) : null; });
  document.getElementById("c6").innerHTML = `Fig. 6. The odometer of the same ${fmt(GRAINS)} grains, laid on the middle square at once and toppled to rest: the middle square topples ${fmt(top)} times, and all the squares together ${fmt(total)}. The darker, the more often.`;

  // Fig. 4. Four grains on one square, and the square toppled.
  (function () {
    const s = 22, W = 3 * s * 2 + 40, H = 3 * s;
    const g = smooth("f4", W, H);
    const before = [0, 0, 0, 0, 4, 0, 0, 0, 0], after = [0, 1, 0, 1, 0, 1, 0, 1, 0];
    function draw(ox, v) {
      for (let k = 0; k < 9; k++) {
        const x = ox + (k % 3) * s, y = ((k / 3) | 0) * s;
        g.strokeStyle = C.g2; g.lineWidth = 1; g.strokeRect(x + 0.5, y + 0.5, s - 1, s - 1);
        g.fillStyle = v[k] >= 4 ? C.mark : C.ink;
        const pts = v[k] === 1 ? [[0.5, 0.5]] : [[0.3, 0.3], [0.7, 0.3], [0.3, 0.7], [0.7, 0.7]].slice(0, v[k]);
        for (const [px, py] of pts) { g.beginPath(); g.arc(x + px * s, y + py * s, 2.6, 0, 7); g.fill(); }
      }
    }
    draw(0, before);
    draw(3 * s + 40, after);
    g.strokeStyle = C.ink; g.lineWidth = 1;
    const ax = 3 * s + 8, ay = H / 2;
    g.beginPath(); g.moveTo(ax, ay); g.lineTo(ax + 24, ay); g.moveTo(ax + 19, ay - 4); g.lineTo(ax + 24, ay); g.lineTo(ax + 19, ay + 4); g.stroke();
  })();

  // Fig. 7. Langton's ant, the rule "la" of Proposition II, for a few hundred steps.
  (function () {
    const N = 61, STEPS = 500, sh = new Uint8Array(N * N);
    let x = 30, y = 30, d = 0; // 0 up, 1 right, 2 down, 3 left
    const turn = [1, -1]; // shade 0 is "l", a consonant: right; shade 1 is "a", a vowel: left
    let x0 = x, x1 = x, y0 = y, y1 = y;
    for (let t = 0; t < STEPS; t++) {
      const i = y * N + x;
      d = (d + turn[sh[i]] + 4) % 4;
      sh[i] ^= 1;
      x += [0, 1, 0, -1][d]; y += [-1, 0, 1, 0][d];
      x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y);
    }
    const side = Math.max(x1 - x0, y1 - y0) + 3;
    const ox = Math.round((x0 + x1) / 2 - side / 2), oy = Math.round((y0 + y1) / 2 - side / 2);
    cells("f7", side, side, 10, (i, j) => (ox + i === x && oy + j === y ? C.mark : sh[(oy + j) * N + ox + i] ? C.ink : null));
    document.getElementById("c7").innerHTML = `Fig. 7. Langton&rsquo;s ant, the rule of the word <a href="/word/?w=la"><i>la</i></a>, after ${STEPS} steps from a bare grid; the ant is the blue square.`;
  })();

  // Figs. 8 and 9. The middle-square rule of Proposition III.
  const ms = (x) => Math.floor((x * x) / 100) % 10000;
  function run(x) { const seen = new Map(), a = []; while (!seen.has(x)) { seen.set(x, a.length); a.push(x); x = ms(x); } return { a, tail: seen.get(x) }; }
  const pad = (v) => String(v).padStart(4, "0");
  (function () {
    const { a, tail } = run(1545), W = 300, H = 120, n = a.length;
    const g = smooth("f8", W, H);
    g.strokeStyle = C.g1; g.lineWidth = 1;
    g.beginPath(); g.moveTo(0, H - 6.5); g.lineTo(W, H - 6.5); g.stroke();
    for (let i = 0; i < n + 8; i++) {
      const v = i < n ? a[i] : a[tail + ((i - tail) % (n - tail))];
      g.fillStyle = i < tail ? C.mark : C.ink;
      if (i >= n) g.fillStyle = C.g2;
      g.beginPath(); g.arc(4 + (i * (W - 8)) / (n + 7), H - 6 - (v / 10000) * (H - 14), 1.8, 0, 7); g.fill();
    }
    document.getElementById("c8").innerHTML = `Fig. 8. The run of the minute <a href="/minute/?t=1545">15:45</a> under the middle-square rule of Proposition III, each number drawn by its height: ${tail} numbers in blue, then a round of ${n - tail}, in ink, which goes on in grey.`;
  })();
  (function () {
    const { a, tail } = run(1200), W = 220, H = 150;
    const g = smooth("f9", W, H);
    const round = a.slice(tail), k = round.length;
    const cx = 150, cy = 75, R = 50;
    const pos = [];
    for (let i = 0; i < tail; i++) pos.push([22, 32 + i * 86]);
    for (let j = 0; j < k; j++) { const t = Math.PI - (2 * Math.PI * j) / k; pos.push([cx + R * Math.cos(t), cy - R * Math.sin(t)]); }
    g.font = `18px ${FONT}`; g.textAlign = "center"; g.textBaseline = "middle";
    const arrow = (p, q, col) => {
      const dx = q[0] - p[0], dy = q[1] - p[1], L = Math.hypot(dx, dy), ux = dx / L, uy = dy / L, o = 22;
      const s = [p[0] + ux * o, p[1] + uy * o], e = [q[0] - ux * o, q[1] - uy * o];
      g.strokeStyle = col; g.lineWidth = 1;
      g.beginPath(); g.moveTo(...s); g.lineTo(...e);
      g.moveTo(e[0] - ux * 5 - uy * 3.5, e[1] - uy * 5 + ux * 3.5); g.lineTo(...e); g.lineTo(e[0] - ux * 5 + uy * 3.5, e[1] - uy * 5 - ux * 3.5);
      g.stroke();
    };
    for (let i = 0; i < a.length; i++) {
      const next = i + 1 < a.length ? i + 1 : tail;
      arrow(pos[i], pos[next], i < tail ? C.mark : C.ink);
    }
    a.forEach((v, i) => { g.fillStyle = i < tail ? C.mark : C.ink; g.fillText(pad(v), pos[i][0], pos[i][1]); });
    document.getElementById("c9").innerHTML = `Fig. 9. The run of <a href="/minute/?t=1200">12:00</a>: a tail of ${tail}, in blue, ${a.slice(0, tail).map(pad).join(" and ")}, and then the round of ${k}, ${round.map(pad).join(", ")}, in ink.`;
  })();

  // Fig. 10. The lattice of the multiplier 75, the Spectrum's, with the divisor 257.
  (function () {
    const D = 257, A = 75, W = 260;
    const g = smooth("f10", W, W);
    g.strokeStyle = C.g1; g.strokeRect(1.5, 1.5, W - 3, W - 3);
    g.fillStyle = C.ink;
    for (let x = 1; x < D; x++) { const y = (A * x) % D; g.beginPath(); g.arc(2 + (x / D) * (W - 4), W - 2 - (y / D) * (W - 4), 1.5, 0, 7); g.fill(); }
    // the shortest step, by Gauss's reduction, drawn from the point (1, 75)
    let p = [0, D], q = [1, A];
    const nn = (v) => v[0] * v[0] + v[1] * v[1];
    if (nn(p) < nn(q)) [p, q] = [q, p];
    for (;;) { const mu = Math.round((p[0] * q[0] + p[1] * q[1]) / nn(q)); p = [p[0] - mu * q[0], p[1] - mu * q[1]]; if (nn(p) >= nn(q)) break; [p, q] = [q, p]; }
    if (q[0] < 0) q = [-q[0], -q[1]];
    const x0 = 120, y0 = (A * x0) % D, X = (v) => 2 + (v / D) * (W - 4), Y = (v) => W - 2 - (v / D) * (W - 4);
    g.strokeStyle = C.mark; g.lineWidth = 2;
    g.beginPath(); g.moveTo(X(x0), Y(y0)); g.lineTo(X(x0 + q[0]), Y(y0 + q[1])); g.stroke();
    g.fillStyle = C.mark;
    for (const [u, v] of [[x0, y0], [x0 + q[0], y0 + q[1]]]) { g.beginPath(); g.arc(X(u), Y(v), 3, 0, 7); g.fill(); }
    document.getElementById("c10").innerHTML = `Fig. 10. The lattice of the multiplier <a href="/grain/?n=75">75</a> with the divisor 257: every number from 1 to 256 across, its successor up. The shortest step, in blue, goes ${q[0]} across and ${q[1]} up, from ${x0} to ${x0 + q[0]}.`;
  })();

  // Fig. 11. The walk of "I am not", words of one, two and three letters, at quarter turns.
  (function () {
    const words = ["I", "am", "not"], lens = words.map((w) => w.length);
    const pts = [[0, 0]]; let x = 0, y = 0, d = 0, readings = 0;
    do {
      for (const L of lens) { x += [0, 1, 0, -1][d] * L; y += [1, 0, -1, 0][d] * L; pts.push([x, y]); d = (d + 1) % 4; }
      readings++;
    } while (!(x === 0 && y === 0 && d === 0));
    const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]);
    const minx = Math.min(...xs), maxx = Math.max(...xs), miny = Math.min(...ys), maxy = Math.max(...ys);
    const W = 260, u = (W - 40) / Math.max(maxx - minx, maxy - miny);
    const ox = (W - (maxx - minx) * u) / 2, oy = (W - (maxy - miny) * u) / 2;
    const P = ([a, b]) => [ox + (a - minx) * u, W - oy - (b - miny) * u];
    const g = smooth("f11", W, W);
    g.strokeStyle = C.ink; g.lineWidth = 1.5; g.lineJoin = "round";
    g.beginPath(); g.moveTo(...P(pts[0])); for (const p of pts.slice(1)) g.lineTo(...P(p)); g.stroke();
    g.fillStyle = C.mark;
    for (let k = 0; k <= readings; k++) { const [a, b] = P(pts[k * lens.length]); g.beginPath(); g.arc(a, b, 3.5, 0, 7); g.fill(); }
    document.getElementById("c11").innerHTML = `Fig. 11. The walk of the sentence <a href="/sentence/?s=I+am+not"><i>I am not</i></a>, words of one, two and three letters, at quarter turns. It closes after ${readings} readings; the blue points are where each reading ends.`;
  })();

  // The index: every defined term, its definition, and the places that use it.
  (function () {
    const rows = [];
    for (const li of document.querySelectorAll("ol.defs > li")) {
      const n = li.id.slice(1);
      const used = [...li.querySelectorAll(".used a")].map((a) => a.outerHTML).join(", ");
      for (const t of li.querySelectorAll("dfn")) rows.push([t.textContent, n, used]);
    }
    rows.sort((a, b) => a[0].localeCompare(b[0], "en"));
    document.getElementById("index").innerHTML = rows.map(([t, n, u]) => `<tr><td><i>${t}</i></td><td class="r"><a href="#d${n}">${n}</a></td><td>${u}</td></tr>`).join("");
  })();
})();
