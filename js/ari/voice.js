/* Ari's voice. Not a copy of anyone's real voice: a character delivery built
   on the browser's speech synthesis. Each line goes out sentence by sentence
   — whole sentences keep the voice's natural rise and fall, where splitting
   at commas restarts its rhythm and sounds robotic. No two sentences land
   exactly alike, and the last one (the twist) gets a breath before it.
   Two characters: Soft (bright, playful) and Bold (confident). Off until
   the visitor turns sound on. */

const canSpeak = "speechSynthesis" in window;

/* two characters. Soft: brighter, playful, fast. Bold: lower, confident, fast. */
const FEMALE = [
  "Samantha", "Google US English", "Microsoft Jenny Online", "Microsoft Aria Online",
  "Zira", "Karen", "Moira", "Tessa", "Fiona", "Veena", "Google UK English Female",
];
const MALE = [
  "Daniel", "Google UK English Male", "Microsoft Ryan Online", "Microsoft Guy Online",
  "Microsoft Christopher Online", "Microsoft Andrew Online", "Aaron", "Arthur", "Alex",
];
const AVOID = /Fred|Albert|Bad News|Bahh|Bells|Boing|Bubbles|Cellos|Wobble|Zarvox|Trinoids|Whisper|Jester|Organ|Superstar|Ralph|Junior/i;

const store = {
  get(k) { try { return localStorage.getItem(k); } catch { return null; } },
  set(k, v) { try { localStorage.setItem(k, v); } catch { /* private mode */ } },
};

let chosen = null;
let persona = store.get("ari:voice") === "bold" ? "bold" : "soft";
function pickVoice(names) {
  if (!canSpeak) return null;
  const all = speechSynthesis.getVoices().filter((v) => /^en/i.test(v.lang) && !AVOID.test(v.name));
  for (const name of names) {
    const hit = all.find((v) => v.name.includes(name));
    if (hit) return hit;
  }
  return all.find((v) => /natural|enhanced|premium/i.test(v.name)) || all[0] || null;
}
function repick() {
  chosen = pickVoice(persona === "soft" ? FEMALE : MALE);
}
if (canSpeak) {
  repick();
  speechSynthesis.addEventListener?.("voiceschanged", repick);
}

/* Split into sentences — one utterance each. Splitting at commas sounds
   choppy because every utterance restarts the voice's prosody from zero;
   sentences let it rise and fall like it means them. */
function sentences(text) {
  return (text.replace(/\.\.\./g, "…").match(/[^.!?…]+[.!?…]+|[^.!?…]+$/g) || [text])
    .map((p) => p.trim())
    .filter(Boolean);
}

export const voice = {
  available: canSpeak,
  enabled: store.get("ari:sound") !== "off",
  setEnabled(on) {
    this.enabled = !!on;
    store.set("ari:sound", this.enabled ? "on" : "off");
    if (!this.enabled) this.stop();
  },
  get persona() { return persona; },
  setPersona(p) {
    persona = p === "bold" ? "bold" : "soft";
    store.set("ari:voice", persona);
    repick();
  },
  _until: 0,
  _talking: false,
  _run: 0,

  say(text, rm) {
    this.stop();
    this._until = performance.now() + (rm ? 1200 : text.length * 12 + 500);
    if (!this.enabled || !canSpeak) return;

    const run = ++this._run;
    const parts = sentences(text);
    const last = parts.length - 1;
    const base = persona === "soft" ? { rate: 1.08, pitch: 1.0 } : { rate: 1.0, pitch: 0.9 };

    const speakAt = (i) => {
      if (run !== this._run || i > last) { this._talking = false; return; }
      const p = parts[i];
      const u = new SpeechSynthesisUtterance(p.replace(/…/g, "..."));
      if (chosen) { u.voice = chosen; u.lang = chosen.lang; }
      const twist = i === last && last > 0;
      const question = /[?]$/.test(p);
      // human variance: no two sentences land exactly alike; pitch stays
      // near the voice's own, because pushed pitch is what sounds robotic
      const jitter = () => Math.random() * 0.06 - 0.03;
      u.rate = (twist ? base.rate * 0.94 : base.rate) + jitter();
      u.pitch = (twist ? base.pitch - 0.04 : base.pitch) + (question ? 0.06 : 0) + jitter() * 0.5;
      u.volume = 1;
      u.onstart = () => { if (run === this._run) this._talking = true; };
      u.onend = u.onerror = () => {
        if (run !== this._run) return;
        this._talking = false;
        if (i >= last) return;
        let hold = /[…?]$/.test(p) ? 320 : 200;
        if (i + 1 === last && last > 0) hold += 180; // breath before the landing
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
