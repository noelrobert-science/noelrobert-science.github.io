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
        'The trap with the numbers': { lab: ['ruler', { times: '2' }], board: ['Multiply a half-reaction to balance electrons', 'NEVER multiply Eθ', 'Ag⁺ + e⁻ → Ag   Eθ = +0,80 V, also for ×2'] },
        'Your turn': { lab: ['halfrx'], board: ['Now try: write three half-reactions', 'Reduction: copy the row. Oxidation: backwards.'], links: [['#section/27.2', 'Learn › 27.2'], ['#lab/halfrx', 'Half-reaction builder']] }
      } },
    { id: 'L2', title: 'Will it react?', sections: ['27.3'], mod: 27,
      blurb: 'The one rule for spontaneous reactions, the memo sentence that earns the marks, and why water is always in the contest.',
      scenes: {
        'One rule': { lab: ['table4'], board: ['Under standard conditions, it reacts if the oxidising agent is LOWER in Table 4 than the reducing agent', 'Electrons run downhill: high on the right → low on the left'] },
        'Zinc in copper sulfate': { lab: ['testtube', { t: 'zn-cu' }], board: ['Cu²⁺ (+0,34 V) vs Zn²⁺ (−0,76 V)', 'Cu²⁺ is a stronger oxidising agent than Zn²⁺, so Cu²⁺ oxidises Zn to Zn²⁺', 'Reddish-brown copper forms; the blue colour fades'] },
        'Pause and predict': { lab: ['table4', { ra: 'Ag', oa: 'Fe²⁺' }], board: ['Silver wire in FeSO₄(aq)', 'Will it react? Say why in one sentence.'], after: ['No reaction.', 'Fe²⁺ (−0,44 V) is a weaker oxidising agent than Ag⁺ (+0,80 V), so Fe²⁺ cannot oxidise Ag to Ag⁺.'] },
        'The sentence that earns the marks': { board: ['X is a stronger oxidising agent ✓ than Y, so X oxidises Z to … ✓✓', 'Compare like with like: two oxidising agents, or two reducing agents', 'Use the agents the question names'] },
        'The trap': { board: ['✗ Silver is less reactive than iron.', '✓ Fe²⁺ is a weaker oxidising agent than Ag⁺.'] },
        'Water is always there': { lab: ['testtube', { t: 'fe-cu' }], board: ['Every solution contains water', 'Fe in CuSO₄(aq): Fe reduces Cu²⁺, not H₂O', 'H₂O (−0,83 V) is above Fe²⁺/Fe (−0,44 V): too weak to oxidise Fe'] },
        'Your turn': { lab: ['testtube'], board: ['Now try: the test-tube lab in Predict mode', 'Decide, write your sentence, then watch'], links: [['#lab/testtube', 'Test-tube lab'], ['#practise?s=27.3', 'Practise › 27.3']] }
      } },
    { id: 'L3', title: 'The galvanic cell', sections: ['28.1', '28.4', '28.6'], mod: 28,
      blurb: 'Making the electrons use a wire: anode and cathode, the half-reactions, what you would see, cell notation and Eθcell.',
      scenes: {
        'Make the electrons use a wire': { lab: ['cell', { l: 'Zn', r: 'Cu', predict: '1' }], board: ['Keep the two half-reactions apart', 'Electrons must travel through the wire: an electric current'] },
        'Pause and predict': { lab: ['cell', { l: 'Zn', r: 'Cu' }], board: ['Zn in Zn(NO₃)₂ and Cu in Cu(NO₃)₂', 'Which electrode is the anode?'], after: ['The zinc electrode is the anode (−): oxidation', 'Zn (−0,76 V) is a stronger reducing agent than Cu (+0,34 V)', 'Lower Eθ = anode'] },
        'The two half-reactions': { lab: ['cell', { l: 'Zn', r: 'Cu' }], board: ['Anode: Zn → Zn²⁺ + 2e⁻', 'Cathode: Cu²⁺ + 2e⁻ → Cu', 'Overall: Zn + Cu²⁺ → Zn²⁺ + Cu', 'Single arrows only'] },
        'Where the electrons go': { lab: ['cell', { l: 'Zn', r: 'Cu', run: '1' }], board: ['e⁻: Zn anode → wire → Cu cathode', 'Ions carry the charge in the solutions and salt bridge', 'Zn thins; copper coats the cathode; blue fades', 'Name the ELECTRODE, not the half-cell'] },
        'Cell notation': { lab: ['notation', { a: 'Zn', b: 'Cu' }], board: ['Zn | Zn²⁺ || Cu²⁺ | Cu', 'Anode left · salt bridge || · cathode right', 'No coefficients, no electrons'] },
        'How big is the push?': { lab: ['cell', { l: 'Zn', r: 'Cu' }], board: ['Eθcell = Eθcathode − Eθanode', 'Eθcell = 0,34 − (−0,76)', 'Eθcell = 1,10 V (positive: spontaneous under standard conditions)'] },
        'Your turn': { lab: ['cell', { predict: '1' }], board: ['Now try: pick two half-cells', 'Predict the anode and the electron direction, then play'], links: [['#lab/cell?predict=1', 'Galvanic cell lab'], ['#section/28.1', 'Learn › 28.1']] }
      } },
    { id: 'L4', title: 'The salt bridge', sections: ['28.2'], mod: 28,
      blurb: 'Why the current stops without it, which ions move where, the two functions the memo wants, and choosing the salt.',
      scenes: {
        'Take the bridge away': { lab: ['cell', { l: 'Zn', r: 'Cu', run: '1' }], beats: [{ cue: 0, word: 'lift', event: { bridge: 'none' } }], board: ['No salt bridge → no current', 'So what is the salt bridge doing?'] },
        'Charge builds up': { lab: ['cell', { l: 'Zn', r: 'Cu' }], board: ['Zinc half-cell: Zn²⁺ forms, + charge builds up', 'Copper half-cell: Cu²⁺ removed, − charge builds up', 'The build-up opposes the flow'] },
        'Pause and predict': { lab: ['cell', { l: 'Zn', r: 'Cu', run: '1' }], board: ['Salt bridge: KNO₃', 'Which ions move into the zinc half-cell?'], after: ['NO₃⁻ moves from the bridge into the zinc half-cell', 'Zn²⁺ moves from the zinc half-cell into the bridge', 'K⁺ moves from the bridge into the copper half-cell; NO₃⁻ moves from it into the bridge', 'Ions move both ways: out of the bridge and into it'] },
        'What the memo wants': { board: ['Completes the circuit ✓', 'Maintains electrical neutrality in the half-cells ✓', 'Name the ions and the half-cells'] },
        'The trap': { board: ['✗ Electrons flow through the salt bridge.', '✓ Electrons flow only in the wire and electrodes; ions carry the charge in the bridge.'] },
        'Choosing the salt': { lab: ['cell', { l: 'Cu', r: 'Ag', bridge: 'KCℓ', run: '1' }], board: ['The bridge ions must not react with either half-cell', 'KNO₃: nitrates form no precipitates', 'KCℓ next to Ag⁺: white AgCℓ precipitate', 'KCℓ next to MnO₄⁻: Cℓ⁻ is oxidised'] },
        'Your turn': { lab: ['cell', { l: 'Cu', r: 'Ag' }], board: ['Now try: change the salt bridge', 'Watch what each choice does to the voltage'], links: [['#lab/cell', 'Galvanic cell lab'], ['#section/28.2', 'Learn › 28.2']] }
      } },
    { id: 'L5', title: 'Electrolysis: the two contests', sections: ['29.1', '29.2', '29.3'], mod: 29,
      blurb: 'Pushing the electrons the other way: the cathode and anode contests, water as a player, concentration and active anodes.',
      scenes: {
        'Push the electrons the other way': { lab: ['electrolysis', { e: 'CuCℓ2-conc', predict: '0' }], board: ['A power supply forces a non-spontaneous reaction', 'Cathode: joined to (−), reduction', 'Anode: joined to (+), oxidation', 'Signs change; the jobs never do'] },
        'Two contests': { lab: ['electrolysis', { e: 'CuCℓ2-conc', predict: '0' }], board: ['Cathode: the strongest oxidising agent is reduced', 'Anode: the strongest reducing agent is oxidised', 'In solution, water is in both contests'] },
        'Water joins in': { lab: ['electrolysis', { e: 'CuSO4', predict: '0' }], board: ['Cathode: 2H₂O + 2e⁻ → H₂ + 2OH⁻   (−0,83 V)', 'Anode: 2H₂O → O₂ + 4H⁺ + 4e⁻   (+1,23 V)', 'Compare each ion with water'] },
        'Pause and predict': { lab: ['electrolysis', { e: 'NaCℓ-dil', predict: '0', run: '1' }], board: ['Dilute NaCℓ(aq), graphite electrodes', 'What forms at the cathode?'], after: ['H₂ and OH⁻: 2H₂O + 2e⁻ → H₂ + 2OH⁻', 'Na⁺ (−2,71 V) is a much weaker oxidising agent than H₂O (−0,83 V), so water is reduced'] },
        'The trap': { lab: ['electrolysis', { e: 'NaCℓ-molten', predict: '0' }], board: ['✗ Na⁺ is attracted to the cathode, so it is reduced.', '✓ Attraction decides where ions drift; Table 4 decides which species reacts.', 'Na forms only from molten NaCℓ'] },
        'Chloride: concentration matters': { lab: ['electrolysis', { e: 'NaCℓ-conc', predict: '0' }], board: ['Dilute (1 mol·dm⁻³, standard conditions): H₂O (+1,23 V) beats Cℓ⁻ (+1,36 V) → O₂ and H⁺', 'Concentrated: oxidation of Cℓ⁻ is predominant → Cℓ₂', 'Brine is used to make chlorine'] },
        'When the anode joins in': { lab: ['electrolysis', { e: 'CuSO4', anode: 'Cu', predict: '0' }], board: ['An active anode is in the anode contest too', 'Cu (+0,34 V) is a stronger reducing agent than H₂O', 'The copper anode is oxidised and dissolves', 'Inert: platinum and graphite'] },
        'Your turn': { lab: ['electrolysis', { predict: '1' }], board: ['Now try: choose an electrolyte', 'Predict both products, then run it'], links: [['#lab/electrolysis', 'Electrolysis lab'], ['#section/29.3', 'Learn › 29.3']] }
      } },
    { id: 'L6', title: 'Counting electrons: Faraday', sections: ['29.5'], mod: 29,
      blurb: 'The Faraday chain from current and time to mass, the half-reaction ratio the examiners keep seeing missed, and running it backwards.',
      scenes: {
        'Count the electrons': { lab: ['faraday', { steps: '0' }], board: ['The electrons in the wire make the product', 'Count the electrons → amount of product'] },
        'The chain': { lab: ['faraday', { steps: '0' }], board: ['I, t → q → n(e⁻) → ratio → n → m or V'] },
        'Step one: the charge': { lab: ['faraday', { steps: '1' }], board: ['q = It = (2)(1 930) = 3 860 C', 't in seconds: min × 60, h × 3 600'] },
        'Step two: moles of electrons': { lab: ['faraday', { steps: '2' }], board: ['n(e⁻) = q/F = 3 860 / 96 500', 'n(e⁻) = 0,04 mol', 'F = 96 500 C·mol⁻¹ (data sheet)'] },
        'Pause and predict': { lab: ['faraday'], board: ['Cu²⁺ + 2e⁻ → Cu', 'How many moles of Cu from 0,04 mol e⁻?'], after: ['n(Cu) = ½ × 0,04 = 0,02 mol', 'Each Cu needs 2e⁻'] },
        'Step three: the mass': { lab: ['faraday'], board: ['m = nM = (0,02)(63,5)', 'm = 1,27 g'] },
        'The trap the examiners keep seeing': { lab: ['faraday'], board: ['✗ n(Cu) = n(e⁻)', '“Many candidates are still neglecting to use the ratio in the half-reaction.” IEB examiners’ report 2025', 'Write the half-reaction first'] },
        'Running it backwards': { lab: ['faraday', { mode: 'reverse', I: '20', m: '15.9' }], board: ['15,9 g Cu at 20 A', 'n(Cu) → ×2 → n(e⁻) → ×F → q → ÷I → t', 't = 2 416,30 s (about 40 min)'] },
        'Your turn': { lab: ['faraday'], board: ['Now try: change I and t', 'Switch on two cells in series: one shared charge'], links: [['#lab/faraday', 'Faraday machine'], ['#practise?s=29.5', 'Practise › 29.5']] }
      } }
  ];
  S.LESSONS = LESSONS;
  const byId = id => LESSONS.find(l => l.id === id);
  /* Voices: Leah (synthetic South African voice) for every lesson; Mr Robert's own voice and face where he has recorded one.
     The learner's choice is remembered; Mr Robert is the default where it exists. */
  const leah = id => (S.LESSON_AUDIO || {})[id];
  const noel = id => ((S.LESSON_VOICES || {})[id] || {}).noel;
  const voiceOf = () => store.get('lesson-voice', 'noel');
  const audio = id => (voiceOf() === 'noel' && noel(id)) || leah(id);
  const mmss = (s, up) => { const v = up ? Math.round(s) : Math.floor(s); return Math.floor(v / 60) + ':' + String(v % 60).padStart(2, '0'); };
  S.lessonsFor = section => LESSONS.filter(l => l.sections.includes(section));
  S.lessonCard = l => {
    const a = audio(l.id), done = store.get('lessons', {})[l.id];
    return h('a', { class: 'card', href: '#listen/' + l.id, style: { '--bc': S.MODS[l.mod].colour } },
      h('span', { class: 'tag' }, 'Lesson ' + l.id.slice(1) + ' · ' + (a ? mmss(a.dur, true) : '') + (a && a.voice ? ' · ' + a.voice : '') + (done ? ' · heard ✓' : '')),
      h('b', null, '▶ ' + l.title), h('small', null, l.blurb));
  };

  S.views.listen = function (el, arg) {
    const l = byId(arg);
    if (!l || !audio(l.id)) return list(el);
    lesson(el, l);
  };

  function list(el) {
    add(el, [h('div', { class: 'head' }, h('div', null, h('h2', null, 'Narrated lessons'),
      h('p', null, 'Six short lessons, about three minutes each. Each plays beside the live lab it is about, and stops at every prediction so you can decide first. Lesson 4 is in Mr Robert’s own voice; the others are read by Leah, a South African voice, until he records them.'))),
      h('div', { class: 'grid g3' }, LESSONS.filter(l => audio(l.id)).map(S.lessonCard)),
      h('p', { class: 'small muted', style: { marginTop: '14px' } }, 'Headphones help in class. Every lesson has a full transcript, and the words appear on screen as they are spoken.'),
      S.offline && S.offline.canKeep() ? allRow() : null]);
  }

  // keep all six lessons on this device in one go
  function allRow() {
    const row = h('div', { class: 'row small', style: { marginTop: '6px' } }), urls = LESSONS.filter(l => audio(l.id)).map(l => 'audio/' + audio(l.id).folder + '/narration.mp3');
    const extra = LESSONS.filter(l => audio(l.id) && audio(l.id).face).map(l => 'audio/' + audio(l.id).folder + '/' + audio(l.id).face.src);
    const total = LESSONS.reduce((s, l) => s + ((audio(l.id) || {}).bytes || 0) + (((audio(l.id) || {}).face || {}).bytes || 0), 0);
    async function draw(msg) {
      const got = (await Promise.all(urls.map(S.offline.lessonSaved))).filter(Boolean).length;
      clear(row);
      add(row, [got === urls.length ? h('span', { class: 'tag tag-score' }, '✓ All six lessons saved for offline') :
        h('button', { class: 'btn ghost small', type: 'button', onclick: async e => {
          e.currentTarget.disabled = true; e.currentTarget.textContent = 'Saving…';
          let ok = true; for (const u of urls.concat(extra)) { try { if (!(await S.offline.lessonSaved(u))) await S.offline.saveLesson(u); } catch (err) { ok = false; } }
          await draw(ok ? 'Saved: the lessons now play without the internet.' : 'Some lessons could not be saved. Check the connection and try again.');
        } }, 'Save all lessons for offline' + (total ? ' (' + (total / 1048576).toFixed(0) + ' MB)' : '') + (got ? ' · ' + got + ' saved' : '')),
        msg ? h('span', { class: 'muted', role: 'status' }, msg) : null]);
    }
    draw();
    return row;
  }

  function lesson(el, l) {
    const A = audio(l.id), base = 'audio/' + A.folder + '/';
    const idx = LESSONS.indexOf(l), prev = LESSONS[idx - 1], next = LESSONS[idx + 1];
    let stopAtPredict = store.get('lesson-stop', true);
    const stopped = new Set();
    let scene = null, labKey = null, labCleanup = [], waiting = null;

    const player = h('audio', { controls: true, preload: 'none', src: base + 'narration.mp3', class: 'lesson-audio', 'aria-label': 'Narration: ' + l.title });
    const netMsg = h('div', { role: 'status' });
    // Save for offline: the narration is kept on this device, so the lesson plays without the internet
    const keepRow = h('div', { class: 'row small keep-row' });
    const mp3 = base + 'narration.mp3', faceUrl = A.face ? base + A.face.src : null, allBytes = (A.bytes || 0) + (A.face ? A.face.bytes || 0 : 0);
    const mb = allBytes ? ' (' + (allBytes / 1048576).toFixed(1).replace('.', ',') + ' MB)' : '';
    async function drawKeep(msg) {
      if (!S.offline || !S.offline.canKeep()) return;
      const saved = await S.offline.lessonSaved(mp3);
      clear(keepRow);
      add(keepRow, [saved ? h('span', { class: 'tag tag-score' }, '✓ Saved for offline') : null,
        h('button', { class: 'btn ghost small', type: 'button', onclick: async e => {
          const b = e.currentTarget; b.disabled = true; b.textContent = saved ? 'Removing…' : 'Saving…';
          try { if (saved) { await S.offline.forgetLesson(mp3); if (faceUrl) await S.offline.forgetLesson(faceUrl); } else { await S.offline.saveLesson(mp3); if (faceUrl) await S.offline.saveLesson(faceUrl); } await drawKeep(saved ? 'Removed from this device.' : 'Saved: this lesson now plays without the internet.'); }
          catch (err) { await drawKeep('Could not save it now. Check the connection and try again.'); }
          const nb = keepRow.querySelector('button'); if (nb) nb.focus({ preventScroll: true });
        } }, saved ? 'Remove from this device' : 'Save for offline' + mb),
        msg ? h('span', { class: 'muted', role: 'status' }, msg) : null]);
    }
    drawKeep();
    player.addEventListener('error', () => { clear(netMsg); netMsg.appendChild(S.notice('no', 'The narration needs an internet connection, or tap “Save for offline” next time you are online. The scenes, the board, the live lab and the transcript still work.')); });
    // voice switch (only where Mr Robert has recorded this lesson) and his face circle, which shows in the face-on scenes
    let showFace = store.get('lesson-face', true);
    const voiceRow = noel(l.id) && leah(l.id) ? h('div', { class: 'row small voice-row' }, h('span', { class: 'muted' }, 'Voice'),
      S.seg([['noel', 'Mr Robert'], ['leah', 'Leah']], A === noel(l.id) ? 'noel' : 'leah', v => { store.set('lesson-voice', v); S.onLeaveNow(); clear(el); lesson(el, l); }),
      A.face ? h('label', { class: 'row', style: { gap: '6px' } }, h('input', { type: 'checkbox', checked: showFace, onchange: e => { showFace = e.target.checked; store.set('lesson-face', showFace); syncFace(true); } }), 'Show Mr Robert') : null) : null;
    const face = A.face ? h('video', { class: 'lesson-face', muted: true, playsinline: true, preload: 'metadata', src: faceUrl, 'aria-hidden': 'true', tabindex: '-1' }) : null;
    if (face) { face.muted = true; face.setAttribute('playsinline', ''); face.addEventListener('error', () => { face.hidden = true; }); }
    function faceScene() { const t = player.currentTime; let st = null; A.scenes.forEach(sc => { if (t >= sc.a - 0.05) st = sc.t; }); return st; }
    function syncFace(force) {
      if (!face) return;
      const on = showFace && !face.hidden && A.face.scenes.includes(faceScene());
      face.classList.toggle('on', on);
      if (player.paused || !on) { if (!face.paused) face.pause(); if (force || Math.abs(face.currentTime - player.currentTime) > 0.08) { try { face.currentTime = player.currentTime; } catch (e) { } } return; }
      if (Math.abs(face.currentTime - player.currentTime) > 0.25) { try { face.currentTime = player.currentTime; } catch (e) { } }
      face.playbackRate = player.playbackRate;
      if (face.paused) face.play().catch(() => { });
    }
    const sceneTitle = h('div', { class: 'eyebrow', 'aria-live': 'polite' });
    const board = h('div', { class: 'board' });
    const caption = h('p', { class: 'caption', 'aria-hidden': 'true' });
    const waitBox = h('div');
    const sceneList = h('ol', { class: 'scenes' });
    const labBox = h('div', { class: 'lesson-lab' });
    const veilNote = h('p', { class: 'callout warm small', hidden: true }, 'Decide first: the lab shows the answer after the prediction.');
    const transcript = h('details', { class: 'card transcript' }, h('summary', null, 'Transcript'),
      A.cues.map((c, i) => h('p', { 'data-i': i }, h('button', { type: 'button', class: 'linkbtn cue', onclick: () => seek(c.a) }, c.x))),
      h('p', { class: 'small' }, h('a', { href: base + 'narration.vtt', download: A.folder + '.vtt' }, 'Download the captions (VTT)')));

    const stopToggle = h('label', { class: 'small row', style: { gap: '6px' } },
      h('input', { type: 'checkbox', checked: stopAtPredict, onchange: e => { stopAtPredict = e.target.checked; store.set('lesson-stop', stopAtPredict); } }),
      'Stop at each prediction so I can decide first');

    add(el, [
      h('div', { class: 'crumbs' }, h('a', { href: '#listen' }, 'Narrated lessons'), ' › Lesson ' + l.id.slice(1)),
      h('div', { class: 'head' }, h('div', null, h('h2', null, l.title), h('p', null, l.blurb))),
      h('div', { class: 'split sticky-left lesson' },
        h('div', null,
          h('div', { class: 'card lesson-player' }, voiceRow, player, netMsg, keepRow, stopToggle, sceneTitle, face ? h('div', { class: 'board-wrap' }, board, face) : board, waitBox, caption),
          h('div', { class: 'card', style: { marginTop: '12px' } }, h('h3', null, 'Scenes'), sceneList),
          transcript),
        h('div', null, h('p', { class: 'small muted no-present', style: { margin: '0 0 6px' } }, 'The live lab: it changes with each scene. Pause the lesson any time and try it yourself.'), veilNote, labBox)),
      h('div', { class: 'row', style: { marginTop: '18px', justifyContent: 'space-between' } },
        prev ? h('a', { class: 'btn ghost', href: '#listen/' + prev.id }, '← ' + prev.title) : h('span'),
        h('span', { class: 'small' }, 'Coursebook: ', l.sections.map((s, i) => [i ? ', ' : '', h('a', { href: '#section/' + s }, s)])),
        next ? h('a', { class: 'btn ghost', href: '#listen/' + next.id }, next.title + ' →') : h('span'))
    ]);

    A.scenes.forEach((sc, i) => sceneList.appendChild(h('li', { 'data-i': i }, h('button', { type: 'button', class: 'linkbtn', onclick: () => seek(sc.a) }, sc.t), ' ', h('span', { class: 'muted small' }, mmss(sc.a)))));

    // going back before a prediction makes the lesson stop there again
    const restop = t => stopped.forEach(pc => { if (pc.b > t) stopped.delete(pc); });
    function seek(t) { waiting = null; clear(waitBox); restop(t); player.currentTime = Math.max(0, t - 0.05); update(); player.play().catch(() => { }); }
    function predictCue(sc) { return A.cues.find(c => c.s === sc && (c.p || /Decide/.test(c.x))); }
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
        const own = Object.assign({}, spec[1] || {}); delete own.run; delete own.steps; // the link keeps the scene's set-up
        const qs = Object.keys(own).length ? '?' + new URLSearchParams(own) : '';
        labBox.appendChild(h('div', { class: 'row small', style: { justifyContent: 'space-between', margin: '0 0 6px' } }, h('b', null, t.title), h('a', { href: '#lab/' + t.id + qs }, 'Open this lab on its own →')));
        const body = h('div'); labBox.appendChild(body); t.render(body, Object.assign({}, spec[1] || {}));
      } catch (e) { console.error(e); }
      finally { S.onLeave = orig; }
    }
    S.onLeave(() => { player.pause(); player.removeAttribute('src'); player.load(); if (face) { face.pause(); face.removeAttribute('src'); face.load(); } labCleanup.forEach(f => { try { f(); } catch (e) { } }); });

    /* beats: a lab event at a word of a cue, e.g. the bridge lifts out as the narrator says "lift". The time comes from the
       word's place in the cue, so it works for both voices. Going back before a beat rebuilds the lab as it was. */
    const beatTime = (sc, bt) => {
      const cs = A.cues.filter(c => c.s === sc.t), c = cs[bt.cue || 0]; if (!c) return Infinity;
      const ws = c.x.toLowerCase().split(/\s+/), i = ws.findIndex(w => w.replace(/[^a-z']/g, '').startsWith(bt.word));
      return i < 0 ? c.a : c.a + (c.b - c.a) * i / ws.length;
    };
    let fired = new Set();
    function runBeats(meta, sc, t) {
      const bs = (meta && meta.beats) || [];
      bs.forEach(bt => {
        const at = beatTime(sc, bt);
        if (t >= at && !fired.has(bt)) {
          fired.add(bt);
          const target = labBox.lastChild; if (target) target.dispatchEvent(new CustomEvent('lesson-beat', { detail: Object.assign({ animate: !player.paused && t - at < 1.5 }, bt.event) }));
        } else if (t < at - 0.05 && fired.has(bt)) { fired.delete(bt); labKey = null; showLab(meta.lab); }
      });
    }
    function drawBoard(meta, sc) {
      clear(board);
      if (!meta) return;
      const pc = predictCue(sc.t);
      const revealed = isRevealed(pc, player.currentTime);
      const lines = meta.after && revealed ? meta.after : meta.board;
      add(board, [h('ul', null, (lines || []).map(x => h('li', null, chem(x, 'cwrap'))))]);
      if (meta.links) add(board, [h('div', { class: 'row', style: { marginTop: '8px' } }, meta.links.map(([href, txt]) => h('a', { class: 'btn small', href }, txt)))]);
    }

    let lastBoardKey = null, lastT = 0;
    const heard = new Set(); // cues reached while playing: the lesson counts as heard only when most of it was played
    const resume = () => { const pc = waiting; waiting = null; clear(waitBox); lastBoardKey = null; if (pc) player.currentTime = revealAt(pc); }; // skip the built-in thinking silence
    function update() {
      const t = player.currentTime;
      if (t < lastT - 1) restop(t);
      lastT = t;
      let si = 0;
      A.scenes.forEach((sc, i) => { if (t >= sc.a - 0.05) si = i; });
      const sc = A.scenes[si], meta = l.scenes[sc.t];
      if (scene !== si) {
        scene = si;
        sceneTitle.textContent = 'Scene ' + (si + 1) + ' of ' + A.scenes.length + ' · ' + sc.t;
        [...sceneList.children].forEach((li, i) => li.classList.toggle('on', i === si));
        if (meta && meta.lab !== undefined) { fired = new Set(); if (meta.beats) labKey = null; showLab(meta.lab); }
      }
      runBeats(meta, sc, t);
      const pc = predictCue(sc.t);
      if (pc && stopAtPredict && !player.paused && t >= pc.b && t < pc.b + 1.5 && !stopped.has(pc)) {
        stopped.add(pc);
        player.pause();
        waiting = pc;
        clear(waitBox);
        add(waitBox, [h('div', { class: 'callout warm', role: 'status' }, h('b', null, 'Your turn. '), 'Decide, and write your answer down. Then press Continue to hear it.',
          h('div', { class: 'row', style: { marginTop: '8px' } }, h('button', { class: 'btn', type: 'button', onclick: () => { resume(); S.focusTo(player); player.play().catch(() => { }); } }, 'Continue')))]);
        lastBoardKey = null;
      }
      const bk = si + ':' + (isRevealed(pc, t) ? 'after' : 'before');
      if (bk !== lastBoardKey) { lastBoardKey = bk; drawBoard(meta, sc); }
      // the veiled lab is also taken out of the tab order and the accessibility tree, so nobody can read the answer first
      const veil = !!(meta && meta.after && pc && !isRevealed(pc, t));
      labBox.classList.toggle('veiled', veil); labBox.inert = veil; veilNote.hidden = !veil;
      const cue = A.cues.find(c => t >= c.a - 0.05 && t <= c.b + 0.4);
      caption.textContent = cue ? cue.x : '';
      if (cue && !player.paused) heard.add(cue);
      [...transcript.querySelectorAll('p[data-i]')].forEach(p => { const on = !!cue && A.cues[+p.dataset.i] === cue; p.classList.toggle('on', on); if (on) p.setAttribute('aria-current', 'true'); else p.removeAttribute('aria-current'); });
    }
    player.addEventListener('timeupdate', update);
    if (face) ['play', 'pause', 'seeked', 'timeupdate', 'ratechange', 'ended'].forEach(ev => player.addEventListener(ev, () => syncFace(ev === 'seeked')));
    player.addEventListener('seeked', update);
    player.addEventListener('play', () => { if (waiting) resume(); });
    player.addEventListener('ended', () => {
      if (heard.size < 0.8 * A.cues.length) return;
      const done = store.get('lessons', {}); if (!done[l.id]) { done[l.id] = Date.now(); store.set('lessons', done); }
    });
    update();
  }
})();
