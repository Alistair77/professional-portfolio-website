/* Menu-bar extras: music playback and a real network speed check. */

/* ---------- shared popover handling ---------- */
const pops = new Map(); // button -> popover

function place(btn, pop) {
  const r = btn.getBoundingClientRect();
  pop.hidden = false;
  pop.style.right = Math.max(8, innerWidth - r.right - 60) + "px";
}

function toggle(btn, pop) {
  const showing = !pop.hidden;
  for (const p of pops.values()) p.hidden = true;
  if (!showing) place(btn, pop);
}

function register(btn, pop) {
  if (!btn || !pop) return;
  pops.set(btn, pop);
  btn.addEventListener("click", (e) => { e.stopPropagation(); toggle(btn, pop); });
  pop.addEventListener("click", (e) => e.stopPropagation());
}

document.addEventListener("click", () => { for (const p of pops.values()) p.hidden = true; });
addEventListener("keydown", (e) => {
  if (e.key === "Escape") for (const p of pops.values()) p.hidden = true;
});

/* ---------- music ----------
   Streamed from the copies already published on the Cosmos portfolio (same
   origin), so this repo stays light and there's one place to swap tracks. */
const BASE = "https://alistair77.github.io/comos_Alistair_portfolio/uploads/";
const TRACKS = [
  { title: "Awesome Mix Vol. 1", file: "awesome-mix-1.mp3" },
  { title: "Awesome Mix Vol. 2", file: "awesome-mix-2.mp3" },
];

const playBtn = document.getElementById("play-btn");
const chev = document.getElementById("music-toggle");
const musicPop = document.getElementById("music-pop");
const vol = document.getElementById("vol");
const npTitle = document.getElementById("np-title");
const npSub = document.getElementById("np-sub");
const listEl = document.getElementById("tracklist");

let audio = null;
let index = 0;

function setPlayIcon(playing) {
  playBtn.querySelector(".ic-play").hidden = playing;
  playBtn.querySelector(".ic-pause").hidden = !playing;
  playBtn.setAttribute("aria-pressed", String(playing));
  playBtn.setAttribute("aria-label", playing ? "Pause music" : "Play music");
  playBtn.classList.toggle("is-playing", playing);
  paintList();
}

function paintList() {
  if (!listEl) return;
  const playing = audio && !audio.paused;
  listEl.innerHTML = TRACKS.map((t, i) =>
    `<button class="track${i === index ? " current" : ""}" data-i="${i}">
       <span class="track-dot">${i === index && playing ? "♪" : ""}</span>
       <span>${t.title}</span>
     </button>`).join("");
}

function describe() {
  const t = TRACKS[index];
  const playing = audio && !audio.paused;
  if (npTitle) npTitle.textContent = playing ? t.title : "Paused";
  if (npSub) npSub.textContent = playing ? "From the Cosmos portfolio" : t.title;
}

function ensureAudio() {
  if (audio) return audio;
  audio = new Audio(BASE + TRACKS[index].file);
  audio.loop = true;
  audio.volume = (vol?.value ?? 55) / 100;
  audio.addEventListener("play", () => { setPlayIcon(true); describe(); });
  audio.addEventListener("pause", () => { setPlayIcon(false); describe(); });
  audio.addEventListener("error", () => {
    setPlayIcon(false);
    if (npTitle) npTitle.textContent = "Track unavailable";
    if (npSub) npSub.textContent = "Could not load audio";
  });
  return audio;
}

async function playTrack(i) {
  index = i;
  const a = ensureAudio();
  a.src = BASE + TRACKS[index].file;
  try { await a.play(); } catch { setPlayIcon(false); }
  describe();
}

playBtn?.addEventListener("click", async (e) => {
  e.stopPropagation();
  const a = ensureAudio();
  if (a.paused) {
    try { await a.play(); } catch { setPlayIcon(false); }
  } else {
    a.pause();
  }
  describe();
});

