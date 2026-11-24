// Proposition VIII. A stick one unit tall stands upright on level ground at a
// given latitude. The tip of its shadow is traced through each day of the
// year, the sun's declination held at its value for that day. No random
// numbers; the only inputs are a latitude and a date.
(function () {
  const RAD = Math.PI / 180;
  const EPS_MAX = 23.44; // the obliquity, to the precision shown here

  // The sun's declination at noon UT of a date, in degrees, by the U.S. Naval
  // Observatory's approximate formula (accurate to about one minute of arc).
  function declination(date) {
    const D = date.getTime() / 86400000 + 2440587.5 - 2451545.0 + 0.5; // noon UT
    const g = (357.529 + 0.98560028 * D) * RAD;
    const q = 280.459 + 0.98564736 * D;
    const L = (q + 1.915 * Math.sin(g) + 0.020 * Math.sin(2 * g)) * RAD;
    const e = (23.439 - 0.00000036 * D) * RAD;
    return Math.asin(Math.sin(e) * Math.sin(L)) / RAD;
  }

  // The sun's direction (east, north, up) at hour angle H, declination d, latitude f; all degrees
  function sun(H, d, f) {
    H *= RAD; d *= RAD; f *= RAD;
    return [
      -Math.cos(d) * Math.sin(H),
      Math.cos(f) * Math.sin(d) - Math.sin(f) * Math.cos(d) * Math.cos(H),
      Math.sin(f) * Math.sin(d) + Math.cos(f) * Math.cos(d) * Math.cos(H),
    ];
  }
  // where the shadow of the tip (0, 0, 1) falls, or null if the sun is down
  function tip(H, d, f) {
    const s = sun(H, d, f);
    if (s[2] <= 1e-9) return null;
    return [-s[0] / s[2], -s[1] / s[2]];
  }
  // the kind of the day's curve
  function kind(d, f) {
    const a = Math.abs(f), b = Math.abs(d);
    if (a >= 89.995) return Math.abs(d) < 1e-6 ? "none-pole" : (d * f > 0 ? "circle" : "dark");
    if (Math.abs(d) < 1e-6) return "line";
    const s = a + b;
    if (Math.abs(s - 90) < 0.01) return d * f > 0 ? "parabola" : "dark";
    if (s < 90) return "hyperbola";
    return d * f > 0 ? "ellipse" : "dark";
  }

  if (typeof window === "undefined") { module.exports = { declination, tip, kind, fit }; return; }

  // ---- page ----
  const $ = (id) => document.getElementById(id);
  const css = (v) => getComputedStyle(document.documentElement).getPropertyValue(v).trim();
  const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const fmtDate = (t) => t.getUTCDate() + " " + MONTHS[t.getUTCMonth()] + " " + t.getUTCFullYear();
  const fmtLat = (f) => (Math.abs(f) % 1 ? Math.abs(f).toFixed(2).replace(/0$/, "") : Math.abs(f)) + "° " + (f > 0 ? "north" : f < 0 ? "south" : "");
  const deg = (x) => Math.abs(x).toFixed(1) + "°";

  function todayUTC() { const n = new Date(); return new Date(Date.UTC(n.getFullYear(), n.getMonth(), n.getDate())); }
  function parseDate(s) { const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s || ""); if (!m) return null; const t = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3])); return isNaN(t) ? null : t; }
  const iso = (t) => t.toISOString().slice(0, 10);

  // draw one plate: the curves for the given declinations, the hour lines, the stick
  function plate(cv, f, opts) {
    const dpr = Math.min(3, window.devicePixelRatio || 1);
    const W = Math.round((cv.clientWidth || 300) * dpr);
    cv.width = W; cv.height = W;
    const c = cv.getContext("2d");
    let R = opts.reach, cx = 0, cy = 0; // gnomon heights from centre to edge
    if (opts.fit) { // a closed path: centre the plate on it and fit it in
      const b = fit(opts.blue, f);
      cx = b.cx; cy = b.cy; R = b.R;
    }
    const k = W / (2 * R);
    const X = (p) => W / 2 + (p[0] - cx) * k, Y = (p) => W / 2 - (p[1] - cy) * k;
    c.fillStyle = css("--ground"); c.fillRect(0, 0, W, W);
    c.lineJoin = "round"; c.lineCap = "round";

    function curve(d, color, width) {
      c.strokeStyle = color; c.lineWidth = width * dpr;
      c.beginPath(); let pen = false;
      for (let H = -180; H <= 180.0001; H += 0.25) {
        const p = tip(H, d, f);
        if (!p || Math.abs(p[0]) > 4 * R || Math.abs(p[1]) > 4 * R) { pen = false; continue; }
        if (pen) c.lineTo(X(p), Y(p)); else c.moveTo(X(p), Y(p));
        pen = true;
      }
      c.stroke();
    }

    if (opts.hours) { // hour lines: the tip at each whole hour of solar time, all year
      c.strokeStyle = css("--g2"); c.lineWidth = 0.6 * dpr; c.setLineDash([3 * dpr, 4 * dpr]);
      for (let h = 0; h < 24; h++) {
        const H = (h - 12) * 15;
        c.beginPath(); let pen = false;
        for (let d = -EPS_MAX; d <= EPS_MAX + 1e-9; d += 0.25) {
          const p = tip(H, d, f);
          if (!p || Math.abs(p[0]) > 4 * R || Math.abs(p[1]) > 4 * R) { pen = false; continue; }
          if (pen) c.lineTo(X(p), Y(p)); else c.moveTo(X(p), Y(p));
          pen = true;
        }
        c.stroke();
      }
      c.setLineDash([]);
    }
    for (const d of opts.grey || []) curve(d, css("--g2"), 0.7);
    for (const d of opts.ink || []) curve(d, css("--ink"), 1.2);
    if (opts.blue != null) curve(opts.blue, css("--mark"), 2.4);
    // the foot of the stick
    c.fillStyle = css("--ink"); c.beginPath(); c.arc(X([0, 0]), Y([0, 0]), 2.6 * dpr, 0, 7); c.fill();
    if (opts.compass) {
      c.fillStyle = css("--quiet"); c.font = Math.round(11 * dpr) + 'px "Old Standard", serif';
      c.textAlign = "center"; c.textBaseline = "top"; c.fillText("north", W / 2, 4 * dpr);
      c.textBaseline = "bottom"; c.fillText("south", W / 2, W - 4 * dpr);
      c.textAlign = "left"; c.textBaseline = "middle"; c.fillText("west", 4 * dpr, W / 2);
      c.textAlign = "right"; c.fillText("east", W - 4 * dpr, W / 2);
    }
  }

  // the centre and half-width that hold a whole closed path, with a margin
  function fit(d, f) {
    let x0 = 0, x1 = 0, y0 = 0, y1 = 0;
    for (let H = -180; H <= 180; H += 0.5) {
      const p = tip(H, d, f); if (!p) continue;
      x0 = Math.min(x0, p[0]); x1 = Math.max(x1, p[0]); y0 = Math.min(y0, p[1]); y1 = Math.max(y1, p[1]);
    }
    const R = Math.ceil(Math.max(x1 - x0, y1 - y0) * 0.56 * 2) / 2;
    return { cx: (x0 + x1) / 2, cy: (y0 + y1) / 2, R: Math.max(R, 1) };
  }

  const KINDTXT = {
    line: "a straight line",
    hyperbola: "a hyperbola",
    parabola: "a parabola",
    ellipse: "an ellipse",
    circle: "a circle",
    dark: "nothing at all",
    "none-pole": "nothing but a point going round the horizon",
  };

  function render() {
    const f = +latIn.value, t = parseDate(dateIn.value);
    if (!isFinite(f) || f < -90 || f > 90 || !t) { $("caption").textContent = "Fig. 1. Give a latitude between 90° south (−90) and 90° north, and a date."; return; }
    const d = declination(t);
    const y0 = Date.UTC(t.getUTCFullYear(), 0, 1);
    const grey = [];
    for (let i = 0; i < 365; i += 7) grey.push(declination(new Date(y0 + i * 86400000)));
    const K = kind(d, f), a = Math.abs(f), b = Math.abs(d);
    const closed = K === "ellipse" || K === "circle";
    const across = closed ? 2 * fit(d, f).R : 8;
    plate($("fig1"), f, { reach: 4, fit: closed, hours: Math.abs(f) < 89.995, grey, ink: [0, EPS_MAX, -EPS_MAX], blue: d, compass: true });

    const place = "At " + (f === 0 ? "the equator" : "latitude " + fmtLat(f));
    let why;
    if (K === "hyperbola") why = "because " + deg(a) + " of latitude and " + deg(b) + " of the sun’s declination make " + deg(a + b) + ", less than a right angle: the sun rises and sets, and the shadow comes in from the far west and goes out to the far east.";
    else if (K === "ellipse") why = "because " + deg(a) + " of latitude and " + deg(b) + " of declination make " + deg(a + b) + ", more than a right angle, on the side of the sun: the sun does not set, and the shadow goes all the way round.";
    else if (K === "circle") why = "because at the pole the sun goes round at one height all day.";
    else if (K === "dark") why = "because the sun does not rise.";
    else if (K === "parabola") why = "because latitude and declination make exactly a right angle.";
    else why = "";
    $("caption").innerHTML = "Fig. 1. " + place + ", on " + fmtDate(t) + ", the sun’s declination is " + deg(d) + " " + (d >= 0 ? "north" : "south") +
      ", and the tip of the shadow draws <b>" + KINDTXT[K] + "</b>" + (K === "dark" ? ", " : ", ") + why +
      " The grey curves are every seventh day of " + t.getUTCFullYear() + "; the black are the two solstices and the equinox" + (a < 89.995 ? "; the broken lines are the whole hours of solar time" : "") + ". The square is " + across + " times the stick’s height across" + (closed ? ", centred on the day’s path rather than on the foot." : ".");
    $("note").textContent = "";
    const u = new URL(location.href); u.searchParams.set("lat", String(f)); u.searchParams.set("d", iso(t));
    history.replaceState(null, "", u.pathname + u.search);
  }

  function fig2() {
    const box = $("fig2"); box.innerHTML = "";
    const lats = [0, 23.44, 51.48, 66.56, 78, 90];
    const names = ["the equator", "the Tropic of Cancer", "Greenwich", "the Arctic Circle", "Svalbard", "the North Pole"];
    const what = ["hyperbola", "hyperbola through the foot", "hyperbola", "parabola", "ellipse", "circle"];
    lats.forEach((f, i) => {
      const a = document.createElement("a"); a.className = "cell"; a.href = "?lat=" + f + "&d=" + new Date().getUTCFullYear() + "-06-21";
      a.innerHTML = '<canvas class="smooth" role="img" aria-label="The shadow at ' + names[i] + ' on the June solstice: a ' + what[i] + '."></canvas><span>' + names[i] + ", " + (f ? f + "°" : "0°") + "<br><i>" + what[i] + "</i></span>";
      box.appendChild(a);
      plate(a.querySelector("canvas"), f, { reach: 2.5, fit: f === 78, ink: [0], blue: EPS_MAX });
    });
  }

  const latIn = $("lat"), dateIn = $("date");
  const qs = new URLSearchParams(location.search);
  const ql = parseFloat(qs.get("lat"));
  latIn.value = isFinite(ql) && ql >= -90 && ql <= 90 ? String(ql) : "51.48";
  dateIn.value = iso(parseDate(qs.get("d")) || todayUTC());
  $("given").addEventListener("submit", (e) => { e.preventDefault(); render(); });
  dateIn.addEventListener("change", render);
  const here = $("here");
  if (navigator.geolocation) here.addEventListener("click", () => {
    $("note").textContent = "Asking the browser for its latitude; it is used on this page only and sent nowhere.";
    navigator.geolocation.getCurrentPosition(
      (p) => { latIn.value = (Math.round(p.coords.latitude * 100) / 100).toString(); render(); },
      () => { $("note").textContent = "The browser gave no latitude; type one instead."; });
  });
  else here.hidden = true;
  render(); fig2();
  let w = innerWidth; addEventListener("resize", () => { if (innerWidth !== w) { w = innerWidth; render(); fig2(); } });
  matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => { render(); fig2(); });
})();
