/* Electrochemistry mini-paper: three short papers made of real IEB Paper 2 questions, mixing Modules 27 to 29 the way the
   newer papers do. A timer at the IEB pace (200 marks in 3 hours, so 0,9 minutes a mark), answers on paper, then the memo
   and self-marking question by question. The best score per paper stays in this browser only. */
(function () {
  'use strict';
  const S = window.STUDIO;
  const { h, add, clear, store } = S;

  const PAPERS = [
    { id: 'A', ids: ['2021-Q1.8', '2023-Q1.8', '2025-Q6.1to6.2', '2025-Q6.3.2', '2023-Q6.6', '2023-Q6.7', '2024-Q7.7', '2025-Q7.10'] },
    { id: 'B', ids: ['2020-Q1.9', '2025-Q1.4', '2024-Q6.2to6.3', '2024-Q6.4', '2024-Q6.5', '2024-Q6.6', '2021-Q7.4to7.5', '2023-Q7.2.3'] },
    { id: 'C', ids: ['2021-Q1.4', '2023-Q1.7', '2022-Q6.3', '2022-Q6.4', '2021-Q7.6.4', '2024-Q7.4', '2024-Q7.5to7.6'] },
  ];
  const item = id => (window.IEB || []).find(x => x.id === id);
  const paperItems = p => p.ids.map(item).filter(Boolean);
  const total = p => paperItems(p).reduce((s, x) => s + x.marks, 0);
  const minutes = p => Math.round(total(p) * 0.9);
  const mmss = s => Math.floor(s / 60) + ':' + String(Math.floor(s % 60)).padStart(2, '0');
  const curly = s => s.replace(/"([^"]*)"/g, '“$1”').replace(/(\w)'(\w)/g, '$1’$2');
  S.lastMini = S.lastMini || null; // { id, state: 'writing' | 'marking' | 'done', start, paused, used, marks: {}, picks: {} }

  S.views.minipaper = function (el, arg) {
    const p = PAPERS.find(x => x.id === arg);
    if (!p) return list(el);
    paper(el, p);
  };

  function list(el) {
    const best = store.get('mini', {});
    add(el, [h('div', { class: 'head' }, h('div', null, h('h2', null, 'Electrochemistry mini-paper'),
        h('p', null, 'Three short papers made of real IEB Paper 2 questions, mixing Modules 27 to 29 the way the newer papers do. Work on paper against the clock, then mark yourself with the memo.'))),
      h('div', { class: 'callout warm' }, h('h4', null, 'Exam technique'), 'IEB pace: 200 marks in 3 hours, so about 0,9 minutes a mark. Read the set-up first, answer the sub-questions in order, and use the marks as a guide to how much to write.'),
      h('div', { class: 'grid g3' }, PAPERS.map(pp => { const its = paperItems(pp), mods = [...new Set(its.map(x => x.module))].sort();
        return h('a', { class: 'card', href: '#minipaper/' + pp.id, style: { '--bc': 'var(--acc)' } },
          h('span', { class: 'tag' }, total(pp) + ' marks · ' + minutes(pp) + ' minutes'),
          h('b', null, 'Mini-paper ' + pp.id),
          h('small', null, its.length + ' questions from ' + [...new Set(its.map(x => x.year))].sort().join(', ') + ' · Modules ' + mods.join(', ')),
          best[pp.id] !== undefined ? h('small', { class: 'score-only' }, 'Your best: ' + best[pp.id] + '/' + total(pp)) : null); })),
      h('p', { class: 'small muted', style: { marginTop: '12px' } }, 'Questions reproduced with acknowledgement to the IEB: see About.')]);
  }

  function paper(el, p) {
    const its = paperItems(p), T = total(p), limit = minutes(p) * 60;
    let L = S.lastMini && S.lastMini.id === p.id ? S.lastMini : null;
    const body = h('div'), clock = h('span', { class: 'mini-clock', role: 'timer', 'aria-live': 'off' });
    let tick = null;
    add(el, [h('div', { class: 'crumbs' }, h('a', { href: '#minipaper' }, 'Mini-paper'), ' › Paper ' + p.id),
      h('div', { class: 'head' }, h('div', null, h('h2', null, 'Mini-paper ' + p.id), h('p', null, T + ' marks · ' + minutes(p) + ' minutes · ' + its.length + ' questions. Answer on paper, then mark yourself.'))), body]);
    const used = () => !L ? 0 : (L.used + (L.start && !L.paused ? (Date.now() - L.start) / 1000 : 0));
    function drawClock() {
      if (!L || L.state !== 'writing') return;
      const left = limit - used();
      clock.textContent = left > 0 ? mmss(left) + ' left' : 'Time is up · ' + mmss(-left) + ' over';
      clock.classList.toggle('over', left <= 0);
      if (left <= 0 && !L.told) { L.told = true; S.say('Time is up. Finish the sentence you are writing, then mark your paper.'); }
    }
    S.onLeave(() => { if (tick) clearInterval(tick); if (L && L.state === 'writing' && L.start && !L.paused) { L.used = used(); L.start = Date.now(); } });
    function render() {
      clear(body);
      if (!L) {
        add(body, [h('div', { class: 'card' }, h('h3', null, 'Before you start'),
          h('ul', null, h('li', null, 'Have paper, a pen, a calculator and the data sheet (Table 4 is in this studio).'), h('li', null, 'The clock is a guide: it does not stop you.'), h('li', null, 'Write every answer before you open the memo.')),
          h('button', { class: 'btn', type: 'button', onclick: () => { L = S.lastMini = { id: p.id, state: 'writing', start: Date.now(), used: 0, paused: false, marks: {}, picks: {} }; render(); S.focusTo(body.querySelector('h3')); } }, 'Start the clock'))]);
        return;
      }
      if (L.state === 'writing') {
        add(body, [h('div', { class: 'mini-bar' }, clock,
          h('button', { class: 'btn ghost small', type: 'button', onclick: () => { if (L.paused) { L.paused = false; L.start = Date.now(); } else { L.used = used(); L.paused = true; } render(); } }, L.paused ? 'Carry on' : 'Pause'),
          h('button', { class: 'btn small', type: 'button', onclick: () => { L.used = used(); L.state = 'marking'; render(); S.focusTo(body.querySelector('h3')); S.say('Marking. Open each memo and mark yourself.'); } }, 'I am done: mark my paper'))]);
        drawClock(); if (tick) clearInterval(tick); tick = setInterval(drawClock, 1000);
      } else if (tick) { clearInterval(tick); tick = null; }
      if (L.state !== 'writing') {
        const got = its.reduce((s, x) => s + (L.marks[x.id] || 0), 0), marked = its.filter(x => L.marks[x.id] !== undefined).length;
        add(body, [h('div', { class: 'card mini-sum', tabindex: '-1' }, h('h3', null, marked === its.length ? 'Your mark: ' + got + ' out of ' + T + ' (' + Math.round(100 * got / T) + '%)' : 'Mark each question: ' + marked + ' of ' + its.length + ' done'),
          h('p', { class: 'small muted' }, 'Time used: ' + mmss(L.used) + ' of ' + minutes(p) + ' minutes.'),
          marked === its.length ? weak(its) : null,
          h('div', { class: 'row' }, h('button', { class: 'btn ghost small', type: 'button', onclick: () => { L = S.lastMini = null; render(); } }, 'Write it again'), h('a', { class: 'btn ghost small', href: '#minipaper' }, 'Other papers')))]);
      }
      its.forEach((x, i) => body.appendChild(qcard(x, i)));
    }
    function weak(list) {
      const by = {}; list.forEach(x => { by[x.module] = by[x.module] || [0, 0]; by[x.module][0] += L.marks[x.id] || 0; by[x.module][1] += x.marks; });
      return h('p', null, 'By module: ', Object.keys(by).map((m, i) => [i ? ' · ' : '', h('a', { href: '#learn?m=' + m }, 'Module ' + m), ' ' + by[m][0] + '/' + by[m][1]]));
    }
    function qcard(x, i) {
      const P = S.iebParts(x), key = x.mcq ? (x.memo.match(/^([A-D])\b/) || [])[1] : null;
      const c = h('div', { class: 'qcard ieb-card', style: { '--mc': (S.MODS[x.module] || {}).colour, marginTop: '14px' } });
      function d() {
        const open = !!(L.open && L.open[x.id]);
        clear(c);
        const pick = L.picks[x.id] || null, marking = L.state !== 'writing';
        add(c, [h('div', { class: 'ieb-tags' }, h('span', { class: 'tag tag-paper' }, 'Question ' + (i + 1)), h('span', { class: 'tag tag-mod' }, 'Module ' + x.module),
            h('span', { class: 'tag' }, x.marks + ' mark' + (x.marks > 1 ? 's' : '')), h('span', { class: 'tag' }, x.paper.replace(/^IEB NSC /, 'IEB ').replace(' Paper 2', '') + ' · ' + x.q.replace(/^Question /, 'Q')),
            L.marks[x.id] !== undefined ? h('span', { class: 'tag tag-score score-only' }, L.marks[x.id] + '/' + x.marks) : null),
          P.setup.length ? h('div', { class: 'ieb-setup' }, h('span', { class: 'ieb-label' }, 'Set-up'), P.setup.map(t => h('p', null, curly(t)))) : null,
          P.asks.map(a => h('p', { class: 'ieb-ask' }, a.t, a.marks ? h('span', { class: 'tag tag-mk' }, '(' + a.marks + ')') : null)),
          P.subs.length ? h('ol', { class: 'ieb-subs' }, P.subs.map(sb => h('li', null, h('span', { class: 'ieb-n' }, sb.n), h('span', { class: 'ieb-st' }, sb.t), sb.marks ? h('span', { class: 'tag tag-mk' }, '(' + sb.marks + ')') : null))) : null,
          P.opts ? h('div', { class: 'ieb-opts' + (Math.max(...P.opts.map(o => o.length)) > 34 ? ' long' : ''), role: 'group', 'aria-label': 'Options' }, P.opts.map((o, k) => { const Lt = 'ABCD'[k];
            const cls = 'ieb-opt' + (marking && key ? (Lt === key ? ' right' : pick === Lt ? ' wrongc' : '') : '');
            return h('button', { type: 'button', class: cls, 'aria-pressed': String(pick === Lt), disabled: marking, onclick: () => { L.picks[x.id] = pick === Lt ? null : Lt; S.keepFocus(c, d); } },
              h('span', { class: 'ieb-letter', 'aria-hidden': 'true' }, Lt), h('span', { class: 'sr' }, 'Option ' + Lt + ': '), h('span', null, curly(o))); })) : null,
          !marking ? null : !open ? h('button', { class: 'btn ghost small ieb-show', type: 'button', onclick: () => { L.open = L.open || {}; L.open[x.id] = true; S.keepFocus(c, d); const s = c.querySelector('.sol'); if (s) S.focusTo(s); } }, 'Show the memo') :
            h('div', null, h('div', { class: 'sol' }, h('b', null, x.noMemo ? 'Our answer (no official memo)' : 'Memo'), h('div', { class: 'ln', style: { whiteSpace: 'pre-line' } }, curly(x.memo).replace(/(?:;|\.)\s+(?=\d+\.\d+(?:\.\d+)?:)/g, m => (m[0] === '.' ? '.' : '') + '\n'))),
              x.report ? h('div', { class: 'callout ex' }, h('h4', null, 'Examiners’ report ' + x.year), curly(x.report)) : null,
              h('div', { class: 'row score-only', style: { marginTop: '8px' } }, h('span', { class: 'small' }, 'Mark yourself:'),
                Array.from({ length: x.marks + 1 }, (_, m) => h('button', { type: 'button', class: 'btn small ' + (L.marks[x.id] === m ? 'on' : 'ghost'), 'aria-pressed': String(L.marks[x.id] === m), onclick: () => {
                  L.marks[x.id] = m;
                  if (its.every(y => L.marks[y.id] !== undefined)) { const got = its.reduce((s, y) => s + L.marks[y.id], 0), best = store.get('mini', {}); if (best[p.id] === undefined || got > best[p.id]) { best[p.id] = got; store.set('mini', best); } L.state = 'done'; }
                  S.say('Marked ' + m + ' out of ' + x.marks + '.' + (L.state === 'done' ? ' Paper marked: see your total at the top.' : ''));
                  render();
                  const again = body.querySelectorAll('.qcard')[i]; const pressed = again && again.querySelector('.score-only [aria-pressed="true"]'); if (pressed) S.focusTo(pressed);
                } }, m + '/' + x.marks))))]);
      }
      d();
      return c;
    }
    render();
  }
})();
