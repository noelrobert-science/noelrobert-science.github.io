/* Graph tool (studio_design.md §6): IEB grid, typed scales, crosses with a loupe and nudges, one ruled line with
   two handles, gradient points on the line, the y = mx + c matcher, meaning, intercept and a read-off.
   Checks run in the order of work (§6.3) and name the first gap with one action. */
(function () {
  'use strict';
  var V = window.StudioViews = window.StudioViews || {};
  var F = window.Fmt, N = window.Noise;
  var h, ctx;
  var TASKS = window.GraphTasks = [
    { id: 'ohm', title: 'Plot an Ohm’s law graph', grades: [10, 11, 12], intro: 'From your own readings or a sample: axes, scales, points, the best-fit line and R from the gradient.' },
    { id: 'vi-term', title: 'Plot terminal pd against current', grades: [11, 12], intro: 'V = −rI + emf: r from the gradient and the emf from the intercept.' }
  ];
  var S = 10, HEAVY = 100, ML = 74, MT = 44, MR = 18, MB = 58;   /* px per small square, per heavy square, margins */

  V.graph = function (arg, params, c) {
    ctx = c; h = c.h;
    var g = ctx.grade(), t = TASKS.filter(function (x) { return x.id === arg; })[0];
    if (!t) return menu();
    if (t.grades.indexOf(g) < 0) {
      ctx.main.appendChild(h('div', { class: 'wrap' }, [h('h1', { text: t.title }), h('div', { class: 'warnc', text: 'This graph is Grade 11 work (internal resistance). Switch to Grade 11 to open it.' }),
        h('button', { class: 'btn', text: 'Switch to Grade 11', onclick: function () { ctx.setGrade(11, true); ctx.route(); } })]));
      return;
    }
    document.title = t.title + ' · Circuits Studio';
    var data = null;
    if (params.from === 'exp') { try { data = JSON.parse(sessionStorage.getItem('circ-plot')); } catch (e) { data = window.__circPlot || null; } }
    if (!data || data.task !== t.id) data = sample(t.id, g, params.seed ? +params.seed : null);
    tool(t, data, g);
  };
  function menu() {
    var g = ctx.grade();
    ctx.main.appendChild(h('div', { class: 'wrap' }, [h('h1', { text: 'Graph tool' }), h('div', { class: 'grid' }, TASKS.filter(function (t) { return t.grades.indexOf(g) >= 0; }).map(function (t) {
      return h('a', { class: 'card pcard', href: '#graph/' + t.id }, [h('h3', { text: t.title }), h('p', { class: 'small muted', text: t.intro })]); }))]));
  }
  /* sample data: the design's sample runs for the fixed seed, otherwise a fresh seeded run */
  function sample(id, g, seed) {
    var s = seed || 20261110;
    if (id === 'vi-term') {
      var box = seed ? window.Rigs.boxR(seed) : { emf: 7.5, r: 1.6 };
      var rows = N.emfRun(s, box.emf, box.r, 1.0, [25, 15, 10, 6, 4, 2, 1]);
      return { task: id, grade: g, sample: true, seed: s, truth: box, hidden: true, x: rows.map(function (r) { return r.I; }), y: rows.map(function (r) { return r.V; }), xq: 'Current I (A)', yq: 'Terminal potential difference V (V)' };
    }
    var o = N.ohmRun(s, 4.79, 6.0, [20, 12, 8, 5, 3, 1.5, 0]), I = o.map(function (r) { return r.I; }), Vv = o.map(function (r) { return r.V; });
    return g === 10 ? { task: id, grade: g, sample: true, seed: s, x: I, y: Vv, xq: 'Current I (A)', yq: 'Potential difference V (V)' }
      : { task: id, grade: g, sample: true, seed: s, x: Vv, y: I, xq: 'Potential difference V (V)', yq: 'Current I (A)' };
  }
  function nice125(x) { var e = Math.floor(Math.log10(x) + 1e-12), m = x / Math.pow(10, e); return Math.abs(m - 1) < 1e-9 || Math.abs(m - 2) < 1e-9 || Math.abs(m - 5) < 1e-9 ? 1 : Math.abs(m - 4) < 1e-9 ? 2 : 0; }
  function num(x, dp) { return F.num(x, dp == null ? 2 : dp); }

  function tool(t, data, g) {
    var vi = t.id === 'vi-term', ohmIonV = t.id === 'ohm' && g >= 11, bulb = data.load === 'bulb';
    var nx = ohmIonV ? 10 : 7, ny = ohmIonV ? 7 : 5, W = nx * HEAVY, Hh = ny * HEAVY;
    var xs = data.x, ys = data.y, fit = N.lsq(xs, ys);
    var st = { heading: '', yt: '', xt: '', sc: { x0: '', dx: '', y0: '', dy: '' }, pts: [], sel: -1, line: null, gp: [], typed: {}, grad: '', unit: '', slots: {}, mean: {}, ro: '' };
    var yUnitV = /\(V\)$/.test(data.yq), xUnitA = /\(A\)$/.test(data.xq);
    var unitRight = vi ? 'V·A⁻¹' : (data.yq.indexOf('(V)') > 0 ? 'V·A⁻¹' : 'A·V⁻¹');

    /* ---- the page ---- */
    ctx.main.appendChild(h('div', { class: 'wrap' }, [
      h('div', { class: 'row' }, [h('a', { class: 'chip', href: '#home', text: '← Studio home' }), data.src ? h('a', { class: 'chip', href: '#' + data.src + '?g=' + g + (data.box ? '&box=' + data.box : '') + (data.seed ? '&seed=' + data.seed : ''), text: '← Back to the experiment' }) : null]),
      h('h1', { text: t.title, style: 'margin-top:10px' }),
      h('p', { class: 'muted', text: data.sample ? 'Sample data (seed ' + data.seed + '). Plot your own from the experiment, or ask for a new data set.' : 'Your own readings from the experiment.' })
    ]));
    var tableEl = h('table', { class: 'rec' }, [h('thead', {}, [h('tr', {}, [h('th', { text: data.xq }), h('th', { text: data.yq })])]),
      h('tbody', {}, xs.map(function (x, i) { return h('tr', {}, [h('td', { class: 'n', text: num(x) }), h('td', { class: 'n', text: num(ys[i]) })]); }))]);
    var svgBox = h('div', { class: 'gwrap' }), loupe = h('div', { class: 'loupe hidden' }), steps = h('div'), fb = h('div', { 'aria-live': 'polite' });
    ctx.main.appendChild(h('div', { class: 'wrap' }, [h('div', { class: 'lab' }, [
      h('div', {}, [h('div', { class: 'canvas gcanvas' }, [svgBox, loupe]), h('div', { class: 'row nudges', style: 'margin-top:8px' }, nudges())]),
      h('div', {}, [h('div', { class: 'card' }, [steps, fb]),
        h('div', { class: 'card', style: 'margin-top:12px' }, [h('h3', { text: 'Data' }), h('div', { class: 'twrap' }, [tableEl]),
        h('div', { class: 'row', style: 'margin-top:8px' }, [h('a', { class: 'btn ghost small', href: '#graph/' + t.id + '?g=' + g + '&seed=' + ((data.seed || 1) % 999983 + 7), text: 'New data set' })])])])])]));

    /* ---- grid maths ---- */
    function sc() { var s = st.sc; return { x0: F.parse(s.x0), dx: F.parse(s.dx), y0: F.parse(s.y0), dy: F.parse(s.dy) }; }
    function scaled() { var s = sc(); return s.dx > 0 && s.dy > 0 && isFinite(s.x0) && isFinite(s.y0); }
    function px(x) { var s = sc(); return ML + (x - s.x0) / s.dx * HEAVY; }
    function py(y) { var s = sc(); return MT + Hh - (y - s.y0) / s.dy * HEAVY; }
    function gx(p) { var s = sc(); return s.x0 + (p - ML) / HEAVY * s.dx; }
    function gy(p) { var s = sc(); return s.y0 + (MT + Hh - p) / HEAVY * s.dy; }
    function halfX() { return sc().dx / 20; }
    function halfY() { return sc().dy / 20; }

    /* ---- drawing ---- */
    function render() {
      var o = '<svg class="gsvg" viewBox="0 0 ' + (ML + W + MR) + ' ' + (MT + Hh + MB) + '" role="img" aria-label="Graph grid"><g id="gmain">';
      o += '<rect x="' + ML + '" y="' + MT + '" width="' + W + '" height="' + Hh + '" fill="#fff"/>';
      for (var i = 0; i <= nx * 10; i++) o += '<line class="' + (i % 10 ? (i % 5 ? 'g1' : 'g5') : 'g10') + '" x1="' + (ML + i * S) + '" y1="' + MT + '" x2="' + (ML + i * S) + '" y2="' + (MT + Hh) + '"/>';
      for (i = 0; i <= ny * 10; i++) o += '<line class="' + (i % 10 ? (i % 5 ? 'g1' : 'g5') : 'g10') + '" x1="' + ML + '" y1="' + (MT + i * S) + '" x2="' + (ML + W) + '" y2="' + (MT + i * S) + '"/>';
      if (scaled()) {
        var s = sc();
        for (i = 0; i <= nx; i++) o += '<text class="tl" x="' + (ML + i * HEAVY) + '" y="' + (MT + Hh + 20) + '" text-anchor="middle">' + num(s.x0 + i * s.dx, dpOf(s.dx)) + '</text>';
        for (i = 0; i <= ny; i++) o += '<text class="tl" x="' + (ML - 8) + '" y="' + (MT + Hh - i * HEAVY + 5) + '" text-anchor="end">' + num(s.y0 + i * s.dy, dpOf(s.dy)) + '</text>';
      }
      if (st.heading) o += '<text class="at hd" x="' + (ML + W / 2) + '" y="26" text-anchor="middle">' + esc(st.heading) + '</text>';
      if (st.xt) o += '<text class="at" x="' + (ML + W / 2) + '" y="' + (MT + Hh + 46) + '" text-anchor="middle">' + esc(st.xt) + '</text>';
      if (st.yt) o += '<text class="at" transform="translate(16 ' + (MT + Hh / 2) + ') rotate(-90)" text-anchor="middle">' + esc(st.yt) + '</text>';
      if (st.line) {
        var L = clipLine();
        if (L) o += '<line class="bline" x1="' + L[0] + '" y1="' + L[1] + '" x2="' + L[2] + '" y2="' + L[3] + '"/>';
        if (mode === 'line') st.line.forEach(function (p, k) { o += '<circle class="handle" data-h="' + k + '" cx="' + p[0] + '" cy="' + p[1] + '" r="11"/>'; });
      }
      st.gp.forEach(function (p, k) {
        o += '<line class="cons" x1="' + p[0] + '" y1="' + p[1] + '" x2="' + p[0] + '" y2="' + (MT + Hh) + '"/><line class="cons" x1="' + ML + '" y1="' + p[1] + '" x2="' + p[0] + '" y2="' + p[1] + '"/>';
        o += '<circle class="gpt" cx="' + p[0] + '" cy="' + p[1] + '" r="5"/><text class="gl" x="' + (p[0] + 8) + '" y="' + (p[1] - 8) + '">' + (k ? 'B' : 'A') + '</text>';
      });
      st.pts.forEach(function (p, k) {
        o += '<path class="cross' + (k === st.sel ? ' sel' : '') + '" d="M' + (p[0] - 5) + ' ' + (p[1] - 5) + 'L' + (p[0] + 5) + ' ' + (p[1] + 5) + 'M' + (p[0] - 5) + ' ' + (p[1] + 5) + 'L' + (p[0] + 5) + ' ' + (p[1] - 5) + '"/>';
      });
      o += '</g></svg>';
      svgBox.innerHTML = o;
    }
    function dpOf(step) { return step >= 1 && Math.abs(step - Math.round(step)) < 1e-9 ? 0 : step >= 0.1 ? 1 : 2; }
    function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
    /* the ruled line runs edge to edge of the grid */
    function clipLine() {
      var a = st.line[0], b = st.line[1]; if (Math.abs(b[0] - a[0]) < 1e-6) return null;
      var m = (b[1] - a[1]) / (b[0] - a[0]), c = a[1] - m * a[0], P = [];
      [[ML, m * ML + c], [ML + W, m * (ML + W) + c]].forEach(function (q) { if (q[1] >= MT - 1e-6 && q[1] <= MT + Hh + 1e-6) P.push(q); });
      if (Math.abs(m) > 1e-9) [[(MT - c) / m, MT], [(MT + Hh - c) / m, MT + Hh]].forEach(function (q) { if (q[0] > ML && q[0] < ML + W) P.push(q); });
      if (P.length < 2) return null;
      P.sort(function (p, q) { return p[0] - q[0]; });
      return [P[0][0], P[0][1], P[P.length - 1][0], P[P.length - 1][1]];
    }
    function lineMC() {   /* in graph units */
      var a = st.line[0], b = st.line[1], m = (gy(b[1]) - gy(a[1])) / (gx(b[0]) - gx(a[0]));
      return { m: m, c: gy(a[1]) - m * gx(a[0]) };
    }

    /* ---- pointer: crosses, handles, gradient points; a 4x loupe while the finger is down ---- */
    var mode = 'points', drag = null;
    function svgPt(ev) { var svg = svgBox.querySelector('svg'), r = svg.getBoundingClientRect(), vb = svg.viewBox.baseVal; return [(ev.clientX - r.left) / r.width * vb.width, (ev.clientY - r.top) / r.height * vb.height]; }
    function inGrid(p) { return p[0] >= ML && p[0] <= ML + W && p[1] >= MT && p[1] <= MT + Hh; }
    function showLoupe(p, ev) {
      var r = svgBox.getBoundingClientRect(), k = 4, size = 120, span = size / k * (svgBox.querySelector('svg').viewBox.baseVal.width / r.width);
      loupe.classList.remove('hidden');
      loupe.style.left = Math.max(0, Math.min(r.width - size, ev.clientX - r.left - size / 2)) + 'px';
      loupe.style.top = Math.max(0, ev.clientY - r.top - size - 56) + 'px';
      loupe.innerHTML = '<svg viewBox="' + (p[0] - span / 2) + ' ' + (p[1] - span / 2) + ' ' + span + ' ' + span + '" width="' + size + '" height="' + size + '">' + svgBox.querySelector('svg').innerHTML.replace('id="gmain"', '') + '<path d="M' + (p[0] - 3) + ' ' + p[1] + 'h6M' + p[0] + ' ' + (p[1] - 3) + 'v6" stroke="#C2410C" stroke-width="0.6"/></svg>';
    }
    svgBox.addEventListener('pointerdown', function (ev) {
      if (!svgBox.querySelector('svg')) return;
      var p = svgPt(ev), hd = ev.target.getAttribute && ev.target.getAttribute('data-h');
      if (hd != null && st.line && mode === 'line') { drag = { kind: 'handle', k: +hd }; }
      else if (mode === 'points') {
        if (!scaled()) { say('Set both scales first (step 2).'); return; }
        if (!inGrid(p)) return;
        var near = nearestPt(p);
        if (near >= 0) { st.sel = near; drag = { kind: 'pt', k: near }; }
        else { st.pts.push(p); st.sel = st.pts.length - 1; drag = { kind: 'pt', k: st.sel }; }
      } else if (mode === 'grad' && st.line) {
        var q = project(p); if (!q) return;
        if (st.gp.length < 2) st.gp.push(q); else st.gp[Math.hypot(st.gp[0][0] - q[0], st.gp[0][1] - q[1]) < Math.hypot(st.gp[1][0] - q[0], st.gp[1][1] - q[1]) ? 0 : 1] = q;
        drag = { kind: 'gp', k: st.gp.indexOf(q) };
      } else return;
      svgBox.setPointerCapture(ev.pointerId); ev.preventDefault();
      render(); showLoupe(p, ev);
    });
    svgBox.addEventListener('pointermove', function (ev) {
      if (!drag) return;
      var p = svgPt(ev); p = [Math.max(ML, Math.min(ML + W, p[0])), Math.max(MT, Math.min(MT + Hh, p[1]))];
      if (drag.kind === 'pt') st.pts[drag.k] = p;
      else if (drag.kind === 'handle') st.line[drag.k] = p;
      else if (drag.kind === 'gp') { var q = project(p); if (q) st.gp[drag.k] = q; }
      render(); showLoupe(p, ev);
    });
    function end() { drag = null; loupe.classList.add('hidden'); }
    svgBox.addEventListener('pointerup', end); svgBox.addEventListener('pointercancel', end);
    function nearestPt(p) { var best = -1, d = 12; st.pts.forEach(function (q, k) { var e = Math.hypot(q[0] - p[0], q[1] - p[1]); if (e < d) { d = e; best = k; } }); return best; }
    function project(p) {
      var L = clipLine(); if (!L) return null;
      var ax = L[0], ay = L[1], bx = L[2] - ax, by = L[3] - ay, t2 = ((p[0] - ax) * bx + (p[1] - ay) * by) / (bx * bx + by * by);
      t2 = Math.max(0, Math.min(1, t2)); var q = [ax + t2 * bx, ay + t2 * by];
      return Math.hypot(q[0] - p[0], q[1] - p[1]) < 30 ? q : null;
    }
    function nudges() {
      var mk = function (lab, dx, dy) { return h('button', { class: 'btn ghost small', 'aria-label': lab, text: lab, onclick: function () {
        var d = 0.2 * S;
        if (mode === 'points' && st.sel >= 0) { st.pts[st.sel][0] += dx * d; st.pts[st.sel][1] += dy * d; }
        else if (mode === 'line' && st.line) { st.line[hsel][0] += dx * d; st.line[hsel][1] += dy * d; }
        render(); } }); };
      return [h('span', { class: 'small muted', text: 'Nudge the selected cross or handle:' }), mk('←', -1, 0), mk('→', 1, 0), mk('↑', 0, -1), mk('↓', 0, 1),
        h('button', { class: 'btn ghost small', text: 'Delete cross', onclick: function () { if (st.sel >= 0) { st.pts.splice(st.sel, 1); st.sel = -1; render(); } } })];
    }
    var hsel = 1;
    function say(t2) { ctx.say.textContent = t2; fb.innerHTML = ''; fb.appendChild(h('div', { class: 'warnc', text: t2 })); }

    /* ---- checks, in the order of work ---- */
    var yRight = data.yq, xRight = data.xq;
    var HEAD_OPTS = vi ? ['Graph of terminal potential difference against current', 'Graph of current against terminal potential difference', 'Terminal pd', 'V-I graph']
      : ohmIonV ? ['Graph of current against potential difference', 'Graph of potential difference against current', 'Ohm’s law', 'I-V graph']
        : ['Graph of potential difference against current', 'Graph of current against potential difference', 'Ohm’s law', 'V-I graph'];
    var headRight = HEAD_OPTS[0];
    var AX_OPTS = ['Current I (A)', 'Potential difference V (V)', 'Terminal potential difference V (V)', 'Current (V)', 'Voltage', 'Resistance R (Ω)'];
    function c1to5() {
      var r = [];
      r.push({ ok: st.yt === yRight, id: 'C1', text: 'The right quantity on the y-axis, with its unit', fix: st.yt === xRight ? (ohmIonV ? 'The current depends on the pd, so I goes on the y-axis and V on the x-axis. Then the gradient is I/V, which is 1/R.' : 'The dependent quantity goes on the y-axis: ' + yRight + '.') : 'Give the y-axis its quantity and unit in brackets: ' + yRight + '.' });
      r.push({ ok: st.xt === xRight, id: 'C3', text: 'The x-axis title has its quantity and unit', fix: 'Give the x-axis its quantity and unit in brackets: ' + xRight + '.' });
      r.push({ ok: st.heading === headRight, id: 'C2', text: 'The heading names both quantities, y first', fix: 'The heading names the y quantity first: ‘' + headRight + '’.' });
      return r;
    }
    function scaleChecks() {
      var s = sc(), r = [];
      if (!scaled()) return [{ ok: false, id: 'C6', text: 'Both scales set', fix: 'Type a start value and a value per heavy line for each axis.' }];
      var xmax = s.x0 + nx * s.dx, ymax = s.y0 + ny * s.dy, needC = vi ? fit.c : null;
      var kx = nice125(s.dx), ky = nice125(s.dy);
      r.push({ ok: kx > 0 && ky > 0, id: 'C7', text: 'Each step is 1, 2 or 5 × 10ⁿ per heavy square' + (kx === 2 || ky === 2 ? ' (4 works, but it is hard to read)' : ''), fix: 'Choose a step of 1, 2 or 5 (times a power of ten) per heavy square, so every small square is easy to read.' });
      var inRange = xs.every(function (x) { return x >= s.x0 - 1e-9 && x <= xmax + 1e-9; }) && ys.every(function (y) { return y >= s.y0 - 1e-9 && y <= ymax + 1e-9; }) && (needC == null || (needC >= s.y0 && needC <= ymax));
      r.push({ ok: inRange, id: 'C10', text: 'Every value' + (vi ? ', and the intercept,' : '') + ' fits on the axes', fix: 'Some values fall off the grid. Use a larger step, or start the axis lower.' });
      var xBig = Math.max.apply(null, xs), yBig = Math.max.apply(null, ys.concat(needC == null ? [] : [needC]));
      r.push({ ok: xBig - s.x0 > nx * s.dx / 2 && yBig - s.y0 > ny * s.dy / 2, id: 'C8', text: 'The points use more than half of each axis', fix: 'Your graph is squashed into a corner. Use a smaller step so the largest value lies beyond half of each axis.' });
      var xStart0 = Math.abs(s.x0) < 1e-12, yStart0 = Math.abs(s.y0) < 1e-12;
      r.push({ ok: xStart0 && (vi ? s.y0 <= Math.min.apply(null, ys) : yStart0), id: 'C9', text: vi ? 'The current axis starts at 0 (a false origin on V is allowed)' : 'Both axes start at 0', fix: vi ? 'Start the current axis at 0, so the line meets the V-axis at the emf.' : 'Start both axes at 0: an Ohm’s law line must be seen to pass through the origin.' });
      return r;
    }
    function pointChecks() {
      var used = {}, miss = 0, off = 0, hx = halfX(), hy = halfY();
      xs.forEach(function (x, i) {
        var best = -1, d = 1e9;
        st.pts.forEach(function (p, k) { if (used[k]) return; var e = Math.hypot((gx(p[0]) - x) / hx, (gy(p[1]) - ys[i]) / hy); if (e < d) { d = e; best = k; } });
        if (best < 0 || d > 6) { miss++; return; }
        used[best] = 1;
        if (Math.abs(gx(st.pts[best][0]) - x) > hx + 1e-9 || Math.abs(gy(st.pts[best][1]) - ys[i]) > hy + 1e-9) off++;
      });
      return [{ ok: !miss && st.pts.length === xs.length, id: 'C13', text: 'Every row of the table is plotted', fix: miss ? miss + ' row' + (miss > 1 ? 's are' : ' is') + ' not plotted yet.' : 'There are more crosses than rows: delete the extra one.' },
        { ok: !off && !miss, id: 'C11', text: 'Every cross within half a small square of its value', fix: off + ' cross' + (off > 1 ? 'es are' : ' is') + ' more than half a small square out. Use the loupe and the nudge buttons.' }];
    }
    function lineChecks() {
      if (!st.line) return [{ ok: false, id: 'C14', text: 'One ruled straight line', fix: 'Tap ‘Draw a line’ and drag its two handles.' }];
      var l = lineMC(), r = [], hy = halfY(), band = [Math.abs(fit.m) * 0.95, Math.abs(fit.m) * 1.05];
      var atC = l.m * fit.mx + l.c, lsC = fit.m * fit.mx + fit.c, tol = Math.max(hy, 1.5 * fit.sd);
      var slopeOk = Math.abs(l.m) >= band[0] && Math.abs(l.m) <= band[1] && Math.sign(l.m) === Math.sign(fit.m);
      r.push({ ok: slopeOk, id: 'C17', text: 'The line has the slope the points allow', fix: Math.abs(l.m) > band[1] ? 'Your line is steeper than the points allow: at the right-hand end it is ' + (fit.m < 0 ? 'below' : 'above') + ' most of them. Turn it about the middle of the points until they sit on both sides.' : 'Your line is flatter than the points allow. Turn it about the middle of the points until they sit on both sides.' });
      r.push({ ok: Math.abs(atC - lsC) <= tol, id: 'C17', text: 'The line runs through the middle of the points', fix: 'Your line has ' + (slopeOk ? 'the right slope but ' : '') + 'sits ' + (atC > lsC ? 'above' : 'below') + ' the middle of the points. Move it ' + (atC > lsC ? 'down' : 'up') + ' without turning it.' });
      if (!vi) r.push({ ok: Math.abs(l.c) <= hy, id: 'C16', text: 'The line passes through the origin (within half a small square)', fix: 'An Ohm’s law line passes through (0; 0): no pd, no current. Move your line so it starts at the origin.' });
      else r.push({ ok: !(Math.abs(l.c) < hy && Math.abs(fit.c) > 3 * hy * 2), id: 'C16', text: 'The line is not forced through the origin', fix: 'This line does not pass through the origin: at I = 0 the terminal pd is the emf.' });
      var above = 0, below = 0; xs.forEach(function (x, i) { var d = ys[i] - (l.m * x + l.c); if (d > 0) above++; else if (d < 0) below++; });
      r.push({ ok: Math.abs(above - below) <= 2, id: 'C18', advisory: true, text: 'Points on both sides of the line (' + above + ' above, ' + below + ' below)', fix: 'Advice: a best-fit line has about as many points above it as below.' });
      return r;
    }
    function gradChecks() {
      var r = [], hx = halfX(), hy = halfY();
      if (st.gp.length < 2) return [{ ok: false, id: 'C19', text: 'Two gradient points on your line', fix: 'Tap your line twice to mark points A and B.' }];
      var A = [gx(st.gp[0][0]), gy(st.gp[0][1])], B = [gx(st.gp[1][0]), gy(st.gp[1][1])];
      var onRow = function (P) { return xs.some(function (x, i) { return Math.abs(x - P[0]) <= hx && Math.abs(ys[i] - P[1]) <= hy; }); };
      r.push({ ok: !onRow(A) && !onRow(B), id: 'C20', text: 'The gradient points are on your line, not table readings', fix: 'Choose points on your line that are not data points: the line averages the readings, a single reading does not.' });
      var span = Math.max.apply(null, xs) - Math.min.apply(null, xs);
      r.push({ ok: Math.abs(B[0] - A[0]) >= span / 2, id: 'C21', advisory: true, text: 'The points are far apart', fix: 'Advice: choose points at least half the data span apart, so a small misreading changes the gradient less.' });
      var T = st.typed, x1 = F.parse(T.x1), y1 = F.parse(T.y1), x2 = F.parse(T.x2), y2 = F.parse(T.y2);
      var ok22 = Math.abs(x1 - A[0]) <= hx && Math.abs(y1 - A[1]) <= hy && Math.abs(x2 - B[0]) <= hx && Math.abs(y2 - B[1]) <= hy;
      r.push({ ok: ok22, id: 'C22', text: 'Coordinates read to half a small square', fix: 'Read A and B off the grid again: (' + [T.x1, T.y1].join('; ') + ') and (' + [T.x2, T.y2].join('; ') + ') are more than half a small square out.' });
      var gTyped = F.parse(st.grad), gWork = (y2 - y1) / (x2 - x1);
      r.push({ ok: isFinite(gTyped) && Math.abs(gTyped - gWork) <= 0.011 * Math.abs(gWork) + 1e-9, id: 'C23', text: 'Gradient = (y₂ − y₁)/(x₂ − x₁), same order top and bottom', fix: 'Work it from your two points: (' + num(y2) + ' − ' + num(y1) + ')/(' + num(x2) + ' − ' + num(x1) + ') = ' + num(gWork, 3) + '. Keep the sign.' });
      r.push({ ok: st.unit === unitRight || (st.unit === 'Ω' && unitRight === 'V·A⁻¹'), id: 'C24', text: 'The unit comes from the axis units (' + unitRight + ')', fix: 'The gradient’s unit is the y-unit divided by the x-unit: ' + unitRight + '.' });
      var band = [fit.m * 0.95, fit.m * 1.05].sort(function (a, b) { return a - b; }), inBand = gTyped >= band[0] && gTyped <= band[1];
      var cause = '';
      if (!inBand) {
        var l = lineMC();
        if (!(Math.abs(l.m) >= Math.abs(fit.m) * 0.95 && Math.abs(l.m) <= Math.abs(fit.m) * 1.05)) cause = 'The line is the cause: its slope is outside the range. Fix the line first (step 4).';
        else if (Math.abs(gTyped - gWork) > 0.011 * Math.abs(gWork)) cause = 'Check the working order: the same order on top and below.';
        else if (Math.abs(B[0] - A[0]) < span / 2) cause = 'Your points are too close together. Choose points further apart.';
        else cause = 'Your line is inside the range, but your two readings give a gradient outside it. Read each coordinate to a fifth of a small square with the loupe, or choose points further apart.';
      }
      r.push({ ok: inBand, id: 'C25', text: 'The gradient is inside the accepted range (' + num(band[0], 3) + ' to ' + num(band[1], 3) + ')', fix: cause });
      return r;
    }
    var MATCH = vi ? { y: 'V', m: '−r', x: 'I', c: 'emf', tiles: ['V', 'I', 'r', '−r', 'emf', 'R', 'Ir', '0', 'emf/r'] }
      : ohmIonV ? { y: 'I', m: '1/R', x: 'V', c: '0', tiles: ['V', 'I', 'R', '1/R', '0', 'Q', 't'] } : { y: 'V', m: 'R', x: 'I', c: '0', tiles: ['V', 'I', 'R', '1/R', '0', 'Q', 't'] };
    function matchChecks() {
      var s = st.slots, bad = ['y', 'm', 'x', 'c'].filter(function (k) { return s[k] !== MATCH[k]; })[0];
      var why = { m: vi ? (s.m === 'r' ? 'The gradient is negative: V falls as I rises. m = −r.' : s.m === 'R' ? 'R is the external resistance, which changes along the line. The battery’s r is fixed: m = −r.' : 'm is the gradient: −r.')
        : ohmIonV ? (s.m === 'R' ? 'That is the gradient of a V-against-I graph. Here I is on y, so the gradient is I/V = 1/R.' : 'm is the gradient: I/V = 1/R.') : 'm is the gradient: V/I = R.',
        c: vi ? (s.c === '0' || s.c === 'V' ? 'c is V when I = 0. With no current there are no lost volts, so V = emf.' : s.c === 'emf/r' ? 'emf/r is where the line meets the I-axis, not the V-axis.' : 'c is the y-intercept: the emf.') : (s.c === 'R' ? 'c is I when V = 0. No pd, no current: c = 0, so the line passes through the origin.' : 'c is the value of y when x = 0: no pd, no current, so c = 0.'),
        y: 'y is the quantity on the y-axis: ' + MATCH.y + '.', x: 'x is the quantity on the x-axis: ' + MATCH.x + '.' };
      return [{ ok: !bad, id: 'C26', text: 'y = mx + c matched to ' + (vi ? 'V = −rI + emf' : ohmIonV ? 'I = (1/R)V + 0' : 'V = R·I + 0'), fix: bad ? why[bad] : '' }];
    }
    function meanChecks() {
      var gT = F.parse(st.grad), r = [];
      if (vi) {
        var rr = F.parse(st.mean.r), want = -gT;
        r.push({ ok: Math.abs(rr - want) <= 0.011 * Math.abs(want) + 1e-9 && rr > 0, id: 'C27', text: 'r = −gradient = ' + num(want) + ' Ω', fix: 'r comes from the gradient: r = −(gradient). Never V/I at one point.' });
        var l = lineMC(), e = F.parse(st.mean.emf), tol = Math.max(halfY() * 2, 0.02 * Math.abs(fit.c));
        r.push({ ok: Math.abs(e - l.c) <= halfY() * 2 && Math.abs(e - fit.c) <= tol + halfY() * 2, id: 'C28', text: 'emf = the y-intercept of your line (' + num(l.c) + ' V)', fix: 'The emf is V where your line meets the V-axis (I = 0). Read it off your own line.' });
      } else {
        var R0 = F.parse(st.mean.R), wantR = ohmIonV ? 1 / gT : gT;
        r.push({ ok: Math.abs(R0 - wantR) <= 0.011 * Math.abs(wantR) + 1e-9, id: 'C27', text: 'R = ' + (ohmIonV ? '1/gradient' : 'gradient') + ' = ' + num(wantR) + ' Ω', fix: ohmIonV ? 'The gradient is 1/R, so R = 1/gradient = 1/' + num(gT, 3) + ' = ' + num(1 / gT) + ' Ω.' : 'For V against I the gradient is R.' });
        var ok = st.ro === (ohmIonV ? 'The current is directly proportional to the potential difference.' : 'The potential difference is directly proportional to the current.');
        r.push({ ok: ok, id: 'C33', text: 'The relationship, dependent quantity first', fix: 'Your line passes through the origin, so: dependent quantity first, then ‘is directly proportional to’.' });
      }
      return r;
    }

    /* ---- the step panels ---- */
    var STEPS = [
      { t: '1. Heading and axes', build: function () {
        var head = sel(HEAD_OPTS, st.heading, function (v) { st.heading = v; render(); }, 'Heading'), yt = sel(AX_OPTS, st.yt, function (v) { st.yt = v; render(); }, 'y-axis title'), xt = sel(AX_OPTS, st.xt, function (v) { st.xt = v; render(); }, 'x-axis title');
        return [lab('Heading', head), lab('y-axis', yt), lab('x-axis', xt)];
      }, check: c1to5 },
      { t: '2. Scales', build: function () {
        var f = function (k, ph) { var i = h('input', { class: 'num', inputmode: 'decimal', value: st.sc[k], placeholder: ph, 'aria-label': ph }); i.addEventListener('input', function () { st.sc[k] = i.value; render(); rangeNote(); }); return i; };
        var note = h('p', { class: 'small muted' });
        function rangeNote() { if (!scaled()) { note.textContent = 'Each axis: a start value, and the value of each heavy (thick) line step.'; return; } var s = sc(); note.textContent = 'x: ' + num(s.x0, dpOf(s.dx)) + ' to ' + num(s.x0 + nx * s.dx, dpOf(s.dx)) + ';  y: ' + num(s.y0, dpOf(s.dy)) + ' to ' + num(s.y0 + ny * s.dy, dpOf(s.dy)) + '. Does your largest value fit, and does it use more than half the axis?'; }
        rangeNote();
        return [h('p', { class: 'small', text: 'The grid has ' + nx + ' × ' + ny + ' heavy squares.' }), h('div', { class: 'row' }, [h('span', { text: 'x starts at' }), f('x0', 'x start'), h('span', { text: 'step' }), f('dx', 'x per heavy line')]),
          h('div', { class: 'row', style: 'margin-top:6px' }, [h('span', { text: 'y starts at' }), f('y0', 'y start'), h('span', { text: 'step' }), f('dy', 'y per heavy line')]), note];
      }, check: scaleChecks },
      { t: '3. Plot the points', mode: 'points', build: function () { return [h('p', { class: 'small', text: 'Tap the grid to place a cross. Hold and drag to move it; a loupe shows it 4 times larger. Nudge the selected cross with the arrows.' })]; }, check: pointChecks },
      { t: '4. The line of best fit', mode: 'line', build: function () {
        return [h('p', { class: 'small', text: 'One ruled line, edge to edge. Drag its two handles until the points sit evenly on both sides.' }),
          h('button', { class: 'btn ghost', text: st.line ? 'Start the line again' : 'Draw a line', onclick: function () { st.line = [[ML + W * 0.15, MT + Hh * 0.5], [ML + W * 0.85, MT + Hh * 0.5]]; render(); show(3); } }),
          h('div', { class: 'row', style: 'margin-top:6px' }, [h('span', { class: 'small', text: 'Nudge handle:' }), seg2(['left', 'right'], hsel ? 'right' : 'left', function (v) { hsel = v === 'left' ? 0 : 1; })])];
      }, check: lineChecks },
      { t: '5. Gradient', mode: 'grad', build: function () {
        var f = function (k) { var i = h('input', { class: 'num', inputmode: 'decimal', value: st.typed[k] || '', 'aria-label': k, style: 'width:5em' }); i.addEventListener('input', function () { st.typed[k] = i.value; }); return i; };
        var gi = h('input', { class: 'num', inputmode: 'decimal', value: st.grad, 'aria-label': 'gradient' }); gi.addEventListener('input', function () { st.grad = gi.value; });
        var u = sel(['V·A⁻¹', 'A·V⁻¹', 'Ω', 'V', 'A', 'no unit'], st.unit, function (v) { st.unit = v; }, 'gradient unit');
        return [h('p', { class: 'small', text: 'Tap your line twice to mark A and B (not on a table reading). Read their coordinates off the grid.' }),
          h('div', { class: 'row' }, [h('span', { text: 'A (' }), f('x1'), h('span', { text: ';' }), f('y1'), h('span', { text: ')' })]),
          h('div', { class: 'row', style: 'margin-top:6px' }, [h('span', { text: 'B (' }), f('x2'), h('span', { text: ';' }), f('y2'), h('span', { text: ')' })]),
          h('div', { class: 'row', style: 'margin-top:6px' }, [h('span', { text: 'gradient = (y₂ − y₁)/(x₂ − x₁) =' }), gi, u])];
      }, check: gradChecks },
      { t: '6. Match y = mx + c', build: function () {
        var pick = null, row = h('div', { class: 'row tiles' }), slots = h('div', { class: 'row slots' });
        function draw2() {
          row.innerHTML = ''; slots.innerHTML = '';
          MATCH.tiles.forEach(function (tl) { row.appendChild(h('button', { class: 'btn ghost small tile' + (pick === tl ? ' on' : ''), text: tl, onclick: function () { pick = tl; draw2(); } })); });
          [['y', 'y ='], ['m', 'm'], ['x', 'x +'], ['c', 'c']].forEach(function (k) {
            slots.appendChild(h('span', { class: 'small', text: k[0] === 'y' ? '' : k[0] === 'm' ? '' : '' }));
            slots.appendChild(h('button', { class: 'btn small slot', 'aria-label': 'slot ' + k[0], text: (st.slots[k[0]] || '?') + ' (' + k[0] + ')', onclick: function () { if (pick) { st.slots[k[0]] = pick; pick = null; draw2(); } } }));
          });
        }
        draw2();
        return [h('p', { class: 'small', text: vi ? 'From the data sheet: emf = V + Ir, so V = −rI + emf. Tap a tile, then a slot.' : 'Tap a tile, then a slot: y = m x + c.' }), row, slots];
      }, check: matchChecks },
      { t: vi ? '7. r and the emf' : '7. R and the relationship', build: function () {
        if (vi) {
          var a = h('input', { class: 'num', inputmode: 'decimal', value: st.mean.r || '', 'aria-label': 'r' }), b = h('input', { class: 'num', inputmode: 'decimal', value: st.mean.emf || '', 'aria-label': 'emf' });
          a.addEventListener('input', function () { st.mean.r = a.value; }); b.addEventListener('input', function () { st.mean.emf = b.value; });
          return [h('div', { class: 'row' }, [h('span', { text: 'r = −(gradient) =' }), a, h('span', { text: 'Ω' })]), h('div', { class: 'row', style: 'margin-top:6px' }, [h('span', { text: 'emf = y-intercept =' }), b, h('span', { text: 'V' })])];
        }
        var c = h('input', { class: 'num', inputmode: 'decimal', value: st.mean.R || '', 'aria-label': 'R' }); c.addEventListener('input', function () { st.mean.R = c.value; });
        var opts = ['The current is directly proportional to the potential difference.', 'The potential difference is directly proportional to the current.', 'The current is inversely proportional to the potential difference.', 'The current and the potential difference are linear.'];
        return [h('div', { class: 'row' }, [h('span', { text: ohmIonV ? 'R = 1/gradient =' : 'R = gradient =' }), c, h('span', { text: 'Ω' })]), lab('Conclusion', sel(opts, st.ro, function (v) { st.ro = v; }, 'conclusion'))];
      }, check: meanChecks }
    ];
    var open = 0;
    function lab(t2, el) { return h('div', { class: 'grp' }, [h('label', { class: 'small', text: t2 }), h('br'), el]); }
    function sel(opts, v, on, aria) { var s = h('select', { 'aria-label': aria }, [h('option', { value: '', text: 'Choose…' })].concat(opts.map(function (o) { return h('option', { value: o, text: o }); }))); s.value = v; s.addEventListener('change', function () { on(s.value); }); return s; }
    function seg2(opts, v, on) { var b = h('div', { class: 'seg' }); opts.forEach(function (o) { b.appendChild(h('button', { 'aria-pressed': String(o === v), text: o, onclick: function () { Array.prototype.forEach.call(b.children, function (x) { x.setAttribute('aria-pressed', 'false'); }); this.setAttribute('aria-pressed', 'true'); on(o); } })); }); return b; }
    function show(i) {
      open = i; mode = STEPS[i].mode || 'none';
      steps.innerHTML = ''; fb.innerHTML = '';
      steps.appendChild(h('div', { class: 'row stepnav' }, STEPS.map(function (s, k) { return h('button', { class: 'btn small ' + (k === i ? '' : 'ghost'), 'aria-current': k === i ? 'step' : null, text: String(k + 1), 'aria-label': s.t, onclick: function () { show(k); } }); })));
      steps.appendChild(h('h3', { text: STEPS[i].t, style: 'margin-top:10px' }));
      STEPS[i].build().forEach(function (el) { steps.appendChild(el); });
      if (bulb && i === 3) steps.appendChild(h('div', { class: 'note', text: 'Look at your points first: for a filament bulb they lie on a curve, not a straight line. Draw a smooth curve on paper; here, compare with a straight line to see how far the points bend away. The bulb is non-ohmic: its resistance increases as the current increases, because the filament heats up.' }));
      steps.appendChild(h('div', { class: 'row', style: 'margin-top:10px' }, [h('button', { class: 'btn', text: 'Check', onclick: function () { runCheck(i); } }),
        i < STEPS.length - 1 ? h('button', { class: 'btn ghost', text: 'Go on anyway', onclick: function () { show(i + 1); } }) : null]));
      render();
    }
    function runCheck(i) {
      var items = STEPS[i].check(), bad = items.filter(function (x) { return !x.ok && !x.advisory; });
      fb.innerHTML = '';
      fb.appendChild(h('ul', { class: 'checks' }, items.map(function (x) { return h('li', { class: x.ok ? 'ok' : x.advisory ? 'adv' : 'no', text: (x.ok ? '✓ ' : x.advisory ? '• ' : '✗ ') + x.text }); })));
      var first = bad[0] || items.filter(function (x) { return !x.ok; })[0];
      if (first) fb.appendChild(h('div', { class: bad.length ? 'warnc' : 'note', text: first.fix }));
      if (!bad.length) {
        fb.appendChild(h('div', { class: 'note', text: i < STEPS.length - 1 ? 'Right. On to the next step.' : 'Done.' }));
        if (i === 3) fb.appendChild(rubric());
        if (i < STEPS.length - 1) fb.appendChild(h('button', { class: 'btn', text: 'Next step', onclick: function () { show(i + 1); } }));
        else if (data.hidden && data.truth) fb.appendChild(h('p', { text: 'The hidden battery: emf ' + num(data.truth.emf) + ' V and r ' + num(data.truth.r) + ' Ω. Your line gives r = ' + num(-F.parse(st.grad)) + ' Ω and emf = ' + num(lineMC().c) + ' V.' }));
      }
      ctx.say.textContent = first ? first.fix : 'Right.';
    }
    /* the marks a plot would earn (§6.9) */
    function rubric() {
      var a = c1to5(), s = scaleChecks(), p = pointChecks(), l = lineChecks();
      var okAll = function (arr) { return arr.every(function (x) { return x.ok || x.advisory; }); };
      var pts = okAll(p) ? 2 : (p[0].ok ? 1 : 0), ln = l.filter(function (x) { return x.id === 'C17'; }).every(function (x) { return x.ok; }) ? 2 : (st.line ? 1 : 0);
      var rows = g === 10 ? [['Heading', a[2].ok ? 1 : 0, 1], ['Axes with units', a[0].ok && a[1].ok ? 1 : 0, 1], ['Scale on both axes', okAll(s) ? 1 : 0, 1], ['Points', pts, 2], ['Line of best fit', ln, 2]]
        : [['Heading', a[2].ok ? 1 : 0, 1], ['y-axis title and unit', a[0].ok ? 1 : 0, 1], ['y-axis scale', okAll(s) ? 1 : 0, 1], ['Points', pts, 2], ['Line of best fit', ln, 2]];
      if (g === 12) rows = [['Heading', a[2].ok ? 1 : 0, 1], ['Axis titles and units', a[0].ok && a[1].ok ? 1 : 0, 1], ['Scales', okAll(s) ? 1 : 0, 1], ['Points', pts, 2], ['Line of best fit', ln === 2 ? 1 : 0, 1]];
      var got = rows.reduce(function (t2, r) { return t2 + r[1]; }, 0), of = rows.reduce(function (t2, r) { return t2 + r[2]; }, 0);
      return h('div', { class: 'card', style: 'margin-top:10px' }, [h('h3', { text: 'Marks for the plot: ' + got + '/' + of }), h('table', { class: 'rec' }, [h('tbody', {}, rows.map(function (r) { return h('tr', {}, [h('td', { text: r[0] }), h('td', { class: 'n', text: r[1] + '/' + r[2] })]); }))])]);
    }
    show(0);
  }
})();
