/* Circuits Studio: Check independently and Return later (studio_design.md §9.1, §9.3).
   #check/<topic>: 3 fresh items, help off, Sure or Unsure on each, marks only after submitting. 2 of 3 or more books
   come-back checks 2 and 7 days later (the gym's rule); below that nothing is booked and the learner goes back to Train.
   #check/<topic>?full=1: 8 items. #later: the come-back checks due today, one topic at a time, and the record table.
   #check/daily: 5 mixed items from topics already checked; logged as after a delay; changes no schedule.
   Device only: nothing is sent anywhere. */
(function () {
  'use strict';
  var V = window.StudioViews = window.StudioViews || {};
  var Gx = window.Gens, P = window.Practice, Ch = window.Chain, CC = window.ChainCards, D = window.Draw;

  /* topics (§16 table): practice generators for each slot, the explain cards (§9.1), book sections, train route */
  var TOP = {
    current: { name: 'Current, potential difference and emf', calc: ['charge', 'energy-q'], mcq: ['charge', 'energy-q'], cards: ['E3-Vs'], book: { 10: '10.1', 11: '10.1' }, train: 'T1' },
    meters: { name: 'Circuit diagrams and meters', grades: [10], calc: ['openV', 'series'], mcq: ['identical'], cards: ['E6c'], book: { 10: '10.2' }, train: 'T3?type=openV' },
    ohm: { name: 'Ohm’s law', calc: ['ohm'], mcq: ['unit', 'ohm'], cards: [], book: { 10: '10.3', 11: '10.2' }, train: 'T2' },
    'series-parallel': { name: 'Series and parallel', calc: ['series', 'parallel', 'combo'], mcq: ['mcq', 'identical'], cards: ['C-L1', 'D-XY'], book: { 10: '10.4', 11: '10.3' }, train: 'T3' },
    combos: { name: 'Combinations', grades: [10], calc: ['combo', 'chainback', 'share'], mcq: ['mcq'], cards: ['E1-A1-10', 'E2-V2-10', 'E4-A1-10', 'E4-bulb-10'], book: { 10: '10.5' }, train: 'T3?type=chain' },
    explain: { name: 'Explaining a change', calc: ['combo', 'emf-r'], mcq: ['identical', 'mcq'], cards: '*', book: { 10: '10.6', 11: '11.5' }, train: 'T9' },
    power: { name: 'Power and energy', calc: ['power', 'energy'], mcq: ['rating'], cards: ['E8-bulb', 'E-bulb', 'E6a-bulb'], book: { 10: '10.7', 11: '10.4' }, train: 'T4' },
    kwh: { name: 'kWh and cost', grades: [11, 12], calc: ['cost'], mcq: ['rating', 'cost'], cards: [], book: { 11: '10.5' }, train: 'T5' },
    networks: { name: 'Networks', grades: [11, 12], calc: ['network', 'chainback'], mcq: ['mcq'], cards: ['E5-A1', 'E5-R3', 'E5b-V3'], book: { 11: '11.1' }, train: 'T6' },
    'emf-r': { name: 'emf and internal resistance', grades: [11, 12], calc: ['emf-r', 'lostvolts'], mcq: ['emf-r', 'openV'], cards: ['E3-V1', 'E3b-V1', 'E7-V1', 'E7b-V1'], book: { 11: '11.2' }, train: 'T7' },
    'with-r': { name: 'Solving circuits with r', grades: [11, 12], calc: ['solve-r', 'twostate', 'network'], calc12: ['simul'], mcq: ['solve-r', 'emf-r'], cards: ['E1-V1', 'E2-V1', 'E4-8', 'B-lamps'], book: { 11: '11.3' }, train: 'T8' },
    'graph-r': { name: 'The terminal pd graph', grades: [11, 12], calc: ['lostvolts'], calc12: ['simul'], mcq: ['unit'], cards: [], book: { 11: '11.4' }, train: 'T10' }
  };
  var ORDER = { 10: ['current', 'meters', 'ohm', 'series-parallel', 'combos', 'explain', 'power'], 11: ['current', 'ohm', 'series-parallel', 'power', 'kwh', 'networks', 'emf-r', 'with-r', 'graph-r', 'explain'] };
  function order(g) { return ORDER[g === 10 ? 10 : 11]; }
  function served(t, g) { return TOP[t] && (!TOP[t].grades || TOP[t].grades.indexOf(g) >= 0); }
  function book(t, g) { return TOP[t].book[g === 10 ? 10 : 11]; }
  function rnd(a) { return a[Math.floor(Math.random() * a.length)]; }
  function seed() { return Math.floor(Math.random() * 1e9); }
  function fresh(list, g) { return list.filter(function (id) { return Gx.GEN[id] && Gx.GEN[id].grades.indexOf(g) >= 0; }); }

  /* ---------- building the slots ---------- */
  function calcItem(t, g, star) {
    var T = TOP[t], ids = fresh(T.calc.concat(g === 12 ? T.calc12 || [] : []), g);
    for (var k = 0; k < 20; k++) {
      var it = Gx.make(rnd(ids), seed(), g, star || 2);
      if (it.parts.some(function (p) { return p.kind === 'calc' && p.forms.length; })) return it;
    }
    return Gx.make(ids[0], seed(), g, star || 2);
  }
  /* an MCQ: a generator's own, or one made from a calculation's traps (each wrong option is a named slip) */
  function mcqItem(t, g) {
    var ids = fresh(TOP[t].mcq, g);
    for (var k = 0; k < 30; k++) {
      var it = Gx.make(rnd(ids), seed(), g, 2 + (k % 2));
      var m = it.parts.filter(function (p) { return p.kind === 'mcq'; })[0];
      if (m) { it.parts = [m]; return it; }
      var ex = Gx.exact(it), c = it.parts.filter(function (p) { return p.kind === 'calc' && p.traps.length >= 2; })[0];
      if (!c) continue;
      var right = P.close ? F2(ex[c.key]) : '', seen = {}, opts = [];
      seen[right] = 1;
      c.traps.forEach(function (tr) { var s = F2(tr.v); if (!seen[s] && opts.length < 3) { seen[s] = 1; opts.push([s + ' ' + c.unit, tr.msg]); } });
      if (opts.length < 3) { var x10 = F2(ex[c.key] * 10); if (!seen[x10]) { seen[x10] = 1; opts.push([x10 + ' ' + c.unit, 'Check the powers of ten in the units.']); } }
      if (opts.length < 3) continue;
      it.parts = [{ key: 'a', kind: 'mcq', ask: c.ask, opts: [{ t: right + ' ' + c.unit, ok: true }].concat(opts.map(function (o) { return { t: o[0], why: o[1] }; })), why: (c.work || []).join(' ') }];
      if (it.hide) Object.keys(it.hide).forEach(function () {});
      return it;
    }
    return null;
  }
  function F2(x) { return window.Fmt.num(x, 2); }
  function cardList(t, g) {
    var T = TOP[t], all = CC.CARDS.filter(function (c) { return c.grades.indexOf(g) >= 0 && Ch.evById(c.ev) && Ch.evById(c.ev).grades.indexOf(g) >= 0; });
    return T.cards === '*' ? all : all.filter(function (c) { return T.cards.indexOf(c.id) >= 0; });
  }

  /* an exam card at level E with help off (§9.1): the answer word(s) and one box; marked by the keyword checker */
  function mountCard(host, cd, g, ctx) {
    var h = ctx.h, ev = Ch.evById(cd.ev), su = Ch.setup(ev, g), rows = cd.rows(g), total = 0;
    rows.forEach(function (r) { total += (r.vmarks || 1) + r.lines.length; });
    var box = h('div', { class: 'card pitem' }); host.appendChild(box);
    box.appendChild(h('p', { class: 'stem', html: esc(ev.banner ? ev.banner(g).split('. ')[0] + '.' : '') }));
    var out = D.render(su.spec, su.res, { grade: g, still: true, title: ev.title }), pic = h('div', { class: 'canvas pcanvas' }); pic.innerHTML = out.svg; box.appendChild(pic);
    requestAnimationFrame(function () { var svg = pic.querySelector('svg'); try { var bb = svg.getBBox(), m = 12; svg.setAttribute('viewBox', [bb.x - m, bb.y - m, bb.width + 2 * m, bb.height + 2 * m].map(function (v) { return v.toFixed(1); }).join(' ')); } catch (e) { /* hidden */ } });
    box.appendChild(h('p', { class: 'stem', html: esc(cd.stem(g)) + ' <span class="muted">[' + total + ']</span>' }));
    var verdict = rows.map(function () { return null; });
    rows.forEach(function (r, ri) {
      if (r.label) box.appendChild(h('h3', { text: r.label }));
      var chips = h('div', { class: 'seg', role: 'group', 'aria-label': 'Your answer' + (r.label ? ' for ' + r.label : '') }, r.opts.map(function (w) {
        return h('button', { 'aria-pressed': 'false', text: w, onclick: function (e) { verdict[ri] = w; Array.prototype.forEach.call(chips.querySelectorAll('button'), function (x) { x.setAttribute('aria-pressed', String(x === e.currentTarget)); }); } });
      }));
      box.appendChild(chips);
    });
    var lines = rows.reduce(function (s, r) { return s + r.lines.length; }, 0), ta = null;
    if (lines) { ta = h('textarea', { rows: '5', class: 'ans', 'aria-label': 'Your explanation' }); box.appendChild(h('p', { class: 'small', text: 'Explain in full sentences, as in the paper.' })); box.appendChild(ta); }
    var fb = h('div', {}); box.appendChild(fb);
    return {
      box: box,
      score: function () {
        var bullets = ta ? ta.value.split(/[.;\n]+/) : [], got = 0, notes = [];
        box.querySelectorAll('button, textarea').forEach(function (x) { x.disabled = true; });
        rows.forEach(function (r, ri) {
          var vOk = verdict[ri] === r.v, lg = 0;
          r.lines.forEach(function (l) { if (CC.credits(l, bullets)) lg++; });
          if (!vOk && r.cap != null) lg = Math.min(lg, r.cap);
          got += (vOk ? (r.vmarks || 1) : 0) + lg;
        });
        bullets.forEach(function (b) { CC.bulletNotes(b, ev.id).forEach(function (n) { if (notes.indexOf(n) < 0) notes.push(n); }); });
        fb.appendChild(h('div', { class: 'card inner worked' }, [h('h3', { text: 'A full-mark answer' })].concat(rows.map(function (r) {
          return h('div', {}, [h('p', { class: 'b', text: (r.label ? r.label + ': ' : '') + r.vm }), r.lines.length ? h('ul', {}, r.lines.map(function (l) { return h('li', { text: l.m }); })) : null]);
        })).concat(notes.length ? [h('p', { class: 'small b', text: 'The checker noticed:' }), h('ul', { class: 'small' }, notes.map(function (n) { return h('li', { text: n }); }))] : []).concat([h('p', { class: 'small muted', text: 'Marked by the studio’s keyword checker, one mark per link it can find. If you think it missed a link, ask your teacher.' })])));
        return { got: got, of: total, answered: verdict.some(Boolean) || (ta && ta.value.trim()) };
      }
    };
  }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  /* the slots of a check: 3 (calc, explain, mcq) or 8 (?full=1); come-back: mcq, one-line calc, a short card */
  function slots(t, g, kind) {
    var cards = cardList(t, g), out = [];
    function card(short) { var c = cards.filter(function (x) { if (!short) return true; var tot = 0; x.rows(g).forEach(function (r) { tot += (r.vmarks || 1) + r.lines.length; }); return tot <= 3; }); return c.length ? { card: rnd(c) } : null; }
    function mcq() { var m = mcqItem(t, g); return m ? { item: m } : { item: calcItem(t, g, 1) }; }
    if (kind === 'later') return [mcq(), { item: oneLine(calcItem(t, g, 1)) }, card(true) || card(false) || mcq()];
    if (kind === 'full') {
      out.push(mcq(), { item: calcItem(t, g, 2) }, { item: calcItem(t, g, 3) }, { item: calcItem(t, g, 2) });
      out.push(card(false) || mcq(), card(false) || mcq(), mcq(), mcq());
      return out;
    }
    return [{ item: calcItem(t, g, 2) }, card(false) || mcq(), mcq()];
  }
  function oneLine(it) { it.parts = it.parts.slice(0, 1); return it; }

  /* ---------- the check screen ---------- */
  function runCheck(host, t, g, ctx, kind, done) {
    var h = ctx.h, list = slots(t, g, kind), ctrls = [], sure = [];
    window.__slots = list;   /* for the browser tests */
    list.forEach(function (s, i) {
      var wrap = h('div', { class: 'slot' }); host.appendChild(wrap);
      wrap.appendChild(h('h2', { text: 'Question ' + (i + 1) + (s.card ? ': explain' : '') }));
      var c = s.card ? mountCard(wrap, s.card, g, ctx) : P.mountItem(wrap, s.item, ctx, { mode: 'check' });
      ctrls.push(c);
      var seg = h('div', { class: 'seg', role: 'group', 'aria-label': 'How sure are you?' }, ['Sure', 'Unsure'].map(function (w) {
        return h('button', { 'aria-pressed': 'false', text: w, onclick: function (e) { sure[i] = w; Array.prototype.forEach.call(seg.querySelectorAll('button'), function (x) { x.setAttribute('aria-pressed', String(x === e.currentTarget)); }); } });
      }));
      c.box.appendChild(h('div', { class: 'row', style: 'margin-top:8px' }, [h('span', { class: 'small b', text: 'How sure are you?' }), seg]));
    });
    var msg = h('div', {}), btn = h('button', { class: 'btn big', text: 'I am done: mark my check', onclick: function () {
      if (sure.filter(Boolean).length < list.length) { msg.innerHTML = ''; msg.appendChild(h('div', { class: 'warnc', text: 'Mark each answer Sure or Unsure first.' })); return; }
      btn.remove(); msg.innerHTML = '';
      var res = ctrls.map(function (c) { return c.score(); }), right = res.map(function (r) { return r.of && r.got / r.of >= 2 / 3 - 1e-9; });
      done(res, right, sure, msg);
    } });
    host.appendChild(h('div', { class: 'row', style: 'margin-top:14px' }, [btn])); host.appendChild(msg);
  }
  function verdictLines(h, res, right, sure) {
    return h('ul', {}, res.map(function (r, i) {
      var tag = right[i] ? (sure[i] === 'Unsure' ? 'right, but you were unsure: lucky. Look at it again soon.' : 'right.') : (sure[i] === 'Sure' ? 'not yet, and you were sure: this goes to the top of your list.' : 'not yet.');
      return h('li', { text: 'Question ' + (i + 1) + ': ' + r.got + '/' + r.of + ', ' + tag });
    }));
  }

  V.check = function (arg, params, ctx) {
    var h = ctx.h, main = ctx.main, g = ctx.grade();
    if (!arg) return listChecks(ctx);
    if (arg === 'daily') return daily(ctx);
    var t = arg;
    if (!served(t, g)) {
      main.appendChild(h('div', { class: 'wrap' }, [h('h1', { text: 'Check it on my own' }), h('div', { class: 'card' }, [h('p', { text: TOP[t] ? 'This check is for Grade ' + (TOP[t].grades || []).join(' and ') + '.' : 'There is no check with that name.' }), h('a', { class: 'btn ghost', href: '#check', text: 'All checks' })])]));
      return;
    }
    var full = params.full === '1', bk = book(t, g);
    document.title = 'Check: ' + TOP[t].name + ' · Circuits Studio';
    var wrap = h('div', { class: 'wrap' }, [
      h('div', { class: 'row' }, [h('a', { class: 'chip', href: '#check', text: '← Check' }), h('span', { class: 'chip', text: 'Book ' + bk }), h('span', { class: 'chip', text: 'Help off' })]),
      h('h1', { text: (full ? 'Full topic check: ' : 'Check it on my own: ') + TOP[t].name, style: 'margin-top:10px' }),
      h('div', { class: 'note', text: (full ? '8' : '3') + ' fresh questions. No hints and no answers until you submit. Mark each answer Sure or Unsure.' }),
      h('p', { class: 'small muted', text: '“It is best practice to begin each calculation with an appropriate formula, which will be used to solve the problem.” (IEB Examiners’ Report 2024, Paper 1)' })
    ]);
    main.appendChild(wrap);
    runCheck(wrap, t, g, ctx, full ? 'full' : 'check', function (res, right, sure, msg) {
      var n = right.filter(Boolean).length, pass = n >= Math.ceil(right.length * 2 / 3);
      var d = P.load(); d.log = d.log || [];
      res.forEach(function (r, i) { d.log.push({ d: P.today(), g: g, topic: t, src: 'own', ok: right[i], sure: sure[i] }); });
      if (pass) { d.rev = d.rev || {}; d.rev[g + '/' + t] = [P.today(params.review === 'long' ? 1 : 2), P.today(params.review === 'long' ? 3 : 7)].concat(params.review === 'long' ? [P.today(7), P.today(21)] : []); }
      P.save(d);
      var c = h('div', { class: pass ? 'okc' : 'warnc' }, [h('p', {}, [h('b', { text: n + ' of ' + right.length + ' right. ' }), document.createTextNode(pass ? 'You can do this on your own. Come-back checks are booked for ' + (params.review === 'long' ? '1, 3, 7 and 21' : '2 and 7') + ' days from now.' : 'Not yet on your own, and that is useful to know. Nothing is booked yet.')]), verdictLines(h, res, right, sure)]);
      msg.appendChild(c);
      var trainHref = TOP[t].train === 'T9' ? '#explain' : '#practise/' + TOP[t].train;
      if (pass) msg.appendChild(h('div', { class: 'row', style: 'margin-top:10px' }, [h('span', { class: 'btn nextbar', text: 'Write it in your book: ' + bk }), h('a', { class: 'btn ghost', href: '#later', text: 'My come-back checks' })]));
      else msg.appendChild(h('div', { class: 'row', style: 'margin-top:10px' }, [h('a', { class: 'btn nextbar', href: trainHref, text: 'Go back to Train, then check again ›' }), h('span', { class: 'small muted', text: 'Reread Book ' + bk + ' first.' })]));
    });
  };

  function listChecks(ctx) {
    var h = ctx.h, g = ctx.grade(), d = P.load(), rev = d.rev || {};
    ctx.main.appendChild(h('div', { class: 'wrap' }, [h('h1', { text: 'Check it on my own' }),
      h('p', { text: 'Three fresh questions, help off. Do it after you have practised and written the topic in your book.' }),
      h('div', { class: 'grid' }, order(g).map(function (t) {
        var due = rev[g + '/' + t];
        return h('div', { class: 'card pcard' }, [h('h3', { text: TOP[t].name }), h('p', { class: 'small muted', text: 'Book ' + book(t, g) + (due && due.length ? ' · next come-back ' + due[0] : '') }),
          h('div', { class: 'row' }, [h('a', { class: 'btn', href: '#check/' + t, text: 'Check it' }), h('a', { class: 'btn ghost', href: '#check/' + t + '?full=1', text: 'Full check (8)' })])]);
      })),
      h('div', { class: 'row', style: 'margin-top:16px' }, [h('a', { class: 'btn ghost', href: '#later', text: 'Come-back checks and my record' }), h('a', { class: 'btn ghost', href: '#check/daily', text: 'Daily mixed check (5)' })])]));
  }

  /* ---------- Return later (§9.3) ---------- */
  function due(d, g) {
    var rev = d.rev || {}, now = P.today();
    return Object.keys(rev).filter(function (k) { return +k.split('/')[0] === g && rev[k].length && rev[k][0] <= now && served(k.split('/')[1], g); })
      .sort(function (a, b) { return rev[a][0] < rev[b][0] ? -1 : 1; }).map(function (k) { return k.split('/')[1]; });
  }
  V.later = function (arg, params, ctx) {
    var h = ctx.h, g = ctx.grade(), main = ctx.main, d = P.load(), list = due(d, g);
    document.title = 'Come back later · Circuits Studio';
    var wrap = h('div', { class: 'wrap' }, [h('div', { class: 'row' }, [h('a', { class: 'chip', href: '#check', text: '← Check' })]), h('h1', { text: 'Come-back checks', style: 'margin-top:10px' })]);
    main.appendChild(wrap);
    if (!list.length) wrap.appendChild(h('div', { class: 'card' }, [h('p', { text: 'Nothing is due today. A passed check books come-back checks 2 and 7 days later.' }), h('a', { class: 'btn ghost', href: '#check', text: 'Check a topic' })]));
    else {
      var t = list[0];
      wrap.appendChild(h('p', { text: list.length + ' topic' + (list.length > 1 ? 's are' : ' is') + ' due. This one first: ' + TOP[t].name + ' (Book ' + book(t, g) + '). Three short questions, help off.' }));
      runCheck(wrap, t, g, ctx, 'later', function (res, right, sure, msg) {
        var n = right.filter(Boolean).length, dd = P.load(), key = g + '/' + t, r = (dd.rev || {})[key] || [];
        if (n >= 2) r = r.slice(1); else r = [P.today(2)];
        dd.rev[key] = r; dd.log = dd.log || [];
        res.forEach(function (x, i) { dd.log.push({ d: P.today(), g: g, topic: t, src: 'delay', ok: right[i], sure: sure[i] }); });
        P.save(dd);
        msg.appendChild(h('div', { class: n >= 2 ? 'okc' : 'warnc' }, [h('p', {}, [h('b', { text: n + ' of 3 right. ' }), document.createTextNode(n >= 2 ? (r.length ? 'Next come-back: ' + r[0] + '.' : 'That topic is done for now.') : 'Another come-back is booked in 2 days.')]), verdictLines(h, res, right, sure)]));
        msg.appendChild(h('div', { class: 'row', style: 'margin-top:10px' }, [list.length > 1 ? h('button', { class: 'btn', text: 'More: the next topic', onclick: function () { ctx.route(); window.scrollTo(0, 0); } }) : null]));
      });
    }
    wrap.appendChild(record(ctx, g));
  };

  /* the record table: With help · On your own · After a delay · Next review (counts only) */
  function record(ctx, g) {
    var h = ctx.h, d = P.load(), lg = (d.log || []).filter(function (e) { return e.g === g; }), rev = d.rev || {};
    var TM = {}; Object.keys(P.CHECK_OF).forEach(function (k) { TM[k] = P.CHECK_OF[k]; });
    function cnt(t, src) { var a = lg.filter(function (e) { return e.src === src && (e.topic === t || TM[e.topic] === t); }); return a.length ? a.filter(function (e) { return e.ok; }).length + '/' + a.length : '—'; }
    var rows = order(g).map(function (t) { return [TOP[t].name, cnt(t, 'help'), cnt(t, 'own'), cnt(t, 'delay'), (rev[g + '/' + t] || [])[0] || '—']; });
    var tb = h('table', { class: 'cmp' }, [h('thead', {}, [h('tr', {}, ['Topic', 'With help', 'On your own', 'After a delay', 'Next review'].map(function (x) { return h('th', { text: x }); }))]),
      h('tbody', {}, rows.map(function (r) { return h('tr', {}, r.map(function (x) { return h('td', { text: x }); })); }))]);
    var card = h('div', { class: 'card', style: 'margin-top:18px' }, [h('h2', { text: 'My record, Grade ' + g }), h('p', { class: 'small muted', text: 'Device-only practice; no school marks or proof of unaided work. Right/tried.' }), h('div', { class: 'tablewrap' }, [tb]),
      h('div', { class: 'row', style: 'margin-top:10px' }, [
        h('button', { class: 'btn ghost', text: 'Download (counts only)', onclick: function () {
          var txt = 'Circuits Studio record, Grade ' + g + '\nDevice-only practice; no school marks or proof of unaided work.\n\nTopic,With help,On your own,After a delay,Next review\n' + rows.map(function (r) { return r.map(function (x) { return '"' + x + '"'; }).join(','); }).join('\n') + '\n';
          var a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([txt], { type: 'text/csv' })); a.download = 'circuits-record-gr' + g + '.csv'; document.body.appendChild(a); a.click(); a.remove();
        } }),
        h('button', { class: 'btn ghost', text: 'Clear my record', onclick: function () { if (confirm('Clear the practice record and come-back dates on this device?')) { P.save({}); ctx.route(); } } })])]);
    return card;
  }

  /* daily mixed check: 5 items from topics already checked; logged as after a delay; no schedule change */
  function daily(ctx) {
    var h = ctx.h, g = ctx.grade(), d = P.load(), checked = {};
    (d.log || []).forEach(function (e) { if (e.g === g && e.src === 'own' && TOP[e.topic]) checked[e.topic] = 1; });
    var ts = Object.keys(checked);
    var wrap = h('div', { class: 'wrap' }, [h('div', { class: 'row' }, [h('a', { class: 'chip', href: '#check', text: '← Check' })]), h('h1', { text: 'Daily mixed check', style: 'margin-top:10px' })]);
    ctx.main.appendChild(wrap);
    if (!ts.length) { wrap.appendChild(h('div', { class: 'card' }, [h('p', { text: 'Check a topic on your own first. The daily check mixes the topics you have already checked.' }), h('a', { class: 'btn ghost', href: '#check', text: 'Check a topic' })])); return; }
    wrap.appendChild(h('p', { text: 'Five questions mixed across: ' + ts.map(function (t) { return TOP[t].name; }).join(', ') + '. Help off.' }));
    var items = [], ctrls = [];
    for (var i = 0; i < 5; i++) { var t = ts[i % ts.length], m = i % 2 ? mcqItem(t, g) : null; items.push({ t: t, item: m || oneLine(calcItem(t, g, 1)) }); }
    items.forEach(function (s, i) { var w = h('div', { class: 'slot' }, [h('h2', { text: 'Question ' + (i + 1) })]); wrap.appendChild(w); ctrls.push(P.mountItem(w, s.item, ctx, { mode: 'check' })); });
    var msg = h('div', {}), btn = h('button', { class: 'btn big', text: 'I am done: mark it', onclick: function () {
      btn.remove(); var res = ctrls.map(function (c) { return c.score(); }), right = res.map(function (r) { return r.of && r.got / r.of >= 2 / 3 - 1e-9; });
      var dd = P.load(); dd.log = dd.log || []; res.forEach(function (r, i) { dd.log.push({ d: P.today(), g: g, topic: items[i].t, src: 'delay', ok: right[i], daily: 1 }); }); P.save(dd);
      msg.appendChild(h('div', { class: 'okc', text: right.filter(Boolean).length + ' of 5 right. This check changes no come-back dates.' }));
    } });
    wrap.appendChild(h('div', { class: 'row', style: 'margin-top:14px' }, [btn])); wrap.appendChild(msg);
  }

  /* home block: practise, check, come back */
  var prevHome = V._homeCards;
  V._homeCards = function (c) {
    var H = c.h, d = P.load(), n = due(d, c.grade()).length;
    return H('div', {}, [
      H('h2', { text: 'Practise and check' }),
      H('div', { class: 'grid' }, [
        H('a', { class: 'card pcard', href: '#practise' }, [H('h3', { text: 'Practise' }), H('p', { class: 'small muted', text: 'Fresh calculations set out as in the paper. Hints open after you try.' })]),
        H('a', { class: 'card pcard', href: '#check' }, [H('h3', { text: 'Check it on my own' }), H('p', { class: 'small muted', text: 'Three fresh questions per topic, help off.' })]),
        H('a', { class: 'card pcard', href: '#later' }, [H('h3', { text: 'Come-back checks' + (n ? ' (' + n + ' due)' : '') }), H('p', { class: 'small muted', text: 'Short checks 2 and 7 days after a passed check, and your record.' })])
      ]),
      prevHome ? H('div', { style: 'margin-top:18px' }, [prevHome(c)]) : null
    ]);
  };

  window.Checks = { TOP: TOP, slots: slots, due: due, mcqItem: mcqItem, calcItem: calcItem, cardList: cardList };
})();
