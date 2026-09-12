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

   The naive version (bytes ÷ total fetch time) is wrong because the fetch
   window is dominated by DNS + TCP + TLS + time-to-first-byte. Measured on
   this host, TTFB was 71% of the window — so it reported 1.5 Mbps while the
   bytes were actually moving at 5.4 Mbps, and five identical runs varied 3x.

   This version instead:
     - reads the Resource Timing API, so the transfer window is responseEnd -
       responseStart (pure download, setup and TTFB excluded)
     - counts transferSize, the bytes actually on the wire, not decoded length
     - warms the connection first, so slow-start is partly past
     - runs several streams in parallel, because one stream on one connection
       does not saturate a modern link
     - escalates if the window was too short to mean anything
     - takes the minimum of several round trips for latency, since the floor
       is the real RTT and everything above it is jitter                     */

const netBtn = document.getElementById("net-btn");
const netPop = document.getElementById("net-pop");
register(netBtn, netPop);

const PROBE = "assets/projects/rag_stages.png"; // 283 KB, same origin
const MIN_WINDOW_MS = 220;   // below this, the sample is noise
const STREAMS = [3, 6, 10];  // escalate until the window is long enough
const $ = (id) => document.getElementById(id);

let bust = 0;
const url = (p) => `${p}?n=${++bust}-${performance.now() | 0}`;

/* Resource Timing is the only way to see the real transfer window. Entries are
   keyed by absolute URL, so resolve before looking one up. */
function timingFor(href) {
  const abs = new URL(href, location.href).href;
  return performance.getEntriesByName(abs).pop() || null;
}

async function fetchTimed(path) {
  const u = url(path);
  const res = await fetch(u, { cache: "no-store" });
  await res.arrayBuffer(); // drain fully, or responseEnd is meaningless
  const t = timingFor(u);
  if (!t) return null;
  return {
    start: t.responseStart,
    end: t.responseEnd,
    // transferSize includes headers and is 0 on a cache hit; fall back to the
    // encoded body, which is still wire bytes rather than decoded bytes
    bytes: t.transferSize || t.encodedBodySize || 0,
  };
}

/* Latency: TTFB from Resource Timing (responseStart - requestStart) is RTT plus
   server time. The minimum across a few tries is the closest thing to the true
   round trip — everything above the floor is jitter. Sub-millisecond is a valid
   reading on a fast link, so 0 must be accepted rather than treated as failure. */
async function measureLatency(tries = 3) {
  const seen = [];
  for (let i = 0; i < tries; i++) {
    const u = url(PROBE);
    try {
      const res = await fetch(u, { cache: "no-store" });
      await res.arrayBuffer();
      const t = timingFor(u);
      if (t && Number.isFinite(t.responseStart) && Number.isFinite(t.requestStart)) {
        const ttfb = t.responseStart - t.requestStart;
        if (ttfb >= 0) seen.push(ttfb);
      }
    } catch { /* a failed try just doesn't contribute a sample */ }
  }
  return seen.length ? Math.round(Math.min(...seen)) : null;
}

async function measureThroughput() {
  performance.clearResourceTimings(); // keep the buffer from filling silently

  await fetchTimed(PROBE).catch(() => {}); // warm: DNS, TCP, TLS, partial slow-start

  let best = null;
  for (const streams of STREAMS) {
    const runs = (await Promise.all(
      Array.from({ length: streams }, () => fetchTimed(PROBE).catch(() => null))
    )).filter((r) => r && r.bytes > 0);

    if (!runs.length) continue;

    // aggregate: total wire bytes over the union of every stream's window
    const bytes = runs.reduce((n, r) => n + r.bytes, 0);
    const windowMs = Math.max(...runs.map((r) => r.end)) - Math.min(...runs.map((r) => r.start));
    if (windowMs <= 0) continue;

    best = { mbps: (bytes * 8) / (windowMs / 1000) / 1e6, bytes, windowMs, streams };
    if (windowMs >= MIN_WINDOW_MS) break; // long enough to trust — stop escalating
  }
  return best;
}

async function runTest() {
  const btn = $("net-run");
  if (btn) { btn.disabled = true; btn.textContent = "Testing…"; }
  $("net-ping").textContent = "…";
  $("net-speed").textContent = "…";
  $("net-note").textContent = "";

  if (!navigator.onLine) {
    // onLine only proves a network interface exists, never that the internet
    // is reachable — so it is only trusted for the negative case
    $("net-status").textContent = "Offline";
    $("net-ping").textContent = $("net-speed").textContent = "—";
    if (btn) { btn.disabled = false; btn.textContent = "Run again"; }
    return;
  }

  try {
    const ms = await measureLatency();
    $("net-ping").textContent = ms == null ? "n/a" : `${ms} ms`;

    const r = await measureThroughput();
    if (!r) throw new Error("no usable sample");

    $("net-status").textContent = "Online";

    const shown = r.mbps < 10 ? r.mbps.toFixed(1) : Math.round(r.mbps);
    const kb = Math.round(r.bytes / 1024);

    if (r.windowMs < MIN_WINDOW_MS) {
      // The link drained the payload faster than we can time it. The figure is
      // a floor, not a reading — so present it as one rather than as precision
      // the sample cannot support.
      $("net-speed").textContent = `≥ ${shown} Mbps`;
      $("net-note").textContent = `${kb} KB drained in ${Math.round(r.windowMs)} ms — faster than this page can measure`;
    } else {
      $("net-speed").textContent = `${shown} Mbps`;
      $("net-note").textContent = `${kb} KB · ${r.streams} parallel streams · ${Math.round(r.windowMs)} ms window`;
    }
  } catch {
    $("net-status").textContent = "Unreachable";
    $("net-ping").textContent = $("net-speed").textContent = "—";
    $("net-note").textContent = "Could not reach the network";
  }
  if (btn) { btn.disabled = false; btn.textContent = "Run again"; }
}

$("net-run")?.addEventListener("click", runTest);
netBtn?.addEventListener("click", () => {
  if (!netPop.hidden && $("net-speed").textContent === "—") runTest();
});

addEventListener("online", () => { const s = $("net-status"); if (s) s.textContent = "Online"; });
addEventListener("offline", () => { const s = $("net-status"); if (s) s.textContent = "Offline"; });

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
