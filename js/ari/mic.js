/* Mic input — browser-native SpeechRecognition, no deps.
   Used from the Ari window mic button and the status-bar mic.
   Returns a Promise<string>: the final transcript, or rejects with a code. */

export const micSupported =
  typeof window !== "undefined" &&
  (("SpeechRecognition" in window) || ("webkitSpeechRecognition" in window));

/* the live recogniser, so a second tap stops it instead of stacking sessions */
let live = null;
export function stopListening() {
  try { live?.stop(); } catch { /* already stopped */ }
  live = null;
}

export function listenOnce({ lang = navigator.language || "en-US", timeoutMs = 12000 } = {}) {
  return new Promise((resolve, reject) => {
    if (!micSupported) {
      reject(new Error("unsupported"));
      return;
    }
    const Ctor = window.SpeechRecognition || window.webkitSpeechRecognition;
    let rec;
    try {
      rec = new Ctor();
    } catch {
      reject(new Error("unsupported"));
      return;
    }
    rec.lang = lang;
    rec.interimResults = true;
    rec.maxAlternatives = 1;

    let finalText = "";
    let done = false;
    const finish = (fn, val) => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      try { rec.stop(); } catch { /* already stopped */ }
      if (live === rec) live = null;
      fn(val);
    };
    const timer = setTimeout(() => finish(reject, new Error("timeout")), timeoutMs);

    rec.onresult = (e) => {
      let interim = "";
      for (const r of e.results) {
        const t = r[0]?.transcript || "";
        if (r.isFinal) finalText = (finalText + " " + t).trim();
        else interim += t;
      }
      document.dispatchEvent(new CustomEvent("ari:hearing", {
        detail: { final: finalText, interim },
      }));
      if (finalText) finish(resolve, finalText);
    };
    rec.onerror = (e) => finish(reject, new Error(e?.error || "recognition-error"));
    rec.onend = () => {
      if (finalText) finish(resolve, finalText);
      else finish(reject, new Error("no-speech"));
    };
    try {
      live = rec;
      rec.start();
      document.dispatchEvent(new CustomEvent("ari:listening", { detail: { on: true } }));
    } catch {
      if (live === rec) live = null;
      finish(reject, new Error("start-failed"));
    }
  }).finally(() => {
    document.dispatchEvent(new CustomEvent("ari:listening", { detail: { on: false } }));
  });
}
