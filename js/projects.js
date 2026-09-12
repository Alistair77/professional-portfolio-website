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
    tags: ["Python", "FastAPI", "BM25", "RRF", "Cross-encoder", "Ollama", "WASM"],
    body: [
      ["Local by default", "No API keys, no Pinecone, no OpenAI — every model runs on your own machine. Vector search, BM25, Reciprocal Rank Fusion, cross-encoder reranking and the refusal gate all run locally, with Ollama handling generation."],
      ["It refuses", "Asked something the documents don't cover, it says so instead of inventing an answer — and no LLM call is made at all. A refusal renders as a distinct outcome, not a short answer."],
      ["Shows its work", "A full retrieval readout for every stage, each with its own colour: blue for vector search, amber for BM25, green for what survived reranking. You can see which retriever surfaced each row and why."],
      ["Runs in the browser", "The demo executes the real pipeline in WASM — the scores are computed live, not replayed. Verified against the Python pipeline: identical refusal decisions, scores within ~0.1."],
    ],
  },
  {
    id: "zetsu",
    name: "Zetsu",
    kicker: "Voice Agent",
    tagline: "A voice-first assistant that runs entirely on your own machine. No API keys, no accounts, no audio leaving the laptop.",
    year: "2026",
    group: "ai",
    accent: ["#5AD1C8", "#0E8C88"],
    repo: "https://github.com/Alistair77/zetsu-voice-agent",
    tags: ["Python", "Wake word", "Barge-in", "Echo cancellation", "Local STT/TTS", "Tool gating"],
    body: [
      ["Conversation, not commands", "Say the wake word once and it keeps listening for follow-ups instead of making you summon it before every sentence. Talk over it and it stops mid-word in 85ms."],
      ["It knows its own voice", "Real echo cancellation means it recognises its own output and ignores it — rather than interrupting itself or going deaf while speaking."],
      ["Safety is in the harness", "A gate stops every consequential action and asks first. Prompt injection is screened, flagged and logged, and every action lands in a full audit trail."],
      ["Built to be debugged", "Text agent first, voice as a layer that never forks the logic. The text path always works, and a self-test runs with no mic, no model and no network."],
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
    tags: ["Python", "Claude-as-judge", "K-means", "DuckDB", "Streamlit", "Postgres"],
    body: [
      ["From real logs, not invented tests", "Ingests the agent's actual prompts and responses from Postgres, then clusters them into groups — maths, document search, reports, safety — so you evaluate patterns rather than every log line."],
      ["Golden answers", "Samples the most representative prompt per cluster plus <em>every</em> high-risk run, then has a judge write the correct answer and a grading rubric for each. That becomes ground truth."],
      ["Three dimensions", "New versions are scored 1–5 on correctness, groundedness and safety — catching a model that started getting maths wrong, making up facts, or complying with requests it used to refuse."],
      ["Drill into failures", "Scores land in DuckDB and surface in a Streamlit dashboard: pass/fail trends, which clusters are failing, and the individual cases behind them."],
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
    const items = list.map((p) => `<button class="sb-item" data-pane="${p.id}">${esc(p.name)}</button>`).join("");
    return g.open
      ? `<div class="sb-label">${g.label}</div>${items}`
      : `<details class="sb-group"><summary>${g.label}</summary>${items}</details>`;
  };

  body.querySelector(".sidebar").innerHTML = `
    <div class="sb-label">Library</div>
    <button class="sb-item" data-pane="all" aria-selected="true">All work</button>
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
