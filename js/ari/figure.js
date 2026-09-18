/* Ari's body of light. Every dot is placed once at load; each frame only moves
   and brightens them. Face, eyes, neck and traps are shared; below the neck
   is either a T-shirt or a robotic body with an animated arc reactor. */

const TAU = Math.PI * 2;
const FW = 310, FH = 412, OX = 155, OY = 146, RX = 70, RY = 88;
const clamp = (v, a = -1, b = 1) => Math.max(a, Math.min(b, v));
const g1 = (d, s) => Math.exp(-(d * d) / (2 * s * s));
const g2 = (dx, dy, sx, sy) => Math.exp(-(dx * dx) / (2 * sx * sx) - (dy * dy) / (2 * sy * sy));
const inOval = (x, y) => ((x - OX) / RX) ** 2 + ((y - OY) / RY) ** 2;
const wrap = (x) => { const a = Math.abs(x) % 1; return Math.min(a, 1 - a); };

function dot(list, hx, hy, props) {
  list.push(Object.assign({
    hx, hy, kind: "cloth", base: 0, eyeG: 0, mouth: 0, depth: 0.3, edx: 0, edy: 0, sweep: null, blinkK: null,
    sx: hx + (Math.random() - 0.5) * 140, sy: FH + 10 + Math.random() * 120,
    delay: (1 - hy / FH) * 0.45 + Math.random() * 0.2,
  }, props));
}

/* sample a polyline into dots; `sweepPhase` tags each with its position along the path */
function stroke(list, pts, gap, props, sweepPhase = null) {
  let total = 0;
  for (let i = 0; i < pts.length - 1; i++) total += Math.hypot(pts[i + 1][0] - pts[i][0], pts[i + 1][1] - pts[i][1]);
  let run = 0;
  const put = (x, y) => {
    const p = props(x, y);
    if (sweepPhase !== null) p.sweep = ((total ? run / total : 0) + sweepPhase) % 1;
    dot(list, x, y, p);
  };
  for (let i = 0; i < pts.length - 1; i++) {
    const [ax, ay] = pts[i], [bx, by] = pts[i + 1];
    const len = Math.hypot(bx - ax, by - ay), n = Math.max(1, Math.ceil(len / gap));
    for (let k = 0; k < n; k++) { put(ax + (bx - ax) * k / n, ay + (by - ay) * k / n); run += len / n; }
  }
  put(pts[pts.length - 1][0], pts[pts.length - 1][1]);
}

const ring = (cx, cy, rx, ry, a0 = 0, a1 = TAU, n = 40) =>
  Array.from({ length: n + 1 }, (_, i) => { const a = a0 + (a1 - a0) * i / n; return [cx + rx * Math.cos(a), cy + ry * Math.sin(a)]; });
const fade = (y) => (y < 300 ? 1 : (0.62 + 0.38 * (1 - (y - 300) / 112)) * (y > 398 ? (FH - y) / 14 + 0.2 : 1));
const C = (b) => (x, y) => ({ kind: "cloth", base: b * fade(y) });
const RIVET = (k) => (x, y) => ({ kind: "cloth", base: 0.5 * fade(y), blinkK: k });

const neckHW = (y) => (y < 272 ? 24 : 24 + (y - 272) * 0.4);
const shoulderHW = (y) => {
  if (y < 318) { const t = Math.max(0, (y - 282) / 36); return 30 + 82 * (1 - (1 - t) * (1 - t)); }
  if (y < 352) return 112 + 34 * Math.sin((y - 318) / 34 * Math.PI / 2);
  return 146 - (y - 352) * 0.08;
};

