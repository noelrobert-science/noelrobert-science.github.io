/* Electrochemistry Studio: app shell, helpers, router, learning record. No sign-in, no tracking:
   everything a learner does stays in this browser (localStorage), and a copy can be downloaded. */
(function () {
  'use strict';
  const EC = window.EC;
  const S = window.STUDIO = window.STUDIO || {};
  S.tools = S.tools || {};
  S.views = S.views || {};

  /* ---------- DOM helpers ---------- */
  function h(tag, attrs, ...kids) {
    const el = document.createElement(tag);
    if (attrs) for (const k in attrs) {
      const v = attrs[k];
      if (v === null || v === undefined || v === false) continue;
      if (k === 'class') el.className = v;
      else if (k === 'style' && typeof v === 'object') Object.assign(el.style, v);
      else if (k === 'html') el.innerHTML = v;
      else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2), v);
      else if (v === true) el.setAttribute(k, '');
      else el.setAttribute(k, v);
    }
    add(el, kids);
    return el;
  }
  function add(el, kids) {
    for (const c of kids.flat(Infinity)) {
      if (c === null || c === undefined || c === false) continue;
      el.appendChild(c instanceof Node ? c : document.createTextNode(String(c)));
    }
    return el;
  }
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => [...(r || document).querySelectorAll(s)];
  const clear = el => { while (el.firstChild) el.removeChild(el.firstChild); return el; };
  const chem = (s, cls) => h('span', { class: 'chem' + (typeof s === 'string' && s.length > 22 ? ' cwrap' : '') + (cls ? ' ' + cls : '') }, s);
  const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const pick = a => a[Math.floor(Math.random() * a.length)];
  const reduced = () => window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function seg(options, value, onChange) {
    const box = h('div', { class: 'seg', role: 'group' });
    options.forEach(([v, label]) => {
      const b = h('button', { type: 'button', 'aria-pressed': String(v === value), onclick: () => {
        $$('button', box).forEach(x => x.setAttribute('aria-pressed', 'false'));
        b.setAttribute('aria-pressed', 'true'); onChange(v);
      } }, label);
      box.appendChild(b);
    });
    return box;
  }
  function select(options, value, onChange, attrs) {
    const s = h('select', attrs || {});
    options.forEach(([v, label]) => { const o = h('option', { value: v }, label); if (v === value) o.selected = true; s.appendChild(o); });
    s.addEventListener('change', () => onChange(s.value));
    return s;
  }
  function stepLine(cls, label, value, why) {
    return h('div', { class: 'step ' + (cls || '') }, h('div', { class: 'lab' }, label), h('div', { class: 'val' }, value), why ? h('div', { class: 'why' }, why) : null);
  }
  function notice(kind, ...kids) { return h('div', { class: 'notice ' + (kind || '') }, ...kids); }
  // parse a number typed with a comma or a point; accepts the unicode minus
  function readNum(s) {
    if (s === null || s === undefined) return NaN;
    s = String(s).trim().replace(/−/g, '-').replace(/\s/g, '').replace(',', '.').replace(/[a-zA-Zμ·⁻³°]+$/, '');
    if (s === '' || s === '-' || s === '+') return NaN;
    return Number(s);
  }
  function close(a, b, tol) { return Math.abs(a - b) <= (tol !== undefined ? tol : Math.max(0.011, Math.abs(b) * 0.011)); }

  /* ---------- storage (fails safely in private windows) ---------- */
  const KEY = 'ec-studio-v1';
  function load() { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; } }
  let DB = load();
  function save() { try { localStorage.setItem(KEY, JSON.stringify(DB)); } catch (e) { /* not stored */ } }
  const store = {
    get(k, d) { return DB[k] !== undefined ? DB[k] : d; },
    set(k, v) { DB[k] = v; save(); },
    all() { return DB; },
    reset() { DB = {}; save(); }
  };
  /* attempts: kind = 'supported' (practice with help available), 'independent' (help locked), 'delayed' (return later) */
  function logAttempt(a) {
    const list = store.get('attempts', []);
    list.push(Object.assign({ ts: Date.now() }, a));
    store.set('attempts', list.slice(-600));
    if (a.kind === 'independent' || a.kind === 'delayed') scheduleReview(a.section, a.correct >= a.total * 0.7);
  }
  // Return later: reviews after 1, 3, 7 and 21 days
  const GAPS = [1, 3, 7, 21];
  function scheduleReview(section, good) {
    if (!section) return;
    const rv = store.get('reviews', {});
    const cur = rv[section] || { step: -1 };
    const step = good ? Math.min(cur.step + 1, GAPS.length - 1) : 0;
    rv[section] = { step, due: Date.now() + GAPS[step] * 864e5, last: Date.now() };
    store.set('reviews', rv);
  }

  /* ---------- present mode ---------- */
  function setPresent(on) {
    document.body.classList.toggle('present', !!on);
    const b = $('#presentBtn'); if (b) { b.setAttribute('aria-pressed', String(!!on)); b.textContent = on ? 'Leave Present mode' : 'Present mode'; }
    try { sessionStorage.setItem('ec-present', on ? '1' : ''); } catch (e) { }
  }

  /* ---------- router ---------- */
  function parseHash() {
    const raw = decodeURIComponent((location.hash || '#start').slice(1));
    const [path, q] = raw.split('?');
    const parts = path.split('/');
    const params = {};
    (q || '').split('&').filter(Boolean).forEach(kv => { const [k, v] = kv.split('='); params[k] = v === undefined ? '1' : v; });
    return { view: parts[0] || 'start', arg: parts.slice(1).join('/'), params };
  }
  function go(hash) { if (location.hash === '#' + hash) route(); else location.hash = hash; }
  let cleanup = [];
  function onLeave(fn) { cleanup.push(fn); }
  function route() {
    cleanup.forEach(f => { try { f(); } catch (e) { } }); cleanup = [];
    const { view, arg, params } = parseHash();
    if (params.present) setPresent(true);
    const main = clear($('#main'));
    const navKey = view === 'lab' ? 'labs' : view === 'section' ? 'learn' : view;
    $$('.nav a').forEach(a => a.setAttribute('aria-current', a.dataset.v === navKey ? 'page' : 'false'));
    const v = S.views[view] || S.views.start;
    const wrap = h('div', { class: 'wrap' });
    main.appendChild(wrap);
    try { v(wrap, arg, params); } catch (e) { console.error(e); wrap.appendChild(notice('no', 'Something went wrong on this screen. Reload the page, or go back to the start. (' + e.message + ')')); }
    if (!params.keep) window.scrollTo(0, 0);
  }

  /* ---------- shared pieces ---------- */
  const MODS = {
    27: { title: 'Redox and Table 4', colour: '#1c64d6' },
    28: { title: 'Galvanic cells', colour: '#7048e8' },
    29: { title: 'Electrolytic cells and Faraday', colour: '#c92a2a' }
  };
  function legend() {
    return h('div', { class: 'legend' },
      h('span', { class: 'pill ox' }, 'blue · oxidation · anode · reducing agent'),
      h('span', { class: 'pill red' }, 'red · reduction · cathode · oxidising agent'),
      h('span', { class: 'pill el' }, 'dark grey · electrons'));
  }
  function toolHead(tool, sub) {
    return h('div', null,
      h('div', { class: 'crumbs' }, h('a', { href: '#labs' }, 'Labs'), ' › Module ' + tool.mod + ' · ' + MODS[tool.mod].title),
      h('div', { class: 'head' }, h('div', null, h('h2', null, tool.title), sub ? h('p', null, sub) : null)));
  }
  function backTo(section) {
    if (!section) return null;
    return h('p', { class: 'small no-present' }, 'Coursebook section ', h('a', { href: '#section/' + section }, section), '. ', h('a', { href: '#practise?s=' + section }, 'Practise this →'));
  }

  /* ---------- views: start, labs, lab, about ---------- */
  S.views.start = function (el) {
    const due = dueReviews();
    add(el, [
      h('section', { class: 'hero' },
        h('div', null,
          h('div', { class: 'eyebrow' }, 'Physical Sciences · Grade 12 IEB · Modules 27 to 29'),
          h('h1', null, 'Follow the electrons.'),
          h('p', { class: 'lede' }, 'Electrons always go from a stronger reducing agent to a stronger oxidising agent. Module 27 shows where they go (Table 4), Module 28 makes them go through a wire, and Module 29 pushes them the other way and counts them.'),
          h('div', { class: 'row' },
            h('a', { class: 'btn', href: '#lab/table4' }, 'Open the live Table 4'),
            h('a', { class: 'btn ghost', href: '#learn' }, 'Start a learning route'),
            h('a', { class: 'btn ghost', href: '#check' }, 'Check yourself'))),
        h('div', { class: 'card' },
          h('h3', null, 'How to use this studio'),
          h('ol', { class: 'rules' },
            h('li', null, h('b', null, 'Learn: '), 'one route per coursebook section: the rules, the worked example step by step, then a question with help fading.'),
            h('li', null, h('b', null, 'Labs: '), 'predict first, then watch. Every lab builds its answers from Table 4.'),
            h('li', null, h('b', null, 'Practise: '), 'fresh questions every time, hints in steps, and IEB past-paper questions.'),
            h('li', null, h('b', null, 'Check: '), 'a fresh mixed set with help locked until you submit.'),
            h('li', null, h('b', null, 'Return later: '), 'come back after 1, 3, 7 and 21 days.')),
          h('p', { class: 'small muted' }, 'Keep paper, a pencil, your calculator and your data sheet next to you. Nothing here needs AI, a sign-in or an internet connection once it has loaded.'))),
      due.length ? h('div', { class: 'callout warm' }, h('b', null, 'Return later: '), `${due.length} section${due.length > 1 ? 's are' : ' is'} due for review. `, h('a', { href: '#review' }, 'Start the review →')) : null,
      legend(),
      h('h2', null, 'Three modules, one engine'),
      h('div', { class: 'grid g3' }, [27, 28, 29].map(m => h('a', { class: 'card', href: '#learn?m=' + m, style: { '--bc': MODS[m].colour } },
        h('span', { class: 'tag' }, 'Module ' + m), h('b', null, MODS[m].title),
        h('small', null, (S.SECTIONS || []).filter(s => s.mod === m).map(s => s.id + ' ' + s.short).join(' · '))))),
      h('h2', { style: { marginTop: '28px' } }, 'Favourite labs'),
      h('div', { class: 'grid g3' }, ['table4', 'cell', 'electrolysis', 'faraday', 'membrane', 'she'].filter(id => S.tools[id]).map(toolCard))
    ]);
  };
  function toolCard(id) {
    const t = S.tools[id];
    return h('a', { class: 'card', href: '#lab/' + id, style: { '--bc': MODS[t.mod].colour } }, h('span', { class: 'tag' }, t.section || ('M' + t.mod)), h('b', null, t.title), h('small', null, t.blurb));
  }
  S.toolCard = toolCard;
  S.views.labs = function (el, arg, params) {
    add(el, [h('div', { class: 'head' }, h('div', null, h('h2', null, 'Labs'), h('p', null, 'Every lab has Explore (free play), Predict (commit first, then watch) and an exam question with memo ticks. Tap a card to open it.')))]);
    [27, 28, 29].forEach(m => {
      const ids = Object.keys(S.tools).filter(id => S.tools[id].mod === m && !S.tools[id].hidden);
      if (!ids.length) return;
      add(el, [h('h3', { style: { marginTop: '18px' } }, 'Module ' + m + ' · ' + MODS[m].title), h('div', { class: 'grid g3' }, ids.map(toolCard))]);
    });
  };
  S.views.lab = function (el, arg, params) {
    const t = S.tools[arg];
    if (!t) { S.views.labs(el); return; }
    add(el, [toolHead(t, t.blurb)]);
    const body = h('div');
    el.appendChild(body);
    t.render(body, params || {});
    add(el, [backTo(t.section)]);
  };
  S.views.about = function (el) {
    add(el, [
      h('h2', null, 'About this studio'),
      h('div', { class: 'grid g2' },
        h('div', { class: 'card' },
          h('h3', null, 'Acknowledgements'),
          h('p', null, 'Past-paper questions, memo answers and examiners’ report quotations are from the Independent Examinations Board (IEB) National Senior Certificate Physical Sciences Paper 2 (2020 to 2025, and May 2026), its marking guidelines and its examiners’ reports. They are reproduced here, with thanks to the IEB, for learners to practise with. Each question names its paper, year and question number. The diagrams of the original papers are described in words.'),
          h('p', null, 'Table 4 (the table of standard electrode potentials) is as printed on the IEB 2025 Paper 2 data sheet. Relative atomic masses are the data-sheet values used in the coursebooks.'),
          h('p', null, 'May 2026 questions have no official marking guideline yet: their answers are worked by us and are labelled “our answer, no official memo”.')),
        h('div', { class: 'card' },
          h('h3', null, 'Privacy'),
          h('p', null, 'No sign-in, no tracking and no cookies. Your answers and progress are kept only in this browser on this device. Nothing is sent anywhere, and nothing in this studio calls an AI service.'),
          h('p', null, 'To keep a copy, download your learning record from Return later.'),
          h('h3', null, 'How it was checked'),
          h('p', null, 'One chemistry engine drives every screen. Before anything else was built, it had to reproduce all 38 worked examples in Modules 27 to 29 exactly, and every pairing of Table 4 rows (1 896 set-ups, including electrolysis) is machine-checked for atom and charge balance.'),
          h('p', { class: 'muted small' }, 'Made by Mr N. Robert for his learners, to go with the Grade 11 and 12 IEB Physical Sciences coursebook, Modules 27 to 29. Status: for moderation.')))
    ]);
  };

  function dueReviews() {
    const rv = store.get('reviews', {});
    return Object.keys(rv).filter(k => rv[k].due <= Date.now());
  }

  /* expose */
  Object.assign(S, { h, add, $, $$, clear, chem, shuffle, pick, seg, select, stepLine, notice, readNum, close, store, logAttempt, scheduleReview, dueReviews, go, route, onLeave, MODS, legend, backTo, reduced, setPresent, GAPS });

  /* ---------- boot ---------- */
  function boot() {
    let pres = false; try { pres = sessionStorage.getItem('ec-present') === '1'; } catch (e) { }
    setPresent(pres);
    $('#presentBtn').addEventListener('click', () => setPresent(!document.body.classList.contains('present')));
    window.addEventListener('hashchange', route);
    route();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
