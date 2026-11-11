/* Circuits Studio: router, grade switch and the virtual lab (studio_design.md §1.4, §2, §4).
   No sign-in, no AI, nothing sent anywhere. Stored on this device only: the grade (shared with the app as
   mrr-grade) and the last preset (circ-studio-v1). */
(function () {
  'use strict';
  var S = window.CircuitSolver, D = window.Draw, F = window.Fmt, PR = window.STUDIO.presets, LINKS = window.STUDIO.links;
  var main = document.getElementById('main'), say = document.getElementById('say');
  var store = {
    get: function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set: function (k, v) { try { localStorage.setItem(k, v); } catch (e) { /* private window */ } }
  };
  function h(tag, attrs, kids) {
    var el = document.createElement(tag);
    for (var k in (attrs || {})) {
      if (k === 'text') el.textContent = attrs[k];
      else if (k === 'html') el.innerHTML = attrs[k];
      else if (k.slice(0, 2) === 'on') el.addEventListener(k.slice(2), attrs[k]);
      else if (attrs[k] != null && attrs[k] !== false) el.setAttribute(k, attrs[k] === true ? '' : attrs[k]);
    }
    (kids || []).forEach(function (c) { if (c != null) el.appendChild(typeof c === 'string' ? document.createTextNode(c) : c); });
    return el;
  }
  function clone(o) { return JSON.parse(JSON.stringify(o)); }

  /* ---------- routes ---------- */
  function parseHash() {
    var raw = location.hash.replace(/^#/, ''), q = raw.indexOf('?'), path = q >= 0 ? raw.slice(0, q) : raw, params = {};
    if (q >= 0) raw.slice(q + 1).split('&').forEach(function (kv) { var p = kv.split('='); if (p[0]) params[decodeURIComponent(p[0])] = decodeURIComponent(p[1] || ''); });
    var bits = path.split('/');
    return { view: bits[0] || 'home', arg: bits.slice(1).join('/'), params: params };
  }
  /* grade: the link's g for this visit, else the stored mrr-grade, else 11; then the book floor gmin */
  var grade = 11, lockGrade = false;
  function pickGrade(params) {
    var g = parseInt(params.g, 10);
    if (!(g >= 10 && g <= 12)) g = parseInt(store.get('mrr-grade'), 10);
    if (!(g >= 10 && g <= 12)) g = 11;
    var gmin = parseInt(params.gmin, 10);
    if (gmin >= 10 && gmin <= 12 && g < gmin) g = gmin;
    return g;
  }
  function setGrade(g, save) {
    grade = g; document.body.classList.toggle('g10', g === 10);
    if (save) store.set('mrr-grade', String(g));
    var seg = document.getElementById('gradeSeg');
    if (seg) Array.prototype.forEach.call(seg.querySelectorAll('button'), function (b) { b.setAttribute('aria-pressed', String(+b.dataset.g === g)); });
  }

  function route() {
    var r = parseHash();
    setGrade(pickGrade(r.params), false);
    lockGrade = r.params.lock === '1';
    document.getElementById('gradeSeg').classList.toggle('hidden', lockGrade);
    stopTween();
    main.innerHTML = '';
    if (r.view === 'lab' && r.arg) return lab(r.arg, r.params);
    if (r.view === 'home' || r.view === '' || r.view === 'start') return home();
    if (r.view === 'about') return about();
    return soon(r);
  }

  /* ---------- home ---------- */
  function home() {
    document.title = 'Circuits Studio · Mr R Science';
    main.appendChild(h('div', { class: 'wrap' }, [
      h('p', { class: 'eyebrow', text: 'Physical Sciences · Grades 10 to 12' }),
      h('h1', { text: 'Circuits Studio' }),
      h('p', { class: 'muted', text: 'A virtual lab with IEB circuit symbols, ideal meters and the readings on the diagram. Change one thing and watch every reading change at the same instant.' }),
      h('div', { class: 'note', html: 'This is the first part of the studio: the <b>virtual lab</b>. Experiments, the graph tool, Explain a change, lessons and practice come next.' }),
      h('h2', { text: 'Circuits for Grade ' + grade }),
      h('div', { class: 'grid' }, PR.list.filter(function (p) { return p.grades.indexOf(grade) >= 0; }).map(function (p) {
        return h('a', { class: 'card pcard', href: '#lab/' + p.id }, [
          h('h3', { text: p.title }), h('p', { class: 'small muted', text: p.intro }),
          h('span', { class: 'chip', text: 'Book ' + p.book })
        ]);
      }))
    ]));
  }

  function about() {
    main.appendChild(h('div', { class: 'wrap' }, [
      h('h1', { text: 'About' }),
      h('p', { text: 'Circuits Studio is part of Mr R Science, a free set of learning spaces for South African Physical Sciences learners. It needs no sign-in and sends nothing anywhere. Your grade and last circuit are stored on this device only.' }),
      h('p', { text: 'Every circuit here is Noel Robert’s own. Licence for his content: CC BY-NC-SA 4.0. IEB material, where it appears later, stays the IEB’s and is acknowledged where it is used.' })
    ]));
  }

  /* a printed or catalogue route that is not built yet: say so and open the nearest lab */
  var NEAR = { exp: { ohm: 'series3', rules: 'series3', 'emf-r': 'E', power: 'D', kwh: 'D' }, graph: 'E', chain: 'A', later: null, learn: null };
  function soon(r) {
    var target = NEAR[r.view], id = target && typeof target === 'object' ? target[r.arg] : target;
    if (id && grade === 10 && PR.byId(id).grades.indexOf(10) < 0) id = id === 'A' ? 'A10' : 'E10';
    var names = { exp: 'Experiments', graph: 'the graph tool', chain: 'Explain a change', later: 'come-back checks', learn: 'topic pages', listen: 'lessons', practise: 'practice', check: 'checks', paper: 'Mini-papers', museum: 'the Mistake museum', words: 'Words that win marks', we: 'worked examples' };
    main.appendChild(h('div', { class: 'wrap' }, [
      h('h1', { text: 'Coming soon' }),
      h('p', { text: 'This part of the studio (' + (names[r.view] || r.view) + ') is still being built. The virtual lab is ready now.' }),
      id ? h('p', {}, [h('a', { class: 'btn', href: '#lab/' + id + (r.params.r === '0' ? '?r=0' : '') }, ['Open a circuit in the lab'])]) : null,
      h('p', {}, [h('a', { class: 'btn ghost', href: '#home' }, ['All circuits'])])
    ]));
  }

  /* ---------- the lab ---------- */
  var T = null;                               /* the running tween */
  function stopTween() { if (T) { cancelAnimationFrame(T); T = null; } }
  var reduced = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  function lab(id, params) {
    var p = PR.byId(id);
    if (!p) { main.appendChild(h('div', { class: 'wrap' }, [h('h1', { text: 'This circuit is not in the studio' }), h('p', {}, [h('a', { href: '#home', text: 'All circuits' })])])); return; }
    var ideal = params.r === '0' || grade === 10;
    if (ideal && p.r0) p = PR.byId(p.r0);                     /* A with r=0 loads A10's values */
    if (p.grades.indexOf(grade) < 0) {
      main.appendChild(h('div', { class: 'wrap' }, [
        h('h1', { text: p.title }),
        h('div', { class: 'warnc', text: grade === 10 ? 'This circuit uses a battery with internal resistance, which is Grade 11 work. Switch to Grade 11 to open it, or pick a Grade 10 circuit.' : 'This circuit is for Grade ' + p.grades.join(' and ') + '.' }),
        h('div', { class: 'row' }, [h('button', { class: 'btn', onclick: function () { setGrade(p.grades[p.grades.length - 1], true); route(); }, text: 'Switch to Grade ' + p.grades[p.grades.length - 1] }), h('a', { class: 'btn ghost', href: '#home', text: 'Grade ' + grade + ' circuits' })])
      ]));
      return;
    }
    store.set('circ-studio-v1', JSON.stringify({ last: p.id }));
    document.title = p.title + ' · Circuits Studio';
    var spec = clone(p.spec);
    if (ideal) spec.parts.forEach(function (q) { if (q.kind === 'battery') q.r = 0; });
    var view = params.view === 'potential' || params.view === 'height' ? 'potential' : 'circuit';
    var real = false, showPower = false;
    var res = S.solve(spec, { real: real }), shown = res, ghosts = {};
    /* fixed scales at load (D2, §4.10): glow reference per bulb, the largest current, the largest emf */
    var pref = {}, imax = 0, vmax = 0;
    spec.parts.forEach(function (q) {
      if (q.kind === 'bulb') pref[q.id] = Math.max(1, res.el[q.id] ? res.el[q.id].p : 1);
      if (q.kind === 'battery') vmax = Math.max(vmax, q.emf);
    });
    if (res.state === 'ok') res.net.els.forEach(function (e) { imax = Math.max(imax, Math.abs(res.el[e.id].i || 0)); });
    if (!imax) imax = 1;

    var canvas = h('div', { class: 'canvas', id: 'canvas' }), cap = h('div', { class: 'caption off', 'aria-hidden': 'true', text: 'All readings change at the same instant' });
    var stateBox = h('div', { id: 'stateBox' }), readBox = h('div', { id: 'readBox' }), ctrls = h('div', { class: 'card ctrls' });
    var head = h('div', { class: 'wrap' }, [
      h('div', { class: 'row' }, [h('a', { class: 'chip', href: '#home', text: '← All circuits' }), h('span', { class: 'chip', text: 'Book ' + p.book }),
        ideal && grade >= 11 ? h('span', { class: 'chip', text: 'ideal battery (r = 0)' }) : null]),
      h('h1', { text: p.title, style: 'margin-top:10px' }),
      h('p', { text: p.intro }),
      p.note ? h('p', { class: 'small muted', text: p.note }) : null,
      params.view === 'height' ? h('div', { class: 'note small', text: 'The height view is coming soon. The potential view below shades every wire by its potential: darker is higher.' }) : null,
      p.tasks ? h('div', { class: 'note' }, [h('b', { text: 'Predict first, then check' }), h('ol', {}, p.tasks.map(function (t) { return h('li', { text: t }); }))]) : null
    ]);
    canvas.appendChild(cap);
    var body = h('div', { class: 'wrap' }, [h('div', { class: 'lab' }, [h('div', {}, [canvas, stateBox, h('p', { class: 'small muted', style: 'margin-top:8px', text: real ? 'Real meters: ammeters 0,10 Ω, voltmeters 10 MΩ.' : PR.IDEAL })]), h('div', {}, [ctrls, readBox])])]);
    main.appendChild(head); main.appendChild(body);

    function draw(r) {
      var out = D.render(spec, r, { grade: grade, view: view, ghosts: ghosts, pref: pref, imax: imax, vmax: vmax || 12, ideal: ideal, showPower: showPower, still: T != null || reduced, title: p.title });
      var old = canvas.querySelector('svg'); if (old) old.remove();
      canvas.insertAdjacentHTML('afterbegin', out.svg);
      fit(canvas.querySelector('svg'));
    }
    /* trim the drawing to its ink; the box only ever grows, so nothing jumps while the readings change */
    var box = null;
    function fit(svg) {
      try {
        var b = svg.getBBox(), m = 12, x0 = b.x - m, y0 = b.y - m, x1 = b.x + b.width + m, y1 = b.y + b.height + m;
        if (box) { x0 = Math.min(x0, box[0]); y0 = Math.min(y0, box[1]); x1 = Math.max(x1, box[2]); y1 = Math.max(y1, box[3]); }
        box = [x0, y0, x1, y1];
        svg.setAttribute('viewBox', [x0, y0, x1 - x0, y1 - y0].map(function (n) { return n.toFixed(1); }).join(' '));
      } catch (e) { /* not rendered yet */ }
    }
    function wordOf(a, b) {
      if (a == null || b == null) return 'STAYS THE SAME';
      var x = +F.round(a), y = +F.round(b);
      return y > x ? 'INCREASES' : y < x ? 'DECREASES' : 'STAYS THE SAME';
    }
    function meters() { return spec.parts.filter(function (q) { return (q.kind === 'ammeter' || q.kind === 'voltmeter') && !q.hidden; }); }
    function readings() {
      readBox.innerHTML = '';
      var rows = meters().map(function (q) {
        var now = res.read[q.id], g = ghosts[q.id], u = q.kind === 'ammeter' ? 'A' : 'V';
        return h('tr', {}, [h('td', { html: '<b>' + D.name(q.id).replace(/<tspan class="sub" dy="4">(.*?)<\/tspan><tspan dy="-4"><\/tspan>/, '<sub>$1</sub>') + '</b>' }),
          h('td', { class: 'n', text: F.meter(now) + ' ' + u }),
          h('td', { class: 'n before', text: g ? F.meter(g.v) + ' ' + u : '' }),
          h('td', {}, g ? [h('span', { class: 'word ' + g.word.replace(/ /g, ''), text: g.word })] : [])]);
      });
      spec.parts.filter(function (q) { return q.kind === 'battery'; }).forEach(function (q) {
        var b = res.battery[q.id];
        if (b && res.state === 'ok' && q.r > 0) rows.push(h('tr', {}, [h('td', { text: 'lost volts Ir' }), h('td', { class: 'n', text: F.num(b.lost) + ' V' }), h('td'), h('td')]));
      });
      readBox.appendChild(h('div', { class: 'card', style: 'margin-top:12px' }, [h('h3', { text: 'Readings' }),
        h('table', { class: 'readings' }, [h('thead', {}, [h('tr', {}, [h('th', { text: 'Meter' }), h('th', { text: 'Now' }), h('th', { text: 'Before' }), h('th', { text: 'Change' })])]), h('tbody', {}, rows)])]));
    }
    function states() {
      stateBox.innerHTML = '';
      var msg = null, f = res.flags || [];
      if (res.state === 'S0') msg = 'Short circuit: a path with no resistance joins the battery’s terminals. An ideal battery would push an unlimited current, so the model stops here. Open a switch or change the circuit.';
      else if (res.state === 'S5') msg = grade === 10 ? 'Two ideal batteries with different emfs are joined in parallel. This model cannot solve that. Remove one of them.' : 'Two ideal batteries with different emfs are joined in parallel. This model cannot solve that. Give one an internal resistance, or remove one.';
      else if (f.indexOf('S1') >= 0) msg = 'Short circuit: the only resistance left is r. I = emf/r, the terminal pd is 0 V and all the emf is lost inside the battery: P = I²r turns to heat.';
      else if (f.indexOf('S4') >= 0) msg = 'The voltmeter acts as a gap, so almost no current flows and it reads about the emf. Voltmeters go across a part.';
      else if (f.indexOf('S3') >= 0) msg = 'No current flows anywhere: the circuit is open. With no current there is no pd across any resistor, so a voltmeter across the gap reads the emf.';
      else if (f.indexOf('S2') >= 0) msg = 'No current flows through a bypassed part: a path of negligible resistance joins its ends, so there is no pd across it.';
      if (msg) stateBox.appendChild(h('div', { class: 'warnc', text: msg }));
    }

    /* one change: solve once, then every reading, glow and colour moves together over 600 ms (D1) */
    function change(mutate, why) {
      var before = res;
      mutate(spec);
      res = S.solve(spec, { real: real });
      ghosts = {};
      meters().forEach(function (q) { ghosts[q.id] = { v: before.read[q.id], word: wordOf(before.read[q.id], res.read[q.id]) }; });
      say.textContent = (why || 'Changed.') + ' ' + meters().map(function (q) { return q.id + ' ' + F.meter(res.read[q.id]) + ' ' + (q.kind === 'ammeter' ? 'A' : 'V') + ', ' + ghosts[q.id].word.toLowerCase(); }).join('; ');
      states(); readings(); controls();
      if (reduced || before.state !== 'ok' || res.state !== 'ok') { draw(res); return; }
      cap.classList.remove('off');
      clearTimeout(change._t); change._t = setTimeout(function () { cap.classList.add('off'); }, 3000);
      var t0 = performance.now();
      stopTween();
      (function frame(t) {
        var k = Math.min(1, (t - t0) / 600), e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
        if (k >= 1) { T = null; draw(res); return; }
        T = requestAnimationFrame(frame);
        draw(mix(before, res, e));
      })(t0);
    }
    function mix(a, b, e) {
      var m = { state: 'ok', net: b.net, V: b.V.map(function (v, i) { var x = a.V[i]; return x == null ? v : x + (v - x) * e; }), el: {}, read: {}, battery: b.battery, bypassed: b.bypassed, flags: b.flags };
      for (var k in b.el) { var x = a.el[k] || b.el[k], y = b.el[k]; m.el[k] = { v: y.v, i: (x.i || 0) + ((y.i || 0) - (x.i || 0)) * e, p: (x.p || 0) + ((y.p || 0) - (x.p || 0)) * e }; }
      for (k in b.read) { var r0 = a.read[k], r1 = b.read[k]; m.read[k] = r0 == null || r1 == null ? r1 : r0 + (r1 - r0) * e; }
      return m;
    }

    function controls() {
      ctrls.innerHTML = '';
      var sws = spec.parts.filter(function (q) { return q.kind === 'switch' && !q.hidden; });
      var rhs = spec.parts.filter(function (q) { return q.kind === 'rheostat'; });
      var bats = spec.parts.filter(function (q) { return q.kind === 'battery'; });
      ctrls.appendChild(h('h3', { text: 'Change one thing' }));
      if (sws.length) ctrls.appendChild(h('div', { class: 'grp row' }, sws.map(function (q) {
        var nm = q.label === 'wire' ? 'wire across ' + q.id : D.plainName(q.id);
        return h('button', { class: 'btn ghost swbtn' + (q.closed ? ' on' : ''), 'aria-pressed': String(!!q.closed), onclick: function () { toggle(q.id); },
          text: (q.closed ? 'Open ' : 'Close ') + nm });
      })));
      var hid = spec.parts.filter(function (q) { return q.hidden && q.kind === 'switch'; });
      hid.forEach(function (q) { ctrls.appendChild(h('div', { class: 'grp' }, [h('button', { class: 'btn ghost' + (q.closed ? ' on' : ''), onclick: function () { toggle(q.id); }, text: q.closed ? 'Put the ammeter back in series' : 'Move the ammeter into V1’s place' })])); });
      rhs.forEach(function (q) {
        var lab2 = h('output', { class: 'n', text: F.num(q.R, 1) + ' Ω' });
        var rng = h('input', { type: 'range', min: '0', max: String(q.Rmax || 10), step: '0.1', value: String(q.R), 'aria-label': 'Rheostat resistance' });
        rng.addEventListener('change', function () { var v = +rng.value; change(function (s) { s.parts.find(function (x) { return x.id === q.id; }).R = v; }, 'Rheostat set to ' + F.num(v, 1) + ' ohm.'); });
        rng.addEventListener('input', function () { lab2.textContent = F.num(+rng.value, 1) + ' Ω'; });
        ctrls.appendChild(h('div', { class: 'grp' }, [h('label', { class: 'small', text: 'Rheostat ' + q.id }), h('div', { class: 'slider' }, [
          h('button', { class: 'btn ghost small', 'aria-label': 'Decrease by 1 ohm', onclick: function () { step(q, -1); }, text: '−' }), rng,
          h('button', { class: 'btn ghost small', 'aria-label': 'Increase by 1 ohm', onclick: function () { step(q, 1); }, text: '+' })]), lab2]));
      });
      bats.forEach(function (q) {
        var e = h('input', { class: 'num', inputmode: 'decimal', value: F.num(q.emf, 2).replace(/,00$/, ''), 'aria-label': 'emf in volts' });
        var r = h('input', { class: 'num', inputmode: 'decimal', value: F.num(q.r, 2).replace(/,00$/, ''), 'aria-label': 'internal resistance in ohms' });
        var kids = [h('label', { class: 'small', text: 'emf (V) ' }), e];
        if (grade >= 11 && !ideal) kids.push(h('label', { class: 'small', text: ' r (Ω) ' }), r);
        kids.push(h('button', { class: 'btn ghost small', text: 'Set', onclick: function () {
          var E = F.parse(e.value), R = grade >= 11 && !ideal ? F.parse(r.value) : 0;
          if (!(E >= 0 && E <= 50) || !(R >= 0 && R <= 12)) { say.textContent = 'emf from 0 to 50 V and r from 0 to 12 ohm.'; e.focus(); return; }
          change(function (s) { var b = s.parts.find(function (x) { return x.id === q.id; }); b.emf = E; b.r = R; }, 'You changed the battery itself.');
          stateBox.insertBefore(h('div', { class: 'note small', text: 'You changed the battery itself. The emf and r change only when the battery changes.' }), stateBox.firstChild);
        } }));
        ctrls.appendChild(h('details', { class: 'grp' }, [h('summary', { text: 'Change the battery 🔒' }), h('div', { class: 'row', style: 'margin-top:8px' }, kids)]));
      });
      ctrls.appendChild(h('h3', { text: 'View' }));
      var vs = h('div', { class: 'seg grp', role: 'group', 'aria-label': 'View' }, [['circuit', 'Circuit'], ['potential', 'Potential']].map(function (v) {
        return h('button', { 'aria-pressed': String(view === v[0]), text: v[1], onclick: function () { view = v[0]; box = null; controls(); draw(res); } });
      }));
      ctrls.appendChild(vs);
      var extra = h('div', { class: 'row grp' }, [
        h('button', { class: 'btn ghost small' + (showPower ? ' on' : ''), 'aria-pressed': String(showPower), text: 'Show bulb power', onclick: function () { showPower = !showPower; box = null; controls(); draw(res); } }),
        grade === 12 ? h('button', { class: 'btn ghost small' + (real ? ' on' : ''), 'aria-pressed': String(real), text: real ? 'Real meters: on' : 'Real meters: off', onclick: function () { real = !real; change(function () {}, real ? 'Real meters on.' : 'Ideal meters.'); } }) : null,
        h('button', { class: 'btn ghost small', text: 'Reset', onclick: function () { route(); } })
      ]);
      ctrls.appendChild(extra);
      if (view === 'potential') ctrls.appendChild(h('p', { class: 'small muted', text: 'Every wire is shaded by its potential: darker is higher, 0 V at the battery’s negative terminal. A voltmeter reads the difference between the levels at its two ends.' }));
    }
    function toggle(id) {
      var q = spec.parts.find(function (x) { return x.id === id; });
      change(function () { q.closed = !q.closed; }, (q.closed ? 'Opened ' : 'Closed ') + id + '.');
    }
    function step(q, d) {
      var v = Math.max(0, Math.min(q.Rmax || 10, Math.round((q.R + d) * 10) / 10));
      change(function () { q.R = v; }, 'Rheostat set to ' + F.num(v, 1) + ' ohm.');
    }
    canvas.addEventListener('click', function (ev) {
      var g = ev.target.closest && ev.target.closest('.part'); if (!g) return;
      var q = spec.parts.find(function (x) { return x.id === g.dataset.id; }); if (!q) return;
      if (q.kind === 'switch') toggle(q.id);
      else if (q.kind === 'battery') { var d = ctrls.querySelector('details'); if (d) { d.open = true; d.querySelector('input').focus(); } }
      else if (q.kind === 'rheostat') { var rg = ctrls.querySelector('input[type=range]'); if (rg) rg.focus(); }
    });
    states(); readings(); controls(); draw(res);
  }

  /* ---------- shell ---------- */
  document.getElementById('gradeSeg').addEventListener('click', function (ev) {
    var b = ev.target.closest('button'); if (!b) return;
    setGrade(+b.dataset.g, true);
    var r = parseHash();
    delete r.params.g; delete r.params.gmin;
    var qs = Object.keys(r.params).map(function (k) { return k + '=' + encodeURIComponent(r.params[k]); }).join('&');
    var nh = '#' + r.view + (r.arg ? '/' + r.arg : '') + (qs ? '?' + qs : '');
    if (location.hash === nh) route(); else location.hash = nh;
  });
  /* a ?g= before the hash moves inside it, so a grade change never reloads the page */
  (function () {
    var m = location.search.match(/[?&]g=(1[0-2])/);
    if (m && !/[?&]g=/.test(location.hash)) {
      var hs = location.hash || '#home';
      history.replaceState(null, '', location.pathname + hs + (hs.indexOf('?') >= 0 ? '&' : '?') + 'g=' + m[1]);
    }
  })();
  window.addEventListener('hashchange', route);
  route();
})();
