/* Window manager: open, focus, drag, resize, minimize, maximize, close.
   Windows are built from <template data-app="id"> in index.html. */

const layer = document.getElementById("windows");
const open = new Map(); // appId -> window element
let zTop = 20;
let cascade = 0;

const MENUBAR_H = 36;
const DOCK_SAFE = 104; // keep windows clear of the dock
const GAP = 16;
const MIN_ROOM = 520; // narrower than this beside Ari, and zoom just goes full screen
const MIN_LIST = 200; // narrower than this, and a window opened beside Ari opens as usual
const RM = matchMedia("(prefers-reduced-motion: reduce)").matches;
const PHONE = matchMedia("(max-width: 760px)");
const isTouchLayout = () => PHONE.matches;

export function isOpen(id) {
  return open.has(id);
}

export function focusWindow(el) {
  if (staged(el)) return present(el);
  raise(el);
}

function raise(el) {
  const changed = el.dataset.z != zTop;
  if (changed) el.style.zIndex = el.dataset.z = ++zTop;
  for (const w of open.values()) w.classList.toggle("focused", w === el);
  if (changed) document.dispatchEvent(new CustomEvent("app:focus", { detail: el.dataset.app }));
}

/* `join`: the window joins the set on stage (how Ari opens things beside
   itself) instead of sending that set to the strip */
export function openApp(id, { join = false } = {}) {
  const existing = open.get(id);
  if (existing) {
    if (isTouchLayout()) return switchTo(existing), existing;
    const lead = front();
    if (join && lead && lead !== existing) existing.dataset.group = lead.dataset.group; // moves into Ari's set
    if (staged(existing) || existing.hidden) present(existing);
    else raise(existing);
    return existing;
  }

  const tpl = document.querySelector(`template[data-app="${id}"]`);
  if (!tpl) return null;

  const title = tpl.dataset.title || id;
  const el = document.createElement("section");
  el.className = "window focused";
  el.dataset.app = id;
  el.dataset.title = title;
  if (tpl.dataset.nav) el.dataset.nav = tpl.dataset.nav;
  el.setAttribute("role", "dialog");
  el.setAttribute("aria-label", title);
  el.innerHTML = chrome(title);
  el.querySelector(".win-body").append(tpl.content.cloneNode(true));

  if (tpl.dataset.width) el.style.width = tpl.dataset.width + "px";
  if (tpl.dataset.height) el.style.height = tpl.dataset.height + "px";

  const lead = front();
  if (isTouchLayout()) hideOthers(el);
  else if (join && lead) el.dataset.group = lead.dataset.group;
  else {
    el.dataset.group = String(++groupSeq);
    stageAside(el.dataset.group);
  }

  place(el, tpl);
  layer.append(el);
  open.set(id, el);
  wire(el);
  raise(el);
  checkCover();

  document.dispatchEvent(new CustomEvent("app:open", { detail: id }));
  return el;
}

export function closeApp(id) {
  const el = open.get(id);
  if (!el) return;
  el.classList.add("closing");
  /* animationend can fail to fire (background tab, interrupted animation),
     which would leave the element orphaned in the DOM — so time it out too. */
  const drop = () => el.remove();
  el.addEventListener("animationend", drop, { once: true });
  setTimeout(drop, 400);
  open.delete(id);
  layoutStrip();
  document.dispatchEvent(new CustomEvent("app:close", { detail: id }));
}

/* ---------- construction ---------- */

function chrome(title) {
  return `
    <header class="titlebar">
      <button class="tb-back" type="button">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg>
        <span class="b-home">Home</span><span class="b-back">Back</span>
      </button>
      <div class="traffic">
        <button class="tl-close" aria-label="Close window"></button>
        <button class="tl-min" aria-label="Minimize window"></button>
        <button class="tl-max" aria-label="Zoom window"></button>
      </div>
      <div class="title">${title}</div>
    </header>
    <div class="win-body"></div>
    <div class="grip" aria-hidden="true"></div>`;
}