/* the chevron is the "what's playing" toggle */
chev?.addEventListener("click", (e) => {
  e.stopPropagation();
  paintList();
  describe();
  toggle(chev, musicPop);
  chev.setAttribute("aria-expanded", String(!musicPop.hidden));
});
if (chev && musicPop) pops.set(chev, musicPop);

listEl?.addEventListener("click", (e) => {
  const b = e.target.closest(".track");
  if (b) playTrack(Number(b.dataset.i));
});

vol?.addEventListener("input", () => { if (audio) audio.volume = vol.value / 100; });

/* Ari can start the music on voice request ("play some music").
   Only starts — never pauses out from under the visitor. */
document.addEventListener("ari:toggle-music", () => {
  if (!audio || audio.paused) playBtn?.click();
});
paintList();

/* ---------- network ----------
   A real measurement of the visitor's own connection, done the way a speed
   test actually has to be done.

   It runs against Cloudflare's public speed-test edge (the endpoints
   speed.cloudflare.com itself uses), not against whatever served this page:
   timing the page's own host measures localhost in development and one CDN
   in production, and a static host cannot accept an upload at all. The edge
   sends Access-Control-Allow-Origin and Timing-Allow-Origin, so the browser
   exposes full Resource Timing for every request.

   The naive version (bytes / total fetch time) is wrong: the fetch window is
   dominated by DNS + TCP + TLS + time-to-first-byte. Measured on this site,
   TTFB was 71% of the window — reporting 1.5 Mbps while the bytes were moving
   at 5.4 Mbps, with five identical runs varying 3x.

   So: Resource Timing for the true transfer window, a warmed connection,
   parallel streams, escalation only while a sample is too quick to trust, and
   a hard cap on how much of the visitor's data this is allowed to spend.   */

const netBtn = document.getElementById("net-btn");
const netPop = document.getElementById("net-pop");
register(netBtn, netPop);

const EDGE = "https://speed.cloudflare.com";
const MIN_WINDOW_MS = 220;     // below this the sample is noise
/* Escalate only while a sample drains too fast to trust, so a slow link stops
   after the first step (~0.8 MB) and only a fast one spends the rest. Data
   Saver gets the first step alone. */
const DOWN_STEPS = [[3, 200_000], [4, 500_000], [4, 1_250_000]]; // [streams, bytes each]: 0.6, 2, 5 MB
const UP_STEPS = [300_000, 2_000_000];                           // one upload each; sent bytes cost data too
const LITE = !!navigator.connection?.saveData;
const steps = (list) => (LITE ? list.slice(0, 1) : list);
const REQ_TIMEOUT_MS = 8000;   // a hung request must not hang the panel
const STALE_AFTER_MS = 120_000;

const $ = (id) => document.getElementById(id);
const NET_FIGURES = ["net-ping", "net-speed", "net-up"];

let bust = 0;
let spent = 0;      // everything this run has cost the visitor, for display
let lastRun = 0;
let colo = "";      // which Cloudflare edge answered, e.g. "LHR"
const nonce = () => `r=${++bust}-${performance.now() | 0}`;
const down = (bytes) => `${EDGE}/__down?bytes=${bytes}&${nonce()}`;
const up = () => `${EDGE}/__up?${nonce()}`;

const timingFor = (href) => performance.getEntriesByName(href).pop() || null;

/* one request, drained, bounded by a timeout; resolves to its timing entry */
async function timed(u, init = {}) {
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), REQ_TIMEOUT_MS);
  try {
    const res = await fetch(u, { cache: "no-store", ...init, signal: ctl.signal });
    // An error page still has a size and a duration — a confident, completely
    // wrong reading — so anything but success is a failed sample.
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    await res.arrayBuffer(); // drain, or responseEnd is meaningless
    colo ||= res.headers.get("cf-meta-colo") || "";
    return timingFor(u);
  } finally {
    clearTimeout(timer);
  }
}

