/* Ari — the desktop assistant. Lives in its own window (from <template
   data-app="ari">), talks in scripted lines, points at the Projects window,
   and explains whichever project the visitor picks there. */

import { openApp, focusWindow, besideAri, resetSize } from "../wm.js?v=5";
import { createFigure } from "./figure.js?v=5";
import { voice } from "./voice.js?v=5";
import { decide } from "./decide.js?v=5";
import { micSupported, listenOnce, stopListening } from "./mic.js?v=5";
import { LINES, CHIPS, LABEL, LINKS, PANE, PANE_NODE, MORE, greeting, GITHUB, LINKEDIN } from "./lines.js?v=5";
import { PROJECTS } from "../projects.js?v=5";

const RM = matchMedia("(prefers-reduced-motion: reduce)").matches;
const clamp = (v, a = -1, b = 1) => Math.max(a, Math.min(b, v));
const pick = (a) => a[Math.floor(Math.random() * a.length)];
const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");

const pointer = { x: innerWidth / 2, y: innerHeight / 2, moved: 0 };
addEventListener("pointermove", (e) => { pointer.x = e.clientX; pointer.y = e.clientY; pointer.moved = performance.now(); });

const LIST_W = 320; // Projects as a narrow list beside Ari, like the concept
const PHONE = matchMedia("(max-width: 760px)"); // the css/mobile.css breakpoint
const AI_WORK = PROJECTS.filter((p) => p.group === "ai");

let win = null, fig = null, canvas = null, ui = null;
let body = "tee", running = false, level = 0;
let born = 0, bodyBorn = 0, blinkAt = 0;
let gaze = null, gazeUntil = 0, token = 0, full = "", selfNav = false, hinted = false;

/* the menu-bar orb and the dock icon pulse while Ari talks */
const pulse = [document.querySelector("#ari-orb .orb"), document.querySelector(".dock .glyph-ari")].filter(Boolean);

const projectsWin = () => document.querySelector('.window[data-app="projects"]');
/* narrow Projects hides its detail pane (css/ari.css) until the green button opens it out */
const isList = (pw) => !!pw && !pw.hidden && getComputedStyle(pw.querySelector(".content")).display === "none";

/* which app window a node opens (projects panes go through PANE instead) */
const APP = { resume: "resume", contact: "contact", terminal: "terminal", about: "about" };
/* confirm-to-open: github/linkedin ask first, yesOpen/noThanks resolve it */
const PENDING = { for: null };

/* visitor name: asked once, optional, on the contact flow. Stored in the
   visitor's own browser only; forwarded to the private visit log solely when
   the visitor volunteers it (skippable, never inferred). */
