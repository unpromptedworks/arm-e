// Proposition I. One grain of sand for every day since 1 January 1970,
// all dropped on one square, toppled until it rests. No random numbers.
(function () {
  const DAY = 86400000;
  const EPOCH = Date.UTC(1970, 0, 1);

  function grainsFor(iso) {
    const [y, m, d] = iso.split("-").map(Number);
    return Math.round((Date.UTC(y, m - 1, d) - EPOCH) / DAY) + 1;
  }

  // Stabilize n grains on one square. A square holding four or more grains
  // gives one to each neighbour; by Dhar's abelian property the order of
  // topplings does not change the result.
  function settle(n) {
    const size = 2 * Math.ceil(0.7 * Math.sqrt(n)) + 7;
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
        for (const j of [i - 1, i + 1, i - size, i + size]) {
          h[j] += q;
          if (h[j] >= 4) next.push(j);
        }
      }
      stack = next;
    }
    return { h, size, c };
  }

  // Add one grain to a resting pile and record every square that topples.
  function drop(pile) {
    const { h, size, c } = pile;
    const fell = new Uint8Array(size * size);
    let count = 0;
    h[c] += 1;
    const stack = [c];
    while (stack.length) {
      const i = stack.pop();
      if (h[i] < 4) continue;
      h[i] -= 4;
      if (!fell[i]) { fell[i] = 1; count++; }
      for (const j of [i - 1, i + 1, i - size, i + size]) {
        h[j] += 1;
        if (h[j] >= 4) stack.push(j);
      }
      if (h[i] >= 4) stack.push(i);
    }
    return { fell, count };
  }

  function css(name) {
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  }

  function rgb(hex) {
    const n = parseInt(hex.replace("#", ""), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }

  function draw(canvas, pile, fell) {
    const { h, size } = pile;
    // crop to the occupied square
    let lo = size, hi = 0;
    for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
      if (h[y * size + x]) { lo = Math.min(lo, x, y); hi = Math.max(hi, x, y); }
    }
    lo = Math.max(0, lo - 2); hi = Math.min(size - 1, hi + 2);
    const w = hi - lo + 1;
    canvas.width = w; canvas.height = w;
    const ctx = canvas.getContext("2d");
    const img = ctx.createImageData(w, w);
    const shade = [css("--ground"), css("--g1"), css("--g2"), css("--g3")].map(rgb);
    const mark = rgb(css("--mark"));
    for (let y = 0; y < w; y++) for (let x = 0; x < w; x++) {
      const i = (y + lo) * size + (x + lo);
      let col = shade[h[i]];
      if (fell && fell[i]) {
        const t = [0.35, 0.55, 0.75, 1][h[i]];
        col = col.map((v, k) => Math.round(v * (1 - t) + mark[k] * t));
      }
      const o = (y * w + x) * 4;
      img.data[o] = col[0]; img.data[o + 1] = col[1]; img.data[o + 2] = col[2]; img.data[o + 3] = 255;
    }
    ctx.putImageData(img, 0, 0);
    return w;
  }

  const form = document.getElementById("given");
  const input = document.getElementById("day");
  const canvas = document.getElementById("figure");
  const caption = document.getElementById("caption");
  const fmt = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });

  function today() {
    return new Date().toISOString().slice(0, 10);
  }

  function render() {
    let iso = input.value;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(iso) || iso < input.min || iso > input.max) iso = today();
    input.value = iso;
    const n = grainsFor(iso);
    const pile = settle(n - 1);
    const { fell, count } = n > 1 ? drop(pile) : { fell: null, count: 0 };
    if (n === 1) pile.h[pile.c] = 1;
    const w = draw(canvas, pile, fell);
    const [y, m, d] = iso.split("-").map(Number);
    const when = fmt.format(new Date(Date.UTC(y, m - 1, d)));
    caption.innerHTML =
      "Fig. 1. The pile on " + when + ": <b>" + n.toLocaleString("en-GB") + "</b> grains, " +
      w + " squares across. The day’s grain toppled <b>" + count.toLocaleString("en-GB") +
      "</b> square" + (count === 1 ? "" : "s") + ", marked in blue.";
    const url = new URL(location.href);
    if (iso === today()) url.searchParams.delete("d"); else url.searchParams.set("d", iso);
    history.replaceState(null, "", url);
  }

  const asked = new URL(location.href).searchParams.get("d");
  input.max = "2099-12-31";
  input.value = asked || today();
  form.addEventListener("submit", (e) => { e.preventDefault(); render(); });
  input.addEventListener("change", render);
  document.getElementById("prev").addEventListener("click", () => step(-1));
  document.getElementById("next").addEventListener("click", () => step(1));
  function step(k) {
    const [y, m, d] = input.value.split("-").map(Number);
    input.value = new Date(Date.UTC(y, m - 1, d) + k * DAY).toISOString().slice(0, 10);
    render();
  }
  matchMedia("(prefers-color-scheme: dark)").addEventListener("change", render);
  render();
})();
