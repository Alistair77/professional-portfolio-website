/* Silent visit ping — private log for the site owner.
 *
 * No UI, no badge, no console output. Sends ONE ping per tab session to the
 * owner's endpoint, which emails them (date/time, coarse city, human/bot,
 * optional self-given name). Nothing is shown to visitors.
 *
 * Privacy design (deliberate):
 * - No IP stored in the browser payload (the backend resolves coarse
 *   city/country from the connection and discards the address).
 * - No fingerprinting: no canvas, no fonts, no persistent IDs. A
 *   sessionStorage flag is the only state, and it dies with the tab.
 * - Name is included ONLY if the visitor voluntarily gave it to Ari when
 *   asked on the contact flow (skippable). Never inferred.
 * - Bots are flagged (isHuman:false) so the backend can skip emailing them.
 * - Disabled until the owner sets an endpoint: window.__VISIT_ENDPOINT or
 *   localStorage "ari:visit-endpoint". Until then this file does nothing and
 *   makes no network request of its own.
 *
 * Owner setup: paste your Worker URL once in DevTools console on your own
 * machine (it persists in YOUR browser only — visitors never get it):
 *   localStorage.setItem("ari:visit-endpoint", "https://your-worker.workers.dev/visit")
 * Or set window.__VISIT_ENDPOINT before this script loads. Production sites
 * should hard-code the URL via the meta tag <meta name="visit-endpoint">.
 */

(() => {
  try {
    const meta = document.querySelector('meta[name="visit-endpoint"]');
    const endpoint = (
      window.__VISIT_ENDPOINT ||
      meta?.content ||
      (() => { try { return localStorage.getItem("ari:visit-endpoint"); } catch { return null; } })() ||
      ""
    ).trim().replace(/\/+$/, "");
    if (!endpoint) return; // not configured: stay completely silent
    if (/^(http:\/\/localhost|http:\/\/127\.0\.0\.1)/.test(endpoint) &&
        !/^https?:\/\/(localhost|127\.0\.0\.1)/.test(location.href)) return; // never leak to local dev from prod

    let already = false;
    try { already = sessionStorage.getItem("vlog:sent") === "1"; } catch { /* private mode */ }
    const isNameUpdate = window.__visitNameUpdate === true;
    if (already && !isNameUpdate) return;
    try { sessionStorage.setItem("vlog:sent", "1"); } catch { /* private mode */ }
    window.__visitNameUpdate = false;

    const ua = String(navigator.userAgent || "").slice(0, 160);
    const botRe = /bot|crawl|spider|slurp|mediapartners|baidu|yandex|sogou|exabot|facebot|ia_archiver|headless|phantom|playwright|selenium|puppeteer/i;
    let name = "";
    try { name = (localStorage.getItem("ari:visitor-name") || "").slice(0, 60); } catch { /* private mode */ }
    // coarse city hint reused from the weather widget (already on screen);
    // the backend prefers its own connection-level geo and treats this as fallback only
    const wxPlace = (document.getElementById("wx-place")?.textContent || "").trim();
    const payload = {
      v: 1,
      kind: isNameUpdate ? "name" : "visit",
      ts: new Date().toISOString(),
      tz: (() => { try { return Intl.DateTimeFormat().resolvedOptions().timeZone || ""; } catch { return ""; } })().slice(0, 60),
      lang: (navigator.language || "").slice(0, 20),
      ref: (document.referrer || "").slice(0, 300),
      path: (location.pathname || "/").slice(0, 100),
      screen: `${window.innerWidth || 0}x${window.innerHeight || 0}`,
      human: !botRe.test(ua),
      ua,
      name,
      cityHint: wxPlace && wxPlace !== "—" ? wxPlace.slice(0, 60) : "",
    };
    const body = JSON.stringify(payload);
    if (navigator.sendBeacon) {
      try {
        const blob = new Blob([body], { type: "application/json" });
        if (navigator.sendBeacon(endpoint, blob)) return;
      } catch { /* fall through to fetch */ }
    }
    try {
      fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
        keepalive: true,
        credentials: "omit",
      }).catch(() => {});
    } catch { /* silent */ }
  } catch { /* never break the page, never surface */ }
})();

/* Called by Ari when a visitor voluntarily shares a name. Queues one extra
 * silent ping (kind:"name") so the owner sees "Visitor called X" next to the
 * visit email. No-op when no endpoint is configured. */
window.__setVisitorName = function (n) {
  try {
    try { localStorage.setItem("ari:visitor-name", String(n || "").slice(0, 60)); } catch { /* private mode */ }
    window.__visitNameUpdate = true;
  } catch { /* silent */ }
};