function place(el, tpl) {
  const w = parseInt(tpl.dataset.width) || 880;
  const h = parseInt(tpl.dataset.height) || 560;
  const maxW = Math.min(w, innerWidth - 28);
  const maxH = Math.min(h, innerHeight - MENUBAR_H - DOCK_SAFE);
  const step = (cascade++ % 5) * 26;
  const lowest = innerHeight - DOCK_SAFE - maxH; // any lower and the cascade tucks tall windows under the dock
  const room = strip.length ? STRIP_ROOM : 14; // centre right of the strip while it shows

  const ideal = room + (innerWidth - room - 14 - maxW) / 2 + step - 52;
  el.style.left = Math.max(14, Math.min(innerWidth - maxW - 14, ideal)) + "px";
  el.style.top = Math.max(MENUBAR_H + 12, Math.min(lowest, lowest / 2 + step - 40)) + "px";
}

/* ---------- behaviour ---------- */

function wire(el) {
  const bar = el.querySelector(".titlebar");

  // a thumbnail in the strip is one big button: the click swaps it back on stage
  el.addEventListener("pointerdown", (e) => {
    if (!staged(el)) return;
    e.stopImmediatePropagation();
    e.preventDefault();
    present(el);
  }, true);
  el.addEventListener("keydown", (e) => {
    if (staged(el) && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); present(el); }
  });

  el.addEventListener("pointerdown", () => focusWindow(el), true);
  el.querySelector(".tl-close").addEventListener("click", () => closeApp(el.dataset.app));
  el.querySelector(".tl-min").addEventListener("click", () => minimize(el));
  el.querySelector(".tl-max").addEventListener("click", () => toggleZoom(el));
  el.querySelector(".tb-back").addEventListener("click", () => back(el));
  bar.addEventListener("dblclick", (e) => {
    if (!e.target.closest(".traffic")) toggleZoom(el);
  });

  if (isTouchLayout()) return; // no dragging or resizing on phones
  drag(bar, el);
  resize(el.querySelector(".grip"), el);
}

/* phones: Back leaves a detail view; at the top level it closes the app,
   which lands on the home screen like any phone app */
function back(el) {
  if (!el.classList.contains("in-detail")) return closeApp(el.dataset.app);
  el.classList.remove("in-detail");
  if (el.dataset.nav !== "list") el.querySelector(".sb-item")?.click(); // back to the first pane
}

function drag(handle, el) {
  handle.addEventListener("pointerdown", (e) => {
    if (e.target.closest(".traffic") || el.classList.contains("maximized")) return;
    const startX = e.clientX - el.offsetLeft;
    const startY = e.clientY - el.offsetTop;
    handle.setPointerCapture(e.pointerId);

    const move = (ev) => {
      const maxX = innerWidth - 60;
      el.style.left = Math.min(maxX, Math.max(60 - el.offsetWidth, ev.clientX - startX)) + "px";
      el.style.top = Math.min(innerHeight - 40, Math.max(MENUBAR_H, ev.clientY - startY)) + "px";
    };
    const up = () => {
      handle.removeEventListener("pointermove", move);
      handle.removeEventListener("pointerup", up);
      checkCover();
    };
    handle.addEventListener("pointermove", move);
    handle.addEventListener("pointerup", up);
  });
}

function resize(grip, el) {
  grip.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    const startW = el.offsetWidth;
    const startH = el.offsetHeight;
    const startX = e.clientX;
    const startY = e.clientY;
    grip.setPointerCapture(e.pointerId);

    const move = (ev) => {
      el.style.width = Math.max(420, startW + ev.clientX - startX) + "px";
      el.style.height = Math.max(280, startH + ev.clientY - startY) + "px";
      el.style.maxWidth = el.style.maxHeight = "none";
    };
    const up = () => {
      grip.removeEventListener("pointermove", move);
      grip.removeEventListener("pointerup", up);
      checkCover();
    };
    grip.addEventListener("pointermove", move);
    grip.addEventListener("pointerup", up);
  });
}

function minimize(el) {
  el.classList.add("minimized");
  el.addEventListener("animationend", () => {
    el.hidden = true;
    el.classList.remove("minimized");
    checkCover();
  }, { once: true });
}

function restore(el) {
  el.hidden = false;
  el.style.animation = "none";
  requestAnimationFrame(() => (el.style.animation = ""));
}