const nameStore = {
  get(k) { try { return localStorage.getItem(k); } catch { return null; } },
  set(k, v) { try { localStorage.setItem(k, v); } catch { /* private mode */ } },
};
const visitorName = () => (nameStore.get("ari:visitor-name") || "").trim();
const askedName = () => nameStore.get("ari:asked-name") === "1";
const markAsked = () => nameStore.set("ari:asked-name", "1");
let pendingName = false;
function cleanName(raw) {
  let s = String(raw || "").trim();
  if (!s) return "";
  if (/^(skip|no thanks|nope?|nah|cancel|not now)\s*[!.]?$/i.test(s)) return "";
  s = s.replace(/^(my name is|my names?|i'm|i am|i am called|call me|it's|its|this is)\s+/i, "").trim();
  s = s.replace(/[.!?,;:"'()]+$/g, "").trim();
  s = s.split(/\s+/).slice(0, 2).join(" ");
  s = s.replace(/[^A-Za-zÀ-ÿ'’\- ]/g, "").trim().slice(0, 30);
  if (s.length < 2) return "";
  return s;
}

const HALF_GAP = 16; // matches wm.js: windows never touch chrome or each other
/* equal split: Ari gives up its stage width so both windows share 50-50.
   Falls back to the narrow beside-list when the screen is too small. */
function openHalf(id) {
  const el = openApp(id);
  if (!el || !win || PHONE.matches) return el;
  const half = Math.floor((innerWidth - HALF_GAP * 3) / 2);
  if (half < 340 || win.hidden) {
    if (besideAri(el, 620)) focusWindow(win);
    return el;
  }
  el.classList.remove("maximized", "tiled");
  const top = Math.max(48, win.offsetTop);
  Object.assign(win.style, {
    left: innerWidth - half - HALF_GAP + "px",
    width: half + "px",
  });
  Object.assign(el.style, {
    left: HALF_GAP + "px",
    top: top + "px",
    width: half + "px",
    height: win.offsetHeight + "px",
    maxWidth: "",
    maxHeight: "",
  });
  glance(el);
  focusWindow(win);
  return el;
}

/* ── talking ── */
function go(id, { fromPanel = false } = {}) {
  if (!ui) return;
  /* contact asks for a name once, optionally: skip proceeds nameless,
     a remembered name personalises the line instead */
  if (id === "skipName") {
    pendingName = false;
    markAsked();
    PENDING.for = null;
    openHalf(APP.contact);
    say(pick(LINES.contact), CHIPS.contact);
    return;
  }
  if (id === "contact" && !pendingName && !visitorName() && !askedName()) {
    pendingName = true;
    markAsked();
    PENDING.for = null;
    openHalf(APP.contact);
    say(pick(LINES.askName), CHIPS.askName);
    return;
  }
  if (id === "contact" && visitorName()) {
    openHalf(APP.contact);
    say(`For you, ${visitorName()} — ${pick(LINES.contact)}`, CHIPS.contact);
    return;
  }
  if (id === "yesOpen" && !PENDING.for) id = "yesOpenIdle";
  const points = Object.hasOwn(PANE, id);
  if (points && !fromPanel) showProject(PANE[id]);
  if (Object.hasOwn(APP, id)) openHalf(APP[id]);
  if (id === "music") document.dispatchEvent(new CustomEvent("ari:toggle-music"));
  if (id === "github" || id === "linkedin") PENDING.for = id;
  else if (id !== "yesOpen" && id !== "noThanks") PENDING.for = null;
  if (id === "yesOpen") {
    window.open(PENDING.for === "linkedin" ? LINKEDIN : GITHUB, "_blank", "noopener");
    PENDING.for = null;
  }
  if (id === "noThanks") PENDING.for = null;
  let text = id === "start" ? greeting() : pick(LINES[id]);
  if (id === "hint") hinted = true;
  else if (!hinted && (points || id === "other") && isList(projectsWin())) {
    text += " " + pick(LINES.hint);
    hinted = true;
  }
  say(text, CHIPS[id]);
}

function say(text, chips) {
  const my = ++token;
  ui.prev.textContent = full;
  full = text;
  ui.chips.innerHTML = "";
  voice.say(text, RM);

  const done = () => {
    if (my !== token || !ui) return;
    ui.line.innerHTML = esc(text) + '<span class="caret"></span>';
    ui.chips.innerHTML = "";
    chips.forEach((c, i) => {
      let el;
      if (LINKS[c]) {
        el = document.createElement("a");
        el.href = LINKS[c][1]; el.target = "_blank"; el.rel = "noopener";
        el.textContent = LINKS[c][0];
      } else {
        el = document.createElement("button");
        el.type = "button"; el.textContent = LABEL[c];
        el.addEventListener("click", () => go(c));
      }
      el.style.animationDelay = i * 60 + "ms";
      ui.chips.append(el);
    });
  };
  if (RM) { done(); return; }
  let i = 0;
  const step = () => {
    if (my !== token || !ui) return;
    i = Math.min(text.length, i + 2);
    ui.line.innerHTML = esc(text.slice(0, i)) + '<span class="caret"></span>';
    if (i < text.length) setTimeout(step, 22); else done();
  };
  step();
}

/* open the real Projects window beside Ari (never over it), at the right pane */
function showProject(pane) {
  if (PHONE.matches) { showStrip(pane); return; } // a phone window would cover Ari
  const pw = openApp("projects");
  if (!pw) return;
  if (pane) {
    selfNav = true;
    pw.querySelector(`.sb-item[data-pane="${pane}"]`)?.click();
    selfNav = false;
  }
  if (besideAri(pw, LIST_W)) focusWindow(win); // phones stack windows: Projects stays in front
  glance(pw);
}

/* phones: the AI work as a slim sideways strip on top of Ari, the pane's pill lit */
function showStrip(pane) {
  const strip = win.querySelector(".ari-strip");
  strip.hidden = false;
  for (const b of strip.querySelectorAll(".strip-pill")) {
    const on = b.dataset.pane === pane;
    b.setAttribute("aria-pressed", String(on));
    // not scrollIntoView: it also scrolls every ancestor, and the desktop layer is
    // overflow:hidden but still scrollable, so the whole window slides off screen
    if (on) strip.scrollTo({ left: b.offsetLeft - (strip.clientWidth - b.offsetWidth) / 2, behavior: RM ? "auto" : "smooth" });
  }
}

function stripPill(p) {
  const b = document.createElement("button");
  b.type = "button";
  b.className = "strip-pill";
  b.dataset.pane = p.id;
  b.setAttribute("aria-pressed", "false");
  const dot = document.createElement("i");
  dot.style.background = `linear-gradient(160deg, ${p.accent[0]}, ${p.accent[1]})`;
  b.append(dot, p.name);
  b.addEventListener("click", () => { showStrip(p.id); go(PANE_NODE[p.id], { fromPanel: true }); });
  return b;
}

function glance(el) {
  const r = el.getBoundingClientRect();
  gaze = { x: r.left + r.width / 2, y: r.top + r.height / 3 };
  gazeUntil = performance.now() + 2400;
}

/* the green button opened Projects out: Ari gives the long version */
document.addEventListener("app:zoom", (e) => {
  const { id, on } = e.detail;
  const pw = projectsWin();
  if (id !== "projects" || !on || !ui || !pw) return;
  hinted = true;
  const pane = pw.querySelector('.sb-item[aria-selected="true"]')?.dataset.pane;
  say(pick(MORE[PANE_NODE[pane]] || MORE.work), CHIPS.more);
  glance(pw);
});

/* the visitor picks a project in the Projects window → Ari explains it */
document.addEventListener("click", (e) => {
  const item = e.target.closest('.window[data-app="projects"] .sb-item[data-pane]');
  if (!item || selfNav || !ui) return;
  const node = PANE_NODE[item.dataset.pane];
  if (node) go(node, { fromPanel: true });
});

/* ── asking: voice or text in -> decision -> UI action ──
   The decision engine is the brain, Ari is the face. decide() answers from
   local commands first and asks the on-device backend for the long tail,
   so intelligence degrades gracefully instead of breaking. */
async function ask(text, { via = "text" } = {}) {
  const q = String(text || "").trim();
  if (!q || !ui) return;
  /* awaiting a volunteered name on the contact flow: never routed, never decided */
  if (pendingName) {
    pendingName = false;
    const named = cleanName(q);
    if (!named) {
      say(pick(LINES.contact), CHIPS.contact);
    } else {
      nameStore.set("ari:visitor-name", named);
      try { window.__setVisitorName?.(named); } catch { /* logger absent */ }
      try {
        const meta = document.querySelector('meta[name="visit-endpoint"]');
        let ep = window.__VISIT_ENDPOINT || meta?.content || "";
        if (!ep) { try { ep = localStorage.getItem("ari:visit-endpoint") || ""; } catch { /* private mode */ } }
        if (ep.trim()) {
          fetch(String(ep).replace(/\/+$/, ""), {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ v: 1, kind: "name", ts: new Date().toISOString(), name: named }),
            keepalive: true,
            credentials: "omit",
          }).catch(() => {});
        }
      } catch { /* silent */ }
      say(`Nice to meet you, ${named}. ${pick(LINES.contact)}`, CHIPS.contact);
    }
    return;
  }
  // thinking state: bouncing dots + the status-bar orb shimmers till it answers
  ui.line.innerHTML = '<span class="think" aria-label="Thinking"><i></i><i></i><i></i></span>';
  document.getElementById("ari-orb")?.classList.add("thinking");
  if (ui.src) ui.src.textContent = via === "voice" ? `Heard “${q}” — thinking…` : "Thinking…";
  try {
    const { node, source, confidence } = await decide(q);
    document.getElementById("ari-orb")?.classList.remove("thinking");
    if (ui.src) {
      const brain = source.startsWith("laya");
      const engine = brain
        ? `Decision engine${confidence ? ` · ${Math.round(confidence * 100)}%` : ""}`
        : "local match";
      // voice always shows what was heard; typed input only name-drops the engine
      ui.src.textContent = via === "voice" ? `Heard “${q}” · ${engine}` : (brain ? engine : "");
    }
    go(node);
  } catch {
    document.getElementById("ari-orb")?.classList.remove("thinking");
    if (ui.src) ui.src.textContent = "";
    go("fallback");
  }
}

let micBusy = false;
const fmtT = (ms) => `0:${String(Math.floor(ms / 1000)).padStart(2, "0")}`;
function setMicLive(on, btn) {
  for (const b of [btn, document.getElementById("ari-mic"), win?.querySelector(".d-mic")].filter(Boolean)) {
    b.setAttribute("aria-pressed", String(on));
    b.classList.toggle("listening", on);
  }
}
async function talkOnce(btn) {
  if (micBusy) { stopListening(); return; } // second tap stops
  if (!micSupported) return;
  micBusy = true;
  const t0 = Date.now();
  setMicLive(true, btn);
  const tick = setInterval(() => {
    if (ui?.src) ui.src.textContent = `Listening… ${fmtT(Date.now() - t0)} — tap the mic to stop.`;
  }, 500);
  try {
    const heard = await listenOnce();
    if (ui) {
      const input = win.querySelector(".d-ask input");
      if (input) input.value = heard;
    }
    await ask(heard, { via: "voice" });
  } catch (err) {
    // no-speech / timeout / denied: say what happened in the caption,
    // not the fallback line — that line means "heard but unanswered"
    if (!ui) return;
    const msg = String(err?.message || "");
    if (ui.src) {
      ui.src.textContent =
        msg === "not-allowed" || msg === "service-not-allowed"
          ? "Mic blocked — allow microphone access, or type instead."
          : "Didn't catch that — try again, or type instead.";
    }
    if (msg !== "no-speech" && msg !== "timeout" && msg !== "aborted") go("fallback");
  } finally {
    clearInterval(tick);
    setMicLive(false, btn);
    micBusy = false;
  }
}

/* one switch for both sound buttons (menu bar + in-app): they always agree */
function setSound(on) {
  voice.setEnabled(on);
  const label = voice.enabled ? "Mute Ari" : "Let Ari speak";
  if (ui?.sound) {
    ui.sound.setAttribute("aria-pressed", String(voice.enabled));
    ui.sound.setAttribute("aria-label", label);
  }
  const mb = document.getElementById("ari-sound");
  if (mb) {
    mb.setAttribute("aria-pressed", String(voice.enabled));
    mb.setAttribute("aria-label", label);
    mb.classList.toggle("is-off", !voice.enabled);
    mb.querySelector(".snd-on")?.toggleAttribute("hidden", !voice.enabled);
    mb.querySelector(".snd-off")?.toggleAttribute("hidden", voice.enabled);
  }
  return voice.enabled;
}
document.getElementById("ari-sound")?.addEventListener("click", () => {
  if (setSound(!voice.enabled)) openApp("ari");
});
setSound(voice.enabled); // paint the menu icon from the stored preference

/* status-bar mic wants listening even if Ari just opened: flag survives remount */
let pendingMic = false;
if (!micSupported) {
  document.getElementById("ari-mic")?.setAttribute("disabled", "");
  document.getElementById("ari-mic")?.setAttribute("title", "Voice input not supported in this browser");
}
document.getElementById("ari-mic")?.addEventListener("click", () => {
  const w = document.querySelector('.window[data-app="ari"]');
  if (!w || w.hidden) openApp("ari");
  else focusWindow(w);
  // ui may not exist yet (window mounts on app:open): defer to the mount handler
  if (!win || !ui) pendingMic = true;
  else talkOnce(win.querySelector(".d-mic"));
});
document.addEventListener("ari:listening", (e) => {
  const on = !!e.detail?.on;
  document.getElementById("ari-mic")?.classList.toggle("listening", on);
});
document.addEventListener("ari:hearing", (e) => {
  if (!win || !ui) return;
  const input = win.querySelector(".d-ask input");
  if (input && e.detail) input.value = e.detail.final || e.detail.interim || input.value;
});
document.addEventListener("app:open", (e) => {
  if (e.detail !== "ari") return;
  win = document.querySelector('.window[data-app="ari"]');
  if (!win) return;
  canvas = win.querySelector(".ari-fig canvas");
  fig = createFigure(canvas);
  ui = {
    prev: win.querySelector(".d-prev"),
    line: win.querySelector(".d-line"),
    chips: win.querySelector(".d-chips"),
    sound: win.querySelector(".ari-sound"),
    src: win.querySelector(".d-src"),
  };
  born = bodyBorn = performance.now();
  blinkAt = born + 2400;
  full = "";
  hinted = false;
  /* Ari takes the stage: min(78vw, 1200px) × (viewport − menubar − dock),
     so it covers 60%+ of laptop screens without touching chrome.
     Phones stack full-screen via CSS, so skip the maths there. */
  if (!PHONE.matches && !win.classList.contains("maximized")) {
    const W = Math.min(1200, Math.floor(innerWidth * 0.78));
    const H = Math.min(860, innerHeight - 140);
    if (W >= 480 && H >= 460) {
      win.style.width = W + "px";
      win.style.height = H + "px";
      win.style.left = Math.max(14, Math.floor((innerWidth - W) / 2)) + "px";
      win.style.top = Math.max(48, Math.floor((innerHeight - H) / 2) + 18) + "px";
    }
  }
  win.querySelector(".ari-strip").append(...AI_WORK.map(stripPill));

  win.querySelector(".d-ask").addEventListener("submit", (ev) => {
    ev.preventDefault();
    const input = ev.target.elements.q;
    const q = input.value.trim();
    input.value = "";
    if (!q) return;
    ask(q);
  });

  const micBtn = win.querySelector(".d-mic");
  if (!micSupported && micBtn) micBtn.disabled = true;
  micBtn?.addEventListener("click", () => talkOnce(micBtn));

  win.querySelectorAll("[data-fit]").forEach((b) => {
    b.setAttribute("aria-pressed", String(b.dataset.fit === body));
    b.addEventListener("click", () => {
      if (b.dataset.fit === body) return;
      body = b.dataset.fit;
      bodyBorn = performance.now();
      win.querySelectorAll("[data-fit]").forEach((x) => x.setAttribute("aria-pressed", String(x.dataset.fit === body)));
      go(body === "robot" ? "toRobot" : "toTee");
    });
  });

  if (!voice.available) { ui.sound.hidden = true; document.getElementById("ari-sound").hidden = true; }
  setSound(voice.enabled);
  ui.sound.addEventListener("click", () => {
    if (setSound(!voice.enabled)) go("voiceOn");
  });

  /* voice character: Soft (playful, fast) or Bold (confident, fast) */
  const vbtn = win.querySelector(".ari-voice");
  const paintVoice = () => {
    if (!vbtn) return;
    vbtn.textContent = voice.persona === "soft" ? "Soft" : "Bold";
    vbtn.setAttribute("aria-label", voice.persona === "soft"
      ? "Voice: Soft. Switch to Bold."
      : "Voice: Bold. Switch to Soft.");
  };
  paintVoice();
  vbtn?.addEventListener("click", () => {
    voice.setPersona(voice.persona === "soft" ? "bold" : "soft");
    paintVoice();
  });

  go("start");
  if (ui.src && micSupported) ui.src.textContent = "Tap the mic and just ask — try “show me Zetsu”.";
  if (pendingMic) {
    pendingMic = false;
    // let the greeting paint first, then start listening
    setTimeout(() => talkOnce(win.querySelector(".d-mic")), 600);
  }
  if (!running) { running = true; requestAnimationFrame(loop); }
});

document.addEventListener("app:close", (e) => {
  if (e.detail !== "ari") return;
  voice.stop();
  for (const el of pulse) el.style.transform = "";
  win = fig = canvas = ui = null;
  /* without Ari the list has nobody to explain it: Projects gets its full size back */
  const pw = projectsWin();
  if (isList(pw)) resetSize(pw);
});

/* ── animation: only runs while the window exists ── */
function loop(t) {
  if (!win || !win.isConnected) { running = false; return; }
  requestAnimationFrame(loop);

  const target = voice.speaking() ? 0.35 + 0.55 * Math.abs(Math.sin(t / 55)) * (0.6 + 0.4 * Math.sin(t / 140)) : 0;
  level += (target - level) * 0.2;
  const s = level > 0.01 ? `scale(${(1 + level * 0.3).toFixed(3)})` : "";
  for (const el of pulse) el.style.transform = s;
  if (win.hidden) return; // minimised: the orb still pulses, the figure rests

  const r = canvas.getBoundingClientRect();
  const cx = r.left + r.width / 2, cy = r.top + r.height * 0.36;
  let tx, ty;
  if (gaze && t < gazeUntil) ({ x: tx, y: ty } = gaze);
  else if (t - pointer.moved < 2500) { tx = pointer.x; ty = pointer.y; }
  else { tx = cx + Math.sin(t / 1900) * r.width; ty = cy + Math.cos(t / 2600) * r.height * 0.4; }
  const lean = { x: clamp((tx - cx) / Math.max(300, r.width * 1.3)), y: clamp((ty - cy) / Math.max(240, r.height * 0.9)) };

  let blink = 1;
  if (!RM && t > blinkAt) { blink = 0.12; if (t > blinkAt + 130) blinkAt = t + 2600 + Math.random() * 3000; }

  fig.draw({
    t, level, lean, blink, body, rm: RM,
    age: RM ? 9 : (t - born) / 2200,
    bodyAge: RM ? 9 : (t - bodyBorn) / 1800,
    breath: RM ? 0 : Math.sin(t / 900) * 1.4,
  });
}
