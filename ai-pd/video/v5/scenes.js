/* AI literacy v5 (narrated, "For moderation"): scenes timed to Leah's narration (manifest.js, built by make_voice.py).
   Every frame is a pure function of time. Booklet pages: ../v4/snips (rendered from the updated PDFs at 220 dpi). */
const CUE = {}; NARR.cues.forEach((c) => { CUE[c.cue + '@' + c.scene] = c; });
const C = (sc, name) => CUE[name + '@' + sc] || (() => { throw new Error('no cue ' + sc + ' ' + name); })();
const ca = (sc, n) => C(sc, n).a, cb = (sc, n) => C(sc, n).b;
const SC = NARR.scenes;   // { '1': {start, end}, ... }
const END_NARR = NARR.dur, ENDCARD = END_NARR + 1.2, DUR = Math.ceil((ENDCARD + 7.5) * 10) / 10;
const WIPE = 0.9;
const sceneA = (k) => (k === 1 ? 0 : SC[k].start - WIPE), sceneB = (k) => (k === 9 ? ENDCARD : SC[k + 1].start - WIPE);
const CHAPTER = { 1: 'Start here', 2: 'The evidence', 3: 'Four traps', 4: 'Your brain does the work', 5: 'Attempt first', 6: 'Prompt like a pro', 7: 'Check it, stay safe', 8: 'The world has moved', 9: 'The two booklets' };
const BG = { 1: INK, 2: PAPER, 3: PAPER, 4: PAPER, 5: PAPER, 6: PAPER, 7: PAPER, 8: INK, 9: PAPER };
const IMG = {};
const ease = E.quartInOut;
const ap = (t, a, d = 0.6) => E.quartOut(prog(t, a, a + d));            // appear progress
const lerp = (a, b, p) => a + (b - a) * p;

/* ---------- a booklet page with a moving camera ---------- */
// cams: [[time, [x0,y0,x1,y1]], ...] in page fractions; view: [x, y, w, h] on screen
function camAt(cams, t) {
  let r = cams[0][1];
  for (let i = 1; i < cams.length; i++) {
    const [tk, rk] = cams[i], p = ease(prog(t, tk - 0.5, tk + 0.6));
    if (p <= 0) break;
    r = r.map((v, j) => lerp(v, rk[j], p));
  }
  return r;
}
function pageXf(img, rect, view) {
  const [x0, y0, x1, y1] = rect, [vx, vy, vw, vh] = view, iw = img.width, ih = img.height;
  const rw = (x1 - x0) * iw, rh = (y1 - y0) * ih, s = Math.min(vw / rw, vh / rh);
  const cx = (x0 + x1) / 2 * iw, cy = (y0 + y1) / 2 * ih;
  return { s, tx: vx + vw / 2 - cx * s, ty: vy + vh / 2 - cy * s, iw, ih };
}
const P = (xf, fx, fy) => [xf.tx + fx * xf.iw * xf.s, xf.ty + fy * xf.ih * xf.s];   // page fraction -> screen
function drawPage(ctx, img, xf, alpha = 1) {
  ctx.save(); ctx.globalAlpha = alpha;
  ctx.shadowColor = 'rgba(0,0,0,.28)'; ctx.shadowBlur = 40; ctx.shadowOffsetY = 14;
  ctx.fillStyle = '#fff'; ctx.fillRect(xf.tx, xf.ty, xf.iw * xf.s, xf.ih * xf.s);
  ctx.shadowColor = 'transparent';
  ctx.imageSmoothingQuality = 'high'; ctx.drawImage(img, xf.tx, xf.ty, xf.iw * xf.s, xf.ih * xf.s);
  ctx.restore();
}
function clipView(ctx, view) { ctx.beginPath(); ctx.roundRect(view[0], view[1], view[2], view[3], 18); ctx.clip(); }
// spotlight: dim everything in the view except rect r (page fractions)
function spot(ctx, xf, view, r, k) {
  if (k <= 0) return;
  const [a, b] = P(xf, r[0], r[1]), [c, d] = P(xf, r[2], r[3]), pad = 10;
  ctx.save(); ctx.globalAlpha = 0.42 * k; ctx.fillStyle = '#0d0e11';
  ctx.beginPath(); ctx.rect(view[0], view[1], view[2], view[3]); ctx.roundRect(a - pad, b - pad, c - a + 2 * pad, d - b + 2 * pad, 16); ctx.fill('evenodd');
  ctx.restore();
  ring(ctx, a - pad, b - pad, c - a + 2 * pad, d - b + 2 * pad, k);
}
function ring(ctx, x, y, w, h, k, col = RED, lw = 5) {
  if (k <= 0) return;
  const per = 2 * (w + h); ctx.save(); ctx.strokeStyle = col; ctx.lineWidth = lw; ctx.lineCap = 'round';
  ctx.setLineDash([per * k, per]); ctx.beginPath(); ctx.roundRect(x, y, w, h, 16); ctx.stroke(); ctx.restore();
}
function ovalAround(ctx, x, y, w, h, k, col = RED) {   // a hand-drawn ellipse that draws itself
  if (k <= 0) return;
  ctx.save(); ctx.strokeStyle = col; ctx.lineWidth = 6; ctx.lineCap = 'round'; ctx.beginPath();
  const n = 60, end = Math.floor(n * 1.08 * k);
  for (let i = 0; i <= end; i++) { const a = -2.2 + (i / n) * Math.PI * 2, wob = 1 + 0.03 * Math.sin(i * 0.9);
    const px = x + w / 2 + Math.cos(a) * (w / 2 + 16) * wob, py = y + h / 2 + Math.sin(a) * (h / 2 + 12) * wob; i ? ctx.lineTo(px, py) : ctx.moveTo(px, py); }
  ctx.stroke(); ctx.restore();
}
function strike(ctx, x1, y1, x2, y2, k, col = RED) { if (k <= 0) return; ctx.save(); ctx.strokeStyle = col; ctx.lineWidth = 7; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(lerp(x1, x2, k), lerp(y1, y2, k)); ctx.stroke(); ctx.restore(); }
function marker(ctx, x, y, w, h, k, col = 'rgba(227,18,27,.22)') { if (k <= 0) return; ctx.fillStyle = col; ctx.fillRect(x - 6, y - 4, (w + 12) * k, h + 8); }
function arrow(ctx, x1, y1, x2, y2, k, col = RED, lw = 6) {
  if (k <= 0) return;
  const x = lerp(x1, x2, k), y = lerp(y1, y2, k), a = Math.atan2(y2 - y1, x2 - x1);
  ctx.save(); ctx.strokeStyle = col; ctx.fillStyle = col; ctx.lineWidth = lw; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x - Math.cos(a) * 14, y - Math.sin(a) * 14); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - 30 * Math.cos(a - 0.45), y - 30 * Math.sin(a - 0.45)); ctx.lineTo(x - 30 * Math.cos(a + 0.45), y - 30 * Math.sin(a + 0.45)); ctx.closePath(); ctx.fill();
  ctx.restore();
}
function tick(ctx, x, y, s, k, col = '#1f9d55') {
  if (k <= 0) return;
  ctx.save(); ctx.strokeStyle = col; ctx.lineWidth = s * 0.16; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  const pts = [[x, y + s * 0.5], [x + s * 0.35, y + s * 0.85], [x + s, y]], L1 = 0.45, p1 = clamp(k / L1), p2 = clamp((k - L1) / (1 - L1));
  ctx.beginPath(); ctx.moveTo(...pts[0]); ctx.lineTo(lerp(pts[0][0], pts[1][0], p1), lerp(pts[0][1], pts[1][1], p1));
  if (p2 > 0) ctx.lineTo(lerp(pts[1][0], pts[2][0], p2), lerp(pts[1][1], pts[2][1], p2)); ctx.stroke(); ctx.restore();
}
function pill(ctx, s, x, y, size, fg, bg, k, align = 'left') {
  if (k <= 0) return 0;
  setType(ctx, F.g(500, size), size, 0); const w = ctx.measureText(s).width + size * 1.4, h = size * 1.9;
  const x0 = align === 'left' ? x : x - w / 2, dy = (1 - k) * 24;
  ctx.save(); ctx.globalAlpha = k; ctx.fillStyle = bg; ctx.beginPath(); ctx.roundRect(x0, y - h / 2 + dy, w, h, h / 2); ctx.fill();
  ctx.fillStyle = fg; ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillText(s, x0 + size * 0.7, y + dy + 1); ctx.restore(); ctx.textBaseline = 'alphabetic';
  return w;
}
function txt(ctx, s, x, y, size, kind, color, k, align = 'left', maxW = 0) {
  if (k <= 0) return;
  const font = kind === 's' ? F.serif(size) : kind === 'm' ? F.mono(size) : F.g(kind === 'g5' ? 500 : kind === 'g4' ? 400 : 700, size);
  setType(ctx, font, size, kind === 'm' ? size * 0.14 : kind === 's' ? -size * 0.018 : undefined);
  ctx.save(); ctx.globalAlpha = k; ctx.fillStyle = color; ctx.textAlign = align;
  if (maxW) { const lines = wrap(ctx, s, maxW); lines.forEach((l, i) => ctx.fillText(l, x, y + i * size * 1.22 + (1 - k) * 18)); }
  else ctx.fillText(s, x, y + (1 - k) * 18);
  ctx.restore();
}
function wrap(ctx, s, maxW) { const out = []; let line = ''; for (const w of s.split(' ')) { const t = line ? line + ' ' + w : w; if (ctx.measureText(t).width > maxW && line) { out.push(line); line = w; } else line = t; } if (line) out.push(line); return out; }

