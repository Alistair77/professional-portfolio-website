/* Concept: the warp, on the two moments that earn it — summoning Ari, and
   "Let's talk". concepts/warp.html loads this into the real portfolio; nothing
   in the site itself changes. Motion is transform and opacity only, and the
   soft glows are radial gradients rather than blur filters, so it all stays on
   the compositor. */

import { closeApp, isOpen } from "../js/wm.js";

const RM = matchMedia("(prefers-reduced-motion: reduce)").matches;
const EASE = "cubic-bezier(0.59, 0, 0.35, 1)";
const IN_MS = 350;
const OUT_MS = 300; // the window manager removes a closing window at 400ms
const WARPED = "perspective(1000px) rotateX(-5deg) skewY(-1.5deg) scale(0.4, 2)";
const FLAT = "perspective(1000px) rotateX(0deg) skewY(0deg) scale(1, 1)";

/* each moment in its owner's colours: Ari's violet, Contact's green */
const THEMES = {
  ari: { core: "#F1ECFF", glow: "rgba(139, 107, 255, 0.85)", blobs: ["rgba(139, 107, 255, 0.5)", "rgba(143, 227, 255, 0.3)"], modal: false },
  contact: { core: "#E6FFEE", glow: "rgba(18, 168, 92, 0.85)", blobs: ["rgba(18, 168, 92, 0.45)", "rgba(90, 200, 200, 0.3)"], modal: true },
};

/* the drop settles on a spring (damping 0.8, ~0.7s to arrive), sampled into linear() */
const SPRING = (() => {
  if (!CSS.supports("animation-timing-function", "linear(0, 1)")) {
    return { duration: 700, easing: "cubic-bezier(0.34, 1.3, 0.64, 1)" };
  }
  const zeta = 0.8, total = 1.1;
  const wd = (Math.PI - Math.atan(Math.sqrt(1 - zeta ** 2) / zeta)) / 0.7;
  const w = wd / Math.sqrt(1 - zeta ** 2);
  const pts = Array.from({ length: 45 }, (_, i) => {
    const t = (i / 44) * total;
    return (1 - Math.exp(-zeta * w * t) * (Math.cos(wd * t) + ((zeta * w) / wd) * Math.sin(wd * t))).toFixed(4);
  });
  pts[pts.length - 1] = "1";
  return { duration: total * 1000, easing: `linear(${pts.join(", ")})` };
})();

const style = document.createElement("style");
style.textContent = `
  .warp-stage { position: fixed; inset: 0; overflow: hidden; pointer-events: none; }
  .warp-stage.modal { pointer-events: auto; cursor: pointer; }
  .warp-dim { position: absolute; inset: 0; background: rgba(3, 5, 10, 0.42); opacity: 0; }
  .warp-bloom, .warp-blob { position: absolute; border-radius: 50%; will-change: transform, opacity; }
  .warp-bloom { width: 50vmax; height: 50vmax; margin: -25vmax 0 0 -25vmax;
    background: radial-gradient(circle closest-side, var(--core), var(--glow) 45%, transparent); }
  .warp-blob { width: 100vmax; height: 100vmax; opacity: 0;
    background: radial-gradient(circle closest-side, var(--c), transparent); }
`;
document.head.append(style);

let enabled = true;
const open = new Map(); // appId -> the stage behind a modal

/* the warp comes out of whatever was just clicked: dock icon, orb, face card, menu */
let origin = null;
document.addEventListener("click", (e) => {
  const r = e.target.getBoundingClientRect?.();
  if (r) origin = { x: r.left + r.width / 2, y: r.top + r.height / 2, at: performance.now() };
}, true);
const originNow = () => (origin && performance.now() - origin.at < 800 ? origin : { x: innerWidth / 2, y: innerHeight });

function iconOf(id) {
  const r = document.querySelector(`.dock-item[data-app="${id}"]`)?.getBoundingClientRect();
  return r ? { x: r.left + r.width / 2, y: r.top + r.height / 2 } : { x: innerWidth / 2, y: innerHeight };
}

function layer(parent, cls, css = {}) {
  const el = document.createElement("div");
  el.className = cls;
  for (const [k, v] of Object.entries(css)) el.style.setProperty(k, v);
  parent.append(el);
  return el;
}

