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
   Streamed from the copy already published on the Cosmos portfolio (same
   origin), so this repo stays light and there's one file to swap. */
const TRACK = "https://alistair77.github.io/comos_Alistair_portfolio/uploads/awesome-mix-1.mp3";

const playBtn = document.getElementById("play-btn");
const musicPop = document.getElementById("music-pop");
const vol = document.getElementById("vol");
let audio = null;

function setPlayIcon(playing) {
  playBtn.querySelector(".ic-play").hidden = playing;
  playBtn.querySelector(".ic-pause").hidden = !playing;
  playBtn.setAttribute("aria-pressed", String(playing));
  playBtn.setAttribute("aria-label", playing ? "Pause music" : "Play music");
  playBtn.classList.toggle("is-playing", playing);
}

if (playBtn) {
  playBtn.addEventListener("click", async (e) => {
    e.stopPropagation();
    if (!audio) {
      // created on first press, so nothing is fetched on page load
      audio = new Audio(TRACK);
      audio.loop = true;
      audio.volume = (vol?.value ?? 55) / 100;
      audio.addEventListener("play", () => setPlayIcon(true));
      audio.addEventListener("pause", () => setPlayIcon(false));
      audio.addEventListener("error", () => {
        setPlayIcon(false);
        const t = musicPop?.querySelector(".music-sub");
        if (t) t.textContent = "Track unavailable";
        if (musicPop) place(playBtn, musicPop);
      });
    }
    if (audio.paused) {
      try { await audio.play(); } catch { setPlayIcon(false); }
    } else {
      audio.pause();
    }
  });

  // the popover is the secondary action — right-click or long-press
  playBtn.addEventListener("contextmenu", (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (musicPop) toggle(playBtn, musicPop);
  });
  register(null, musicPop);
  pops.set(playBtn, musicPop);
}

vol?.addEventListener("input", () => { if (audio) audio.volume = vol.value / 100; });

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