/* ── face, eyes, neck, traps ── */
const BASE = (() => {
  const L = [], step = 6;
  for (let y = OY - RY, row = 0; y <= OY + RY; y += step, row++) {
    for (let x = OX - RX + (row % 2) * step / 2; x <= OX + RX; x += step) {
      const d2 = inOval(x, y);
      if (d2 > 1) continue;
      const rim = d2 > 0.8 ? 0.34 * (d2 - 0.8) / 0.2 : 0;
      const ex = RX * 0.37, ey = -RY * 0.14, es = RX * 0.14;
      const eyeG = Math.max(g2(x - OX + ex, y - OY - ey, es, es), g2(x - OX - ex, y - OY - ey, es, es)) * 0.3;
      const mouth = g2(x - OX, y - OY - RY * 0.5, RX * 0.27, 4.5);
      const nose = Math.abs(x - OX) < 3 && y > OY - 2 && y < OY + RY * 0.26 ? 0.14 : 0;
      dot(L, x, y, { kind: "head", base: 0.12 + 0.18 * (1 - d2) + rim + nose, eyeG, mouth, depth: 1 - d2 });
    }
  }
  for (const s of [-1, 1]) {
    const cx = OX + s * 26, cy = OY - 12;
    for (let dy = -10, row = 0; dy <= 10; dy += 2.6, row++) {
      for (let dx = -16 + (row % 2) * 1.3; dx <= 16; dx += 2.6) {
        if ((dx / 16) ** 2 + (dy / 10) ** 2 > 1) continue;
        dot(L, cx + dx, cy + dy, { kind: "eye", edx: dx, edy: dy, depth: 1 - inOval(cx + dx, cy + dy) });
      }
    }
    const brow = [];
    for (let cu = -15; cu <= 15; cu += 2.6) brow.push([cx + cu, OY - 30 + 0.012 * cu * cu + s * cu * 0.05]);
    stroke(L, brow, 2.6, (x, y) => ({ kind: "head", base: 0.42, depth: 1 - inOval(x, y) }));
  }
  for (let y = 222, row = 0; y <= 300; y += 6, row++) {
    const hw = neckHW(y);
    for (let x = OX - hw + (row % 2) * 3; x <= OX + hw; x += 6) {
      if (inOval(x, y) < 1) continue;
      let base = 0.11 + (Math.abs(x - OX) > hw - 5 ? 0.14 : 0) + 0.14 * g2(x - OX, y - 262, 4, 5);
      if (y < 238) base *= 0.6;
      dot(L, x, y, { kind: "neck", base });
    }
  }
  for (const s of [-1, 1]) {
    stroke(L, [[OX + s * 24, 230], [OX + s * 24, 272], [OX + s * 28, 282]], 3, () => ({ kind: "neck", base: 0.44 }));
    stroke(L, [[OX + s * 21, 236], [OX + s * 7, 296]], 3, () => ({ kind: "neck", base: 0.3 }));
  }
  return L;
})();

function torsoFill(L, base) {
  for (let y = 296, row = 0; y <= FH; y += 6, row++) {
    const hw = shoulderHW(y);
    for (let x = OX - hw + (row % 2) * 3; x <= OX + hw; x += 6) {
      const u = x - OX;
      if (y < 304 && Math.abs(u) < neckHW(y) + 2) continue;
      dot(L, x, y, { kind: "cloth", base: (base + (Math.abs(u) > hw - 7 ? 0.14 : 0)) * fade(y) });
    }
  }
}
function silhouette(L, fromY, toY, b) {
  for (const s of [-1, 1]) {
    const pts = [];
    for (let y = fromY; y <= toY; y += 2.5) pts.push([OX + s * shoulderHW(y), y]);
    stroke(L, pts, 3, C(b));
  }
}

