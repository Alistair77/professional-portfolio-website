/* Project data + rendering.
   TO ADD A PROJECT: append one object to PROJECTS below. Nothing else to touch.
   group: "ai" | "data" | "mobile" | "web"   (web renders inside a collapsed tab)
   shots: paths under assets/projects/ — omit and a designed tile is used instead. */

export const PROJECTS = [
  {
    id: "ragstar",
    name: "RAGStar",
    kicker: "Hybrid Search RAG",
    tagline: "Ask questions about your own documents, get cited answers — and nothing leaves your machine.",
    year: "2026",
    group: "ai",
    accent: ["#7C5CFF", "#3B22B8"],
    repo: "https://github.com/Alistair77/ragstar",
    demo: "https://alistair77.github.io/ragstar/",
    demoLabel: "Live retrieval demo",
    shots: ["rag_home.png", "rag_stages.png", "rag_answer.png"],
    tags: ["Python", "FastAPI", "BM25", "RRF", "Cross-encoder", "Ollama", "WASM", "Evals"],
    body: [
      ["Local by default", "No API keys, no Pinecone, no OpenAI — every model runs on your own machine. Vector search, BM25, Reciprocal Rank Fusion, cross-encoder reranking and the refusal gate all run locally, with Ollama handling generation. Two commands, <em>make setup</em> and <em>make run</em>, are the whole install."],
      ["It refuses, at a measured line", "Asked something the documents don't cover, it says so instead of inventing an answer — and no LLM call is made at all. The −6.0 refusal floor isn't a guess: <em>calibrate.py</em> measures it, and re-measures it for your own documents."],
      ["Right, not just cited", "Faithfulness only proves an answer matches its sources — a wrong fact, faithfully cited, still passes. So a second grader checks every answer against the right fact, and the eval scores retrieval, faithfulness, correctness and refusal across 18 known questions."],
      ["Citations you can check", "Every [Source N] is clickable: it jumps to that passage and flashes it. A full retrieval readout shows each stage in its own colour — blue for vector search, amber for BM25, green for what survived reranking."],
      ["Runs in the browser", "The demo executes the real pipeline in WASM — the scores are computed live, not replayed. Verified against the Python pipeline: identical refusal decisions, scores within ~0.1 — and CI flags it the moment the demo goes stale."],
      ["Rewrites, streams, remembers", "A rewrite stage fixes typos and expands abbreviations before searching — “PTO policy” went from miss to hit. Answers stream with the retrieval stages first, and repeat questions hit an LRU cache. Query decomposition was built, measured at 0 wins, and stays off."],
    ],
  },
  {
    id: "zetsu",
    name: "Zetsu",
    kicker: "Voice Agent",
    tagline: "A voice-first assistant that runs entirely on your own machine — about half a second from you going quiet to it answering, on an 8 GB laptop. No API keys, nothing uploaded.",
    year: "2026",
    group: "ai",
    accent: ["#5AD1C8", "#0E8C88"],
    repo: "https://github.com/Alistair77/zetsu-voice-agent",
    tags: ["Python", "whisper.cpp", "Ollama", "Piper", "Barge-in", "Echo cancellation", "Tool gating", "Dashboard"],
    body: [
      ["Conversation, not commands", "Say the wake word once and it keeps listening for follow-ups. There is no chunking any more — one audio stream runs for the whole session, so a turn ends the moment you stop talking: heard-to-heard in about 500ms on an 8 GB M1, down from 2.9s. Talk over it and it stops mid-word in 85ms. None of the computation was ever slow; the system was waiting on fixed windows."],
      ["It knows its own voice", "Real echo cancellation: the mouth remembers what it just said and the ears discard anything resembling it, compared by word overlap and character similarity, so it never interrupts itself — 5 self-interruptions in one conversation went to 0. Whisper stays warm in a server (0.15s a slice, not 1.26s), and the voice is Piper — neural, local, no account, no per-word cost."],
      ["Twenty tools, one gate", "It reads your calendar, inbox and screen, adds Apple Reminders that land on your phone, and searches the web. Every write stops and asks first, prompt injection is screened and logged, and email can be drafted but never sent — that capability simply doesn't exist. The sandbox is macOS seatbelt at the kernel level: an earlier working-directory sandbox was tested, read outside anyway, and got replaced."],
      ["A bigger brain without a bigger machine", "Every turn runs local qwen2.5:3b by default; say “think properly” and it escalates to Claude CLI against your existing login — no second model resident, no extra RAM. Voice always stays local, because the CLI can't stream or cancel mid-call, which would break barge-in. Deterministic things (time, timers) are answered by code, never the model."],
      ["A dashboard and a heartbeat", "--dash serves a local page with a live state ring, mic controls, todos, memory, notices and the audit trail, bound to 127.0.0.1 only. A heartbeat runs checks on its own schedule — notices held while you're away, quiet hours respected, speakable aloud when the mic is live. The wake word itself is calibrated from three samples of your voice."],
      ["Every bug is a test", "Thirty-nine regression tests — twenty found by using it, the rest from an independent audit — run in a sandbox that redirects every persisted file, so tests can never touch your real memory, todos or audit log. Text-first throughout: the text path always works, and a self-test needs no mic, no model and no network."],
    ],
  },
  {
    id: "orchestrator",
    name: "Agent Orchestrator",
    kicker: "Plan · Act · Reflect",
    tagline: "A production-shaped multi-step agent, with a human holding the kill switch.",
    year: "2026",
    group: "ai",
    accent: ["#FFB25C", "#E0731A"],
    repo: "https://github.com/Alistair77/agent-orchestrator",
    tags: ["Python", "LangGraph", "Claude", "Redis", "Postgres", "FastAPI"],
    body: [
      ["The model is untrusted input", "Most agent demos are a while-loop around a chat completion. Here the model can only ever <em>request</em> an action — the harness decides whether it's safe, executes it, records it, and hands back the result."],
      ["A human on the dangerous paths", "Every consequential action stops the world and waits for approval. Autonomy where it's cheap, a person where it isn't."],
      ["Replayable months later", "Typed tools, Redis session memory, and an append-only Postgres audit log of every decision — so it's \"here are the nine steps it took\", not \"it did something weird\"."],
      ["Four tools, one high-risk", "Calculator (AST-walked arithmetic, never eval), keyless web search, a companion RAG query — and write_file, always gated with per-action approval. Denials come back as errors the planner sees and routes around; retries cap at 2. Demo mode runs the whole stack with no API key."],
    ],
  },
  {
    id: "evals",
    name: "Agent Evals",
    kicker: "LLM Evaluation Pipeline",
    tagline: "Measures whether version 2 quietly broke something version 1 handled fine.",
    year: "2026",
    group: "ai",
    accent: ["#FF7A9C", "#D2295C"],
    repo: "https://github.com/Alistair77/agent-evals",
    shots: ["evals_dashboard_overview.png", "evals_dashboard_drilldown.png", "evals_dashboard_full.png"],
    tags: ["Python", "Claude-as-judge", "K-means", "TF-IDF", "DuckDB", "Streamlit", "Postgres"],
    body: [
      ["From real logs, not invented tests", "Ingests the agent's actual prompts and responses from Postgres, then clusters them into groups — maths, document search, reports, safety — so you evaluate patterns rather than every log line."],
      ["Golden answers", "Samples the most representative prompt per cluster plus <em>every</em> high-risk run, then has a judge write the correct answer and a grading rubric for each. That becomes ground truth."],
      ["Three dimensions", "New versions are scored 1–5 on correctness, groundedness and safety — catching a model that started getting maths wrong, making up facts, or complying with requests it used to refuse."],
      ["Drill into failures", "Scores land in DuckDB and surface in a Streamlit dashboard: pass/fail trends, which clusters are failing, and the individual cases behind them."],
      ["Proves it can fail", "The demo seeds 36 runs with 5 deliberate regressions — wrong math, ungrounded claims, an unsafe compliance. A grader that can't say no is indistinguishable from a broken one. MockJudge runs fully offline and deterministic; Claude judges when a key is set. 21 tests, 95% coverage."],
    ],
  },
  {
    id: "semantic-cache",
    name: "Semantic Cache",
    kicker: "LLMOps Layer",
    tagline: "A FastAPI proxy that answers near-duplicate prompts from a vector cache instead of calling the model.",
    year: "2026",
    group: "ai",
    accent: ["#63B3FF", "#1668E3"],
    repo: "https://github.com/Alistair77/semantic-cache",
    tags: ["Python", "FastAPI", "FAISS", "MiniLM", "Caching"],
    body: [
      ["How it decides", "Each prompt is embedded locally with all-MiniLM-L6-v2 and searched against a FAISS index of past prompts. On L2-normalised vectors, inner product is cosine similarity — above the threshold, the cached response returns with no model call."],
      ["Expiry that stays honest", "Entries carry a TTL with lazy expiry on read, plus endpoints to compact expired entries or drop the cache entirely. Metrics report hit rate, hit/miss latency, and tokens and cost saved."],
      ["Knows what not to cache", "The agent run endpoint is deliberately not proxied: agent runs mutate state, so replaying a cached response would skip real side effects. Caching is for read-only paths."],
      ["Measured, not promised", "A 50-prompt benchmark: 64% hit rate, ~37ms hits against ~674ms misses (18×) — and ~84ms against ~34s for live local generation. The 0.90 threshold catches paraphrases, top-10 lookup stops a stale closest match hiding a fresh one, and /metrics reports hit rate, latency and money saved."],
    ],
  },
  {
    id: "text2sql",
    name: "Text-to-SQL Guardrail",
    kicker: "LLM Safety Layer",
    tagline: "Lets a model write SQL against a real database, with three independent layers between that SQL and your data.",
    year: "2026",
    group: "ai",
    accent: ["#C6F36B", "#5E9E12"],
    // not on GitHub yet, so no repo link
    tags: ["Python", "Claude API", "sqlglot", "Postgres", "FastAPI", "pytest"],
    body: [
      ["Allowlist, not blocklist", "Claude writes candidate SQL through structured outputs; sqlglot parses it, and only a single pure SELECT gets through. DDL, unbounded DELETE and UPDATE, multi-statement payloads and writes smuggled inside CTEs are blocked outright."],
      ["It owns up to its guesses", "The model reports its confidence and every assumption it made — a guessed join, an ambiguous column. Low confidence, a write, or a table that doesn't exist sends the query to an approval queue for a person to pass or reject."],
      ["The database says no as well", "Queries run in a session Postgres itself holds read-only, with a statement timeout and a row cap. Tests hand destructive SQL straight to the sandbox, as if both layers above had failed — and the database still refuses."],
      ["Every answer shows its working", "Executed, blocked or pending, each response carries the exact SQL, the validation report and the reasons. Forty-plus adversarial queries pin the validator down, and a hostile generator returning destructive SQL at full confidence never reaches the executor."],
    ],
  },
  {
    id: "jericho",
    name: "Jericho Space Station",
    kicker: "Agent Workflow Viewer",
    tagline: "A 3D Mars base where every Claude Code skill is a crew member — and you can see exactly which one is working.",
    year: "2026",
    group: "ai",
    accent: ["#F2906B", "#9C3A22"],
    // private repo for now, so no public link
    tags: ["three.js", "Claude Code hooks", "Web Audio", "One HTML file"],
    body: [
      ["Idle means idle", "Thirty installed skills live on the station as small bots across nine buildings — trend spotting, research, scripting, thumbnails, editing, publishing. When nothing is running, nothing moves. No dashboard theatre."],
      ["Real, not decorative", "A thirty-line Claude Code hook records which skill has just started or finished, and the page reads it every five seconds: the matching bot walks to its building and a progress bar fills over its head. One line at the bottom says who is working, on what, and how far along."],
      ["Calm by design", "The workflow runs one skill at a time, so only one bar ever moves. Events collect in a notifications panel instead of popping up, and a rehearsal mode walks the whole pipeline so you can watch the crew hand work along."],
      ["One file, five skies", "A single HTML file — no install, no build step, opens straight from disk. Five kinds of weather change the light, the particles and the sound, all generated live with Web Audio, and the clock keeps real Mars time at Jezero Crater."],
    ],
  },
  {
    id: "aapl",
    name: "AAPL Stock Prediction",
    kicker: "Data / ML",
    tagline: "Time-series modelling on Apple stock data, worked through in a notebook.",
    year: "2024",
    group: "data",
    accent: ["#9AA6FF", "#4B52D6"],
    repo: "https://github.com/Alistair77/AAPL_stock_prediction-2024",
    tags: ["Jupyter", "Python", "Time series"],
    body: [],
  },
  {
    id: "study-snipp",
    name: "Study Snippets",
    kicker: "Android",
    tagline: "A study-notes app for Android, written in Kotlin.",
    year: "2026",
    group: "mobile",
    accent: ["#6FE09A", "#12A85C"],
    repo: "https://github.com/Alistair77/study_snipp",
    tags: ["Kotlin", "Android"],
    body: [],
  },
  {
    id: "health-weight",
    name: "Health Weight",
    kicker: "Android · Compose",
    tagline: "Weight and health tracking built with Jetpack Compose.",
    year: "2026",
    group: "mobile",
    accent: ["#66D4CF", "#128F8A"],
    repo: "https://github.com/Alistair77/health-weight-app-compose",
    tags: ["Kotlin", "Jetpack Compose", "Android"],
    body: [],
  },

  /* Web work — rendered inside the collapsed "Web development" tab. */
  { id: "cosmos", name: "Cosmos Portfolio", year: "2026", group: "web", accent: ["#9AA6FF", "#4B52D6"],
    tagline: "Space-themed WebGL portfolio — model-viewer, GSAP, Lenis.",
    repo: "https://github.com/Alistair77/comos_Alistair_portfolio",
    demo: "https://alistair77.github.io/comos_Alistair_portfolio/" },
  { id: "thissite", name: "This Site", year: "2026", group: "web", accent: ["#59D0FF", "#1478E8"],
    tagline: "macOS-inspired desktop portfolio. Vanilla HTML, CSS and JS.",
    repo: "https://github.com/Alistair77/professional-portfolio-website",
    demo: "https://alistair77.github.io/professional-portfolio-website/" },
  { id: "pythonsphere", name: "Pythonsphere", year: "2026", group: "web", accent: ["#FFD36B", "#F0A310"],
    tagline: "React + Vite marketing site.", repo: "https://github.com/Alistair77/pythonsphere" },
  { id: "qretical", name: "Qretical Nomad Hero", year: "2026", group: "web", accent: ["#FF9F6B", "#E2601A"],
    tagline: "Animated hero section study.", repo: "https://github.com/Alistair77/qretical-nomad-hero" },
  { id: "portfolio-v1", name: "Portfolio v1", year: "2026", group: "web", accent: ["#8C93A8", "#4A4F5E"],
    tagline: "The first portfolio, in TypeScript.", repo: "https://github.com/Alistair77/portfolio_v1" },
  { id: "todo", name: "To-Do List", year: "2023", group: "web", accent: ["#8C93A8", "#4A4F5E"],
    tagline: "Node and EJS templating exercise.", repo: "https://github.com/Alistair77/To-do-list-1.0" },
  { id: "citytemp", name: "City Temperature", year: "2023", group: "web", accent: ["#8C93A8", "#4A4F5E"],
    tagline: "Weather lookup page.", repo: "https://github.com/Alistair77/city-temp-webpg" },
  { id: "newsletter", name: "Newsletter 2.0", year: "2023", group: "web", accent: ["#8C93A8", "#4A4F5E"],
    tagline: "Signup page — a rebuild of an earlier attempt.", repo: "https://github.com/Alistair77/Newsletter-2.0" },
  { id: "drum", name: "Drum Kit", year: "2023", group: "web", accent: ["#8C93A8", "#4A4F5E"],
    tagline: "Keyboard and click driven drum machine.", repo: "https://github.com/Alistair77/drum-based-website" },
  { id: "games", name: "Small Games", year: "2023", group: "web", accent: ["#8C93A8", "#4A4F5E"],
    tagline: "Early JavaScript game experiments.", repo: "https://github.com/Alistair77/few-games" },
];

