/* Decision bridge — Ari stays the face, the on-device engine is the brain.
   Voice or text comes in -> a structured decision comes out -> UI performs it.

   - Tries POST {endpoint}/decide with {text}
   - On success with confidence >= threshold, returns {node, confidence, source:'laya'}
   - On low confidence, backend error, timeout, or no backend: falls back to
     the existing ROUTES regex logic, returns {node, source:'local'}.
   Keeps existing layout and route logic; decision-making shifts gradually. */

import { ROUTES } from "./lines.js";

/* localStorage throws in opaque origins / blocked-storage modes. A throw here
   would kill the whole Ari module on import, so storage access is guarded. */
const store = {
  get(k) { try { return localStorage.getItem(k); } catch { return null; } },
  set(k, v) { try { localStorage.setItem(k, v); } catch { /* private mode */ } },
};

let endpoint = store.get("ari:decision-endpoint") || "http://localhost:8000";
let threshold = 0.55;
let lastRouting = null;

export function setEndpoint(url) {
  endpoint = String(url || "").replace(/\/+$/, "") || "http://localhost:8000";
  store.set("ari:decision-endpoint", endpoint);
}

export function getEndpoint() { return endpoint; }
export function setThreshold(v) { threshold = v; }
export function lastRoute() { return lastRouting; }

async function postDecide(text, timeoutMs = 15000) {
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), timeoutMs);
  try {
    const res = await fetch(`${endpoint}/decide`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
      signal: ctl.signal,
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null; // backend down, blocked by CORS, or timed out -> local fallback
  } finally {
    clearTimeout(timer);
  }
}

function localRoute(q) {
  const hit = ROUTES.find(([re]) => re.test(q));
  return hit ? hit[1] : "fallback";
}

/* yes/no answers resolve a pending open-confirm in the UI, which the backend
   knows nothing about — so they never leave the browser. */
const YES_RE = /^(yes|yeah|yep|yup|sure|go ahead|open it|do it)(\s+please)?\s*[!.]?$/i;
const NO_RE = /^(no|nope|nah)(\s+thanks)?\s*[!.]?$|^(not now|cancel)\s*[!.]?$/i;

/* Main entry: text in -> node id out. Never throws.
   Local-first: deterministic commands and known phrasings answer instantly
   and the engine can never overrule them (it once sent "who are you" to
   contact at 100% confidence). The engine handles the long tail local
   keywords miss. */
export async function decide(text) {
  const q = String(text || "").trim();
  if (!q) return { node: "fallback", confidence: 0, source: "local-empty" };
  if (YES_RE.test(q)) return { node: "yesOpen", confidence: 1, source: "local-confirm" };
  if (NO_RE.test(q)) return { node: "noThanks", confidence: 1, source: "local-confirm" };
  const local = localRoute(q);
  if (local !== "fallback") return { node: local, confidence: 1, source: "local" };

  const remote = await postDecide(q);
  if (remote && typeof remote.node === "string" && remote.node) {
    lastRouting = remote.routing || null;
    const conf = Number(remote.confidence) || 0;
    if (remote.node === "other" || conf < threshold) {
      // the engine shrugs: honest fallback rather than a confident wrong window
      return { node: "fallback", confidence: conf, source: "laya-low", routing: remote.routing || null };
    }
    return { node: remote.node, confidence: conf, source: "laya", routing: remote.routing || null };
  }

  return { node: "fallback", confidence: 0, source: "local" };
}

/* Health check for UI badges / debugging. Null when backend unreachable. */
export async function health(timeoutMs = 2000) {
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), timeoutMs);
  try {
    const res = await fetch(`${endpoint}/health`, { signal: ctl.signal });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}
