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
`Python` `FastAPI` `Pinecone` `BM25` `Cohere` `Ollama` `Pydantic`

Hybrid retrieval pipeline combining Pinecone vector search with BM25 keyword
search, merged via Reciprocal Rank Fusion at a k=60 smoothing constant. Cohere
cross-encoder reranking over the top-20 candidates for precision, with a local
Ollama LLM for private, citation-grounded generation. FastAPI layer with
Pydantic validation, deterministic MD5-hashed chunk IDs to prevent duplicate
ingestion, and comprehensive unit tests.

→ [github.com/Alistair77/ragstar](https://github.com/Alistair77/ragstar)

### Agent Orchestrator — Plan · Act · Reflect
`Python` `LangGraph` `Claude` `Human-in-the-loop`

Multi-step agent loop that decomposes a task, executes tools, and self-critiques
each step before choosing the next move. Orchestrated with LangGraph, with
human-in-the-loop checkpoints that pause for approval on high-impact actions.
Structured, resumable run state with step-level tracing for deterministic
replays and easier debugging.

→ [github.com/Alistair77/agent-orchestrator](https://github.com/Alistair77/agent-orchestrator)

### Agent Evals — LLM Evaluation Pipeline
`Python` `Claude-as-judge` `DuckDB` `Streamlit`

Synthetic eval dataset generation, with model outputs scored against a
Claude-as-judge rubric for consistent, explainable grading. Every run and metric
persisted in DuckDB for fast analysis across prompts, models and versions.
Streamlit dashboard to inspect failures, compare runs, and catch quality
regressions over time.

→ [github.com/Alistair77/agent-evals](https://github.com/Alistair77/agent-evals)

### HawkAI — 3D Authentication UI
`React` `Three.js` `GLSL` `Ant Design` `WebGL`

Three.js scene featuring a Draco-compressed GLB security camera model with
real-time mouse-responsive tracking and depth. Custom GLSL shaders for animated
data-flow ribbons, and a particle system with 600+ floating dust points for
cinematic atmosphere. Responsive, optimised 3D rendering with dynamic viewport
adaptation and a transparent WebGL overlay composited with Ant Design form UI.

### Quantasphere — Interactive Hero
`Vanilla HTML/CSS/JS` `Video engineering` `Accessibility`

Full-viewport hero with custom JavaScript-driven video scrubbing — mouse
X-position maps to precise playhead control for interactive storytelling. CSS
`mask-image` gradients for seamless video-to-background blending, and
frosted-glass navigation via `backdrop-filter`. Respects
`prefers-reduced-motion` and requires zero frameworks or build tooling.

### Cosmos Portfolio System
`Three.js` `WebGL` `GSAP` `Lenis` `IntersectionObserver`

Single-page portfolio with Three.js 3D satellite rendering, custom GLB model
integration and a real-time animation loop. Modular project showcase with
staggered card reveal mechanics and a scroll-driven timeline. WebGL starfield
with parallax mouse tracking, live UTC clock, and multi-layer video playback
with lazy loading.

---

## Skills

**AI & Data** — Python · LangGraph · Claude · Pinecone · BM25 · Cohere · Ollama · DuckDB
**Backend** — FastAPI · Pydantic · Kotlin · Streamlit · Unit testing
**Frontend & 3D** — React · Three.js · GLSL · WebGL · GSAP · Ant Design · Vanilla JS

---

## About This Site

Built with vanilla **HTML**, **CSS** and **JavaScript** (ES modules) — no
frameworks, no dependencies, no build step. Wallpaper and iconography are
hand-authored **SVG**; all motion runs on compositor-friendly properties and
respects `prefers-reduced-motion`.

### Credit

The interface is a tribute to the **macOS** desktop — its menu bar, dock and
window model are the inspiration behind the layout and interaction design.
macOS and Apple are trademarks of Apple Inc. This project is an independent,
non-commercial homage and is not affiliated with, endorsed by, or sponsored by
Apple Inc. All code, artwork and iconography here are original.