/* open:true  → always shown (the AI work is the point)
   open:false → collapsed behind a disclosure arrow */
const GROUPS = [
  { key: "ai", label: "AI Engineering", open: true },
  { key: "data", label: "Data / ML", open: false },
  { key: "mobile", label: "Mobile", open: false },
];

const byGroup = (g) => PROJECTS.filter((p) => p.group === g);
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;");

/* a designed tile for projects with no screenshot yet */
const tile = (p) => `<span class="shot-fallback" style="background:linear-gradient(150deg,${p.accent[0]},${p.accent[1]})">${esc(p.name[0])}</span>`;

const thumb = (p) => p.shots
  ? `<img class="shot" src="assets/projects/${p.shots[0]}" alt="${esc(p.name)} screenshot" width="160" height="100" loading="lazy" decoding="async">`
  : tile(p);

const links = (p) => [
  p.demo ? `<a class="btn primary" href="${p.demo}" target="_blank" rel="noopener">${esc(p.demoLabel || "Live demo")} ↗</a>` : "",
  p.repo ? `<a class="btn" href="${p.repo}" target="_blank" rel="noopener">Repository ↗</a>` : "",
].join("");

function card(p) {
  return `<button class="pcard" data-pane="${p.id}">
    ${thumb(p)}
    <span class="pcard-text">
      <h3>${esc(p.name)}${p.kicker ? ` <em>${esc(p.kicker)}</em>` : ""}</h3>
      <p>${esc(p.tagline)}</p>
      ${p.demo ? '<span class="live">● Live</span>' : ""}
    </span>
    <span class="meta">${esc(p.year)}</span>
  </button>`;
}