/* ── T-shirt ── */
const TEE = (() => {
  const L = [];
  torsoFill(L, 0.09);
  silhouette(L, 282, FH, 0.5);
  stroke(L, ring(OX, 297, 33, 16, 0.05, Math.PI - 0.05), 3, C(0.52));
  stroke(L, ring(OX, 297, 28, 11, 0.1, Math.PI - 0.1), 3, C(0.3));
  for (const s of [-1, 1]) {
    stroke(L, [[OX + s * 104, 322], [OX + s * 111, 340], [OX + s * 116, 360], [OX + s * 120, 380]], 3, C(0.34));
    stroke(L, [[OX + s * 120, 398], [OX + s * 150, 394]], 3, C(0.38));
    stroke(L, [[OX + s * 114, 386], [OX + s * 86, 408]], 3.5, C(0.14));
    stroke(L, [[OX + s * 62, 338], [OX + s * 44, 352]], 3.5, C(0.12));
  }
  return L;
})();

/* ── robotic ── */
const RCX = OX, RCY = 362;
const ROBOT = (() => {
  const L = [];
  torsoFill(L, 0.05);
  silhouette(L, 282, 318, 0.5);
  stroke(L, ring(OX, 301, 34, 9), 3, C(0.5), 0);
  stroke(L, ring(OX, 301, 29, 6.5, 0, Math.PI), 3, C(0.28));
  [0.35, 1.2, 1.95, 2.8].forEach((a, k) => stroke(L, ring(OX + 34 * Math.cos(a), 301 + 9 * Math.sin(a), 1.8, 1.8, 0, TAU, 6), 1.2, RIVET(k)));
  stroke(L, [[OX - 72, 318], [OX + 72, 318], [OX + 92, 350], [OX + 62, 404], [OX - 62, 404], [OX - 92, 350], [OX - 72, 318]], 2.8, C(0.5), 0);
  stroke(L, [[OX - 54, 332], [OX + 54, 332], [OX + 70, 352], [OX + 46, 392], [OX - 46, 392], [OX - 70, 352], [OX - 54, 332]], 3, C(0.24), 0.5);
  for (const s of [-1, 1]) {
    for (const vy of [372, 379, 386]) stroke(L, [[OX + s * 30, vy], [OX + s * 48, vy - 3]], 3, C(0.24));
    /* armoured shoulders: shell, two overlapping plates, a raised ridge, rivets */
    stroke(L, [[OX + s * 90, 322], [OX + s * 114, 312], [OX + s * 136, 318], [OX + s * 152, 336], [OX + s * 158, 360], [OX + s * 142, 368], [OX + s * 118, 366], [OX + s * 100, 352], [OX + s * 90, 322]], 2.6, C(0.52), s > 0 ? 0.25 : 0.75);
    stroke(L, [[OX + s * 98, 332], [OX + s * 122, 324], [OX + s * 142, 334], [OX + s * 152, 352]], 2.8, C(0.3));
    stroke(L, [[OX + s * 106, 345], [OX + s * 128, 339], [OX + s * 146, 350], [OX + s * 153, 362]], 2.8, C(0.26));
    stroke(L, [[OX + s * 104, 317], [OX + s * 128, 315], [OX + s * 146, 327]], 2.4, C(0.62));
    [[112, 322], [134, 328], [148, 346]].forEach(([px, py], k) => stroke(L, ring(OX + s * px, py, 1.8, 1.8, 0, TAU, 6), 1.2, RIVET(k + (s > 0 ? 4 : 7))));
    stroke(L, [[OX + s * 124, 370], [OX + s * 126, FH]], 3, C(0.32));
    stroke(L, [[OX + s * 150, 366], [OX + s * 150, FH]], 3, C(0.36));
    stroke(L, [[OX + s * 125, 392], [OX + s * 150, 390]], 3, C(0.3), 0.5);
    stroke(L, [[OX + s * 92, 350], [OX + s * 112, 368]], 3, C(0.2));
  }
  return L;
})();

const BODIES = { tee: TEE, robot: ROBOT };
const TINT = { tee: "150,198,255", robot: "160,226,255" };

