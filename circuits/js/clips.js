/* Circuits Studio: "Mr R explains" clip hooks.
   Every place a short teacher clip can go is a slot. A slot stays empty and hidden until
   clips/clips.json names a recorded clip for its id, so a learner never sees a dead button.
   clips.json: { "clips": { "<id>": { "label": "Making a scale", "src": "clips/g-scale.mp4",
     "vtt": "clips/g-scale.vtt", "poster": "clips/g-scale.jpg", "sec": 45 } } }
   #clips lists every slot (for writing scripts); add ?clips=show to any page to see where the slots sit. */
(function () {
  'use strict';
  var HOOKS = [
    { id: 'g-axes', where: 'Graph tool, step 1', about: 'The heading and the axes: which quantity goes on x, which on y, and units on both.' },
    { id: 'g-scale', where: 'Graph tool, step 2', about: 'Making a scale: 1, 2 or 5 per heavy line, and use more than half of each axis.' },
    { id: 'g-plot', where: 'Graph tool, step 3', about: 'Plotting a cross accurately.' },
    { id: 'g-line', where: 'Graph tool, step 4', about: 'The line of best fit: one straight line through the trend, not dot to dot.' },
    { id: 'g-grad', where: 'Graph tool, step 5', about: 'Gradient: a big triangle on the line, with points read from the line.' },
    { id: 'g-ymxc', where: 'Graph tool, step 6', about: 'What the gradient and the y-intercept mean (y = mx + c).' },
    { id: 'lab-meters', where: 'Every lab circuit', about: 'Where the ammeter and the voltmeter go, and how to read them.' },
    { id: 'lab-change', where: 'Every lab circuit', about: 'Predict first, then change one thing and read every meter.' },
    { id: 'exp-ohm', where: 'Experiment: Ohm’s law', about: 'How this experiment works and what to record.' },
    { id: 'exp-rules', where: 'Experiment: series and parallel rules', about: 'How this experiment works and what to record.' },
    { id: 'exp-emf-r', where: 'Experiment: emf and internal resistance', about: 'How this experiment works and what to record.' },
    { id: 'exp-power', where: 'Experiment: power and brightness', about: 'How this experiment works and what to record.' },
    { id: 'exp-kwh', where: 'Experiment: kWh and cost', about: 'How this experiment works and what to record.' },
    { id: 'ex-answer', where: 'Explain a change (every change)', about: 'Writing the cause-chain answer that earns the marks.' },
    { id: 'pr-working', where: 'Practise (every topic)', about: 'Setting out working: formula, substitution, answer with unit.' }
  ];
  var LIST = {}, loaded = false, slots = [];
  function show() { return /[?&]clips=show\b/.test(location.hash + location.search); }
  function hook(id) { for (var i = 0; i < HOOKS.length; i++) if (HOOKS[i].id === id) return HOOKS[i]; return null; }
  function el(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
  function mmss(s) { s = Math.round(s || 0); return Math.floor(s / 60) + ':' + ('0' + (s % 60)).slice(-2); }

  function player(box, c) {
    var wrap = el('div', 'clipplay'), v = document.createElement('video');
    v.controls = true; v.preload = 'metadata'; v.setAttribute('playsinline', ''); v.src = c.src; if (c.poster) v.poster = c.poster;
    if (c.vtt) { var t = document.createElement('track'); t.kind = 'captions'; t.srclang = 'en'; t.label = 'English'; t.src = c.vtt; t.default = true; v.appendChild(t); }
    wrap.tabIndex = -1;
    wrap.addEventListener('keydown', function (e) {                 /* the arrow keys jump 5 s, as Noel asked */
      if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { e.preventDefault(); v.currentTime = Math.max(0, Math.min(v.duration || 1e9, v.currentTime + (e.key === 'ArrowRight' ? 5 : -5))); }
    });
    var close = el('button', 'btn ghost small', 'Close');
    close.type = 'button'; close.onclick = function () { v.pause(); wrap.remove(); box.querySelector('.clipbtn').setAttribute('aria-expanded', 'false'); };
    wrap.appendChild(v); wrap.appendChild(close);
    return { wrap: wrap, v: v };
  }
  function fill(box) {
    var id = box.getAttribute('data-clip'), c = LIST[id];
    box.innerHTML = '';
    if (c && c.src) {
      box.hidden = false;
      var b = el('button', 'clipbtn', '');
      b.type = 'button'; b.setAttribute('aria-expanded', 'false');
      b.appendChild(el('span', 'clipplayicon', '▶'));
      b.appendChild(el('span', '', 'Mr R explains: ' + (c.label || (hook(id) || {}).about || id)));
      if (c.sec) b.appendChild(el('span', 'small muted', ' · ' + mmss(c.sec)));
      b.onclick = function () {
        var open = box.querySelector('.clipplay');
        if (open) { open.querySelector('video').pause(); open.remove(); b.setAttribute('aria-expanded', 'false'); return; }
        var p = player(box, c); box.appendChild(p.wrap); b.setAttribute('aria-expanded', 'true'); p.wrap.focus(); p.v.play().catch(function () {});
      };
      box.appendChild(b);
    } else if (show()) {
      box.hidden = false;
      box.appendChild(el('div', 'clipplan', 'Clip slot ' + id + ': ' + ((hook(id) || {}).about || '')));
    } else box.hidden = true;
  }
  function slot(id) {
    var box = el('div', 'clipslot'); box.setAttribute('data-clip', id); box.hidden = true;
    slots = slots.filter(function (s) { return s.isConnected; }); slots.push(box);
    if (loaded || show()) fill(box);
    return box;
  }
  function load() {
    if (typeof fetch !== 'function') return;
    fetch('clips/clips.json', { cache: 'no-cache' }).then(function (r) { return r.ok ? r.json() : {}; })
      .then(function (j) { LIST = (j && j.clips) || {}; loaded = true; slots.forEach(fill); })
      .catch(function () { loaded = true; });
  }
  load();

  var V = window.StudioViews = window.StudioViews || {};
  V.clips = function (arg, params, ctx) {                           /* for Noel: every slot, recorded or not */
    document.title = 'Clip slots · Circuits Studio';
    var h = ctx.h, rows = HOOKS.map(function (k) {
      var c = LIST[k.id];
      return h('tr', {}, [h('td', { text: k.id }), h('td', { text: k.where }), h('td', { text: k.about }), h('td', { text: c && c.src ? 'Recorded' + (c.sec ? ' (' + mmss(c.sec) + ')' : '') : 'Not yet' })]);
    });
    ctx.main.appendChild(h('div', { class: 'wrap' }, [
      h('h1', { text: 'Mr R explains: clip slots' }),
      h('p', { class: 'muted', text: 'For teachers. Each slot shows a “Mr R explains” button only once its clip is recorded and listed in clips/clips.json. Until then learners see nothing there.' }),
      h('div', { class: 'tablewrap' }, [h('table', { class: 'rec' }, [h('thead', {}, [h('tr', {}, [h('th', { text: 'Slot' }), h('th', { text: 'Where' }), h('th', { text: 'What it explains' }), h('th', { text: 'Clip' })])]), h('tbody', {}, rows)])])
    ]));
  };
  window.Clips = { HOOKS: HOOKS, slot: slot, reload: load, list: function () { return LIST; } };
})();
