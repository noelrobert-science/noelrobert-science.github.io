/* Narrated lessons: six short audio lessons in a South African voice (Leah), each played beside the live lab it is about.
   As each scene starts, the board shows the key lines and the lab beside it changes to match. The lesson can stop by itself at
   every "Pause and predict" so the learner commits first. Timings come from lessons-data.js (narrate.py manifests). */
(function () {
  'use strict';
  const S = window.STUDIO;
  const { h, add, clear, chem, store } = S;

  /* lab: [toolId, params]. board: lines shown while the scene plays; after: lines shown once the prediction is answered. */
  const LESSONS = [
    { id: 'L1', title: 'Reading Table 4', sections: ['27.1', '27.2'], mod: 27,
      blurb: 'Oxidation, reduction and the two agents; how Table 4 is laid out; writing half-reactions; never multiply Eθ.',
      scenes: {
        'Follow the electrons': { lab: ['zinc'], board: ['Where do the electrons go?', 'Electrons lost = electrons gained'] },
        'Two words, two jobs': { lab: ['roles'], board: ['Oxidation = loss of electrons', 'Reduction = gain of electrons', 'Reducing agent: donates e⁻, is oxidised', 'Oxidising agent: accepts e⁻, is reduced'] },
        'Pause and predict': { lab: ['zinc'], board: ['Zn + Cu²⁺ → Zn²⁺ + Cu', 'Which species is the oxidising agent?'], after: ['Cu²⁺ is the oxidising agent: it accepts 2e⁻ and is reduced', 'Zn is the reducing agent. Cu is a product, not an agent.'] },
        'How Table 4 is laid out': { lab: ['table4'], board: ['Every row is a reduction half-reaction', 'Left column: oxidising agents, stronger going DOWN (F₂ strongest)', 'Right column: reducing agents, stronger going UP (Li strongest)'] },
        'Writing a half-reaction': { lab: ['table4', { ra: 'Zn', oa: 'Cu²⁺' }], board: ['Reduction: copy the row', 'Cu²⁺ + 2e⁻ → Cu', 'Oxidation: write the row backwards', 'Zn → Zn²⁺ + 2e⁻', 'Check atoms and charges'] },
        'The trap with the numbers': { lab: ['ruler'], board: ['Multiply a half-reaction to balance electrons', 'NEVER multiply Eθ', 'Ag⁺ + e⁻ → Ag   Eθ = +0,80 V, also for ×2'] },
        'Your turn': { lab: ['halfrx'], board: ['Now try: write three half-reactions', 'Reduction: copy the row. Oxidation: backwards.'], links: [['#section/27.2', 'Learn › 27.2'], ['#lab/halfrx', 'Half-reaction builder']] }
      } },
    { id: 'L2', title: 'Will it react?', sections: ['27.3'], mod: 27,
      blurb: 'The one rule for spontaneous reactions, the memo sentence that earns the marks, and why water is always in the contest.',
      scenes: {
        'One rule': { lab: ['table4'], board: ['It reacts if the oxidising agent is LOWER in Table 4 than the reducing agent', 'Electrons run downhill: high on the right → low on the left'] },
        'Zinc in copper sulfate': { lab: ['testtube', { t: 'zn-cu' }], board: ['Cu²⁺ (+0,34 V) vs Zn²⁺ (−0,76 V)', 'Cu²⁺ is the stronger oxidising agent, so Cu²⁺ oxidises Zn', 'Reddish-brown copper forms; the blue colour fades'] },
        'Pause and predict': { lab: ['table4', { ra: 'Ag', oa: 'Fe²⁺' }], board: ['Silver wire in FeSO₄(aq)', 'Will it react? Say why in one sentence.'], after: ['No reaction.', 'Fe²⁺ (−0,44 V) is a weaker oxidising agent than Ag⁺ (+0,80 V), so Fe²⁺ cannot oxidise Ag.'] },
        'The sentence that earns the marks': { board: ['X is a stronger oxidising agent ✓ than Y, so X oxidises Z ✓✓', 'Compare like with like: two oxidising agents, or two reducing agents', 'Use the agents the question names'] },
        'The trap': { board: ['✗ Silver is less reactive than iron.', '✓ Fe²⁺ is a weaker oxidising agent than Ag⁺.'] },
        'Water is always there': { lab: ['testtube', { t: 'fe-cu' }], board: ['Every solution contains water', 'Fe in CuSO₄(aq): Fe reduces Cu²⁺, not H₂O', 'H₂O (−0,83 V) is above Fe²⁺/Fe (−0,44 V): too weak to oxidise Fe'] },
        'Your turn': { lab: ['testtube'], board: ['Now try: the test-tube lab in Predict mode', 'Decide, write your sentence, then watch'], links: [['#lab/testtube', 'Test-tube lab'], ['#practise?s=27.3', 'Practise › 27.3']] }
      } },
    { id: 'L3', title: 'The galvanic cell', sections: ['28.1', '28.4', '28.6'], mod: 28,
      blurb: 'Making the electrons use a wire: anode and cathode, the half-reactions, what you would see, cell notation and Eθcell.',
      scenes: {
        'Make the electrons use a wire': { lab: ['cell', { l: 'Zn', r: 'Cu' }], board: ['Keep the two half-reactions apart', 'Electrons must travel through the wire: an electric current'] },
        'Pause and predict': { lab: ['cell', { l: 'Zn', r: 'Cu' }], board: ['Zn in Zn(NO₃)₂ and Cu in Cu(NO₃)₂', 'Which electrode is the anode?'], after: ['The zinc electrode is the anode (−): oxidation', 'Zn (−0,76 V) is a stronger reducing agent than Cu (+0,34 V)', 'Lower Eθ = anode'] },
        'The two half-reactions': { lab: ['cell', { l: 'Zn', r: 'Cu' }], board: ['Anode: Zn → Zn²⁺ + 2e⁻', 'Cathode: Cu²⁺ + 2e⁻ → Cu', 'Overall: Zn + Cu²⁺ → Zn²⁺ + Cu', 'Single arrows only'] },
        'Where the electrons go': { lab: ['cell', { l: 'Zn', r: 'Cu' }], board: ['e⁻: Zn anode → wire → Cu cathode', 'Ions carry the charge in the solutions and salt bridge', 'Zn thins; copper coats the cathode; blue fades', 'Name the ELECTRODE, not the half-cell'] },
        'Cell notation': { lab: ['notation'], board: ['Zn | Zn²⁺ || Cu²⁺ | Cu', 'Anode left · salt bridge || · cathode right', 'No coefficients, no electrons'] },
        'How big is the push?': { lab: ['cell', { l: 'Zn', r: 'Cu' }], board: ['Eθcell = Eθcathode − Eθanode', 'Eθcell = 0,34 − (−0,76)', 'Eθcell = 1,10 V (positive: spontaneous)'] },
        'Your turn': { lab: ['cell', { predict: '1' }], board: ['Now try: pick two half-cells', 'Predict the anode and the electron direction, then play'], links: [['#lab/cell?predict=1', 'Galvanic cell lab'], ['#section/28.1', 'Learn › 28.1']] }
      } },
    { id: 'L4', title: 'The salt bridge', sections: ['28.2'], mod: 28,
      blurb: 'Why the current stops without it, which ions move where, the two functions the memo wants, and choosing the salt.',
      scenes: {
        'Take the bridge away': { lab: ['cell', { l: 'Zn', r: 'Cu' }], board: ['No salt bridge → no current', 'So what is the salt bridge doing?'] },
        'Charge builds up': { lab: ['cell', { l: 'Zn', r: 'Cu' }], board: ['Zinc half-cell: Zn²⁺ forms, + charge builds up', 'Copper half-cell: Cu²⁺ removed, − charge builds up', 'The build-up opposes the flow'] },
        'Pause and predict': { lab: ['cell', { l: 'Zn', r: 'Cu' }], board: ['Salt bridge: KNO₃', 'Which ions move into the zinc half-cell?'], after: ['NO₃⁻ moves into the zinc half-cell', 'K⁺ moves into the copper half-cell', 'Ions move both ways'] },
        'What the memo wants': { board: ['Completes the circuit ✓', 'Maintains electrical neutrality in the half-cells ✓', 'Name the ions and the half-cells'] },
        'The trap': { board: ['✗ Electrons flow through the salt bridge.', '✓ Electrons flow only in the wire and electrodes; ions carry the charge in the bridge.'] },
        'Choosing the salt': { lab: ['cell', { l: 'Cu', r: 'Ag' }], board: ['The bridge ions must not react with either half-cell', 'KNO₃: nitrates form no precipitates', 'KCℓ next to Ag⁺: white AgCℓ precipitate', 'KCℓ next to MnO₄⁻: Cℓ⁻ is oxidised'] },
        'Your turn': { lab: ['cell', { l: 'Cu', r: 'Ag' }], board: ['Now try: change the salt bridge', 'Watch what each choice does to the voltage'], links: [['#lab/cell', 'Galvanic cell lab'], ['#section/28.2', 'Learn › 28.2']] }
      } },
    { id: 'L5', title: 'Electrolysis: the two contests', sections: ['29.1', '29.2', '29.3'], mod: 29,
      blurb: 'Pushing the electrons the other way: the cathode and anode contests, water as a player, concentration and active anodes.',
      scenes: {
        'Push the electrons the other way': { lab: ['electrolysis', { e: 'CuCℓ2-conc', predict: '0' }], board: ['A power supply forces a non-spontaneous reaction', 'Cathode: joined to (−), reduction', 'Anode: joined to (+), oxidation', 'Signs change; the jobs never do'] },
        'Two contests': { lab: ['electrolysis', { e: 'CuCℓ2-conc', predict: '0' }], board: ['Cathode: the strongest oxidising agent is reduced', 'Anode: the strongest reducing agent is oxidised', 'In solution, water is in both contests'] },
        'Water joins in': { lab: ['electrolysis', { e: 'NaCℓ-dil', predict: '0' }], board: ['Cathode: 2H₂O + 2e⁻ → H₂ + 2OH⁻   (−0,83 V)', 'Anode: 2H₂O → O₂ + 4H⁺ + 4e⁻   (+1,23 V)', 'Compare each ion with water'] },
        'Pause and predict': { lab: ['electrolysis', { e: 'NaCℓ-dil', predict: '0' }], board: ['Dilute NaCℓ(aq), graphite electrodes', 'What forms at the cathode?'], after: ['Hydrogen gas (and OH⁻)', 'Na⁺ (−2,71 V) is a much weaker oxidising agent than H₂O'] },
        'The trap': { lab: ['electrolysis', { e: 'NaCℓ-molten', predict: '0' }], board: ['✗ Na⁺ is attracted to the cathode, so it is reduced.', '✓ Attraction decides where ions drift; Table 4 decides which species reacts.', 'Na forms only from molten NaCℓ'] },
        'Chloride: concentration matters': { lab: ['electrolysis', { e: 'NaCℓ-conc', predict: '0' }], board: ['Dilute: H₂O (+1,23 V) beats Cℓ⁻ (+1,36 V) → O₂', 'Concentrated: oxidation of Cℓ⁻ is predominant → Cℓ₂', 'Brine is used to make chlorine'] },
        'When the anode joins in': { lab: ['electrolysis', { e: 'CuSO4', anode: 'Cu', predict: '0' }], board: ['An active anode is in the anode contest too', 'Cu (+0,34 V) is a stronger reducing agent than H₂O', 'The copper anode is oxidised and dissolves', 'Inert: platinum and graphite'] },
        'Your turn': { lab: ['electrolysis', { predict: '1' }], board: ['Now try: choose an electrolyte', 'Predict both products, then run it'], links: [['#lab/electrolysis', 'Electrolysis lab'], ['#section/29.3', 'Learn › 29.3']] }
      } },
    { id: 'L6', title: 'Counting electrons: Faraday', sections: ['29.5'], mod: 29,
      blurb: 'The Faraday chain from current and time to mass, the half-reaction ratio the examiners keep seeing missed, and running it backwards.',
      scenes: {
        'Count the electrons': { lab: ['faraday'], board: ['The electrons in the wire make the product', 'Count the electrons → amount of product'] },
        'The chain': { lab: ['faraday'], board: ['I, t → q → n(e⁻) → ratio → n → m or V'] },
        'Step one: the charge': { lab: ['faraday'], board: ['q = It = (2)(1 930) = 3 860 C', 't in seconds: min × 60, h × 3 600'] },
        'Step two: moles of electrons': { lab: ['faraday'], board: ['n(e⁻) = q/F = 3 860 / 96 500', 'n(e⁻) = 0,04 mol', 'F = 96 500 C·mol⁻¹ (data sheet)'] },
        'Pause and predict': { lab: ['faraday'], board: ['Cu²⁺ + 2e⁻ → Cu', 'How many moles of Cu from 0,04 mol e⁻?'], after: ['n(Cu) = ½ × 0,04 = 0,02 mol', 'Each Cu needs 2e⁻'] },
        'Step three: the mass': { lab: ['faraday'], board: ['m = nM = (0,02)(63,5)', 'm = 1,27 g'] },
        'The trap the examiners keep seeing': { lab: ['faraday'], board: ['✗ n(Cu) = n(e⁻)', '“Many candidates are still neglecting to use the ratio in the half-reaction.” IEB examiners’ report 2025', 'Write the half-reaction first'] },
        'Running it backwards': { lab: ['faraday'], board: ['15,9 g Cu at 20 A', 'n(Cu) → ×2 → n(e⁻) → ×F → q → ÷I → t', 't = 2 416,30 s (about 40 min)'] },
        'Your turn': { lab: ['faraday'], board: ['Now try: change I and t', 'Switch on two cells in series: one shared charge'], links: [['#lab/faraday', 'Faraday machine'], ['#practise?s=29.5', 'Practise › 29.5']] }
      } }
  ];
  S.LESSONS = LESSONS;
  const byId = id => LESSONS.find(l => l.id === id);
  const audio = id => (S.LESSON_AUDIO || {})[id];
  const mmss = s => Math.floor(s / 60) + ':' + String(Math.round(s % 60)).padStart(2, '0');
  S.lessonsFor = section => LESSONS.filter(l => l.sections.includes(section));
  S.lessonCard = l => {
    const a = audio(l.id), done = store.get('lessons', {})[l.id];
    return h('a', { class: 'card', href: '#listen/' + l.id, style: { '--bc': S.MODS[l.mod].colour } },
      h('span', { class: 'tag' }, 'Lesson ' + l.id.slice(1) + ' · ' + (a ? mmss(a.dur) : '') + (done ? ' · heard ✓' : '')),
      h('b', null, '▶ ' + l.title), h('small', null, l.blurb));
  };

  S.views.listen = function (el, arg) {
    const l = byId(arg);
    if (!l || !audio(l.id)) return list(el);
    lesson(el, l);
  };

  function list(el) {
    add(el, [h('div', { class: 'head' }, h('div', null, h('h2', null, 'Narrated lessons'),
      h('p', null, 'Six short lessons, about three minutes each, read by a South African voice. Each plays beside the live lab it is about, and stops at every prediction so you can decide first.'))),
      h('div', { class: 'grid g3' }, LESSONS.filter(l => audio(l.id)).map(S.lessonCard)),
      h('p', { class: 'small muted', style: { marginTop: '14px' } }, 'Headphones help in class. Every lesson has a full transcript, and the words appear on screen as they are spoken.')]);
  }

  function lesson(el, l) {
    const A = audio(l.id), base = 'audio/' + A.folder + '/';
    const idx = LESSONS.indexOf(l), prev = LESSONS[idx - 1], next = LESSONS[idx + 1];
    let stopAtPredict = store.get('lesson-stop', true);
    const stopped = new Set();
    let scene = null, labKey = null, labCleanup = [], waiting = null;

    const player = h('audio', { controls: true, preload: 'metadata', src: base + 'narration.mp3', class: 'lesson-audio' });
    const sceneTitle = h('div', { class: 'eyebrow', 'aria-live': 'polite' });
    const board = h('div', { class: 'board' });
    const caption = h('p', { class: 'caption', 'aria-hidden': 'true' });
    const waitBox = h('div');
    const sceneList = h('ol', { class: 'scenes' });
    const labBox = h('div', { class: 'lesson-lab', 'data-veil': 'Decide first: the lab shows the answer after the prediction.' });
    const transcript = h('details', { class: 'card transcript' }, h('summary', null, 'Transcript'),
      A.cues.map((c, i) => h('p', { 'data-i': i, onclick: () => seek(c.a) }, c.x)),
      h('p', { class: 'small' }, h('a', { href: base + 'narration.vtt', download: l.id + '-' + A.folder + '.vtt' }, 'Download the captions (VTT)')));

    const stopToggle = h('label', { class: 'small row', style: { gap: '6px' } },
      h('input', { type: 'checkbox', checked: stopAtPredict, onchange: e => { stopAtPredict = e.target.checked; store.set('lesson-stop', stopAtPredict); } }),
      'Stop at each prediction so I can decide first');

    add(el, [
      h('div', { class: 'crumbs' }, h('a', { href: '#listen' }, 'Narrated lessons'), ' › Lesson ' + l.id.slice(1)),
      h('div', { class: 'head' }, h('div', null, h('h2', null, l.title), h('p', null, l.blurb))),
      h('div', { class: 'split sticky-left lesson' },
        h('div', null,
          h('div', { class: 'card lesson-player' }, player, stopToggle, sceneTitle, board, waitBox, caption),
          h('div', { class: 'card', style: { marginTop: '12px' } }, h('h3', null, 'Scenes'), sceneList),
          transcript),
        h('div', null, h('p', { class: 'small muted no-present', style: { margin: '0 0 6px' } }, 'The live lab: it changes with each scene. Pause the lesson any time and try it yourself.'), labBox)),
      h('div', { class: 'row', style: { marginTop: '18px', justifyContent: 'space-between' } },
        prev ? h('a', { class: 'btn ghost', href: '#listen/' + prev.id }, '← ' + prev.title) : h('span'),
        h('span', { class: 'small' }, 'Coursebook: ', l.sections.map((s, i) => [i ? ', ' : '', h('a', { href: '#section/' + s }, s)])),
        next ? h('a', { class: 'btn ghost', href: '#listen/' + next.id }, next.title + ' →') : h('span'))
    ]);

    A.scenes.forEach((sc, i) => sceneList.appendChild(h('li', { 'data-i': i }, h('button', { type: 'button', class: 'linkbtn', onclick: () => seek(sc.a) }, sc.t), ' ', h('span', { class: 'muted small' }, mmss(sc.a)))));

    function seek(t) { waiting = null; clear(waitBox); player.currentTime = Math.max(0, t - 0.05); update(); player.play().catch(() => { }); }
    function predictCue(sc) { return A.cues.find(c => c.s === sc && /Decide/.test(c.x)); }
    /* the answer is shown on the board and in the lab only when the narrator starts giving it (the cue after the question) */
    function revealAt(pc) { const i = A.cues.indexOf(pc); return A.cues[i + 1] ? A.cues[i + 1].a - 0.1 : pc.b + 0.3; }
    function isRevealed(pc, t) { return !!pc && t >= revealAt(pc) && !waiting; }

    function showLab(spec) {
      const key = JSON.stringify(spec || null);
      if (key === labKey) return;
      labKey = key;
      labCleanup.forEach(f => { try { f(); } catch (e) { } }); labCleanup = [];
      clear(labBox);
      if (!spec) return;
      const t = S.tools[spec[0]];
      if (!t) return;
      const orig = S.onLeave;
      S.onLeave = f => labCleanup.push(f);
      try {
        labBox.appendChild(h('div', { class: 'row small', style: { justifyContent: 'space-between', margin: '0 0 6px' } }, h('b', null, t.title), h('a', { href: '#lab/' + t.id }, 'Open this lab on its own →')));
        const body = h('div'); labBox.appendChild(body); t.render(body, Object.assign({}, spec[1] || {}));
      } catch (e) { console.error(e); }
      finally { S.onLeave = orig; }
    }
    S.onLeave(() => { player.pause(); labCleanup.forEach(f => { try { f(); } catch (e) { } }); });

    function drawBoard(meta, sc) {
      clear(board);
      if (!meta) return;
      const pc = predictCue(sc.t);
      const revealed = isRevealed(pc, player.currentTime);
      const lines = meta.after && revealed ? meta.after : meta.board;
      add(board, [h('ul', null, (lines || []).map(x => h('li', null, chem(x, 'cwrap'))))]);
      if (meta.links) add(board, [h('div', { class: 'row', style: { marginTop: '8px' } }, meta.links.map(([href, txt]) => h('a', { class: 'btn small', href }, txt)))]);
    }

    let lastBoardKey = null;
    function update() {
      const t = player.currentTime;
      let si = 0;
      A.scenes.forEach((sc, i) => { if (t >= sc.a - 0.05) si = i; });
      const sc = A.scenes[si], meta = l.scenes[sc.t];
      if (scene !== si) {
        scene = si;
        sceneTitle.textContent = 'Scene ' + (si + 1) + ' of ' + A.scenes.length + ' · ' + sc.t;
        [...sceneList.children].forEach((li, i) => li.classList.toggle('on', i === si));
        if (meta && meta.lab !== undefined) showLab(meta.lab);
      }
      const pc = predictCue(sc.t);
      if (pc && stopAtPredict && !player.paused && t >= pc.b && t < pc.b + 1.5 && !stopped.has(pc)) {
        stopped.add(pc);
        player.pause();
        waiting = pc;
        clear(waitBox);
        add(waitBox, [h('div', { class: 'callout warm', role: 'status' }, h('b', null, 'Your turn. '), 'Decide, and write your answer down. Then press Continue to hear it.',
          h('div', { class: 'row', style: { marginTop: '8px' } }, h('button', { class: 'btn', type: 'button', onclick: () => { waiting = null; clear(waitBox); player.play().catch(() => { }); } }, 'Continue')))]);
        lastBoardKey = null;
      }
      const bk = si + ':' + (isRevealed(pc, t) ? 'after' : 'before');
      if (bk !== lastBoardKey) { lastBoardKey = bk; drawBoard(meta, sc); }
      labBox.classList.toggle('veiled', !!(meta && meta.after && pc && !isRevealed(pc, t)));
      const cue = A.cues.find(c => t >= c.a - 0.05 && t <= c.b + 0.4);
      caption.textContent = cue ? cue.x : '';
      [...transcript.querySelectorAll('p[data-i]')].forEach(p => p.classList.toggle('on', cue && A.cues[+p.dataset.i] === cue));
      if (t >= A.dur - 1) {
        const done = store.get('lessons', {}); if (!done[l.id]) { done[l.id] = Date.now(); store.set('lessons', done); }
      }
    }
    player.addEventListener('timeupdate', update);
    player.addEventListener('seeked', update);
    player.addEventListener('play', () => { if (waiting) { waiting = null; clear(waitBox); lastBoardKey = null; } });
    update();
  }
})();
