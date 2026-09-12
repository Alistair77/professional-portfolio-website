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

/* ---------- network ---------- */
const netBtn = document.getElementById("net-btn");
const netPop = document.getElementById("net-pop");
register(netBtn, netPop);

const PROBE = "assets/projects/rag_stages.png"; // ~284 KB, same origin
const $ = (id) => document.getElementById(id);

async function ping() {
  const t0 = performance.now();
  await fetch(`favicon.ico?p=${Date.now()}`, { cache: "no-store" }).catch(() => {});
  return Math.round(performance.now() - t0);
}

async function speed() {
  const t0 = performance.now();
  const res = await fetch(`${PROBE}?c=${Date.now()}`, { cache: "no-store" });
  const blob = await res.blob();
  const secs = (performance.now() - t0) / 1000;
  if (!secs || !blob.size) return null;
  return (blob.size * 8) / secs / 1e6; // Mbps
}

async function runTest() {
  const btn = $("net-run");
  if (btn) { btn.disabled = true; btn.textContent = "Testing…"; }
  $("net-status").textContent = navigator.onLine ? "Online" : "Offline";
  $("net-ping").textContent = "…";
  $("net-speed").textContent = "…";

  try {
    $("net-ping").textContent = `${await ping()} ms`;
    const mbps = await speed();
    $("net-speed").textContent = mbps ? `${mbps.toFixed(1)} Mbps` : "n/a";
  } catch {
    $("net-status").textContent = "Offline";
    $("net-ping").textContent = $("net-speed").textContent = "—";
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
