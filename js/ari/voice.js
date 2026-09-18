/* Ari's voice: the browser's own speech synthesis, off until the visitor turns
   it on. When silent, `speaking()` still follows the typing so the mouth and
   the reactor move with the words. */

const canSpeak = "speechSynthesis" in window;

export const voice = {
  available: canSpeak,
  enabled: false,
  _until: 0,
  _synth: false,

  say(text, rm) {
    this._until = performance.now() + (rm ? 1200 : text.length * 12 + 500);
    if (!this.enabled || !canSpeak) return;
    try {
      speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.rate = 1.04;
      u.pitch = 1.05;
      u.onstart = () => { this._synth = true; };
      u.onend = u.onerror = () => { this._synth = false; };
      speechSynthesis.speak(u);
    } catch { this._synth = false; }
  },

  speaking() { return this._synth || performance.now() < this._until; },

  stop() { if (canSpeak) speechSynthesis.cancel(); this._synth = false; },
};
