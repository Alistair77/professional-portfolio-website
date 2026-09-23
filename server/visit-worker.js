/* Private visit-log backend — Cloudflare Worker (free tier) + Resend email.
 *
 * What it does:
 *   POST /visit  {ts,tz,lang,ref,path,screen,human,ua,name,cityHint}
 *   → resolves coarse city/country from the CONNECTION (request.cf — no IP
 *     storage, the address is never logged or emailed)
 *   → skips obvious bots quietly (204, no email)
 *   → rate-limits: max 1 email per IP per 10 min (in-memory; best-effort)
 *   → emails the owner via Resend: date/time, city, human/bot, self-given
 *     name, language, referrer, screen size
 *
 * Nothing is rendered anywhere. There is no public page, no badge, no feed.
 * The inbox IS the log: search "site visit" to review who came, when, from
 * roughly where. Only someone with your inbox sees it.
 *
 * Setup (10 min, all free):
 *   1. resend.com → API Keys → create key → verify your email (or domain).
 *   2. dash.cloudflare.com → Workers & Pages → Create Worker → paste this file.
 *   3. Worker → Settings → Variables:
 *        RESEND_API_KEY = re_...          (Secret)
 *        OWNER_EMAIL    = you@example.com (Text)
 *        ALLOWED_ORIGIN = https://alistair77.github.io (Text, optional;
 *                         "*" if empty — tighten to your domain)
 *        EMAIL_FROM     = Site log <onboarding@resend.dev> (Text, optional;
 *                         use your verified domain sender in production)
 *   4. Deploy → copy https://<name>.workers.dev/visit
 *   5. On YOUR machine only, run once in DevTools console on your site:
 *        localStorage.setItem("ari:visit-endpoint", "https://<name>.workers.dev/visit")
 *      (Visitors never get this value — it lives in your browser profile.
 *      For all visitors at once, hard-code it via
 *      <meta name="visit-endpoint" content="https://..."> instead — the URL
 *      itself reveals nothing; POSTs without a browser session are ignored
 *      as bots, and there is no GET log to browse.)
 *
 * Legal note (UK/GDPR): this logs coarse city + timestamp per visit without a
 * consent banner. That is the owner's chosen tradeoff for a personal portfolio.
 * The payload is minimal by design (no IP, no fingerprint, no persistent ID;
 * names only when the visitor volunteers one to Ari). If the site ever carries
 * ads or you expand logging, add a one-line privacy note. DevTools Network can
 * always show the beacon — "invisible" means no UI, not undetectable.
 */

const BOT_RE = /bot|crawl|spider|slurp|mediapartners|baidu|yandex|sogou|exabot|facebot|ia_archiver|headless|phantom|playwright|selenium|puppeteer/i;
const seen = new Map(); // ip -> last emailed epoch ms (best-effort, per-isolate)

function cors(origin, allowed) {
  const allow = !allowed || allowed === "*" ? origin || "*" : allowed;
  return {
    "Access-Control-Allow-Origin": allow,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Vary": "Origin",
  };
}

function esc(s) {
  return String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").slice(0, 300);
}

export default {
  async fetch(request, env) {
    const allowed = (env.ALLOWED_ORIGIN || "").trim();
    const origin = request.headers.get("Origin") || "";
    const headers = cors(origin, allowed);

    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers });
    if (request.method !== "POST") return new Response(null, { status: 404, headers });

    let b = {};
    try { b = await request.json(); } catch { return new Response(null, { status: 204, headers }); }
    if (b && typeof b === "object" && b.website) return new Response(null, { status: 204, headers }); // honeypot-proof: ignore junk

    const ua = String(b.ua || request.headers.get("User-Agent") || "").slice(0, 160);
    const human = b.human !== false && !BOT_RE.test(ua);
    if (!human) return new Response(null, { status: 204, headers }); // bots: no email, no noise

    // rate-limit: one email per IP per 10 minutes (visits, not reloads)
    const ip = request.headers.get("CF-Connecting-IP") || "unknown";
    const now = Date.now();
    if (b.kind !== "name" && now - (seen.get(ip) || 0) < 10 * 60 * 1000) {
      return new Response(null, { status: 204, headers });
    }
    seen.set(ip, now);

    const cf = request.cf || {};
    const city = (cf.city || b.cityHint || "").toString().slice(0, 60) || "unknown city";
    const country = (cf.country || "").toString().slice(0, 10);
    const where = country ? `${city}, ${country}` : city;
    const when = (() => { const d = new Date(b.ts || Date.now()); return isNaN(d) ? new Date().toUTCString() : d.toUTCString(); })();
    const name = String(b.name || "").slice(0, 60);
    const subject = b.kind === "name" && name
      ? `Visitor introduced: ${name} (${where})`
      : `Site visit: ${where} · ${when.slice(17, 22)} UTC${name ? ` · ${name}` : ""}`;

    const lines = [
      b.kind === "name" && name ? `${esc(name)} gave their name on the contact flow.` : `Someone opened the site.`,
      ``,
      `When: ${esc(when)}`,
      `Where (coarse): ${esc(where)}${cf.timezone ? ` (${esc(cf.timezone)})` : b.tz ? ` (visitor tz: ${esc(b.tz)})` : ""}`,
      name ? `Self-given name: ${esc(name)}` : null,
      `Language: ${esc(b.lang || "—")}`,
      `Referrer: ${esc(b.ref || "direct / none")}`,
      `Page: ${esc(b.path || "/")}`,
      `Screen: ${esc(b.screen || "—")}`,
      `Person (not bot): yes`,
    ].filter((l) => l !== null);

    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${env.RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: env.EMAIL_FROM || "Site log <onboarding@resend.dev>",
          to: [env.OWNER_EMAIL],
          subject,
          text: lines.join("\n"),
        }),
      });
      if (!res.ok) console.log("resend failed", res.status, await res.text().catch(() => ""));
    } catch (e) {
      console.log("email error", String(e).slice(0, 200));
    }
    return new Response(null, { status: 204, headers });
  },
};
