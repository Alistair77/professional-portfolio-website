/* Desktop shell: clock, menu bar menus, dock magnification + state, terminal. */

import { openApp, closeApp, isOpen } from "./wm.js";
import { renderProjects } from "./projects.js";

/* ---------- clock ---------- */
const clock = document.querySelector(".mb-clock");
const fmt = new Intl.DateTimeFormat(undefined, {
  weekday: "short", month: "short", day: "numeric",
  hour: "numeric", minute: "2-digit",
});

function tick() {
  clock.textContent = fmt.format(new Date()).replace(/,/g, "");
}
tick();
/* align to the minute boundary so the displayed time is never stale */
const scheduleTick = () => setTimeout(() => { tick(); scheduleTick(); }, 60_000 - (Date.now() % 60_000));
scheduleTick();

/* ---------- dock ---------- */
const dock = document.querySelector(".dock");
const items = [...dock.querySelectorAll(".dock-item")];

items.forEach((btn) => {
  btn.addEventListener("click", () => {
    const id = btn.dataset.app;
    if (!id) return;
    if (!isOpen(id)) {
      btn.classList.add("bouncing");
      btn.addEventListener("animationend", () => btn.classList.remove("bouncing"), { once: true });
    }
    openApp(id);
  });
});

/* Magnification. Distance falloff from the cursor, the one detail that
   makes a dock read as a dock rather than a toolbar. */
const MAX_SCALE = 1.42;
const REACH = 105; // px of influence either side

dock.addEventListener("pointermove", (e) => {
  for (const btn of items) {
    const r = btn.getBoundingClientRect();
    const d = Math.abs(e.clientX - (r.left + r.width / 2));
    const f = Math.max(0, 1 - d / REACH);
    const scale = 1 + (MAX_SCALE - 1) * f * f;
    btn.style.transform = `scale(${scale}) translateY(${-8 * (scale - 1) * 10}%)`;
  }
});

dock.addEventListener("pointerleave", () => {
  for (const btn of items) btn.style.transform = "";
});

/* running dots follow real window state */
const syncDock = () => {
  for (const btn of items) {
    btn.classList.toggle("running", !!btn.dataset.app && isOpen(btn.dataset.app));
  }
};
["app:open", "app:close"].forEach((ev) => document.addEventListener(ev, syncDock));

/* ---------- desktop icons ---------- */
document.querySelectorAll("[data-open]").forEach((el) => {
  el.addEventListener("click", () => openApp(el.dataset.open));
});

/* ---------- menu bar dropdowns ---------- */
const menus = [...document.querySelectorAll(".mb-item[data-menu]")];
const sheet = document.querySelector(".mb-menu");
let current = null;

function closeMenu() {
  sheet.hidden = true;
  menus.forEach((m) => m.setAttribute("aria-expanded", "false"));
  current = null;
}

function showMenu(btn) {
  const src = document.getElementById(btn.dataset.menu);
  if (!src) return;
  sheet.innerHTML = src.innerHTML;
  sheet.hidden = false;
  sheet.style.left = Math.min(innerWidth - 240, btn.getBoundingClientRect().left) + "px";
  btn.setAttribute("aria-expanded", "true");
  current = btn;

  sheet.querySelectorAll("[data-action]").forEach((b) => {
    b.addEventListener("click", () => {
      run(b.dataset.action);
      closeMenu();
    });
  });
}

menus.forEach((btn) => {
  btn.addEventListener("click", (e) => {
    e.stopPropagation();
    const wasOpen = current === btn;
    closeMenu();
    if (!wasOpen) showMenu(btn);
  });
  // once a menu is open, hovering the others switches to them
  btn.addEventListener("pointerenter", () => {
    if (current && current !== btn) { closeMenu(); showMenu(btn); }
  });
});

document.addEventListener("click", (e) => {
  if (current && !e.target.closest(".mb-menu")) closeMenu();
});
addEventListener("keydown", (e) => e.key === "Escape" && current && closeMenu());

function run(action) {
  const [verb, arg] = action.split(":");
  if (verb === "open") openApp(arg);
  if (verb === "close") closeApp(arg);
  if (verb === "closeAll") document.querySelectorAll(".window").forEach((w) => closeApp(w.dataset.app));
  if (verb === "link") window.open(arg, "_blank", "noopener");
}

/* ---------- in-window navigation (sidebar tabs) ---------- */
document.addEventListener("click", (e) => {
  const tab = e.target.closest(".sb-item[data-pane]");
  if (!tab) return;
  const body = tab.closest(".win-body");
  body.querySelectorAll(".sb-item").forEach((b) => b.setAttribute("aria-selected", String(b === tab)));
  body.querySelectorAll(".pane").forEach((p) => (p.hidden = p.dataset.pane !== tab.dataset.pane));
  body.querySelector(".content").scrollTop = 0;
});

/* project rows jump to the project pane */
document.addEventListener("click", (e) => {
  const row = e.target.closest(".row[data-pane]");
  if (!row) return;
  const tab = row.closest(".win-body").querySelector(`.sb-item[data-pane="${row.dataset.pane}"]`);
  tab?.click();
});

/* ---------- projects are rendered from data (js/projects.js) ---------- */
document.addEventListener("app:open", (e) => {
  if (e.detail !== "projects") return;
  const body = document.querySelector('.window[data-app="projects"] .win-body');
  if (body && !body.dataset.rendered) {
    renderProjects(body);
    body.dataset.rendered = "1";
  }
});

/* project cards jump to their detail pane */
document.addEventListener("click", (e) => {
  const card = e.target.closest(".pcard[data-pane]");
  if (!card) return;
  card.closest(".win-body").querySelector(`.sb-item[data-pane="${card.dataset.pane}"]`)?.click();
});

/* ---------- terminal typing ---------- */
const TYPE_MS = 16;
document.addEventListener("app:open", (e) => {
  if (e.detail !== "terminal") return;
  const pre = document.querySelector('.window[data-app="terminal"] .terminal');
  if (!pre || pre.dataset.typed) return;
  pre.dataset.typed = "1";

  const html = pre.innerHTML.trim();
  pre.innerHTML = "";
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
    pre.innerHTML = html;
    return;
  }

  // type by token so tags land intact
  const tokens = html.match(/<[^>]+>|[\s\S]/g) || [];
  let i = 0;
  const step = () => {
    if (i >= tokens.length) return;
    let chunk = "";
    for (let n = 0; n < 3 && i < tokens.length; n++) chunk += tokens[i++];
    pre.insertAdjacentHTML("beforeend", chunk);
    pre.scrollTop = pre.scrollHeight;
    setTimeout(step, TYPE_MS);
  };
  step();
});

/* ---------- keyboard shortcuts ----------
   These are advertised in the menus, so they have to actually work. */
const SHORTCUTS = {
  r: () => openApp("resume"),
  k: () => openApp("contact"),
  1: () => openApp("projects"),
};

addEventListener("keydown", (e) => {
  if (!(e.metaKey || e.ctrlKey)) return;
  const key = e.key.toLowerCase();

  if (e.altKey && key === "w") {
    e.preventDefault();
    document.querySelectorAll(".window").forEach((w) => closeApp(w.dataset.app));
    return;
  }
  const fn = !e.altKey && SHORTCUTS[key];
  if (fn) { e.preventDefault(); fn(); }
});

/* ---------- boot ---------- */
addEventListener("load", () => {
  requestAnimationFrame(() => document.body.classList.remove("booting"));
  const first = new URLSearchParams(location.search).get("app") || "about";
  setTimeout(() => openApp(first), 620);
});