function toggleZoom(el) {
  const on = el.classList.toggle("maximized");
  if (on) {
    el.dataset.prev = JSON.stringify({
      left: el.style.left, top: el.style.top,
      width: el.style.width, height: el.style.height,
    });
    const room = roomBesideAri(el);
    el.classList.toggle("tiled", !!room);
    Object.assign(el.style, room || {
      left: "0px",
      top: MENUBAR_H + "px",
      width: "100vw",
      height: `calc(100vh - ${MENUBAR_H}px)`,
    }, { maxWidth: "none", maxHeight: "none" });
  } else {
    el.classList.remove("tiled");
    const p = JSON.parse(el.dataset.prev || "{}");
    Object.assign(el.style, { ...p, maxWidth: "", maxHeight: "" });
  }
  checkCover();
  document.dispatchEvent(new CustomEvent("app:zoom", { detail: { id: el.dataset.app, on } }));
}

/* ---------- Stage Manager ----------
   One set of windows is on stage. Opening another app slides that set into a
   strip of live thumbnails down the left edge; clicking a thumbnail swaps it
   back. Windows Ari opens beside itself join its set. Off on phones, where
   one app fills the screen at a time. */

const STRIP_X = 20; // thumbnails' left edge
const STRIP_W = 150; // a thumbnail's width budget
const SLOT_H = 112; // vertical pitch per set
const STRIP_ROOM = STRIP_X + STRIP_W + 30; // windows start right of this while the strip shows
let strip = []; // staged sets, newest first, as group ids
let groupSeq = 0;

const staged = (w) => w.classList.contains("staged");
const onStage = () => [...open.values()].filter((w) => !w.hidden && !staged(w));
const members = (g) => [...open.values()].filter((w) => w.dataset.group === g);
const front = () => onStage().reduce((a, b) => (!a || +b.dataset.z > +a.dataset.z ? b : a), null);

/* everything on stage except group `keep` slides into the strip */
function stageAside(keep) {
  for (const w of onStage()) {
    if (w.dataset.group === keep) continue;
    w.classList.add("staged");
    w.classList.remove("focused", "minimized");
    w.setAttribute("role", "button");
    w.setAttribute("aria-label", `Show ${w.dataset.title}`);
    w.tabIndex = 0;
    strip = [w.dataset.group, ...strip.filter((g) => g !== w.dataset.group)];
  }
  layoutStrip();
}

/* bring a staged or minimised window — with the rest of its set — on stage */
function present(el) {
  const g = el.dataset.group;
  stageAside(g);
  strip = strip.filter((x) => x !== g);
  const set = members(g);
  for (const w of set) {
    if (w.hidden) restore(w);
    w.classList.remove("staged");
    w.setAttribute("role", "dialog");
    w.setAttribute("aria-label", w.dataset.title);
    w.removeAttribute("tabindex");
    w.style.zIndex = w.dataset.z;
  }
  for (const w of set) if (w !== el) raise(w);
  raise(el);
  layoutStrip();
}

function layoutStrip() {
  strip = strip.filter((g) => members(g).length);
  const top = MENUBAR_H + 64;
  const slots = Math.max(1, Math.floor((innerHeight - top - DOCK_SAFE) / SLOT_H));
  strip.forEach((g, i) => {
    members(g).forEach((w, j) => {
      const s = Math.min(STRIP_W / w.offsetWidth, (SLOT_H - 24) / w.offsetHeight);
      const x = STRIP_X + j * 12;
      const y = top + i * SLOT_H + j * 8;
      w.style.setProperty("--stage", `translate(${x - w.offsetLeft}px, ${y - w.offsetTop}px) scale(${s.toFixed(4)})`);
      w.style.zIndex = 10 - i; // under the stage, newest set on top
      w.classList.toggle("stage-spill", i >= slots);
    });
  });
  checkCover();
}

/* a window over the strip hides it, as on a Mac; the left edge brings it back */
function checkCover() {
  const covered = strip.length > 0 && onStage().some((w) => w.offsetLeft < STRIP_ROOM - 10);
  layer.classList.toggle("strip-covered", covered);
  if (!covered) layer.classList.remove("strip-peek");
}

addEventListener("pointermove", (e) => {
  if (!layer.classList.contains("strip-covered")) return;
  const peeking = layer.classList.contains("strip-peek");
  if (!peeking && e.clientX < 12) layer.classList.add("strip-peek");
  else if (peeking && e.clientX > STRIP_ROOM + 24) layer.classList.remove("strip-peek");
}, { passive: true });

addEventListener("resize", () => strip.length && layoutStrip());

