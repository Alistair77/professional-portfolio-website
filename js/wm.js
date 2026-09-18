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
const isTouchLayout = () => window.matchMedia("(max-width: 760px)").matches;

export function isOpen(id) {
  return open.has(id);
}

export function focusWindow(el) {
  if (el.dataset.z == zTop) return;
  el.style.zIndex = el.dataset.z = ++zTop;
  for (const w of open.values()) w.classList.toggle("focused", w === el);
  document.dispatchEvent(new CustomEvent("app:focus", { detail: el.dataset.app }));
}

export function openApp(id) {
  const existing = open.get(id);
  if (existing) {
    if (existing.hidden) restore(existing);
    focusWindow(existing);
    return existing;
  }

  const tpl = document.querySelector(`template[data-app="${id}"]`);
  if (!tpl) return null;

  const el = document.createElement("section");
  el.className = "window focused";
  el.dataset.app = id;
  el.setAttribute("role", "dialog");
  el.setAttribute("aria-label", tpl.dataset.title || id);
  el.innerHTML = chrome(tpl.dataset.title || id) ;
  el.querySelector(".win-body").append(tpl.content.cloneNode(true));

  if (tpl.dataset.width) el.style.width = tpl.dataset.width;
  if (tpl.dataset.height) el.style.height = tpl.dataset.height;

  place(el, tpl);
  layer.append(el);
  open.set(id, el);
  wire(el);
  focusWindow(el);

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
  document.dispatchEvent(new CustomEvent("app:close", { detail: id }));
}

/* ---------- construction ---------- */

function chrome(title) {
  return `
    <header class="titlebar">
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

  el.style.left = Math.max(14, (innerWidth - maxW) / 2 + step - 52) + "px";
  el.style.top = Math.max(MENUBAR_H + 12, (innerHeight - DOCK_SAFE - maxH) / 2 + step - 40) + "px";
}

/* ---------- behaviour ---------- */

function wire(el) {
  const bar = el.querySelector(".titlebar");

  el.addEventListener("pointerdown", () => focusWindow(el), true);
  el.querySelector(".tl-close").addEventListener("click", () => closeApp(el.dataset.app));
  el.querySelector(".tl-min").addEventListener("click", () => minimize(el));
  el.querySelector(".tl-max").addEventListener("click", () => toggleZoom(el));
  bar.addEventListener("dblclick", (e) => {
    if (!e.target.closest(".traffic")) toggleZoom(el);
  });

  if (isTouchLayout()) return; // no dragging or resizing on phones
  drag(bar, el);
  resize(el.querySelector(".grip"), el);
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
  document.dispatchEvent(new CustomEvent("app:zoom", { detail: { id: el.dataset.app, on } }));
}

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
  return ari && ari !== el && !ari.hidden && !isTouchLayout() ? ari : null;
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
  return true;
}

/* Escape closes the front window — cheap keyboard exit. */
addEventListener("keydown", (e) => {
  if (e.key !== "Escape" || !open.size) return;
  const front = [...open.values()].reduce((a, b) => (+a.dataset.z > +b.dataset.z ? a : b));
  closeApp(front.dataset.app);
});
