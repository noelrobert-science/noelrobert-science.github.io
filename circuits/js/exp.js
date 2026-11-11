/* Experiments (studio_design.md §5): Ohm's law, series and parallel rules, emf and r, power, kWh.
   Seeded meter scatter (rigs.js), settling with a steady tick, heating of a hidden battery, the learner's own
   table, a method check that names the first gap and one action, and 'Plot these' into the graph tool. */
(function () {
  'use strict';
  var V = window.StudioViews = window.StudioViews || {};
  var D = window.Draw, F = window.Fmt, N = window.Noise, R = window.Rigs;
  var TAG = 'Simulated readings: do the real practical too.';
  var h, ctx;

  var EXPS = [
    { id: 'ohm', title: 'Ohm’s law and a filament bulb', grades: [10, 11, 12], book: '10.2', intro: 'Vary the current through a hidden resistor X, record V and I, and find R from a graph. Then try a filament bulb.' },
    { id: 'rules', title: 'Series and parallel rules', grades: [10, 11, 12], book: '10.3', intro: '10 Ω and 20 Ω on 4,5 V: measure the currents and pds, and find the total resistance both ways.' },
    { id: 'emf-r', title: 'emf and internal resistance', grades: [11, 12], book: '11.4', intro: 'Find a hidden battery’s emf and r from a V against I graph, or set the battery yourself.' },
    { id: 'power', title: 'Power and brightness', grades: [10, 11, 12], book: '10.4', intro: 'Bulbs alone, in series and in parallel: P = VI from your own readings, and which bulb is brightest.' },
    { id: 'kwh', title: 'kWh and cost', grades: [10, 11, 12], book: '10.5', intro: 'Run an appliance, read the kWh counter, and work out the cost in four steps.' }
  ];

  V._homeCards = function (c) {
    var g = c.grade(), H = c.h;
    var box = H('div', {}, [
      H('h2', { text: 'Experiments' }),
      H('div', { class: 'grid' }, EXPS.filter(function (e) { return e.grades.indexOf(g) >= 0; }).map(function (e) {
        return H('a', { class: 'card pcard', href: '#exp/' + e.id }, [H('h3', { text: e.title }), H('p', { class: 'small muted', text: e.intro }), H('span', { class: 'chip', text: 'Book ' + e.book })]);
      })),
      H('h2', { text: 'Graph tool', style: 'margin-top:18px' }),
      H('div', { class: 'grid' }, (window.GraphTasks || []).filter(function (t) { return t.grades.indexOf(g) >= 0; }).map(function (t) {
        return H('a', { class: 'card pcard', href: '#graph/' + t.id }, [H('h3', { text: t.title }), H('p', { class: 'small muted', text: t.intro })]);
      }))
    ]);
    return box;
  };

  V.exp = function (arg, params, c) {
    ctx = c; h = c.h;
    var e = EXPS.filter(function (x) { return x.id === arg; })[0];
    if (!e) return menu();
    var g = ctx.grade();
    if (e.grades.indexOf(g) < 0) {
      ctx.main.appendChild(h('div', { class: 'wrap' }, [h('h1', { text: e.title }),
        h('div', { class: 'warnc', text: 'This experiment uses a battery with internal resistance, which is Grade 11 work. Switch to Grade 11 to open it.' }),
        h('div', { class: 'row' }, [h('button', { class: 'btn', text: 'Switch to Grade 11', onclick: function () { ctx.setGrade(11, true); ctx.route(); } }), h('a', { class: 'btn ghost', href: '#exp', text: 'All experiments' })])]));
      return;
    }
    document.title = e.title + ' · Circuits Studio';
    PAGES[e.id](e, params);
  };

  function menu() {
    var g = ctx.grade();
    ctx.main.appendChild(h('div', { class: 'wrap' }, [h('h1', { text: 'Experiments' }), h('p', { class: 'muted', text: TAG }),
      h('div', { class: 'grid' }, EXPS.filter(function (e) { return e.grades.indexOf(g) >= 0; }).map(function (e) {
        return h('a', { class: 'card pcard', href: '#exp/' + e.id }, [h('h3', { text: e.title }), h('p', { class: 'small muted', text: e.intro }), h('span', { class: 'chip', text: 'Book ' + e.book })]);
      }))]));
  }

  /* ---------- shared pieces ---------- */
  function header(e, extra) {
    return h('div', { class: 'wrap' }, [
      h('div', { class: 'row' }, [h('a', { class: 'chip', href: '#home', text: '← Studio home' }), h('a', { class: 'chip', href: '#exp', text: 'All experiments' }), h('span', { class: 'chip', text: 'Book ' + e.book })]),
      h('h1', { text: e.title, style: 'margin-top:10px' }),
      h('p', { text: e.intro }),
      h('p', { class: 'tag small', text: TAG + ' See the practical on page ' + e.book + ' of your book.' })
    ].concat(extra || []));
  }
  function drawInto(canvas, spec, res, o) {
    var out = D.render(spec, res, Object.assign({ grade: ctx.grade(), still: false }, o || {}));
    var old = canvas.querySelector('svg'); if (old) old.remove();
    canvas.insertAdjacentHTML('afterbegin', out.svg);
    var svg = canvas.querySelector('svg');
    try { var b = svg.getBBox(), m = 12; svg.setAttribute('viewBox', [b.x - m, b.y - m, b.width + 2 * m, b.height + 2 * m].map(function (n) { return n.toFixed(1); }).join(' ')); } catch (x) { /* hidden */ }
  }
  function r2(x) { return +F.round(x, 2); }
  function seedOf(params) { var s = parseInt(params.seed, 10); return s >= 0 ? s : (Date.now() % 1000000) + 1; }
  function feedback(box, items) {
    box.innerHTML = '';
    var bad = items.filter(function (i) { return !i.ok; });
    box.appendChild(h('ul', { class: 'checks' }, items.map(function (i) { return h('li', { class: i.ok ? 'ok' : 'no', text: (i.ok ? '✓ ' : '✗ ') + i.text }); })));
    if (bad.length) box.appendChild(h('div', { class: 'warnc', text: bad[0].fix }));
    else box.appendChild(h('div', { class: 'note', text: 'Your method is sound.' }));
    return !bad.length;
  }

  /* ---------- the bench: one rig with a switch, a rheostat and two meters (ohm, emf-r) ---------- */
  function bench(cfg) {
    var rig = cfg.rig, st = cfg.st, rnd = N.mulberry32(cfg.seed), z = null;
    var disp = { V: 0, A: 0 }, target = { V: 0, A: 0 }, changedAt = 0, heat = 1, heatOpen = 1, openedAt = 0, opened = true, rows = [];
    var last = performance.now(), lastDraw = 0, flick = { V: 0, A: 0 };
    var canvas = h('div', { class: 'canvas' }), faces = h('div', { class: 'dmms' }), tick = h('span', { class: 'steady off', text: '✓ steady' });
    var banner = h('div', { class: 'warnc hidden' }), msg = h('p', { class: 'small muted', 'aria-live': 'polite' });
    var swBtn = h('button', { class: 'btn', onclick: toggle }), table = h('div'), checkBox = h('div');
    var rng = h('input', { type: 'range', min: '0', max: String(rig.rheoMax), step: '0.5', value: String(st.Rh), 'aria-label': 'Rheostat resistance' });
    var rOut = h('output', { class: 'n' });
    rng.addEventListener('input', function () { setRh(+rng.value); });
    function setRh(v) { st.Rh = v; rng.value = String(v); rOut.textContent = F.num(v, 1) + ' Ω'; if (st.closed) fresh(); }
    function fresh() { z = R.draw(rnd, rig, st); changedAt = performance.now(); }
    function toggle() {
      st.closed = !st.closed;
      if (st.closed) fresh(); else { opened = true; openedAt = performance.now(); heatOpen = heat; changedAt = performance.now(); }
      swBtn.textContent = st.closed ? 'Open the switch' : 'Close the switch';
      swBtn.classList.toggle('on', st.closed);
    }
    function measure() { return R.measure(rig, st, st.closed ? z : null, heat).read; }
    function step(now) {
      var dt = Math.min(0.5, (now - last) / 1000); last = now;
      if (cfg.heating) {
        if (st.closed && Math.abs(target.A) > 1) heat *= Math.pow(1.01, dt / 10);
        else if (!st.closed && heat > 1) heat = Math.max(1, heatOpen - (heatOpen - 1) * (now - openedAt) / 20000);
      }
      target = measure();
      var k = 1 - Math.exp(-dt / 0.4), steady = now - changedAt > 1500;
      disp.V += (target.V - disp.V) * k; disp.A += (target.A - disp.A) * k;
      if (steady) { disp.V = target.V; disp.A = target.A; }      /* settled: the display shows the reading */
      tick.classList.toggle('off', !steady);
      if (steady && now % 500 < 100) { flick.V = Math.random() < 0.5 ? -0.01 : 0.01; flick.A = 0; }
      else if (now % 500 > 160) flick.V = flick.A = 0;
      var shown = { V: r2(disp.V) + (steady && Math.abs(disp.V) > 0.05 ? flick.V : 0), A: r2(disp.A) };
      faces.querySelector('[data-m=V]').textContent = F.num(shown.V) + ' V';
      faces.querySelector('[data-m=A]').textContent = F.num(shown.A) + ' A';
      if (cfg.heating && heat > 1.005) {
        banner.classList.remove('hidden');
        banner.textContent = st.closed ? 'The battery is warming: the switch has been closed for ' + Math.round((now - changedAt) / 1000) + ' s. This is a change in the battery itself, caused by heat, not by your change to R. Open the switch between readings.' : 'The battery is cooling down. Give it a few seconds before the next reading.';
      } else banner.classList.add('hidden');
      /* the drawing uses the solver's currents for arrows and glow, and the meter faces' values */
      if (now - lastDraw > (steady ? 600 : 140)) {
        lastDraw = now;
        var res = R.measure(rig, st, st.closed ? z : null, heat).res;
        res.read = Object.assign({}, res.read, shown);
        drawInto(canvas, rig.spec(st), res, cfg.drawOpts);
      }
    }
    var timer = setInterval(function () { step(performance.now()); }, 100);
    ctx.stop(function () { clearInterval(timer); });

    function record() {
      if (!st.closed) { msg.textContent = 'Close the switch first: with it open there is no current to measure.'; return; }
      var steady = performance.now() - changedAt > 1500;
      rows.push({ Rh: st.Rh, I: r2(disp.A), V: r2(disp.V), steady: steady, opened: opened || !rows.length });
      opened = false;
      msg.textContent = steady ? 'Recorded.' : 'Recorded before the steady tick: that reading may still be moving.';
      ctx.say.textContent = 'Recorded ' + F.num(r2(disp.A)) + ' A and ' + F.num(r2(disp.V)) + ' V.';
      renderTable();
    }
    function repeat() { if (!st.closed) return record(); opened = true; fresh(); msg.textContent = 'A fresh reading at the same setting: wait for the steady tick, then Record.'; }
    var heads = cfg.heads;   /* [{options, right}] or fixed strings */
    var chosen = heads.map(function (x) { return typeof x === 'string' ? x : ''; });
    function renderTable() {
      table.innerHTML = '';
      var th = heads.map(function (x, i) {
        if (typeof x === 'string') return h('th', { text: x });
        var sel = h('select', { 'aria-label': 'Heading for column ' + (i + 1) }, [h('option', { value: '', text: 'Choose a heading…' })].concat(x.options.map(function (o) { return h('option', { value: o, text: o }); })));
        sel.value = chosen[i]; sel.addEventListener('change', function () { chosen[i] = sel.value; });
        return h('th', {}, [sel]);
      });
      table.appendChild(h('div', { class: 'twrap' }, [h('table', { class: 'rec' }, [h('thead', {}, [h('tr', {}, [h('th', { text: '#' })].concat(th, [h('th')]))]),
        h('tbody', {}, rows.map(function (r, i) {
          return h('tr', { class: r.steady ? '' : 'unsteady' }, [h('td', { text: String(i + 1) }), h('td', { class: 'n', text: F.num(r.I) }), h('td', { class: 'n', text: F.num(r.V) }),
            h('td', {}, [h('button', { class: 'btn ghost small', 'aria-label': 'Delete row ' + (i + 1), text: '✕', onclick: function () { rows.splice(i, 1); renderTable(); } })])]);
        }))])]));
    }
    function check() {
      var range = R.currentRange(rig, st), I = rows.map(function (r) { return r.I; }).sort(function (a, b) { return a - b; });
      var span = I.length ? I[I.length - 1] - I[0] : 0, gap = 0;
      for (var i = 1; i < I.length; i++) gap = Math.max(gap, I[i] - I[i - 1]);
      var items = [];
      heads.forEach(function (x, i) { if (typeof x !== 'string') items.push({ ok: chosen[i] === x.right, text: 'Column ' + (i + 1) + ' has its quantity and unit', fix: 'Each heading needs the quantity and its unit in brackets, for example ‘' + x.right + '’.' }); });
      items.push({ ok: rows.length >= 6, text: 'At least six readings', fix: 'Take at least six readings: you have ' + rows.length + '.' });
      items.push({ ok: span >= (range[1] - range[0]) / 3 - 0.005, text: 'The readings cover the range', fix: 'Your currents only span ' + F.num(I[0] || 0) + ' to ' + F.num(I[I.length - 1] || 0) + ' A. This circuit can give ' + F.num(range[0]) + ' to ' + F.num(range[1]) + ' A: take readings over a wider range.' });
      items.push({ ok: !span || gap <= 0.4 * span + 1e-9, text: 'No big gap between readings', fix: 'There is a gap of ' + F.num(gap) + ' A between two of your currents. Add a reading in that gap.' });
      items.push({ ok: rows.every(function (r) { return r.opened; }), text: 'The switch was opened between readings', fix: 'Open the switch between readings, so the battery and resistors do not heat up. Delete the readings taken without opening it and take them again.' });
      items.push({ ok: rows.every(function (r) { return r.steady; }), text: 'Each reading was steady', fix: 'Wait for the steady tick before you record. Delete the shaded rows and take them again.' });
      var good = feedback(checkBox, items);
      plotBtn.disabled = rows.length < 2;
      if (cfg.onChecked) cfg.onChecked(good, rows);
    }
    var plotBtn = h('button', { class: 'btn', text: 'Plot these', onclick: function () {
      if (rows.length < 2) { msg.textContent = 'Record at least two readings first.'; return; }
      cfg.plot(rows);
    } });
    faces.appendChild(h('div', { class: 'dmm' }, [h('span', { class: 'small', text: 'Voltmeter' }), h('b', { 'data-m': 'V', text: '0,00 V' })]));
    faces.appendChild(h('div', { class: 'dmm' }, [h('span', { class: 'small', text: 'Ammeter' }), h('b', { 'data-m': 'A', text: '0,00 A' })]));
    swBtn.textContent = 'Close the switch';
    setRh(st.Rh);
    renderTable();
    var el = h('div', { class: 'lab' }, [
      h('div', {}, [canvas, banner]),
      h('div', {}, [
        h('div', { class: 'card ctrls' }, [faces, h('p', { class: 'small', style: 'margin:6px 0 10px' }, [tick]),
          h('div', { class: 'grp row' }, [swBtn]),
          h('div', { class: 'grp' }, [h('label', { class: 'small', text: 'Rheostat' }), h('div', { class: 'slider' }, [
            h('button', { class: 'btn ghost small', 'aria-label': 'Decrease', text: '−', onclick: function () { setRh(Math.max(0, st.Rh - 1)); } }), rng,
            h('button', { class: 'btn ghost small', 'aria-label': 'Increase', text: '+', onclick: function () { setRh(Math.min(rig.rheoMax, st.Rh + 1)); } })]), rOut]),
          cfg.extraCtrls || null,
          h('div', { class: 'grp row recrow' }, [h('button', { class: 'btn big', text: 'Record', onclick: record }), h('button', { class: 'btn ghost', text: 'Repeat', onclick: repeat })]), msg]),
        h('div', { class: 'card', style: 'margin-top:12px' }, [h('h3', { text: 'Your table' }), table,
          h('div', { class: 'row', style: 'margin-top:10px' }, [h('button', { class: 'btn ghost', text: 'Check my method', onclick: check }), plotBtn]), checkBox, cfg.after || null])
      ])
    ]);
    step(performance.now());
    return { el: el, rows: function () { return rows; }, st: st, reset: function (s) { Object.assign(st, s); rows = []; renderTable(); if (st.closed) fresh(); } };
  }

  /* hand a table to the graph tool */
  function toGraph(task, data) {
    try { sessionStorage.setItem('circ-plot', JSON.stringify(data)); } catch (e) { window.__circPlot = data; }
    location.hash = '#graph/' + task + '?from=exp&g=' + data.grade;
  }

  var PAGES = {};
  /* ---------- §5.1 Ohm's law ---------- */
  PAGES.ohm = function (e, params) {
    var g = ctx.grade(), seed = seedOf(params), st = { load: params.box && R.XBOX[params.box] ? params.box : 'X1', Rh: 20, closed: false };
    var reveal = h('div');
    var sel = h('select', { 'aria-label': 'What is being tested' }, ['X1', 'X2', 'X3', 'X4'].map(function (k) { return h('option', { value: k, text: 'resistor ' + k }); }).concat([h('option', { value: 'bulb', text: 'filament bulb (6,0 V 0,50 A)' })]));
    sel.value = st.load;
    var b = bench({
      rig: R.RIGS.ohm, st: st, seed: seed, heading: true,
      heads: g === 10 ? ['Current I (A)', 'Potential difference V (V)'] : [
        { options: ['Current', 'Current I (A)', 'I (V)', 'Resistance R (Ω)'], right: 'Current I (A)' },
        { options: ['Potential difference V (V)', 'Voltage', 'Potential difference (A)', 'emf (V)'], right: 'Potential difference V (V)' }],
      extraCtrls: h('div', { class: 'grp' }, [h('label', { class: 'small', text: 'Testing ' }), sel]),
      after: reveal,
      plot: function (rows) {
        var gr10 = g === 10, I = rows.map(function (r) { return r.I; }), Vv = rows.map(function (r) { return r.V; });
        toGraph('ohm', { task: 'ohm', grade: g, src: 'exp/ohm', load: st.load, seed: seed,
          x: gr10 ? I : Vv, y: gr10 ? Vv : I, xq: gr10 ? 'Current I (A)' : 'Potential difference V (V)', yq: gr10 ? 'Potential difference V (V)' : 'Current I (A)' });
      },
      onChecked: function (good, rows) {
        reveal.innerHTML = '';
        if (rows.length >= 6) reveal.appendChild(h('details', { class: 'grp', style: 'margin-top:10px' }, [h('summary', { text: 'Show what was inside' }),
          h('p', { text: st.load === 'bulb' ? 'A filament bulb rated 6,0 V 0,50 A: 12 Ω when it glows fully, less when it is cooler. Its V against I graph curves, so it is not ohmic: the resistance increases as the current increases, because the filament heats up.' :
            'Resistor ' + st.load + ' is marked ' + F.num(R.XBOX[st.load].marked, 1) + ' Ω; its true resistance is ' + F.num(R.XBOX[st.load].R) + ' Ω. Compare it with the R from your graph.' })]));
      }
    });
    sel.addEventListener('change', function () { st.load = sel.value; b.reset({ load: sel.value, Rh: 20, closed: false }); });
    ctx.main.appendChild(header(e, [h('div', { class: 'note' }, [h('b', { text: 'Steps' }), h('ol', {}, [
      'Set the rheostat to its largest value and close the switch.', 'Wait for the steady tick, then Record. Open the switch.',
      'Repeat for at least six settings spread over the range.', 'Plot your readings, find the gradient and write the conclusion.',
      'Then choose the filament bulb and repeat.'].map(function (s) { return h('li', { text: s }); }))]),
      h('p', { class: 'small muted', text: g === 10 ? 'Grade 10: plot V against I, so the gradient is R.' : 'Grades 11 and 12: plot I against V, as in the book, so the gradient is 1/R.' })]));
    ctx.main.appendChild(h('div', { class: 'wrap' }, [b.el]));
  };

  /* ---------- §5.3 emf and r ---------- */
  PAGES['emf-r'] = function (e, params) {
    var g = ctx.grade(), seed = seedOf(params), boxId = (params.box || '').toUpperCase();
    ctx.main.appendChild(header(e));
    var wrap = h('div', { class: 'wrap' }); ctx.main.appendChild(wrap);
    if (!boxId) {
      wrap.appendChild(h('div', { class: 'row' }, [
        h('a', { class: 'btn', href: '#exp/emf-r?box=R&seed=' + seed, text: 'Find a hidden battery’s emf and r' }),
        h('a', { class: 'btn ghost', href: '#exp/emf-r?box=S', text: 'Set the battery yourself' })]));
      wrap.appendChild(h('p', { class: 'small muted', style: 'margin-top:10px', text: 'Teachers: add seed=… to the link so the whole class gets the same hidden battery. Fixed boxes A to F: box=A … box=F.' }));
      return;
    }
    var hidden = boxId !== 'S', box = boxId === 'R' ? R.boxR(seed) : R.BOXES[boxId] || (boxId === 'S' ? { emf: 12, r: 2 } : R.boxR(seed));
    var st = { emf: box.emf, r: box.r, Rh: 30, closed: false };
    var extra = null, reveal = h('div');
    if (!hidden) {
      var e1 = h('input', { type: 'range', min: '1.5', max: '24', step: '0.5', value: '12', 'aria-label': 'emf in volts' }), o1 = h('output', { class: 'n', text: '12,0 V' });
      var r1 = h('input', { type: 'range', min: '0', max: '5', step: '0.05', value: '2', 'aria-label': 'internal resistance in ohms' }), o2 = h('output', { class: 'n', text: '2,00 Ω' });
      e1.addEventListener('input', function () { st.emf = +e1.value; o1.textContent = F.num(st.emf, 1) + ' V'; });
      r1.addEventListener('input', function () { st.r = +r1.value; o2.textContent = F.num(st.r) + ' Ω'; });
      extra = h('div', { class: 'grp' }, [h('p', { class: 'small', text: 'You changed the battery itself: these sliders are the emf and r. Set r = 0 and the line is flat, because there are no lost volts.' }),
        h('label', { class: 'small', text: 'emf ' }), e1, o1, h('br'), h('label', { class: 'small', text: 'r ' }), r1, o2]);
    }
    var b = bench({
      rig: R.RIGS.emf, st: st, seed: seed, heating: hidden, extraCtrls: extra, after: reveal,
      drawOpts: { hideEmf: hidden, hideR: hidden },
      heads: [{ options: ['Current I (A)', 'Current (V)', 'I', 'Resistance R (Ω)'], right: 'Current I (A)' },
        { options: ['emf (V)', 'Terminal potential difference V (V)', 'Voltage', 'Lost volts (V)'], right: 'Terminal potential difference V (V)' }],
      plot: function (rows) {
        toGraph('vi-term', { task: 'vi-term', grade: g, src: 'exp/emf-r', box: boxId, seed: seed, hidden: hidden, truth: { emf: st.emf, r: st.r },
          x: rows.map(function (r) { return r.I; }), y: rows.map(function (r) { return r.V; }), xq: 'Current I (A)', yq: 'Terminal potential difference V (V)' });
      },
      onChecked: function (good, rows) {
        reveal.innerHTML = '';
        if (!hidden || rows.length < 6) return;
        var fit = N.lsq(rows.map(function (r) { return r.I; }), rows.map(function (r) { return r.V; })), rr = -fit.m, pct = 100 * (rr - box.r) / box.r;
        reveal.appendChild(h('details', { class: 'grp', style: 'margin-top:10px' }, [h('summary', { text: 'Done your graph? Show the box’s emf and r' }),
          h('p', { text: 'The box: emf ' + F.num(box.emf) + ' V and r ' + F.num(box.r) + ' Ω.' }),
          h('p', { text: 'The best-fit line through your table gives r = ' + F.num(rr) + ' Ω (' + F.num(Math.abs(pct), 1) + ' % ' + (pct < 0 ? 'below' : 'above') + ' the box’s value) and emf = ' + F.num(fit.c) + ' V. In 95 runs in 100 of this experiment, r lands within 7,5 %.' }),
          g === 12 ? h('ul', {}, ['Why the line and not two rows? Two rows pick up the scatter of just two readings; the line averages all of them.',
            'Why open the switch? Left closed at more than 1 A, the battery warms and its r rises: 1,60 Ω becomes 1,80 Ω after 120 s.',
            'What kind of error? Scatter about the line is random. A voltmeter that reads 0,05 V too high moves every point and the intercept: that is systematic.'].map(function (s) { return h('li', { text: s }); })) : null]));
      }
    });
    wrap.appendChild(h('div', { class: 'note' }, [h('b', { text: hidden ? 'Box ' + boxId + ': the emf and r are hidden' : 'Box S: you set the battery' }),
      h('p', { class: 'small', style: 'margin:4px 0 0', text: 'A rheostat (never a bulb, whose resistance changes as it heats) varies the current. A 1,0 Ω protective resistor is fitted. The voltmeter is across the battery: it reads the terminal pd.' })]));
    wrap.appendChild(b.el);
  };

  /* ---------- a bench without a rheostat: record every meter for each arrangement (rules, power) ---------- */
  function board(rig, st, seed, drawOpts) {
    var rnd = N.mulberry32(seed), z = null, changedAt = 0, disp = {}, canvas = h('div', { class: 'canvas' }), tick = h('span', { class: 'steady off', text: '✓ steady' }), last = performance.now(), lastDraw = 0;
    function fresh() { z = R.draw(rnd, rig, st); changedAt = performance.now(); }
    function step(now) {
      var dt = Math.min(0.5, (now - last) / 1000); last = now;
      var m = R.measure(rig, st, z, 1), k = 1 - Math.exp(-dt / 0.4), steady = now - changedAt > 1500;
      Object.keys(m.read).forEach(function (id) { var t = m.read[id]; disp[id] = disp[id] == null || steady ? t : disp[id] + (t - disp[id]) * k; });
      tick.classList.toggle('off', !steady);
      if (now - lastDraw > (steady ? 1000 : 140)) {
        lastDraw = now;
        var res = m.res; res.read = {}; Object.keys(disp).forEach(function (id) { res.read[id] = r2(disp[id]); });
        drawInto(canvas, rig.spec(st), res, drawOpts && drawOpts());
      }
      if (api.onTick) api.onTick(dt, m, steady);
    }
    var timer = setInterval(function () { step(performance.now()); }, 100);
    ctx.stop(function () { clearInterval(timer); });
    var api = {
      canvas: canvas, tick: tick, st: st,
      change: function (s) { Object.assign(st, s); disp = {}; fresh(); },
      steady: function () { return performance.now() - changedAt > 1500; },
      read: function () { var o = {}; Object.keys(disp).forEach(function (id) { o[id] = r2(disp[id]); }); return o; }
    };
    fresh(); step(performance.now());
    return api;
  }
  function seg(label, opts, value, on) {
    var box = h('div', { class: 'seg', role: 'group', 'aria-label': label });
    opts.forEach(function (o) { box.appendChild(h('button', { 'aria-pressed': String(o[0] === value), text: o[1], onclick: function () {
      Array.prototype.forEach.call(box.children, function (b) { b.setAttribute('aria-pressed', 'false'); }); this.setAttribute('aria-pressed', 'true'); on(o[0]); } })); });
    return box;
  }
  function toggleBtn(text, on) { var b = h('button', { class: 'btn ghost small', 'aria-pressed': 'false', text: text }); b.addEventListener('click', function () { var v = b.getAttribute('aria-pressed') !== 'true'; b.setAttribute('aria-pressed', String(v)); b.classList.toggle('on', v); on(v); }); return b; }

  /* ---------- §5.2 series and parallel rules ---------- */
  PAGES.rules = function (e, params) {
    var g = ctx.grade(), seed = seedOf(params), st = { arr: 'series', r: 0, third: false };
    var bd = board(R.RIGS.rules, st, seed, function () { return { ideal: !st.r }; });
    var ser = [], par = [], tables = h('div'), out = h('div'), msg = h('p', { class: 'small muted', 'aria-live': 'polite' });
    function record() {
      if (!bd.steady()) { msg.textContent = 'Wait for the steady tick, then Record.'; return; }
      var rd = bd.read(), row = Object.assign({ r: st.r, third: st.third }, rd);
      (st.arr === 'series' ? ser : par).push(row); msg.textContent = 'Recorded.'; draw();
    }
    function tbl(rows, cols, title) {
      return h('div', { class: 'twrap' }, [h('h3', { text: title }), h('table', { class: 'rec' }, [h('thead', {}, [h('tr', {}, cols.map(function (c) { return h('th', { html: c[1] }); }))]),
        h('tbody', {}, rows.map(function (r) { return h('tr', {}, cols.map(function (c) { return h('td', { class: 'n', text: c[0] === 'note' ? (r.third ? 'with R₃' : '') + (r.r ? ' r = 0,5 Ω' : '') : F.num(r[c[0]]) }); })); }))])]);
    }
    function draw() {
      tables.innerHTML = '';
      tables.appendChild(tbl(ser, [['A1', 'I<sub>1</sub> (A)'], ['A2', 'I<sub>2</sub> (A)'], ['A3', 'I<sub>3</sub> (A)'], ['V1', 'V<sub>1</sub> (V)'], ['V2', 'V<sub>2</sub> (V)'], ['V', 'V (V)'], ['note', '']], 'Series'));
      tables.appendChild(tbl(par, [['A', 'I (A)'], ['A1', 'I<sub>1</sub> (A)'], ['A2', 'I<sub>2</sub> (A)'], ['V1', 'V<sub>1</sub> (V)'], ['V2', 'V<sub>2</sub> (V)'], ['note', '']], 'Parallel'));
    }
    function check() {
      out.innerHTML = '';
      var s = ser.filter(function (r) { return !r.r; })[0], p = par.filter(function (r) { return !r.r && !r.third; })[0];
      var items = [];
      if (s) {
        var tolI = 0.01 + 0.02 * s.A1;
        items.push({ ok: Math.abs(s.A1 - s.A2) <= tolI && Math.abs(s.A2 - s.A3) <= tolI, text: 'Series: the current is the same everywhere (equal within the meter’s scatter)', fix: 'Compare I₁, I₂ and I₃ again.' });
        items.push({ ok: Math.abs(s.V1 + s.V2 - s.V) <= Math.max(0.03, 0.01 * s.V), text: 'Series: V₁ + V₂ = V (' + F.num(s.V1) + ' + ' + F.num(s.V2) + ' = ' + F.num(s.V1 + s.V2) + ' V)', fix: 'Add V₁ and V₂ and compare with V.' });
      } else items.push({ ok: false, text: 'A series reading', fix: 'Record one reading in series (r = 0).' });
      if (p) items.push({ ok: Math.abs(p.A - p.A1 - p.A2) <= 0.02 + 0.02 * p.A, text: 'Parallel: I = I₁ + I₂ (' + F.num(p.A1) + ' + ' + F.num(p.A2) + ' = ' + F.num(p.A1 + p.A2) + ' A)', fix: 'Add the branch currents and compare with the main current.' });
      else items.push({ ok: false, text: 'A parallel reading', fix: 'Switch to parallel (R₃ off, r = 0) and record one reading.' });
      feedback(out, items);
      if (s && p) {
        var rsOwn = s.V / s.A1, rpOwn = p.V1 / p.A, inS = h('input', { class: 'num', inputmode: 'decimal', 'aria-label': 'series resistance' }), inP = h('input', { class: 'num', inputmode: 'decimal', 'aria-label': 'parallel resistance' }), fb = h('div');
        out.appendChild(h('div', { class: 'card', style: 'margin-top:10px' }, [h('h3', { text: 'Find the total resistance from your own readings' }),
          h('p', { class: 'small', text: 'R = V/I, with the total pd and the main current from the same arrangement.' }),
          h('div', { class: 'row' }, [h('label', { text: 'R series = ' }), inS, h('span', { text: 'Ω' })]), h('div', { class: 'row', style: 'margin-top:6px' }, [h('label', { text: 'R parallel = ' }), inP, h('span', { text: 'Ω' })]),
          h('button', { class: 'btn ghost', style: 'margin-top:8px', text: 'Check', onclick: function () {
            var a = F.parse(inS.value), b = F.parse(inP.value), t = [];
            t.push(Math.abs(a - rsOwn) <= 0.02 * rsOwn ? '✓ R series = ' + F.num(rsOwn) + ' Ω from your readings (10 Ω + 20 Ω = 30 Ω).' : '✗ Use your own series readings: R = V/I = ' + F.num(s.V) + '/' + F.num(s.A1) + '.');
            if (Math.abs(b - rpOwn) <= 0.02 * rpOwn) t.push('✓ R parallel = ' + F.num(rpOwn) + ' Ω from your readings (rule: 6,67 Ω).');
            else if (Math.abs(b - p.V1 / p.A1) <= 0.02 * (p.V1 / p.A1) || Math.abs(b - p.V2 / p.A2) <= 0.02 * (p.V2 / p.A2)) t.push('✗ Which part of the circuit is this current for? That is one branch’s current. For the total resistance use the main current I.');
            else t.push('✗ Use the pd across the pair and the main current: R = ' + F.num(p.V1) + '/' + F.num(p.A) + '.');
            if (b >= 10) t.push('Sense check: the parallel resistance is always smaller than the smallest branch (10 Ω).');
            fb.innerHTML = ''; t.forEach(function (x) { fb.appendChild(h('p', { text: x })); });
          } }), fb]));
      }
    }
    var third = h('div', { class: 'grp hidden' }, [toggleBtn('Add a third resistor (30 Ω)', function (v) { bd.change({ third: v }); }), h('p', { class: 'small muted', text: 'Predict the new main current first: does it go up or down?' })]);
    var ctrls = [h('div', { class: 'grp' }, [seg('Arrangement', [['series', 'Series'], ['parallel', 'Parallel']], 'series', function (v) { bd.change({ arr: v, third: false }); third.classList.toggle('hidden', v !== 'parallel'); })]), third];
    if (g >= 11) ctrls.push(h('div', { class: 'grp' }, [toggleBtn('After Module 11: give the battery r = 0,5 Ω', function (v) { bd.change({ r: v ? 0.5 : 0 }); })]));
    ctx.main.appendChild(header(e, [h('div', { class: 'note' }, [h('b', { text: 'Steps' }), h('ol', {}, ['In series, record the three currents and the three pds.', 'Switch to parallel and record the main current, both branch currents and both pds.', 'Check the rules, then find the total resistance both ways.'].map(function (s) { return h('li', { text: s }); }))])]));
    ctx.main.appendChild(h('div', { class: 'wrap' }, [h('div', { class: 'lab' }, [h('div', {}, [bd.canvas]), h('div', {}, [
      h('div', { class: 'card ctrls' }, ctrls.concat([h('p', { class: 'small' }, [bd.tick]), h('div', { class: 'grp row recrow' }, [h('button', { class: 'btn big', text: 'Record', onclick: record })]), msg])),
      h('div', { class: 'card', style: 'margin-top:12px' }, [tables, h('div', { class: 'row', style: 'margin-top:10px' }, [h('button', { class: 'btn ghost', text: 'Check the rules', onclick: check })]), out])])])]));
    draw();
  };

  /* ---------- §5.4 power and brightness ---------- */
  PAGES.power = function (e, params) {
    var g = ctx.grade(), seed = seedOf(params), st = { arr: 'one', r: 0, filament: false }, rows = [], energy = {}, msg = h('p', { class: 'small muted', 'aria-live': 'polite' });
    var bd = board(R.RIGS.power, st, seed, function () { return { ideal: !st.r, showPower: false }; });
    var bars = h('div', { class: 'ebars' }), tables = h('div'), out = h('div');
    bd.onTick = function (dt, m) {
      var bl = R.RIGS.power.bulbs(st, m.read);
      bars.innerHTML = '';
      bl.forEach(function (b) {
        var P = b.V * b.I; energy[b.id] = (energy[b.id] || 0) + P * dt;
        bars.appendChild(h('div', { class: 'ebar' }, [h('span', { class: 'small', text: b.id.replace('L', 'bulb ') + ': ' + F.num(P, 1) + ' W' }),
          h('div', { class: 'track' }, [h('i', { style: 'width:' + Math.min(100, energy[b.id] / 30) + '%' })]), h('span', { class: 'small n', text: Math.round(energy[b.id]) + ' J' })]));
      });
    };
    var NAMES = { one: 'One bulb', series: 'Two in series', parallel: 'Two in parallel' };
    function record() {
      if (!bd.steady()) { msg.textContent = 'Wait for the steady tick, then Record.'; return; }
      var b = R.RIGS.power.bulbs(st, bd.read())[0];
      rows.push({ arr: st.arr, name: NAMES[st.arr] + (st.r ? ', r = 0,5 Ω' : '') + (st.filament ? ', filament' : ''), V: b.V, I: b.I, P: '', rank: '' }); draw();
    }
    function draw() {
      tables.innerHTML = '';
      tables.appendChild(h('div', { class: 'twrap' }, [h('table', { class: 'rec' }, [h('thead', {}, [h('tr', {}, ['Arrangement', 'Potential difference V (V)', 'Current I (A)', 'Power P (W)', 'Brightness rank'].map(function (t) { return h('th', { text: t }); }))]),
        h('tbody', {}, rows.map(function (r) {
          var p = h('input', { class: 'num', inputmode: 'decimal', value: r.P, 'aria-label': 'power' }); p.addEventListener('change', function () { r.P = p.value; });
          var k = h('input', { class: 'num', inputmode: 'numeric', value: r.rank, 'aria-label': 'rank, 1 = brightest', style: 'width:4em' }); k.addEventListener('change', function () { r.rank = k.value; });
          return h('tr', {}, [h('td', { text: r.name }), h('td', { class: 'n', text: F.num(r.V) }), h('td', { class: 'n', text: F.num(r.I) }), h('td', {}, [p]), h('td', {}, [k])]);
        }))])]));
    }
    function check() {
      var items = [];
      rows.forEach(function (r, i) {
        var P = F.parse(r.P), want = r.V * r.I;
        items.push({ ok: Math.abs(P - want) <= Math.max(0.011 * want, 0.01), text: 'Row ' + (i + 1) + ': P = VI = ' + F.num(r.V) + ' × ' + F.num(r.I) + ' = ' + F.num(want) + ' W', fix: 'Row ' + (i + 1) + ': use that bulb’s own V and I, P = VI.' });
      });
      var order = rows.map(function (r, i) { return { i: i, P: r.V * r.I }; }).sort(function (a, b) { return b.P - a.P; }), ranks = {}, k = 0, prev = null;
      order.forEach(function (o) { if (prev == null || Math.abs(o.P - prev) > 0.05 * prev) k++; ranks[o.i] = k; prev = o.P; });
      items.push({ ok: rows.length > 1 && rows.every(function (r, i) { return +r.rank === ranks[i]; }), text: 'The brightness ranks match the powers (1 = brightest; equal powers share a rank)', fix: 'The bulb with the larger power is brighter. Rank by P.' });
      feedback(out, items);
      if (items.every(function (x) { return x.ok; })) out.appendChild(h('p', { text: 'The bulb with the larger power is brighter; here the pd across it is larger and so is the current through it.' }));
    }
    var ctrls = [h('div', { class: 'grp' }, [seg('Arrangement', [['one', 'One bulb'], ['series', 'Two in series'], ['parallel', 'Two in parallel']], 'one', function (v) { energy = {}; bd.change({ arr: v }); })]),
      h('div', { class: 'grp row' }, [toggleBtn('Filament bulbs (6,0 V 0,50 A on 6 V)', function (v) { energy = {}; bd.change({ filament: v }); }),
        g >= 11 ? toggleBtn('After Module 11: r = 0,5 Ω', function (v) { energy = {}; bd.change({ r: v ? 0.5 : 0 }); }) : null]),
      bars, h('p', { class: 'small' }, [bd.tick]), h('div', { class: 'grp row recrow' }, [h('button', { class: 'btn big', text: 'Record bulb 1', onclick: record })]), msg];
    ctx.main.appendChild(header(e, [h('div', { class: 'note' }, [h('b', { text: 'Steps' }), h('ol', {}, [
      h('li', { text: 'Record one bulb, then two in series, then two in parallel (all on 12 V).' }),
      h('li', { text: 'Work out P = VI for each, and rank the brightness.' }),
      h('li', {}, ['Predict, then test: ', h('a', { href: '#lab/g10-bulbs', text: 'a bulb in series with a switched pair' }), '.']),
      h('li', {}, ['The bypass switch: ', h('a', { href: '#lab/D1', text: 'a switch across one of two series bulbs' }), '.'])])]),
      h('p', { class: 'small muted', text: 'The bars fill at a rate set by each bulb’s power: E = Pt. Power is energy per second.' })]));
    ctx.main.appendChild(h('div', { class: 'wrap' }, [h('div', { class: 'lab' }, [h('div', {}, [bd.canvas]), h('div', {}, [h('div', { class: 'card ctrls' }, ctrls),
      h('div', { class: 'card', style: 'margin-top:12px' }, [h('h3', { text: 'Your table' }), tables, h('div', { class: 'row', style: 'margin-top:10px' }, [h('button', { class: 'btn ghost', text: 'Check', onclick: check })]), out])])])]));
    draw();
  };

  /* ---------- §5.5 kWh and cost ---------- */
  PAGES.kwh = function (e, params) {
    var tariff = F.parse(params.tariff || '3.5'); if (!(tariff > 0)) tariff = 3.5;
    var APPS = [['Kettle', 2200, '4 min a day for 30 days', 120], ['Microwave', 1200, '90 min', 90], ['Heater', 2000, '45 min', 45], ['Lamp', 60, '5 h a day for 30 days', 9000], ['Geyser', 3000, '2 h a day for 30 days', 3600]];
    var cur = 0, mins = 0, running = false, speed = 60, kwhOut = h('b', { class: 'n' }), randOut = h('b', { class: 'n' }), clock = h('b', { class: 'n' }), out = h('div');
    function show() {
      var a = APPS[cur], E = a[1] / 1000 * mins / 60;
      kwhOut.textContent = F.num(E) + ' kWh'; randOut.textContent = 'R' + F.num(E * tariff); clock.textContent = Math.floor(mins / 60) + ' h ' + Math.round(mins % 60) + ' min';
    }
    /* speed: simulated seconds per real second (60: 1 s = 1 min; 3600: 1 s = 1 h) */
    var timer = setInterval(function () { if (!running) return; mins = Math.min(APPS[cur][3], mins + speed / 60 * 0.1); if (mins >= APPS[cur][3]) running = false; show(); }, 100);
    ctx.stop(function () { clearInterval(timer); });
    var sel = h('select', { 'aria-label': 'Appliance' }, APPS.map(function (a, i) { return h('option', { value: String(i), text: a[0] + ' ' + a[1].toLocaleString('en-ZA').replace(/,/g, ' ') + ' W, ' + a[2] }); }));
    sel.addEventListener('change', function () { cur = +sel.value; mins = 0; running = false; show(); out.innerHTML = ''; inputs.forEach(function (i) { i.value = ''; }); });
    var sp = seg('Clock', [[60, '1 s = 1 min'], [3600, '1 s = 1 h']], 60, function (v) { speed = v; });
    var inP = h('input', { class: 'num', inputmode: 'decimal', 'aria-label': 'power in kW' }), inT = h('input', { class: 'num', inputmode: 'decimal', 'aria-label': 'time in hours' }),
      inE = h('input', { class: 'num', inputmode: 'decimal', 'aria-label': 'energy' }), unitE = h('select', { 'aria-label': 'energy unit' }, ['kWh', 'kW/h', 'kW', 'J'].map(function (u) { return h('option', { value: u, text: u }); })),
      inC = h('input', { class: 'num', inputmode: 'decimal', 'aria-label': 'cost in rand' }), inputs = [inP, inT, inE, inC];
    function check() {
      var a = APPS[cur], P = a[1] / 1000, t = a[3] / 60, E = P * t, C = E * tariff, fb = [];
      var p = F.parse(inP.value), tt = F.parse(inT.value), ee = F.parse(inE.value), cc = F.parse(inC.value), near = function (x, y) { return Math.abs(x - y) <= 0.011 * Math.abs(y) + 1e-9; };
      fb.push(near(p, P) ? '✓ P = ' + F.num(P, 3).replace(/0+$/, '').replace(/,$/, '') + ' kW' : near(p, a[1]) ? '✗ Change watts to kilowatts: divide by 1 000.' : '✗ P in kW: ' + a[1] + ' W ÷ 1 000.');
      fb.push(near(tt, t) ? '✓ t = ' + F.num(t) + ' h' : near(tt, a[3]) ? '✗ Change minutes to hours: divide by 60. (An answer 60 times too large is the usual slip.)' : '✗ t in hours: ' + a[2] + '.');
      fb.push(near(ee, E) && unitE.value === 'kWh' ? '✓ E = Pt = ' + F.num(E) + ' kWh' : unitE.value === 'kW/h' ? '✗ The unit is kWh, a kilowatt multiplied by an hour, never kW/h.' : near(ee, E * 1000) ? '✗ Watts not changed to kilowatts: your answer is 1 000 times too large.' : near(ee, E * 60) ? '✗ Minutes not changed to hours: your answer is 60 times too large.' : '✗ E = P × t, with P in kW and t in h.');
      fb.push(near(cc, C) && /[.,]\d\d$/.test(inC.value.trim()) ? '✓ Cost = ' + F.num(E) + ' × R' + F.num(tariff) + ' = R' + F.num(C) : near(cc, C) ? '✗ Give the cost in rand to two decimal places.' : '✗ Cost = E (kWh) × tariff (R per kWh).');
      out.innerHTML = ''; fb.forEach(function (x) { out.appendChild(h('p', { text: x })); });
      out.appendChild(h('p', { class: 'small muted', text: 'Compare with the counters after a full run.' }));
    }
    ctx.main.appendChild(header(e, [h('p', { class: 'small muted', text: 'Example tariff: R' + F.num(tariff) + ' per kWh (teachers can set tariff= in the link).' })]));
    ctx.main.appendChild(h('div', { class: 'wrap' }, [h('div', { class: 'lab' }, [
      h('div', { class: 'card' }, [h('label', { class: 'small', text: 'Appliance ' }), sel, h('div', { class: 'grp', style: 'margin-top:10px' }, [sp]),
        h('div', { class: 'row grp' }, [h('button', { class: 'btn', text: 'Switch on and run', onclick: function () { running = true; } }), h('button', { class: 'btn ghost', text: 'Pause', onclick: function () { running = false; } }), h('button', { class: 'btn ghost', text: 'Reset', onclick: function () { running = false; mins = 0; show(); } })]),
        h('div', { class: 'dmms' }, [h('div', { class: 'dmm' }, [h('span', { class: 'small', text: 'Clock' }), clock]), h('div', { class: 'dmm' }, [h('span', { class: 'small', text: 'Energy' }), kwhOut]), h('div', { class: 'dmm' }, [h('span', { class: 'small', text: 'Cost' }), randOut])])]),
      h('div', { class: 'card' }, [h('h3', { text: 'Work it out in four steps' }),
        h('div', { class: 'row' }, [h('label', { text: '1. P = ' }), inP, h('span', { text: 'kW' })]),
        h('div', { class: 'row', style: 'margin-top:6px' }, [h('label', { text: '2. t = ' }), inT, h('span', { text: 'h' })]),
        h('div', { class: 'row', style: 'margin-top:6px' }, [h('label', { text: '3. E = Pt = ' }), inE, unitE]),
        h('div', { class: 'row', style: 'margin-top:6px' }, [h('label', { text: '4. cost = R' }), inC]),
        h('button', { class: 'btn ghost', style: 'margin-top:10px', text: 'Check', onclick: check }), out])])]));
    show();
  };
})();
