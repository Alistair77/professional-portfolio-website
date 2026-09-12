/* Window manager: open, focus, drag, resize, minimize, maximize, close.
   Windows are built from <template data-app="id"> in index.html. */

const layer = document.getElementById("windows");
const open = new Map(); // appId -> window element
let zTop = 20;
let cascade = 0;

const MENUBAR_H = 36;
const DOCK_SAFE = 104; // keep windows clear of the dock
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
  el.addEventListener("animationend", () => el.remove(), { once: true });
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
    Object.assign(el.style, {
      left: "0px",
      top: MENUBAR_H + "px",
      width: "100vw",
      height: `calc(100vh - ${MENUBAR_H}px)`,
      maxWidth: "none",
      maxHeight: "none",
    });
  } else {
    const p = JSON.parse(el.dataset.prev || "{}");
    Object.assign(el.style, { ...p, maxWidth: "", maxHeight: "" });
  }
}

/* Escape closes the front window — cheap keyboard exit. */
addEventListener("keydown", (e) => {
  if (e.key !== "Escape" || !open.size) return;
  const front = [...open.values()].reduce((a, b) => (+a.dataset.z > +b.dataset.z ? a : b));
  closeApp(front.dataset.app);
});
