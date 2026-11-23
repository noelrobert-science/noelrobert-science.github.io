/* v0.8: AI for marking. Before/after slider and an invented-class analysis chart. */
(function () {
  // ---- before/after slider ----
  const cmp = document.getElementById('mk-compare');
  if (cmp) {
    const set = (pct) => cmp.style.setProperty('--mk', Math.max(0, Math.min(100, pct)) + '%');
    const fromEvent = (e) => { const r = cmp.getBoundingClientRect(); set((e.clientX - r.left) / r.width * 100); };
    let drag = false;
    cmp.addEventListener('pointerdown', (e) => { drag = true; cmp.setPointerCapture(e.pointerId); fromEvent(e); e.stopPropagation(); });
    cmp.addEventListener('pointermove', (e) => { if (drag) { fromEvent(e); e.stopPropagation(); } });
    cmp.addEventListener('pointerup', (e) => { drag = false; e.stopPropagation(); });
    cmp.addEventListener('click', (e) => e.stopPropagation());
    document.querySelectorAll('[data-mk]').forEach((b) => b.addEventListener('click', (e) => {
      e.stopPropagation(); cmp.style.transition = 'none'; set(100 - Number(b.dataset.mk));
    }));
  }

  // ---- invented class: 24 pupils, one 135-mark paper (every mark is made up) ----
  const svg = document.getElementById('mk-svg');
  if (!svg) return;
  const Q = [['Q1', 'Multiple choice', 14, 0.64], ['Q2', 'Newton & momentum', 29, 0.52], ['Q3', 'Work, energy, power', 35, 0.58], ['Q4', 'Fields', 26, 0.43], ['Q5', 'Circuits', 31, 0.49]];
  let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const pupils = Array.from({ length: 24 }, (_, i) => {
    const ability = (rnd() + rnd() + rnd()) / 3 - 0.5;
    const q = Q.map(([, , max, mean]) => Math.max(0, Math.min(max, Math.round(max * (mean + ability * 0.7 + (rnd() - 0.5) * 0.18)))));
    return { n: String(i + 1).padStart(2, '0'), q, tot: q.reduce((a, b) => a + b, 0) };
  });
  const TOTAL = Q.reduce((a, x) => a + x[2], 0);
  const read = document.getElementById('mk-read'), hint = document.getElementById('mk-hint');
  const NS = 'http://www.w3.org/2000/svg';
  const el = (tag, attrs, txt) => { const e = document.createElementNS(NS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); if (txt != null) e.textContent = txt; svg.appendChild(e); return e; };
  const X0 = 90, Y0 = 470, W = 860, H = 420;

  function axis(maxY, step, unit) {
    for (let v = 0; v <= maxY; v += step) {
      const y = Y0 - v / maxY * H;
      el('line', { x1: X0, x2: X0 + W, y1: y, y2: y, stroke: '#2c3242', 'stroke-width': 1 });
      el('text', { x: X0 - 14, y: y + 7, 'text-anchor': 'end', class: 'ax' }, v + unit);
    }
  }

  function paper() {
    svg.innerHTML = '';
    const bands = [[0, 30, '<30'], [30, 40, '30s'], [40, 50, '40s'], [50, 60, '50s'], [60, 70, '60s'], [70, 80, '70s'], [80, 101, '80+']];
    const counts = bands.map(([lo, hi]) => pupils.filter((p) => { const pc = p.tot / TOTAL * 100; return pc >= lo && pc < hi; }));
    const maxY = 8; axis(maxY, 2, '');
    const bw = W / bands.length;
    counts.forEach((list, i) => {
      const h = list.length / maxY * H, x = X0 + i * bw + 14;
      const r = el('rect', { x, y: Y0 - h, width: bw - 28, height: Math.max(h, 2), rx: 6, fill: i < 2 ? '#ff4a50' : '#FFD43B', class: 'bar' });
      el('text', { x: x + (bw - 28) / 2, y: Y0 - h - 12, 'text-anchor': 'middle', 'font-size': 26, 'font-weight': 600 }, list.length);
      el('text', { x: x + (bw - 28) / 2, y: Y0 + 34, 'text-anchor': 'middle', class: 'ax' }, bands[i][2] + '%');
      r.addEventListener('click', (e) => { e.stopPropagation(); read.innerHTML = '<b>' + list.length + ' pupils</b> in the ' + bands[i][2] + '% band' + (list.length ? ': pupils ' + list.map((p) => p.n).join(', ') + '.' : '.') + (i < 2 ? ' <b>Start with them.</b>' : ''); });
    });
    el('text', { x: X0 + W / 2, y: Y0 + 78, 'text-anchor': 'middle', class: 'ax' }, 'Whole paper, % (pupils by number, invented)');
    const avg = Math.round(pupils.reduce((a, p) => a + p.tot, 0) / pupils.length / TOTAL * 100);
    read.innerHTML = 'Class average <b>' + avg + '%</b>. The red bars are the pupils to see first.';
    hint.textContent = 'Click a bar to see which pupils.';
  }

  function byQuestion() {
    svg.innerHTML = '';
    axis(100, 25, '%');
    const bw = W / Q.length;
    Q.forEach(([id, name, max], i) => {
      const scores = pupils.map((p) => p.q[i] / max);
      const avg = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length * 100);
      const below = scores.filter((s) => s < 0.5).length;
      const h = avg / 100 * H, x = X0 + i * bw + 22;
      const r = el('rect', { x, y: Y0 - h, width: bw - 44, height: h, rx: 6, fill: avg < 50 ? '#ff4a50' : '#3ddc7a', class: 'bar' });
      el('text', { x: x + (bw - 44) / 2, y: Y0 - h - 12, 'text-anchor': 'middle', 'font-size': 26, 'font-weight': 600 }, avg + '%');
      el('text', { x: x + (bw - 44) / 2, y: Y0 + 34, 'text-anchor': 'middle', class: 'ax' }, id);
      r.addEventListener('click', (e) => { e.stopPropagation(); read.innerHTML = '<b>' + id + ' ' + name + '</b> (' + max + ' marks): class average ' + avg + '%. <b>' + below + ' of 24</b> scored under half.' + (avg < 50 ? ' <b>Reteach this one.</b>' : ''); });
    });
    el('text', { x: X0 + W / 2, y: Y0 + 78, 'text-anchor': 'middle', class: 'ax' }, 'Class average per question (invented)');
    read.innerHTML = 'The red bars are the questions to <b>reteach</b>.';
    hint.textContent = 'Click a bar for that question.';
  }

  document.querySelectorAll('.mk-tabs button').forEach((b) => b.addEventListener('click', (e) => {
    e.stopPropagation();
    document.querySelectorAll('.mk-tabs button').forEach((x) => x.classList.toggle('on', x === b));
    (b.dataset.mkview === 'q' ? byQuestion : paper)();
  }));
  paper();
})();

/* v0.8: the weekly loop. Step 6 opens "Assessment that builds mastery"; × , Esc or a click outside closes it. */
(function () {
  const card = document.getElementById('wl-card'), open = document.querySelector('#s-loop .wl-open');
  if (!card || !open) return;
  const show = (on) => { card.hidden = !on; card.parentNode.classList.toggle('card-on', on); if (on) document.getElementById('wl-x').focus(); };
  open.addEventListener('click', (e) => { e.stopPropagation(); show(true); });
  open.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); show(true); } });
  document.getElementById('wl-x').addEventListener('click', (e) => { e.stopPropagation(); show(false); });
  card.addEventListener('click', (e) => e.stopPropagation());
  document.querySelector('#s-loop').addEventListener('click', () => { if (!card.hidden) show(false); });
  window.addEventListener('keydown', (e) => { if (!card.hidden && (e.key === 'Escape' || e.keyCode === 27)) { e.preventDefault(); e.stopImmediatePropagation(); show(false); } }, true);
  if (window.Reveal) Reveal.on('slidechanged', () => { if (!card.hidden) show(false); });
})();
