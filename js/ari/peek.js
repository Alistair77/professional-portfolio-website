/* Ari's small face on hover, over the menu-bar orb and the dock icon.
   The same dots as the big figure, face only: they fly in, the eyes find
   the cursor, and an invitation types itself. A click wakes Ari. */

import { openApp, closeApp, isOpen } from "../wm.js?v=4";
import { createFigure, FACE } from "./figure.js?v=4";
import { PEEK } from "./lines.js?v=4";

const RM = matchMedia("(prefers-reduced-motion: reduce)").matches;
const HIDE_MS = 180; // long enough to cross from the button onto the card
const clamp = (v, a = -1, b = 1) => Math.max(a, Math.min(b, v));

const orb = document.getElementById("ari-orb");
const dockBtn = document.querySelector('.dock-item[data-app="ari"]');
const dock = document.querySelector(".dock");
const peek = document.getElementById("ari-peek");
const canvas = peek.querySelector("canvas");
const lineEl = peek.querySelector(".peek-line");
const fig = createFigure(canvas, { view: FACE, dot: 1.9 });

const pointer = { x: 0, y: 0 };
addEventListener("pointermove", (e) => { pointer.x = e.clientX; pointer.y = e.clientY; });

let anchor = null, hideTimer = 0, typing = 0, running = false;
let born = 0, blinkAt = 0, talkUntil = 0, level = 0;

/* Ari on screen (open, not minimised): nothing to invite */
const ariWin = () => document.querySelector('.window[data-app="ari"]:not(.closing)');
const onScreen = () => !!ariWin() && !ariWin().hidden;

function show(btn) {
  clearTimeout(hideTimer);
  if (anchor === btn || onScreen()) return;
  anchor?.classList.remove("peeking");
  anchor = btn;
  btn.classList.add("peeking");
  peek.hidden = false;
  place(btn);
  born = performance.now();
  blinkAt = born + 900;
  type(PEEK[Math.floor(Math.random() * PEEK.length)]);
  if (!running) { running = true; requestAnimationFrame(loop); }
}

function hide() {
  clearTimeout(hideTimer);
  anchor?.classList.remove("peeking");
  anchor = null;
  peek.hidden = true;
}

const hideSoon = () => { clearTimeout(hideTimer); hideTimer = setTimeout(hide, HIDE_MS); };

/* under the orb, or above the magnified dock icon */
function place(btn) {
  const r = btn.getBoundingClientRect(), w = peek.offsetWidth;
  const fromTop = btn === orb;
  peek.dataset.from = fromTop ? "top" : "bottom";
  peek.style.left = clamp(r.left + r.width / 2 - w / 2, 8, innerWidth - w - 8) + "px";
  peek.style.top = fromTop ? r.bottom + 8 + "px" : "";
  peek.style.bottom = fromTop ? "" : innerHeight - dock.getBoundingClientRect().top + 44 + "px";
}

function type(text) {
  const my = ++typing;
  talkUntil = performance.now() + (RM ? 0 : text.length * 11 + 300);
  if (RM) { lineEl.textContent = text; return; }
  let i = 0;
  const step = () => {
    if (my !== typing || peek.hidden) return;
    i = Math.min(text.length, i + 2);
    lineEl.textContent = text.slice(0, i);
    if (i < text.length) setTimeout(step, 22);
  };
  step();
}

function loop(t) {
  if (peek.hidden) { running = false; return; }
  requestAnimationFrame(loop);
  const target = t < talkUntil ? 0.3 + 0.5 * Math.abs(Math.sin(t / 60)) : 0;
  level += (target - level) * 0.2;
  const r = canvas.getBoundingClientRect();
  const lean = {
    x: clamp((pointer.x - r.left - r.width / 2) / 140),
    y: clamp((pointer.y - r.top - r.height * 0.45) / 110),
  };
  let blink = 1;
  if (!RM && t > blinkAt) { blink = 0.12; if (t > blinkAt + 130) blinkAt = t + 2200 + Math.random() * 2600; }
  fig.draw({ t, level, lean, blink, body: null, rm: RM, age: RM ? 9 : (t - born) / 650, bodyAge: 9, breath: 0 });
}

for (const btn of [orb, dockBtn]) {
  btn.addEventListener("pointerenter", (e) => { if (e.pointerType === "mouse") show(btn); });
  btn.addEventListener("pointerleave", hideSoon);
  btn.addEventListener("focus", () => { if (btn.matches(":focus-visible")) show(btn); });
  btn.addEventListener("blur", hideSoon);
  btn.addEventListener("click", hide); // the dock icon's own click opens Ari (desktop.js)
}
peek.addEventListener("pointerenter", () => clearTimeout(hideTimer));
peek.addEventListener("pointerleave", hideSoon);
peek.addEventListener("click", () => { hide(); openApp("ari"); });
addEventListener("keydown", (e) => { if (e.key === "Escape") hide(); });

/* the orb wakes Ari or brings it forward; already in front, a click sends it away */
orb.addEventListener("click", () => (onScreen() && ariWin().classList.contains("focused") ? closeApp("ari") : openApp("ari")));
const sync = () => orb.setAttribute("aria-pressed", String(isOpen("ari")));
["app:open", "app:close"].forEach((ev) => document.addEventListener(ev, sync));
