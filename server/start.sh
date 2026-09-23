#!/bin/sh
# Decision-engine sidecar for Ari — runs on this machine, nothing leaves it.
# Usage: sh server/start.sh   (then open the portfolio; Ari finds it on :8000)
set -e
cd "$(dirname "$0")"
[ -d .venv ] || python3 -m venv .venv
.venv/bin/pip install -r requirements.txt
exec .venv/bin/python decision_server.py