/* phones show one app at a time: the others wait, hidden, until their dock icon */
function hideOthers(el) {
  for (const w of open.values()) if (w !== el) w.hidden = true;
}

function switchTo(el) {
  hideOthers(el);
  if (el.hidden) restore(el);
  raise(el);
}

/* crossing onto a phone layout: the strip's sets just become background apps */
PHONE.addEventListener("change", () => {
  if (!PHONE.matches) return;
  for (const w of open.values()) {
    if (!staged(w)) continue;
    w.classList.remove("staged");
    w.setAttribute("role", "dialog");
    w.setAttribute("aria-label", w.dataset.title);
    w.removeAttribute("tabindex");
    w.hidden = true;
  }
  strip = [];
  checkCover();
});

/* ---------- Ari stays in view ----------
   Ari is a companion, so other windows make room for it instead of covering
   it: Ari docks to the right edge and the other window takes the space beside. */

const overlaps = (a, b) => {
  const r = a.getBoundingClientRect(), s = b.getBoundingClientRect();
  return r.left < s.right && s.left < r.right && r.top < s.bottom && s.top < r.bottom;
};

function slide(el, left, top) {
  const dx = el.offsetLeft - left, dy = el.offsetTop - top;
  el.style.left = left + "px";
  el.style.top = top + "px";
  if (!RM && (dx || dy)) {
    el.animate([{ transform: `translate(${dx}px, ${dy}px)` }, { transform: "none" }],
      { duration: 420, easing: "cubic-bezier(0.22, 0.61, 0.36, 1)" });
  }
}

/* the visible Ari window, or null on phones (windows stack full screen there) */
function companion(el) {
  const ari = open.get("ari");
  return ari && ari !== el && !ari.hidden && !staged(ari) && !isTouchLayout() ? ari : null;
}

/* where Ari's left edge sits when docked right */
const dockX = (ari) => innerWidth - ari.offsetWidth - GAP;

/* slide Ari to the right edge, keeping its height on screen */
function dockAri(ari) {
  const top = Math.min(Math.max(ari.offsetTop, MENUBAR_H + 12), innerHeight - DOCK_SAFE - ari.offsetHeight);
  slide(ari, dockX(ari), Math.max(MENUBAR_H + 12, top));
}

function roomBesideAri(el) {
  const ari = companion(el);
  if (!ari) return null;
  const width = dockX(ari) - GAP * 2;
  if (width < MIN_ROOM) return null;
  dockAri(ari);
  return {
    left: GAP + "px",
    top: MENUBAR_H + 12 + "px",
    width: width + "px",
    height: innerHeight - MENUBAR_H - 12 - DOCK_SAFE + "px",
  };
}

/* Show `el` as a `width`-wide column beside Ari, tops aligned — how Ari opens
   Projects. Leaves the two alone if they already sit side by side. Returns
   whether they now do: never on phones, or on screens too narrow for both. */
export function besideAri(el, width) {
  const ari = companion(el);
  if (!ari) return false;
  if (!overlaps(el, ari)) return true;
  const x = dockX(ari);
  const w = Math.min(width, x - GAP * 2);
  if (w < MIN_LIST) return false;
  el.classList.remove("maximized", "tiled");
  dockAri(ari);
  Object.assign(el.style, {
    left: x - GAP - w + "px",
    top: ari.style.top,
    width: w + "px",
    height: ari.offsetHeight + "px",
    maxWidth: "",
    maxHeight: "",
  });
  checkCover();
  return true;
}

/* back to the size it opened at, nudged fully onto the desk */
export function resetSize(el) {
  const { width, height } = document.querySelector(`template[data-app="${el.dataset.app}"]`).dataset;
  Object.assign(el.style, { width: width + "px", height: height + "px" });
  el.style.left = Math.max(14, Math.min(el.offsetLeft, innerWidth - el.offsetWidth - 14)) + "px";
  el.style.top = Math.max(MENUBAR_H + 12, Math.min(el.offsetTop, innerHeight - DOCK_SAFE - el.offsetHeight)) + "px";
  checkCover();
}

/* Escape closes the front window — cheap keyboard exit. */
addEventListener("keydown", (e) => {
  if (e.key !== "Escape") return;
  const f = front();
  if (f) closeApp(f.dataset.app);
});
