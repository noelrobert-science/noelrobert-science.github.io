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
      else if (k === 'style' && typeof v === 'object') { for (const p in v) { if (p.startsWith('--')) el.style.setProperty(p, v[p]); else el.style[p] = v[p]; } }
      else if (k === 'html') el.innerHTML = v;
      else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2), v);
      else if (v === true) el.setAttribute(k, '');
      else el.setAttribute(k, v);
    }
    add(el, kids);
    return el;
  }
  function add(el, kids) {
    const plain = PLAIN.test(el.tagName) || el.namespaceURI !== HTML;
    for (const c of kids.flat(Infinity)) {
      if (c === null || c === undefined || c === false) continue;
      el.appendChild(c instanceof Node ? c : (plain ? document.createTextNode(nb(String(c))) : typeset(nb(String(c)))));
    }
    return el;
  }
  /* Chemistry type (display only). The studio's font has no raised or lowered digit and sign characters, so the browser
     borrowed them from another font and they looked uneven. Each run of them is drawn as a real superscript or
     subscript in the studio's own font. The text itself does not change (copying, searching and every check still
     see Zn²⁺), so only the picture is new. Eθ is set as in the coursebook: θ raised, then cell, anode or cathode lowered. */
  const HTML = 'http://www.w3.org/1999/xhtml', PLAIN = /^(OPTION|TEXTAREA|TITLE|STYLE|SCRIPT)$/;
  const SUP = { '⁰': '0', '¹': '1', '²': '2', '³': '3', '⁴': '4', '⁵': '5', '⁶': '6', '⁷': '7', '⁸': '8', '⁹': '9', '⁺': '+', '⁻': '−' };
  const TYPE = /(?<![A-Za-z])E(θ)(?:(cell|cathode|anode|red|ox|OA|RA)(?![a-z]))?|([⁰¹²³⁴⁵⁶⁷⁸⁹⁺⁻]+)|([₀₁₂₃₄₅₆₇₈₉]+)/g;
  const NEEDS = /(?<![A-Za-z])Eθ|[⁰¹²³⁴⁵⁶⁷⁸⁹⁺⁻₀₁₂₃₄₅₆₇₈₉]/;
  const SKIP = 'svg, option, select, textarea, script, style, title, [contenteditable], .ts-up, .ts-dn, .ts-th, .ts-lo, .no-ts';
  // text that code writes later (textContent, lesson captions) is set the same way
  function typesetNode(t) {
    const p = t.parentElement;
    if (!p || !t.data || !NEEDS.test(t.data) || p.closest(SKIP)) return;
    p.replaceChild(typeset(t.data), t);
  }
  // in a drawing: raised and lowered tspans (dy moves the baseline; the next piece moves it back)
  const SVGNS = 'http://www.w3.org/2000/svg';
  function typesetSvg(t) {
    const p = t.parentNode;
    if (!p || !t.data || !NEEDS.test(t.data) || !/^(text|tspan)$/.test(p.localName) || p.closest('.ts-svg')) return;
    const s = t.data, f = document.createDocumentFragment();
    let last = 0, m, off = 0;
    const piece = (str, to, small) => { const sp = document.createElementNS(SVGNS, 'tspan'); sp.setAttribute('class', 'ts-svg');
      const dy = to - off; if (dy) sp.setAttribute('dy', dy.toFixed(2) + 'em'); off = to; if (small) sp.setAttribute('font-size', '72%'); sp.textContent = str; f.appendChild(sp); };
    TYPE.lastIndex = 0;
    while ((m = TYPE.exec(s))) {
      if (m.index > last) piece(s.slice(last, m.index), 0, false);
      if (m[1]) { piece('E', 0, false); piece('θ', -0.42, true); if (m[2]) piece(m[2], 0.22, true); }
      else if (m[3]) piece([...m[3]].map(c => SUP[c]).join(''), -0.42, true);
      else piece([...m[4]].map(c => String(c.charCodeAt(0) - 0x2080)).join(''), 0.22, true);
      last = TYPE.lastIndex;
    }
    piece(s.slice(last) || '\u200b', 0, false);
    p.replaceChild(f, t);
  }
  function typesetTree(root) {
    if (root.nodeType === 3) { if (root.parentNode && root.parentNode.namespaceURI === SVGNS) typesetSvg(root); else typesetNode(root); return; }
    if (root.nodeType !== 1) return;
    if (root.namespaceURI === SVGNS || root.querySelector('svg')) {
      const sw = document.createTreeWalker(root, NodeFilter.SHOW_TEXT), sl = [];
      while (sw.nextNode()) if (sw.currentNode.parentNode.namespaceURI === SVGNS) sl.push(sw.currentNode);
      sl.forEach(typesetSvg);
      if (root.namespaceURI === SVGNS) return;
    }
    if (root.closest(SKIP)) return;
    const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT), list = [];
    while (w.nextNode()) list.push(w.currentNode);
    list.forEach(typesetNode);
  }
  function typeset(s) {
    if (!NEEDS.test(s)) return document.createTextNode(s);
    const f = document.createDocumentFragment();
    let last = 0, m;
    const run = (cls, shown, raw) => { const o = document.createElement('span'); o.className = cls; o.setAttribute('data-t', shown);
      const r = document.createElement('span'); r.setAttribute('aria-hidden', 'true'); r.textContent = raw; o.appendChild(r); return o; };
    const span = (cls, t) => { const o = document.createElement('span'); o.className = cls; o.textContent = t; return o; };
    TYPE.lastIndex = 0;
    while ((m = TYPE.exec(s))) {
      if (m.index > last) f.appendChild(document.createTextNode(s.slice(last, m.index)));
      if (m[1]) { f.appendChild(document.createTextNode('E')); f.appendChild(span('ts-th', 'θ')); if (m[2]) f.appendChild(span('ts-lo', m[2])); }
      else if (m[3]) f.appendChild(run('ts-up', [...m[3]].map(c => SUP[c]).join(''), m[3]));
      else f.appendChild(run('ts-dn', [...m[4]].map(c => String(c.charCodeAt(0) - 0x2080)).join(''), m[4]));
      last = TYPE.lastIndex;
    }
    if (last < s.length) f.appendChild(document.createTextNode(s.slice(last)));
    return f;
  }
  // keep a number together on one line: digit groups (3 592,74), a power of ten (1,6 × 10⁻¹⁹) and the unit after a number (25 °C, 10⁵ Pa)
  function nb(s) {
    return s.replace(/(\d) (?=\d{3}(?!\d))/g, '$1\u00a0').replace(/ × (?=10[⁰¹²³⁴⁵⁶⁷⁸⁹⁻]+)/g, '\u00a0×\u00a0')
      .replace(/([\d⁰¹²³⁴⁵⁶⁷⁸⁹]) (?=(?:°C|k?Pa|V|A|C|g|mol|atm|dm³|cm³|s|min|h|K)(?![A-Za-zℓ]))/g, '$1\u00a0');
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
  // parse a number typed with a comma or a point; accepts the unicode minus and dashes, and a unit after the number
  // (0,39 dm3, 0,25 mol/dm3, -1,10 V). Standard form (1,93 × 10³) is not read, so the learner is asked to type it again.
  function readNum(s) {
    if (s === null || s === undefined) return NaN;
    s = String(s).replace(/[\u2010-\u2015\u2212]/g, '-').replace(/\s/g, '').replace(',', '.');
    const m = s.match(/^([+-]?(?:\d+(?:\.\d+)?|\.\d+|\d+\.$)(?:e[+-]?\d+)?)(?![\d.])(.*)$/i);
    if (!m || (m[2] && (!/^[a-zμ°]/i.test(m[2]) || /^x10/i.test(m[2])))) return NaN;
    return Number(m[1]);
  }
  function close(a, b, tol) { return Math.abs(a - b) <= (tol !== undefined ? tol : Math.max(0.011, Math.abs(b) * 0.011)); }

  /* ---------- storage (fails safely when the browser blocks saved site data) ---------- */
  const KEY = 'ec-studio-v1';
  let canSave = true;
  try { const t = '__ec_test'; localStorage.setItem(t, '1'); localStorage.removeItem(t); } catch (e) { canSave = false; }
  function load() { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; } }
  let DB = load();
  function save() { try { localStorage.setItem(KEY, JSON.stringify(DB)); } catch (e) { canSave = false; showSaveNote(); } }
  // another tab saved: take its copy, so the tab that saves last does not wipe the other tab's work
  window.addEventListener('storage', e => { if (e.key === KEY || e.key === null) DB = load(); });
  const store = {
    get(k, d) { return DB[k] !== undefined ? DB[k] : d; },
    set(k, v) { DB[k] = v; save(); },
    all() { return DB; },
    reset() { DB = {}; save(); },
    fresh() { if (canSave) DB = load(); } // re-read before a read-modify-write
  };
  const SAVE_NOTE = 'This browser is blocking saved site data, so your answers count for this visit only. Use “Download my record” in Return later before you close the tab.';
  function saveNote() { return canSave ? null : h('div', { class: 'notice warn save-note' }, SAVE_NOTE); }
  function showSaveNote() { const f = $('#saveNote'); if (f && !canSave && !f.textContent) f.textContent = SAVE_NOTE; }
  /* attempts: kind = 'supported' (practice with help available), 'independent' (help locked), 'delayed' (return later) */
  // running totals per section and kind: never trimmed, so old results never drop out of the record
  function tallies() {
    let t = store.get('tally');
    if (!t) { // first run after an update: build the totals once from the attempts already stored
      t = {};
      store.get('attempts', []).forEach(a => bump(t, a));
      store.set('tally', t);
    }
    return t;
  }
  function bump(t, a) {
    const k = a.kind === 'supported' ? 'sup' : a.kind === 'delayed' ? 'del' : 'ind';
    const s = t[a.section] = t[a.section] || { sup: [0, 0], ind: [0, 0], del: [0, 0] };
    s[k][0] += a.correct; s[k][1] += a.total;
  }
  function logAttempt(a) {
    store.fresh();
    const t = tallies();
    const list = store.get('attempts', []);
    list.push(Object.assign({ ts: Date.now() }, a));
    store.set('attempts', list.slice(-2000));
    bump(t, a); store.set('tally', t);
    if (a.kind === 'independent' || a.kind === 'delayed') scheduleReview(a.section, a.correct >= a.total * 0.7);
  }
  // Return later: reviews after 1, 3, 7 and 21 days, counted from midnight. A right answer before the section is due
  // is logged but does not move it further out; a wrong answer always brings it back tomorrow.
  const GAPS = [1, 3, 7, 21];
  function scheduleReview(section, good) {
    if (!section) return;
    const rv = store.get('reviews', {});
    const cur = rv[section] || { step: -1, due: 0 }, now = Date.now();
    const early = good && cur.step >= 0 && now < cur.due;
    const step = !good ? 0 : early ? cur.step : Math.min(cur.step + 1, GAPS.length - 1);
    const d = new Date(); d.setHours(0, 0, 0, 0);
    rv[section] = { step, due: early ? cur.due : d.getTime() + GAPS[step] * 864e5, last: now };
    store.set('reviews', rv);
  }
  // a screen-reader announcement, from one page-level live region
  function say(t) { const el = $('#say'); if (!el) return; el.textContent = ''; setTimeout(() => { el.textContent = t; }, 50); }
  // redraw a box and put the keyboard back on the same control
  // move focus to an element that stays (after the focused control was removed), without scrolling
  function focusTo(el) { if (!el) return; if (!el.matches('button, select, input, textarea, a[href], audio, [tabindex]')) el.tabIndex = -1; try { el.focus({ preventScroll: true }); } catch (e) { } }
  function keepFocus(box, redraw) {
    const Q = 'button, select, input, textarea, a[href], [tabindex="0"]';
    const a = document.activeElement;
    const i = a && box.contains(a) ? [...box.querySelectorAll(Q)].indexOf(a) : -1;
    redraw();
    if (i < 0) return;
    const t = box.querySelectorAll(Q)[i] || box.querySelectorAll(Q)[box.querySelectorAll(Q).length - 1];
    if (t && !t.disabled) t.focus({ preventScroll: true });
    else { const n = box.querySelector('.notice'); if (n) { n.tabIndex = -1; n.focus({ preventScroll: true }); } }
  }

  /* ---------- present mode ---------- */
  function setPresent(on) {
    document.body.classList.toggle('present', !!on);
    document.documentElement.classList.toggle('present', !!on);
    const b = $('#presentBtn'); if (b) { b.setAttribute('aria-pressed', String(!!on)); b.textContent = on ? 'Leave Present mode' : 'Present mode'; }
    try { sessionStorage.setItem('ec-present', on ? '1' : ''); } catch (e) { }
    PST = {}; presentSteps();
  }
  /* Present mode: the working in a lab appears one step at a time ("Next step →", → or Space; "Show all") */
  let PST = {}, prQueued = false;
  function presentSteps() {
    const on = document.body.classList.contains('present');
    $$('#main .steps').forEach((p, idx) => {
      if (p.closest('[data-noreveal]')) return;
      const items = [...p.children].filter(c => c.classList.contains('step'));
      let ctl = p.nextElementSibling && p.nextElementSibling.classList.contains('pr-ctl') ? p.nextElementSibling : null;
      if (!on || items.length < 2) { items.forEach(c => { if (c.dataset.prh) { c.hidden = false; delete c.dataset.prh; } }); if (ctl) ctl.remove(); return; }
      const sig = items.length + ':' + items.map(c => (c.querySelector('.lab') || {}).textContent || '').join('|');
      const st = PST[idx] && PST[idx].sig === sig ? PST[idx] : (PST[idx] = { sig, shown: 1 });
      items.forEach((c, i) => { const hide = i >= st.shown; if (hide) { c.hidden = true; c.dataset.prh = '1'; } else if (c.dataset.prh) { c.hidden = false; delete c.dataset.prh; } });
      if (st.shown >= items.length) { if (ctl) { const had = ctl.contains(document.activeElement); ctl.remove(); if (had) { const last = items[items.length - 1]; focusTo(last); say(last.textContent); } } return; }
      if (!ctl) {
        ctl = h('div', { class: 'row pr-ctl' }, h('button', { class: 'btn small', type: 'button', onclick: () => { st.shown++; presentSteps(); const shown = items[Math.min(st.shown, items.length) - 1]; if (shown) say(shown.textContent); } }, 'Next step →'),
          h('button', { class: 'btn ghost small', type: 'button', onclick: () => { st.shown = 1e9; presentSteps(); } }, 'Show all'));
        p.after(ctl);
      }
    });
  }
  function queuePresent() { if (prQueued) return; prQueued = true; requestAnimationFrame(() => { prQueued = false; presentSteps(); }); }

  /* ---------- router ---------- */
  const dec = s => { try { return decodeURIComponent(s); } catch (e) { return s; } };
  function parseHash() {
    const raw = (location.hash || '#start').slice(1);
    const [path, q] = raw.split('?');
    const parts = dec(path).split('/');
    const params = {};
    (q || '').split('&').filter(Boolean).forEach(kv => { const i = kv.indexOf('='); if (i < 0) params[dec(kv)] = '1'; else params[dec(kv.slice(0, i))] = dec(kv.slice(i + 1)); });
    return { view: parts[0] || 'start', arg: parts.slice(1).join('/'), params };
  }
  // keep a choice in the address without reloading the view, so a reload or a shared link opens it again
  function setParams(p) {
    const { view, arg, params } = parseHash();
    Object.assign(params, p);
    const qs = Object.keys(params).filter(k => params[k] !== null && params[k] !== undefined && params[k] !== '').map(k => k + '=' + encodeURIComponent(params[k])).join('&');
    history.replaceState(null, '', '#' + view + (arg ? '/' + arg : '') + (qs ? '?' + qs : ''));
  }
  function go(hash) { if (location.hash === '#' + hash) route(); else location.hash = hash; }
  let cleanup = [], booted = false;
  function onLeave(fn) { cleanup.push(fn); }
  function onLeaveNow() { cleanup.forEach(f => { try { f(); } catch (e) { } }); cleanup = []; }
  function route() {
    cleanup.forEach(f => { try { f(); } catch (e) { } }); cleanup = [];
    PST = {};
    const { view, arg, params } = parseHash();
    if (params.present) setPresent(true);
    const main = clear($('#main'));
    const navKey = view === 'lab' ? (arg === 'table4' && !document.body.classList.contains('present') ? 'table4-direct' : 'labs') : view === 'section' ? 'learn' : view;
    $$('.nav a').forEach(a => { if (a.dataset.v === navKey) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); });
    const cur = $('.nav a[aria-current="page"]');
    if (cur) { const w = cur.parentElement; w.scrollLeft += cur.getBoundingClientRect().left - w.getBoundingClientRect().left - (w.clientWidth - cur.offsetWidth) / 2; }
    const v = S.views[view] || S.views.start;
    const wrap = h('div', { class: 'wrap' });
    main.appendChild(wrap);
    try { v(wrap, arg, params); } catch (e) {
      console.error(e);
      // a mistyped or cut-off link: open the screen without the link's settings instead of an error
      clear(wrap);
      try { v(wrap, arg, {}); } catch (e2) { clear(wrap); S.views.start(wrap); }
    }
    const hd = wrap.querySelector('h1, h2');
    document.title = (hd ? hd.textContent + ' · ' : '') + 'Electrochemistry Studio';
    if (booted && hd) { hd.tabIndex = -1; hd.focus({ preventScroll: true }); }
    booted = true;
    if (!params.keep) window.scrollTo(0, 0);
    presentSteps();
  }

  /* ---------- shared pieces ---------- */
  // module colours stay outside the redox code (blue oxidation, red reduction, dark grey electrons)
  const MODS = {
    27: { title: 'Redox and Table 4', colour: '#00646b' },
    28: { title: 'Galvanic cells', colour: '#7048e8' },
    29: { title: 'Electrolytic cells and Faraday', colour: '#a35200' }
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
            h('a', { class: 'btn ghost', href: '#listen' }, '▶ Narrated lessons'),
            h('a', { class: 'btn ghost', href: '#check' }, 'Check yourself'))),
        h('div', { class: 'card' },
          h('h2', { class: 'h3' }, 'How to use this studio'),
          h('ol', { class: 'rules' },
            h('li', null, h('b', null, 'Learn: '), 'one route per coursebook section: the rules, the worked example step by step, then a question with help fading.'),
            h('li', null, h('b', null, 'Labs: '), 'predict first, then watch. Every lab builds its answers from Table 4.'),
            h('li', null, h('b', null, 'Lessons: '), 'six narrated lessons of about three minutes, each beside its live lab.'),
            h('li', null, h('b', null, 'Practise: '), 'fresh questions every time, hints in steps, and IEB past-paper questions.'),
            h('li', null, h('b', null, 'Check: '), 'a fresh mixed set with help locked until you submit.'),
            h('li', null, h('b', null, 'Return later: '), 'come back after 1, 3, 7 and 21 days.')),
          h('p', { class: 'small muted' }, 'Keep paper, a pencil, your calculator and your data sheet next to you. Nothing here needs AI or a sign-in. Once the studio has loaded, everything except the narrated lessons works without an internet connection.'))),
      due.length ? h('div', { class: 'callout warm' }, h('b', null, 'Return later: '), `${due.length} section${due.length > 1 ? 's are' : ' is'} due for review. `, h('a', { href: '#review' }, 'Start the review →')) : null,
      legend(),
      h('h2', null, 'Three modules, one engine'),
      h('div', { class: 'grid g3' }, [27, 28, 29].map(m => h('a', { class: 'card', href: '#learn?m=' + m, style: { '--bc': MODS[m].colour } },
        h('span', { class: 'tag' }, 'Module ' + m), h('b', null, MODS[m].title),
        h('small', null, (S.SECTIONS || []).filter(s => s.mod === m).map(s => s.id + ' ' + s.short).join(' · '))))),
      S.LESSONS ? h('h2', { style: { marginTop: '28px' } }, 'Narrated lessons') : null,
      S.LESSONS ? h('div', { class: 'grid g3' }, S.LESSONS.map(S.lessonCard)) : null,
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
    add(el, [h('div', { class: 'head' }, h('div', null, h('h2', null, 'Labs'), h('p', null, 'Every lab has Explore (free play), Predict (commit first, then watch) and an exam question with memo ticks from the coursebook. In the labs where you build the answer, you always commit before the lab checks it. Tap a card to open it.')))]);
    [27, 28, 29].forEach(m => {
      const ids = Object.keys(S.tools).filter(id => S.tools[id].mod === m && !S.tools[id].hidden);
      if (!ids.length) return;
      add(el, [h('h3', { style: { marginTop: '18px' } }, 'Module ' + m + ' · ' + MODS[m].title), h('div', { class: 'grid g3' }, ids.map(toolCard))]);
    });
  };
  S.views.about = function (el) {
    add(el, [
      h('h2', null, 'About this studio'),
      h('div', { class: 'grid g2' },
        h('div', { class: 'card' },
          h('h3', null, 'Acknowledgements'),
          h('p', null, 'Past-paper questions, memo answers and examiners’ report quotations are from the Independent Examinations Board (IEB) National Senior Certificate Physical Sciences Paper 2 (2020 to 2025, and May 2026), its marking guidelines and its examiners’ reports (2023 to 2025), with a few marking-guideline quotations from 2017 and 2019. Definitions are quoted from the IEB Physical Sciences Subject Assessment Guidelines (SAGS). They are reproduced here, with thanks to the IEB, for learners to practise with. Each question names its paper, year and question number. The diagrams of the original papers are described in words.'),
          h('p', null, 'Narrated lessons: the voice is a synthetic South African voice (Microsoft Azure text-to-speech, voice “Leah”), recorded in advance from scripts written for this studio and checked against the coursebook. Nothing is generated while you listen.'),
          h('p', null, 'Table 4 (the table of standard electrode potentials) is as printed on the IEB 2025 Paper 2 data sheet. Relative atomic masses are the data-sheet values used in the coursebooks.'),
          h('p', null, 'May 2026 questions have no official marking guideline yet: their answers are worked by us and are labelled “Our answer (no official memo)”.')),
        h('div', { class: 'card' },
          h('h3', null, 'Offline'),
          h('p', null, 'After your first visit, the studio works without the internet on this device: every page, lab and question. To keep the narrated lessons too, open a lesson and tap “Save for offline”. On a phone or iPad you can also add the studio to your home screen (Share › Add to Home Screen, or the browser menu › Install app).'),
          h('p', null, 'Updates still arrive: when you are online, the studio checks for a new version and offers “Refresh” when it is ready. The link stays the same.'),
          h('h3', null, 'Privacy'),
          h('p', null, 'No sign-in, no tracking and no cookies. Your answers and progress are kept only in this browser on this device (if the browser allows saved site data). Nothing is sent anywhere, and nothing in this studio calls an AI service.'),
          h('p', null, 'To keep a copy, download your learning record from Return later.'),
          h('h3', null, 'How it was checked'),
          h('p', null, 'One chemistry engine drives every screen. Before anything else was built, it had to reproduce every worked example in Modules 27 to 29 that has something to calculate, balance or predict (35 of the 38; WE 28.3, 28.9 and 28.10 are explained in words), and every pairing of Table 4 rows (1 901 set-ups, including electrolysis) is machine-checked for atom and charge balance. Each fix to the chemistry engine and the IEB bank added a test that fails on the old studio; the screens were checked in a browser at phone and laptop sizes and in Present mode.'),
          h('h3', null, 'Coming later'),
          h('p', null, 'For now the narrated audio lessons take the place of the planned MP4 videos. Short clips of real experiments will be added once they have been filmed and approved. Ideas planned for later: a mystery-metal investigation, catalyst or intermediate?, why electrolysis needs DC (with an AC animation), multiple-choice questions worked aloud, a mistake museum, an electrochemistry mini-paper, design challenges, and the coursebooks’ “Words that win marks” tables on the flip cards.'),
          h('p', { class: 'muted small' }, 'Made by Mr N. Robert for his learners, to go with the Grade 11 and 12 IEB Physical Sciences coursebook, Modules 27 to 29. Status: for moderation.')))
    ]);
  };

  function dueReviews() {
    const rv = store.get('reviews', {});
    return Object.keys(rv).filter(k => rv[k].due <= Date.now());
  }

  /* expose */
  Object.assign(S, { focusTo, h, add, $, $$, clear, chem, shuffle, pick, seg, select, stepLine, notice, readNum, close, store, logAttempt, scheduleReview, dueReviews, go, route, onLeave, MODS, legend, backTo, reduced, setPresent, GAPS,
    nb, say, keepFocus, typeset, typesetTree, tallies, saveNote, setParams, parseHash, presentSteps, onLeaveNow, toolHead, canSave: () => canSave });


  /* ---------- offline ---------- */
  // sw.js keeps the whole studio on this device after the first visit. When a new version is published, it downloads in the
  // background and this bar offers it; nothing reloads by itself, so a learner never loses an answer they are typing.
  const AUDIO_CACHE = 'ec-audio-v1';
  function offlineSetup() {
    if (!('serviceWorker' in navigator) || location.protocol === 'file:') return;
    let reloading = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => { if (reloading) location.reload(); });
    const offer = w => {
      if (!w || !navigator.serviceWorker.controller || $('#updateBar')) return;
      const bar = h('div', { id: 'updateBar', class: 'update-bar', role: 'status' }, h('span', null, 'A new version of the studio is ready.'),
        h('button', { class: 'btn small', type: 'button', onclick: () => { reloading = true; w.postMessage({ type: 'skip-waiting' }); } }, 'Refresh'),
        h('button', { class: 'btn ghost small', type: 'button', onclick: () => bar.remove() }, 'Later'));
      document.body.appendChild(bar);
    };
    navigator.serviceWorker.register('sw.js').then(reg => {
      offer(reg.waiting);
      reg.addEventListener('updatefound', () => { const w = reg.installing; if (w) w.addEventListener('statechange', () => { if (w.state === 'installed') offer(w); }); });
      // a studio left open all day still hears about updates
      setInterval(() => reg.update().catch(() => { }), 60 * 60 * 1000);
    }).catch(() => { });
  }
  // narrated lessons: kept on the device only when the learner asks (each is about 2 to 3 MB)
  const canKeep = () => 'caches' in window && 'serviceWorker' in navigator;
  async function lessonSaved(url) { try { const c = await caches.open(AUDIO_CACHE); return !!(await c.match(new URL(url, location.href).pathname)); } catch (e) { return false; } }
  async function saveLesson(url) {
    const c = await caches.open(AUDIO_CACHE), abs = new URL(url, location.href);
    const res = await fetch(abs.href, { cache: 'reload' });
    if (!res.ok) throw new Error('fetch');
    await c.put(abs.pathname, res);
  }
  async function forgetLesson(url) { const c = await caches.open(AUDIO_CACHE); await c.delete(new URL(url, location.href).pathname); }
  S.offline = { canKeep, lessonSaved, saveLesson, forgetLesson };

  /* ---------- boot ---------- */
  function boot() {
    let pres = false; try { pres = sessionStorage.getItem('ec-present') === '1'; } catch (e) { }
    setPresent(pres);
    $('#presentBtn').addEventListener('click', () => setPresent(!document.body.classList.contains('present')));
    const sk = $('.skip'); if (sk) sk.addEventListener('click', e => { e.preventDefault(); const m = $('#main'); const hd = m.querySelector('h1, h2'); (hd || m).tabIndex = -1; (hd || m).focus(); });
    showSaveNote();
    new MutationObserver(queuePresent).observe($('#main'), { childList: true, subtree: true });
    typesetTree(document.body);
    offlineSetup();
    new MutationObserver(ms => ms.forEach(m => { if (m.type === 'characterData') typesetTree(m.target); else m.addedNodes.forEach(typesetTree); }))
      .observe(document.body, { childList: true, subtree: true, characterData: true });
    $('#main').addEventListener('change', () => { PST = {}; queuePresent(); }, true);
    document.addEventListener('keydown', e => {
      if (!document.body.classList.contains('present') || e.altKey || e.ctrlKey || e.metaKey) return;
      if (e.target.closest && e.target.closest('input, select, textarea, button, a, audio, video, summary, [role=button], [role=slider], [tabindex="0"], [contenteditable]')) return;
      if (e.key !== 'ArrowRight' && e.key !== ' ') return;
      const b = $$('#main .pr-ctl button')[0]; if (b) { e.preventDefault(); b.click(); }
    });
    window.addEventListener('hashchange', route);
    route();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
