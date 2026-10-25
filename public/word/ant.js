// Proposition II. A word becomes the rule of an ant on a square grid:
// each letter is one colour; on a vowel's colour the ant turns left,
// on a consonant's it turns right. No random numbers.
(function () {
  const SIZE = 257;
  const STEPS = 400000;
  const VOWELS = "aeiou";

  function ruleOf(word) {
    return [...word].map((ch) => (VOWELS.includes(ch) ? "L" : "R")).join("");
  }

  function clean(s) {
    return s.toLowerCase().normalize("NFD").replace(/[^a-z]/g, "").slice(0, 12);
  }

  function css(name) {
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  }
  function rgb(hex) {
    const n = parseInt(hex.replace("#", ""), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }

  const form = document.getElementById("given");
  const input = document.getElementById("word");
  const canvas = document.getElementById("figure");
  const caption = document.getElementById("caption");
  const key = document.getElementById("key");
  const VIEW = 600;
  canvas.width = VIEW; canvas.height = VIEW;
  const ctx = canvas.getContext("2d");
  const grid = document.createElement("canvas");
  grid.width = SIZE; grid.height = SIZE;
  const gctx = grid.getContext("2d");
  let job = 0;

  function run() {
    const word = clean(input.value) || "moon";
    input.value = word;
    const rule = ruleOf(word);
    const k = rule.length;
    const turn = [...rule].map((r) => (r === "L" ? 3 : 1)); // quarter turns clockwise
    const g = new Uint8Array(SIZE * SIZE);
    let x = SIZE >> 1, y = SIZE >> 1, dir = 0; // 0 north, 1 east, 2 south, 3 west
    const DX = [0, 1, 0, -1], DY = [-1, 0, 1, 0];

    // colours: state 0 is the ground, the rest step evenly toward ink
    const a = rgb(css("--ground")), b = rgb(css("--g3"));
    const pal = Array.from({ length: k }, (_, s) => a.map((v, i) => Math.round(v + (b[i] - v) * (s / Math.max(1, k - 1)))));
    const mark = rgb(css("--mark"));
    key.innerHTML = [...word].map((ch, s) =>
      '<span style="--sw: rgb(' + pal[s].join(",") + ')">' + ch + " " + (rule[s] === "L" ? "left" : "right") + "</span>").join("");

    const img = ctx.createImageData(SIZE, SIZE);
    for (let i = 0; i < SIZE * SIZE; i++) {
      img.data[i * 4] = a[0]; img.data[i * 4 + 1] = a[1]; img.data[i * 4 + 2] = a[2]; img.data[i * 4 + 3] = 255;
    }
    const id = ++job;
    let done = 0;
    let x0 = x, x1 = x, y0 = y, y1 = y;
    const paint = (i, c) => { const o = i * 4; img.data[o] = c[0]; img.data[o + 1] = c[1]; img.data[o + 2] = c[2]; };

    function frame() {
      if (id !== job) return;
      const until = Math.min(STEPS, done + 4000);
      for (; done < until; done++) {
        const i = y * SIZE + x;
        const s = g[i];
        dir = (dir + turn[s]) & 3;
        const t = (s + 1) % k;
        g[i] = t;
        paint(i, pal[t]);
        x = (x + DX[dir] + SIZE) % SIZE;
        y = (y + DY[dir] + SIZE) % SIZE;
        if (x < x0) x0 = x; else if (x > x1) x1 = x;
        if (y < y0) y0 = y; else if (y > y1) y1 = y;
      }
      const shown = new Uint8ClampedArray(img.data);
      const o = (y * SIZE + x) * 4;
      shown[o] = mark[0]; shown[o + 1] = mark[1]; shown[o + 2] = mark[2];
      gctx.putImageData(new ImageData(shown, SIZE, SIZE), 0, 0);
      // show the smallest square of grid holding everything the ant has reached
      const side = Math.min(SIZE, Math.max(17, x1 - x0 + 7, y1 - y0 + 7));
      const sx = Math.max(0, Math.min(SIZE - side, Math.round((x0 + x1 - side) / 2)));
      const sy = Math.max(0, Math.min(SIZE - side, Math.round((y0 + y1 - side) / 2)));
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(grid, sx, sy, side, side, 0, 0, VIEW, VIEW);
      caption.innerHTML = "Fig. 1. The ant of <b>" + word + "</b>, rule <b>" + rule + "</b>, after " +
        done.toLocaleString("en-GB") + " of " + STEPS.toLocaleString("en-GB") + " steps. The ant is the blue square.";
      if (done < STEPS) requestAnimationFrame(frame);
    }
    frame();
    const url = new URL(location.href);
    if (word === "moon") url.searchParams.delete("w"); else url.searchParams.set("w", word);
    history.replaceState(null, "", url);
  }

  input.value = new URL(location.href).searchParams.get("w") || "moon";
  form.addEventListener("submit", (e) => { e.preventDefault(); run(); });
  matchMedia("(prefers-color-scheme: dark)").addEventListener("change", run);
  run();
})();
