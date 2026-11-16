/* Mr R Science "Watch": step-through lessons, shared by every subject that is not in its own studio player.
   First batch (16 Nov 2026): Grade 12 electrochemistry, Modules 27 to 29. Same lesson shape as circuits/learn.html.
   /watch/#<topic>?g=<grade> opens one lesson: data/index.json names the file for that topic and grade.
   Every word, number and figure comes from Mr R's coursebook. One screen at a time, one Next button. A stop ("Your turn") takes an answer before Next
   works: a number or a choice, with the book's reason after it. A worked example shows the memo a line at a time,
   and some lines ask the learner first. The last screen hands back to the app: sessionStorage mrr-done {t, k:'watch'}.
   Nothing is sent anywhere. Only the screen reached is kept on this device, so a learner can carry on. */
(function () {
  'use strict';
  var $ = function (s) { return document.querySelector(s); };
  var main = $('#main'), bot = $('#bot'), nextB = $('#next'), prevB = $('#prev'), bhint = $('#bhint');
  var m = /^#([a-z0-9-]+)?(?:\?(.*))?$/.exec(location.hash || '') || [];
  var id = m[1] || '';
  var params = new URLSearchParams(m[2] || location.search.slice(1));
  var grade = /^(1[0-2]|[7-9])$/.test(params.get('g') || '') ? params.get('g') : '12';
  var POS = 'watch-pos', IX = null;
  var L = null, i = 0, st = [];

  // ---------------------------------------------------------------- text
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
  function md(s) {
    return esc(s)
      .replace(/\*\*(.+?)\*\*/g, '<b>$1</b>')
      .replace(/(^|[\s(“])\*([^*\s][^*]*?)\*(?=[\s.,:;)”]|$)/g, '$1<i>$2</i>')
      .replace(/\^\{([^}]*)\}/g, '<sup>$1</sup>')
      .replace(/_\{([^}]*)\}/g, '<sub>$1</sub>');
  }
  function store(k, v) { try { if (v === undefined) return JSON.parse(localStorage.getItem(k) || 'null'); localStorage.setItem(k, JSON.stringify(v)); } catch (e) { return null; } }
  function ss(k, v) { try { if (v === undefined) return sessionStorage.getItem(k); sessionStorage.setItem(k, v); } catch (e) { return null; } }
  function returnUrl() {
    var to = ss('mrr-return');
    if (to && to.charAt(0) === '/' && to.indexOf('//') !== 0) return to;
    // on the site: the topic in the app; anywhere else (a preview copy): this page's lesson list
    return location.pathname.indexOf('/watch/') === 0 ? '/app/#t/' + grade + '/' + id : location.pathname + location.search;
  }

  // ---------------------------------------------------------------- numbers (decimal comma or point, spaces, units)
  function parseNum(s) {
    s = String(s).trim().replace(/^R\s*/i, '').replace(/[\s   ]/g, '').replace(/[−–]/g, '-');
    s = s.replace(/(Ω|ohms?|[a-zA-Z·⁻¹²/%]+)$/i, '');
    if ((s.match(/,/g) || []).length === 1 && s.indexOf('.') < 0) s = s.replace(',', '.');
    if (!/^-?(\d+\.?\d*|\.\d+)(e-?\d+)?$/i.test(s)) return NaN;
    return parseFloat(s);
  }
  function fmt(x) {
    var d = Math.abs(x) >= 100 && Math.round(x) === x ? 0 : 2;
    var s = Math.abs(x).toFixed(d).replace('.', ',');
    var p = s.split(','); p[0] = p[0].replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    return (x < 0 ? '−' : '') + p.join(',');
  }
  function judge(v, spec) {
    var a = spec.a, tol = Math.max(0.006, Math.abs(a) * 0.004);
    if (Math.abs(v - a) <= tol) return { ok: true };
    var tr = (spec.traps || []).filter(function (t) { return Math.abs(v - t[0]) <= Math.max(0.006, Math.abs(t[0]) * 0.01); })[0];
    if (tr) return { ok: false, msg: tr[1] };
    if (a !== 0 && Math.abs(v + a) <= tol) return { ok: false, msg: 'Check the sign.' };
    if (a !== 0 && Math.abs(v - a) <= Math.abs(a) * 0.03) return { ok: false, msg: 'Close. Check your rounding: keep the unrounded value in the calculator and give 2 decimal places.' };
    return { ok: false, msg: spec.hint || 'Not yet. Check each line of your working.' };
  }

  // ---------------------------------------------------------------- pieces
  function figHtml(svg, s, showA) {
    if (!svg) return '';
    var wide = s && s.wide, tall = s && s.tall;
    // keep the book's own size (mm) as a ceiling, so a small circuit is not blown up on a laptop
    var mm = /width="([\d.]+)mm"/.exec(svg), cap = mm && !wide ? ' style="max-width:' + Math.max(300, Math.round(parseFloat(mm[1]) * 5.2)) + 'px;margin-left:auto;margin-right:auto"' : '';
    return '<div class="fig' + (wide ? ' wide' : '') + (tall ? ' tall' : '') + (showA ? ' show-a' : '') + '"' + cap + '>' + svg + (wide ? '<p class="swipe">Swipe sideways to see the whole figure, or turn your phone.</p>' : '') + '</div>';
  }
  function rulesHtml(r) {
    if (!r || !r.length) return '';
    // a rule is "text" or ["text", colour]: the colour matches the figure's badge (oxidation/anode blue, reduction/cathode red)
    return '<ol class="rules">' + r.map(function (x, k) {
      var t = Array.isArray(x) ? x[0] : x, c = Array.isArray(x) && /^#[0-9a-f]{6}$/i.test(x[1] || '') ? x[1] : '';
      return '<li><span class="badge' + (c ? ' c" style="background:' + c : '') + '">' + (k + 1) + '</span><span>' + md(t) + '</span></li>';
    }).join('') + '</ol>';
  }
  // A stop: choices or a number. `box` is the element; `spec` has choices or num; done(right) is called once.
  function mountAsk(box, spec, done, state) {
    state = state || {};
    var html = '';
    if (spec.choices) {
      var short = spec.choices.every(function (c) { return c[0].length < 18; });
      html = '<div class="choices' + (short ? ' short' : '') + '">' + spec.choices.map(function (c, k) { return '<button type="button" data-k="' + k + '">' + md(c[0]) + '</button>'; }).join('') + '</div><div class="fbx" aria-live="polite"></div>';
      box.innerHTML = html;
      var fbx = box.querySelector('.fbx');
      box.querySelectorAll('.choices button').forEach(function (b) {
        b.onclick = function () {
          var c = spec.choices[+b.dataset.k];
          if (c[1]) {
            b.classList.add('right');
            box.querySelectorAll('.choices button').forEach(function (x) { x.disabled = true; });
            fbx.innerHTML = '<div class="fb ok"><b class="h">Yes.</b>' + md(c[2] || '') + '</div>';
            state.done = true; done(true);
          } else {
            b.classList.add('wrong'); b.disabled = true; state.tries = (state.tries || 0) + 1;
            fbx.innerHTML = '<div class="fb no"><b class="h">Not this one.</b>' + md(c[2] || '') + ' Try another.</div>';
          }
        };
      });
      if (state.done) { var r = spec.choices.findIndex(function (c) { return c[1]; }); var rb = box.querySelector('[data-k="' + r + '"]'); rb.classList.add('right'); box.querySelectorAll('.choices button').forEach(function (x) { x.disabled = true; }); fbx.innerHTML = '<div class="fb ok"><b class="h">Yes.</b>' + md(spec.choices[r][2] || '') + '</div>'; }
      return;
    }
    var n = spec.num;
    box.innerHTML = '<div class="numrow"><label>Your answer' + (n.unit ? ' (in ' + esc(n.unit) + ')' : '') + '. Work it on paper first.</label>' +
      '<input type="text" inputmode="decimal" autocomplete="off" enterkeyhint="done" aria-label="Your answer">' +
      '<span class="unit">' + esc(n.unit || '') + '</span><button class="btn" type="button">Check</button></div><div class="fbx" aria-live="polite"></div>';
    var inp = box.querySelector('input'), btn = box.querySelector('.btn'), fb = box.querySelector('.fbx');
    function shown(how) {
      inp.disabled = true; btn.disabled = true; btn.hidden = true;
      if (how === 'ok') fb.innerHTML = '<div class="fb ok"><b class="h">Yes: ' + fmt(n.a) + ' ' + esc(n.unit || '') + '.</b></div>';
      else fb.innerHTML = '<div class="fb show"><b class="h">The answer is ' + fmt(n.a) + ' ' + esc(n.unit || '') + '.</b>' + (n.hint ? md(n.hint) : '') + '</div>';
    }
    function check() {
      var v = parseNum(inp.value);
      if (isNaN(v)) { fb.innerHTML = '<div class="fb no">Type a number, for example 2,50.</div>'; inp.focus(); return; }
      var j = judge(v, n);
      if (j.ok) { inp.value = fmt(v); state.done = 'ok'; shown('ok'); done(true); return; }
      state.tries = (state.tries || 0) + 1;
      fb.innerHTML = '<div class="fb no"><b class="h">Not yet.</b>' + md(j.msg) + '<div class="act"><button class="btn ghost" type="button" data-show>Show me the answer</button></div></div>';
      fb.querySelector('[data-show]').onclick = function () { state.done = 'shown'; shown('shown'); done(false); };
      inp.select();
    }
    btn.onclick = check;
    inp.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); check(); } });
    if (state.done) shown(state.done);
    else setTimeout(function () { if (matchMedia('(pointer: fine)').matches) inp.focus({ preventScroll: true }); }, 50);
  }
  function whyHtml(w) {
    if (!w) return '';
    return '<div class="why"><b>Think: ' + md(w[0]) + '</b><div class="wa" hidden><p style="margin:6px 0 0">' + md(w[1]) + '</p></div><button class="btn ghost" type="button" data-why>Show the reason</button></div>';
  }
  function wireWhy() {
    var b = main.querySelector('[data-why]'); if (!b) return;
    b.onclick = function () { b.previousElementSibling.hidden = false; b.remove(); };
  }

  // ---------------------------------------------------------------- screens
  function setNext(label, enabled, hint) {
    nextB.textContent = label; nextB.disabled = !enabled; bhint.textContent = enabled ? '' : (hint || '');
    nextB.classList.toggle('glow', !!enabled && label.indexOf('Done') === 0);
  }
  function header(s, n) {
    var kind = s.t === 'ask' ? (s.kind === 'state' ? 'State it' : 'Your turn') : s.t === 'we' ? 'Worked example' : '';
    return '<p class="kick' + (s.t === 'ask' ? ' stop' : '') + '">Step ' + (n + 1) + ' of ' + L.screens.length + (kind ? ' · ' + kind : '') + '</p>';
  }
  function show(n) {
    i = n; var s = L.screens[n]; var S = st[n] = st[n] || {};
    store(POS, Object.assign(store(POS) || {}, (function () { var o = {}; o[id] = n; return o; })()));
    document.querySelectorAll('#dots i').forEach(function (d, k) { d.className = k <= n ? 'on' : ''; });
    prevB.style.visibility = n ? 'visible' : 'hidden';
    var h = header(s, n);
    if (s.t === 'read') {
      main.innerHTML = h + '<h2>' + md(s.h) + '</h2><div class="lead">' + s.p.map(function (p) { return '<p>' + md(p) + '</p>'; }).join('') + '</div>' + figHtml(s.fig, s) + rulesHtml(s.rules) +
        (n === 0 ? resumeHtml() + '<p class="note">From Mr R’s book: ' + esc(L.book) + '. Have paper, a pencil and a calculator ready.</p>' : '');
      wireResume();
      setNext(n < L.screens.length - 1 ? 'Next ›' : 'Done ›', true);
    } else if (s.t === 'ask') {
      var title = s.h === 'Your turn' || s.h === 'State it' ? '' : '<h2>' + md(s.h) + '</h2>';
      main.innerHTML = h + title + '<p class="q" style="font-size:18px">' + md(s.q) + '</p>' + figHtml(s.fig, s) + '<div id="ask"></div><div id="after"></div>';
      var after = function () { if (s.why) $('#after').innerHTML = '<div class="fb show">' + md(s.why) + '</div>'; setNext('Next ›', true); };
      mountAsk($('#ask'), s, function () { after(); }, S);
      if (S.done) after(); else setNext('Next ›', false, 'Answer first');
    } else if (s.t === 'we') {
      renderWE(s, S, h);
    } else if (s.t === 'end') {
      main.innerHTML = '<p class="kick">Step ' + (n + 1) + ' of ' + L.screens.length + '</p><h2>' + md(s.h) + '</h2><ul class="can">' + s.can.map(function (c) { return '<li>' + md(c) + '</li>'; }).join('') + '</ul>' +
        (s.paper && s.paper.length ? '<div class="paper"><h3>✎ On paper (muscle memory)</h3>' + s.paper.map(function (p) { return '<p>' + md(p) + '</p>'; }).join('') + '</div>' : '') +
        (s.p || []).map(function (p) { return '<p>' + md(p) + '</p>'; }).join('') +
        '<p>Next in this topic: <b>Train</b>, then <b>Check</b>.</p>' +
        '<p class="note">This lesson is ' + esc(L.book) + ' of Mr R’s coursebook, a step at a time.</p>';
      setNext('Done. Back to my topic ✓', true);
    }
    main.focus({ preventScroll: true }); window.scrollTo(0, 0);
  }

  function renderWE(s, S, h) {
    S.rev = S.rev || 0; S.asks = S.asks || {};
    var lines = s.lines, total = lines.length, all = S.rev >= total;
    var rows = '';
    for (var k = 0; k < S.rev; k++) {
      var l = lines[k];
      rows += '<div class="row"><span class="lab">' + md(l.l || '') + '</span><span class="x">' + md(l.x) + '</span><span class="tk">' + esc(l.tick || '') + '</span>' + (l.side ? '<span class="side">' + md(l.side) + '</span>' : '') + '</div>' +
        (l.fig ? '<div style="padding:0 14px">' + figHtml(l.fig, null, true) + '</div>' : '');
    }
    var waiting = !all && lines[S.rev].ask;
    if (waiting) rows += '<div class="row waiting"><span class="lab">' + md(lines[S.rev].l || '') + '</span><span class="x">Your turn…</span><span class="tk"></span></div>';
    if (!rows) rows = '<p class="empty">The memo appears here, a line at a time. Tap <b>Next line</b>.</p>';
    main.innerHTML = h + '<h2>' + md(s.h) + '</h2>' +
      '<details class="q"' + (S.rev === 0 || S.qopen ? ' open' : '') + '><summary>The question' + (s.marks ? ' (' + s.marks + ' marks)' : '') + '</summary>' + md(s.q) + '<span class="src">' + esc(s.src) + '</span></details>' +
      figHtml(s.fig, s, all) + '<div class="memo">' + rows + '</div><div id="ask"></div>' +
      (all ? (s.note ? '<p class="note">' + md(s.note) + '</p>' : '') + whyHtml(s.why) : '');
    var det = main.querySelector('details.q'); det.addEventListener('toggle', function () { S.qopen = det.open; });
    wireWhy();
    if (waiting) {
      var a = lines[S.rev].ask, box = $('#ask');
      box.className = 'askbox';
      box.innerHTML = '<p class="p">' + md(a.prompt) + '</p><div></div>';
      S.asks[S.rev] = S.asks[S.rev] || {};
      mountAsk(box.lastChild, a, function () { setNext('Show the line ›', true); }, S.asks[S.rev]);
      setNext('Show the line ›', !!S.asks[S.rev].done, 'Answer first');
      if (S.rev > 0) setTimeout(function () { box.scrollIntoView({ block: 'center', behavior: 'smooth' }); }, 60);
    } else if (!all) {
      setNext('Next line ›', true);
    } else {
      setNext('Next ›', true);
    }
    if (S.rev > 0 && !waiting) { var last = main.querySelectorAll('.memo .row'); if (last.length) setTimeout(function () { last[last.length - 1].scrollIntoView({ block: 'nearest', behavior: 'smooth' }); }, 60); }
  }

  function step() {
    var s = L.screens[i], S = st[i] || {};
    if (s.t === 'we' && (S.rev || 0) < s.lines.length) { S.rev = (S.rev || 0) + 1; renderWE(s, S, header(s, i)); return; }
    if (i < L.screens.length - 1) return show(i + 1);
    ss('mrr-done', JSON.stringify({ t: grade + '/' + id, k: 'watch' }));
    var pos = store(POS) || {}; delete pos[id]; store(POS, pos);
    location.href = returnUrl();
  }
  nextB.onclick = step;
  prevB.onclick = function () { if (i > 0) show(i - 1); };

  var resumeAt = 0;
  function resumeHtml() { return resumeAt > 0 ? '<p class="fb show" id="resume">You stopped at step ' + (resumeAt + 1) + '. <a href="#" data-resume>Carry on from there ›</a></p>' : ''; }
  function wireResume() { var a = main.querySelector('[data-resume]'); if (a) a.onclick = function (e) { e.preventDefault(); var n = resumeAt; resumeAt = 0; for (var k = 0; k < n; k++) { var s = L.screens[k]; st[k] = st[k] || {}; if (s.t === 'we') st[k].rev = s.lines.length; } show(n); }; }

  // ---------------------------------------------------------------- list (no topic) and start
  function list() {
    $('#ttl').textContent = 'Watch · all lessons';
    $('#close').href = returnUrl().replace(/#t\/.*$/, '');
    var groups = [];
    IX.forEach(function (x) { var k = x.subject + ' · Module ' + x.mod; if (groups.indexOf(k) < 0) groups.push(k); });
    main.innerHTML = '<h1>Watch lessons</h1><p>Each lesson is one part of Mr R’s coursebook, a step at a time. It stops so you can answer first. Have paper and a pencil ready.</p>' +
      groups.map(function (g) {
        return '<h2 style="margin-top:22px">' + esc(g) + '</h2><div class="list">' + IX.filter(function (x) { return x.subject + ' · Module ' + x.mod === g; }).map(function (x) {
          var gg = x.grades.indexOf(+grade) >= 0 ? grade : x.grades[0];
          return '<a href="#' + x.id + '?g=' + gg + '"><b>' + esc(x.sec) + ' ' + esc(x.title) + '</b><small>Grade ' + x.grades.join(' and ') + ' · about ' + x.minutes + ' minutes · ' + x.stops + ' stops to answer</small></a>';
        }).join('') + '</div>';
      }).join('');
  }
  function start() {
    fetch('data/index.json').then(function (r) { return r.json(); }).then(function (ix) {
      IX = ix;
      if (!id) return list();
      var hit = ix.filter(function (x) { return x.id === id && x.grades.indexOf(+grade) >= 0; })[0] || ix.filter(function (x) { return x.id === id; })[0];
      if (!hit) throw 0;
      return fetch('data/' + hit.file).then(function (r) { if (!r.ok) throw 0; return r.json(); }).then(function (data) {
        L = data;
        document.title = 'Watch · ' + L.title + ' · Mr R Science';
        $('#ttl').textContent = 'Watch · ' + L.title;
        $('#close').href = returnUrl();
        $('#dots').innerHTML = L.screens.map(function () { return '<i></i>'; }).join('');
        bot.hidden = false;
        var pos = store(POS) || {}; resumeAt = pos[id] > 0 && pos[id] < L.screens.length - 1 ? pos[id] : 0;
        show(0);
      });
    }).catch(function () { main.innerHTML = '<p class="note">This lesson could not load. Check your connection, or <a href="./">see all the lessons</a>.</p>'; });
  }
  window.addEventListener('hashchange', function () { location.reload(); });
  document.addEventListener('keydown', function (e) {
    if (!L || e.target.tagName === 'INPUT' || e.altKey || e.ctrlKey || e.metaKey) return;
    if (e.key === 'ArrowRight' && !nextB.disabled) step();
    if (e.key === 'ArrowLeft' && i > 0) show(i - 1);
  });
  start();
})();