/* bloom + glows, one layer beneath the window they belong to */
function stage(win, theme, at) {
  const s = layer(document.getElementById("windows"), "warp-stage" + (theme.modal ? " modal" : ""), {
    "z-index": String((+win.style.zIndex || 20) - 1), "--core": theme.core, "--glow": theme.glow,
  });
  return {
    s,
    dim: theme.modal ? layer(s, "warp-dim") : null,
    bloom: layer(s, "warp-bloom", { left: at.x + "px", top: at.y + "px" }),
    blobs: theme.blobs.map((c, i) => layer(s, "warp-blob", { left: i ? "50%" : "-50%", top: i ? "25%" : "-25%", "--c": c })),
  };
}

function warp(win, entering) {
  win.style.animation = "none"; // stands in for the default open / close animation
  win.style.transformOrigin = "50% 0";
  const shape = [{ transform: WARPED, opacity: 0 }, { transform: FLAT, opacity: 1 }];
  const drop = [{ translate: "0 100px" }, { translate: "0 0" }];
  if (entering) {
    win.animate(shape, { duration: IN_MS, easing: EASE });
    win.animate(drop, SPRING).finished.then(() => { win.style.transformOrigin = ""; }, () => {});
  } else {
    win.animate(shape.reverse(), { duration: OUT_MS, easing: EASE, fill: "forwards" });
    win.animate(drop.reverse(), { duration: OUT_MS, easing: EASE, fill: "forwards" });
  }
}

/* a modal sits in the middle of the room, not wherever the cascade put it */
function centre(win) {
  if (matchMedia("(max-width: 760px)").matches) return; // phones already fill the screen
  win.style.left = Math.max(12, (innerWidth - win.offsetWidth) / 2) + "px";
  win.style.top = Math.max(48, (innerHeight - 104 - win.offsetHeight) / 2 + 18) + "px";
}

document.addEventListener("app:open", (e) => {
  const id = e.detail, theme = THEMES[id];
  const win = document.querySelector(`.window[data-app="${id}"]`);
  if (!enabled || RM || !theme || !win) return;
  if (theme.modal) centre(win);

  const st = stage(win, theme, originNow());
  st.bloom.animate([{ transform: "scale(0)", opacity: 1 }, { transform: "scale(10)", opacity: 0.2 }],
    { duration: 500, easing: "ease-in-out", fill: "forwards" });
  for (const b of st.blobs) {
    b.animate([{ opacity: 0 }, { opacity: theme.modal ? 0.9 : 0.7 }], { duration: 500, fill: "forwards" });
    b.animate([{ transform: "scale(1)" }, { transform: "scale(0.7)" }, { transform: "scale(1)" }],
      { duration: 15000, delay: 350, iterations: Infinity, easing: "ease-in-out" });
  }
  st.dim?.animate([{ opacity: 0 }, { opacity: 1 }], { duration: IN_MS, fill: "forwards" });
  warp(win, true);

  if (theme.modal) {
    open.set(id, st);
    st.s.addEventListener("click", () => closeApp(id)); // click outside sends it back
  } else {
    // Ari isn't modal: the summon flares, then the desktop is the desktop again
    st.s.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 900, delay: 600, easing: "ease-out", fill: "forwards" })
      .finished.then(() => st.s.remove(), () => st.s.remove());
  }
});

document.addEventListener("app:close", (e) => {
  const id = e.detail, theme = THEMES[id];
  const win = document.querySelector(`.window.closing[data-app="${id}"]`);
  if (!enabled || RM || !theme || !win) return;
  warp(win, false);

  // a modal's bloom folds back into itself; Ari's folds back into its dock icon
  const st = open.get(id) || stage(win, theme, iconOf(id));
  open.delete(id);
  st.bloom.animate([{ transform: "scale(10)", opacity: 0.2 }, { transform: "scale(0)", opacity: 1 }],
    { duration: 250, easing: "ease-in", fill: "forwards" });
  for (const b of st.blobs) b.animate([{ opacity: getComputedStyle(b).opacity }, { opacity: 0 }], { duration: 250, fill: "forwards" });
  st.dim?.animate([{ opacity: 1 }, { opacity: 0 }], { duration: OUT_MS, fill: "forwards" });
  setTimeout(() => st.s.remove(), OUT_MS + 20);
});

/* for the concept page's buttons */
window.warpConcept = {
  set(on) { enabled = on; },
  play(id) {
    const btn = document.querySelector(`.dock-item[data-app="${id}"]`);
    if (!isOpen(id)) { btn?.click(); return; }
    closeApp(id); // watch it leave, then come back
    setTimeout(() => btn?.click(), 480);
  },
};
