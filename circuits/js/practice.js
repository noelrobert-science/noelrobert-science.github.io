/* Circuits Studio: practice streams (studio_design.md §8). Items come from js/gens.js. Each calculation is set out
   as the memos do (§8.4): formula, substitution, answer with unit, one studio mark per line, follow-through from the
   learner's own earlier answers, a coherence check. The feedback ladder (§8.5) opens only after a first try:
   0 what is right + the first gap, 1 a quantity hint, 2 an equation hint, 3 the worked answer, 4 a fresh item.
   Everything is kept on this device only (localStorage circ-practice-v1). */
(function () {
  'use strict';
  var V = window.StudioViews = window.StudioViews || {};
  var Gx = window.Gens, S = window.CircuitSolver, D = window.Draw, F = window.Fmt;
  var KEY = 'circ-practice-v1';
  function load() { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; } }
  function save(d) { try { localStorage.setItem(KEY, JSON.stringify(d)); } catch (e) { /* private window */ } }
  function today(off) { var t = new Date(); t.setHours(12, 0, 0, 0); if (off) t.setDate(t.getDate() + off); return t.toISOString().slice(0, 10); }
  function log(entry) {
    var d = load(); d.log = d.log || []; entry.d = today(); d.log.push(entry);
    if (d.log.length > 800) d.log = d.log.slice(-800);
    save(d);
  }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function n2(x) { return F.num(x, 2); }
  function close(a, b) { return a != null && b != null && isFinite(a) && isFinite(b) && Math.abs(a - b) <= Math.max(0.011, Math.abs(b) * 0.011); }

  /* ---------- reading what the learner typed ---------- */
  function readNum(s) {
    var t = String(s == null ? '' : s).replace(/\s+/g, '').replace(/^R(?=[\d,.−-])/i, '').replace(/−/g, '-');
    if (!t) return { empty: true };
    if (/\d\/\d/.test(t)) return { frac: true };
    if ((t.match(/,/g) || []).length === 1 && t.indexOf('.') < 0) t = t.replace(',', '.');
    if (!/^-?\d*\.?\d+$/.test(t)) return { bad: true };
    var dp = (t.split('.')[1] || '').length;
    return { v: +t, dp: dp };
  }
  /* substitution line: numbers and + − × ÷ / ^ ² ( ); anything left of the last = is the learner's label */
  function evalExpr(src) {
    var s = String(src || '');
    if (s.indexOf('=') >= 0) s = s.slice(s.lastIndexOf('=') + 1);
    s = s.replace(/\s+/g, '').replace(/[×x·∙]/g, '*').replace(/÷/g, '/').replace(/[−–]/g, '-').replace(/²/g, '^2').replace(/³/g, '^3').replace(/⁻¹/g, '^-1');
    s = s.replace(/(\d),(\d)/g, '$1.$2');
    if (!s || /[^0-9.+\-*/^()]/.test(s)) return null;
    var i = 0;
    function peek() { return s[i]; }
    function num() { var m = s.slice(i).match(/^\d*\.?\d+/); if (!m) throw 0; i += m[0].length; return +m[0]; }
    function primary() { if (peek() === '(') { i++; var v = expr(); if (peek() !== ')') throw 0; i++; return v; } return num(); }
    function unary() { if (peek() === '-') { i++; return -unary(); } if (peek() === '+') { i++; return unary(); } return power(); }
    function power() { var b = primary(); if (peek() === '^') { i++; var e = unary(); return Math.pow(b, e); } return b; }
    function term() {
      var v = unary();
      for (;;) {
        var c = peek();
        if (c === '*') { i++; v *= unary(); } else if (c === '/') { i++; v /= unary(); }
        else if (c === '(' || (c && /[0-9.]/.test(c) && s[i - 1] === ')')) v *= unary();
        else return v;
      }
    }
    function expr() { var v = term(); for (;;) { var c = peek(); if (c === '+') { i++; v += term(); } else if (c === '-') { i++; v -= term(); } else return v; } }
    try { var v = expr(); return i === s.length && isFinite(v) ? v : null; } catch (e) { return null; }
  }

  var UNITS = ['A', 'V', 'Ω', 'W', 'J', 'C', 'kWh', 'R', 's'];
  var UNIT_NAME = { R: 'R (rand)' };
  var MUSEUM = { X3: 'the open switch reads zero', X5: 'unmatched values', X9: 'minutes not changed to seconds', X10: 'kW/h and watts not changed to kW', X13: 'the pd split by a guess' };

  /* ---------- the circuit picture ---------- */
  function picture(it, g) {
    if (!it.spec) return null;
    var spec = JSON.parse(JSON.stringify(it.spec)), o = { grade: g, hide: it.hide || {}, still: true, title: it.title };
    (it.hideR || []).forEach(function (id) { if (id === 'B') o.hideR = true; else spec.parts.forEach(function (p) { if (p.id === id) p.secret = true; }); });
    if (it.hideEmf) o.hideEmf = true;
    var res = S.solve(spec, {}), out = D.render(spec, res, o);
    var wrap = document.createElement('div'); wrap.className = 'canvas pcanvas'; wrap.innerHTML = out.svg;
    requestAnimationFrame(function () {
      var svg = wrap.querySelector('svg'); if (!svg) return;
      try { var bb = svg.getBBox(), m = 12; svg.setAttribute('viewBox', [bb.x - m, bb.y - m, bb.width + 2 * m, bb.height + 2 * m].map(function (v) { return v.toFixed(1); }).join(' ')); } catch (e) { /* hidden */ }
    });
    return wrap;
  }

  /* ---------- one item on screen. mode 'practice' (ladder) or 'check' (help closed until submitted) ---------- */
  function mountItem(host, it, ctx, opts) {
    opts = opts || {};
    var h = ctx.h, g = it.g, mode = opts.mode || 'practice', L = 'abcdefgh';
    var box = h('div', { class: 'card pitem' });
    host.appendChild(box);
    box.appendChild(h('p', { class: 'stem', text: it.stem }));
    var pic = picture(it, g); if (pic) box.appendChild(pic);
    var forms = Gx.formsFor(g), state = it.parts.map(function () { return {}; }), wrong = 0, rung = -1, done = false;
    var ex = Gx.exact(it);

    it.parts.forEach(function (p, k) {
      var st = state[k], pb = h('div', { class: 'ppart' });
      var marks = p.kind === 'calc' ? (p.forms.length ? 3 : 1) : p.kind === 'mcq' ? 2 : 1;
      st.marks = marks;
      pb.appendChild(h('p', { class: 'ask', html: '<b>(' + L[k] + ')</b> ' + esc(p.ask) + ' <span class="muted">[' + marks + ']</span>' }));
      if (p.kind === 'calc') {
        if (p.forms.length) {
          var sel = h('select', { 'aria-label': 'Formula for (' + L[k] + ')' }, [h('option', { value: '', text: 'Choose the formula you start from' })].concat(forms.map(function (f) { return h('option', { value: f.id, text: Gx.formText(f, g) }); })));
          var sub = h('input', { type: 'text', class: 'subs', autocomplete: 'off', spellcheck: 'false', 'aria-label': 'Substitution for (' + L[k] + ')', placeholder: 'numbers into the formula, e.g. 12/(4 + 4)' });
          pb.appendChild(h('div', { class: 'wk' }, [h('label', { class: 'small b', text: 'Formula' }), sel, h('label', { class: 'small b', text: 'Substitution' }), sub]));
          st.sel = sel; st.sub = sub;
        }
        var ans = h('input', { type: 'text', inputmode: 'decimal', class: 'ansn', autocomplete: 'off', 'aria-label': 'Answer for (' + L[k] + ')' });
        var un = h('select', { class: 'unit', 'aria-label': 'Unit for (' + L[k] + ')' }, [h('option', { value: '', text: 'unit' })].concat(UNITS.map(function (x) { return h('option', { value: x, text: UNIT_NAME[x] || x }); })));
        pb.appendChild(h('div', { class: 'wk' }, [h('label', { class: 'small b', text: 'Answer' }), h('div', { class: 'row ansrow' }, [ans, un])]));
        st.ans = ans; st.unit = un;
      } else if (p.kind === 'mcq') {
        var order = p.opts.map(function (o, i) { return i; }).sort(function (a, b) { return ((a * 7 + it.seed) % 5) - ((b * 7 + it.seed) % 5); });
        var grp = h('div', { class: 'mcq', role: 'group', 'aria-label': 'Options for (' + L[k] + ')' });
        order.forEach(function (i, j) {
          grp.appendChild(h('button', { class: 'tile', 'aria-pressed': 'false', html: '<b>' + 'ABCD'[j] + '</b> ' + esc(p.opts[i].t), onclick: function (e) {
            if (st.locked) return; st.pick = i; Array.prototype.forEach.call(grp.querySelectorAll('button'), function (x) { x.setAttribute('aria-pressed', String(x === e.currentTarget)); });
          } }));
        });
        pb.appendChild(grp); st.grp = grp;
      }
      st.fb = h('div', { class: 'pfb' }); pb.appendChild(st.fb);
      st.box = pb; box.appendChild(pb);
    });
    if (mode === 'practice') box.appendChild(h('p', { class: 'small muted', text: 'Studio marks: one for the formula with its substitution, one for the substitution, one for the answer with its unit. The memos rarely print the split.' }));

    var bar = h('div', { class: 'row', style: 'margin-top:10px' }), msg = h('div', {});
    box.appendChild(bar); box.appendChild(msg);

    /* mark one part; v = the learner's numbers so far (for follow-through) */
    function markPart(p, st, v) {
      var r = { got: 0, of: st.marks, notes: [], right: false, trap: null };
      if (p.kind === 'mcq') {
        r.right = st.pick != null && p.opts[st.pick].ok; r.got = r.right ? 2 : 0; r.answered = st.pick != null;
        if (st.pick != null && !r.right) r.trap = { msg: p.opts[st.pick].why };
        return r;
      }
      var a = readNum(st.ans.value), unit = st.unit.value, exp = ex[p.key], ft = p.f(v);
      r.answered = !a.empty;
      if (a.frac) r.notes.push('Write the answer as a decimal.');
      if (a.bad) r.notes.push('Type the answer as a number, for example 1,50.');
      var val = a.v, valOk = val != null && (close(val, exp) || close(val, ft));
      if (val != null) v[p.key] = val;
      var unitOk = unit === p.unit;
      if (valOk && !unitOk) r.notes.push(unit ? 'The unit is ' + (UNIT_NAME[p.unit] || p.unit) + ', not ' + unit + '.' : 'Give the unit: ' + (UNIT_NAME[p.unit] || p.unit) + '.');
      if (valOk && a.dp > 2) r.notes.push('Round the final answer to 2 decimal places.');
      if (!valOk && val != null) p.traps.some(function (t) { if (close(val, t.v)) { r.trap = t; return true; } return false; });
      var ansMark = valOk && unitOk;
      if (p.forms.length) {
        var sv = st.sub.value.trim() ? evalExpr(st.sub.value) : null, fid = st.sel.value, fm = Gx.FORM.filter(function (f) { return f.id === fid; })[0];
        var subsOk = sv != null && (close(sv, exp) || close(sv, ft) || p.inter.some(function (x) { return close(sv, x); }));
        var formOk = !!fm && p.forms.indexOf(fm.grp) >= 0;
        if (st.sub.value.trim() && sv == null) r.notes.push('Put numbers into the substitution line, not symbols: for example 12/(4 + 4).');
        if (fid && !formOk) r.notes.push('That formula does not lead to this answer: ' + Gx.formText(fm, it.g) + '.');
        if (!fid && st.sub.value.trim()) r.notes.push('Start with the formula: “It is best practice to begin each calculation with an appropriate formula” (IEB Examiners’ Report 2024).');
        if (sv != null && val != null && !close(sv, val) && !(p.inter.some(function (x) { return close(sv, x); }) && valOk)) r.notes.push('Every line must be true: your substitution gives ' + n2(sv) + ', but your answer says ' + n2(val) + '.');
        if (!subsOk && sv != null && !r.trap) p.traps.some(function (t) { if (close(sv, t.v)) { r.trap = t; return true; } return false; });
        r.got = (formOk && subsOk ? 1 : 0) + (subsOk ? 1 : 0) + (ansMark ? 1 : 0);
      } else r.got = ansMark ? 1 : 0;
      r.right = ansMark;
      r.exp = exp;
      return r;
    }
    function markAll() { var v = {}; return it.parts.map(function (p, k) { return markPart(p, state[k], v); }); }
    function partName(p, k) { return '(' + L[k] + ')'; }
    function showPart(k, r, final) {
      var st = state[k], p = it.parts[k];
      st.box.classList.toggle('pok', r.right); st.box.classList.toggle('pbad', !r.right && (final || r.answered));
      st.fb.innerHTML = '';
      var lines = r.notes.slice();
      if (r.trap && (mode === 'practice' || final)) lines.unshift(r.trap.msg + (r.trap.mus && MUSEUM[r.trap.mus] ? ' (Mistake museum: ' + MUSEUM[r.trap.mus] + '.)' : ''));
      if (lines.length) st.fb.appendChild(h('ul', { class: 'small' }, lines.map(function (x) { return h('li', { text: x }); })));
      if (p.kind === 'calc' && (r.got || final) && p.forms.length) st.fb.appendChild(h('p', { class: 'small muted', text: 'Studio marks: ' + r.got + '/' + r.of + '.' }));
    }
    function lock() { state.forEach(function (st) { st.locked = true; [st.sel, st.sub, st.ans, st.unit].forEach(function (x) { if (x) x.disabled = true; }); if (st.grp) Array.prototype.forEach.call(st.grp.querySelectorAll('button'), function (b) { b.disabled = true; }); }); }
    function worked() {
      var w = h('div', { class: 'card inner worked' }, [h('h3', { text: 'The worked answer' })]);
      it.parts.forEach(function (p, k) {
        w.appendChild(h('p', { class: 'b', text: '(' + L[k] + ')' }));
        if (p.kind === 'mcq') { var ok = p.opts.filter(function (o) { return o.ok; })[0]; w.appendChild(h('p', { text: ok.t + '. ' + (p.why || '') })); }
        else w.appendChild(h('ol', { class: 'wlines' }, (p.work || [n2(ex[p.key]) + ' ' + p.unit]).map(function (l) { return h('li', { text: l + ' ✓' }); })));
      });
      return w;
    }

    /* ---------- practice: the ladder ---------- */
    function submit() {
      var res = markAll();
      if (!res.some(function (r) { return r.answered; }) && !opts.allowBlank) { msg.innerHTML = ''; msg.appendChild(h('div', { class: 'warnc', text: 'Try it first. If you do not know where to start, tap “I don’t know where to start”.' })); return; }
      res.forEach(function (r, k) { showPart(k, r, false); });
      var all = res.every(function (r) { return r.right; });
      if (all) { finish(true, res); return; }
      wrong++; ladder(Math.min(wrong - 1, 3), res);
    }
    function ladder(to, res) {
      rung = Math.max(rung, to); msg.innerHTML = '';
      res = res || markAll();
      var firstBad = res.map(function (r, k) { return r.right ? -1 : k; }).filter(function (k) { return k >= 0; })[0];
      var p = it.parts[firstBad], r = res[firstBad];
      var c = h('div', { class: 'warnc ladder' });
      if (rung >= 0) {
        var rights = res.map(function (x, k) { return x.right ? partName(it.parts[k], k) + (it.parts[k].kind === 'calc' ? ' ' + n2(ex[it.parts[k].key]) + ' ' + it.parts[k].unit : '') : null; }).filter(Boolean);
        c.appendChild(h('p', {}, [h('b', { text: 'Right: ' }), document.createTextNode(rights.length ? rights.join('; ') + '.' : 'nothing yet, and that is fine.')]));
        c.appendChild(h('p', {}, [h('b', { text: 'First gap, ' + partName(p, firstBad) + ': ' }), document.createTextNode(r.trap ? r.trap.msg : r.notes[0] || (p.kind === 'mcq' ? 'That option is not right.' : 'Check the value and its unit.'))]));
        c.appendChild(h('p', {}, [h('b', { text: 'Next: ' }), document.createTextNode(r.trap ? 'fix that, then try again.' : 'look at ' + partName(p, firstBad) + ' again, then try again.')]));
      }
      if (rung >= 1 && p.hint1) c.appendChild(h('p', {}, [h('b', { text: 'Look at this: ' }), document.createTextNode(p.hint1)]));
      if (rung >= 2 && p.hint2) c.appendChild(h('p', {}, [h('b', { text: 'The equation: ' }), document.createTextNode(p.hint2)]));
      msg.appendChild(c);
      if (rung >= 3) {
        lock(); msg.appendChild(worked());
        var q = h('div', { class: 'card inner' }, [h('p', { class: 'b', text: 'Which line was different in yours?' })]);
        var lines = []; it.parts.forEach(function (pp, k) { if (pp.kind === 'calc') (pp.work || []).forEach(function (l) { lines.push('(' + L[k] + ') ' + l); }); else lines.push('(' + L[k] + ') the option'); });
        q.appendChild(h('div', { class: 'tiles' }, lines.concat(['None: I made a slip in the arithmetic']).map(function (l) { return h('button', { class: 'tile', text: l, onclick: function () { log({ g: g, topic: it.topic, gen: it.gen, src: 'help', ok: false, rung: 3, diff: l.slice(0, 40) }); finish(false, res, true); } }); })));
        msg.appendChild(q);
        bar.innerHTML = '';
        return;
      }
      bar.innerHTML = '';
      bar.appendChild(h('button', { class: 'btn', text: 'Try again', onclick: submit }));
      if (rung < 2) bar.appendChild(h('button', { class: 'btn ghost', text: 'I’m stuck', onclick: function () { ladder(rung + 1); } }));
      bar.appendChild(h('button', { class: 'btn ghost', text: 'Show me', onclick: function () { ladder(3); } }));
    }
    function finish(ok, res, shown) {
      if (done) return; done = true; lock(); bar.innerHTML = '';
      if (ok) {
        var got = res.reduce(function (s, r) { return s + r.got; }, 0), of = res.reduce(function (s, r) { return s + r.of; }, 0);
        msg.innerHTML = '';
        msg.appendChild(h('div', { class: 'okc' }, [h('b', { text: 'All right. ' }), document.createTextNode(got < of ? 'Studio marks ' + got + '/' + of + ': write the formula and the substitution too, as in the paper.' : 'Studio marks ' + got + '/' + of + '.')]));
        log({ g: g, topic: it.topic, gen: it.gen, src: 'help', ok: wrong === 0, rung: rung });
      } else if (!shown) log({ g: g, topic: it.topic, gen: it.gen, src: 'help', ok: false, rung: rung });
      if (opts.onDone) opts.onDone(ok && wrong === 0, rung);
    }
    if (mode === 'practice') {
      bar.appendChild(h('button', { class: 'btn', text: 'Check', onclick: submit }));
      bar.appendChild(h('button', { class: 'btn ghost', text: 'I don’t know where to start', onclick: function () { wrong++; ladder(1); } }));
    }
    return {
      /* check mode: mark, show the marks and the worked answer; no ladder */
      score: function () {
        var res = markAll(); lock();
        res.forEach(function (r, k) { showPart(k, r, true); });
        msg.innerHTML = ''; msg.appendChild(worked());
        return { got: res.reduce(function (s, r) { return s + r.got; }, 0), of: res.reduce(function (s, r) { return s + r.of; }, 0), answered: res.some(function (r) { return r.answered; }) };
      },
      box: box
    };
  }

  /* ---------- the practice stream: #practise/<T1…T11>?type=&star= ---------- */
  var BOOK = { 10: { T1: '10.1', T2: '10.3', T3: '10.4', T4: '10.7', T5: '10.7', T6: '10.5', T7: null, T8: null, T9: '10.6', T10: '10.3', T11: '10.3' },
    11: { T1: '10.1', T2: '10.2', T3: '10.3', T4: '10.4', T5: '10.5', T6: '11.1', T7: '11.2', T8: '11.3', T9: '11.5', T10: '11.4', T11: '11.4' } };
  var CHECK_OF = { T1: 'current', T2: 'ohm', T3: 'series-parallel', T4: 'power', T5: 'kwh', T6: 'networks', T7: 'emf-r', T8: 'with-r', T9: 'explain', T10: 'graph-r', T11: 'graph-r' };
  function bookOf(t, g) { return (BOOK[g === 10 ? 10 : 11] || {})[t]; }

  V.practise = function (arg, params, ctx) {
    var h = ctx.h, main = ctx.main, g = ctx.grade(), t = (arg || 'T3').toUpperCase();
    if (t === 'T9') { location.replace('#explain' + (params.g ? '?g=' + params.g : '')); return; }
    var all = (g === 10 && (t === 'T7' || t === 'T8')) ? [] : (Gx.STREAMS[t] || []).filter(function (id) { return Gx.GEN[id].grades.indexOf(g) >= 0; });
    var d = load(), star = +(params.star || (d.star && d.star[t]) || 1), type = params.type && Gx.TYPE[params.type] !== undefined ? Gx.TYPE[params.type] : params.type;
    if (type && all.indexOf(type) < 0) type = null;
    document.title = 'Practise: ' + Gx.TOPIC_NAME[t] + ' · Circuits Studio';
    var bk = bookOf(t, g);
    var head = h('div', { class: 'wrap' }, [
      h('div', { class: 'row' }, [h('a', { class: 'chip', href: '#practise', text: '← Practise' }), bk ? h('span', { class: 'chip', text: 'Book ' + bk }) : null]),
      h('h1', { text: 'Practise: ' + Gx.TOPIC_NAME[t], style: 'margin-top:10px' })
    ]);
    main.appendChild(head);
    if (!all.length) {
      head.appendChild(h('div', { class: 'card' }, [h('p', { text: g === 10 ? 'This topic is for Grades 11 and 12: the Grade 10 battery is ideal.' : 'Practice for this topic is coming soon.' }),
        h('a', { class: 'btn ghost', href: '#practise', text: 'All practice topics' })]));
      return;
    }
    if (t === 'T10') head.appendChild(h('div', { class: 'card' }, [h('p', { text: 'Plot and read graphs in the graph tool. The questions below are about the units and meaning of a gradient.' }),
      h('div', { class: 'row' }, [h('a', { class: 'btn ghost', href: '#graph/ohm', text: 'Graph tool: Ohm’s law' }), g >= 11 ? h('a', { class: 'btn ghost', href: '#graph/vi-term', text: 'Graph tool: terminal pd' }) : null])]));
    var stars = h('div', { class: 'seg', role: 'group', 'aria-label': 'Level' }, [1, 2, 3].map(function (s) {
      return h('button', { 'aria-pressed': String(s === star), text: '★★★'.slice(0, s), title: ['One step', 'Two or three steps', 'An exam-level twist'][s - 1], onclick: function () { var dd = load(); dd.star = dd.star || {}; dd.star[t] = s; save(dd); star = s; Array.prototype.forEach.call(stars.querySelectorAll('button'), function (b, i) { b.setAttribute('aria-pressed', String(i + 1 === s)); }); next(); } });
    }));
    var types = all.length > 1 ? h('div', { class: 'tiles' }, [null].concat(all).map(function (id) {
      return h('button', { class: 'tile' + ((type || null) === id ? ' on' : ''), 'aria-pressed': String((type || null) === id), text: id ? Gx.GEN[id].title : 'Mixed', onclick: function (e) { type = id; Array.prototype.forEach.call(types.querySelectorAll('button'), function (b) { b.classList.remove('on'); b.setAttribute('aria-pressed', 'false'); }); e.currentTarget.classList.add('on'); e.currentTarget.setAttribute('aria-pressed', 'true'); next(); } });
    })) : null;
    var kind = types ? h('details', { class: 'kinds' }, [h('summary', { class: 'small b', text: 'Kind of question: ' + (type ? Gx.GEN[type].title : 'Mixed') }), types]) : null;
    if (kind) types.addEventListener('click', function () { kind.open = false; kind.querySelector('summary').textContent = 'Kind of question: ' + (type ? Gx.GEN[type].title : 'Mixed'); });
    head.appendChild(h('div', { class: 'card' }, [h('div', { class: 'row' }, [h('span', { class: 'small b', text: 'Level' }), stars]), kind]));
    var area = h('div', { class: 'wrap' }), nextBar = h('div', { class: 'wrap' });
    main.appendChild(area); main.appendChild(nextBar);
    var clean = 0, lowRun = 0, count = 0;
    function next() {
      area.innerHTML = '';
      var pool = type ? [type] : all, id = pool[Math.floor(Math.random() * pool.length)], seed = Math.floor(Math.random() * 1e9);
      var it = Gx.make(id, seed, g, star);
      window.__item = it;   /* for the browser tests */
      count++;
      area.appendChild(h('div', { class: 'row' }, [h('span', { class: 'chip', text: it.title }), h('span', { class: 'chip', text: '★★★'.slice(0, it.star) })]));
      mountItem(area, it, ctx, { mode: 'practice', onDone: function (ok, rung) {
        clean = ok ? clean + 1 : 0; lowRun = ok || rung < 1 ? 0 : lowRun + 1;
        var row = h('div', { class: 'row', style: 'margin-top:12px' }, [h('button', { class: 'btn', text: 'A fresh one', onclick: function () { next(); window.scrollTo(0, 0); } })]);
        area.appendChild(row);
        if (lowRun >= 5 && star > 1) area.appendChild(h('p', { class: 'small', text: 'These are hard just now. Try one star lower, then come back up.' }));
        nextBar.innerHTML = '';
        if (clean >= 2) nextBar.appendChild(h('a', { class: 'btn nextbar', href: '#check/' + CHECK_OF[t], text: 'Now check this: Check it on my own ›' }));
      } });
    }
    next();
  };

  /* the list of practice topics: #practise */
  var prevPr = V.practise;
  V.practise = function (arg, params, ctx) {
    if (arg) return prevPr(arg, params, ctx);
    var h = ctx.h, g = ctx.grade();
    ctx.main.appendChild(h('div', { class: 'wrap' }, [h('h1', { text: 'Practise' }),
      h('p', { text: 'Fresh questions every time, set out as in the paper. Hints open after you try; the worked answer is its own step, then a fresh question.' }),
      h('div', { class: 'grid' }, Object.keys(Gx.TOPIC_NAME).filter(function (t) {
        if (g === 10 && (t === 'T7' || t === 'T8')) return false;
        return t === 'T9' || (Gx.STREAMS[t] || []).some(function (id) { return Gx.GEN[id].grades.indexOf(g) >= 0; });
      }).map(function (t) {
        var bk = bookOf(t, g);
        return h('a', { class: 'card pcard', href: '#practise/' + t }, [h('h3', { text: Gx.TOPIC_NAME[t] }), h('p', { class: 'small muted', text: (bk ? 'Book ' + bk + ' · ' : '') + (t === 'T9' ? 'Explain a change' : (Gx.STREAMS[t] || []).filter(function (id) { return Gx.GEN[id].grades.indexOf(g) >= 0; }).length + ' kinds of question') })]);
      }))]));
  };

  window.Practice = { mountItem: mountItem, readNum: readNum, evalExpr: evalExpr, load: load, save: save, log: log, today: today, CHECK_OF: CHECK_OF, bookOf: bookOf, close: close };
})();
