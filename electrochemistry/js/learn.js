/* Learning routes: one per coursebook section. Explain → worked example step by step → Who is right? →
   Now you (help available) → On your own (help locked, schedules Return later). */
(function () {
  'use strict';
  const S = window.STUDIO;
  const { h, add, clear, chem, notice, store } = S;

  S.views.learn = function (el, arg, params) {
    const prog = store.get('routes', {});
    add(el, [h('div', { class: 'head' }, h('div', null, h('h2', null, 'Learning routes'), h('p', null, 'One route per coursebook section, about 15 minutes each: the rules, the worked example step by step, then two questions, the second on your own.')))]);
    [27, 28, 29].filter(m => !params.m || String(m) === params.m).forEach(m => {
      add(el, [h('h3', { style: { marginTop: '18px' } }, 'Module ' + m + ' · ' + S.MODS[m].title),
        h('div', { class: 'grid g3' }, S.SECTIONS.filter(s => s.mod === m).map(s => h('a', { class: 'card', href: '#section/' + s.id, style: { '--bc': S.MODS[m].colour } },
          h('span', { class: 'tag' }, s.id + (prog[s.id] ? ' · done ✓' : '')), h('b', null, s.title), h('small', null, s.intro.split('. ')[0] + '.'))))]);
    });
    if (params.m) el.appendChild(h('p', null, h('a', { href: '#learn' }, 'Show all three modules')));
  };

  const STEPS = ['Explain', 'Worked example', 'Who is right?', 'Now you', 'On your own'];
  S.views.section = function (el, arg, params) {
    const s = S.sectionById(arg);
    if (!s) { S.views.learn(el, '', {}); return; }
    const idx = S.SECTIONS.indexOf(s), prev = S.SECTIONS[idx - 1], next = S.SECTIONS[idx + 1];
    const steps = STEPS.filter(t => t !== 'Who is right?' || s.who);
    let step = Math.min(+(params.step || 0), steps.length - 1);
    const tabs = h('div', { class: 'routebar', role: 'tablist', 'aria-label': 'Route steps' }), body = h('div');
    add(el, [h('div', { class: 'crumbs' }, h('a', { href: '#learn' }, 'Learn'), ' › ', h('a', { href: '#learn?m=' + s.mod }, 'Module ' + s.mod + ' · ' + S.MODS[s.mod].title)),
      h('div', { class: 'head' }, h('div', null, h('div', { class: 'eyebrow' }, 'Section ' + s.id), h('h2', null, s.title))), tabs, body]);
    function go(i) { step = i; draw(); window.scrollTo(0, Math.min(window.scrollY, el.offsetTop)); }
    function nav() {
      return h('div', { class: 'row', style: { marginTop: '16px', justifyContent: 'space-between' } },
        step > 0 ? h('button', { class: 'btn ghost', type: 'button', onclick: () => go(step - 1) }, '← ' + steps[step - 1]) : h('span'),
        step < steps.length - 1 ? h('button', { class: 'btn', type: 'button', onclick: () => go(step + 1) }, steps[step + 1] + ' →') : null);
    }
    function draw() {
      clear(tabs);
      steps.forEach((t, i) => tabs.appendChild(h('button', { type: 'button', role: 'tab', 'aria-selected': String(i === step), class: i < step ? 'done' : '', onclick: () => go(i) }, h('span', { class: 'n' }, i + 1), t)));
      clear(body);
      const t = steps[step];
      if (t === 'Explain') explain(); else if (t === 'Worked example') worked(); else if (t === 'Who is right?') who(); else if (t === 'Now you') nowYou(); else onYourOwn();
      body.appendChild(nav());
    }
    function explain() {
      add(body, [h('div', { class: 'split' },
        h('div', null, h('p', { class: 'lede' }, s.intro),
          s.defs ? h('div', { class: 'card' }, h('h3', null, 'Definitions to learn word for word'), h('dl', { class: 'defs' }, s.defs.map(([t, d]) => [h('dt', null, t), h('dd', null, chem(d, 'cwrap'))]))) : null,
          h('div', { class: 'card', style: { marginTop: '14px' } }, h('h3', null, 'The rules'), h('ol', { class: 'rules' }, s.rules.map(r => h('li', null, chem(r, 'cwrap')))))),
        h('div', null,
          h('div', { class: 'callout trap' }, h('h4', null, 'IEB trap'), '✗ ', chem(s.trap.wrong, 'cwrap'), h('br'), '✓ ', chem(s.trap.right, 'cwrap')),
          h('div', { class: 'card', style: { marginTop: '14px' } }, h('h3', null, 'Try it in a lab'), h('div', { class: 'grid' }, s.tools.filter(id => S.tools[id]).map(S.toolCard)))))]);
    }
    function worked() {
      const w = s.worked;
      let shown = +(store.get('we-' + s.id, 0)) || 1;
      const list = h('div', { class: 'steps' }), ctl = h('div', { class: 'row', style: { marginTop: '10px' } });
      add(body, [h('div', { class: 'card' }, h('div', { class: 'row small muted', style: { justifyContent: 'space-between' } }, h('span', null, 'Worked example ' + w.n + ' · ' + w.title), h('span', null, w.marks + ' marks · ✓ = 1 mark')),
        h('p', { class: 'prompt' }, chem(w.q, 'cwrap')), h('p', { class: 'small muted' }, 'Cover the answer: write each step on paper first, then reveal it.'), list, ctl)]);
      function d() {
        clear(list); clear(ctl);
        w.steps.forEach((st, i) => list.appendChild(i < shown ? S.stepLine(st.cls || '', st.lab, chem(st.text, 'cwrap'), st.why) : h('div', { class: 'step locked' }, h('div', { class: 'lab' }, st.lab), h('div', { class: 'small muted' }, 'Write this step first.'))));
        if (shown < w.steps.length) add(ctl, [h('button', { class: 'btn', type: 'button', onclick: () => { shown++; d(); } }, 'Reveal the next step'), h('button', { class: 'btn ghost', type: 'button', onclick: () => { shown = w.steps.length; d(); } }, 'Show all')]);
        else ctl.appendChild(notice('ok', 'Now compare your working with the memo ticks. Every ✓ is a mark.'));
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
          h('div', { class: 'grid g3' }, wq.people.map((p, i) => h('button', { type: 'button', class: 'who' + (picked !== null ? (p.right ? ' right' : i === picked ? ' wrongc' : '') : ''), 'aria-pressed': String(picked === i), disabled: picked !== null, onclick: () => { picked = i; S.logAttempt({ kind: 'supported', section: s.id, id: 'who', correct: p.right ? 1 : 0, total: 1 }); d(); } },
            h('b', null, p.name), h('span', null, '“', chem(p.says, 'cwrap'), '”')))),
          picked !== null ? notice(wq.people[picked].right ? 'ok' : 'no', chem(wq.why, 'cwrap')) : h('p', { class: 'small muted' }, 'Decide, and say why the other two are wrong, before you tap.')]);
      }
      d();
    }
    function nowYou() {
      const area = h('div');
      add(body, [h('p', null, 'A fresh question on this section. Use the hints if you need them: they come one step at a time.'), area]);
      const fresh = () => { clear(area); S.renderQ(area, S.makeQ(s.id), { mode: 'supported', onNext: fresh }); area.appendChild(h('button', { class: 'btn ghost', type: 'button', style: { marginTop: '10px' }, onclick: fresh }, 'Another one')); };
      fresh();
    }
    function onYourOwn() {
      const area = h('div');
      add(body, [h('p', null, 'On your own: no hints until you have checked your answer. This one counts: the section is scheduled in Return later.'), area]);
      const fresh = () => {
        clear(area);
        S.renderQ(area, S.makeQ(s.id), { mode: 'independent', onNext: fresh, onAnswer: ok => {
          const p = store.get('routes', {}); p[s.id] = true; store.set('routes', p);
          area.appendChild(h('div', { class: 'card', style: { marginTop: '12px' } }, h('h3', null, ok ? 'Route complete ✓' : 'Route complete: come back to it'),
            h('p', null, ok ? 'This section comes back in Return later in a day or three.' : 'This section comes back tomorrow in Return later. Reread the rules first.'),
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