/* Latency: TTFB (responseStart - requestStart) is RTT plus server time, taken
   on an empty download. The minimum across a few tries is the closest thing
   to the true round trip — everything above the floor is jitter. The first
   try also warms DNS, TCP and TLS for everything after it. Sub-millisecond is
   valid on a fast link, so 0 must be accepted rather than treated as failure. */
async function measureLatency(tries = 3) {
  const seen = [];
  for (let i = 0; i < tries; i++) {
    try {
      const u = down(0);
      const started = performance.now();
      const t = await timed(u);
      if (t) spent += t.transferSize || 0;
      const ttfb = t && t.responseStart > 0
        ? t.responseStart - t.requestStart
        : performance.now() - started;
      if (Number.isFinite(ttfb) && ttfb >= 0) seen.push(ttfb);
    } catch { /* a failed try simply contributes no sample */ }
  }
  return seen.length ? Math.min(...seen) : null;
}

/* A sample is only trusted once it is long enough to mean something: past TCP
   slow start (eight round trips) and past Wi-Fi jitter (0.6s). Measured on a
   35/12 Mbps line, 0.3–0.8s samples scattered from 16 to 44 Mbps down and 8 to
   23 up across back-to-back runs; curl moving 10 MB read 34–36 every time. */
const TRUST_MS = 600;
const trustAfter = (rtt) => Math.max(TRUST_MS, 8 * rtt);

/* Download: parallel streams, timed from the first response byte to the last. */
async function measureDownload(trust) {
  let best = null;
  for (const [streams, bytes] of steps(DOWN_STEPS)) {
    const runs = (await Promise.all(Array.from({ length: streams }, () =>
      timed(down(bytes)).then((t) => t && {
        start: t.responseStart,
        end: t.responseEnd,
        // no-store on a unique URL cannot be a cache hit, so when a browser
        // withholds transferSize the requested size is what crossed the wire
        bytes: t.transferSize || t.encodedBodySize || bytes,
      }).catch(() => null)
    ))).filter((r) => r && r.bytes > 0 && r.start > 0);
    if (!runs.length) { if (best) break; continue; } // a bigger step stalled: keep the last reading

    const got = runs.reduce((n, r) => n + r.bytes, 0);
    spent += got;
    const windowMs = Math.max(...runs.map((r) => r.end)) - Math.min(...runs.map((r) => r.start));
    if (windowMs <= 0) continue;

    best = { mbps: (got * 8) / (windowMs / 1000) / 1e6, windowMs };
    if (windowMs >= trust) break;
  }
  return best;
}

/* random bytes, so nothing between here and the edge can compress them away */
function noise(n) {
  const b = new Uint8Array(n);
  for (let i = 0; i < n; i += 65_536) crypto.getRandomValues(b.subarray(i, i + 65_536));
  return b;
}

/* Upload: the edge reports, in Server-Timing, how long it spent receiving the
   body — the cleanest window there is. Without it, the body went out between
   requestStart and the first response byte, which also holds one round trip,
   so the measured latency is taken off. */
async function measureUpload(rtt, trust) {
  let best = null;
  for (const bytes of steps(UP_STEPS)) {
    try {
      const u = up();
      const started = performance.now();
      const t = await timed(u, { method: "POST", body: noise(bytes) });
      spent += bytes;
      const total = t && t.responseStart > 0
        ? t.responseStart - t.requestStart
        : performance.now() - started;
      const edge = t?.serverTiming?.find((s) => s.name === "cfSpeedWorker")?.duration;
      const windowMs = edge > 0 ? edge : total - (rtt || 0);
      if (!(windowMs > 0)) continue;
      best = { mbps: (bytes * 8) / (windowMs / 1000) / 1e6, windowMs };
      if (windowMs >= trust) break;
    } catch (err) {
      if (best) break; // a bigger step stalled: keep the last reading
      if (err && err.name === "AbortError") throw err; // nothing got through in time
    }
  }
  return best;
}

function clearFigures(status) {
  $("net-status").textContent = status;
  for (const id of NET_FIGURES) $(id).textContent = "—";
}

