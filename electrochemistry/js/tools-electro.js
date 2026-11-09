/* Module 29 labs: electrolysis lab with the two contests (C1, C2), one cell two directions (C3), the membrane
   cell (C4), plating and refining with plating mistakes (C5, C6), the Faraday machine with cells in series
   (C7, C8) and the hydrate and ion-ratio trainer (C9). */
(function () {
  'use strict';
  const EC = window.EC, S = window.STUDIO;
  const { h, add, clear, chem, seg, select, stepLine, notice, readNum, close, shuffle, pick, logAttempt } = S;

  const METAL_COL = { Cu: '#b5651d', Ag: '#ced4da', Ni: '#b8b89a', Zn: '#adb5bd', Pb: '#6c757d', Mg: '#dee2e6', Na: '#e9ecef', Co: '#8d99a6', Fe: '#868e96', Aℓ: '#dfe3e6' };
  const GAS_COL = { 'H₂': '#ffffff', 'O₂': '#ffffff', 'Cℓ₂': '#d8f0a0' };
  const IND = {
    none: null,
    phenolphthalein: { acid: null, base: '#e64f9a', neutral: null, name: 'phenolphthalein (colourless in acid, pink in base)' },
    bromothymol: { acid: '#f1d44c', base: '#3f73c9', neutral: '#6ab36a', name: 'bromothymol blue (yellow in acid, blue in base)' },
    universal: { acid: '#e3533c', base: '#7a4fb5', neutral: '#7cbf5b', name: 'universal indicator (red in acid, purple in base)' }
  };

  /* generic electrolytic cell picture; p = clock, prog = 0..1 how far the electrolysis has run */
  // o.compact: a phone-width box, so the words are drawn about 1,75 times larger (about 11 px on screen)
  function elecSVG(o) {
    const W = 720, H = 440, p = o.p || 0, prog = o.prog || 0, cp = !!o.compact, k = cp ? 1.75 : 1, F = n => (n * k).toFixed(1);
    const halo = ' stroke="#fff" stroke-width="4" paint-order="stroke"';
    let s = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${o.aria || 'Electrolytic cell'}">`;
    // supply (both signs in ink: the colours belong to the jobs, not to the terminals)
    if (o.supply === 'meter') s += `<circle cx="360" cy="48" r="${cp ? 42 : 32}" fill="#fff" stroke="#343a40" stroke-width="3"/><text x="360" y="${cp ? 52 : 45}" text-anchor="middle" font-size="${cp ? 26 : 15}" font-weight="700" fill="#17324d">${o.reading || ''}</text><text x="360" y="${cp ? 78 : 62}" text-anchor="middle" font-size="${F(11)}" fill="#52677a">V</text>`;
    else s += `<rect x="318" y="26" width="84" height="44" rx="6" fill="#fff" stroke="#343a40" stroke-width="3"/><text x="360" y="${cp ? 57 : 54}" text-anchor="middle" font-size="${F(13)}" font-weight="700" fill="#17324d">DC</text><text x="${cp ? 322 : 330}" y="20" font-size="${F(16)}" font-weight="700" fill="#343a40">${o.swapJobs ? '+' : '−'}</text><text x="${cp ? 382 : 384}" y="20" font-size="${F(16)}" font-weight="700" fill="#343a40">${o.swapJobs ? '−' : '+'}</text>`;
    const cx = 220, ax = 500;
    s += `<path d="M${cx} 120 L${cx} 48 L${o.supply === 'meter' ? 328 : 318} 48 M${o.supply === 'meter' ? 392 : 402} 48 L${ax} 48 L${ax} 120" fill="none" stroke="#343a40" stroke-width="3"/>`;
    // beaker and solution
    s += `<path d="M110 160 L110 395 Q110 412 128 412 L592 412 Q610 412 610 395 L610 160" fill="none" stroke="#495057" stroke-width="3"/>`;
    s += `<rect x="112" y="196" width="496" height="214" fill="${o.sol || '#eef4f8'}" opacity=".85"/>`;
    if (o.molten) s += `<rect x="112" y="196" width="496" height="214" fill="#ffb347" opacity=".18"/><text x="360" y="${cp ? 436 : 430}" text-anchor="middle" font-size="${F(12)}" fill="#a3360f">molten: heated above its melting point</text>`;
    // indicator clouds
    if (o.indL) s += `<ellipse cx="${cx}" cy="320" rx="${60 + 40 * prog}" ry="${70 + 20 * prog}" fill="${o.indL}" opacity="${0.15 + 0.5 * prog}"/>`;
    if (o.indR) s += `<ellipse cx="${ax}" cy="320" rx="${60 + 40 * prog}" ry="${70 + 20 * prog}" fill="${o.indR}" opacity="${0.15 + 0.5 * prog}"/>`;
    if (o.aCloud) s += `<ellipse cx="${ax}" cy="330" rx="${40 + 50 * prog}" ry="${50 + 30 * prog}" fill="${o.aCloud}" opacity="${0.6 * prog}"/>`;
    // ions drifting
    (o.ions || []).forEach((ion, k) => {
      const cat = ion.to === 'c';
      const ph = ((p * 0.06 * (o.running ? 1 : 0)) + ((k * 0.381) % 1)) % 1;
      const x = cat ? 466 - ph * 206 : 254 + ph * 206;
      const y = 228 + ((k * 47) % 160);
      s += `<text x="${x}" y="${y}" text-anchor="middle" font-size="${cp ? 23 : 15}" font-weight="700" fill="${ion.col || (cat ? '#9b1c1c' : '#144a9e')}" stroke="#fff" stroke-width="3" paint-order="stroke">${ion.label}</text>`;
    });
    // electrodes
    const el = (x, lab, col, w, sideLab, left, isRed) => {
      let e = `<rect x="${x - w / 2}" y="120" width="${w}" height="250" fill="${col}" stroke="#495057"/>`;
      if (cp) e += `<text x="${x}" y="398" text-anchor="middle" font-size="${F(13)}" fill="#17324d" font-weight="700"${halo}>${lab}</text>`;
      else e += `<text x="${x + (left ? -60 : 60)}" y="152" text-anchor="middle" font-size="${lab.length > 10 ? 12 : 14}" fill="#17324d" font-weight="700" dy="34">${lab}</text>`;
      const bw = cp ? 172 : 120, bh = cp ? 70 : 46, bx = left ? x - 22 - bw : x + 22, tx = bx + bw / 2, fill = isRed ? '#fdecec' : '#e8f0fd', strk = isRed ? '#c92a2a' : '#1c64d6', tc = isRed ? '#9b1c1c' : '#144a9e';
      e += `<rect x="${bx}" y="${cp ? 122 : 128}" width="${bw}" height="${bh}" rx="6" fill="${fill}" stroke="${strk}"/><text x="${tx}" y="${cp ? 152 : 147}" text-anchor="middle" font-size="${F(13)}" font-weight="700" fill="${tc}">${sideLab}</text><text x="${tx}" y="${cp ? 180 : 165}" text-anchor="middle" font-size="${F(12)}" fill="${tc}">${isRed ? 'reduction' : 'oxidation'}</text>`;
      return e;
    };
    const aw = 28 * (o.anodeShrink ? 1 - 0.5 * prog : 1);
    s += el(cx, o.cathodeName || 'graphite', o.cathodeCol || '#343a40', 28, o.cathodeSign || 'CATHODE (−)', true, !o.swapJobs);
    if (o.coat) s += `<rect x="${cx - 14 - 6 * prog}" y="196" width="${28 + 12 * prog}" height="174" fill="${o.coat}" opacity="${Math.min(1, prog * 2)}" stroke="#5c3a1a" stroke-width=".5"/>`;
    s += el(ax, o.anodeName || 'graphite', o.anodeCol || '#343a40', aw, o.anodeSign || 'ANODE (+)', false, !!o.swapJobs);
    if (o.aCoat) s += `<rect x="${ax - 14 - 6 * prog}" y="196" width="${28 + 12 * prog}" height="174" fill="${o.aCoat}" opacity="${Math.min(1, prog * 2)}"/>`;
    if (o.sludge) s += `<path d="M${ax - 40} 410 Q${ax} ${410 - 24 * prog} ${ax + 40} 410 Z" fill="#c9a227" stroke="#8a6d10"/><text x="${ax}" y="${cp ? 436 : 432}" text-anchor="middle" font-size="${F(11)}" fill="#6b5a1e">anode sludge (${o.sludge})</text>`;
    if (o.solLabel && !cp) s += `<text x="122" y="404" font-size="12" fill="#17324d">${o.solLabel}</text>`;
    const bub = (x, gas) => { let b = ''; for (let k = 0; k < 9; k++) { const ph = ((p * 0.6) + k / 9) % 1; b += `<circle cx="${x + (k % 3 - 1) * 9 + (k % 2 ? 18 : -18)}" cy="${360 - ph * 160}" r="${3 + (k % 3)}" fill="${GAS_COL[gas] || '#fff'}" stroke="#6c757d" opacity="${o.running ? 0.9 - ph * .5 : 0.35}"/>`; } return b + `<text x="${x + (x === cx ? -20 : 20)}" y="${cp ? 224 : 216}" text-anchor="${x === cx ? 'end' : 'start'}" font-size="${F(15)}" font-weight="700" fill="#17324d" stroke="#fff" stroke-width="3" paint-order="stroke">${gas}(g) ↑</text>`; };
    if (o.cGas) s += bub(cx, o.cGas);
    if (o.aGas) s += bub(ax, o.aGas);
    // electron arrows in the wire
    if (o.running && o.supply !== 'none') {
      const toCath = !o.swapJobs; // electrons always flow through the wire towards the cathode
      for (let k = 0; k < 5; k++) {
        const ph = ((p * 0.4) + k / 5) % 1;
        let x, y;
        const path = toCath ? [[ax, 120], [ax, 48], [cx, 48], [cx, 120]] : [[cx, 120], [cx, 48], [ax, 48], [ax, 120]];
        const L = [72, 280, 72], tot = 424; let d = ph * tot, i = 0; while (d > L[i]) { d -= L[i]; i++; }
        const f = d / L[i]; x = path[i][0] + (path[i + 1][0] - path[i][0]) * f; y = path[i][1] + (path[i + 1][1] - path[i][1]) * f;
        if (Math.abs(x - 360) < 46 && y < 80) continue;
        s += `<circle cx="${x}" cy="${y}" r="${cp ? 8 : 6}" fill="#343a40"/>`;
      }
    }
    if (o.caption2) {
      if (cp) { const w = o.caption2.split(' '), half = Math.ceil(w.length / 2); s += `<text x="360" y="100" text-anchor="middle" font-size="${F(11)}" fill="#343a40">${w.slice(0, half).join(' ')}</text><text x="360" y="122" text-anchor="middle" font-size="${F(11)}" fill="#343a40">${w.slice(half).join(' ')}</text>`; }
      else s += `<text x="360" y="100" text-anchor="middle" font-size="12" fill="#343a40">${o.caption2}</text>`;
    }
    s += '</svg>';
    if (cp && o.solLabel) s += `<p class="small muted" style="margin:6px 0 0">Electrolyte: ${o.solLabel}</p>`;
    return s;
  }
  const compactBox = box => (box.clientWidth || (box.parentNode && box.parentNode.clientWidth) || window.innerWidth) < 560;
  S.elecSVG = elecSVG;

  // a copper anode replaces Cu²⁺ as fast as it is reduced, so the blue stays (IEB 2023 P2 Q7.1.1(c): remain constant)
  const solColour = (el, prog, cathSp, anodeSp) => {
    if (el.cations.includes('Cu²⁺')) return cathSp === 'Cu²⁺' && anodeSp !== 'Cu' ? mix('#78aee6', '#eef4f8', prog * 0.8) : '#78aee6';
    if (el.cations.includes('Ni²⁺')) return cathSp === 'Ni²⁺' && anodeSp !== 'Ni' ? mix('#b9dcc0', '#eef4f8', prog * 0.8) : '#b9dcc0';
    if (anodeSp === 'Cu') return mix('#eef4f8', '#78aee6', prog * 0.7); // a dissolving copper anode turns the solution blue
    if (anodeSp === 'Ni') return mix('#eef4f8', '#b9dcc0', prog * 0.7);
    return '#eef4f8';
  };
  function mix(a, b, p) { const pa = [1, 3, 5].map(i => parseInt(a.substr(i, 2), 16)), pb = [1, 3, 5].map(i => parseInt(b.substr(i, 2), 16)); return '#' + pa.map((v, i) => Math.round(v + (pb[i] - v) * p).toString(16).padStart(2, '0')).join(''); }

  function productLabel(sp, side, x) {
    const prods = side === 'c' ? x.cathode.row.red.map(t => t.sp) : x.anode.row.ox.map(t => t.sp);
    return prods.join(' and ');
  }
  function afterwards(x) {
    const out = [];
    const c = x.cathode.sp, a = x.anode.sp;
    if (c === 'Cu²⁺' && a !== 'Cu') out.push('The blue colour fades: Cu²⁺ is used up.');
    if (c === 'Cu²⁺' && a === 'Cu') out.push('The [Cu²⁺] stays the same: copper is oxidised at the anode as fast as Cu²⁺ is reduced at the cathode.');
    if (c === 'Ni²⁺' && a !== 'Ni') out.push('The green colour fades: Ni²⁺ is used up.');
    if (c === 'Ni²⁺' && a === 'Ni') out.push('The [Ni²⁺] stays the same: nickel is oxidised at the anode as fast as Ni²⁺ is reduced.');
    if (a === 'Cu' && c !== 'Cu²⁺') out.push('The solution turns blue: Cu²⁺ forms at the anode.');
    if (a === 'Ni' && c !== 'Ni²⁺') out.push('The solution turns green: Ni²⁺ forms at the anode.');
    if (c === 'H₂O') out.push('OH⁻ forms at the cathode: the solution there becomes basic.');
    if (a === 'H₂O') out.push('H⁺ forms at the anode: the solution there becomes acidic.');
    if (c === 'H₂O' && a === 'H₂O') out.push('Overall, water is used up, so the electrolyte becomes more concentrated.');
    if (c === 'H⁺' && a === 'H₂O') out.push('Water is used up: the acid becomes more concentrated.');
    if (c === 'H₂O' && a === 'Cℓ⁻' && x.electrolyte.cations.includes('Na⁺')) out.push('The solution becomes basic: NaOH forms (the membrane cell).');
    if (a === 'Br⁻' || a === 'I⁻') out.push(a === 'Br⁻' ? 'An orange-brown colour forms round the anode (Br₂).' : 'A yellow-brown colour forms round the anode (I₂).');
    if (!x.electrolyte.aqueous) out.push('In a melt each ion is the only candidate at its electrode.');
    if (x.anode.why === 'active anode') out.push(`The ${EC.NAMES[a]} anode dissolves: it gets thinner.`);
    return out;
  }

  /* ---------- C1 + C2: electrolysis lab with the two contests ---------- */
  S.tools.electrolysis = {
    id: 'electrolysis', mod: 29, section: '29.3', title: 'Electrolysis lab',
    blurb: 'Choose an electrolyte, the electrodes and the concentration. Predict both products, then watch the ions drift, the gas bubble and the metal coat. The two contests show why.',
    render(el, params) {
      let key0 = params.e || 'CuCℓ2-conc';
      if (!EC.ELECTROLYTES[key0]) key0 = key0.replace(/Cl/g, 'Cℓ').replace(/Al/g, 'Aℓ'); // hand-typed links with an ordinary l
      if (!EC.ELECTROLYTES[key0]) key0 = 'CuCℓ2-conc';
      const st = { key: key0, anode: params.anode || 'graphite', ind: 'none', predict: params.predict === '1', guess: {}, revealed: false, running: false, p: 0, prog: 0, conc: null };
      const stage = h('div', { class: 'stage' }), svgBox = h('div'), cap = h('div', { class: 'cap', 'aria-live': 'polite' }), bar = h('div', { class: 'bar' });
      add(stage, [svgBox, cap, bar]);
      const ctl = h('div', { class: 'card', style: { marginTop: '14px' } }), side = h('div');
      add(el, [S.legend(), h('div', { class: 'split' }, h('div', null, stage, ctl), side)]);
      let raf, last = 0;
      S.onLeave(() => cancelAnimationFrame(raf));
      function calc() {
        const E = EC.ELECTROLYTES[st.key];
        const opts = { anode: E.aqueous ? st.anode : 'graphite' };
        if (st.conc !== null && E.anions.includes('Cℓ⁻') && E.aqueous) opts.concentrated = st.conc;
        return EC.electrolysis(st.key, opts);
      }
      function picture(x) {
        const E = x.electrolyte;
        const cath = x.cathode, an = x.anode;
        const metalC = cath.sp !== 'H₂O' && cath.sp !== 'H⁺' ? cath.row.ra : null;
        const ind = E.aqueous ? IND[st.ind] : null; // no indicator and no active anode in a melt
        const show = st.running || st.prog > 0;
        const ions = [];
        E.cations.forEach(c => { for (let k = 0; k < 4; k++) ions.push({ label: c, to: 'c', col: '#9b1c1c' }); });
        E.anions.forEach(a => { for (let k = 0; k < 4; k++) ions.push({ label: a, to: 'a', col: '#144a9e' }); });
        let neutral = ind ? ind.neutral : null;
        return elecSVG({
          compact: compactBox(svgBox), aria: 'Electrolysis of ' + E.label, running: st.running, p: st.p, prog: st.prog, molten: !E.aqueous, ions,
          sol: solColour(E, st.prog, cath.sp, an.sp), anodeName: x.anodeMaterial === 'graphite' ? 'graphite' : x.anodeMaterial,
          anodeCol: METAL_COL[x.anodeMaterial] || (x.anodeMaterial === 'Pt' ? '#e9ecef' : '#343a40'), anodeShrink: an.why === 'active anode',
          coat: show && metalC ? METAL_COL[metalC] : null,
          cGas: show && (cath.sp === 'H₂O' || cath.sp === 'H⁺') ? 'H₂' : null,
          aGas: show && an.why !== 'active anode' && ['H₂O', 'Cℓ⁻'].includes(an.sp) ? (an.sp === 'H₂O' ? 'O₂' : 'Cℓ₂') : null,
          aCloud: show && an.sp === 'Br⁻' ? '#e8862a' : show && an.sp === 'I⁻' ? '#7a4113' : null,
          indL: show && ind ? (cath.sp === 'H₂O' ? ind.base : E.cations.includes('H⁺') ? ind.acid : neutral) : null,
          indR: show && ind ? (an.sp === 'H₂O' ? ind.acid : neutral) : null
        });
      }
      function frame(ts) {
        const dt = last ? Math.min(.05, (ts - last) / 1000) : 0; last = ts;
        st.p += dt; st.prog = Math.min(1, st.prog + dt / 25);
        svgBox.innerHTML = picture(calc());
        if (st.running) raf = requestAnimationFrame(frame);
      }
      function options(x) {
        const E = x.electrolyte;
        const c = [], a = [];
        E.cations.forEach(sp => { const r = S.rowFor(sp, 'oa'); if (r) c.push({ t: r.red.map(t => t.sp).join(' and '), key: sp }); });
        if (E.aqueous) c.push({ t: 'H₂ and OH⁻', key: 'H₂O' });
        if (E.cations.includes('H⁺')) c.forEach(o => { if (o.key === 'H⁺') o.t = 'H₂ (from H⁺)'; });
        E.anions.forEach(sp => { const r = EC.rowsWithRight(sp)[0]; a.push(r ? { t: r.ox.filter(t => t.sp !== 'H⁺').map(t => t.sp).join(' and '), key: sp } : { t: sp === 'SO₄²⁻' ? 'SO₂' : sp === 'NO₃⁻' ? 'NO₂' : sp, key: 'x-' + sp }); });
        if (E.aqueous) a.push({ t: 'O₂ and H⁺', key: 'H₂O' });
        if (E.aqueous && !['graphite', 'Pt'].includes(st.anode)) { const r = S.rowFor(st.anode, 'ra'); a.push({ t: `${st.anode} dissolves (${st.anode} → ${r.oa} + ${r.n === 1 ? '' : r.n}e⁻)`, key: st.anode }); }
        if (!E.aqueous) { c.push({ t: 'H₂ and OH⁻', key: 'H₂O' }); a.push({ t: 'O₂ and H⁺', key: 'H₂O' }); } // a melt has no water: these are traps
        return { c, a };
      }
      const draw = () => S.keepFocus(el, draw0);
      function draw0() {
        const x = calc(), E = x.electrolyte;
        svgBox.innerHTML = picture(x);
        cap.textContent = st.predict && !st.revealed ? 'Predict the product at each electrode, then press Reveal and run it.' :
          st.running ? `Cations drift to the cathode (−) and anions to the anode (+). Attraction decides where the ions go; Table 4 decides which species reacts.` : 'Press Run to start the electrolysis.';
        clear(bar);
        add(bar, [h('button', { class: 'btn', type: 'button', disabled: st.predict && !st.revealed, onclick: () => { st.running = !st.running; last = 0; if (st.running) { if (S.reduced()) { st.prog = 1; st.running = false; draw(); return; } raf = requestAnimationFrame(frame); } else cancelAnimationFrame(raf); draw(); } }, st.running ? 'Pause' : 'Run'),
          h('button', { class: 'btn ghost', type: 'button', onclick: () => { st.running = false; cancelAnimationFrame(raf); st.prog = 0; st.p = 0; draw(); } }, 'Reset'),
          seg([['explore', 'Explore'], ['predict', 'Predict']], st.predict ? 'predict' : 'explore', v => { st.predict = v === 'predict'; reset(); })]);
        clear(ctl);
        const hasCl = E.anions.includes('Cℓ⁻') && E.aqueous;
        add(ctl, [h('div', { class: 'grid g2' },
          h('div', null, h('label', { class: 'f' }, 'Electrolyte'), select(Object.keys(EC.ELECTROLYTES).map(k => [k, EC.ELECTROLYTES[k].label]), st.key, v => { st.key = v; st.conc = null; reset(); }, { 'aria-label': 'Electrolyte' })),
          h('div', null, h('label', { class: 'f' }, 'Anode material'), select([['graphite', 'graphite (inert)'], ['Pt', 'platinum (inert)'], ['Cu', 'copper'], ['Ni', 'nickel'], ['Ag', 'silver'], ['Zn', 'zinc']], E.aqueous ? st.anode : 'graphite', v => { st.anode = v; reset(); }, { 'aria-label': 'Anode', disabled: !E.aqueous })),
          h('div', null, h('label', { class: 'f' }, 'Indicator in the solution'), select([['none', 'none'], ['phenolphthalein', 'phenolphthalein'], ['bromothymol', 'bromothymol blue'], ['universal', 'universal indicator']], E.aqueous ? st.ind : 'none', v => { st.ind = v; draw(); }, { 'aria-label': 'Indicator', disabled: !E.aqueous })),
          hasCl ? h('div', null, h('label', { class: 'f' }, 'Chloride concentration'), seg([['dil', 'dilute (1 mol·dm⁻³)'], ['conc', 'concentrated / saturated']], x.concentrated ? 'conc' : 'dil', v => {
            // switch to the entry whose name says the new concentration, so the label always matches the products
            const SIB = { 'MgCℓ2-aq': 'MgCℓ2-aq-dil', 'MgCℓ2-aq-dil': 'MgCℓ2-aq' };
            const sib = SIB[st.key] || st.key.replace(/-(conc|dil)$/, v === 'conc' ? '-conc' : '-dil');
            if (sib !== st.key && EC.ELECTROLYTES[sib] && EC.ELECTROLYTES[sib].concentrated === (v === 'conc')) { st.key = sib; st.conc = null; } else st.conc = v === 'conc';
            reset(); })) : null),
          h('p', { class: 'small muted', style: { marginTop: '8px' } }, 'The cathode is always graphite here. Indicators: ', IND[st.ind] ? IND[st.ind].name : 'add one to see acid and base form.')]);
        clear(side);
        side.appendChild(panel(x));
      }
      function reset() { st.running = false; cancelAnimationFrame(raf); st.prog = 0; st.revealed = false; st.guess = {}; draw(); }
      function autoRun() { if (params.run !== '1' || (st.predict && !st.revealed)) return; st.running = true; last = 0; if (S.reduced()) { st.prog = 1; st.running = false; } else raf = requestAnimationFrame(frame); draw(); }
      function panel(x) {
        const box = h('div', { class: 'card' });
        if (st.predict && !st.revealed) {
          const o = st.opts && st.optsKey === st.key + st.anode + x.concentrated ? st.opts : (st.opts = options(x), st.optsKey = st.key + st.anode + x.concentrated, st.opts);
          add(box, [h('h3', null, 'Predict both products'), h('p', { class: 'muted small' }, x.electrolyte.label + ', ' + (x.electrolyte.aqueous ? x.anodeMaterial + ' anode' : 'graphite electrodes')),
            h('p', null, h('b', { class: 'k-red' }, 'Cathode (−): '), 'which product forms?'), h('div', { class: 'choices' }, o.c.map(c => h('button', { class: 'choice', type: 'button', 'aria-pressed': String(st.guess.c === c.key), onclick: () => { st.guess.c = c.key; draw(); } }, chem(c.t)))),
            h('p', null, h('b', { class: 'k-ox' }, 'Anode (+): '), 'which product forms?'), h('div', { class: 'choices' }, o.a.map(c => h('button', { class: 'choice', type: 'button', 'aria-pressed': String(st.guess.a === c.key), onclick: () => { st.guess.a = c.key; draw(); } }, chem(c.t)))),
            h('button', { class: 'btn', type: 'button', disabled: !st.guess.c || !st.guess.a, onclick: () => {
              st.revealed = true; const okC = st.guess.c === x.cathode.sp, okA = st.guess.a === x.anode.sp;
              st.guess.res = [okC, okA]; logAttempt({ kind: 'supported', section: '29.3', id: 'elec-' + st.key, correct: (okC ? 1 : 0) + (okA ? 1 : 0), total: 2 }); draw();
            } }, 'Reveal')]);
          return box;
        }
        const r = st.guess.res;
        if (r) box.appendChild(notice(r[0] && r[1] ? 'ok' : 'no', r[0] && r[1] ? 'Both products right.' : `Cathode: ${r[0] ? 'right' : 'wrong'}. Anode: ${r[1] ? 'right' : 'wrong'}. ` + (!x.electrolyte.aqueous && (st.guess.c === 'H₂O' || st.guess.a === 'H₂O') ? 'In a melt there is no water: each ion is the only candidate at its electrode.' : 'Use the two contests below.')));
        // the memo reason: name the winner and every competitor, with their Eθ values
        const vs = (list, win) => list.filter(c => c !== win && c.row).map(c => `${c.sp} (${EC.ev(c.row.E)} V)`).join(' and ');
        const an = x.anode, anions = x.electrolyte.anions;
        const anodeWhy = !x.electrolyte.aqueous ? `${an.sp} is the only anion: it is oxidised.`
          : an.why === 'active anode' ? `${an.sp} (${EC.ev(an.row.E)} V) is a stronger reducing agent than ${vs(x.anodeContest, an)}, so the anode itself is oxidised and dissolves.`
          : an.sp === 'H₂O' ? (anions.some(a => EC.rowsWithRight(a).length) ? `Under standard conditions H₂O (+1,23 V) is a stronger reducing agent than ${vs(x.anodeContest, an)}, so water is oxidised.` : `${anions.join(', ')} ${anions.length > 1 ? 'are' : 'is'} not oxidised (only on the left of Table 4), so water is oxidised.`)
          : an.sp === 'Cℓ⁻' && x.concentrated ? 'In the concentrated solution the high [Cℓ⁻] makes the oxidation of Cℓ⁻ predominant over water.'
          : `${an.sp} (${EC.ev(an.row.E)} V) is a stronger reducing agent than ${vs(x.anodeContest, an)}, so ${an.sp} is oxidised.`;
        const cats = x.cathodeContest.filter(c => c.sp !== 'H₂O' && c.row).map(c => `${c.sp} (${EC.ev(c.row.E)} V)`);
        const ladder = (title, cls, list, win, water) => h('div', { class: 'ladder ' + cls }, h('h4', null, title), list.map(c => h('div', { class: 'rung' + (c === win ? ' win ' + cls : '') + (c.sp === 'H₂O' ? ' water' : '') + (c.row ? '' : ' out') },
          h('span', null, c.sp === 'H₂O' ? 'H₂O (water)' : c.sp, c.why === 'active anode' ? ' (the anode itself)' : ''), h('span', null, c.row ? EC.ev(c.row.E) + ' V' : 'not on the right of Table 4'), c === win ? h('b', null, ' ✓') : null)));
        const anodeList = x.anodeContest.slice().sort((p, q) => (p.row ? p.row.E : 9) - (q.row ? q.row.E : 9));
        add(box, [h('h3', null, 'The two contests'),
          h('div', { class: 'grid g2' },
            ladder('Cathode: strongest oxidising agent wins (highest Eθ)', 'red', x.cathodeContest, x.cathode),
            ladder('Anode: strongest reducing agent wins (lowest Eθ)', 'ox', anodeList, x.anode)),
          x.concNote ? notice('', x.concNote) : null,
          h('div', { class: 'steps', style: { marginTop: '12px' } },
            stepLine('red', 'Cathode (−) half-reaction', chem(x.cathodeHalf.text), x.cathode.sp === 'H₂O' ? `${cats.join(' and ')} ${cats.length > 1 ? 'are weaker oxidising agents' : 'is a weaker oxidising agent'} than H₂O (−0,83 V), so water is reduced.` : x.electrolyte.aqueous ? `${x.cathode.sp} (${EC.ev(x.cathode.row.E)} V) is a stronger oxidising agent than H₂O (−0,83 V), so ${x.cathode.sp} is reduced.` : `${x.cathode.sp} is the only cation: it is reduced.`),
            stepLine('ox', 'Anode (+) half-reaction', chem(x.anodeHalf.text), anodeWhy),
            stepLine('el', 'Overall ionic equation', chem(!x.net.left.length && x.anode.why === 'active anode' ? `${x.anode.sp}(anode) → ${x.anode.sp}(cathode)` : x.net.text), !x.net.left.length && x.anode.why === 'active anode' ? `Everything cancels: ${EC.NAMES[x.anode.sp]} simply moves from the anode to the cathode.` : null),
            stepLine('', 'Eθcell', h('span', null, x.eCell.formula, h('br'), x.eCell.substitute, h('br'), x.eCell.answer), x.eCell.value < 0 ? `Negative: non-spontaneous. The supply must provide more than ${EC.num(Math.abs(x.eCell.value), 2)} V.` : x.eCell.value > 0 ? `Positive, so spontaneous: ${x.cathode.sp} (${EC.ev(x.cathode.row.E)} V) is a stronger oxidising agent than ${x.anode.row.oa} (${EC.ev(x.anode.row.E)} V), so ${x.cathode.sp} oxidises ${x.anode.sp} to ${x.anode.row.oa} even without the supply. An electrolytic cell forces a non-spontaneous reaction (Eθcell < 0 with inert electrodes; 0 V when the anode is the plating metal).` : 'The anode metal is simply transferred: no overall chemical change.'),
            stepLine('', 'Spectator ions', x.spectators.length ? chem(x.spectators.join(', ')) : 'none'),
            stepLine('', 'The solution afterwards', h('ul', { style: { margin: 0, paddingLeft: '18px', fontFamily: 'var(--font)', fontSize: '1rem' } }, afterwards(x).map(t => h('li', null, t))))),
          x.electrolyte.cations.includes('Na⁺') || x.electrolyte.cations.includes('K⁺') ? (() => {
            const cat = x.electrolyte.cations[0], metal = EC.NAMES[cat.replace(/[⁺]/g, '')] || cat, salt = x.electrolyte.aqueous ? x.electrolyte.label.split(',')[0] : 'NaCℓ(aq)';
            return h('div', { class: 'callout trap' }, h('h4', null, 'IEB trap'), `✗ ${cat} ions are attracted to the cathode, so they are reduced to ${metal} when ${salt} is electrolysed.`, h('br'),
              x.electrolyte.aqueous ? '✓ Attraction decides only which way the ions drift; Table 4 decides which species reacts. Water is in both contests, and water wins at the cathode.' : `✓ Attraction decides only which way the ions drift; Table 4 decides which species reacts. ${metal[0].toUpperCase() + metal.slice(1)} forms only from the melt: there is no water, so ${cat} is the only cation.`);
          })() : null]);
        return box;
      }
      draw(); autoRun();
    }
  };

  /* ---------- C3: one cell, two directions ---------- */
  S.tools.twoway = {
    id: 'twoway', mod: 29, section: '29.1', title: 'One cell, two directions',
    blurb: 'Run CuCℓ₂ electrolysis, then swap the supply for a voltmeter: the cell runs backwards as a galvanic cell. The signs stay; the jobs swap.',
    render(el) {
      let mode = 'elec', p = 0, raf, last = 0, playing = false;
      const stage = h('div', { class: 'stage' }), svgBox = h('div'), cap = h('div', { class: 'cap', 'aria-live': 'polite' }), bar = h('div', { class: 'bar' });
      add(stage, [svgBox, cap, bar]);
      const side = h('div', { class: 'card' });
      add(el, [h('div', { class: 'split' }, stage, side)]);
      S.onLeave(() => cancelAnimationFrame(raf));
      const frame = ts => { if (!playing) return; const dt = last ? Math.min(.05, (ts - last) / 1000) : 0; last = ts; p += dt; pic(); raf = requestAnimationFrame(frame); };
      function pic() {
        const e = mode === 'elec';
        svgBox.innerHTML = elecSVG({ compact: compactBox(svgBox), aria: e ? 'Electrolytic cell: CuCℓ₂(aq) with a DC supply' : 'Galvanic cell: the same electrodes, the voltmeter reads 1,02 V', running: true, p, prog: 0.8, supply: e ? 'dc' : 'meter', reading: '1,02', sol: '#9cc4ec',
          ions: [{ label: 'Cu²⁺', to: e ? 'c' : 'a', col: '#9b1c1c' }, { label: 'Cℓ⁻', to: e ? 'a' : 'c', col: '#144a9e' }, { label: 'Cu²⁺', to: e ? 'c' : 'a', col: '#9b1c1c' }, { label: 'Cℓ⁻', to: e ? 'a' : 'c', col: '#144a9e' }],
          cathodeName: 'electrode A', anodeName: 'electrode B', coat: METAL_COL.Cu, cGas: null, aGas: e ? 'Cℓ₂' : null,
          cathodeSign: e ? 'CATHODE (−)' : 'ANODE (−)', anodeSign: e ? 'ANODE (+)' : 'CATHODE (+)',
          caption2: e ? 'electrons pushed by the supply' : 'electrons flow by themselves', swapJobs: !e });
      }
      function draw(...a) { return S.keepFocus(el, () => draw0(...a)); } // keep keyboard focus on the control that was used
      function draw0() {
        pic();
        const e = mode === 'elec';
        cap.textContent = e ? 'Electrolysis: the supply forces electrons onto electrode A. Cu²⁺ is reduced there; Cℓ⁻ is oxidised at electrode B.' : 'Galvanic: the copper on A is oxidised and the chlorine on B is reduced. The electrons now flow from A to B by themselves.';
        clear(bar);
        add(bar, [seg([['elec', 'DC supply (electrolytic)'], ['galv', 'Voltmeter (galvanic)']], mode, v => { mode = v; draw(); }),
          S.reduced() ? null : h('button', { class: 'btn ghost', type: 'button', 'aria-pressed': String(playing), onclick: () => { playing = !playing; last = 0; cancelAnimationFrame(raf); if (playing) raf = requestAnimationFrame(frame); S.keepFocus(bar, draw); } }, playing ? 'Pause the motion' : 'Play the motion')]);
        clear(side);
        add(side, [h('h3', null, e ? 'Electrolytic cell: CuCℓ₂(aq)' : 'Galvanic cell: the same electrodes'),
          h('div', { style: { overflowX: 'auto' } }, h('table', { class: 'plain wraptbl' }, h('thead', null, h('tr', null, h('th', null, ''), h('th', null, 'Electrolytic'), h('th', null, 'Galvanic'))),
            h('tbody', null,
              h('tr', null, h('td', null, 'Electrode A sign'), h('td', null, '−'), h('td', null, '−')),
              h('tr', null, h('td', null, 'Electrode A job'), h('td', { class: 'k-red' }, 'cathode: ', chem('Cu²⁺ + 2e⁻ → Cu')), h('td', { class: 'k-ox' }, 'anode: ', chem('Cu → Cu²⁺ + 2e⁻'))),
              h('tr', null, h('td', null, 'Electrode B sign'), h('td', null, '+'), h('td', null, '+')),
              h('tr', null, h('td', null, 'Electrode B job'), h('td', { class: 'k-ox' }, 'anode: ', chem('2Cℓ⁻ → Cℓ₂ + 2e⁻')), h('td', { class: 'k-red' }, 'cathode: ', chem('Cℓ₂ + 2e⁻ → 2Cℓ⁻'))),
              h('tr', null, h('td', null, 'Overall'), h('td', null, chem('Cu²⁺ + 2Cℓ⁻ → Cu + Cℓ₂')), h('td', null, chem('Cu + Cℓ₂ → Cu²⁺ + 2Cℓ⁻'))),
              h('tr', null, h('td', null, 'Eθcell'), h('td', null, '0,34 − 1,36 = −1,02 V'), h('td', null, '1,36 − 0,34 = +1,02 V')),
              h('tr', null, h('td', null, 'Energy'), h('td', null, 'electrical → chemical'), h('td', null, 'chemical → electrical'))))),
          h('div', { class: 'callout', style: { marginTop: '12px' } }, h('h4', null, 'The aha'), 'The signs stay, the jobs swap. Oxidation is always at the anode and reduction always at the cathode, in every kind of cell. Like a phone battery: on the charger it is electrolytic, in your hand it is galvanic.'),
          h('div', { class: 'callout trap' }, h('h4', null, 'IEB trap · 29.1'), '✗ The anode is always negative.', h('br'), '✓ In an electrolytic cell the anode is the POSITIVE electrode (it is connected to the positive terminal). Name electrodes by their job, not their sign.')]);
      }
      draw();
    }
  };

  /* ---------- C4: the membrane cell ---------- */
  S.tools.membrane = {
    id: 'membrane', mod: 29, section: '29.4', title: 'The membrane cell',
    blurb: 'Chlorine and sodium hydroxide from brine: a titanium anode, a steel cathode and a membrane that lets only Na⁺ through. Switch off the membrane, or use dilute brine, and see what goes wrong.',
    render(el) {
      const st = { membrane: true, saturated: true, p: 0, playing: false };
      const stage = h('div', { class: 'stage' }), svgBox = h('div'), cap = h('div', { class: 'cap', 'aria-live': 'polite' }), bar = h('div', { class: 'bar' });
      add(stage, [svgBox, cap, bar]);
      const side = h('div', { class: 'card' });
      add(el, [S.legend(), h('div', { class: 'split' }, stage, side)]);
      let raf, last = 0;
      S.onLeave(() => cancelAnimationFrame(raf));
      const frame = ts => { if (!st.playing) return; const dt = last ? Math.min(.05, (ts - last) / 1000) : 0; last = ts; st.p += dt; pic(); raf = requestAnimationFrame(frame); };
      function pic() {
        const cp = compactBox(svgBox), k = cp ? 1.75 : 1, F = n => (n * k).toFixed(1);
        const p = st.p, W = 720, H = 470, CX = cp ? 230 : 200, AX = cp ? 490 : 520;
        const aria = `Membrane cell: steel cathode on the left, titanium anode on the right, ${st.membrane ? 'a membrane in the middle that lets only Na⁺ through' : 'no membrane'}, ${st.saturated ? 'saturated' : 'dilute'} brine`;
        let s = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${aria}">`;
        s += `<rect x="318" y="20" width="84" height="40" rx="6" fill="#fff" stroke="#343a40" stroke-width="3"/><text x="360" y="${cp ? 50 : 46}" text-anchor="middle" font-size="${F(13)}" font-weight="700">DC</text><text x="${cp ? 322 : 330}" y="16" font-size="${F(16)}" font-weight="700" fill="#343a40">−</text><text x="${cp ? 382 : 384}" y="16" font-size="${F(16)}" font-weight="700" fill="#343a40">+</text>`;
        s += `<path d="M${AX} 165 L${AX} 40 L402 40 M318 40 L${CX} 40 L${CX} 165" fill="none" stroke="#343a40" stroke-width="3"/>`;
        s += `<rect x="60" y="150" width="600" height="270" rx="10" fill="none" stroke="#495057" stroke-width="3"/>`;
        s += `<rect x="62" y="172" width="296" height="246" fill="#eef7fb"/><rect x="362" y="172" width="296" height="246" fill="${st.saturated ? '#f1f6e4' : '#f6f8f2'}"/>`;
        s += `<rect x="${CX - 14}" y="160" width="28" height="235" fill="#868e96" stroke="#495057"/><text x="${CX}" y="412" text-anchor="middle" font-size="${F(12)}">steel</text>`;
        s += `<rect x="${AX - 14}" y="160" width="28" height="235" fill="#b9c0c7" stroke="#495057"/><text x="${AX}" y="412" text-anchor="middle" font-size="${F(12)}">titanium</text>`;
        const bw = cp ? 148 : 106, bh = cp ? 62 : 44;
        s += `<rect x="${cp ? 66 : 72}" y="190" width="${bw}" height="${bh}" rx="6" fill="#fdecec" stroke="#c92a2a"/><text x="${(cp ? 66 : 72) + bw / 2}" y="${cp ? 216 : 208}" text-anchor="middle" font-size="${F(12)}" font-weight="700" fill="#9b1c1c">CATHODE (−)</text><text x="${(cp ? 66 : 72) + bw / 2}" y="${cp ? 242 : 225}" text-anchor="middle" font-size="${F(11)}" fill="#9b1c1c">reduction</text>`;
        s += `<rect x="${cp ? 506 : 542}" y="190" width="${bw}" height="${bh}" rx="6" fill="#e8f0fd" stroke="#1c64d6"/><text x="${(cp ? 506 : 542) + bw / 2}" y="${cp ? 216 : 208}" text-anchor="middle" font-size="${F(12)}" font-weight="700" fill="#144a9e">ANODE (+)</text><text x="${(cp ? 506 : 542) + bw / 2}" y="${cp ? 242 : 225}" text-anchor="middle" font-size="${F(11)}" fill="#144a9e">oxidation</text>`;
        const mlab = st.membrane ? ['membrane:', 'only Na⁺ passes', '#2b7a35'] : ['no membrane:', 'everything mixes', '#a3360f'];
        if (st.membrane) s += `<rect x="355" y="150" width="10" height="270" fill="#3fa34d"/>`;
        s += cp ? `<text x="360" y="106" text-anchor="middle" font-size="${F(12)}" fill="${mlab[2]}" font-weight="700">${mlab[0]}</text><text x="360" y="132" text-anchor="middle" font-size="${F(12)}" fill="${mlab[2]}" font-weight="700">${mlab[1]}</text>`
          : `<text x="360" y="140" text-anchor="middle" font-size="12" fill="${mlab[2]}" font-weight="700">${mlab[0]} ${mlab[1]}</text>`;
        for (let k = 0; k < 10; k++) { const ph = ((p * .5) + k / 10) % 1; s += `<circle cx="${CX + 26 + (k % 3) * 9}" cy="${385 - ph * 200}" r="4" fill="#fff" stroke="#6c757d"/><circle cx="${AX - 26 - (k % 3) * 9}" cy="${385 - ph * 200}" r="4" fill="${st.saturated || k % 2 ? '#d8f0a0' : '#fff'}" stroke="#6c757d"/>`; }
        s += `<text x="${CX - 12}" y="140" text-anchor="end" font-size="${F(13)}" font-weight="700">H₂(g) out ↑</text><text x="${AX + 12}" y="140" font-size="${F(13)}" font-weight="700">${st.saturated ? 'Cℓ₂(g)' : 'Cℓ₂ + O₂'} out ↑</text>`;
        for (let k = 0; k < 4; k++) { const ph = ((p * .12) + k / 4) % 1; s += `<text x="${470 - ph * 220}" y="${270 + k * 32}" text-anchor="middle" font-size="${F(13)}" font-weight="700" fill="#9b1c1c" stroke="#fff" stroke-width="3" paint-order="stroke">Na⁺</text>`; }
        if (!st.membrane) for (let k = 0; k < 3; k++) { const ph = ((p * .12) + k / 3) % 1; s += `<text x="${250 + ph * 220}" y="${286 + k * 36}" text-anchor="middle" font-size="${F(13)}" font-weight="700" fill="#144a9e" stroke="#fff" stroke-width="3" paint-order="stroke">OH⁻</text>`; }
        const flows = [`water in → · ← NaOH(aq) out`, `${st.saturated ? 'saturated' : 'dilute'} brine in → · ← depleted brine out`];
        if (!cp) s += `<text x="66" y="445" font-size="12">${flows[0]}</text><text x="654" y="445" text-anchor="end" font-size="12">${flows[1]}</text>`;
        s += '</svg>';
        if (cp) s += `<p class="small muted" style="margin:6px 0 0">Cathode side: ${flows[0]}. Anode side: ${flows[1]}.</p>`;
        svgBox.innerHTML = s;
      }
      function draw(...a) { return S.keepFocus(el, () => draw0(...a)); } // keep keyboard focus on the control that was used
      function draw0() {
        pic();
        cap.textContent = !st.membrane ? 'Without the membrane, OH⁻ reaches the anode: chlorine reacts with the sodium hydroxide (bleach forms), the NaOH is contaminated with NaCℓ, and H₂ and Cℓ₂ can mix explosively.' : !st.saturated ? 'With dilute brine, water competes at the anode: oxygen forms as well, so the chlorine is impure.' : 'Na⁺ ions pass through the membrane to the cathode side, where OH⁻ forms: NaOH(aq) is collected. Cℓ⁻ and OH⁻ cannot cross.';
        clear(bar);
        add(bar, [seg([['on', 'Membrane in'], ['off', 'Remove the membrane']], st.membrane ? 'on' : 'off', v => { st.membrane = v === 'on'; draw(); }), seg([['sat', 'Saturated brine'], ['dil', 'Dilute brine']], st.saturated ? 'sat' : 'dil', v => { st.saturated = v === 'sat'; draw(); }),
          S.reduced() ? null : h('button', { class: 'btn ghost', type: 'button', 'aria-pressed': String(st.playing), onclick: () => { st.playing = !st.playing; last = 0; cancelAnimationFrame(raf); if (st.playing) raf = requestAnimationFrame(frame); S.keepFocus(bar, draw); } }, st.playing ? 'Pause the motion' : 'Play the motion')]);
        clear(side);
        add(side, [h('h3', null, 'Chlorine and sodium hydroxide from brine'), h('div', { class: 'steps' },
          st.saturated ? stepLine('ox', 'Anode (+), titanium', chem('2Cℓ⁻ → Cℓ₂ + 2e⁻'), 'Saturated brine: the very high [Cℓ⁻] makes the oxidation of Cℓ⁻ predominant over water.')
            : stepLine('ox', 'Anode (+), titanium', chem('2Cℓ⁻ → Cℓ₂ + 2e⁻ and 2H₂O → O₂ + 4H⁺ + 4e⁻'), 'Dilute brine: under standard conditions H₂O (+1,23 V) is a stronger reducing agent than Cℓ⁻ (+1,36 V), so water is oxidised too and the chlorine contains oxygen.'),
          stepLine('red', 'Cathode (−), steel', chem('2H₂O + 2e⁻ → H₂ + 2OH⁻'), 'Na⁺ (−2,71 V) is a weaker oxidising agent than H₂O (−0,83 V), so water is reduced.'),
          stepLine('el', 'Overall', chem('2NaCℓ + 2H₂O → 2NaOH + Cℓ₂ + H₂'), 'Ionic: 2Cℓ⁻ + 2H₂O → Cℓ₂ + H₂ + 2OH⁻'),
          stepLine('', 'Why a membrane?', 'It lets only Na⁺ (cations) through. It keeps the Cℓ₂ away from the H₂ and the NaOH, and gives pure NaOH.'),
          stepLine('', 'What is brine?', '“A concentrated aqueous solution of sodium chloride (NaCℓ).” (IEB 2019 memo, Q7.1, 3 marks)', 'SAGS F4(b) calls it “a concentrated solution of sodium chloride (brine)”.')),
          h('div', { class: 'callout ex' }, h('h4', null, 'Examiners’ report 2024'), 'Candidates are expected to know the membrane cell in detail, “including the reason a saturated solution is necessary (due to competing reactions at the anode under standard conditions)”.'),
          h('div', { class: 'callout trap' }, h('h4', null, '2017 memo, Q9.6'), '“No marks for showing oxidation of OH⁻ ions.” At the anode it is Cℓ⁻ (or water) that is oxidised.'),
          h('p', { class: 'small' }, h('a', { href: '#lab/faraday?proc=Cl2' }, 'How much chlorine in an hour at 5 000 A? Open the Faraday machine →'))]);
      }
      draw();
    }
  };

  /* ---------- C5 + C6: plating and refining ---------- */
  const PLATE_METALS = { Cu: 'CuSO₄(aq), acidified', Ag: 'AgNO₃(aq)', Ni: 'Ni(NO₃)₂(aq)', Zn: 'ZnSO₄(aq)', 'Aℓ': 'AℓCℓ₃(aq)' };
  S.tools.plating = {
    id: 'plating', mod: 29, section: '29.4', title: 'Plating and refining',
    blurb: 'Plate a spoon, a key or a baby shoe, and refine blister copper. The [Cu²⁺] gauge stays level in plating and falls in refining; the anode sludge collects. Try the classic mistakes too.',
    render(el, params) {
      const st = { mode: params.mode || 'plate', obj: 'spoon', metal: 'Cu', terminal: 'neg', paint: false, imp: { Co: true, Ni: false, Zn: false, Au: true, Ag: true }, prog: 0, running: false, p: 0 };
      const stage = h('div', { class: 'stage' }), svgBox = h('div'), cap = h('div', { class: 'cap', 'aria-live': 'polite' }), bar = h('div', { class: 'bar' });
      add(stage, [svgBox, cap, bar]);
      const ctl = h('div', { class: 'card', style: { marginTop: '14px' } }), side = h('div', { class: 'card' });
      add(el, [h('div', { class: 'split sticky' }, h('div', null, stage, ctl), side)]);
      let raf, last = 0;
      S.onLeave(() => cancelAnimationFrame(raf));
      function plateState() {
        const m = st.metal, ion = S.rowFor(m, 'ra');
        const objName = { spoon: 'steel spoon', key: 'brass key', shoe: 'baby shoe' }[st.obj];
        if (st.obj === 'shoe' && !st.paint) return { fail: 'no current', msg: 'Nothing happens: the shoe does not conduct, so it cannot act as the cathode. Coat it with conducting (metallic) paint first.' + (st.terminal === 'pos' ? ' It is also connected to the positive terminal: the object to be plated must be the cathode (negative).' : ''), objName, ion };
        const waterWins = EC.eCellValue(ion, EC.rowByKey('H₂O/H₂+OH⁻')) < 0; // the metal ion loses to water at whichever electrode is the cathode
        if (st.terminal === 'pos') return { fail: 'wrong terminal', waterWins, msg: `The ${objName} is connected to the positive terminal, so it is the ANODE: ${st.obj === 'shoe' ? 'its conducting paint is oxidised and the coating is lost' : 'it is oxidised and slowly dissolves'}, ${waterWins ? `while the ${EC.NAMES[m]} bar becomes the cathode. ${ion.oa} (${EC.ev(ion.E)} V) is a weaker oxidising agent than H₂O (−0,83 V), so water is reduced at the bar and hydrogen bubbles off.` : `while ${EC.NAMES[m]} is deposited on the ${EC.NAMES[m]} bar instead.`} The object to be plated must be the cathode (negative).`, objName, ion };
        if (EC.eCellValue(ion, EC.rowByKey('H₂O/H₂+OH⁻')) < 0) return { fail: 'water wins', msg: `${ion.oa} (${EC.ev(ion.E)} V) is a weaker oxidising agent than H₂O (−0,83 V): water is reduced at the ${objName} and hydrogen bubbles off. ${EC.NAMES[m][0].toUpperCase() + EC.NAMES[m].slice(1)} cannot be plated from an aqueous solution.`, objName, ion };
        return { fail: null, msg: `${ion.oa} ions are reduced on the ${objName} (the cathode) and the ${EC.NAMES[m]} anode is oxidised at the same rate, so the [${ion.oa}] stays the same.`, objName, ion };
      }
      function pic() {
        if (st.mode === 'plate') {
          const z = plateState(), m = st.metal;
          const working = !z.fail, pos = st.terminal === 'pos', swap = z.fail === 'wrong terminal' || (z.fail === 'no current' && pos);
          const base = m === 'Cu' ? '#78aee6' : m === 'Ni' ? '#b9dcc0' : '#eef4f8', falls = z.fail === 'wrong terminal' && !z.waterWins;
          svgBox.innerHTML = elecSVG({ compact: compactBox(svgBox), aria: `Electroplating: the ${z.objName} on the ${pos ? 'positive' : 'negative'} terminal, a ${EC.NAMES[m]} bar on the other, in ${PLATE_METALS[m]}`, solLabel: PLATE_METALS[m],
            running: st.running && z.fail !== 'no current', p: st.p, prog: st.prog, sol: falls ? mix(base, '#eef4f8', st.prog * 0.6) : base,
            cathodeName: z.objName, cathodeCol: st.obj === 'shoe' ? (st.paint ? '#9aa0a6' : '#f1e3c6') : st.obj === 'key' ? '#d4b04c' : '#adb5bd',
            anodeName: EC.NAMES[m] + ' bar', anodeCol: METAL_COL[m], anodeShrink: working || z.fail === 'water wins',
            coat: working ? METAL_COL[m] : null, cGas: z.fail === 'water wins' && (st.running || st.prog > 0) ? 'H₂' : null,
            aCoat: z.fail === 'wrong terminal' && !z.waterWins ? METAL_COL[m] : null, aGas: z.fail === 'wrong terminal' && z.waterWins && (st.running || st.prog > 0) ? 'H₂' : null,
            swapJobs: swap, cathodeSign: swap ? 'ANODE (+)' : 'CATHODE (−)', anodeSign: swap ? 'CATHODE (−)' : 'ANODE (+)',
            ions: [0, 1, 2].map(() => ({ label: z.ion.oa, to: z.fail === 'wrong terminal' ? 'a' : 'c', col: '#9b1c1c' })) });
        } else {
          const r = refineState();
          svgBox.innerHTML = elecSVG({ compact: compactBox(svgBox), aria: 'Electrorefining: blister copper anode, pure copper cathode, acidified CuSO₄(aq)', solLabel: 'CuSO₄(aq) + H₂SO₄(aq)',
            running: st.running, p: st.p, prog: st.prog, sol: r.oxidised.length ? mix('#78aee6', '#a9c8e6', st.prog * .6) : '#78aee6',
            cathodeName: 'pure copper', cathodeCol: METAL_COL.Cu, coat: METAL_COL.Cu, anodeName: 'blister copper', anodeCol: '#9c5a2a', anodeShrink: true,
            sludge: st.prog > 0.05 && r.sludge.length ? r.sludge.map(i => i.metal).join(', ') : null,
            ions: [{ label: 'Cu²⁺', to: 'c', col: '#9b1c1c' }, { label: 'Cu²⁺', to: 'c', col: '#9b1c1c' }, { label: 'SO₄²⁻', to: 'a' }].concat(st.prog > 0.1 ? r.oxidised.map(i => ({ label: i.ion, to: 'c', col: '#52677a' })) : []) });
        }
      }
      function refineState() { return EC.refine('Cu', Object.keys(st.imp).filter(k => st.imp[k])); }
      const frame = ts => { const dt = last ? Math.min(.05, (ts - last) / 1000) : 0; last = ts; st.p += dt; st.prog = Math.min(1, st.prog + dt / 20); pic(); gauge(); if (st.running) raf = requestAnimationFrame(frame); };
      let gaugeEl = null;
      function gauge() {
        if (!gaugeEl) return;
        let level = 100;
        if (st.mode === 'plate') { const z = plateState(); if (z.fail === 'wrong terminal' && !z.waterWins) level = 100 - 45 * st.prog; else if (z.fail === 'water wins') level = 100 + 0 * st.prog; }
        else if (refineState().oxidised.length) level = 100 - 45 * st.prog;
        level = Math.min(100, level);
        gaugeEl.style.width = level + '%';
      }
      const draw = () => S.keepFocus(el, draw0);
      function draw0() {
        pic();
        const z = st.mode === 'plate' ? plateState() : null;
        cap.textContent = st.mode === 'plate' ? z.msg : 'At the anode, Cu and the impurities that are stronger reducing agents than Cu are oxidised; the others fall as anode sludge. At the cathode only Cu²⁺ is reduced.';
        clear(bar);
        add(bar, [h('button', { class: 'btn', type: 'button', onclick: () => { st.running = !st.running; last = 0; if (st.running) { if (S.reduced()) { st.prog = 1; st.running = false; draw(); return; } raf = requestAnimationFrame(frame); } else cancelAnimationFrame(raf); draw(); } }, st.running ? 'Pause' : 'Run'),
          h('button', { class: 'btn ghost', type: 'button', onclick: () => { st.running = false; cancelAnimationFrame(raf); st.prog = 0; draw(); } }, 'Reset'),
          seg([['plate', 'Electroplating'], ['refine', 'Electrorefining']], st.mode, v => { st.mode = v; st.prog = 0; st.running = false; cancelAnimationFrame(raf); draw(); })]);
        clear(ctl);
        if (st.mode === 'plate') add(ctl, [h('div', { class: 'grid g2' },
          h('div', null, h('label', { class: 'f' }, 'Object'), select([['spoon', 'steel spoon'], ['key', 'brass key'], ['shoe', 'baby shoe']], st.obj, v => { st.obj = v; st.prog = 0; draw(); }, { 'aria-label': 'Object' })),
          h('div', null, h('label', { class: 'f' }, 'Plating metal (and electrolyte)'), select(Object.keys(PLATE_METALS).map(k => [k, `${EC.NAMES[k]} · ${PLATE_METALS[k]}`]), st.metal, v => { st.metal = v; st.prog = 0; draw(); }, { 'aria-label': 'Plating metal' })),
          h('div', null, h('label', { class: 'f' }, 'Object connected to'), seg([['neg', 'negative terminal'], ['pos', 'positive terminal']], st.terminal, v => { st.terminal = v; st.prog = 0; draw(); })),
          st.obj === 'shoe' ? h('div', null, h('label', { class: 'f' }, 'Conducting paint'), seg([['no', 'none'], ['yes', 'painted']], st.paint ? 'yes' : 'no', v => { st.paint = v === 'yes'; st.prog = 0; draw(); })) : null)]);
        else add(ctl, [h('label', { class: 'f' }, 'Impurities in the blister copper'), h('div', { class: 'row' }, Object.keys(st.imp).map(k => h('button', { class: 'btn small ' + (st.imp[k] ? 'on' : 'ghost'), type: 'button', 'aria-pressed': String(st.imp[k]), onclick: () => { st.imp[k] = !st.imp[k]; draw(); } }, EC.NAMES[k] + ' (' + k + ')')))]);
        clear(side);
        gaugeEl = h('i', { style: { width: '100%', background: 'var(--acc)' } });
        const gaugeRow = h('div', { class: 'meter' }, h('span', { style: { minWidth: '70px' } }, chem(st.mode === 'plate' ? '[' + plateState().ion.oa + ']' : '[Cu²⁺]')), h('div', { class: 'bar' }, gaugeEl));
        if (st.mode === 'plate') {
          const ion = z.ion, water = EC.rowByKey('H₂O/H₂+OH⁻'), waterWins = EC.eCellValue(ion, water) < 0, metal = EC.NAMES[st.metal];
          const weaker = `${ion.oa} (${EC.ev(ion.E)} V) is a weaker oxidising agent than H₂O (−0,83 V), so water is reduced and hydrogen bubbles off.`;
          // the two half-reaction rows show what actually happens in each failure state
          const pos = st.terminal === 'pos';
          const halves = z.fail === 'no current' ? [
            stepLine(pos ? 'ox' : 'red', pos ? 'Anode (+): the object' : 'Cathode (−): the object', 'No reaction: no current flows.', 'The shoe does not conduct, so no current flows and nothing is deposited.'),
            stepLine(pos ? 'red' : 'ox', pos ? 'Cathode (−): a bar of the plating metal' : 'Anode (+): a bar of the plating metal', 'No reaction: no current flows.', 'No current flows, so the bar does not react.')]
            : z.fail === 'wrong terminal' ? [
            stepLine('red', `Cathode (−): the ${metal} bar`, chem(EC.reductionHalf(waterWins ? water : ion).text), waterWins ? weaker : `${metal[0].toUpperCase() + metal.slice(1)} is deposited on the bar, not on the object.`),
            stepLine('ox', 'Anode (+): the object', 'the object’s metal is oxidised', 'The metal slowly dissolves and the object loses mass: it is not plated.')]
            : z.fail === 'water wins' ? [
            stepLine('red', 'Cathode (−): the object', chem(EC.reductionHalf(water).text), weaker + ' No metal is deposited: the object’s mass does not change.'),
            stepLine('ox', 'Anode (+): a bar of the plating metal', chem(EC.oxidationHalf(ion).text), 'The bar is still oxidised and loses mass, but no metal is deposited on the object.')]
            : [
            stepLine('red', 'Cathode (−): the object', chem(EC.reductionHalf(ion).text), 'The object’s mass increases by the mass of metal deposited.'),
            stepLine('ox', 'Anode (+): a bar of the plating metal', chem(EC.oxidationHalf(ion).text), 'It loses the same mass.')];
          add(side, [h('h3', null, 'Electroplating'), gaugeRow, h('div', { class: 'steps', style: { marginTop: '10px' } },
            halves,
            stepLine('', 'Electrolyte', chem(PLATE_METALS[st.metal]), 'It must contain ions of the plating metal. When a question gives a list, choose from it.'),
            stepLine('', 'Concentration', z.fail === 'no current' ? `[${ion.oa}] stays the same: no current flows.` : z.fail === 'wrong terminal' && !z.waterWins ? `[${ion.oa}] decreases: ${ion.oa} is reduced at the bar, but the object, not ${metal}, is oxidised.` : z.fail === 'wrong terminal' ? `[${ion.oa}] stays the same: water is reduced at the bar.` : z.fail === 'water wins' ? `[${ion.oa}] increases: the bar is oxidised, but ${ion.oa} is not reduced.` : `[${ion.oa}] stays the same.`)),
            z.fail ? h('div', { class: 'callout trap' }, h('h4', null, 'Why it fails: ' + z.fail), z.msg) : notice('ok', 'This set-up plates the object.'),
            h('div', { class: 'callout ex' }, h('h4', null, 'Examiners’ report 2023, Q7.2.3'), '“It was key to understand that the lead rod was increasing in mass due to the mass of nickel plating it.”')]);
        } else {
          const r = refineState();
          add(side, [h('h3', null, 'Electrorefining blister copper'), gaugeRow, h('div', { class: 'steps', style: { marginTop: '10px' } },
            stepLine('', 'Electrolyte', chem('CuSO₄(aq), acidified with H₂SO₄'), 'The acid adds ions, so the solution conducts better (2021 memo: “It increases the conductivity of the electrolyte solution”).'),
            stepLine('ox', 'Anode (+): impure blister copper', chem(['Cu → Cu²⁺ + 2e⁻'].concat(r.oxidised.map(i => EC.oxidationHalf(i.row).text)).join('; ')), r.oxidised.length ? r.oxidised.map(i => i.why).join('. ') + '.' : 'No impurity is a stronger reducing agent than Cu.'),
            stepLine('', 'Anode sludge', r.sludge.length ? r.sludge.map(i => i.metal).join(', ') : 'none', r.sludge.length ? r.sludge.map(i => i.why).join('. ') + '.' : null),
            stepLine('red', 'Cathode (−): pure copper', chem('Cu²⁺ + 2e⁻ → Cu'), r.cathodeWhy + '.'),
            stepLine('', '[Cu²⁺] in the electrolyte', r.concentration, r.oxidised.length ? 'Only Cu²⁺ is reduced at the cathode, but at the anode Cu and impurity atoms are oxidised, so in the same time more Cu²⁺ reacts than is produced (2025 memo).' : 'With no oxidisable impurities, Cu is oxidised as fast as Cu²⁺ is reduced.')),
            h('div', { class: 'callout trap' }, h('h4', null, 'IEB trap · WE 29.10'), '✗ At the anode: Co²⁺ is a weaker oxidising agent than Cu²⁺, so Co is oxidised.', h('br'), '✓ At the anode compare the REDUCING agents (metals): “Co is a stronger reducing agent than Cu, so Co is oxidised.” At the cathode compare the OXIDISING agents (ions).'),
            h('p', { class: 'small muted' }, 'The correct term is electrorefining (2025 report: “The SAGs terminology is ‘electrorefining’”).')]);
        }
        gauge();
      }
      draw();
    }
  };

  /* ---------- C7 + C8: the Faraday machine ---------- */
  const PROCS = {
    Cu: { label: 'copper deposited from Cu²⁺', half: 'Cu²⁺ + 2e⁻ → Cu', sp: 'Cu', ratio: 2, M: 63.5 },
    Ag: { label: 'silver deposited from Ag⁺', half: 'Ag⁺ + e⁻ → Ag', sp: 'Ag', ratio: 1, M: 108 },
    Ni: { label: 'nickel deposited from Ni²⁺', half: 'Ni²⁺ + 2e⁻ → Ni', sp: 'Ni', ratio: 2, M: 59 },
    Zn: { label: 'zinc deposited from Zn²⁺', half: 'Zn²⁺ + 2e⁻ → Zn', sp: 'Zn', ratio: 2, M: 65.4 },
    Cl2: { label: 'chlorine from brine', half: '2Cℓ⁻ → Cℓ₂ + 2e⁻', sp: 'Cℓ₂', ratio: 2, M: 71, gas: true },
    O2: { label: 'oxygen from water', half: '2H₂O → O₂ + 4H⁺ + 4e⁻', sp: 'O₂', ratio: 4, M: 32, gas: true },
    H2: { label: 'hydrogen from H⁺', half: '2H⁺ + 2e⁻ → H₂', sp: 'H₂', ratio: 2, M: 2, gas: true },
    NaOH: { label: 'NaOH in the membrane cell', half: '2H₂O + 2e⁻ → H₂ + 2OH⁻', sp: 'NaOH', ratio: 1, M: 40, note: 'n(NaOH) = n(OH⁻) = n(e⁻)' }
  };
  S.PROCS = PROCS;
  S.tools.faraday = {
    id: 'faraday', mod: 29, section: '29.5', title: 'The Faraday machine',
    blurb: 'The book’s Faraday chain as a live pipeline: current and time, charge, moles of electrons, the half-reaction ratio, moles, then mass or volume. Two cells in series share one charge.',
    render(el, params) {
      const num = (v, lo, hi, d) => { const x = +v; return isFinite(x) && x >= lo && x <= hi ? x : d; };
      const st = { proc: PROCS[params.proc] ? params.proc : 'Cu', I: num(params.I, 0.1, 20, 2), t: num(params.t, 1, 1e6, 1930), unit: 's', mode: params.mode === 'reverse' ? 'reverse' : 'forward', mass: num(params.m, 0.01, 1e5, 15.9), series: false, proc2: 'Ag', big: false };
      const nShow = params.steps !== undefined && params.steps !== '' ? Math.max(0, +params.steps || 0) : Infinity; // a lesson can build the chain one step at a time
      if (params.proc === 'Cl2') { st.I = 5000; st.t = 1; st.unit = 'h'; st.big = true; }
      const box = h('div', { class: 'split sticky-left' }), L = h('div', { class: 'card' }), R = h('div');
      add(box, [L, R]); el.appendChild(box);
      const tryBox = h('div', { class: 'card', style: { marginTop: '12px' } }, h('h3', null, 'Try one'), faradayQuestion());
      const out = h('div');
      add(R, [out, tryBox]);
      let iLabel;
      function secs() { return st.t * (st.unit === 'min' ? 60 : st.unit === 'h' ? 3600 : 1); }
      function chain(P, q) {
        const ne = EC.sig(q / EC.F, 6), n = EC.sig(ne / P.ratio, 6);
        const m = EC.round(n * P.M, 2), V = P.gas ? EC.round(n * EC.VM, 2) : null;
        return { ne, n, m, V };
      }
      function pipe(lines) {
        return h('div', { class: 'steps' }, lines.map(([lab, val, why, cls]) => stepLine(cls || 'el', lab, chem(val), why)));
      }
      const ratioText = P => `${P.half}, so n(${P.sp}) = ${P.ratio === 1 ? '' : '1/' + P.ratio + ' × '}n(e⁻)`;
      function controls() {
        clear(L);
        const P = PROCS[st.proc];
        const big = st.big;
        iLabel = h('label', { class: 'f' }, `Current I = ${EC.num(st.I)} A`);
        add(L, [seg([['forward', 'Charge → product'], ['reverse', 'Product → time']], st.mode, v => { st.mode = v; draw(); }),
          h('label', { class: 'f' }, 'Process'), select(Object.keys(PROCS).map(k => [k, PROCS[k].label]), st.proc, v => { st.proc = v; draw(); }, { 'aria-label': 'Process' }),
          iLabel, h('input', { type: 'range', min: big ? 100 : 0.1, max: big ? 10000 : 20, step: big ? 100 : 0.1, value: st.I, oninput: e => { st.I = EC.round(+e.target.value, 1); iLabel.textContent = `Current I = ${EC.num(st.I)} A`; results(); }, 'aria-label': 'Current in amperes' }),
          h('div', { class: 'row small' }, h('button', { class: 'btn ghost small', type: 'button', onclick: () => { st.big = !st.big; st.I = st.big ? 5000 : 2; draw(); } }, big ? 'Lab currents (0 to 20 A)' : 'Industrial currents (up to 10 000 A)')),
          st.mode === 'forward' ? h('div', null, h('label', { class: 'f' }, 'Time'), h('div', { class: 'row', style: { alignItems: 'center' } }, h('input', { type: 'text', inputmode: 'decimal', style: { width: '140px' }, value: EC.num(st.t).replace(/\s/g, ''), 'aria-label': 'Time', oninput: e => { const v = readNum(e.target.value); if (!isNaN(v) && v > 0) { st.t = v; results(); } } }),
            seg([['s', 's'], ['min', 'min'], ['h', 'h']], st.unit, v => { st.unit = v; draw(); })))
            : h('div', null, h('label', { class: 'f' }, `Mass of ${P.sp} wanted (g)`), h('input', { type: 'text', inputmode: 'decimal', style: { width: '140px' }, value: EC.num(st.mass), 'aria-label': 'Mass in grams', oninput: e => { const v = readNum(e.target.value); if (!isNaN(v) && v > 0) { st.mass = v; results(); } } })),
          st.mode === 'forward' ? h('div', null, h('label', { class: 'f' }, 'Cells in series'), seg([['one', 'one cell'], ['two', 'two cells in series']], st.series ? 'two' : 'one', v => { st.series = v === 'two'; draw(); }),
            st.series ? h('div', { style: { marginTop: '8px' } }, select(Object.keys(PROCS).filter(k => !PROCS[k].gas && k !== 'NaOH').map(k => [k, 'second cell: ' + PROCS[k].label]), st.proc2, v => { st.proc2 = v; draw(); }, { 'aria-label': 'Second cell' })) : null) : null,
          h('div', { class: 'callout trap', style: { marginTop: '12px' } }, h('h4', null, 'IEB traps'), 'Change minutes or hours to seconds. Use the half-reaction ratio (examiners’ report 2025: “Many candidates are still neglecting to use the ratio in the half-reaction”). Change kg to g. Never multiply M by a coefficient.')]);
      }
      function results() {
        clear(out);
        const P = PROCS[st.proc];
        if (st.mode === 'forward') {
          const t = secs(), q = EC.round(st.I * t, 6);
          const c = chain(P, q);
          const qTxt = q >= 1e7 ? EC.sci(q, 6) : EC.num(q);
          const lines = [];
          if (st.unit !== 's') lines.push(['Time', `t = ${EC.num(st.t)} × ${st.unit === 'h' ? '3 600' : '60'} = ${EC.num(t)} s`, 'Always in seconds.', '']);
          lines.push(['Charge', `q = It = (${EC.num(st.I)})(${EC.num(t)}) = ${qTxt} C`, null, '']);
          lines.push(['Electrons', `n(e⁻) = q/F = ${qTxt} / 96 500 = ${EC.numSig(c.ne, 6)} mol`, 'F = 96 500 C·mol⁻¹ (data sheet)', '']);
          lines.push(['Ratio', `${ratioText(P)} = ${EC.numSig(c.n, 6)} mol`, P.note || `${P.ratio} mol of electrons per mole of ${P.sp}`, P.half.indexOf('e⁻') < P.half.indexOf('→') ? 'red' : 'ox']);
          lines.push(['Mass', `m = nM = (${EC.numSig(c.n, 6)})(${EC.num(P.M)}) = ${EC.num(c.m, 2)} g${c.m >= 1000 ? ' = ' + EC.num(c.m / 1000, 2) + ' kg' : ''}`, null, '']);
          if (P.gas) lines.push(['Volume at STP', `V = nVm = (${EC.numSig(c.n, 6)})(22,4) = ${EC.num(c.V, 2)} dm³`, 'Vm = 22,4 dm³·mol⁻¹ at STP', '']);
          const vis = h('div', { class: 'stage', style: { marginBottom: '12px' } });
          vis.innerHTML = faradayPic(P, c, st.series ? PROCS[st.proc2] : null, st.series ? chain(PROCS[st.proc2], q) : null);
          const part = nShow < lines.length;
          add(out, [part ? null : vis, h('div', { class: 'card' }, h('h3', null, 'The Faraday chain'), pipe(lines.slice(0, nShow)), part ? h('p', { class: 'small muted' }, 'The chain fills in step by step as the lesson goes.') : null,
            st.series ? (() => { const P2 = PROCS[st.proc2], c2 = chain(P2, q); return h('div', { style: { marginTop: '10px' } }, h('h3', null, 'Second cell (same charge)'), pipe([['Ratio', `${ratioText(P2)} = ${EC.numSig(c2.n, 6)} mol`, 'The same current flows through both cells, so both get the same moles of electrons.', 'red'], ['Mass', `m = nM = (${EC.numSig(c2.n, 6)})(${EC.num(P2.M)}) = ${EC.num(c2.m, 2)} g`, null, '']])); })() : null)]);
        } else {
          const f = EC.faradayFromMass({ m: st.mass, M: P.M, ratio: P.ratio, I: st.I });
          add(out, [h('div', { class: 'card' }, h('h3', null, 'Mass to time (WE 29.12)'), pipe([
            ['Moles', `n(${P.sp}) = m/M = ${EC.num(st.mass)} / ${EC.num(P.M)} = ${EC.numSig(f.n, 6)} mol`, null, ''],
            ['Ratio', `${P.half}, so n(e⁻) = ${P.ratio === 1 ? '' : P.ratio}n(${P.sp}) = ${EC.numSig(f.ne, 6)} mol`, null, P.half.indexOf('e⁻') < P.half.indexOf('→') ? 'red' : 'ox'],
            ['Charge', `q = nF = (${EC.numSig(f.ne, 6)})(96 500) = ${EC.num(f.q, 2)} C`, null, ''],
            ['Time', `t = q/I = ${EC.num(f.q, 2)} / ${EC.num(st.I)} = ${EC.num(f.t, 2)} s`, f.t > 120 ? `about ${EC.num(f.t / 60, 0)} minutes` + (f.t > 7200 ? ` (${EC.num(f.t / 3600, 1)} h)` : '') : null, '']]))]);
        }
      }
      function draw(...a) { return S.keepFocus(el, () => draw0(...a)); } // keep keyboard focus on the control that was used
      function draw0() { controls(); results(); }
      draw();
    }
  };
  function faradayPic(P, c, P2, c2) {
    const W = 640, H = 200;
    const say = (P, c) => `${P.sp}: ${P.gas ? EC.num(c.V, 2) + ' dm³' : EC.num(c.m, 2) + ' g'}`;
    let s = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Product formed: ${say(P, c)}${P2 ? '; second cell ' + say(P2, c2) : ''}">`;
    const one = (x, P, c) => {
      let g = '';
      if (P.gas) {
        const frac = Math.min(1, c.V / 2.5);
        g += `<rect x="${x}" y="30" width="60" height="150" rx="6" fill="#fff" stroke="#495057"/><rect x="${x + 2}" y="${30 + 148 * (1 - frac)}" width="56" height="${148 * frac}" fill="#d8f0a0" opacity=".8"/>`;
        g += `<text x="${x + 70}" y="110" font-size="20" font-weight="700" fill="#17324d">${P.sp}: ${EC.num(c.V, 2)} dm³${frac >= 1 ? ' (off the scale)' : ''}</text>`;
      } else {
        const w = 10 + Math.min(80, Math.sqrt(c.m) * 6);
        g += `<rect x="${x}" y="30" width="22" height="150" fill="#adb5bd" stroke="#495057"/><rect x="${x + 22}" y="40" width="${w}" height="130" fill="${METAL_COL[P.sp] || '#c9a227'}" stroke="#5c3a1a" stroke-width=".5"/>`;
        g += `<text x="${x + 30 + w}" y="110" font-size="20" font-weight="700" fill="#17324d">${P.sp}: ${EC.num(c.m, 2)} g</text>`;
      }
      return g;
    };
    s += one(40, P, c);
    if (P2) s += one(360, P2, c2);
    s += '</svg>';
    return s;
  }
  /* a fresh Faraday question with stepped hints, used here and in Practise */
  function makeFaradayQ() {
    const kinds = ['Cu', 'Ag', 'Ni', 'Zn', 'Cl2', 'O2', 'H2'];
    const k = pick(kinds), P = PROCS[k];
    let I, tmin;
    // the smallest gas volumes would round so far that a wrong mole ratio still lands inside the tolerance
    // re-pick until the key is at least 0,1: smaller keys round so far that a wrong mole ratio lands inside the tolerance
    let q, ne, n, ans;
    do {
      I = pick([0.5, 1.5, 2, 2.5, 3, 4, 5, 10]); tmin = pick([10, 15, 20, 25, 30, 40, 45, 60]);
      q = I * tmin * 60; ne = EC.sig(q / EC.F, 6); n = EC.sig(ne / P.ratio, 6);
      ans = P.gas ? EC.round(n * EC.VM, 2) : EC.round(n * P.M, 2);
    } while ((P.gas && I === 0.5 && tmin <= 15) || ans < 0.1);
    return {
      text: `A current of ${EC.num(I)} A flows for ${tmin} minutes. Calculate the ${P.gas ? 'volume (at STP) of ' : 'mass of '}${P.sp} produced (${P.label}).`,
      unit: P.gas ? 'dm³' : 'g', ans,
      hints: [`Change the time to seconds: t = ${tmin} × 60 = ${EC.num(tmin * 60)} s.`, `q = It = (${EC.num(I)})(${EC.num(tmin * 60)}) = ${EC.num(q)} C, then n(e⁻) = q/F = ${EC.numSig(ne, 6)} mol.`, `${P.half}: n(${P.sp}) = ${P.ratio === 1 ? '' : '1/' + P.ratio + ' × '}n(e⁻) = ${EC.numSig(n, 6)} mol.`],
      sol: [`t = ${tmin} × 60 = ${EC.num(tmin * 60)} s`, `q = It = (${EC.num(I)})(${EC.num(tmin * 60)}) = ${EC.num(q)} C`, `n(e⁻) = q/F = ${EC.num(q)} / 96 500 = ${EC.numSig(ne, 6)} mol`, `${P.half}, so n(${P.sp}) = ${EC.numSig(n, 6)} mol`, P.gas ? `V = nVm = (${EC.numSig(n, 6)})(22,4) = ${EC.num(ans, 2)} dm³` : `m = nM = (${EC.numSig(n, 6)})(${EC.num(P.M)}) = ${EC.num(ans, 2)} g`],
      traps: { noRatio: P.gas ? EC.round(ne * EC.VM, 2) : EC.round(ne * P.M, 2), minutes: P.gas ? EC.round(I * tmin / EC.F / P.ratio * EC.VM, 4) : EC.round(I * tmin / EC.F / P.ratio * P.M, 4) },
      section: '29.5', parts: { P, I, t: tmin * 60, q, ne, n }
    };
  }
  S.makeFaradayQ = makeFaradayQ;
  function faradayQuestion() {
    const wrap = h('div');
    let q = makeFaradayQ(), shown = 0, res = null, typed = '';
    const draw = () => S.keepFocus(wrap, draw0);
    function draw0() {
      clear(wrap);
      const checkBtn = h('button', { class: 'btn small', type: 'button', onclick: () => {
        const v = readNum(typed); if (isNaN(v)) { res = notice('', 'Type a number (a decimal comma is fine).'); draw(); return; }
        const ok = close(v, q.ans, Math.max(0.011, q.ans * 0.01));
        logAttempt({ kind: 'supported', section: '29.5', id: 'faraday', correct: ok ? 1 : 0, total: 1 });
        res = ok ? notice('ok', 'Correct: ' + EC.num(q.ans, 2) + ' ' + q.unit + '.') : notice('no', close(v, q.traps.noRatio, q.traps.noRatio * 0.01) ? 'You left out the half-reaction ratio: moles of electrons are not moles of product.' : close(v, q.traps.minutes, Math.abs(q.traps.minutes) * 0.02 + 1e-4) ? 'You used minutes in q = It: change the time to seconds.' : 'Not yet. Use a hint, or check each step of the chain.');
        draw();
      } }, 'Check');
      const inp = h('input', { type: 'text', inputmode: 'decimal', 'aria-label': 'Your answer', value: typed, oninput: e => { typed = e.target.value; }, onkeydown: e => { if (e.key === 'Enter') { e.preventDefault(); checkBtn.click(); } } });
      add(wrap, [h('p', { class: 'prompt' }, q.text), h('div', { class: 'answer-row' }, inp, h('span', null, q.unit), checkBtn),
        q.hints.slice(0, shown).map((t, i) => h('div', { class: 'hint' }, h('b', null, 'Hint ' + (i + 1) + ': '), t)),
        res,
        h('div', { class: 'row', style: { marginTop: '8px' } }, shown < q.hints.length ? h('button', { class: 'btn ghost small', type: 'button', onclick: () => { shown++; draw(); } }, 'I need a hint') : null,
          h('button', { class: 'btn ghost small', type: 'button', onclick: () => { res = h('div', { class: 'sol' }, q.sol.map(l => h('div', { class: 'ln' }, l))); draw(); } }, 'Show the worked solution'),
          h('button', { class: 'btn ghost small', type: 'button', onclick: () => { q = makeFaradayQ(); shown = 0; res = null; typed = ''; draw(); } }, 'New question'))]);
    }
    draw();
    return wrap;
  }

  /* ---------- C9: hydrate and ion-ratio trainer ---------- */
  const HYDRATES = [
    { f: 'MgCℓ₂·6H₂O', ion: 'Cℓ⁻', k: 2, cat: 'Mg²⁺' }, { f: 'CaCℓ₂·6H₂O', ion: 'Cℓ⁻', k: 2, cat: 'Ca²⁺' }, { f: 'CuSO₄·5H₂O', ion: 'Cu²⁺', k: 1, cat: 'Cu²⁺' },
    { f: 'AℓCℓ₃·6H₂O', ion: 'Cℓ⁻', k: 3, cat: 'Aℓ³⁺' }, { f: 'Na₂SO₄·10H₂O', ion: 'Na⁺', k: 2, cat: 'Na⁺' }, { f: 'NiSO₄·6H₂O', ion: 'Ni²⁺', k: 1, cat: 'Ni²⁺' }
  ];
  S.HYDRATES = HYDRATES;
  S.tools.hydrate = {
    id: 'hydrate', mod: 29, section: '29.3', title: 'Hydrate and ion-ratio trainer',
    blurb: 'The six waters go into M; the ion ratio goes into the ion concentration. The step the 2024 examiners said most learners missed.',
    render(el) {
      let item, m, V, shown, res, typed = '';
      const box = h('div', { class: 'card' });
      el.appendChild(box);
      function fresh(first) {
        item = first ? HYDRATES[0] : pick(HYDRATES); m = first ? 55 : pick([12, 15, 20, 25, 30, 40, 55]); V = first ? 100 : pick([100, 250, 500]); shown = 0; res = null; typed = ''; draw();
      }
      const draw = () => S.keepFocus(box, draw0);
      function draw0() {
        clear(box);
        // the key keeps the calculator values; n and c are rounded only in the step text
        const M = EC.molarMass(item.f), nRaw = m / M, cRaw = nRaw / (V / 1000), ionC = EC.round(item.k * cRaw, 2), n = EC.round(nRaw, 4), c = EC.round(cRaw, 3);
        const steps = [EC.molarMassWorking(item.f), `n = m/M = ${EC.num(m)} / ${EC.num(M)} = ${EC.num(n, 4)} mol`, `c(${item.f.split('·')[0]}) = n/V = ${EC.num(n, 4)} / ${EC.num(V / 1000, 3)} = ${EC.num(c, 3)} mol·dm⁻³`, `1 ${item.f.split('·')[0]} → ${item.k === 1 ? '' : item.k}${item.ion}, so [${item.ion}] = ${item.k === 1 ? '' : item.k + ' × '}${EC.num(c, 3)} = ${EC.num(ionC, 2)} mol·dm⁻³`];
        add(box, [h('p', { class: 'prompt' }, `${EC.num(m)} g of `, chem(item.f), ` is dissolved to make ${V} cm³ of solution. Calculate [`, chem(item.ion), '].'),
          (() => {
            const checkBtn = h('button', { class: 'btn small', type: 'button', onclick: () => {
              const v = readNum(typed); if (isNaN(v)) { res = notice('', 'Type a number (a decimal comma is fine).'); draw(); return; }
              const ok = close(v, ionC, 0.011);
              const noWater = EC.round(item.k * (m / EC.molarMass(item.f.split('·')[0])) / (V / 1000), 2), noRatio = EC.round(cRaw, 2);
              logAttempt({ kind: 'supported', section: '29.3', id: 'hydrate', correct: ok ? 1 : 0, total: 1 });
              res = ok ? notice('ok', 'Correct.') : notice('no', close(v, noWater, 0.011) ? 'You left the waters of crystallisation out of M. The six (or five, or ten) H₂O go into the molar mass.' : close(v, noRatio, 0.011) && item.k > 1 ? `That is the concentration of the salt. Each formula unit gives ${item.k} ${item.ion} ions: use the ion ratio.` : 'Not yet: take a hint.');
              draw();
            } }, 'Check');
            const inp = h('input', { type: 'text', inputmode: 'decimal', 'aria-label': 'Concentration', value: typed, oninput: e => { typed = e.target.value; }, onkeydown: e => { if (e.key === 'Enter') { e.preventDefault(); checkBtn.click(); } } });
            return h('div', { class: 'answer-row' }, inp, h('span', null, 'mol·dm⁻³'), checkBtn);
          })(),
          steps.slice(0, shown).map((t, i) => h('div', { class: 'hint' }, h('b', null, 'Step ' + (i + 1) + ': '), chem(t))),
          res,
          h('div', { class: 'row', style: { marginTop: '8px' } }, shown < steps.length ? h('button', { class: 'btn ghost small', type: 'button', onclick: () => { shown++; draw(); } }, 'Show the next step') : null, h('button', { class: 'btn ghost small', type: 'button', onclick: () => fresh() }, 'New question')),
          h('div', { class: 'callout ex', style: { marginTop: '12px' } }, h('h4', null, 'Examiners’ report 2024, P2 Q7.4'), '“The overwhelming majority of learners did not know what to do with the 6H₂O waters of crystallisation.” And: “many learners did not make use of the ionic ratio to calculate the chloride ion concentration.”')]);
      }
      fresh(true);
    }
  };
})();