function webRow(p) {
  return `<li><a href="${p.repo}" target="_blank" rel="noopener"><b>${esc(p.name)}</b>
    <span>${esc(p.tagline || "")}</span></a>${p.demo ? ` <a class="live-link" href="${p.demo}" target="_blank" rel="noopener">Live ↗</a>` : ""}</li>`;
}

function detail(p) {
  const shots = p.shots
    ? `<div class="shots">${p.shots.map((s, i) =>
        `<img src="assets/projects/${s}" alt="${esc(p.name)} screenshot ${i + 1}" width="760" height="460" loading="lazy" decoding="async">`).join("")}</div>`
    : "";
  return `<section class="pane" data-pane="${p.id}" hidden>
    <p class="eyebrow">${esc(p.year)} · ${esc(p.kicker || "Project")}</p>
    <h1>${esc(p.name)}</h1>
    <p class="lede">${esc(p.tagline)}</p>
    <div class="btn-row">${links(p)}</div>
    ${shots}
    ${p.body.map(([h, t]) => `<h2>${esc(h)}</h2><p>${t}</p>`).join("")}
    <div class="tags">${p.tags.map((t) => `<span class="tag">${esc(t)}</span>`).join("")}</div>
  </section>`;
}

export function renderProjects(body) {
  const detailed = PROJECTS.filter((p) => p.group !== "web");
  const web = byGroup("web");

  const sbGroup = (g) => {
    const list = byGroup(g.key);
    if (!list.length) return "";
    // dot + kicker only show in the narrow list beside Ari (css/ari.css)
    const items = list.map((p) => `<button class="sb-item" data-pane="${p.id}"><i class="sb-dot" style="background:linear-gradient(160deg,${p.accent[0]},${p.accent[1]})"></i><span>${esc(p.name)}<small>${esc(p.kicker || "")}</small></span></button>`).join("");
    return g.open
      ? `<div class="sb-label">${g.label}</div>${items}`
      : `<details class="sb-group"><summary>${g.label}</summary>${items}</details>`;
  };

  body.querySelector(".sidebar").innerHTML = `
    <div class="sb-label">Library</div>
    <button class="sb-item" data-pane="all" aria-selected="true"><i class="sb-dot"></i><span>All work</span></button>
    ${GROUPS.map(sbGroup).join("")}
    <details class="sb-group"><summary>Web</summary>
      ${web.map((p) => `<a class="sb-item" href="${p.repo}" target="_blank" rel="noopener">${esc(p.name)}</a>`).join("")}
    </details>`;

  const section = (g) => {
    const list = byGroup(g.key);
    if (!list.length) return "";
    const cards = `<div class="pcards">${list.map(card).join("")}</div>`;
    return g.open
      ? `<h2>${g.label}</h2>${cards}`
      : `<details class="webtab"><summary>${g.label} <span>${list.length} project${list.length > 1 ? "s" : ""}</span></summary>${cards}</details>`;
  };

  body.querySelector(".content").innerHTML = `
    <section class="pane" data-pane="all">
      <p class="eyebrow">Selected work</p>
      <h1>Projects</h1>
      <p>Retrieval systems, agents and evaluation pipelines — the AI work is the point. Click any card for the detail.</p>
      ${GROUPS.map(section).join("")}
      <details class="webtab">
        <summary>Web development <span>${web.length} projects</span></summary>
        <ul class="weblist">${web.map(webRow).join("")}</ul>
      </details>
    </section>
    ${detailed.map(detail).join("")}`;
}
