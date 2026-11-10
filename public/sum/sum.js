// Proposition VI. Two piles of Proposition I laid one on the other and
// toppled to rest. They rest as the pile of the day whose count of grains
// is the sum of theirs. No random numbers.
(function () {
  const DAY = 86400000;
  const EPOCH = Date.UTC(1970, 0, 1);
  const MAX = "2099-12-31";

  function grainsFor(iso) {
    const [y, m, d] = iso.split("-").map(Number);
    return Math.round((Date.UTC(y, m - 1, d) - EPOCH) / DAY) + 1;
  }
  function isoFor(n) { return new Date(EPOCH + (n - 1) * DAY).toISOString().slice(0, 10); }

  // n grains on the middle square of an S-by-S grid, toppled to rest the
  // quickest way. Returns the pile and its odometer: how many topplings.
  function settle(n, S) {
    const h = new Int32Array(S * S);
    const c = (S >> 1) * S + (S >> 1);
    h[c] = n;
    let stack = [c], t = 0;
    while (stack.length) {
      const next = [];
      for (const i of stack) {
        const v = h[i];
        if (v < 4) continue;
        const q = v >> 2;
        h[i] = v & 3;
        t += q;
        for (const j of [i - 1, i + 1, i - S, i + S]) {
          h[j] += q;
          if (h[j] >= 4) next.push(j);
        }
      }
      stack = next;
    }
    return { h, t };
  }

  // One round: every square holding four or more topples once, all together.
  function makeRelaxer(h, S) {
    const stamp = new Int32Array(S * S);
    let active = new Int32Array(S * S), na = 0, round = 0, topplings = 0;
    for (let i = 0; i < h.length; i++) if (h[i] >= 4) active[na++] = i;
    let spare = new Int32Array(S * S);
    return {
      get done() { return na === 0; },
      get round() { return round; },
      get topplings() { return topplings; },
      step() {
        round++;
        for (let k = 0; k < na; k++) h[active[k]] -= 4;
        topplings += na;
        for (let k = 0; k < na; k++) {
          const i = active[k];
          h[i - 1]++; h[i + 1]++; h[i - S]++; h[i + S]++;
        }
        let nb = 0;
        for (let k = 0; k < na; k++) {
          const i = active[k];
          for (const j of [i, i - 1, i + 1, i - S, i + S]) {
            if (h[j] >= 4 && stamp[j] !== round) { stamp[j] = round; spare[nb++] = j; }
          }
        }
        const t = active; active = spare; spare = t; na = nb;
      },
    };
  }

  function css(name) { return getComputedStyle(document.documentElement).getPropertyValue(name).trim(); }
  function rgb(hex) {
    const n = parseInt(hex.replace("#", ""), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }

  // Draw the window [lo, lo+w) of an S-grid. Squares holding four or more,
  // which must still topple, are blue, deeper for more grains.
  function draw(canvas, h, S, lo, w) {
    canvas.width = w; canvas.height = w;
    const ctx = canvas.getContext("2d");
    const img = ctx.createImageData(w, w);
    const shade = [css("--ground"), css("--g1"), css("--g2"), css("--g3")].map(rgb);
    const mark = rgb(css("--mark")), ground = shade[0];
    const over = [0.55, 0.8, 1].map((t) => ground.map((v, k) => Math.round(v * (1 - t) + mark[k] * t)));
    for (let y = 0; y < w; y++) for (let x = 0; x < w; x++) {
      const v = h[(y + lo) * S + (x + lo)];
      const col = v < 4 ? shade[v] : over[Math.min(v, 6) - 4];
      const o = (y * w + x) * 4;
      img.data[o] = col[0]; img.data[o + 1] = col[1]; img.data[o + 2] = col[2]; img.data[o + 3] = 255;
    }
    ctx.putImageData(img, 0, 0);
  }

  const $ = (id) => document.getElementById(id);
  const inA = $("dayA"), inB = $("dayB");
  const fmt = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
  const when = (iso) => fmt.format(new Date(iso + "T00:00:00Z"));
  const num = (k) => k.toLocaleString("en-GB");
  const link = (iso) => iso <= MAX ? "<a href=\"/pile/?d=" + iso + "\">" + when(iso) + "</a>" : when(iso);
  function today() { return new Date().toISOString().slice(0, 10); }
  function valid(iso, fallback) {
    return /^\d{4}-\d{2}-\d{2}$/.test(iso) && iso >= "1970-01-01" && iso <= MAX ? iso : fallback;
  }

  let job = 0, state = null;

  function render() {
    const a = valid(inA.value, "2000-01-01"), b = valid(inB.value, today());
    inA.value = a; inB.value = b;
    const na = grainsFor(a), nb = grainsFor(b), n = na + nb, sum = isoFor(n);
    const S = 2 * Math.ceil(0.7 * Math.sqrt(n)) + 11;
    const A = settle(na, S), B = settle(nb, S), C = settle(n, S);
    // crop every figure to the window of the largest pile, the sum's
    let lo = S;
    for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) if (C.h[y * S + x]) lo = Math.min(lo, x, y);
    lo = Math.max(0, lo - 2);
    const w = S - 2 * lo;
    const heap = new Int32Array(S * S);
    let unstable = 0, most = 0;
    for (let i = 0; i < heap.length; i++) {
      heap[i] = A.h[i] + B.h[i];
      if (heap[i] >= 4) unstable++;
      if (heap[i] > most) most = heap[i];
    }
    draw($("figA"), A.h, S, lo, w);
    draw($("figB"), B.h, S, lo, w);
    draw($("figH"), heap, S, lo, w);
    draw($("figC"), C.h, S, lo, w);
    $("capA").innerHTML = link(a) + "<br>" + num(na) + " grains";
    $("capB").innerHTML = link(b) + "<br>" + num(nb) + " grains";
    $("capH").innerHTML = "both at once<br>" + num(n) + " grains";
    $("cap1").innerHTML = "Fig. 1. The pile of " + when(a) + ", the pile of " + when(b) +
      ", and the two laid square on square. " + (unstable
        ? "<b>" + num(unstable) + "</b> squares of the heap hold four grains or more (as many as " + most + "), shown in blue; they must topple."
        : "No square of the heap holds four grains, so it is already at rest.");
    $("capC").innerHTML = "the pile of " + link(sum) + ", " + num(n) + " grains, built from one heap on the middle square";
    state = { a, b, na, nb, n, sum, S, lo, w, A, B, C, heap, unstable };
    const url = new URL(location.href);
    url.searchParams.set("a", a);
    if (b === today()) url.searchParams.delete("b"); else url.searchParams.set("b", b);
    history.replaceState(null, "", url);
    play();
  }

  // Fig. 2: topple the heap a round at a time beside the pile it must become.
  function play() {
    const my = ++job, s = state;
    const h = s.heap.slice();
    const r = makeRelaxer(h, s.S);
    const per = Math.max(1, Math.ceil(Math.sqrt(s.n) / 12));
    const cap = $("cap2");
    function frame() {
      if (my !== job) return;
      const t0 = performance.now();
      for (let k = 0; k < per && !r.done && performance.now() - t0 < 14; k++) r.step();
      draw($("figT"), h, s.S, s.lo, s.w);
      if (!r.done) {
        $("capT").innerHTML = "the heap toppling, round " + num(r.round) + "<br>" + num(r.topplings) + " topplings so far";
        cap.innerHTML = "Fig. 2. Every square holding four or more topples once in each round, all at the same time.";
        requestAnimationFrame(frame);
        return;
      }
      let differ = 0;
      for (let i = 0; i < h.length; i++) if (h[i] !== s.C.h[i]) differ++;
      $("capT").innerHTML = "the heap at rest after " + num(r.round) + " round" + (r.round === 1 ? "" : "s") +
        "<br>" + num(r.topplings) + " topplings";
      cap.innerHTML = "Fig. 2. " + (differ
        ? "The two piles differ in " + num(differ) + " squares." // never, by the demonstration
        : "The heap comes to rest as the pile of " + link(s.sum) + ", and the page has compared them: all " +
          num(s.w * s.w) + " squares agree.") +
        " Built alone, " + when(s.a) + " took <b>" + num(s.A.t) + "</b> topplings and " + when(s.b) +
        " <b>" + num(s.B.t) + "</b>; the heap took <b>" + num(r.topplings) + "</b>; and " + when(s.sum) +
        ", built from one heap, takes <b>" + num(s.C.t) + "</b>, which is their sum" +
        (s.A.t + s.B.t + r.topplings === s.C.t ? "" : " (it is not)") + ".";
    }
    requestAnimationFrame(frame);
  }

  const q = new URL(location.href).searchParams;
  inA.max = inB.max = MAX;
  inA.value = q.get("a") || "2000-01-01";
  inB.value = q.get("b") || today();
  $("given").addEventListener("submit", (e) => { e.preventDefault(); render(); });
  inA.addEventListener("change", render);
  inB.addEventListener("change", render);
  $("again").addEventListener("click", play);
  matchMedia("(prefers-color-scheme: dark)").addEventListener("change", render);
  render();
})();
