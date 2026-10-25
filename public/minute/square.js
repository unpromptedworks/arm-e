// Proposition III. Von Neumann's middle-square rule on four figures:
// square the number, write it in eight figures, keep the middle four.
// The seed is the reader's minute (15:47 is 1547). No random numbers.
(function () {
  const N = 10000;
  const next = (n) => Math.floor((n * n) / 100) % N;

  // For every number: how many steps before it enters a round (its tail),
  // and the smallest number on the round it enters (its end).
  const tail = new Int16Array(N).fill(-1);
  const end = new Int16Array(N);
  for (let s = 0; s < N; s++) {
    if (tail[s] >= 0) continue;
    const path = [], at = new Map();
    let x = s;
    while (tail[x] < 0 && !at.has(x)) { at.set(x, path.length); path.push(x); x = next(x); }
    let base, e;
    if (at.has(x)) { // a new round, found from this start
      const i = at.get(x), round = path.slice(i);
      e = Math.min(...round);
      for (const r of round) { tail[r] = 0; end[r] = e; }
      path.length = i; base = 0;
    } else { base = tail[x]; e = end[x]; }
    for (let j = path.length - 1; j >= 0; j--) { tail[path[j]] = ++base; end[path[j]] = e; }
  }
  const MINUTES = 1440;
  const minuteNo = (m) => Math.floor(m / 60) * 100 + (m % 60); // 0..1439 to 0000..2359
  let longest = 0;
  for (let m = 0; m < MINUTES; m++) longest = Math.max(longest, tail[minuteNo(m)]);

  function four(n) { return String(n).padStart(4, "0"); }
  function walk(s) { // the sequence until its first repetition
    const seq = [], seen = new Set();
    for (let x = s; !seen.has(x); x = next(x)) { seen.add(x); seq.push(x); }
    return seq;
  }
  function css(name) { return getComputedStyle(document.documentElement).getPropertyValue(name).trim(); }
  function words(n) {
    return ["no", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten"][n] || String(n);
  }

  const form = document.getElementById("given");
  const input = document.getElementById("minute");
  const dial = document.getElementById("dial");
  const chart = document.getElementById("chart");
  const caption = document.getElementById("caption");
  const caption2 = document.getElementById("caption2");
  const D = 1000, C = D / 2, R0 = 170, R1 = 440;
  dial.width = dial.height = D;
  const dctx = dial.getContext("2d");
  const CW = 1000, CH = 440;
  chart.width = CW; chart.height = CH;
  const cctx = chart.getContext("2d");
  let typed = false, job = 0, current = 0;

  function angle(m) { return (m / MINUTES) * 2 * Math.PI - Math.PI / 2; } // midnight at the top

  // Fig. 1: the day as a dial, one spoke per minute, as long as that minute wanders.
  function drawDial(s) {
    dctx.clearRect(0, 0, D, D);
    const ink = css("--ink"), grey = css("--g2"), quiet = css("--quiet"), mark = css("--mark");
    dctx.lineWidth = 1.1;
    for (let m = 0; m < MINUTES; m++) {
      const n = minuteNo(m), a = angle(m), r = R0 + ((R1 - R0) * tail[n]) / longest;
      dctx.strokeStyle = end[n] === 0 ? grey : ink;
      dctx.beginPath();
      dctx.moveTo(C + Math.cos(a) * R0, C + Math.sin(a) * R0);
      dctx.lineTo(C + Math.cos(a) * (r + 1), C + Math.sin(a) * (r + 1));
      dctx.stroke();
    }
    // hour marks and the inner circle
    dctx.strokeStyle = ink; dctx.lineWidth = 1;
    dctx.beginPath(); dctx.arc(C, C, R0 - 6, 0, 2 * Math.PI); dctx.stroke();
    dctx.fillStyle = quiet;
    dctx.font = "30px 'Old Standard', serif";
    dctx.textAlign = "center"; dctx.textBaseline = "middle";
    for (let h = 0; h < 24; h++) {
      const a = angle(h * 60);
      dctx.beginPath();
      dctx.moveTo(C + Math.cos(a) * (R0 - 6), C + Math.sin(a) * (R0 - 6));
      dctx.lineTo(C + Math.cos(a) * (R0 - (h % 6 ? 16 : 26)), C + Math.sin(a) * (R0 - (h % 6 ? 16 : 26)));
      dctx.stroke();
      if (h % 6 === 0) dctx.fillText(String(h), C + Math.cos(a) * (R0 - 48), C + Math.sin(a) * (R0 - 48));
    }
    // the given minute, if it is one
    if (s % 100 < 60 && s < 2400) {
      const m = Math.floor(s / 100) * 60 + (s % 100), a = angle(m), r = R0 + ((R1 - R0) * tail[s]) / longest;
      dctx.strokeStyle = mark; dctx.fillStyle = mark; dctx.lineWidth = 5;
      dctx.beginPath();
      dctx.moveTo(C + Math.cos(a) * R0, C + Math.sin(a) * R0);
      dctx.lineTo(C + Math.cos(a) * r, C + Math.sin(a) * r);
      dctx.stroke();
      dctx.beginPath(); dctx.arc(C + Math.cos(a) * (r + 14), C + Math.sin(a) * (r + 14), 8, 0, 2 * Math.PI); dctx.fill();
    }
  }

  // Fig. 2: the run itself, step by step, its height the number.
  function drawChart(seq, r, upto) {
    cctx.clearRect(0, 0, CW, CH);
    const ink = css("--ink"), grey = css("--g2"), mark = css("--mark"), quiet = css("--quiet");
    const round = seq.slice(r);
    const shown = seq.concat(round, round).slice(0, Math.max(seq.length + round.length * 2, 24));
    const L = 90, T = 24, W = CW - L - 24, H = CH - T - 66;
    const total = shown.length - 1;
    const X = (i) => L + (W * i) / Math.max(1, total), Y = (n) => T + H - (H * n) / 9999;
    cctx.strokeStyle = grey; cctx.lineWidth = 1;
    cctx.beginPath(); cctx.moveTo(L, T); cctx.lineTo(L, T + H); cctx.lineTo(L + W, T + H); cctx.stroke();
    cctx.fillStyle = quiet; cctx.font = "30px 'Old Standard', serif";
    cctx.textAlign = "right"; cctx.textBaseline = "middle";
    cctx.fillText("9999", L - 10, Y(9999)); cctx.fillText("0", L - 10, Y(0));
    cctx.textAlign = "center"; cctx.textBaseline = "top";
    cctx.fillText("step " + r + ", the round begins", Math.min(Math.max(X(r), L + 190), L + W - 190), T + H + 12);
    cctx.strokeStyle = grey; cctx.setLineDash([4, 6]);
    cctx.beginPath(); cctx.moveTo(X(r), T); cctx.lineTo(X(r), T + H); cctx.stroke(); cctx.setLineDash([]);
    const last = Math.min(upto, total);
    for (let i = 1; i <= last; i++) { // the run in blue, the repeating round in ink
      cctx.strokeStyle = i <= r ? mark : ink; cctx.lineWidth = 3;
      cctx.beginPath(); cctx.moveTo(X(i - 1), Y(shown[i - 1])); cctx.lineTo(X(i), Y(shown[i])); cctx.stroke();
    }
    for (let i = 0; i <= last; i++) {
      cctx.fillStyle = i < r ? mark : ink;
      cctx.beginPath(); cctx.arc(X(i), Y(shown[i]), 5, 0, 2 * Math.PI); cctx.fill();
    }
  }

  function asClock(n) { return n % 100 < 60 && n < 2400 ? four(n).slice(0, 2) + ":" + four(n).slice(2) : null; }
  function nowMinute() { const d = new Date(); return d.getHours() * 100 + d.getMinutes(); }
  function parse(s) {
    const d = s.replace(/[^0-9]/g, "");
    return d.length >= 1 && d.length <= 4 ? parseInt(d, 10) : null;
  }

  function show(s) {
    current = s;
    const seq = walk(s);
    const r = seq.indexOf(next(seq[seq.length - 1]));
    const round = seq.slice(r);
    const clock = asClock(s);
    input.value = clock || four(s);
    const named = clock ? "The minute " + clock + ", read as " + four(s) + "," : "The number " + four(s) + ", which is no minute,";
    const roundText = round.length === 1
      ? (round[0] === 0 ? "nought, and stays there" : four(round[0]) + ", which is its own successor")
      : "the round " + round.map(four).join(", ") + ", and back";
    const steps = r === 0 ? "is on its round already: it falls at once into " : "takes " + words(r) + " step" + (r === 1 ? "" : "s") + " to fall into ";
    caption.innerHTML = "Fig. 1. The 1,440 minutes of a day, midnight at the top. " +
      (clock ? "The given minute is the blue spoke." : "The given number is no minute and has no spoke.");
    caption2.innerHTML = "Fig. 2. " + named + " " + steps + roundText + ": " +
      seq.map(four).join(", ") + ", <b>" + four(next(seq[seq.length - 1])) + "</b> &hellip;";
    drawDial(s);
    const id = ++job;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const total = seq.length + round.length * 2 + 24;
    let i = reduce ? total : 0;
    function step() {
      if (id !== job) return;
      drawChart(seq, r, i);
      if (i < total) { i += 1; setTimeout(() => requestAnimationFrame(step), 30); }
    }
    step();
  }

  const q = new URLSearchParams(location.search).get("t");
  const given = q !== null ? parse(q) : null;
  if (given !== null) typed = true;
  document.fonts.ready.then(() => show(current));
  show(given !== null ? given : nowMinute());

  function choose(s) {
    typed = true;
    history.replaceState(null, "", "?t=" + four(s));
    show(s);
  }
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const s = parse(input.value);
    if (s === null) { caption2.textContent = "Give four figures, or a time such as 07:46."; return; }
    choose(s);
  });
  // a spoke of the dial can be chosen by pointing at it
  dial.addEventListener("click", (e) => {
    const b = dial.getBoundingClientRect();
    const x = ((e.clientX - b.left) / b.width) * D - C, y = ((e.clientY - b.top) / b.height) * D - C;
    if (Math.hypot(x, y) < R0 - 30) return;
    let a = Math.atan2(y, x) + Math.PI / 2;
    if (a < 0) a += 2 * Math.PI;
    const m = Math.round((a / (2 * Math.PI)) * MINUTES) % MINUTES;
    choose(minuteNo(m));
  });
  // until a reader gives a number, the figures follow the clock
  let last = nowMinute();
  setInterval(() => { const m = nowMinute(); if (!typed && m !== last) { last = m; show(m); } }, 1000);
  window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => show(current));
})();