/* a figure, or a floor when the link drained the sample faster than a page can time */
function show(id, r) {
  if (!r) { $(id).textContent = "n/a"; return false; }
  const n = r.mbps < 10 ? r.mbps.toFixed(1) : Math.round(r.mbps);
  const floor = r.windowMs < MIN_WINDOW_MS;
  $(id).textContent = `${floor ? "≥ " : ""}${n} Mbps`;
  return floor;
}

async function runTest() {
  const btn = $("net-run");
  if (btn) { btn.disabled = true; btn.textContent = "Testing…"; }
  for (const id of NET_FIGURES) $(id).textContent = "…";
  $("net-note").textContent = "";
  spent = 0;
  colo = "";
  performance.clearResourceTimings();

  if (!navigator.onLine) {
    // onLine only proves a network interface exists, never that the internet is
    // reachable — so it is trusted for the negative case only.
    clearFigures("Offline");
    $("net-note").textContent = "No network connection";
    if (btn) { btn.disabled = false; btn.textContent = "Run test"; }
    return;
  }

  try {
    const rtt = await measureLatency();
    if (rtt == null) throw new Error("edge unreachable");
    $("net-ping").textContent = `${Math.round(rtt)} ms`;

    const trust = trustAfter(rtt);
    const d = await measureDownload(trust);
    if (!d) throw new Error("no usable sample");
    const floorD = show("net-speed", d);
    const floorU = show("net-up", await measureUpload(rtt, trust));

    lastRun = Date.now();
    $("net-status").textContent = "Online";
    const used = Math.round(spent / 1024);
    $("net-note").textContent = (floorD || floorU)
      ? `≥ means faster than this page can time · ${used} KB used`
      : `measured to Cloudflare${colo ? " " + colo : ""} · ${used} KB used`;
  } catch (err) {
    clearFigures("Unreachable");
    $("net-note").textContent =
      err && err.name === "AbortError" ? "Timed out" : "Could not complete the test";
  }
  if (btn) { btn.disabled = false; btn.textContent = "Run again"; }
}

$("net-run")?.addEventListener("click", runTest);

/* Opening the panel no longer fires a test: it costs the visitor real data, so
   it waits for an explicit click. A previous result is shown with its age, and
   retired once it is too old to describe the current connection. */
netBtn?.addEventListener("click", () => {
  if (netPop.hidden) return;
  const note = $("net-note");
  if (!lastRun) {
    if (note && !note.textContent) {
      note.textContent = navigator.connection?.saveData
        ? "Data Saver is on — the test stays under 1 MB"
        : "Uses 1–10 MB, depending on your connection";
    }
    return;
  }
  const age = Date.now() - lastRun;
  if (age > STALE_AFTER_MS) {
    clearFigures("Online");
    if (note) note.textContent = "Previous result expired — run again";
    lastRun = 0;
  } else if (note) {
    note.textContent = `measured ${Math.round(age / 1000)}s ago`;
  }
});

addEventListener("online", () => { const s = $("net-status"); if (s) s.textContent = "Online"; });
addEventListener("offline", () => {
  // Leaving the old figures on screen next to "Offline" implies they are
  // current measurements of a connection that no longer exists.
  clearFigures("Offline");
  const note = $("net-note");
  if (note) note.textContent = "Connection lost";
  lastRun = 0;
});

/* ---------- weather ----------
   Coarse location, no permission prompt. Two free no-key APIs:
   ipapi.co for rough location, Open-Meteo for conditions. Cached 10 min.
   Qualitative on purpose: hot / cold / humid, not a forecast. */

const wxBtn = document.getElementById("wx-btn");
const wxPop = document.getElementById("wx-pop");
register(wxBtn, wxPop);

const WX_TTL_MS = 600_000;
let wxAt = 0, wxBusy = false;

const tempWord = (t) =>
  t >= 30 ? "hot" : t >= 24 ? "warm" : t >= 17 ? "mild" :
  t >= 10 ? "cool" : t >= 3 ? "chilly" : "cold";