/* ---------- page coordinates (fractions of each page, read off a 5% grid) ---------- */
const PG = {
  traps: { f: 'junior-p5-traps', all: [0.06, 0.48, 0.94, 0.925], c1: [0.075, 0.545, 0.49, 0.72], c2: [0.51, 0.545, 0.93, 0.72], c3: [0.075, 0.735, 0.49, 0.915], c4: [0.51, 0.735, 0.93, 0.915] },
  power: { f: 'junior-p10-powerups', all: [0.06, 0.575, 0.94, 0.795], cards: [[0.075, 0.62, 0.24, 0.785], [0.25, 0.62, 0.415, 0.785], [0.42, 0.62, 0.585, 0.785], [0.595, 0.62, 0.755, 0.785], [0.77, 0.62, 0.93, 0.785]] },
  routine: { f: 'junior-p12-hintladder', steps: [0.06, 0.085, 0.94, 0.48], rows: [[0.075, 0.2, 0.93, 0.245], [0.075, 0.252, 0.93, 0.305], [0.075, 0.313, 0.93, 0.358], [0.075, 0.368, 0.93, 0.413], [0.075, 0.423, 0.93, 0.468]],
    ladder: [0.05, 0.515, 0.95, 0.785], rungs: [[0.53, 0.717, 0.915, 0.75], [0.53, 0.677, 0.915, 0.708], [0.53, 0.637, 0.915, 0.668], [0.53, 0.595, 0.915, 0.628], [0.53, 0.555, 0.915, 0.588]] },
  words: { f: 'junior-p14-21words', box: [0.06, 0.69, 0.94, 0.87], n21: [0.09, 0.75, 0.215, 0.79], n9: [0.335, 0.828, 0.357, 0.848] },
  starr: { f: 'junior-p16-start', all: [0.06, 0.08, 0.94, 0.42], cards: [[0.075, 0.215, 0.24, 0.41], [0.25, 0.215, 0.415, 0.41], [0.42, 0.215, 0.585, 0.41], [0.595, 0.215, 0.755, 0.41], [0.77, 0.215, 0.93, 0.41]] },
  check: { f: 'junior-p19-checkit', all: [0.06, 0.075, 0.94, 0.505], c1: [0.075, 0.2, 0.49, 0.34], c2: [0.51, 0.2, 0.93, 0.34], itself: [0.605, 0.447, 0.893, 0.467] },
  safe: { f: 'junior-p20-safety', all: [0.06, 0.08, 0.94, 0.695], priv: [0.51, 0.19, 0.93, 0.365], friend: [0.075, 0.385, 0.49, 0.535], fakes: [0.51, 0.385, 0.93, 0.535] },
  deep: { f: 'junior-p21-deepfake', all: [0.06, 0.385, 0.94, 0.665], title: [0.07, 0.398, 0.43, 0.428], box: [0.555, 0.445, 0.93, 0.655] },
  build: { f: 'senior-p24-skills', all: [0.455, 0.285, 0.94, 0.64], cards: [[0.46, 0.315, 0.93, 0.415], [0.46, 0.43, 0.93, 0.515], [0.46, 0.527, 0.93, 0.63]], exp: [[0.584, 0.37, 0.925, 0.387], [0.553, 0.389, 0.612, 0.404]] },
};
const VIEW_FULL = [M, 140, W - 2 * M, 760], VIEW_L = [M, 140, 1060, 760];

