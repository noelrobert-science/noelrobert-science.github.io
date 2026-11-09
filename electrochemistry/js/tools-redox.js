/* Module 27 labs: zinc in copper(II) sulfate up close (A1), who does what (A2), test-tube lab with
   explain-it-the-memo-way (A5, A6), is it redox? (A7) and the spectator spotter (A8). */
(function () {
  'use strict';
  const EC = window.EC, S = window.STUDIO;
  const { h, add, clear, chem, seg, select, stepLine, notice, shuffle, pick, logAttempt } = S;

  /* ---------- A1: zinc in copper(II) sulfate, up close ---------- */
  S.tools.zinc = {
    id: 'zinc', mod: 27, section: '27.1', title: 'Zinc in copper(II) sulfate, up close',
    blurb: 'Zinc atoms hand two electrons each to Cu²⁺ ions. Play it, or step through it one label at a time.',
    render(el) {
      const stage = h('div', { class: 'stage' });
      const svgBox = h('div'); const cap = h('div', { class: 'cap', 'aria-live': 'polite' }); const bar = h('div', { class: 'bar' });
      add(stage, [svgBox, cap, bar]);
      const side = h('div', { class: 'card' });
      add(el, [h('div', { class: 'split' }, stage, side)]);
      add(side, [h('h3', null, 'What to look for'),
        h('ol', { class: 'rules' },
          h('li', null, h('span', { class: 'k-ox' }, 'Oxidation: '), chem('Zn → Zn²⁺ + 2e⁻'), '. Zinc loses electrons: it is the reducing agent.'),
          h('li', null, h('span', { class: 'k-el' }, 'Electrons '), 'pass straight from a zinc atom to a copper(II) ion at the surface.'),
          h('li', null, h('span', { class: 'k-red' }, 'Reduction: '), chem('Cu²⁺ + 2e⁻ → Cu'), '. Cu²⁺ gains electrons: it is the oxidising agent.'),
          h('li', null, chem('SO₄²⁻'), ' drifts by unchanged: it is a spectator ion.')),
        h('div', { class: 'callout' }, h('h4', null, 'Net ionic equation'), chem('Zn + Cu²⁺ → Zn²⁺ + Cu'), h('br'), h('span', { class: 'small muted' }, 'Charge: +2 on each side. The blue colour fades because Cu²⁺ is used up.')),
        h('div', { class: 'callout trap' }, h('h4', null, 'IEB trap'), '✗ An oxidising agent is oxidised.', h('br'), '✓ An oxidising agent is reduced: it accepts electrons. It oxidises something else.')]);
      const W = 640, H = 360;
      let st, raf = null, playing = false;
      function reset() {
        cancelAnimationFrame(raf); playing = false;
        st = { zn: [], cu: [], so4: [], e: [], deposited: [], ev: 0, t: 0, phase: -1, labels: true };
        for (let k = 0; k < 7; k++) st.zn.push({ x: 92, y: 60 + k * 38, state: 'atom' });
        const spots = [[250, 80], [390, 70], [520, 110], [300, 190], [460, 200], [560, 270], [260, 300], [400, 300]];
        spots.forEach(([x, y], k) => st.cu.push({ x, y, x0: x, y0: y, state: 'ion', id: k }));
        [[340, 130], [470, 150], [220, 240], [360, 250], [540, 190]].forEach(([x, y]) => st.so4.push({ x, y, x0: x, y0: y, ph: Math.random() * 6 }));
        cap.textContent = 'Press Play, or Step to go one stage at a time.';
        draw(); drawBar();
      }
      const ease = t => t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
      // one event = one zinc atom reacting with one Cu²⁺ ion, in 4 stages
      function stageOf(ev, phase, p) {
        const zn = st.zn[ev], cu = st.cu[ev];
        if (!zn || !cu) return;
        if (phase === 0) { cu.x = cu.x0 + (zn.x + 30 - cu.x0) * ease(p); cu.y = cu.y0 + (zn.y - cu.y0) * ease(p); cap.textContent = 'A Cu²⁺ ion reaches the zinc surface.'; }
        if (phase === 1) { st.e = [0, 1].map(k => ({ x: zn.x + (cu.x - zn.x) * ease(Math.min(1, p * 1.2 - k * .2 < 0 ? 0 : p * 1.2 - k * .2)), y: zn.y - 6 + k * 12 })); cap.textContent = 'Oxidation: the zinc atom loses two electrons. Zn → Zn²⁺ + 2e⁻'; }
        if (phase === 2) { st.e = []; zn.state = 'ion'; cu.state = 'atom'; zn.x = 92 + 160 * ease(p); zn.y = zn.y; cu.x = 112 + (cu.x - 112) * (1 - ease(p)); cap.textContent = 'Reduction: the Cu²⁺ ion gains the two electrons and becomes a copper atom on the surface. Cu²⁺ + 2e⁻ → Cu'; }
        if (phase === 3) { cap.textContent = 'The Zn²⁺ ion drifts into the solution. SO₄²⁻ is unchanged: a spectator ion.'; zn.x = 252 + 60 * ease(p); zn.y = zn.y + (ev % 2 ? 1 : -1) * 30 * ease(p) / 10; }
      }
      function loop(ts) {
        if (!playing) return;
        st.t += 1 / 60;
        const dur = [1.4, 1.2, 1.2, 0.8];
        if (st.phase < 0) st.phase = 0;
        let p = st.t / dur[st.phase];
        if (p >= 1) { stageOf(st.ev, st.phase, 1); st.phase++; st.t = 0; if (st.phase > 3) { st.phase = 0; st.ev++; if (st.ev >= 7) { playing = false; cap.textContent = 'Seven zinc atoms have reacted. The strip is coated with copper and the blue colour has faded. Press Reset to start again.'; drawBar(); draw(); return; } } p = 0; }
        stageOf(st.ev, st.phase, p);
        st.so4.forEach(s => { s.ph += 0.02; s.x = s.x0 + Math.sin(s.ph) * 8; s.y = s.y0 + Math.cos(s.ph * .8) * 6; });
        draw();
        raf = requestAnimationFrame(loop);
      }
      function step() {
        playing = false; cancelAnimationFrame(raf);
        if (st.ev >= 7) return;
        if (st.phase < 0) st.phase = 0; else { st.phase++; if (st.phase > 3) { st.phase = 0; st.ev++; } }
        if (st.ev >= 7) { cap.textContent = 'All seven zinc atoms have reacted.'; draw(); return; }
        stageOf(st.ev, st.phase, 1); st.t = 0;
        if (st.phase === 1) st.e = [{ x: st.cu[st.ev].x - 6, y: st.zn[st.ev].y - 6 }, { x: st.cu[st.ev].x - 6, y: st.zn[st.ev].y + 6 }];
        draw(); drawBar();
      }
      function draw() {
        const left = st.cu.filter(c => c.state === 'ion').length;
        const blue = `rgba(70,140,220,${0.12 + 0.36 * left / 8})`;
        let s = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Zinc strip in copper(II) sulfate solution, particle view">`;
        s += `<rect x="20" y="20" width="${W - 40}" height="${H - 40}" rx="14" fill="${blue}" stroke="#7d93a5"/>`;
        s += `<text x="${W - 34}" y="44" text-anchor="end" font-size="13" fill="#17324d">CuSO₄(aq): ${left > 4 ? 'blue' : left > 1 ? 'paler blue' : 'almost colourless'}</text>`;
        s += `<rect x="40" y="30" width="56" height="${H - 60}" fill="#adb5bd" stroke="#6c757d"/><text x="68" y="${H - 38}" text-anchor="middle" font-size="12" fill="#212529">zinc</text>`;
        st.cu.filter(c => c.state === 'atom').forEach((c, k) => { s += `<circle cx="${c.x}" cy="${c.y}" r="15" fill="#b5651d" stroke="#7a3e10"/><text x="${c.x}" y="${c.y + 4}" text-anchor="middle" font-size="11" fill="#fff" font-weight="700">Cu</text>`; });
        st.zn.forEach(z => {
          if (z.state === 'atom') s += `<circle cx="${z.x}" cy="${z.y}" r="15" fill="#ced4da" stroke="#495057"/><text x="${z.x}" y="${z.y + 4}" text-anchor="middle" font-size="11" fill="#212529" font-weight="700">Zn</text>`;
          else s += `<circle cx="${z.x}" cy="${z.y}" r="16" fill="#e8f0fd" stroke="#1c64d6" stroke-width="2.5"/><text x="${z.x}" y="${z.y + 4}" text-anchor="middle" font-size="11" fill="#144a9e" font-weight="700">Zn²⁺</text>`;
        });
        st.cu.filter(c => c.state === 'ion').forEach(c => { s += `<circle cx="${c.x}" cy="${c.y}" r="16" fill="#fdecec" stroke="#c92a2a" stroke-width="2.5"/><text x="${c.x}" y="${c.y + 4}" text-anchor="middle" font-size="11" fill="#9b1c1c" font-weight="700">Cu²⁺</text>`; });
        st.so4.forEach(o => { s += `<circle cx="${o.x}" cy="${o.y}" r="17" fill="#f1f3f5" stroke="#868e96" stroke-dasharray="3 2"/><text x="${o.x}" y="${o.y + 4}" text-anchor="middle" font-size="10" fill="#495057">SO₄²⁻</text>`; });
        st.e.forEach(e => { s += `<circle cx="${e.x}" cy="${e.y}" r="6" fill="#343a40"/><text x="${e.x + 8}" y="${e.y - 6}" font-size="10" fill="#343a40" font-weight="700">e⁻</text>`; });
        if (st.labels && st.phase >= 0 && st.ev < 7) {
          const lab = ['', '① oxidation', '② reduction', '③ spectator unchanged'][st.phase];
          if (lab) s += `<rect x="${W - 250}" y="${H - 70}" width="220" height="32" rx="8" fill="#fff" stroke="#17324d"/><text x="${W - 140}" y="${H - 49}" text-anchor="middle" font-size="14" font-weight="700" fill="${st.phase === 1 ? '#1c64d6' : st.phase === 2 ? '#c92a2a' : '#495057'}">${lab}</text>`;
        }
        s += '</svg>';
        svgBox.innerHTML = s;
      }
      function drawBar() {
        clear(bar);
        add(bar, [h('button', { class: 'btn', type: 'button', onclick: () => { if (st.ev >= 7) reset(); if (S.reduced()) { step(); return; } playing = !playing; drawBar(); if (playing) raf = requestAnimationFrame(loop); } }, playing ? 'Pause' : 'Play'),
          h('button', { class: 'btn ghost', type: 'button', onclick: step }, 'Step'),
          h('button', { class: 'btn ghost', type: 'button', onclick: reset }, 'Reset'),
          h('span', { class: 'small muted' }, `Zinc atoms reacted: ${Math.min(st.ev, 7)} of 7`)]);
      }
      S.onLeave(() => { playing = false; cancelAnimationFrame(raf); });
      reset();
    }
  };

  /* ---------- A2: who does what? ---------- */
  const ROLE_ITEMS = [
    { eq: 'Zn + Cu²⁺ → Zn²⁺ + Cu', sp: { 'Zn': 'ra', 'Cu²⁺': 'oa', 'Zn²⁺': 'pox', 'Cu': 'pred' } },
    { eq: 'Mg + 2H⁺ + 2Cℓ⁻ → Mg²⁺ + 2Cℓ⁻ + H₂', sp: { 'Mg': 'ra', 'H⁺': 'oa', 'Cℓ⁻': 'spec', 'Mg²⁺': 'pox', 'H₂': 'pred' }, src: 'WE 27.1' },
    { eq: 'Cℓ₂ + 2K⁺ + 2Br⁻ → 2K⁺ + 2Cℓ⁻ + Br₂', sp: { 'Cℓ₂': 'oa', 'Br⁻': 'ra', 'K⁺': 'spec', 'Cℓ⁻': 'pred', 'Br₂': 'pox' }, src: 'IEB 2025 P2 Q6.1' },
    { eq: 'Zn + 2Ag⁺ + 2NO₃⁻ → Zn²⁺ + 2NO₃⁻ + 2Ag', sp: { 'Zn': 'ra', 'Ag⁺': 'oa', 'NO₃⁻': 'spec', 'Zn²⁺': 'pox', 'Ag': 'pred' }, src: 'WE 27.10' },
    { eq: 'Fe + Cu²⁺ + SO₄²⁻ → Fe²⁺ + SO₄²⁻ + Cu', sp: { 'Fe': 'ra', 'Cu²⁺': 'oa', 'SO₄²⁻': 'spec', 'Fe²⁺': 'pox', 'Cu': 'pred' } },
    { eq: '2Fe³⁺ + 2I⁻ → 2Fe²⁺ + I₂', sp: { 'Fe³⁺': 'oa', 'I⁻': 'ra', 'Fe²⁺': 'pred', 'I₂': 'pox' }, src: 'IEB 2025 P2 Q3.2' },
    { eq: '2Aℓ + 3Ni²⁺ + 6NO₃⁻ → 2Aℓ³⁺ + 6NO₃⁻ + 3Ni', sp: { 'Aℓ': 'ra', 'Ni²⁺': 'oa', 'NO₃⁻': 'spec', 'Aℓ³⁺': 'pox', 'Ni': 'pred' }, src: 'WE 27.3' },
    { eq: 'Br₂ + 2K⁺ + 2I⁻ → 2K⁺ + 2Br⁻ + I₂', sp: { 'Br₂': 'oa', 'I⁻': 'ra', 'K⁺': 'spec', 'Br⁻': 'pred', 'I₂': 'pox' }, src: 'WE 27.6' }
  ];
  const BINS = [['ra', 'Reducing agent (it is oxidised)', 'ox'], ['oa', 'Oxidising agent (it is reduced)', 'red'], ['pox', 'Product of oxidation', 'ox'], ['pred', 'Product of reduction', 'red'], ['spec', 'Spectator ion', '']];
  S.tools.roles = {
    id: 'roles', mod: 27, section: '27.1', title: 'Who does what?',
    blurb: 'Sort every species into its job. Catches the cross-over (the agent is the reactant) and K⁺ in KBr.',
    render(el) {
      let item, place, sel, result;
      const box = h('div', { class: 'card' });
      el.appendChild(box);
      function fresh() { item = pick(ROLE_ITEMS); place = {}; sel = null; result = null; draw(); }
      function draw() {
        clear(box);
        const species = Object.keys(item.sp);
        add(box, [h('p', { class: 'prompt' }, 'Tap a species, then tap the box for its job.'), h('div', { class: 'line-build', style: { borderStyle: 'solid' } }, chem(item.eq)),
          item.src ? h('p', { class: 'small muted' }, 'From ' + item.src) : null,
          h('div', { class: 'tiles', style: { margin: '12px 0' } }, species.filter(sp => !place[sp]).map(sp => h('button', { class: 'tile' + (sel === sp ? ' sel' : ''), type: 'button', onclick: () => { sel = sp; draw(); } }, sp))),
          h('div', { class: 'bins' }, BINS.map(([k, label, cls]) => h('div', { class: 'bin ' + cls, role: 'button', tabindex: '0', onclick: () => { if (sel) { place[sel] = k; sel = null; result = null; draw(); } }, onkeydown: e => { if (e.key === 'Enter' && sel) { place[sel] = k; sel = null; draw(); } } },
            h('h4', null, label), h('div', { class: 'tiles' }, species.filter(sp => place[sp] === k).map(sp => h('button', { class: 'tile', type: 'button', onclick: ev => { ev.stopPropagation(); delete place[sp]; result = null; draw(); } }, sp)))))),
          h('div', { class: 'row', style: { marginTop: '12px' } }, h('button', { class: 'btn', type: 'button', disabled: Object.keys(place).length < species.length, onclick: check }, 'Check'), h('button', { class: 'btn ghost', type: 'button', onclick: fresh }, 'New equation')),
          result]);
      }
      function check() {
        const msgs = []; let right = 0;
        Object.keys(item.sp).forEach(sp => {
          const want = item.sp[sp], got = place[sp];
          if (want === got) { right++; return; }
          if ((got === 'oa' && want === 'pred') || (got === 'ra' && want === 'pox')) msgs.push(`${sp} is a product. Name the reactant, never the product, as the agent.`);
          else if (sp === 'K⁺' && got === 'ra') msgs.push('K⁺ is a spectator. KBr(aq) holds K⁺ ions, not K atoms: K⁺ has already lost its electron and appears only on the left of Table 4. (Examiners’ report 2025: more than half the candidates chose potassium.)');
          else if (want === 'spec') msgs.push(`${sp} appears unchanged on both sides: it is a spectator ion.`);
          else if (got === 'spec') msgs.push(`${sp} changes (its charge or form changes), so it is not a spectator.`);
          else if (want === 'oa') msgs.push(`${sp} gains electrons: it is reduced, so it is the oxidising agent.`);
          else if (want === 'ra') msgs.push(`${sp} loses electrons: it is oxidised, so it is the reducing agent.`);
          else msgs.push(`${sp}: check which side of the arrow it is on.`);
        });
        const total = Object.keys(item.sp).length;
        logAttempt({ kind: 'supported', section: '27.1', id: 'roles', correct: right, total });
        result = right === total ? notice('ok', 'All correct. The oxidising agent is itself reduced; the reducing agent is itself oxidised.') : h('div', null, notice('no', h('ul', { style: { margin: 0, paddingLeft: '18px' } }, msgs.map(m => h('li', null, m)))), h('div', { class: 'redo' }, 'Wrong? Reread 27.1 (the exam recipe: name the reactant as the agent), then fix the boxes and check again.'));
        draw();
      }
      fresh();
    }
  };

  /* ---------- A5 + A6: test-tube lab with explain-it-the-memo-way ---------- */
  const TUBES = [
    { id: 'zn-cu', add: 'a zinc strip', into: 'copper(II) sulfate solution', ra: 'Zn', oa: 'Cu²⁺', sol: ['#78aee6', '#eef4f8'], coat: '#b5651d', strip: '#adb5bd', yes: 'The zinc is coated with a reddish-brown layer of copper and the blue colour fades.' },
    { id: 'cu-zn', add: 'a copper strip', into: 'zinc sulfate solution', ra: 'Cu', oa: 'Zn²⁺', sol: ['#f1f3f5', '#f1f3f5'], strip: '#c87533', no: 'No change: the copper stays shiny and the solution stays colourless.' },
    { id: 'cu-ag', add: 'a copper wire', into: 'silver nitrate solution', ra: 'Cu', oa: 'Ag⁺', sol: ['#f6f7f8', '#8fbbe8'], coat: '#ced4da', strip: '#c87533', yes: 'Grey-silver crystals of silver grow on the copper and the solution turns blue (Cu²⁺ forms).' },
    { id: 'ag-cu', add: 'a silver wire', into: 'copper(II) sulfate solution', ra: 'Ag', oa: 'Cu²⁺', sol: ['#78aee6', '#78aee6'], strip: '#ced4da', no: 'No change: the solution stays blue.' },
    { id: 'mg-h', add: 'magnesium ribbon', into: 'dilute hydrochloric acid', ra: 'Mg', oa: 'H⁺', sol: ['#f6f7f8', '#f6f7f8'], strip: '#dee2e6', bubbles: true, dissolve: true, yes: 'Bubbles of hydrogen gas form quickly and the magnesium dissolves.' },
    { id: 'zn-h', add: 'a zinc granule', into: 'dilute hydrochloric acid', ra: 'Zn', oa: 'H⁺', sol: ['#f6f7f8', '#f6f7f8'], strip: '#adb5bd', bubbles: true, yes: 'Bubbles of hydrogen gas form and the zinc slowly dissolves.' },
    { id: 'cu-h', add: 'a copper strip', into: 'dilute hydrochloric acid', ra: 'Cu', oa: 'H⁺', sol: ['#f6f7f8', '#f6f7f8'], strip: '#c87533', no: 'No bubbles and no change: copper does not react with dilute HCℓ.' },
    { id: 'fe-cu', add: 'an iron nail', into: 'copper(II) sulfate solution', ra: 'Fe', oa: 'Cu²⁺', sol: ['#78aee6', '#cfe3cf'], coat: '#b5651d', strip: '#868e96', yes: 'The nail is coated with reddish-brown copper; the blue colour fades to pale green (Fe²⁺).' },
    { id: 'ni-cu', add: 'a nickel strip', into: 'copper(II) sulfate solution', ra: 'Ni', oa: 'Cu²⁺', sol: ['#78aee6', '#a9d3b0'], coat: '#b5651d', strip: '#c9c9b8', yes: 'Copper coats the nickel; the solution turns from blue to green (Ni²⁺).' },
    { id: 'pb-zn', add: 'a lead strip', into: 'zinc nitrate solution', ra: 'Pb', oa: 'Zn²⁺', sol: ['#f6f7f8', '#f6f7f8'], strip: '#6c757d', no: 'No change.' },
    { id: 'cl-br', add: 'chlorine water', into: 'potassium bromide solution', ra: 'Br⁻', oa: 'Cℓ₂', sol: ['#f4f9e8', '#f0a24a'], liquid: true, yes: 'The colourless solution turns orange: bromine forms.' },
    { id: 'br-i', add: 'bromine water', into: 'potassium iodide solution', ra: 'I⁻', oa: 'Br₂', sol: ['#f4b26a', '#8a4b16'], liquid: true, yes: 'The orange solution turns brown: iodine forms.' },
    { id: 'br-cl', add: 'bromine water', into: 'potassium chloride solution', ra: 'Cℓ⁻', oa: 'Br₂', sol: ['#f4b26a', '#f4b26a'], liquid: true, no: 'It stays orange: no reaction.', src: 'IEB 2025 P2 Q6.4' },
    { id: 'i-br', add: 'iodine solution', into: 'potassium bromide solution', ra: 'Br⁻', oa: 'I₂', sol: ['#a3612a', '#a3612a'], liquid: true, no: 'It stays brown: no reaction.' },
    { id: 'fe3-i', add: 'iron(III) chloride solution', into: 'potassium iodide solution', ra: 'I⁻', oa: 'Fe³⁺', sol: ['#e9c46a', '#7a4113'], liquid: true, yes: 'The yellow-brown solution turns dark brown: iodine forms.' },
    { id: 'mno4-fe', add: 'acidified potassium permanganate', into: 'iron(II) sulfate solution', ra: 'Fe²⁺', oa: 'MnO₄⁻', raRow: 'Fe³⁺/Fe²⁺', sol: ['#7b2d8b', '#f3e7b6'], liquid: true, yes: 'The purple colour disappears; the solution turns pale yellow (Fe³⁺).', src: 'WE 27.4' },
    { id: 'cu-hno3', add: 'a copper strip', into: 'concentrated nitric acid', ra: 'Cu', oa: 'NO₃⁻', oaRow: 'NO₃⁻+H⁺/NO₂+H₂O', sol: ['#f6f7f8', '#5fa58f'], strip: '#c87533', bubbles: true, gas: '#a0522d', dissolve: true, yes: 'Brown NO₂ gas forms, the copper dissolves and the solution turns green-blue (Cu²⁺).' },
    { id: 'cu-hno3d', add: 'a copper strip', into: 'dilute nitric acid', ra: 'Cu', oa: 'NO₃⁻', oaRow: 'NO₃⁻+H⁺/NO+H₂O', sol: ['#f6f7f8', '#78aee6'], strip: '#c87533', bubbles: true, dissolve: true, yes: 'Colourless NO gas forms (it turns brown in air at the mouth of the tube), the copper dissolves and the solution turns blue.' }
  ];
  function tubeRows(t) {
    const raRow = t.raRow ? EC.rowByKey(t.raRow) : S.rowFor(t.ra, 'ra');
    const oaRow = t.oaRow ? EC.rowByKey(t.oaRow) : S.rowFor(t.oa, 'oa');
    return { raRow, oaRow };
  }
  S.TUBES = TUBES; S.tubeRows = tubeRows;
  S.tools.testtube = {
    id: 'testtube', mod: 27, section: '27.3', title: 'Test-tube lab',
    blurb: 'Predict YES or NO, explain it the memo way, then watch: a coating, a colour fading, bubbles, orange turning brown.',
    render(el, params) {
      let t = TUBES.find(x => x.id === params.t) || TUBES[0], st;
      const left = h('div'), right = h('div');
      add(el, [h('div', { class: 'split' }, left, right)]);
      function reset() { st = { guess: null, slots: {}, ran: false, p: 0, checked: null }; draw(); }
      function draw() {
        const { raRow, oaRow } = tubeRows(t);
        const reacts = EC.reacts(raRow, oaRow);
        clear(left); clear(right);
        const stage = h('div', { class: 'stage' }), svgBox = h('div');
        add(stage, [svgBox, h('div', { class: 'bar' },
          select(TUBES.map(x => [x.id, `${x.add} → ${x.into}`]), t.id, v => { t = TUBES.find(x => x.id === v); reset(); }, { 'aria-label': 'Experiment' }),
          h('button', { class: 'btn', type: 'button', disabled: !st.guess, onclick: run }, st.guess ? 'Run it' : 'Predict first'),
          h('button', { class: 'btn ghost', type: 'button', onclick: () => { t = pick(TUBES.filter(x => x !== t)); reset(); } }, 'Another experiment'))]);
        left.appendChild(stage);
        st.svgBox = svgBox; st.reacts = reacts;
        svgBox.innerHTML = tubeSVG(t, reacts, st.ran ? st.p : 0);
        // right: predict + explain
        add(right, [h('div', { class: 'card' },
          h('p', { class: 'prompt' }, `Add ${t.add} to ${t.into}. Will a spontaneous reaction take place?`),
          t.src ? h('p', { class: 'small muted' }, 'Based on ' + t.src) : null,
          h('div', { class: 'row' }, ['YES', 'NO'].map(v => h('button', { class: 'btn ' + (st.guess === v ? 'on' : 'ghost'), type: 'button', 'aria-pressed': String(st.guess === v), onclick: () => { st.guess = v; draw(); } }, v)), h('span', { class: 'small muted' }, 'Always circle one option: an empty choice scores nothing.')),
          h('h3', { style: { marginTop: '16px' } }, 'Explain it the memo way'),
          explainSlots(raRow, oaRow, st),
          h('div', { class: 'row', style: { marginTop: '10px' } }, h('button', { class: 'btn ghost', type: 'button', onclick: () => { st.checked = checkSlots(raRow, oaRow, st); draw(); } }, 'Check my explanation')),
          st.checked,
          st.ran ? result(raRow, oaRow, reacts) : null)]);
      }
      function result(raRow, oaRow, reacts) {
        const right = (st.guess === 'YES') === reacts;
        if (!st.logged) { st.logged = 1; logAttempt({ kind: 'supported', section: '27.3', id: 'tube-' + t.id, correct: right ? 1 : 0, total: 1 }); }
        const net = reacts ? EC.netEquation(raRow, oaRow) : null;
        return h('div', { style: { marginTop: '14px' } },
          notice(right ? 'ok' : 'no', right ? 'Your prediction was right.' : 'Your prediction was wrong.'),
          h('div', { class: 'steps' },
            stepLine('', 'Observation', reacts ? t.yes : t.no),
            stepLine('el', 'Why', S.memoSentence(raRow, oaRow)),
            net ? stepLine('el', 'Net ionic equation', chem(net.text), 'Spectator ions are left out.') : null,
            stepLine('', 'Eθcell check', EC.eCell(oaRow, raRow, { labels: 'agents', plus: true }).line)));
      }
      function run() {
        st.p = 0; st.ran = false;
        const go = () => { st.p = Math.min(1, st.p + 0.012); st.svgBox.innerHTML = tubeSVG(t, st.reacts, st.p); if (st.p < 1) raf = requestAnimationFrame(go); else { st.ran = true; draw(); } };
        if (S.reduced()) { st.p = 1; st.ran = true; draw(); } else go();
      }
      let raf; S.onLeave(() => cancelAnimationFrame(raf));
      reset();
    }
  };
  function mix(a, b, p) {
    const pa = [1, 3, 5].map(i => parseInt(a.substr(i, 2), 16)), pb = [1, 3, 5].map(i => parseInt(b.substr(i, 2), 16));
    return '#' + pa.map((v, i) => Math.round(v + (pb[i] - v) * p).toString(16).padStart(2, '0')).join('');
  }
  function tubeSVG(t, reacts, p) {
    const q = reacts ? p : 0;
    const col = mix(t.sol[0], t.sol[1], q);
    let s = `<svg viewBox="0 0 420 420" role="img" aria-label="Test tube: ${t.add} in ${t.into}">`;
    s += `<rect x="0" y="0" width="420" height="420" fill="#fbfdfe"/>`;
    s += `<path d="M150 40 L150 330 Q150 380 210 380 Q270 380 270 330 L270 40" fill="none" stroke="#495057" stroke-width="4"/>`;
    s += `<path d="M153 140 L153 330 Q153 376 210 376 Q267 376 267 330 L267 140 Z" fill="${col}" opacity=".9"/>`;
    if (!t.liquid) {
      const w = t.dissolve ? 26 * (1 - 0.6 * q) : 26;
      s += `<rect x="${210 - w / 2}" y="60" width="${w}" height="${t.dissolve ? 280 - 60 * q : 280}" rx="4" fill="${t.strip}" stroke="#495057"/>`;
      if (t.coat && q > 0) {
        for (let k = 0; k < Math.round(18 * q); k++) { const yy = 150 + (k * 37) % 180, side = k % 2 ? 1 : -1, cx = 210 + side * (w / 2 + 4), r = 4 + (k % 3); s += `<polygon points="${cx},${yy - r} ${cx + r},${yy} ${cx},${yy + r} ${cx - r},${yy}" fill="${t.coat}" stroke="#495057" stroke-width=".8"/>`; }
      }
      if (t.bubbles && q > 0) {
        for (let k = 0; k < 14; k++) { const ph = (p * 6 + k / 14) % 1; s += `<circle cx="${200 + (k % 5) * 6 - 6}" cy="${330 - ph * 190}" r="${3 + (k % 3)}" fill="#fff" stroke="#6c757d" opacity="${0.9 - ph * .4}"/>`; }
      }
      if (t.gas && q > 0) s += `<rect x="153" y="44" width="114" height="92" fill="${t.gas}" opacity="${0.55 * q}"/>`;
    } else {
      s += `<path d="M196 10 L224 10 L218 40 L202 40 Z" fill="#dee2e6" stroke="#495057"/>`;
      if (p > 0 && p < 0.4) s += `<circle cx="210" cy="${50 + p * 200}" r="5" fill="${t.sol[0]}" stroke="#495057"/>`;
    }
    s += `<text x="210" y="408" text-anchor="middle" font-size="14" fill="#17324d">${p >= 1 ? (reacts ? 'reaction' : 'no reaction') : p > 0 ? 'watch…' : 'before'}</text>`;
    s += '</svg>';
    return s;
  }
  /* A6: explanation built from slots, checked against the memo sentence */
  function explainSlots(raRow, oaRow, st) {
    const oa = oaRow.oa, other = raRow.oa, ra = raRow.ra;
    const species = shuffleStable([oa, other, ra, raRow.oa === other ? oaRow.ra : raRow.oa].filter((v, i, a) => a.indexOf(v) === i), oa + ra);
    const mk = (k, opts, ph) => S.select([['', ph || '…']].concat(opts.map(o => [o, o])), st.slots[k] || '', v => { st.slots[k] = v; st.checked = null; }, { 'aria-label': ph || k });
    return h('div', { class: 'slots' },
      mk('a', species, 'species'), 'is a', mk('b', ['stronger', 'weaker'], 'stronger/weaker'), mk('c', ['oxidising agent', 'reducing agent', 'more reactive substance', 'better reducing ability'], 'what'), 'than', mk('d', species, 'species'), ', so it', mk('e', ['can', 'cannot'], 'can/cannot'), mk('f', ['oxidise', 'reduce'], 'verb'), mk('g', species, 'species'), 'to', mk('h', [raRow.oa, oaRow.ra, ra, oa].filter((v, i, a) => a.indexOf(v) === i), 'product'), '.');
  }
  function shuffleStable(a, seed) { let x = 0; for (const ch of seed) x = (x * 31 + ch.charCodeAt(0)) % 9973; return a.map((v, i) => [v, (x * (i + 7)) % 101]).sort((p, q) => p[1] - q[1]).map(p => p[0]); }
  function checkSlots(raRow, oaRow, st) {
    const reacts = EC.reacts(raRow, oaRow);
    const want = { a: oaRow.oa, b: reacts ? 'stronger' : 'weaker', c: 'oxidising agent', d: raRow.oa, e: reacts ? 'can' : 'cannot', f: 'oxidise', g: raRow.ra, h: raRow.oa };
    const s = st.slots, issues = [];
    if (s.c === 'more reactive substance') issues.push('“More reactive” earns no marks: compare two named agents as stronger or weaker oxidising (or reducing) agents.');
    if (s.c === 'better reducing ability') issues.push('Avoid “reducing ability”: the examiners say it is unclear whether you mean the ability to be reduced or to reduce something else.');
    if (s.c === 'reducing agent' && s.a === oaRow.oa) issues.push(`Compare like with like: ${oaRow.oa} is an oxidising agent, so compare it with another oxidising agent (${raRow.oa}).`);
    if (s.a && s.d && s.a !== want.a && s.a === want.d) issues.push('Start with the oxidising agent that was added, then compare it with the oxidising agent on the reducing agent’s row.');
    Object.keys(want).forEach(k => { if (!s[k]) issues.push('Fill in every gap.'); });
    const right = Object.keys(want).every(k => s[k] === want[k]);
    if (right) return notice('ok', 'Memo standard: ' + S.memoSentence(raRow, oaRow));
    if (!issues.length) issues.push('Not quite. Model answer: ' + S.memoSentence(raRow, oaRow));
    return notice('no', h('ul', { style: { margin: 0, paddingLeft: '18px' } }, [...new Set(issues)].map(i => h('li', null, i))));
  }
  S.checkSlots = checkSlots; S.explainSlots = explainSlots;

  /* ---------- A7: is it redox? ---------- */
  const REDOX_CARDS = [
    ['Zn + 2HCℓ → ZnCℓ₂ + H₂', true, 'Zn → Zn²⁺ + 2e⁻ and 2H⁺ + 2e⁻ → H₂ (SAGS: “NB: A redox reaction”).'],
    ['HCℓ + NaOH → NaCℓ + H₂O', false, 'Neutralisation: H⁺ + OH⁻ → H₂O; no charge changes.'],
    ['AgNO₃ + NaCℓ → AgCℓ + NaNO₃', false, 'Precipitation: Ag⁺ + Cℓ⁻ → AgCℓ; the ions keep their charges.'],
    ['CaCO₃ + 2HCℓ → CaCℓ₂ + CO₂ + H₂O', false, 'CO₃²⁻ + 2H⁺ → CO₂ + H₂O balances without electrons.'],
    ['Na₂SO₃ + 2HCℓ → 2NaCℓ + SO₂ + H₂O', false, 'SO₃²⁻ + 2H⁺ → SO₂ + H₂O balances without electrons.'],
    ['CuO + 2HCℓ → CuCℓ₂ + H₂O', false, 'Copper is Cu²⁺ in CuO and still Cu²⁺ in CuCℓ₂. Oxygen leaves the copper, but no electrons are transferred.'],
    ['Cu + 2H₂SO₄ → CuSO₄ + SO₂ + 2H₂O', true, 'Cu → Cu²⁺ + 2e⁻; SO₄²⁻ + 4H⁺ + 2e⁻ → SO₂ + 2H₂O.'],
    ['2Fe³⁺ + 2I⁻ → 2Fe²⁺ + I₂', true, 'Redox between ions: Fe³⁺ gains e⁻; I⁻ loses e⁻.'],
    ['Ba(OH)₂ + H₂C₂O₄ → 2H₂O + BaC₂O₄', false, 'Neutralisation and precipitation: no species gains or loses electrons (IEB 2025 P2 Q1.4).'],
    ['Mg + CuSO₄ → MgSO₄ + Cu', true, 'Mg → Mg²⁺ + 2e⁻; Cu²⁺ + 2e⁻ → Cu.']
  ];
  S.tools.isredox = {
    id: 'isredox', mod: 27, section: '27.1', title: 'Is it redox?',
    blurb: 'Sort reactions with the three-step check: a charge change, an ion with oxygen, electrons needed.',
    render(el) {
      const ans = {};
      const box = h('div', { class: 'card' });
      el.appendChild(box);
      function draw() {
        clear(box);
        add(box, [h('ol', { class: 'rules' }, h('li', null, 'Charge change? An atom becomes an ion, an ion becomes an element, or a metal ion changes its charge: redox.'), h('li', null, 'An ion with oxygen? Do not judge it by its charge: write its change with H⁺ and H₂O.'), h('li', null, 'Electrons needed? If it balances without electrons, it is not redox.')),
          h('div', { class: 'steps' }, REDOX_CARDS.map(([eq, yes, why], i) => {
            const a = ans[i];
            return h('div', { class: 'step' }, h('div', { class: 'val' }, chem(eq)),
              h('div', { class: 'row', style: { marginTop: '6px' } }, h('button', { class: 'btn small ' + (a === true ? 'on' : 'ghost'), type: 'button', onclick: () => { ans[i] = true; logAttempt({ kind: 'supported', section: '27.1', id: 'redox' + i, correct: yes ? 1 : 0, total: 1 }); draw(); } }, 'Redox'),
                h('button', { class: 'btn small ' + (a === false ? 'on' : 'ghost'), type: 'button', onclick: () => { ans[i] = false; logAttempt({ kind: 'supported', section: '27.1', id: 'redox' + i, correct: yes ? 0 : 1, total: 1 }); draw(); } }, 'Not redox')),
              a !== undefined ? h('div', { class: 'why' }, (a === yes ? '✓ ' : '✗ ') + (yes ? 'Redox. ' : 'Not redox. ') + why) : null);
          }))]);
      }
      draw();
    }
  };

  /* ---------- A8: spectator spotter ---------- */
  const SPEC_ITEMS = [
    { eq: ['Zn', '2Ag⁺', '2NO₃⁻', '→', 'Zn²⁺', '2NO₃⁻', '2Ag'], spec: ['NO₃⁻'], src: 'WE 27.10' },
    { eq: ['Mg', 'Cu²⁺', 'SO₄²⁻', '→', 'Mg²⁺', 'SO₄²⁻', 'Cu'], spec: ['SO₄²⁻'], src: 'Quick check 27.4' },
    { eq: ['Cu', '2Fe³⁺', '6Cℓ⁻', '→', 'Cu²⁺', '2Fe²⁺', '6Cℓ⁻'], spec: ['Cℓ⁻'], src: 'Quick check 27.4' },
    { eq: ['Cℓ₂', '2K⁺', '2I⁻', '→', '2K⁺', '2Cℓ⁻', 'I₂'], spec: ['K⁺'], note: 'Cℓ⁻ is not a spectator here: it is formed (from Cℓ₂), so it is only on the right.' },
    { eq: ['Cu', '4H⁺', '2NO₃⁻', '→', 'Cu²⁺', '2NO₂', '2H₂O'], spec: [], note: 'No spectators: in nitric acid NO₃⁻ is the oxidising agent (it becomes NO₂). “Spectator” is a job, not a kind of ion.' },
    { eq: ['2Aℓ', '6H⁺', '6Cℓ⁻', '→', '2Aℓ³⁺', '6Cℓ⁻', '3H₂'], spec: ['Cℓ⁻'] },
    { eq: ['MnO₄⁻', 'K⁺', '8H⁺', '5Fe²⁺', '→', 'Mn²⁺', 'K⁺', '4H₂O', '5Fe³⁺'], spec: ['K⁺'], src: 'WE 27.4', note: 'H⁺ is not a spectator: it is used up (it ends up in water).' }
  ];
  S.tools.spectators = {
    id: 'spectators', mod: 27, section: '27.4', title: 'Spectator spotter',
    blurb: 'Tap the ions to cross out of a full ionic equation. Some equations have none: NO₃⁻ in nitric acid is the oxidising agent.',
    render(el) {
      let it, crossed, res;
      const box = h('div', { class: 'card' });
      el.appendChild(box);
      const bare = t => t.replace(/^\d+/, '');
      function fresh() { it = pick(SPEC_ITEMS); crossed = new Set(); res = null; draw(); }
      function draw() {
        clear(box);
        const toks = [];
        it.eq.forEach((t, i) => {
          if (t === '→') { toks.push(h('span', { class: 'chem', style: { margin: '0 6px' } }, '→')); return; }
          if (i > 0 && it.eq[i - 1] !== '→') toks.push(h('span', { class: 'chem' }, '+'));
          const sp = bare(t), on = crossed.has(sp);
          toks.push(h('button', { class: 'tile', type: 'button', style: on ? { textDecoration: 'line-through', background: '#f1f3f5', color: '#868e96' } : null, onclick: () => { on ? crossed.delete(sp) : crossed.add(sp); res = null; draw(); } }, t));
        });
        add(box, [h('p', { class: 'prompt' }, 'Cross out the spectator ions (tap them). If there are none, check with nothing crossed out.'),
          it.src ? h('p', { class: 'small muted' }, 'From ' + it.src) : null,
          h('div', { class: 'row', style: { gap: '6px' } }, toks),
          h('div', { class: 'row', style: { marginTop: '12px' } }, h('button', { class: 'btn', type: 'button', onclick: check }, 'Check'), h('button', { class: 'btn ghost', type: 'button', onclick: fresh }, 'New equation')), res]);
      }
      function check() {
        const want = new Set(it.spec);
        const ok = want.size === crossed.size && [...want].every(x => crossed.has(x));
        logAttempt({ kind: 'supported', section: '27.4', id: 'spec', correct: ok ? 1 : 0, total: 1 });
        const left = it.eq.slice(0, it.eq.indexOf('→')).filter(t => !want.has(bare(t))), right = it.eq.slice(it.eq.indexOf('→') + 1).filter(t => !want.has(bare(t)));
        res = h('div', null, notice(ok ? 'ok' : 'no', ok ? 'Correct.' : (it.spec.length ? 'The spectator ion' + (it.spec.length > 1 ? 's are ' : ' is ') + it.spec.join(', ') + ': unchanged on both sides.' : 'There are no spectators here.')),
          it.note ? notice('', it.note) : null, stepLine('el', 'Net ionic equation', chem(left.join(' + ') + ' → ' + right.join(' + '))));
        draw();
      }
      fresh();
    }
  };
})();
