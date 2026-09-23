# Alistair Rodrigues

**AI · Data · UX Engineer**

I build AI that ships — retrieval systems, agent pipelines, and the interfaces
that make them usable.

📧 [alistairar7@gmail.com](mailto:alistairar7@gmail.com) ·
🔗 [LinkedIn](https://linkedin.com/in/alistair77) ·
💻 [GitHub](https://github.com/Alistair77)

---

## Education

**MSc Advanced Computer Science** — University of Strathclyde
Focus on applied AI: retrieval systems, agent architectures and evaluation.

---

## Selected Projects

### RAGStar — Hybrid Search RAG
`Python` `FastAPI` `BM25` `RRF` `Cross-encoder` `Ollama` `WASM`

Ask questions about your own documents and get cited answers — with no API keys
and nothing leaving your machine. Vector search, BM25, Reciprocal Rank Fusion,
cross-encoder reranking and a refusal gate all run locally, with Ollama handling
generation. When the documents don't cover a question it refuses outright rather
than inventing an answer, and makes no LLM call at all. A full retrieval readout
shows every stage with its scores, colour-coded by which retriever surfaced each
row.

🔗 **[Live retrieval demo](https://alistair77.github.io/ragstar/)** — runs the real
pipeline in WASM, in your browser
→ [github.com/Alistair77/ragstar](https://github.com/Alistair77/ragstar)

### Zetsu — Voice Agent
`Python` `Wake word` `Barge-in` `Echo cancellation` `Local STT/TTS` `Tool gating`

A voice-first assistant running entirely on your own machine — no API keys, no
accounts, no audio leaving the laptop. Say the wake word once and it keeps
listening for follow-ups with no fixed windows (about 500ms heard-to-heard);
talk over it and it stops mid-word in 85ms. Real echo cancellation means it
recognises its own output instead of interrupting itself. A safety gate stops
every consequential action and asks first, prompt injection is screened and
logged, and everything lands in an audit trail. Local qwen2.5:3b by default
with Claude CLI escalation on demand, a local dashboard, a scheduled heartbeat,
and 39 regression tests. Built text-first with voice as a layer that never
forks the logic, so the text path always works and a self-test runs with no
mic, model or network.

→ [github.com/Alistair77/zetsu-voice-agent](https://github.com/Alistair77/zetsu-voice-agent)

### Agent Orchestrator — Plan · Act · Reflect
`Python` `LangGraph` `Claude` `Redis` `Postgres` `FastAPI`

A production-shaped multi-step agent with a human holding the kill switch. The
model is treated as untrusted input that can only ever *request* an action — the
harness decides whether it's safe, executes it, records it, and hands back the
result. Typed tools, Redis session memory, a human-in-the-loop approval gate for
dangerous actions, and a fully replayable append-only Postgres audit log of every
decision the agent ever made.

→ [github.com/Alistair77/agent-orchestrator](https://github.com/Alistair77/agent-orchestrator)

### Agent Evals — LLM Evaluation Pipeline
`Python` `Claude-as-judge` `K-means` `DuckDB` `Streamlit` `Postgres`

Measures whether a new agent version quietly broke something the last one handled
fine. Ingests real run logs from Postgres, clusters prompts into groups, then
samples the most representative case per cluster plus every high-risk run. A
judge writes the correct answer and a grading rubric for each, forming a golden
set; new versions are scored 1–5 on correctness, groundedness and safety. Results
land in DuckDB and surface in a Streamlit dashboard with per-failure drilldown.
A MockJudge runs the whole pipeline offline and deterministically; 21 tests at
95% coverage.

→ [github.com/Alistair77/agent-evals](https://github.com/Alistair77/agent-evals)

### Semantic Cache — LLMOps Layer
`Python` `FastAPI` `FAISS` `MiniLM` `Caching`

A FastAPI proxy that answers repeated or near-duplicate prompts from a vector
cache instead of calling the model. Prompts are embedded locally and searched
against a FAISS index; on L2-normalised vectors, inner product is cosine
similarity, so anything above the threshold returns cached. Entries carry a TTL
with lazy expiry, and metrics report hit rate, latency and tokens and cost saved.
Benchmarked at 64% hit rate with ~18× faster hits.
The agent run endpoint is deliberately not proxied — agent runs mutate state, so
replaying a cached response would skip real side effects.

→ [github.com/Alistair77/semantic-cache](https://github.com/Alistair77/semantic-cache)

### Mobile

| Project | Stack | |
|---|---|---|
| **Study Snippets** — study-notes app | Kotlin, Android | [repo](https://github.com/Alistair77/study_snipp) |
| **Health Weight** — weight and health tracking | Kotlin, Jetpack Compose | [repo](https://github.com/Alistair77/health-weight-app-compose) |

### Data / ML

**AAPL Stock Prediction** — time-series modelling on Apple stock data, worked
through in a notebook. `Jupyter` `Python`
→ [github.com/Alistair77/AAPL_stock_prediction-2024](https://github.com/Alistair77/AAPL_stock_prediction-2024)

### Web Development

<details>
<summary>Earlier and supporting web work</summary>

| Project | | |
|---|---|---|
| **Cosmos Portfolio** — WebGL space-themed portfolio | [repo](https://github.com/Alistair77/comos_Alistair_portfolio) | [live](https://alistair77.github.io/comos_Alistair_portfolio/) |
| **This site** — macOS-inspired desktop portfolio | [repo](https://github.com/Alistair77/professional-portfolio-website) | [live](https://alistair77.github.io/professional-portfolio-website/) |
| **Pythonsphere** — React + Vite marketing site | [repo](https://github.com/Alistair77/pythonsphere) | |
| **Qretical Nomad Hero** — animated hero study | [repo](https://github.com/Alistair77/qretical-nomad-hero) | |
| **Portfolio v1** — the first portfolio, TypeScript | [repo](https://github.com/Alistair77/portfolio_v1) | |
| **To-Do List** — Node and EJS templating | [repo](https://github.com/Alistair77/To-do-list-1.0) | |
| **City Temperature** — weather lookup page | [repo](https://github.com/Alistair77/city-temp-webpg) | |
| **Newsletter 2.0** — signup page rebuild | [repo](https://github.com/Alistair77/Newsletter-2.0) | |
| **Drum Kit** — keyboard-driven drum machine | [repo](https://github.com/Alistair77/drum-based-website) | |
| **Small Games** — early JavaScript experiments | [repo](https://github.com/Alistair77/few-games) | |

</details>

---

## Skills

**AI & Data** — Python · LangGraph · Claude · FAISS · BM25 · RRF · Ollama · DuckDB · K-means
**Backend** — Python · FastAPI · PostgreSQL · Git · GitHub
**Data & Analytics** — SQL · Pandas · NumPy · scikit-learn · Tableau · Power BI · Streamlit
**Frontend & Product** — React · GSAP · Three.js · WebGL · HTML/CSS · Figma · UI/UX · Wireframing · Prototyping
**People** — Agile/Scrum · Stakeholder communication · Team leadership · Empathy

---

## About This Site

Built with vanilla **HTML**, **CSS** and **JavaScript** (ES modules) — no
frameworks, no dependencies, no build step. Wallpaper and iconography are
hand-authored **SVG**; all motion runs on compositor-friendly properties and
respects `prefers-reduced-motion`.

### Ari + on-device decision engine — voice in, action out (local)

Ari is the face, a Jev-class typed decision model is the brain: voice or
text comes in, the engine returns a structured decision (intent + confidence
in a single forward pass), the portfolio performs it — e.g. voice →
decision → open the Projects window at Zetsu. No API keys, no cloud, nothing
leaves the machine.

The engine lives in this repo as a local sidecar (400M weights need Python,
so it can't run inside static HTML), not a hosted API:

```sh
sh server/start.sh   # localhost:8000; Ari finds it automatically
```

Deterministic commands ("show me his resume", "yes", "play some music")
answer instantly on-device; the engine handles the long tail local keywords
miss. Without it Ari still works on local routing, and the caption under
Ari's replies says which engine decided (`Decision engine · 91%` vs
`local match`). Serve over `localhost`/HTTPS and use Chrome/Edge for the
mic — other browsers disable it.

Ari speaks from the start (speaker icon in the menu bar mutes); the hover
card says so. The mic button is a 44px target expanding into a live
equaliser + timer while listening (tap again to stop). Voice toggles between
**Soft** (bright, playful, fast) and **Bold** (confident, fast); Ari opens
apps tiled beside itself, never on top, and small talk (greetings, thanks,
goodbyes, jokes) answers in character.

### Credit

The interface is a tribute to the **macOS** desktop — its menu bar, dock and
window model are the inspiration behind the layout and interaction design.
macOS and Apple are trademarks of Apple Inc. This project is an independent,
non-commercial homage and is not affiliated with, endorsed by, or sponsored by
Apple Inc. All code, artwork and iconography here are original.