/* ---------- the scenes ---------- */
const SCENES = {
  1(ctx, t) {   // Start here
    const fg = PAPER;
    const k0 = ap(t, 0.2) * (1 - ap(t, ca(1, 'search') - 0.2, 0.5));
    txt(ctx, 'Be honest.', M, 330, 64, 'g5', GREY, ap(t, ca(1, 'honest')) * (1 - ap(t, ca(1, 'search') - 0.2, 0.5)));
    txt(ctx, 'How do your pupils use AI?', M, 470, 120, 's', fg, ap(t, ca(1, 'how')) * (1 - ap(t, ca(1, 'search') - 0.2, 0.5)));
    // the search box, then the copied answer
    const kb = ap(t, ca(1, 'search')) * (1 - ap(t, ca(1, 'anthropic') - 0.3, 0.5));
    if (kb > 0) {
      const bx = M, by = 250, bw = W - 2 * M;
      ctx.save(); ctx.globalAlpha = kb; ctx.strokeStyle = 'rgba(239,236,228,.6)'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.roundRect(bx, by, bw, 130, 65); ctx.stroke();
      ctx.beginPath(); ctx.arc(bx + 72, by + 60, 20, 0, Math.PI * 2); ctx.stroke(); ctx.beginPath(); ctx.moveTo(bx + 86, by + 75); ctx.lineTo(bx + 104, by + 93); ctx.stroke();
      typed(ctx, 'solve question 4 for me', bx + 140, by + 82, 52, F.g(400, 52), fg, t, ca(1, 'search') + 0.2, 16, t < ca(1, 'copy'), 0);
      const ka = ap(t, ca(1, 'copy'));
      if (ka > 0) {
        ctx.globalAlpha = kb * ka; setType(ctx, F.mono(22), 22, 3); ctx.fillStyle = GREY; ctx.fillText('ANSWER', bx + 40, by + 230);
        setType(ctx, F.g(400, 44), 44, 0); ctx.fillStyle = fg; ctx.fillText('The answer is 0,52 mol. Here is the full working…', bx + 40, by + 300);
        const kc = ap(t, ca(1, 'copy') + 0.9, 0.4); marker(ctx, bx + 40, by + 262, 1020, 50, kc, 'rgba(227,18,27,.35)');
        pill(ctx, 'Copied', bx + 1110, by + 288, 30, INK, PAPER, kc);
      }
      ctx.restore();
    }
    // 47 %
    const kn = ap(t, ca(1, 'anthropic'));
    if (kn > 0) {
      const n = Math.round(47 * E.quartOut(prog(t, ca(1, 'anthropic') + 0.2, ca(1, 'anthropic') + 2.2)));
      setType(ctx, F.g(700, 300), 300); ctx.globalAlpha = kn; ctx.fillStyle = RED; ctx.textAlign = 'left'; ctx.fillText(n + '%', M - 10, 560);
      const w = ctx.measureText('47%').width;
      ovalAround(ctx, M - 20, 330, w + 20, 260, ap(t, ca(1, 'half') + 0.3, 1.1), PAPER);
      txt(ctx, 'of university students’ chats asked', M + w + 80, 420, 48, 'g5', fg, ap(t, ca(1, 'anthropic') + 0.3));
      txt(ctx, 'straight for an answer or finished work', M + w + 80, 480, 48, 'g5', fg, ap(t, ca(1, 'anthropic') + 0.45));
      txt(ctx, 'Anthropic, 2025 · self-reported analysis of real chats', M + w + 80, 540, 24, 'm', GREY, ap(t, ca(1, 'anthropic') + 0.6));
      ctx.globalAlpha = 1;
      const ke = ap(t, cb(1, 'half') + 0.2, 0.8);
      txt(ctx, 'Search box', M, 790, 96, 'g', fg, ke);
      setType(ctx, F.g(700, 96), 96); const w2 = ctx.measureText('Search box ').width;
      txt(ctx, 'or sparring partner?', M + w2, 790, 100, 's', RED, ap(t, cb(1, 'half') + 0.45, 0.8));
    }
  },
  2(ctx, t) {   // The evidence: one chart
    txt(ctx, 'Türkiye · nearly 1 000 high-school maths pupils', M, 210, 30, 'm', RED, ap(t, ca(2, 'tested')));
    txt(ctx, 'Does that matter?', M, 300, 76, 's', INK, ap(t, ca(2, 'matter')));
    const x0 = M + 520, zero = 640, sc = 7.2;   // px per percent
    const kAx = ap(t, ca(2, 'tested') + 0.6);
    if (kAx > 0) {
      ctx.save(); ctx.globalAlpha = kAx; ctx.strokeStyle = GREY; ctx.lineWidth = 3; ctx.setLineDash([12, 12]);
      ctx.beginPath(); ctx.moveTo(x0 - 30, zero); ctx.lineTo(W - M, zero); ctx.stroke(); ctx.restore();
      txt(ctx, 'pupils who never had AI', W - M, zero - 18, 26, 'm', GREY, kAx, 'right');
    }
    const bar = (label, sub, v, y, k, col, tlabel, alpha = 1) => {
      if (k <= 0) return; ctx.save(); ctx.globalAlpha = alpha;
      txt(ctx, label, M, y + 6, 40, 'g', INK, Math.min(1, k * 2)); txt(ctx, sub, M, y + 50, 26, 'g4', GREY, Math.min(1, k * 2));
      const h = v * sc * k; ctx.fillStyle = col; ctx.fillRect(x0 + 40, Math.min(zero, zero - h), 260, Math.abs(h));
      setType(ctx, F.g(700, 64), 64); ctx.fillStyle = col; ctx.textAlign = 'left';
      ctx.fillText((v > 0 ? '+' : '−') + Math.round(Math.abs(v) * k) + '%', x0 + 330, v > 0 ? zero - h + 50 : zero - h - 10);
      if (tlabel) txt(ctx, tlabel, x0 + 40, v > 0 ? zero - h - 22 : zero - h + 46, 26, 'm', col, k);
      ctx.restore();
    };
    // practice bar, then exam bar (same pupils)
    const kp = ap(t, ca(2, 'practice') + 1.4, 1.4), dimP = 1 - ap(t, ca(2, 'taken') + 0.4, 0.6) * 0.55;
    bar('Practice with an open chatbot', 'while the AI was there', 48, 470, kp, INK, '', dimP);
    const ke = ap(t, ca(2, 'lower') + 0.8, 1.2);
    if (ke > 0) {
      ctx.save(); ctx.translate(380, 0); bar('', '', -17, 0, ke, RED, ''); ctx.restore();
      txt(ctx, 'Exam, AI taken away', M, 800, 40, 'g', RED, ke); txt(ctx, 'the same pupils', M, 846, 26, 'g4', GREY, ke);
    }
    // arrow on "taken away"
    const ka = ap(t, ca(2, 'taken') + 0.6, 0.8) * (1 - ap(t, ca(2, 'soared'), 0.5));
    arrow(ctx, x0 + 760, 330, x0 + 640, zero + 40, ka);
    txt(ctx, 'AI taken away', x0 + 700, 310, 34, 'g', RED, ka);
    // the verdict
    const kv1 = ap(t, ca(2, 'soared')), kv2 = ap(t, ca(2, 'sank')), out = 1 - ap(t, ca(2, 'tutor') - 0.2, 0.5);
    txt(ctx, 'Practice soared.', W - M, 420, 84, 'g', INK, kv1 * out, 'right');
    txt(ctx, 'Learning sank.', W - M, 520, 88, 's', RED, kv2 * out, 'right');
    const kt = ap(t, ca(2, 'tutor') + 1.2, 0.8);
    if (kt > 0) {
      ctx.save(); ctx.globalAlpha = kt; ctx.fillStyle = 'rgba(31,157,85,.12)'; ctx.beginPath(); ctx.roundRect(W - M - 640, 330, 640, 230, 20); ctx.fill(); ctx.restore();
      txt(ctx, 'Hint-only tutor', W - M - 600, 410, 54, 'g', INK, kt); txt(ctx, 'gave hints, not answers:', W - M - 600, 470, 34, 'g4', INK, kt);
      txt(ctx, 'no harm in the exam', W - M - 600, 525, 40, 's', '#1f9d55', kt);
    }
  },
  3(ctx, t) {   // Four traps: BO p5
    const g = PG.traps, img = IMG[g.f], view = VIEW_L;
    const cams = [[0, g.all], [ca(3, 'up'), g.c1], [ca(3, 'agrees'), g.c2], [ca(3, 'unfair'), g.c3], [ca(3, 'date'), g.c4], [cb(3, 'date') + 0.6, g.all]];
    const r = camAt(cams, t), xf = pageXf(img, r, view);
    ctx.save(); clipView(ctx, view); drawPage(ctx, img, xf, ap(t, sceneA(3) + 0.5)); ctx.restore();
    // which card is live
    const live = [['up', g.c1], ['agrees', g.c2], ['unfair', g.c3], ['date', g.c4]];
    live.forEach(([n, rc], i) => {
      const a = ca(3, n), b = i < 3 ? ca(3, live[i + 1][0]) - 0.1 : cb(3, 'date') + 0.4;
      const k = ap(t, a + 0.3, 0.6) * (1 - ap(t, b, 0.4));
      const [x1, y1] = P(xf, rc[0], rc[1]), [x2, y2] = P(xf, rc[2], rc[3]); ring(ctx, x1 - 8, y1 - 8, x2 - x1 + 16, y2 - y1 + 16, k);
    });
    // right panel
    const RX = M + 1120, RW = W - M - RX;
    txt(ctx, 'Four traps', RX, 230, 64, 'g', INK, ap(t, ca(3, 'four')) * (1 - ap(t, ca(3, 'up'), 0.4)));
    txt(ctx, 'to know', RX, 300, 64, 's', RED, ap(t, ca(3, 'four') + 0.15) * (1 - ap(t, ca(3, 'up'), 0.4)));
    // trap 1: nine cases, two traced
    const k1 = ap(t, ca(3, 'court')) * (1 - ap(t, ca(3, 'agrees') - 0.2, 0.4));
    if (k1 > 0) {
      txt(ctx, 'A South African court, 2025', RX, 230, 26, 'm', RED, k1);
      for (let i = 0; i < 9; i++) {
        const cx = RX + (i % 3) * 190, cy = 290 + Math.floor(i / 3) * 150, real = i === 1 || i === 6;
        const fade = real ? 1 : 1 - 0.85 * ap(t, ca(3, 'court') + 2.6 + i * 0.12, 0.5);
        ctx.save(); ctx.globalAlpha = k1 * fade; ctx.strokeStyle = INK; ctx.lineWidth = 3; ctx.fillStyle = '#fff';
        ctx.beginPath(); ctx.roundRect(cx, cy, 160, 120, 10); ctx.fill(); ctx.stroke();
        ctx.fillStyle = GREY; for (let l = 0; l < 4; l++) ctx.fillRect(cx + 18, cy + 24 + l * 22, l === 3 ? 70 : 124, 6);
        if (!real) { ctx.strokeStyle = RED; ctx.lineWidth = 5; ctx.globalAlpha = k1 * ap(t, ca(3, 'court') + 2.6 + i * 0.12, 0.5); ctx.beginPath(); ctx.moveTo(cx + 20, cy + 20); ctx.lineTo(cx + 140, cy + 100); ctx.stroke(); }
        ctx.restore();
      }
      const k2 = ap(t, ca(3, 'court') + 3.8);
      txt(ctx, '2 of 9', RX, 790, 110, 'g', RED, k1 * k2); txt(ctx, 'cases could be traced', RX + 330, 770, 34, 'g5', INK, k1 * k2);
    }
    // trap 2: the "12, right?" chat, with one silent flicker
    const k3 = ap(t, ca(3, 'twelve')) * (1 - ap(t, ca(3, 'unfair') - 0.2, 0.4));
    if (k3 > 0) {
      const fl = (t > ca(3, 'twelve') + 3.6 && t < ca(3, 'twelve') + 3.75) ? 0.25 : 1;
      ctx.save(); ctx.globalAlpha = k3;
      ctx.fillStyle = '#dfe6f3'; ctx.beginPath(); ctx.roundRect(RX + 60, 250, RW - 60, 120, [24, 24, 6, 24]); ctx.fill();
      txt(ctx, 'I think the answer is 12, right?', RX + 90, 322, 36, 'g5', INK, 1);
      ctx.globalAlpha = k3 * ap(t, ca(3, 'twelve') + 1.6) * fl; ctx.fillStyle = INK; ctx.beginPath(); ctx.roundRect(RX, 410, RW - 60, 120, [24, 24, 24, 6]); ctx.fill();
      txt(ctx, 'Yes, 12 is correct!', RX + 30, 482, 40, 'g', PAPER, 1);
      ctx.restore();
      const k4 = ap(t, ca(3, 'twelve') + 3.9);
      txt(ctx, '(The right answer was 15.)', RX, 590, 30, 's', RED, k3 * k4);
      txt(ctx, 'One model backed down on up to', RX, 700, 28, 'g4', GREY, k3 * k4);
      txt(ctx, '98% of challenged answers', RX, 740, 28, 'g5', INK, k3 * k4);
      txt(ctx, 'Co-Pilot, Not Autopilot · p. 6', RX, 784, 20, 'm', GREY, k3 * k4);
    }
    const k5 = ap(t, ca(3, 'unfair') + 0.4) * (1 - ap(t, ca(3, 'date') - 0.2, 0.4));
    txt(ctx, 'Trained on human writing,', RX, 400, 44, 'g5', INK, k5); txt(ctx, 'bias included.', RX, 460, 48, 's', RED, k5);
    const k6 = ap(t, ca(3, 'date') + 0.3);
    txt(ctx, 'It may not know', RX, 400, 44, 'g5', INK, k6); txt(ctx, 'what happened since,', RX, 456, 44, 'g5', INK, k6); txt(ctx, 'or say so.', RX, 516, 48, 's', RED, k6);
  },
  4(ctx, t) {   // five power-ups: BO p10
    const g = PG.power, img = IMG[g.f], view = [M, 170, W - 2 * M, 470];
    const xf = pageXf(img, g.all, view);
    ctx.save(); clipView(ctx, view); drawPage(ctx, img, xf, ap(t, sceneA(4) + 0.5));
    ['p1', 'p2', 'p3', 'p4', 'p5'].forEach((n, i) => {
      const k = ap(t, ca(4, n) - 0.05, 0.35), r = g.cards[i];
      const [x1, y1] = P(xf, r[0], r[1]), [x2, y2] = P(xf, r[2], r[3]);
      const pop = k * (1 - 0.6 * ap(t, ca(4, n) + 1.2, 0.8));
      if (pop > 0) { ctx.save(); ctx.globalAlpha = 0.12 * pop; ctx.fillStyle = RED; ctx.fillRect(x1, y1, x2 - x1, y2 - y1); ctx.restore(); }
      ring(ctx, x1 - 6, y1 - 6, x2 - x1 + 12, y2 - y1 + 12, k);
    });
    ctx.restore();
    txt(ctx, 'Your brain does the work.', M, 760, 72, 'g', INK, ap(t, ca(4, 'brain')) * (1 - ap(t, ca(4, 'quiz') - 0.2, 0.4)));
    txt(ctx, 'Five power-ups, all backed by research', M, 830, 36, 'g4', GREY, ap(t, ca(4, 'five')) * (1 - ap(t, ca(4, 'quiz') - 0.2, 0.4)));
    txt(ctx, 'Ask AI to', M, 780, 76, 'g', INK, ap(t, ca(4, 'quiz')));
    setType(ctx, F.g(700, 76), 76); const w = ctx.measureText('Ask AI to ').width;
    txt(ctx, 'quiz you,', M + w, 780, 80, 's', RED, ap(t, ca(4, 'quiz') + 1.6));
    setType(ctx, F.serif(80), 80, -1.4); const w2 = ctx.measureText('quiz you, ').width;
    txt(ctx, 'not tell you.', M + w + w2, 780, 76, 'g', INK, ap(t, ca(4, 'quiz') + 2.3));
  },
  5(ctx, t) {   // routine, then the hint ladder: BO p12
    const g = PG.routine, img = IMG[g.f], view = VIEW_L;
    const cams = [[0, g.steps], [ca(5, 'ladder'), g.ladder]];
    const xf = pageXf(img, camAt(cams, t), view);
    ctx.save(); clipView(ctx, view); drawPage(ctx, img, xf, ap(t, sceneA(5) + 0.5));
    ['r1', 'r2', 'r3', 'r4', 'r5'].forEach((n, i) => {
      const k = ap(t, ca(5, n) - 0.05, 0.4) * (1 - ap(t, ca(5, 'ladder') - 0.4, 0.5)), r = g.rows[i];
      const [x1, y1] = P(xf, r[0], r[1]), [x2, y2] = P(xf, r[2], r[3]);
      tick(ctx, x2 - 70, y1 + (y2 - y1) * 0.2, (y2 - y1) * 0.6, ap(t, ca(5, n) + 0.3, 0.5) * (1 - ap(t, ca(5, 'ladder') - 0.4, 0.5)));
      if (i === Math.max(0, ['r1', 'r2', 'r3', 'r4', 'r5'].filter((m) => t >= ca(5, m)).length - 1)) ring(ctx, x1 - 6, y1 - 6, x2 - x1 + 12, y2 - y1 + 12, k);
    });
    // the marker climbs rung 1 -> 4 during "ladder"; rung 5 gets the red tag on "last resort"
    const kl = ap(t, ca(5, 'ladder') + 0.6, 0.5);
    if (kl > 0) {
      const climb = clamp((t - ca(5, 'ladder') - 1.2) / Math.max(1, cb(5, 'ladder') - ca(5, 'ladder') - 1.2)) * 3;
      const i0 = Math.floor(climb), fr = climb - i0, ra = g.rungs[Math.min(3, i0)], rb = g.rungs[Math.min(3, i0 + 1)];
      const fy = lerp((ra[1] + ra[3]) / 2, (rb[1] + rb[3]) / 2, ease(fr));
      const [mx, my] = P(xf, 0.505, fy);
      ctx.save(); ctx.globalAlpha = kl; ctx.fillStyle = RED; ctx.beginPath(); ctx.moveTo(mx + 18, my); ctx.lineTo(mx - 22, my - 22); ctx.lineTo(mx - 22, my + 22); ctx.closePath(); ctx.fill(); ctx.restore();
      const r5 = g.rungs[4], [a1, b1] = P(xf, r5[0], r5[1]), [a2, b2] = P(xf, r5[2], r5[3]), k5 = ap(t, ca(5, 'last') + 0.3, 0.6);
      ring(ctx, a1 - 6, b1 - 6, a2 - a1 + 12, b2 - b1 + 12, k5);
      pill(ctx, 'Last resort', a2 - 40, b1 - 46, 30, '#fff', RED, k5, 'center');
    }
    ctx.restore();
    const RX = M + 1120;
    const verbs = [['r1', 'Attempt'], ['r2', 'Name it'], ['r3', 'One hint'], ['r4', 'Check'], ['r5', 'Go again']];
    const kout = 1 - ap(t, ca(5, 'ladder') - 0.3, 0.5);
    txt(ctx, 'One routine', RX, 230, 30, 'm', RED, ap(t, ca(5, 'routine')) * kout);
    verbs.forEach(([n, v], i) => txt(ctx, (i + 1) + '  ' + v, RX, 330 + i * 100, 66, i === 4 ? 's' : 'g', i === 4 ? RED : INK, ap(t, ca(5, n)) * kout));
    const kL = ap(t, ca(5, 'ladder') + 0.2);
    txt(ctx, 'The hint ladder', RX, 330, 60, 'g', INK, kL); txt(ctx, 'Climb only as high', RX, 420, 48, 'g4', INK, kL); txt(ctx, 'as you need.', RX, 476, 52, 's', RED, kL);
    txt(ctx, 'Full answer:', RX, 620, 44, 'g5', INK, ap(t, ca(5, 'last'))); txt(ctx, 'the last resort.', RX, 676, 48, 's', RED, ap(t, ca(5, 'last') + 0.3));
  },
  6(ctx, t) {   // 21 words, then STARR
    const sw = ca(6, 's1') - 0.3, kA = 1 - ap(t, sw, 0.5), kB = ap(t, sw, 0.6);
    if (kA > 0) {
      const g = PG.words, img = IMG[g.f], view = VIEW_FULL, xf = pageXf(img, g.box, view);
      ctx.save(); clipView(ctx, view); drawPage(ctx, img, xf, kA * ap(t, sceneA(6) + 0.5));
      const [a1, b1] = P(xf, g.n21[0], g.n21[1]), [a2, b2] = P(xf, g.n21[2], g.n21[3]);
      ovalAround(ctx, a1, b1, a2 - a1, b2 - b1, ap(t, ca(6, 'words') + 2.0, 1.0) * kA);
      const [c1, d1] = P(xf, g.n9[0], g.n9[1]), [c2, d2] = P(xf, g.n9[2], g.n9[3]);
      ctx.globalAlpha = kA; strike(ctx, c1 - 14, d2 + 6, c2 + 14, d1 - 6, ap(t, ca(6, 'nine') + 0.7, 0.4)); ctx.globalAlpha = 1;
      ctx.restore();
    }
    if (kB > 0) {
      const g = PG.starr, img = IMG[g.f], view = [M, 140, W - 2 * M, 640], xf = pageXf(img, g.all, view);
      ctx.save(); clipView(ctx, view); drawPage(ctx, img, xf, kB);
      ['s1', 's2', 's3', 's4', 's5'].forEach((n, i) => {
        const r = g.cards[i], [x1, y1] = P(xf, r[0], r[1]), [x2, y2] = P(xf, r[2], r[3]);
        const k = ap(t, ca(6, n) - 0.05, 0.35);
        if (k > 0) { ctx.save(); ctx.globalAlpha = 0.14 * k; ctx.fillStyle = RED; ctx.fillRect(x1, y1, x2 - x1, y2 - y1); ctx.restore(); }
        ring(ctx, x1 - 6, y1 - 6, x2 - x1 + 12, y2 - y1 + 12, k);
      });
      ctx.restore();
      txt(ctx, 'Self · Topic · Attempt · Request · Rules', M, 870, 44, 'g5', INK, ap(t, ca(6, 's5') + 0.8));
    }
  },
  7(ctx, t) {   // check it, then stay safe
    const s1 = ca(7, 'private') - 0.3, s2 = ca(7, 'deepfake') - 0.6;
    const kA = 1 - ap(t, s1, 0.5), kB = ap(t, s1, 0.6) * (1 - ap(t, s2, 0.5)), kC = ap(t, s2, 0.6);
    const view = VIEW_FULL;
    if (kA > 0) {
      const g = PG.check, img = IMG[g.f], xf = pageXf(img, g.all, view);
      ctx.save(); clipView(ctx, view); drawPage(ctx, img, xf, kA * ap(t, sceneA(7) + 0.5)); ctx.globalAlpha = kA;
      [['c1', g.c1], ['c2', g.c2]].forEach(([n, r]) => { const [x1, y1] = P(xf, r[0], r[1]), [x2, y2] = P(xf, r[2], r[3]); tick(ctx, x2 - 120, y1 + 20, 80, ap(t, ca(7, n) + 0.2, 0.5)); });
      const r = g.itself, [x1, y1] = P(xf, r[0], r[1]), [x2, y2] = P(xf, r[2], r[3]); marker(ctx, x1, y1, x2 - x1, y2 - y1, ap(t, ca(7, 'itself'), 0.9));
      ctx.restore();
    }
    if (kB > 0) {
      const g = PG.safe, img = IMG[g.f], xf = pageXf(img, g.all, view);
      ctx.save(); clipView(ctx, view); drawPage(ctx, img, xf, kB);
      const cur = t < ca(7, 'friend') ? g.priv : t < ca(7, 'fake') ? g.friend : g.fakes;
      ctx.globalAlpha = kB; spot(ctx, xf, view, cur, ap(t, ca(7, 'private'), 0.5)); ctx.restore();
    }
    if (kC > 0) {
      const g = PG.deep, img = IMG[g.f], xf = pageXf(img, g.all, view);
      ctx.save(); clipView(ctx, view); drawPage(ctx, img, xf, kC); ctx.globalAlpha = kC;
      const r = g.title, [x1, y1] = P(xf, r[0], r[1]), [x2, y2] = P(xf, r[2], r[3]); marker(ctx, x1 + 40, y1, x2 - x1 - 40, y2 - y1, ap(t, ca(7, 'deepfake') + 0.2, 0.8));
      const b = g.box, [c1, d1] = P(xf, b[0], b[1]), [c2, d2] = P(xf, b[2], b[3]); ring(ctx, c1 - 6, d1 - 6, c2 - c1 + 12, d2 - d1 + 12, ap(t, ca(7, 'deepfake') + 0.8, 0.8));
      ctx.restore();
    }
  },
  8(ctx, t) {   // the world has moved, then what to build: CP p24
    const fg = PAPER, sw = ca(8, 'build') - 0.3, kA = 1 - ap(t, sw, 0.5);
    if (kA > 0) {
      txt(ctx, 'The world has already moved.', M, 300, 84, 'g', fg, ap(t, ca(8, 'moved')) * kA);
      txt(ctx, 'UCT: AI-detection scores', M, 450, 56, 'g5', fg, ap(t, ca(8, 'uct')) * kA);
      txt(ctx, '“simply not reliable”', M, 530, 72, 's', RED, ap(t, ca(8, 'uct') + 0.8) * kA);
      pill(ctx, 'Explain it out loud', M, 690, 40, INK, PAPER, ap(t, ca(8, 'aloud')) * kA);
      pill(ctx, 'Declare your AI use', M + 520, 690, 40, '#fff', RED, ap(t, ca(8, 'declare')) * kA);
      txt(ctx, 'Co-Pilot, Not Autopilot · p. 23', M, 800, 22, 'm', GREY, ap(t, ca(8, 'uct') + 1) * kA);
    }
    const kB = ap(t, sw, 0.6);
    if (kB > 0) {
      const g = PG.build, img = IMG[g.f], view = [W - M - 760, 140, 760, 790], xf = pageXf(img, g.all, view);
      ctx.save(); clipView(ctx, view); drawPage(ctx, img, xf, kB); ctx.globalAlpha = kB;
      ['b1', 'b2', 'b3'].forEach((n, i) => { const r = g.cards[i], [x1, y1] = P(xf, r[0], r[1]), [x2, y2] = P(xf, r[2], r[3]); ring(ctx, x1 - 6, y1 - 6, x2 - x1 + 12, y2 - y1 + 12, ap(t, ca(8, n) - 0.05, 0.4)); });
      g.exp.forEach((r, i) => { const [x1, y1] = P(xf, r[0], r[1]), [x2, y2] = P(xf, r[2], r[3]); marker(ctx, x1, y1, x2 - x1, y2 - y1, ap(t, ca(8, 'expertise') + i * 0.6, 0.6)); });
      ctx.restore();
      txt(ctx, 'What should', M, 330, 64, 'g', fg, ap(t, ca(8, 'build')));
      txt(ctx, 'they build?', M, 410, 68, 's', RED, ap(t, ca(8, 'build') + 0.2));
      txt(ctx, 'Expertise is what', M, 640, 46, 'g5', fg, ap(t, ca(8, 'expertise'))); txt(ctx, 'makes AI useful.', M, 700, 50, 's', RED, ap(t, ca(8, 'expertise') + 0.3));
    }
  },
  9(ctx, t) {   // the two booklets
    const kOut = 1 - ap(t, ca(9, 'measure') - 0.2, 0.7);
    txt(ctx, 'So I wrote two booklets.', M, 230, 70, 'g', INK, ap(t, ca(9, 'wrote')) * kOut);
    txt(ctx, 'Built on this research, with AI as my co-pilot.', M, 290, 34, 's', RED, ap(t, ca(9, 'wrote') + 1.4) * kOut);
    pill(ctx, 'Ready to try', M, 860, 36, '#fff', RED, ap(t, ca(9, 'ready'), 0.5) * kOut);
    const cover = (img, x, k, title, grade, l1, l2, ser) => {
      if (k <= 0) return; const ch = 470, cw = ch * img.width / img.height, dy = (1 - k) * 60;
      ctx.save(); ctx.globalAlpha = k; ctx.shadowColor = 'rgba(0,0,0,.3)'; ctx.shadowBlur = 40; ctx.shadowOffsetY = 18 + 10 * k;
      ctx.drawImage(img, x, 320 + dy, cw, ch); ctx.restore();
      txt(ctx, grade, x + cw + 50, 400, 26, 'm', RED, k); txt(ctx, title, x + cw + 50, 470, 52, ser ? 's' : 'g', INK, k);
      txt(ctx, l1, x + cw + 50, 560, 34, 's', INK, ap(t, ser ? ca(9, 'stag') : ca(9, 'jtag')) * k); txt(ctx, l2, x + cw + 50, 606, 34, 's', RED, ap(t, (ser ? ca(9, 'stag') : ca(9, 'jtag')) + 0.6) * k);
    };
    cover(COVERS.junior, M, ap(t, ca(9, 'junior'), 0.8) * kOut, 'Brain On, AI On', 'GRADES 7–9', 'AI is a power tool.', 'Your brain is the power.', false);
    cover(COVERS.senior, M + 860, ap(t, ca(9, 'senior'), 0.8) * kOut, 'Co-Pilot, Not Autopilot', 'GRADES 10–12', 'You fly the plane.', 'AI helps you navigate.', true);
    const km = ap(t, ca(9, 'measure') + 0.4, 0.9);
    txt(ctx, 'The measure that counts:', M, 420, 60, 'g5', GREY, km);
    txt(ctx, 'what you can do', M, 560, 120, 'g', INK, ap(t, ca(9, 'measure') + 1.6, 0.9));
    txt(ctx, 'with the AI switched off.', M, 700, 124, 's', RED, ap(t, ca(9, 'measure') + 2.6, 0.9));
  },
  end(ctx, t) {   // end card
    const k = ap(t, ENDCARD + 0.1, 0.8);
    txt(ctx, 'AI literacy', M, 280, 40, 'm', RED, k);
    txt(ctx, 'Brain On, AI On', M, 380, 78, 'g', PAPER, k); txt(ctx, 'Co-Pilot, Not Autopilot', M, 470, 82, 's', PAPER, ap(t, ENDCARD + 0.3, 0.8));
    txt(ctx, 'Free in the Teacher Starter Kit', M, 600, 40, 'g4', PAPER, ap(t, ENDCARD + 0.6, 0.8));
    txt(ctx, 'noelrobert-science.github.io/ai-pd/starter-kit', M, 652, 30, 'm', GREY, ap(t, ENDCARD + 0.7, 0.8));
    const kq = ap(t, ENDCARD + 0.5, 0.8);
    if (kq > 0 && COVERS.qr) { ctx.save(); ctx.globalAlpha = kq; ctx.fillStyle = '#fff'; ctx.fillRect(W - M - 380, 250, 380, 380); ctx.imageSmoothingEnabled = false; ctx.drawImage(COVERS.qr, W - M - 360, 270, 340, 340); ctx.restore(); }
    txt(ctx, 'Narration: AI voice. Script drafted with AI and checked by a teacher.', M, 880, 24, 'm', GREY, ap(t, ENDCARD + 1.0, 0.8));
    txt(ctx, '© 2026 Noel Robert · Free to share · Not for sale, no changes · CC BY-NC-ND 4.0', M, 930, 24, 'm', GREY, ap(t, ENDCARD + 1.2, 0.8));
  },
};
const SRC = { 1: 'Co-Pilot, Not Autopilot · p. 3', 2: 'Co-Pilot, Not Autopilot · p. 7 · Brain On, AI On · p. 8', 3: 'Brain On, AI On · p. 5 · Co-Pilot, Not Autopilot · p. 6', 4: 'Brain On, AI On · pp. 10–11',
  5: 'Brain On, AI On · p. 12 · Co-Pilot, Not Autopilot · p. 12', 6: 'Brain On, AI On · pp. 14 and 16', 7: 'Brain On, AI On · pp. 19–21', 8: 'Co-Pilot, Not Autopilot · pp. 23–24', 9: 'Brain On, AI On · Co-Pilot, Not Autopilot' };

