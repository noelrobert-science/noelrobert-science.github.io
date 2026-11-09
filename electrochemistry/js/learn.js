/* Learning routes: one per coursebook section. Explain (rules beside the live lab) → worked example step by step →
   Who is right? → Now you (the book's exercise with the help fading, then a fresh question) → On your own
   (help locked, schedules Return later). */
(function () {
  'use strict';
  const S = window.STUDIO;
  const { h, add, clear, chem, notice, store } = S;
  const firstSentence = t => { const f = t.split('. ')[0]; return /[.!?]$/.test(f) ? f : f + '.'; };

  S.views.learn = function (el, arg, params) {
    const prog = store.get('routes', {});
    add(el, [h('div', { class: 'head' }, h('div', null, h('h2', null, 'Learning routes'), h('p', null, 'One route per coursebook section, about 15 minutes each: the rules beside a live lab, the worked example step by step, the book’s Now you with the help fading, then a question on your own.')))]);
    [27, 28, 29].filter(m => !params.m || String(m) === params.m).forEach(m => {
      add(el, [h('h3', { style: { marginTop: '18px' } }, 'Module ' + m + ' · ' + S.MODS[m].title),
        h('div', { class: 'grid g3' }, S.SECTIONS.filter(s => s.mod === m).map(s => h('a', { class: 'card', href: '#section/' + s.id, style: { '--bc': S.MODS[m].colour } },
          h('span', { class: 'tag' }, s.id, prog[s.id] === true ? h('span', { class: 'score-only' }, ' · done ✓') : prog[s.id] === 'tried' ? h('span', { class: 'score-only' }, ' · tried · come back') : null),
          h('b', null, s.title), h('small', null, firstSentence(s.intro)))))]);
    });
    if (params.m) el.appendChild(h('p', null, h('a', { href: '#learn' }, 'Show all three modules')));
  };

  /* ---------- the book's Now you: fill the gaps, help fading line by line ---------- */
  const SUB = '₀₁₂₃₄₅₆₇₈₉', SUP = { '⁰': '0', '¹': '1', '²': '2', '³': '3', '⁴': '4', '⁵': '5', '⁶': '6', '⁷': '7', '⁸': '8', '⁹': '9', '⁺': '+', '⁻': '-' };
  const nrm = s => String(s).toLowerCase().replace(/ℓ/g, 'l').replace(/[₀-₉]/g, c => String(SUB.indexOf(c))).replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹⁺⁻]/g, c => SUP[c])
    .replace(/->|=>/g, '→').replace(/[−–]/g, '-').replace(/[\s.]/g, '').replace(/^the/, '');
  // a short or chemical gap is marked; a long worded one is compared with the book's words
  const exact = a => /[\d⁺⁻→₀-₉]/.test(a) || a.length <= 16;
  function sameAnswer(t, a) {
    if (!t.trim()) return false;
    const x = S.readNum(t), y = S.readNum(a);
    if (!isNaN(x) && !isNaN(y) && /^[\s+−\-\d,.]+$/.test(a)) return S.close(x, y, Math.max(0.006, Math.abs(y) * 0.005));
    return nrm(t) === nrm(a);
  }
  function bookNowYou(item) {
    const box = h('div', { class: 'card nowyou' }), vals = {}, shownAns = {};
    let checked = false;
    function d() {
      clear(box);
      let k = 0, got = 0, tot = 0;
      add(box, [h('div', { class: 'eyebrow' }, item.title || 'Now you · from the coursebook'), h('p', { class: 'prompt' }, chem(item.q, 'cwrap')),
        h('p', { class: 'small muted' }, 'Fill the gaps. The help fades as you go: on the first line you may look at an answer, the second line gives a first letter, and the rest are yours.')]);
      item.lines.forEach((parts, li) => {
        const row = h('div', { class: 'nyline' });
        parts.forEach(p => {
          if (typeof p === 'string') { row.appendChild(chem(p, 'cwrap')); return; }
          const id = k++, a = p.b;
          const ok = sameAnswer(vals[id] || '', a), ex = exact(a);
          if (checked && ex) { tot++; if (ok) got++; }
          const w = Math.min(28, Math.max(4, a.length + 2));
          const inp = h('input', { type: 'text', class: 'blank', style: { width: w + 'ch' }, value: vals[id] || '', 'aria-label': 'Gap ' + (id + 1), disabled: checked, placeholder: li === 1 ? a.trim().charAt(0) + '…' : '', oninput: e => { vals[id] = e.target.value; } });
          const bits = [inp];
          if (li === 0 && !checked && !shownAns[id]) bits.push(h('button', { class: 'linkbtn small', type: 'button', onclick: () => { shownAns[id] = true; S.keepFocus(box, d); } }, 'show'));
          if (shownAns[id] && !checked) bits.push(h('span', { class: 'nyans' }, ' ', chem(a)));
          if (checked) bits.push(h('span', { class: 'nyans ' + (ok ? 'ok' : ex ? 'no' : '') }, ok ? ' ✓' : (ex ? ' ✗ ' : ' compare: '), ok ? null : chem(a)));
          row.appendChild(h('span', { class: 'gap' }, bits));
        });
        box.appendChild(row);
      });
      box.appendChild(h('div', { class: 'row', style: { marginTop: '10px' } }, !checked ? h('button', { class: 'btn', type: 'button', onclick: () => {
        checked = true; S.keepFocus(box, d);
        const n = box.querySelector('.notice'); if (n) S.say(n.textContent);
      } }, 'Check my working') : h('button', { class: 'btn ghost', type: 'button', onclick: () => { checked = false; Object.keys(vals).forEach(k2 => delete vals[k2]); Object.keys(shownAns).forEach(k2 => delete shownAns[k2]); S.keepFocus(box, d); } }, 'Clear and try again')));
      if (checked) {
        const msg = `${got} of ${tot} marked gaps match the book.` + (tot < k ? ' Compare the worded gaps with the book’s words yourself.' : '');
        box.appendChild(h('div', { class: 'notice ' + (got === tot ? 'ok' : 'no') }, msg));
      }
    }
    d();
    return box;
  }
  S.bookNowYou = bookNowYou;
  // sections with no Now you in the book: the worked example again, with the later steps left for the learner
  function fadedWorked(s) {
    const w = s.worked, keep = Math.max(1, Math.floor(w.steps.length / 3));
    const open = {};
    const box = h('div', { class: 'card' });
    function d() {
      clear(box);
      add(box, [h('div', { class: 'eyebrow' }, 'Now you · finish the worked example'), h('p', { class: 'prompt' }, chem(w.q, 'cwrap')),
        h('p', { class: 'small muted' }, `The first ${keep === 1 ? 'step is' : keep + ' steps are'} done for you. Write each of the others on paper, then show it and compare.`),
        h('div', { class: 'steps', 'data-noreveal': '' }, w.steps.map((st, i) => i < keep || open[i] ? S.stepLine(st.cls || '', st.lab, chem(st.text, 'cwrap'), st.why)
          : h('div', { class: 'step' }, h('div', { class: 'lab' }, st.lab), h('button', { class: 'btn ghost small', type: 'button', onclick: () => { open[i] = true; S.keepFocus(box, d); } }, 'I have written it: show this step'))))]);
    }
    d();
    return box;
  }

  const STEPS = ['Explain', 'Worked example', 'Who is right?', 'Now you', 'On your own'];
  S.views.section = function (el, arg, params) {
    const s = S.sectionById(arg);
    if (!s) { S.views.learn(el, '', {}); return; }
    const idx = S.SECTIONS.indexOf(s), prev = S.SECTIONS[idx - 1], next = S.SECTIONS[idx + 1];
    const steps = STEPS.filter(t => t !== 'Who is right?' || s.who);
    let step = Math.max(0, Math.min(+(params.step || 0) || 0, steps.length - 1));
    let shown = 0; // worked-example steps revealed: kept while the learner moves between route steps
    let nyIdx = 0, lastOwn = null;
    const tabs = h('div', { class: 'routebar', role: 'group', 'aria-label': 'Route steps' }), body = h('div');
    add(el, [h('div', { class: 'crumbs' }, h('a', { href: '#learn' }, 'Learn'), ' › ', h('a', { href: '#learn?m=' + s.mod }, 'Module ' + s.mod + ' · ' + S.MODS[s.mod].title)),
      h('div', { class: 'head' }, h('div', null, h('div', { class: 'eyebrow' }, 'Section ' + s.id), h('h2', null, s.title))), tabs, body]);
    function go(i, focusTab) {
      step = i;
      history.replaceState(null, '', '#section/' + s.id + (i ? '?step=' + i : ''));
      draw();
      window.scrollTo(0, Math.min(window.scrollY, el.offsetTop));
      const t = focusTab ? tabs.children[i] : body.querySelector('h3, .prompt, p');
      if (t) { if (!focusTab) t.tabIndex = -1; t.focus({ preventScroll: true }); }
    }
    function nav() {
      return h('div', { class: 'row', style: { marginTop: '16px', justifyContent: 'space-between' } },
        step > 0 ? h('button', { class: 'btn ghost', type: 'button', onclick: () => go(step - 1) }, '← ' + steps[step - 1]) : h('span'),
        step < steps.length - 1 ? h('button', { class: 'btn', type: 'button', onclick: () => go(step + 1) }, steps[step + 1] + ' →') : null);
    }
    function draw() {
      clear(tabs);
      steps.forEach((t, i) => tabs.appendChild(h('button', { type: 'button', 'aria-current': i === step ? 'step' : null, class: i < step ? 'done' : '', onclick: () => go(i, true) }, h('span', { class: 'n' }, h('span', { class: 'sr' }, 'Step '), i + 1), t)));
      clear(body);
      const t = steps[step];
      if (t === 'Explain') explain(); else if (t === 'Worked example') worked(); else if (t === 'Who is right?') who(); else if (t === 'Now you') nowYou(); else onYourOwn();
      body.appendChild(nav());
    }
    function explain() {
      const labs = s.tools.filter(id => S.tools[id]), first = labs[0] && S.tools[labs[0]];
      const live = h('div', { class: 'explain-lab' });
      add(body, [h('div', { class: 'split' },
        h('div', null, h('p', { class: 'lede' }, s.intro),
          s.defs ? h('div', { class: 'card' }, h('h3', null, 'SAGS wording to learn word for word'), h('dl', { class: 'defs' }, s.defs.map(([t, d]) => [h('dt', null, t), h('dd', null, chem(d, 'cwrap'))]))) : null,
          h('div', { class: 'card', style: { marginTop: '14px' } }, h('h3', null, 'The rules (the Exam recipe in your coursebook)'), h('ol', { class: 'rules' }, s.rules.map(r => h('li', null, chem(r, 'cwrap'))))),
          h('div', { class: 'callout trap' }, h('h4', null, 'IEB trap'), '✗ ', chem(s.trap.wrong, 'cwrap'), h('br'), '✓ ', chem(s.trap.right, 'cwrap'))),
        h('div', null,
          first ? h('div', { class: 'card' }, h('h3', null, 'See the rules at work: ' + first.title), h('p', { class: 'small muted' }, 'Change the set-up and watch the rules on the left play out.'), live, h('p', { class: 'small' }, h('a', { href: '#lab/' + labs[0] }, 'Open this lab on its own page →'))) : null,
          labs.length > 1 ? h('div', { class: 'card', style: { marginTop: '14px' } }, h('h3', null, 'More labs for this section'), h('div', { class: 'grid' }, labs.slice(1).map(S.toolCard))) : null,
          S.lessonsFor && S.lessonsFor(s.id).length ? h('div', { class: 'card', style: { marginTop: '14px' } }, h('h3', null, 'Listen first'), h('div', { class: 'grid' }, S.lessonsFor(s.id).map(S.lessonCard))) : null))]);
      if (first) { try { first.render(live, { embedded: true }); } catch (e) { console.error(e); clear(live); live.appendChild(S.toolCard(labs[0])); } }
    }
    function worked() {
      const w = s.worked;
      const list = h('div', { class: 'steps', 'data-noreveal': '' }), ctl = h('div', { class: 'row', style: { marginTop: '10px' } });
      add(body, [h('div', { class: 'card' }, h('div', { class: 'row small muted', style: { justifyContent: 'space-between' } }, h('span', null, 'Worked example ' + w.n + ' · ' + w.title), h('span', null, w.marks + ' marks · ✓ = 1 mark')),
        h('p', { class: 'prompt' }, chem(w.q, 'cwrap')), h('p', { class: 'small muted' }, 'Cover the answer: write each step on paper first, then reveal it.'), list, ctl)]);
      function d(focus) {
        clear(list); clear(ctl);
        w.steps.forEach((st, i) => list.appendChild(i < shown ? S.stepLine(st.cls || '', st.lab, chem(st.text, 'cwrap'), st.why) : h('div', { class: 'step locked' }, h('div', { class: 'lab' }, st.lab), h('div', { class: 'small muted' }, 'Write this step first.'))));
        if (shown < w.steps.length) add(ctl, [h('button', { class: 'btn', type: 'button', onclick: () => { shown++; d(true); } }, shown ? 'Reveal the next step' : 'Reveal the first step'), h('button', { class: 'btn ghost', type: 'button', onclick: () => { shown = w.steps.length; d(true); } }, 'Show all')]);
        else ctl.appendChild(notice('ok', 'Now compare your working with the memo ticks. Every ✓ is a mark.'));
        if (focus) {
          const b = ctl.querySelector('button') || ctl.querySelector('.notice');
          if (b) { if (b.tagName !== 'BUTTON') b.tabIndex = -1; b.focus({ preventScroll: true }); }
          const last = list.children[shown - 1]; if (last) S.say(last.textContent);
        }
      }
      d();
    }
    function who() {
      const wq = s.who;
      let picked = null;
      const box = h('div', { class: 'card' });
      body.appendChild(box);
      function d() {
        clear(box);
        add(box, [h('h3', null, 'Who is right?'), h('p', null, chem(wq.q, 'cwrap')),
          h('div', { class: 'grid g3' }, wq.people.map((p, i) => h('button', { type: 'button', class: 'who' + (picked !== null ? (p.right ? ' right' : i === picked ? ' wrongc' : '') : ''), 'aria-pressed': String(picked === i), disabled: picked !== null, onclick: () => {
            picked = i; S.logAttempt({ kind: 'supported', section: s.id, id: 'who', correct: p.right ? 1 : 0, total: 1 }); d();
            const n = box.querySelector('.notice'); if (n) { n.tabIndex = -1; n.focus({ preventScroll: true }); S.say(n.textContent); }
          } },
            h('b', null, p.name, picked !== null && p.right ? ' ✓' : picked === i ? ' ✗' : ''), h('span', null, '“', chem(p.says, 'cwrap'), '”')))),
          picked !== null ? notice(wq.people[picked].right ? 'ok' : 'no', chem(wq.why, 'cwrap')) : h('p', { class: 'small muted' }, 'Decide, and say why the other two are wrong, before you tap.')]);
      }
      d();
    }
    function nowYou() {
      const book = (window.NOWYOU || []).filter(x => x.s === s.id);
      const top = h('div'), area = h('div');
      add(body, [top, h('h3', { style: { marginTop: '18px' } }, 'Then a fresh question'), h('p', null, 'Use the hints where there are any: they come one step at a time.'), area]);
      function drawBook() {
        clear(top);
        if (book.length) {
          top.appendChild(bookNowYou(book[nyIdx % book.length]));
          if (book.length > 1) top.appendChild(h('p', { class: 'small' }, h('button', { class: 'linkbtn', type: 'button', onclick: () => { nyIdx++; drawBook(); S.focusTo(top.querySelector('.linkbtn') || top); S.say('Another question from the book.'); } }, `Another one from the book (this is ${(nyIdx % book.length) + 1} of ${book.length})`)));
        } else top.appendChild(fadedWorked(s));
      }
      drawBook();
      const fresh = (focus) => { clear(area); S.renderQ(area, S.makeQ(s.id), { mode: 'supported', onNext: () => fresh(true) }); area.appendChild(h('button', { class: 'btn ghost', type: 'button', style: { marginTop: '10px' }, onclick: () => fresh(true) }, 'Another one')); if (focus === true) { S.focusTo(area.querySelector('.prompt') || area); S.say('A fresh question.'); } };
      fresh();
    }
    function onYourOwn() {
      const area = h('div');
      add(body, [h('p', null, 'On your own: no hints until you have checked your answer. This one counts: the section is scheduled in Return later.'), area]);
      const fresh = () => {
        clear(area);
        let q = S.makeQ(s.id);
        for (let k = 0; k < 10 && lastOwn && String(q.prompt) === lastOwn; k++) q = S.makeQ(s.id);
        lastOwn = String(q.prompt);
        S.renderQ(area, q, { mode: 'independent', onNext: fresh, onAnswer: ok => {
          const p = store.get('routes', {}); p[s.id] = ok || p[s.id] === true ? true : 'tried'; store.set('routes', p);
          area.appendChild(h('div', { class: 'card', style: { marginTop: '12px' } }, h('h3', null, ok ? 'Route complete ✓' : 'Route complete: come back to it'),
            h('p', null, ok ? 'This section comes back in Return later in a day or so.' : 'This section comes back tomorrow in Return later. Reread the rules first.'),
            h('div', { class: 'row' }, next ? h('a', { class: 'btn', href: '#section/' + next.id }, 'Next: ' + next.id + ' ' + next.short + ' →') : h('a', { class: 'btn', href: '#check' }, 'Check yourself →'),
              h('a', { class: 'btn ghost', href: '#practise?s=' + s.id }, 'Practise more'), h('button', { class: 'btn ghost', type: 'button', onclick: fresh }, 'Another one on my own'))));
        } });
      };
      fresh();
    }
    draw();
    el.appendChild(h('div', { class: 'row small no-present', style: { marginTop: '20px', justifyContent: 'space-between' } },
      prev ? h('a', { href: '#section/' + prev.id }, '← ' + prev.id + ' ' + prev.short) : h('span'), next ? h('a', { href: '#section/' + next.id }, next.id + ' ' + next.short + ' →') : h('span')));
  };
})();
