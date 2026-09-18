/* Ari — the desktop assistant. Lives in its own window (from <template
   data-app="ari">), talks in scripted lines, points at the Projects window,
   and explains whichever project the visitor picks there. */

import { openApp, focusWindow, besideAri } from "../wm.js";
import { createFigure } from "./figure.js";
import { voice } from "./voice.js";
import { LINES, CHIPS, LABEL, LINKS, PANE, PANE_NODE, ROUTES, MORE, greeting } from "./lines.js";

const RM = matchMedia("(prefers-reduced-motion: reduce)").matches;
const clamp = (v, a = -1, b = 1) => Math.max(a, Math.min(b, v));
const pick = (a) => a[Math.floor(Math.random() * a.length)];
const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");

const pointer = { x: innerWidth / 2, y: innerHeight / 2, moved: 0 };
addEventListener("pointermove", (e) => { pointer.x = e.clientX; pointer.y = e.clientY; pointer.moved = performance.now(); });

const LIST_W = 320; // Projects as a narrow list beside Ari, like the concept

let win = null, fig = null, canvas = null, ui = null;
let body = "tee", running = false, level = 0;
let born = 0, bodyBorn = 0, blinkAt = 0;
let gaze = null, gazeUntil = 0, token = 0, full = "", selfNav = false, hinted = false;

/* the menu-bar orb and the dock icon pulse while Ari talks */
const pulse = [document.querySelector("#ari-orb .orb"), document.querySelector(".dock .glyph-ari")].filter(Boolean);

const projectsWin = () => document.querySelector('.window[data-app="projects"]');
/* narrow Projects hides its detail pane (css/ari.css) until the green button opens it out */
const isList = (pw) => !!pw && !pw.hidden && getComputedStyle(pw.querySelector(".content")).display === "none";

/* ── talking ── */
function go(id, { fromPanel = false } = {}) {
  if (!ui) return;
  const points = Object.hasOwn(PANE, id);
  if (points && !fromPanel) showProject(PANE[id]);
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

/* ── mounting: the window is rebuilt from its template on every open ── */
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
  };
  born = bodyBorn = performance.now();
  blinkAt = born + 2400;
  full = "";
  hinted = false;

  win.querySelector(".d-ask").addEventListener("submit", (ev) => {
    ev.preventDefault();
    const input = ev.target.elements.q;
    const q = input.value.trim();
    input.value = "";
    if (!q) return;
    const hit = ROUTES.find(([re]) => re.test(q));
    go(hit ? hit[1] : "fallback");
  });

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

  if (!voice.available) ui.sound.hidden = true;
  ui.sound.setAttribute("aria-pressed", String(voice.enabled));
  ui.sound.addEventListener("click", () => {
    voice.enabled = !voice.enabled;
    if (voice.enabled) go("voiceOn"); else voice.stop();
    ui.sound.setAttribute("aria-pressed", String(voice.enabled));
    ui.sound.setAttribute("aria-label", voice.enabled ? "Mute Ari" : "Let Ari speak");
  });

  go("start");
  if (!running) { running = true; requestAnimationFrame(loop); }
});

document.addEventListener("app:close", (e) => {
  if (e.detail !== "ari") return;
  voice.stop();
  for (const el of pulse) el.style.transform = "";
  win = fig = canvas = ui = null;
  /* without Ari the list has nobody to explain it: Projects gets its full size back */
  const pw = projectsWin();
  if (isList(pw)) {
    pw.style.width = pw.style.height = "";
    pw.style.left = Math.max(14, Math.min(pw.offsetLeft, innerWidth - pw.offsetWidth - 14)) + "px";
  }
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