/* ---------- chrome, captions, transitions ---------- */
function chrome(ctx, t, k) {
  if (k === 'end') return;
  const fg = BG[k] === PAPER ? INK : PAPER, kin = ap(t, sceneA(k) + 0.1, 0.7);
  ctx.globalAlpha = kin; setType(ctx, F.mono(22), 22, 2); ctx.textAlign = 'left'; ctx.fillStyle = RED; ctx.fillText(String(k), M, 92);
  ctx.fillStyle = fg; ctx.fillText('· ' + CHAPTER[k].toUpperCase(), M + 26, 92);
  ctx.textAlign = 'right'; ctx.globalAlpha = 0.55 * kin; ctx.fillText('AI LITERACY · TWO BOOKLETS', W - M, 92);
  ctx.globalAlpha = 0.5; ctx.textAlign = 'left'; setType(ctx, F.mono(16), 16, 1); ctx.fillText(SRC[k].toUpperCase(), M, H - 30); { ctx.save(); ctx.globalAlpha = kin; setType(ctx, F.mono(18), 18, 1); const cs = '© 2026 NOEL ROBERT', cw = ctx.measureText(cs).width + 24; ctx.fillStyle = '#FFD43B'; ctx.beginPath(); ctx.roundRect(W - M - cw, H - 49, cw, 30, 15); ctx.fill(); ctx.fillStyle = '#15171c'; ctx.textAlign = 'right'; ctx.fillText(cs, W - M - 12, H - 28); ctx.restore(); }
  ctx.globalAlpha = 0.18; ctx.fillStyle = fg; ctx.fillRect(M, H - 52, W - 2 * M, 1);
  ctx.globalAlpha = 1; ctx.fillStyle = RED; ctx.fillRect(M, H - 53, (W - 2 * M) * (t / DUR), 3);
  ctx.textAlign = 'left';
}
let CAPS_ON = true;
function caption(ctx, t) {
  if (!CAPS_ON) return;
  const c = NARR.cues.find((q) => t >= q.a - 0.05 && t < q.b + 0.25); if (!c) return;
  const k = Math.min(ap(t, c.a - 0.05, 0.15), 1 - ap(t, c.b + 0.1, 0.15));
  setType(ctx, F.g(500, 34), 34, 0); const lines = wrap(ctx, c.text, 1400), lh = 44, h = lines.length * lh + 26;
  const w = Math.max(...lines.map((l) => ctx.measureText(l).width)) + 48, y = H - 78 - h;
  ctx.save(); ctx.globalAlpha = 0.86 * k; ctx.fillStyle = 'rgba(13,14,17,.82)'; ctx.beginPath(); ctx.roundRect((W - w) / 2, y, w, h, 12); ctx.fill();
  ctx.globalAlpha = k; ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; lines.forEach((l, i) => ctx.fillText(l, W / 2, y + 13 + 33 + i * lh)); ctx.restore();
}
function drawScene(ctx, t, k) {
  ctx.fillStyle = k === 'end' ? INK : BG[k]; ctx.fillRect(0, 0, W, H);
  ctx.save(); const z = 1 + 0.01 * ease(prog(t, k === 'end' ? ENDCARD : sceneA(k), k === 'end' ? DUR : sceneB(k))); ctx.translate(W / 2, H / 2); ctx.scale(z, z); ctx.translate(-W / 2, -H / 2);
  SCENES[k](ctx, t); ctx.restore(); ctx.globalAlpha = 1; chrome(ctx, t, k);
}
function scene(ctx, t) {
  const ks = [1, 2, 3, 4, 5, 6, 7, 8, 9];
  let k = ks.find((q) => t >= sceneA(q) && t < sceneB(q)); if (t >= ENDCARD) k = 'end'; if (!k) k = 1;
  drawScene(ctx, t, k);
  // wipe: the next scene's ground rises over the last WIPE seconds
  const next = k === 'end' ? null : k === 9 ? 'end' : k + 1, nb = k === 'end' ? Infinity : sceneB(k);
  if (next && t > nb - WIPE) {
    const p = ease(prog(t, nb - WIPE, nb));
    ctx.save(); ctx.beginPath(); ctx.rect(0, H * (1 - p), W, H * p); ctx.clip(); drawScene(ctx, nb, next); ctx.restore();
    if (p > 0 && p < 1) { ctx.fillStyle = RED; ctx.fillRect(0, H * (1 - p) - 2, W, 4); }
  }
  caption(ctx, t);
}
window.__timeline = { dur: DUR, chapters: [1, 2, 3, 4, 5, 6, 7, 8, 9].map((k) => ({ ch: CHAPTER[k], a: +sceneA(k).toFixed(2) })), cues: NARR.cues };
