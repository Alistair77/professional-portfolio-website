"""Decision-engine backend for the portfolio (Jev-class typed decisions).

Ari stays the face layer. This server is the decision engine behind it:
text in -> typed choice + confidence -> structured {node, confidence} ->
portfolio performs it.

Run:
    sh server/start.sh
    # or: uvicorn server.decision_server:app --port 8000

The frontend (js/ari/decide.js) POSTs to /decide and falls back to its local
ROUTES regex when this server is down or confidence is low, so the site
works with or without it.
"""

from __future__ import annotations

import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

try:
    from laya import Router
except Exception as exc:  # import-time hint when laya isn't installed
    raise SystemExit(
        "laya is not installed. Run: pip install laya\n"
        f"({exc})"
    ) from exc

PRELOAD = os.environ.get("LAYA_PRELOAD", "1") == "1"
DEVICE = os.environ.get("LAYA_DEVICE")  # e.g. "cuda", else auto
CONF_THRESHOLD = float(os.environ.get("LAYA_THRESHOLD", "0.55"))

# One choice question covering every Ari node. Keep criteria short:
# Laya splits options across a fixed head token budget, so terse phrases
# beat sentences here (see laya README "Honest limits").
QUESTIONS = {
    "intent": {
        "type": "choice",
        "instructions": "Which portfolio topic is the visitor asking about?",
        "criteria": {
            "work": "all projects, portfolio overview",
            "about": "who is Alistair, background, education",
            "rag": "RAGStar, retrieval, documents, citations",
            "zetsu": "Zetsu, voice agent, microphone, wake word",
            "orchestrator": "orchestrator, LangGraph, plan act reflect",
            "evals": "evals, evaluation, regression, judge",
            "cache": "semantic cache, FAISS, duplicate prompts",
            "text2sql": "SQL, database, guardrail, queries",
            "jericho": "Jericho, Mars, space station, crew",
            "contact": "contact, email, reach out",
            "github": "GitHub, repo, source code",
            "linkedin": "LinkedIn, hiring, connect",
            "resume": "show or open the résumé or CV document, curriculum vitae",
            "terminal": "open the terminal, command line",
            "music": "play music, songs, the mix",
            "other": "anything else",
        },
    }
}

app = FastAPI(title="Ari/Laya decide bridge")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # static portfolio page; tighten in production
    allow_methods=["POST", "GET", "OPTIONS"],
    allow_headers=["*"],
)

router_kwargs = {"preload": PRELOAD}
if DEVICE:
    router_kwargs["device"] = DEVICE
router = Router(**router_kwargs)


class DecideIn(BaseModel):
    text: str = Field(min_length=1, max_length=2000)


@app.get("/health")
def health():
    return {"ok": True, "preload": PRELOAD, "threshold": CONF_THRESHOLD}


@app.post("/decide")
def decide(body: DecideIn):
    state = {"message": body.text}
    try:
        result = router.predict(state, QUESTIONS)
    except Exception as exc:
        return {"node": "fallback", "confidence": 0.0, "source": "laya-error", "error": str(exc)[:300]}

    answers = (result or {}).get("answers", {})
    intent = answers.get("intent", {}) or {}
    node = intent.get("choice", "other")
    conf = float(intent.get("confidence", 0.0) or 0.0)
    routing = (result or {}).get("routing", {})

    # 'other' with low confidence -> let the frontend fall back to local routes
    if node not in QUESTIONS["intent"]["criteria"]:
        node = "fallback"
    return {
        "node": node,
        "confidence": round(conf, 4),
        "threshold": CONF_THRESHOLD,
        "routing": routing,
        "source": "laya",
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="127.0.0.1", port=int(os.environ.get("PORT", "8000")))
