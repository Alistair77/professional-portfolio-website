/* The terminal: a static session transcript, typed out on open, with a live
   prompt underneath. Anything typed gets a friendly nudge rather than a
   command language nobody can guess. The work listing is derived from the
   shared PROJECTS data, so it can never drift from the Projects window. */

import { PROJECTS } from "./projects.js?v=5";

const REPOS = PROJECTS.filter((p) => p.group === "ai").map((p) => p.id + "/");

/* lay the repo names out in rows of three, like real ls output */
const lsRows = () => {
  const w = Math.max(...REPOS.map((r) => r.length)) + 3;
  const rows = [];
  for (let i = 0; i < REPOS.length; i += 3) {
    rows.push(REPOS.slice(i, i + 3).map((r) => r.padEnd(w)).join("").trimEnd());
  }
  return rows;
};

const PS = '<span class="u">alistair@cosmos</span>:<span class="p">~</span>$ ';

const SESSION = [
  PS + "whoami",
  "AI · Data · UX engineer. I build AI that ships.",
  "",
  PS + "cat principles.txt",
  '<span class="c"># the short version</span>',
  '1. Retrieval problems wear a "the model is wrong" costume.',
  "2. If you can't measure it, you didn't improve it.",
  "3. Keep a human in front of the expensive actions.",
  "4. A pipeline nobody can steer is a demo, not a product.",
  "5. Ship it, then instrument it.",
  "",
  PS + "ls ~/work",
  ...lsRows(),
  "",
  PS + "echo $EMAIL",
  "alistairar7@gmail.com",
  "",
];

const REPLIES = [
  "Thanks for stopping by — have a look around if you haven't already.",
  "Everything else lives in the dock below. Have a wander.",
  "Appreciate you poking at this. Try the Projects window if you've not seen it.",
  "Nothing to run here — but there's more in the dock if you're curious.",
];

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;");

document.addEventListener("app:open", (e) => {
  if (e.detail !== "terminal") return;

  const term = document.getElementById("term");
  const out = document.getElementById("term-out");
  const form = document.getElementById("term-form");
  const input = document.getElementById("term-in");
  if (!term || !out || !form || !input) return;

  /* Flag the element, not the module: closing a window destroys this DOM and
     reopening builds a fresh copy, so a module-level "booted" flag would leave
     the second one with no listeners and a dead prompt. */
  if (term.dataset.wired) { input.focus(); return; }
  term.dataset.wired = "1";

  const write = (lines) => {
    const div = document.createElement("div");
    div.className = "term-block";
    div.innerHTML = lines.join("\n");
    out.append(div);
    term.scrollTop = term.scrollHeight;
  };

  // type the transcript out a line at a time
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
    write(SESSION);
    input.focus();
  } else {
    let i = 0;
    const step = () => {
      if (i >= SESSION.length) { input.focus(); return; }
      write([SESSION[i++]]);
      setTimeout(step, 90);
    };
    step();
  }

  let replyIndex = 0;

  form.addEventListener("submit", (ev) => {
    ev.preventDefault();
    const value = input.value.trim();
    input.value = "";

    // echo whatever was typed, then answer warmly — including a bare Enter
    write([
      PS + esc(value),
      `<span class="g">${REPLIES[replyIndex++ % REPLIES.length]}</span>`,
      "",
    ]);
  });

  // clicking the terminal focuses the prompt, like a real one
  term.addEventListener("click", () => {
    if (!getSelection().toString()) input.focus();
  });
});
