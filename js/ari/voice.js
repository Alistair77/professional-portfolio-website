/* Ari's voice. Not a copy of anyone's real voice: a character delivery built
   on the browser's speech synthesis. Low and unhurried, with the rhythm from
   the style notes — statement. beat. twist. Each line is spoken phrase by
   phrase so the pauses are real, and the last phrase (the twist) lands a
   beat late, a touch slower and lower. Off until the visitor turns it on. */

const canSpeak = "speechSynthesis" in window;

/* natural-sounding voices first; anything robotic is skipped */
const PREFERRED = [
  "Daniel", "Google UK English Male", "Microsoft Ryan Online", "Microsoft Guy Online",
  "Microsoft Christopher Online", "Microsoft Andrew Online", "Aaron", "Arthur", "Alex",
];
const AVOID = /Fred|Albert|Bad News|Bahh|Bells|Boing|Bubbles|Cellos|Wobble|Zarvox|Trinoids|Whisper|Jester|Organ|Superstar|Ralph|Junior/i;

let chosen = null;
function pickVoice() {
  if (!canSpeak) return null;
  const all = speechSynthesis.getVoices().filter((v) => /^en/i.test(v.lang) && !AVOID.test(v.name));
  for (const name of PREFERRED) {
    const hit = all.find((v) => v.name.includes(name));
    if (hit) return hit;
  }
  return all.find((v) => /natural|enhanced|premium/i.test(v.name)) || all[0] || null;
}
if (canSpeak) {
  chosen = pickVoice();
  speechSynthesis.addEventListener?.("voiceschanged", () => { chosen = pickVoice(); });
}

/* how long to hold after a phrase, by how it ends */
const BEAT = { ",": 170, ".": 390, "!": 390, "?": 470, "…": 650, ":": 300, ";": 280 };
const TWIST_BEAT = 240;

/* "Technically, he built it. Practically? I run it." →
   ["Technically,", "he built it.", "Practically?", "I run it."] */
function phrases(text) {
  return text
    .replace(/\.\.\./g, "…")
    .split(/(?<=[.!?…:;])\s+|(?<=,)\s+/)
    .map((p) => p.trim())
    .filter(Boolean);
}

export const voice = {
  available: canSpeak,
  enabled: false,
  _until: 0,
  _talking: false,
  _run: 0,

  say(text, rm) {
    this.stop();
    this._until = performance.now() + (rm ? 1200 : text.length * 12 + 500);
    if (!this.enabled || !canSpeak) return;

    const run = ++this._run;
    const parts = phrases(text);
    const last = parts.length - 1;

    const speakAt = (i) => {
      if (run !== this._run || i > last) { this._talking = false; return; }
      const p = parts[i];
      const u = new SpeechSynthesisUtterance(p.replace(/…/g, "..."));
      if (chosen) { u.voice = chosen; u.lang = chosen.lang; }
      const twist = i === last && last > 0;
      const question = p.endsWith("?");
      u.rate = twist ? 0.86 : 0.93;
      u.pitch = twist ? 0.78 : question ? 0.9 : 0.84;
      u.volume = 1;
      u.onstart = () => { if (run === this._run) this._talking = true; };
      u.onend = u.onerror = () => {
        if (run !== this._run) return;
        this._talking = false;
        const next = parts[i + 1];
        if (!next) return;
        let hold = BEAT[p.slice(-1)] ?? 120;
        if (i + 1 === last && last > 0) hold += TWIST_BEAT; // the beat before the twist
        setTimeout(() => speakAt(i + 1), hold);
      };
      speechSynthesis.speak(u);
    };

    try { speakAt(0); } catch { this._talking = false; }
  },

  /* when speaking aloud, follow the real audio (quiet in the pauses);
     when muted, follow the typing so the mouth still moves */
  speaking() {
    if (this.enabled && canSpeak) return this._talking;
    return performance.now() < this._until;
  },

  stop() {
    this._run++;
    this._talking = false;
    if (canSpeak) speechSynthesis.cancel();
  },

  name() { return chosen ? chosen.name : null; },
};
