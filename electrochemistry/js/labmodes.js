/* Every lab: Explore, Predict and an exam question with memo ticks.
   Predict: the labs you watch ask for a prediction about the set-up on screen, and stay covered until you commit.
   Four labs (Live Table 4, Test-tube lab, Build a cell, Electrolysis) have their own Predict mode, and in the labs where
   you build an answer you always commit before the lab checks it.
   Exam question: the coursebook's Quick check questions for the lab's section, with the memo ticks. */
(function () {
  'use strict';
  const S = window.STUDIO;
  const { h, add, clear, chem, notice, seg, store } = S;
  const o = (t, ok, why) => ({ t, ok, why });

  // predictions about each watch lab's opening set-up
  const PREDICT = {
    zinc: { q: 'A strip of zinc is placed in blue copper(II) sulfate solution. Predict what you will see.',
      options: [o('The blue colour fades and a red-brown solid forms on the zinc', true, 'Cu²⁺ (+0,34 V) is a stronger oxidising agent than Zn²⁺ (−0,76 V), so Cu²⁺ oxidises Zn to Zn²⁺ and is reduced to copper.'),
        o('Nothing happens', false, 'Cu²⁺ (+0,34 V) is a stronger oxidising agent than Zn²⁺ (−0,76 V): it reacts.'),
        o('Bubbles of gas form on the zinc', false, 'No gas forms: copper is deposited.'), o('The solution turns a darker blue', false, 'Cu²⁺ is used up, so the blue fades.')] },
    ruler: { q: 'On the emf ruler the cathode row is Ag⁺/Ag (+0,80 V) and the anode row is Mg²⁺/Mg (−2,37 V). Predict the emf of the cell.',
      options: [o('3,17 V', true, 'Eθcell = Eθcathode − Eθanode = 0,80 − (−2,37) = 3,17 V: the distance between the two rows.'), o('1,57 V', false, 'That adds the values with their signs. Subtract: 0,80 − (−2,37).'),
        o('3,97 V', false, 'That doubles the silver value because the equation needs 2Ag⁺. Never multiply Eθ.'), o('−3,17 V', false, 'A galvanic cell has a positive emf: cathode minus anode.')] },
    she: { q: 'A standard Ag | Ag⁺ half-cell is connected to the standard hydrogen electrode, with the SHE as the anode. Predict the voltmeter reading.',
      options: [o('+0,80 V', true, 'The reading is Eθ of the other half-cell with its own sign: Eθcell = 0,80 − 0,00 = +0,80 V.'), o('−0,80 V', false, 'With the SHE as the anode, the reading is Eθ(Ag⁺/Ag) with its own sign.'),
        o('0,00 V', false, '0,00 V is the SHE itself.'), o('+1,60 V', false, 'Never multiply Eθ by the 2 in 2Ag⁺.')] },
    rundown: { q: 'The standard Zn–Cu cell (1,10 V) delivers a current for a long time. Predict the reading.',
      options: [o('It falls slowly to 0 V, as [Cu²⁺] falls and [Zn²⁺] rises', true, 'Cu²⁺ is a reactant and Zn²⁺ a product: as the cell runs the reverse reaction is favoured more and more, until equilibrium (a flat cell, 0 V).'),
        o('It stays at 1,10 V until the zinc is used up', false, 'The concentrations change as it runs, so the reading changes.'), o('It rises above 1,10 V', false, '[Cu²⁺], a reactant, falls.'), o('It drops to 0 V at once', false, 'It falls gradually.')] },
    resistance: { q: 'The switch is closed, so the H₂O₂–MnO₄⁻ cell (emf 0,83 V) delivers a current. Predict the voltmeter reading.',
      options: [o('Less than 0,83 V', true, 'The cell has internal resistance: some energy per coulomb is used inside the cell, so the potential difference is less than the emf (WE 28.10).'),
        o('Exactly 0,83 V', false, '0,83 V is the reading only when no current flows.'), o('More than 0,83 V', false, 'Energy is used inside the cell, not added.'), o('0 V', false, 'The cell still drives a current.')] },
    twoway: { q: 'CuCℓ₂(aq) is electrolysed: copper forms on electrode A, the cathode. The DC supply is then replaced by a voltmeter. Predict electrode A’s job now.',
      options: [o('It becomes the anode: the copper on it is oxidised', true, 'The cell runs backwards as a galvanic cell: Cu → Cu²⁺ + 2e⁻ at A, and Cℓ₂ is reduced at B. The signs stay; the jobs swap.'),
        o('It stays the cathode', false, 'Reduction now happens at B, where the chlorine is.'), o('It becomes the positive electrode', false, 'The signs stay: A is still negative. Its job changes.'), o('Nothing: no reaction without a supply', false, 'Cu + Cℓ₂ → Cu²⁺ + 2Cℓ⁻ is spontaneous (+1,02 V).')] },
    membrane: { q: 'Saturated brine is electrolysed in the membrane cell. Predict the product at the titanium anode.',
      options: [o('Cℓ₂ gas', true, 'The very high [Cℓ⁻] in saturated brine makes the oxidation of Cℓ⁻ predominant over water.'),
        o('O₂ gas', false, 'Under standard conditions water would win, but the [Cℓ⁻] is very high here. Dilute brine gives O₂ too.'), o('sodium metal', false, 'Na⁺ is never reduced in water, and reduction is at the cathode.'), o('H₂ gas', false, 'H₂ forms at the cathode.')] },
    plating: { q: 'A steel spoon (the cathode) is plated with copper from CuSO₄(aq), with a copper anode. Predict what happens to [Cu²⁺].',
      options: [o('It stays the same', true, 'Cu²⁺ is reduced on the spoon as fast as the copper anode is oxidised to Cu²⁺.'),
        o('It decreases', false, 'That happens with an inert anode, or in refining when impurities dissolve.'), o('It increases', false, 'Cu²⁺ forms and is used up at the same rate.'), o('It drops to zero', false, 'No.')] },
    faraday: { q: 'A current of 2 A flows through CuSO₄(aq) for 1 930 s. Predict the mass of copper deposited (Cu²⁺ + 2e⁻ → Cu, M = 63,5 g·mol⁻¹).',
      options: [o('1,27 g', true, 'q = It = 3 860 C; n(e⁻) = 3 860/96 500 = 0,04 mol; n(Cu) = ½ × 0,04 = 0,02 mol; m = 0,02 × 63,5 = 1,27 g.'),
        o('2,54 g', false, 'That uses n(e⁻) as n(Cu). Two electrons deposit one Cu atom.'), o('0,64 g', false, 'Check the ratio: n(Cu) = ½n(e⁻), not ¼.'), o('0,02 g', false, '0,02 is the number of moles: multiply by M.')] }
  };
  const OWN = { table4: { predict: '1' }, cell: { predict: '1' }, electrolysis: { predict: '1' }, testtube: {} };
  S.LAB_PREDICT = PREDICT;

  function predictCard(t, P, onDone) {
    const box = h('div', { class: 'card predict-card' });
    P = Object.assign({}, P, { options: S.shuffle(P.options) });
    let pick = null;
    function d() {
      clear(box);
      add(box, [h('div', { class: 'eyebrow' }, 'Predict first'), h('p', { class: 'prompt' }, chem(P.q, 'cwrap')),
        h('div', { class: 'choices' }, P.options.map((op, i) => h('button', { class: 'choice' + (pick !== null ? (op.ok ? ' right' : i === pick ? ' wrongc' : '') : ''), type: 'button', disabled: pick !== null, 'aria-pressed': String(pick === i),
          onclick: () => { pick = i; S.logAttempt({ kind: 'supported', section: t.section, id: 'predict-' + t.id, correct: op.ok ? 1 : 0, total: 1 }); d(); const n = box.querySelector('.notice'); if (n) { n.tabIndex = -1; n.focus({ preventScroll: true }); S.say(n.textContent); } onDone(); } },
          chem(op.t), pick !== null && op.ok ? h('span', { class: 'mark' }, ' ✓') : pick === i ? h('span', { class: 'mark' }, ' ✗') : null))),
        pick !== null ? notice(P.options[pick].ok ? 'ok' : 'no', h('span', null, (P.options[pick].ok ? 'Right. ' : 'Not this one. ') , chem(P.options[pick].ok ? P.options[pick].why : P.options[pick].why + ' ' + P.options.find(x => x.ok).why, 'cwrap'), ' Now watch the lab below.')) : h('p', { class: 'small muted' }, 'The lab opens when you have chosen.')]);
    }
    d();
    return box;
  }

  // the coursebook's Quick check questions for a section, one at a time, with memo ticks and self-marking
  function examCard(section) {
    const items = (window.BOOKCHECKS || {})[section] || [];
    const box = h('div', { class: 'card exam-card' });
    let k = 0, open = false;
    function d() {
      clear(box);
      if (!items.length) { box.appendChild(h('p', null, 'No exam question for this section yet.')); return; }
      const x = items[k], sec = S.sectionById(section), key = 'bc-' + section + '-' + k;
      const marks = store.get('bookmarks', {});
      add(box, [h('div', { class: 'row small muted', style: { justifyContent: 'space-between' } }, h('span', null, `Quick check ${section} · question ${k + 1} of ${items.length} (coursebook)`),
          h('span', null, `${x.m} mark${x.m > 1 ? 's' : ''} · ✓ = 1 mark`, marks[key] !== undefined ? h('span', { class: 'score-only' }, ` · you scored ${marks[key]}/${x.m}`) : null)),
        h('p', { class: 'prompt' }, chem(x.q, 'cwrap')),
        !open ? h('div', null, h('p', { class: 'small muted' }, 'Write your answer on paper first, as you would in the exam.'), h('button', { class: 'btn', type: 'button', onclick: () => { open = true; S.keepFocus(box, d); const s = box.querySelector('.sol'); if (s) { s.tabIndex = -1; s.focus({ preventScroll: true }); } } }, 'I have answered: show the memo'))
          : h('div', null, h('div', { class: 'sol' }, h('b', null, 'Memo'), x.a.split('\n').map(l => h('div', { class: 'ln' }, chem(l, 'cwrap')))),
            h('div', { class: 'row score-only', style: { marginTop: '8px' } }, h('span', { class: 'small' }, 'Count your ticks:'),
              Array.from({ length: x.m + 1 }, (_, i) => h('button', { type: 'button', class: 'btn small ' + (marks[key] === i ? 'on' : 'ghost'), 'aria-pressed': String(marks[key] === i), onclick: () => {
                store.fresh(); const m = store.get('bookmarks', {}), changed = m[key] !== i; m[key] = i; store.set('bookmarks', m);
                if (changed) S.logAttempt({ kind: 'supported', section, id: 'quickcheck', correct: i, total: x.m });
                S.keepFocus(box, d); S.say('Marked ' + i + ' out of ' + x.m + '.');
              } }, i + '/' + x.m))),
            marks[key] !== undefined && marks[key] < x.m ? h('div', { class: 'redo' }, h('b', null, 'Wrong? '), 'Reread ', h('a', { href: '#section/' + section }, sec ? sec.reread : 'section ' + section), ', then redo ', h('a', { href: '#practise?s=' + section }, 'a fresh question in Practise'), '.', x.redo ? h('span', null, ' Coursebook: ', chem(x.redo, 'cwrap')) : null) : null),
        items.length > 1 ? h('div', { class: 'row', style: { marginTop: '10px' } }, h('button', { class: 'btn ghost small', type: 'button', onclick: () => { k = (k + 1) % items.length; open = false; S.keepFocus(box, d); } }, 'Next exam question →')) : null]);
    }
    d();
    return box;
  }
  S.examCard = examCard;

  /* Save diagram as image (plan X6): the largest drawing in the lab, as a PNG at twice its size on a white background.
     Computed styles are copied inline so the picture matches the screen. Nothing leaves the device. */
  const PROPS = ['fill', 'fill-opacity', 'stroke', 'stroke-width', 'stroke-dasharray', 'stroke-opacity', 'stroke-linecap', 'stroke-linejoin', 'opacity',
    'font-family', 'font-size', 'font-weight', 'font-style', 'text-anchor', 'dominant-baseline', 'paint-order', 'letter-spacing', 'visibility', 'display'];
  function saveDiagram(root, name, msg) {
    const area = s => { const r = s.getBoundingClientRect(); return r.width * r.height; };
    const svgs = Array.from(root.querySelectorAll('svg')).filter(s => s.getBoundingClientRect().width > 120 && !s.closest('[inert]')).sort((a, b) => area(b) - area(a));
    if (!svgs.length) { msg('This screen has no drawing to save.'); return; }
    const svg = svgs[0], r = svg.getBoundingClientRect(), clone = svg.cloneNode(true);
    const src = [svg].concat(Array.from(svg.querySelectorAll('*'))), dst = [clone].concat(Array.from(clone.querySelectorAll('*')));
    src.forEach((el, i) => { const cs = getComputedStyle(el); dst[i].setAttribute('style', PROPS.map(p => p + ':' + cs.getPropertyValue(p)).join(';')); });
    clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    clone.setAttribute('width', Math.round(r.width)); clone.setAttribute('height', Math.round(r.height));
    const img = new Image();
    img.onload = () => {
      const c = document.createElement('canvas'); c.width = Math.round(r.width * 2); c.height = Math.round(r.height * 2);
      const g = c.getContext('2d'); g.fillStyle = '#ffffff'; g.fillRect(0, 0, c.width, c.height); g.drawImage(img, 0, 0, c.width, c.height);
      c.toBlob(b => {
        if (!b) { msg('The picture could not be made in this browser.'); return; }
        const a = h('a', { href: URL.createObjectURL(b), download: name + '.png' }); document.body.appendChild(a); a.click(); a.remove();
        setTimeout(() => URL.revokeObjectURL(a.href), 4000); msg('Saved ' + name + '.png to your downloads.');
      }, 'image/png');
    };
    img.onerror = () => msg('The picture could not be made in this browser.');
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(new XMLSerializer().serializeToString(clone));
  }
  S.saveDiagram = saveDiagram;

  S.views.lab = function (el, arg, params) {
    const t = S.tools[arg];
    if (!t) { S.views.labs(el); return; }
    add(el, [S.toolHead(t, t.blurb)]);
    const P = PREDICT[t.id], own = OWN[t.id];
    const modes = [['explore', 'Explore'], ['predict', 'Predict'], ['exam', 'Exam question']];
    let mode = ['explore', 'predict', 'exam'].includes(params.v) ? params.v : 'explore';
    const bar = h('div', { class: 'row lab-modes', style: { marginBottom: '12px' } }), body = h('div');
    add(el, [bar, body]);
    function drawBar() { clear(bar); const sg = seg(modes, mode, v => { mode = v; S.setParams({ v: v === 'explore' ? null : v }); S.onLeaveNow(); draw(); drawBar(); const b = bar.querySelector('[aria-pressed="true"]'); if (b) b.focus({ preventScroll: true }); }); sg.setAttribute('aria-label', 'Lab mode'); bar.appendChild(sg);
      const said = h('span', { class: 'small muted', role: 'status' });
      if (mode !== 'exam') add(bar, [h('button', { class: 'btn ghost small save-pic', type: 'button', onclick: () => saveDiagram(body, 'electrochemistry-' + t.id, m => { said.textContent = m; }) }, 'Save diagram as image'), said]); }
    function draw() {
      clear(body);
      const p = Object.assign({}, params); delete p.v;
      if (mode === 'exam') { add(body, [h('p', null, 'An exam-style question on section ' + t.section + ', from the coursebook’s Quick check. Switch to Explore above if you need to see the lab again.'), examCard(t.section)]); return; }
      if (mode === 'predict' && own) { body.appendChild(h('p', { class: 'small muted' }, 'This lab has its own Predict mode: commit to your answers, then watch.')); const lab = h('div'); body.appendChild(lab); t.render(lab, Object.assign(p, own)); return; }
      if (mode === 'predict' && P) {
        const lab = h('div', { class: 'veil-wrap veiled', 'data-veil': 'Make your prediction above: the lab opens when you have chosen.' });
        add(body, [predictCard(t, P, () => { lab.classList.remove('veiled'); lab.removeAttribute('data-veil'); lab.inert = false; }), lab]);
        lab.inert = true;
        t.render(lab, p);
        return;
      }
      if (mode === 'predict') { body.appendChild(h('div', { class: 'callout' }, h('h4', null, 'Predict'), 'In this lab you build the answer yourself, so you always commit before the lab checks it. Work it out on paper first, then build it.')); }
      const lab = h('div'); body.appendChild(lab); t.render(lab, p);
    }
    // the Save button only where the lab draws a diagram (some labs are tables or forms)
    const syncSave = () => { const b = bar.querySelector('.save-pic'); if (b) b.hidden = !Array.from(body.querySelectorAll('svg')).some(s => s.getBoundingClientRect().width > 120); };
    drawBar(); draw(); syncSave();
    new MutationObserver(syncSave).observe(body, { childList: true, subtree: true });
    add(el, [S.backTo(t.section)]);
  };
})();
