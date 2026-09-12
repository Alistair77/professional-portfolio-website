/* The greeting that plays before the desktop appears.

   The desktop is fully built behind this overlay the whole time — the black
   layer just hides it until the script has drawn itself, so the hand-off is a
   single fade with nothing loading underneath it. */

const boot = document.getElementById("boot");

const DRAW_MS = 2120;  // 320ms delay + 1800ms stroke
const HOLD_MS = 420;   // let the finished word sit for a beat
const FADE_MS = 700;   // matches the CSS transition

let finished = false;

function reveal() {
  if (finished) return;
  finished = true;

  boot?.classList.add("done");
  // tell the desktop it may start its own entrance
  document.dispatchEvent(new CustomEvent("boot:ready"));
  setTimeout(() => boot?.remove(), FADE_MS + 60);
}

if (!boot) {
  // nothing to show — never leave the desktop waiting on a missing overlay
  document.dispatchEvent(new CustomEvent("boot:ready"));
} else {
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  boot.classList.add("draw");
  setTimeout(reveal, reduced ? 900 : DRAW_MS + HOLD_MS);

  // let people past it — a greeting should never feel like a gate
  const skip = () => reveal();
  boot.addEventListener("click", skip);
  addEventListener("keydown", skip, { once: true });
}
