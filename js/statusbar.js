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
paintList();

/* ---------- network ----------
   A real measurement, done the way a speed test actually has to be done.

   The naive version (bytes / total fetch time) is wrong: the fetch window is
   dominated by DNS + TCP + TLS + time-to-first-byte. Measured on this host,
   TTFB was 71% of the window — reporting 1.5 Mbps while the bytes were moving
   at 5.4 Mbps, with five identical runs varying 3x.

   So: Resource Timing for the true transfer window, wire bytes rather than
   decoded bytes, a warmed connection, parallel streams, and a hard cap on how
   much of the visitor's data this is allowed to spend.                      */

const netBtn = document.getElementById("net-btn");
const netPop = document.getElementById("net-pop");
register(netBtn, netPop);

const PROBE = "assets/projects/rag_stages.png"; // 283 KB, same origin
const MIN_WINDOW_MS = 220;     // below this the sample is noise
const MAX_BYTES = 1_600_000;   // never spend more than ~1.6 MB of someone's data
const REQ_TIMEOUT_MS = 8000;   // a hung request must not hang the panel
const STREAMS = [3, 6];        // escalate only while inside the data budget
const STALE_AFTER_MS = 120_000;

const $ = (id) => document.getElementById(id);

let bust = 0;
let spent = 0;      // everything this run has cost the visitor, for display
let spentBulk = 0;  // throughput only — latency probes must not starve it
let lastRun = 0;
const url = (p) => `${p}?n=${++bust}-${performance.now() | 0}`;

function timingFor(href) {
  return performance.getEntriesByName(new URL(href, location.href).href).pop() || null;
}

async function fetchTimed(path) {
  const u = url(path);
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), REQ_TIMEOUT_MS);
  try {
    const res = await fetch(u, { cache: "no-store", signal: ctl.signal });
    // Without this, renaming the probe asset yields a 404 page that still has
    // a size and a duration — a confident, completely wrong reading.
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    await res.arrayBuffer(); // drain, or responseEnd is meaningless
    const t = timingFor(u);
    if (!t) return null;

    // transferSize === 0 on a same-origin request means it was served from the
    // browser cache: nothing crossed the network, so the sample says nothing
    // about the link. Falling back to the body size here would invent speed.
    const wire = t.transferSize;
    if (!wire) return null;

    spent += wire;
    spentBulk += wire;
    return { start: t.responseStart, end: t.responseEnd, bytes: wire };
  } finally {
    clearTimeout(timer);
  }
}

/* Latency: TTFB (responseStart - requestStart) is RTT plus server time. The
   minimum across a few tries is the closest thing to the true round trip —
   everything above the floor is jitter. Sub-millisecond is valid on a fast
   link, so 0 must be accepted rather than treated as failure. */
async function measureLatency(tries = 3) {
  const seen = [];
  for (let i = 0; i < tries; i++) {
    try {
      const u = url(PROBE);
      const ctl = new AbortController();
      const timer = setTimeout(() => ctl.abort(), REQ_TIMEOUT_MS);
      const started = performance.now();
      // Only the first byte is needed for a round trip, so ask for exactly
      // that. Servers honouring Range reply 206 with one byte; those that do
      // not simply send the file, which still yields a valid TTFB.
      const res = await fetch(u, {
        cache: "no-store", signal: ctl.signal, headers: { Range: "bytes=0-0" },
      });
      clearTimeout(timer);
      if (!res.ok) continue;

      // Latency needs the headers, not the payload. If the server honoured
      // Range this is one byte; if it ignored it (status 200) cancel the body
      // rather than downloading the whole file to time a round trip.
      if (res.status === 206) await res.arrayBuffer();
      else { try { await res.body?.cancel(); } catch { /* already drained */ } }

      const t = timingFor(u);
      if (t) spent += t.transferSize || 0;

      // responseStart is set as soon as headers land, so it survives the
      // cancel; fall back to the wall clock if the entry never materialised.
      const ttfb = t && t.responseStart > 0
        ? t.responseStart - t.requestStart
        : performance.now() - started;
      if (Number.isFinite(ttfb) && ttfb >= 0) seen.push(ttfb);
    } catch { /* a failed try simply contributes no sample */ }
  }
  return seen.length ? Math.round(Math.min(...seen)) : null;
}

async function measureThroughput() {
  performance.clearResourceTimings();
  await fetchTimed(PROBE).catch(() => {}); // warm: DNS, TCP, TLS, partial slow-start

  let best = null;
  for (const streams of STREAMS) {
    if (spentBulk + streams * 290_000 > MAX_BYTES) break; // stay inside the budget

    const runs = (await Promise.all(
      Array.from({ length: streams }, () => fetchTimed(PROBE).catch(() => null))
    )).filter((r) => r && r.bytes > 0);
    if (!runs.length) continue;

    const bytes = runs.reduce((n, r) => n + r.bytes, 0);
    const windowMs = Math.max(...runs.map((r) => r.end)) - Math.min(...runs.map((r) => r.start));
    if (windowMs <= 0) continue;

    best = { mbps: (bytes * 8) / (windowMs / 1000) / 1e6, bytes, windowMs, streams };
    if (windowMs >= MIN_WINDOW_MS) break;
  }
  return best;
}

function clearFigures(status) {
  $("net-status").textContent = status;
  $("net-ping").textContent = "—";
  $("net-speed").textContent = "—";
}

async function runTest() {
  const btn = $("net-run");
  if (btn) { btn.disabled = true; btn.textContent = "Testing…"; }
  $("net-ping").textContent = "…";
  $("net-speed").textContent = "…";
  $("net-note").textContent = "";
  spent = 0;
  spentBulk = 0;

  if (!navigator.onLine) {
    // onLine only proves a network interface exists, never that the internet is
    // reachable — so it is trusted for the negative case only.
    clearFigures("Offline");
    $("net-note").textContent = "No network connection";
    if (btn) { btn.disabled = false; btn.textContent = "Run test"; }
    return;
  }

  try {
    const ms = await measureLatency();
    $("net-ping").textContent = ms == null ? "n/a" : `${ms} ms`;

    const r = await measureThroughput();
    if (!r) throw new Error("no usable sample");

    lastRun = Date.now();
    $("net-status").textContent = "Online";

    const shown = r.mbps < 10 ? r.mbps.toFixed(1) : Math.round(r.mbps);
    const used = Math.round(spent / 1024);

    if (r.windowMs < MIN_WINDOW_MS) {
      // The link drained the payload faster than this page can time it, so the
      // figure is a floor rather than a reading. Say that instead of implying
      // precision the sample cannot support.
      $("net-speed").textContent = `≥ ${shown} Mbps`;
      $("net-note").textContent = `drained in ${Math.round(r.windowMs)} ms — faster than this page can measure · ${used} KB used`;
    } else {
      $("net-speed").textContent = `${shown} Mbps`;
      $("net-note").textContent = `${r.streams} streams · ${Math.round(r.windowMs)} ms window · ${used} KB used`;
    }
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
        ? "Data Saver is on — the test uses up to ~1.6 MB"
        : "Uses up to ~1.6 MB of data";
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

/* ---------- copy email ---------- */
document.addEventListener("click", async (e) => {
  if (!e.target.closest("#copy-mail")) return;
  const state = document.getElementById("copy-state");
  try {
    await navigator.clipboard.writeText("alistairar7@gmail.com");
    if (state) { state.textContent = "Copied ✓"; setTimeout(() => (state.textContent = "One click"), 1800); }
  } catch {
    if (state) state.textContent = "Press ⌘C";
  }
});
