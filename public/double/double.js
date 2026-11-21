// Proposition VII. A fraction is doubled again and again, keeping only what
// lies after the point. The fraction itself, worked exactly, and the nearest
// double-precision number to it, worked by the reader's own machine, are
// drawn side by side as rows of binary digits. No random numbers.
(function () {
  const DEFAULT = "1/10";
  const MAXQ = 10000000;

  function gcd(a, b) { while (b) [a, b] = [b, a % b]; return a; }

  // "p/q", a decimal such as 0.1, or a whole number; returns [p, q] with 0 <= p < q, in lowest terms
  function parse(s) {
    s = s.replace(/\s+/g, "");
    let p, q, m;
    if ((m = s.match(/^(\d{1,9})\/(\d{1,9})$/))) { p = +m[1]; q = +m[2]; }
    else if ((m = s.match(/^(\d{0,9})\.(\d{1,7})$/))) { q = 10 ** m[2].length; p = +(m[1] || 0) * q + +m[2]; }
    else if ((m = s.match(/^\d{1,9}$/))) { p = +s; q = 1; }
    else return null;
    if (!q) return null;
    const whole = Math.floor(p / q);
    p = p % q;
    const g = gcd(p, q) || 1;
    p /= g; q /= g;
    if (q > MAXQ) return null;
    return { p, q, whole };
  }

  // the exact orbit: numerators of 2^n p mod q
  function exactDigits(p, q, n) {
    const d = new Uint8Array(n + 1); let a = p;
    for (let i = 1; i <= n; i++) { a *= 2; if (a >= q) { d[i] = 1; a -= q; } }
    return d; // d[i] is the i-th binary digit after the point
  }
  function exactValue(p, q, n) { // 2^n p/q mod 1
    let a = p; for (let i = 0; i < n; i++) { a *= 2; if (a >= q) a -= q; } return a / q;
  }
  function cycle(p, q) { // preperiod s and period t of the doubles of p/q
    let s = 0, r = q; while (r % 2 === 0) { r /= 2; s++; }
    if (r === 1) return { s, t: 0, r };
    let t = 1, a = 2 % r; while (a !== 1) { a = (a * 2) % r; t++; }
    return { s, t, r };
  }

  // the machine's number, read from its 64 bits: x = m / 2^k with m odd
  function machine(x) {
    const v = new DataView(new ArrayBuffer(8)); v.setFloat64(0, x);
    const hi = v.getUint32(0), lo = v.getUint32(4), e = (hi >>> 20) & 2047;
    let m = (BigInt(hi & 0xfffff) << 32n) | BigInt(lo);
    if (e) m |= 1n << 52n;
    let k = e ? 1075 - e : 1074;
    if (m === 0n) return { m, k: 0 };
    while ((m & 1n) === 0n) { m >>= 1n; k--; }
    return { m, k };
  }
  function machineDigits(mk, n) {
    const d = new Uint8Array(n + 1);
    for (let i = 1; i <= Math.min(n, mk.k); i++) d[i] = Number((mk.m >> BigInt(mk.k - i)) & 1n);
    return d;
  }

  function css(name) { return getComputedStyle(document.documentElement).getPropertyValue(name).trim(); }
  const fmt = (n) => n.toLocaleString("en-GB");
  const NUM = ["no", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve"];
  const num = (n) => (n < NUM.length ? NUM[n] : fmt(n));
  const frac = (a, b) => (b === 1 ? String(a) : fmt(a) + "/" + fmt(b));

  // Fig. 1: row n, column j is digit n + j; ink for 1, blank for 0.
  // In the machine's panel, digits past the first wrong one stand on grey, and wrong digits are blue.
  function plate(canvas, d, N, truth, first) {
    const dpr = Math.min(3, window.devicePixelRatio || 1);
    const side = Math.round(canvas.clientWidth * dpr) || 400;
    canvas.width = side; canvas.height = side;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = css("--ground"); ctx.fillRect(0, 0, side, side);
    const s = side / N, X = (j) => Math.round(j * s);
    const ink = css("--ink"), mark = css("--mark"), g1 = css("--g1");
    for (let n = 0; n < N; n++) for (let j = 1; j <= N; j++) {
      const i = n + j, x0 = X(j - 1), y0 = X(n), w = X(j) - x0, h = X(n + 1) - y0;
      let c = null;
      if (truth) {
        const wrong = d[i] !== truth[i];
        if (wrong) c = mark; else if (d[i]) c = ink; else if (first && i >= first) c = g1;
      } else if (d[i]) c = ink;
      if (c) { ctx.fillStyle = c; ctx.fillRect(x0, y0, w, h); }
    }
  }

  // Fig. 2: the value of each double, the fraction's in ink and the machine's in blue
  function chart(canvas, p, q, x, N) {
    const dpr = Math.min(3, window.devicePixelRatio || 1);
    const W = Math.round(canvas.clientWidth * dpr) || 900, H = Math.round(W * 0.42);
    canvas.width = W; canvas.height = H;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = css("--ground"); ctx.fillRect(0, 0, W, H);
    const padL = 34 * dpr, padR = 10 * dpr, padT = 10 * dpr, padB = 26 * dpr;
    const X = (n) => padL + (n / (N - 1)) * (W - padL - padR), Y = (v) => padT + (1 - v) * (H - padT - padB);
    ctx.strokeStyle = css("--g1"); ctx.lineWidth = dpr;
    for (const v of [0, 0.5, 1]) { ctx.beginPath(); ctx.moveTo(padL, Y(v)); ctx.lineTo(W - padR, Y(v)); ctx.stroke(); }
    ctx.fillStyle = css("--quiet"); ctx.font = 12 * dpr + 'px "Old Standard", serif';
    ctx.textAlign = "right"; ctx.textBaseline = "middle";
    ctx.fillText("1", padL - 6 * dpr, Y(1)); ctx.fillText("½", padL - 6 * dpr, Y(0.5)); ctx.fillText("0", padL - 6 * dpr, Y(0));
    ctx.textAlign = "center"; ctx.textBaseline = "top";
    for (let n = 0; n < N; n += 10) ctx.fillText(String(n), X(n), H - padB + 7 * dpr);
    let a = p, y = x;
    const r = 2.6 * dpr;
    for (let n = 0; n < N; n++) {
      ctx.fillStyle = css("--ink");
      ctx.beginPath(); ctx.arc(X(n), Y(a / q), r, 0, 2 * Math.PI); ctx.fill();
      ctx.strokeStyle = css("--mark"); ctx.lineWidth = 1.4 * dpr;
      ctx.beginPath(); ctx.arc(X(n), Y(y), r + 1.6 * dpr, 0, 2 * Math.PI); ctx.stroke();
      a *= 2; if (a >= q) a -= q;
      y = 2 * y; if (y >= 1) y -= 1; // exact in double precision: see the demonstration
    }
  }

  const form = document.getElementById("given");
  const input = document.getElementById("frac");
  const caption = document.getElementById("caption");
  const run = document.getElementById("run");
  const cTrue = document.getElementById("true"), cMach = document.getElementById("mach");
  const fig2 = document.getElementById("fig2c"), cap2 = document.getElementById("caption2");
  const note = document.getElementById("note");

  function render() {
    let g = parse(input.value);
    note.textContent = "";
    if (!g) {
      if (input.value.trim()) note.textContent = "Not read as a fraction with a denominator up to ten million; shown instead: 1/10.";
      input.value = DEFAULT; g = parse(DEFAULT);
    }
    const { p, q } = g;
    if (g.whole) note.textContent = "The whole part, " + fmt(g.whole) + ", is dropped at the first doubling; what is drawn is the part after the point, " + frac(p, q) + ".";
    const x = p / q, mk = machine(x), cy = cycle(p, q);
    const N = Math.max(64, mk.k + 8);
    const T = exactDigits(p, q, 2 * N + 1), M = machineDigits(mk, 2 * N + 1);
    let first = 0; for (let i = 1; i <= 2 * N; i++) if (T[i] !== M[i]) { first = i; break; }
    plate(cTrue, T, N, null, 0);
    plate(cMach, M, N, T, first);
    chart(fig2, p, q, x, N);

    const name = frac(p, q);
    const held = mk.k === 0 ? "0" : fmt(mk.m) + "/2<sup>" + mk.k + "</sup>";
    let c = "Fig. 1. Row by row, " + name + " doubled, and its binary digits after the point. ";
    if (p === 0) c += "Nought doubles to nought: both panels are blank.";
    else if (cy.r === 1) c += "Its denominator is a power of two, so the machine holds it exactly, and <b>both come to nothing after " + num(cy.s) + (cy.s === 1 ? " doubling" : " doublings") + "</b>.";
    else {
      const ret = exactValue(p, q, cy.s);
      c += "<b>The fraction comes round to " + frac(Math.round(ret * cy.r), cy.r) + " every " + num(cy.t) + (cy.t === 1 ? " doubling" : " doublings") + ", for ever</b>" +
        (cy.s ? ", from the " + ordinal(cy.s) + " doubling on" : "") + ". The machine&rsquo;s " + name + " is " + held +
        ", which is wrong from the " + ordinal(first) + " digit; it is <b>nought after " + num(mk.k) + " doublings</b>. Its wrong digits are blue.";
    }
    caption.innerHTML = c;
    run.innerHTML = p === 0 || cy.r === 1 ? "" :
      "The machine makes no mistake in any doubling. Its one error is the first: it cannot hold " + name + ", and holds instead a fraction whose denominator is a power of two.";

    let d = -1; { let a = p, y = x; for (let n = 0; n < N; n++) { if (Math.abs(a / q - y) > 0.02) { d = n; break; } a *= 2; if (a >= q) a -= q; y = 2 * y; if (y >= 1) y -= 1; } }
    cap2.innerHTML = "Fig. 2. The value of each double of " + name + ", from nought to one: the fraction&rsquo;s as ink dots, the machine&rsquo;s as blue rings." +
      (d < 0 ? " They never part." : d < mk.k ? " They part at the " + ordinal(d) + " doubling, the machine wanders for " + num(mk.k - d) + " more, and rests at nought from the " + ordinal(mk.k) + "." :
        " They agree to the eye until the machine drops to nought at the " + ordinal(mk.k) + " doubling.");

    const url = new URL(location.href);
    if (input.value.trim() === DEFAULT) url.searchParams.delete("f"); else url.searchParams.set("f", input.value.trim());
    history.replaceState(null, "", url);
  }

  function ordinal(n) {
    const w = ["zeroth", "first", "second", "third", "fourth", "fifth", "sixth", "seventh", "eighth", "ninth", "tenth", "eleventh", "twelfth"];
    if (n < w.length) return w[n];
    const t = n % 100, u = n % 10;
    return fmt(n) + (t >= 11 && t <= 13 ? "th" : u === 1 ? "st" : u === 2 ? "nd" : u === 3 ? "rd" : "th");
  }

  const q0 = new URL(location.href).searchParams.get("f");
  input.value = q0 || DEFAULT;
  form.addEventListener("submit", (e) => { e.preventDefault(); render(); });
  matchMedia("(prefers-color-scheme: dark)").addEventListener("change", render);
  let rw = 0;
  addEventListener("resize", () => { if (cTrue.clientWidth !== rw) { rw = cTrue.clientWidth; render(); } });
  render();
})();