export function createFigure(canvas) {
  const ctx = canvas.getContext("2d");

  /* the arc reactor: a heartbeat core, counter-rotating rings, a ripple on each beat */
  function reactor(t, level, ox, oy, ready, rm) {
    if (ready <= 0) return;
    const cx = RCX + ox, cy = RCY + oy, P = 1600, A = ready;
    const ph = (t % P) / P;
    const beat = rm ? 0.4 : Math.exp(-((ph - 0.06) ** 2) / 0.0014) + 0.6 * Math.exp(-((ph - 0.22) ** 2) / 0.0014);
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    const glow = ctx.createRadialGradient(cx, cy, 2, cx, cy, 46);
    glow.addColorStop(0, `rgba(150,245,255,${(0.22 + beat * 0.22 + level * 0.25) * A})`);
    glow.addColorStop(1, "rgba(150,245,255,0)");
    ctx.fillStyle = glow; ctx.fillRect(cx - 50, cy - 50, 100, 100);
    if (!rm) for (const off of [0, 0.5]) {
      const rp = ((t + off * P) % P) / (P * 0.8);
      if (rp < 1) {
        ctx.strokeStyle = `rgba(150,245,255,${0.45 * (1 - rp) * A})`;
        ctx.lineWidth = 1.2;
        ctx.beginPath(); ctx.arc(cx, cy, 9 + 26 * rp, 0, TAU); ctx.stroke();
      }
    }
    ctx.strokeStyle = `rgba(150,245,255,${0.8 * A})`; ctx.lineWidth = 1.4;
    ctx.beginPath(); ctx.arc(cx, cy, 16, 0, TAU); ctx.stroke();
    const rot = rm ? 0 : t / 900;
    ctx.lineWidth = 2.4; ctx.strokeStyle = `rgba(190,250,255,${(0.7 + level * 0.3) * A})`;
    for (let i = 0; i < 6; i++) { const a = rot + i * TAU / 6; ctx.beginPath(); ctx.arc(cx, cy, 11.5, a, a + 0.72); ctx.stroke(); }
    const rot2 = rm ? 0 : -t / 1400;
    ctx.lineWidth = 1.4; ctx.strokeStyle = `rgba(150,245,255,${0.6 * A})`;
    for (let i = 0; i < 12; i++) {
      const a = rot2 + i * TAU / 12;
      ctx.beginPath(); ctx.moveTo(cx + Math.cos(a) * 18.5, cy + Math.sin(a) * 18.5); ctx.lineTo(cx + Math.cos(a) * 21.5, cy + Math.sin(a) * 21.5); ctx.stroke();
    }
    const cr = 5 + beat * 2.6 + level * 1.5;
    const core = ctx.createRadialGradient(cx, cy, 0, cx, cy, cr * 1.8);
    core.addColorStop(0, `rgba(255,255,255,${A})`);
    core.addColorStop(0.45, `rgba(170,250,255,${(0.75 + beat * 0.25) * A})`);
    core.addColorStop(1, "rgba(120,230,255,0)");
    ctx.fillStyle = core; ctx.beginPath(); ctx.arc(cx, cy, cr * 1.8, 0, TAU); ctx.fill();
    ctx.restore();
  }

  /* s = { t, level, lean:{x,y}, blink, age, bodyAge, breath, body, rm } */
  function draw(s) {
    const { t, level, lean, blink, age, bodyAge, breath, body, rm } = s;
    ctx.setTransform(canvas.width / FW, 0, 0, canvas.height / FH, 0, 0);
    ctx.clearRect(0, 0, FW, FH);

    const floor = ctx.createRadialGradient(OX, FH, 10, OX, FH, 190);
    floor.addColorStop(0, `rgba(139,107,255,${0.22 + level * 0.15})`); floor.addColorStop(1, "rgba(139,107,255,0)");
    ctx.fillStyle = floor; ctx.fillRect(0, 0, FW, FH);
    const halo = ctx.createRadialGradient(OX + lean.x * 10, OY, 20, OX + lean.x * 10, OY, 130);
    halo.addColorStop(0, `rgba(139,107,255,${0.14 + level * 0.2})`); halo.addColorStop(1, "rgba(139,107,255,0)");
    ctx.fillStyle = halo; ctx.fillRect(0, 0, FW, FH);

    const robot = body === "robot";
    const ready = rm ? 1 : clamp((bodyAge - 1) / 0.5, 0, 1);
    const scan = rm || age < 1.4 ? null : ((t / 11) % 900) - 250;
    const sweepPos = (t / 2600) % 1;
    const gx = lean.x * 3.4, gy = lean.y * 2.4;
    const tint = TINT[body];

    ctx.globalCompositeOperation = "lighter";
    for (const list of [BASE, BODIES[body]]) {
      for (const d of list) {
        const isBody = d.kind === "cloth";
        const p = Math.min(1, Math.max(0, ((isBody ? bodyAge : age) - d.delay) / 0.7));
        const e = 1 - Math.pow(1 - p, 3);
        let ox, oy;
        if (isBody) { ox = lean.x * 2; oy = breath; }
        else if (d.kind === "neck") { const w = clamp((300 - d.hy) / 78, 0, 1); ox = lean.x * (4 + 8 * w); oy = lean.y * (2 + 4 * w) + breath * 0.6 * (1 - w); }
        else {
          const eyeP = d.kind === "eye" ? 1 : d.eyeG;
          ox = lean.x * (10 + 8 * d.depth) + eyeP * lean.x * 4;
          oy = lean.y * (6 + 5 * d.depth) + eyeP * lean.y * 3;
        }
        const x = d.sx + (d.hx + ox - d.sx) * e, y = d.sy + (d.hy + oy - d.sy) * e;
        const shimmer = rm ? 1 : 0.84 + 0.16 * Math.sin(t / 620 + d.hx * 0.05 + d.hy * 0.04);

        let a, rgb, r0 = 0.7, rk = 1.3;
        if (d.kind === "eye") {
          const ry = 10 * blink + 0.6;
          const inside = (d.edx / 16) ** 2 + (d.edy / ry) ** 2;
          a = 0;
          if (inside <= 1) {
            a = 0.2;
            if (blink > 0.5) { const dd = Math.hypot(d.edx - gx, d.edy - gy); a += 0.9 * g1(dd - 5.4, 1.05) + (dd < 2.6 ? 1 : 0); }
          }
          a += 0.85 * Math.exp(-((inside - 1) ** 2) / 0.03);
          a = a * shimmer + level * 0.05;
          rgb = "236,244,255"; r0 = 0.55; rk = 1.0;
        } else if (d.kind === "head") {
          a = (d.base + d.eyeG * 0.95 * blink + d.mouth * (0.1 + level * 0.95)) * shimmer + level * 0.06;
          rgb = "210,224,255"; rk = 1.35;
        } else if (d.kind === "neck") {
          a = d.base * shimmer + level * 0.03;
          rgb = "196,188,255";
        } else {
          a = d.base * shimmer + level * 0.03;
          if (robot && !rm) {
            if (d.sweep !== null) a += 0.6 * g1(wrap(d.sweep - sweepPos), 0.028) * ready;
            if (d.blinkK !== null) a += 0.55 * Math.pow(Math.max(0, Math.sin(t / 260 - d.blinkK * 1.1)), 8) * ready;
          }
          rgb = tint;
        }
        if (scan !== null) a += 0.32 * Math.exp(-((d.hy - scan) * (d.hy - scan)) / 180);
        a = Math.min(1, a) * (0.3 + 0.7 * e);
        if (a < 0.02) continue;
        ctx.fillStyle = `rgba(${rgb},${a.toFixed(3)})`;
        ctx.beginPath(); ctx.arc(x, y, r0 + a * rk, 0, TAU); ctx.fill();
      }
    }
    ctx.globalCompositeOperation = "source-over";
    if (robot) reactor(t, level, lean.x * 2, breath, rm ? 1 : clamp((bodyAge - 0.7) / 0.6, 0, 1), rm);
  }

  return { draw };
}