const skyWord = (c) =>
  c === 0 ? "clear skies" : c <= 2 ? "partly cloudy" : c === 3 ? "overcast" :
  c === 45 || c === 48 ? "foggy" : c >= 95 ? "stormy" :
  c >= 71 && c <= 77 ? "snowy" : "rainy";
const skyClass = (c) =>
  c === 0 || c === 1 ? "sun" : c >= 51 ? "rain" : "cloud";

async function json(url, ms = 6000) {
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), ms);
  try {
    const res = await fetch(url, { signal: ctl.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

async function loadWx(force = false) {
  if (wxBusy || (!force && Date.now() - wxAt < WX_TTL_MS)) return;
  wxBusy = true;
  const dot = wxBtn?.querySelector(".wx-dot");
  const temp = wxBtn?.querySelector(".wx-temp");
  try {
    // rough location from the network itself; falls back to a second provider
    const loc = await json("https://ipapi.co/json/").catch(() => json("http://ip-api.com/json/"));
    const lat = Number(loc?.latitude ?? loc?.lat), lon = Number(loc?.longitude ?? loc?.lon);
    const city = loc?.city || loc?.regionName || "nearby";
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) throw new Error("no location");
    const wx = await json(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat.toFixed(2)}&longitude=${lon.toFixed(2)}` +
      `&current=temperature_2m,relative_humidity_2m,weather_code&timezone=auto`
    );
    const cur = wx?.current || {};
    const t = Math.round(cur.temperature_2m), hum = Math.round(cur.relative_humidity_2m), code = cur.weather_code ?? 2;
    const line = `${tempWord(t)} in ${city} — ${t}°, ${hum >= 75 ? "humid, " : ""}${skyWord(code)}`;
    if (temp) temp.textContent = `${t}°`;
    if (dot) dot.className = `wx-dot ${skyClass(code)}`;
    wxBtn?.setAttribute("aria-label", `Weather: ${line}`);
    $("wx-place").textContent = city;
    $("wx-now").textContent = `${t}° · ${tempWord(t)}`;
    $("wx-hum").textContent = `${hum}%${hum >= 75 ? " · humid" : ""}`;
    $("wx-note").textContent = `${tempWord(t)[0].toUpperCase() + tempWord(t).slice(1)} at your place — ${skyWord(code)}`;
    wxAt = Date.now();
  } catch {
    if (temp) temp.textContent = "--°";
    $("wx-place").textContent = "—";
    $("wx-now").textContent = "n/a";
    $("wx-hum").textContent = "n/a";
    $("wx-note").textContent = "Couldn't reach the weather service";
  } finally {
    wxBusy = false;
  }
}

$("wx-run")?.addEventListener("click", () => loadWx(true));
wxBtn?.addEventListener("click", () => { if (!wxPop.hidden) loadWx(false); });
if (!navigator.onLine) {
  $("wx-note").textContent = "Offline";
} else {
  loadWx(false); // one quiet lookup on load; opening the panel never refetches within TTL
}

/* ---------- copy email ----------
   Delegated so it works for the contact window AND the menu-bar Contact menu
   (whose content is cloned into .mb-menu at open time). */
document.addEventListener("click", async (e) => {
  const menuCopy = e.target.closest("[data-copy-email]");
  if (menuCopy) {
    const orig = menuCopy.textContent;
    try {
      await navigator.clipboard.writeText("alistairar7@gmail.com");
      menuCopy.textContent = "Copied ✓";
    } catch {
      menuCopy.textContent = "alistairar7@gmail.com";
    }
    setTimeout(() => { menuCopy.textContent = orig; }, 1800);
    return;
  }
  if (!e.target.closest("#copy-mail")) return;
  const state = document.getElementById("copy-state");
  try {
    await navigator.clipboard.writeText("alistairar7@gmail.com");
    if (state) { state.textContent = "Copied ✓"; setTimeout(() => (state.textContent = "One click"), 1800); }
  } catch {
    if (state) state.textContent = "Press ⌘C";
  }
});
