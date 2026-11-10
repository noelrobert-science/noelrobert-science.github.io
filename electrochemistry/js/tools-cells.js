/* Module 28 labs: build and break a cell (B1, B2), the cell notation workshop (B3), the SHE explorer and
   build-Table-4-yourself (B4, B5), running down (B6) and the internal resistance bench (B7). */
(function () {
  'use strict';
  const EC = window.EC, S = window.STUDIO;
  const { h, add, clear, chem, seg, select, stepLine, notice, readNum, close, shuffle, pick, logAttempt } = S;

  /* half-cells learners can choose */
  const HC = [
    { id: 'Zn', row: 'Zn²⁺/Zn', sol: 'Zn(NO₃)₂(aq)', col: '#eef1f4', el: 'Zn', ec: '#adb5bd' },
    { id: 'Cu', row: 'Cu²⁺/Cu', sol: 'Cu(NO₃)₂(aq)', col: '#7fb2e5', el: 'Cu', ec: '#c87533', blue: true },
    { id: 'Ag', row: 'Ag⁺/Ag', sol: 'AgNO₃(aq)', col: '#f4f6f8', el: 'Ag', ec: '#ced4da' },
    { id: 'Mg', row: 'Mg²⁺/Mg', sol: 'Mg(NO₃)₂(aq)', col: '#eef1f4', el: 'Mg', ec: '#dee2e6' },
    { id: 'Al', row: 'Aℓ³⁺/Aℓ', sol: 'Aℓ(NO₃)₃(aq)', col: '#eef1f4', el: 'Aℓ', ec: '#dfe3e6' },
    { id: 'Ni', row: 'Ni²⁺/Ni', sol: 'Ni(NO₃)₂(aq)', col: '#b9dcc0', el: 'Ni', ec: '#c9c9b8' },
    { id: 'Fe', row: 'Fe²⁺/Fe', sol: 'Fe(NO₃)₂(aq)', col: '#dcebd3', el: 'Fe', ec: '#868e96' },
    { id: 'Pb', row: 'Pb²⁺/Pb', sol: 'Pb(NO₃)₂(aq)', col: '#eef1f4', el: 'Pb', ec: '#6c757d' },
    { id: 'Co', row: 'Co²⁺/Co', sol: 'Co(NO₃)₂(aq)', col: '#f4cdd8', el: 'Co', ec: '#8d99a6' },
    { id: 'Cr', row: 'Cr³⁺/Cr', sol: 'Cr(NO₃)₃(aq)', col: '#b8d8b8', el: 'Cr', ec: '#a5aab0' },
    { id: 'Cl2', row: 'Cℓ₂/Cℓ⁻', sol: 'KCℓ(aq), Cℓ₂(g) at 1 atm', col: '#f3f8e6', inert: true, gas: 'Cℓ₂', ions: ['Cℓ⁻'] },
    { id: 'Br2', row: 'Br₂/Br⁻', sol: 'KBr(aq) + Br₂(aq)', col: '#f6c48a', inert: true, ions: ['Br₂', 'Br⁻'] },
    { id: 'I2', row: 'I₂/I⁻', sol: 'KI(aq) + I₂(aq)', col: '#c08a5a', inert: true, ions: ['I₂', 'I⁻'] },
    { id: 'Fe3', row: 'Fe³⁺/Fe²⁺', sol: 'Fe³⁺(aq) and Fe²⁺(aq)', col: '#ecd283', inert: true, ions: ['Fe³⁺', 'Fe²⁺'] },
    { id: 'MnO4', row: 'MnO₄⁻+H⁺/Mn²⁺+H₂O', sol: 'KMnO₄(aq), acidified with H₂SO₄', col: '#9c4fad', inert: true, metal: 'Mn', ions: ['MnO₄⁻', 'H⁺', 'Mn²⁺'] },
    { id: 'SHE', row: 'H⁺/H₂', sol: 'H⁺(aq) 1 mol·dm⁻³, H₂(g) at 1 atm, 25 °C', col: '#f4f8fb', inert: true, gas: 'H₂', she: true, ions: ['H⁺'] }
  ];
  const hcRow = c => EC.rowByKey(c.row);
  const hcName = c => { const r = hcRow(c); return c.inert ? `${r.oa} / ${r.ra} (Pt)` : `${r.ra} | ${r.oa}`; };
  S.HC = HC;

  /* observations, as the memo words them */
  function observations(an, ca) {
    const a = hcRow(an), c = hcRow(ca), out = [];
    if (!an.inert) out.push(`Anode: the ${EC.NAMES[a.ra]} electrode gets thinner (its mass decreases).`);
    else if (a.ra === 'Br⁻') out.push('Anode: the solution round the Pt turns a deeper orange (Br₂ forms).');
    else if (a.ra === 'I⁻') out.push('Anode: the solution round the Pt turns darker brown (I₂ forms).');
    else if (a.ra === 'Fe²⁺') out.push('Anode: the solution becomes more yellow-brown (Fe³⁺ forms).');
    else if (a.ra === 'H₂') out.push('Anode: hydrogen gas is used up at the platinum.');
    else if (a.ra === 'Cℓ⁻') out.push('Anode: bubbles of pale green-yellow chlorine gas form.');
    if (a.ra === 'Cu') out.push('Anode half-cell: the solution becomes a deeper blue (Cu²⁺ forms).');
    const TINT = { Ni: ['green', 'Ni²⁺'], Co: ['pink', 'Co²⁺'], Cr: ['green', 'Cr³⁺'], Fe: ['pale green', 'Fe²⁺'] };
    if (!an.inert && TINT[a.ra]) out.push(`Anode half-cell: the ${TINT[a.ra][0]} colour deepens (${TINT[a.ra][1]} forms).`);
    if (!ca.inert && TINT[c.ra]) out.push(`Cathode half-cell: the ${TINT[c.ra][0]} colour fades (${TINT[c.ra][1]} is used up).`);
    if (!ca.inert) out.push(`Cathode: a layer of ${EC.NAMES[c.ra]} forms on the ${EC.NAMES[c.ra]} electrode (its mass increases).`);
    if (ca.blue) out.push('Cathode half-cell: the blue colour fades (Cu²⁺ is used up).');
    if (c.oa === 'MnO₄⁻') out.push('Cathode half-cell: the purple colour fades.');
    if (c.oa === 'Fe³⁺' && ca.inert) out.push('Cathode half-cell: the yellow-brown colour fades to pale green (Fe²⁺ forms).');
    if (c.oa === 'Br₂') out.push('Cathode half-cell: the orange colour fades.');
    if (c.oa === 'I₂') out.push('Cathode half-cell: the brown colour fades.');
    if (c.oa === 'H⁺') out.push('Cathode: bubbles of hydrogen gas form on the platinum.');
    if (c.oa === 'Cℓ₂') out.push('Cathode: chlorine gas is used up at the platinum.');
    return out;
  }

  /* the cell picture: two beakers, wire, voltmeter, salt bridge. p is the animation clock (seconds).
     o.compact: the drawing is in a phone-width box, so every word is drawn about twice as large (11 px or more on screen)
     and the solution names go in a line under the drawing. */
  function cellSVG(L, R, o) {
    const W = 760, H = 440, cp = !!o.compact, k = cp ? 1.9 : 1, F = n => (n * k).toFixed(1);
    const anodeLeft = o.anodeLeft;
    const run = o.running && !o.noBridge && !(o.lift > 0.35);
    const p = o.p || 0;
    const prog = Math.min(1, (o.elapsed || 0) / 30);
    const anion = o.bridge === 'KCℓ' ? 'Cℓ⁻' : 'NO₃⁻';
    const halo = cp ? ' stroke="#fff" stroke-width="5" paint-order="stroke"' : '';
    let s = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Galvanic cell: ${hcName(L)} and ${hcName(R)}">`;
    const beaker = (x, c, isAnode, side) => {
      const row = hcRow(c);
      let col = c.col;
      if (run) {
        const to = (t, a) => { col = mixC(c.col, t, prog * a); };
        if (!isAnode) { // the oxidising agent is used up
          if (c.blue) to('#eef4f8', 0.7);
          else if (row.oa === 'MnO₄⁻') to('#e9d6ee', 0.7);
          else if (row.oa === 'Fe³⁺') to('#dcebd3', 0.75);
          else if (row.oa === 'Br₂' || row.oa === 'I₂') to('#f4f6f8', 0.75);
          else if (!c.inert && ['Ni²⁺', 'Co²⁺', 'Cr³⁺', 'Fe²⁺'].includes(row.oa)) to('#f4f6f8', 0.6);
        } else { // the oxidised form builds up
          const deeper = { Cu: '#4f8fd6', Ni: '#7fbf8e', Co: '#e58fac', Cr: '#7fb57f', Fe: '#b9d6a8', 'Br⁻': '#e8892f', 'I⁻': '#6e3a12', 'Fe²⁺': '#ddb24a' }[row.ra];
          if (deeper) to(deeper, 0.55);
        }
      }
      let b = `<path d="M${x} 190 L${x} 395 Q${x} 410 ${x + 15} 410 L${x + 215} 410 Q${x + 230} 410 ${x + 230} 395 L${x + 230} 190" fill="none" stroke="#495057" stroke-width="3"/>`;
      b += `<rect x="${x + 2}" y="230" width="226" height="178" fill="${col}" opacity=".85"/>`;
      if (o.ppt === side) b += `<g opacity="${Math.min(1, prog * 3)}">${Array.from({ length: 30 }, (_, j) => `<circle cx="${x + 30 + (j * 53) % 170}" cy="${300 + (j * 31) % 90}" r="3" fill="#fff" stroke="#adb5bd"/>`).join('')}</g>`
        + (cp ? `<text x="${x + 175}" y="404" text-anchor="middle" font-size="${F(12)}" fill="#495057"${halo}>AgCℓ(s)</text>` : `<text x="${x + 115}" y="402" text-anchor="middle" font-size="12" fill="#495057">white AgCℓ precipitate</text>`);
      // electrode
      const ex = x + 85, chosen = o.electrode?.[side], elName = chosen || (c.inert ? 'Pt' : c.el);
      const ecol = { Pt: '#e9ecef', graphite: '#343a40', Cu: '#c87533', Mn: '#9aa0a6', Fe: '#868e96' }[elName] || c.ec;
      let w = c.inert ? 22 : 26;
      if (run && !c.inert && isAnode) w = 26 * (1 - 0.45 * prog);
      if (run && !c.inert && !isAnode) w = 26 * (1 + 0.35 * prog);
      b += `<rect x="${ex + 13 - w / 2}" y="120" width="${w}" height="240" fill="${ecol}" stroke="#495057"/>`;
      b += cp ? `<text x="${ex + 13}" y="388" text-anchor="middle" font-size="${F(13)}" fill="#17324d" font-weight="700"${halo}>${elName}</text>`
        : `<text x="${ex + 36}" y="150" font-size="13" fill="#17324d" font-weight="700">${elName}</text>`;
      if (o.attacked === side) b += `<text x="${ex + 13}" y="${cp ? 345 : 378}" text-anchor="middle" font-size="${F(12)}" fill="#a3360f" font-weight="700"${halo}>attacked!</text>`;
      if (c.gas) { // the gas tube goes on the outer side of the beaker, clear of the salt bridge
        const right = side === 'R', tx = right ? x + 200 : x + 30, end = right ? x + 125 : x + 60, bub = right ? x + 118 : x + 68;
        b += `<path d="M${tx} 70 L${tx} 340 L${end} 340" fill="none" stroke="#868e96" stroke-width="5"/>`;
        b += cp ? `<text x="${right ? x + 228 : x + 4}" y="62" text-anchor="${right ? 'end' : 'start'}" font-size="${F(12)}" fill="#495057">${c.gas}(g)</text>`
          : `<text x="${right ? tx - 8 : tx + 8}" y="88" text-anchor="${right ? 'end' : 'start'}" font-size="12" fill="#495057">${c.gas}(g)</text>`;
        for (let j = 0; j < 5; j++) { const ph = ((p * 0.5) + j / 5) % 1; b += `<circle cx="${bub + (right ? -1 : 1) * (j % 2) * 6}" cy="${340 - ph * 100}" r="4" fill="#fff" stroke="#868e96"/>`; }
      }
      if (!cp) b += `<text x="${x + 115}" y="428" text-anchor="middle" font-size="13" fill="#17324d">${c.sol}</text>`;
      if (o.showRoles) {
        const lab = isAnode ? ['ANODE (−)', 'oxidation'] : ['CATHODE (+)', 'reduction'];
        const fill = isAnode ? '#e8f0fd' : '#fdecec', line = isAnode ? '#1c64d6' : '#c92a2a', ink = isAnode ? '#144a9e' : '#9b1c1c';
        if (cp) { const lx = side === 'R' ? x + 55 : x + 8; b += `<rect x="${lx}" y="192" width="168" height="60" rx="8" fill="${fill}" stroke="${line}"/><text x="${lx + 10}" y="219" font-size="${F(12)}" font-weight="700" fill="${ink}">${lab[0]}</text><text x="${lx + 10}" y="245" font-size="${F(11)}" fill="${ink}">${lab[1]}</text>`; }
        else { const lx = side === 'R' ? x + 52 : x + 8; b += `<rect x="${lx}" y="196" width="${isAnode ? 168 : 180}" height="26" rx="6" fill="${fill}" stroke="${line}"/><text x="${lx + 8}" y="214" font-size="13" font-weight="700" fill="${ink}">${lab[0]} · ${lab[1]}</text>`; }
      }
      return b;
    };
    s += beaker(40, L, anodeLeft, 'L');
    s += beaker(490, R, !anodeLeft, 'R');
    // wire and voltmeter
    const xl = 40 + 85 + 13, xr = 490 + 85 + 13, mr = cp ? 46 : 34;
    s += `<path d="M${xl} 120 L${xl} 50 L${380 - mr} 50 M${380 + mr} 50 L${xr} 50 L${xr} 120" fill="none" stroke="#343a40" stroke-width="3"/>`;
    s += `<circle cx="380" cy="50" r="${mr}" fill="#fff" stroke="#343a40" stroke-width="3"/>`;
    s += cp ? `<text x="380" y="56" text-anchor="middle" font-size="28" font-weight="700" fill="#17324d">${o.reading}</text><text x="380" y="84" text-anchor="middle" font-size="20" fill="#52677a">V</text>`
      : `<text x="380" y="46" text-anchor="middle" font-size="15" font-weight="700" fill="#17324d">${o.reading}</text><text x="380" y="64" text-anchor="middle" font-size="11" fill="#52677a">V</text>`;
    if (o.terminals) s += `<text x="${380 - mr - 8}" y="38" text-anchor="end" font-size="${F(16)}" font-weight="700" fill="#343a40">${o.terminals[0]}</text><text x="${380 + mr + 8}" y="38" font-size="${F(16)}" font-weight="700" fill="#343a40">${o.terminals[1]}</text>`;
    // salt bridge: a dark outline first, so the band stands out on the stage and in the solutions
    if (!o.noBridge) {
      const d = 'M235 380 L235 160 Q235 140 255 140 L505 140 Q525 140 525 160 L525 380', lf = o.lift || 0;
      if (lf) s += `<g transform="translate(0 ${(-260 * lf).toFixed(1)})" opacity="${(1 - 0.85 * lf).toFixed(2)}">`;
      s += `<path d="${d}" fill="none" stroke="#8a7a3e" stroke-width="34"/><path d="${d}" fill="none" stroke="#dfd1a6" stroke-width="30"/>`;
      s += cp ? `<text x="380" y="190" text-anchor="middle" font-size="${F(12)}" fill="#6b5a1e">salt bridge</text><text x="380" y="216" text-anchor="middle" font-size="${F(12)}" fill="#6b5a1e">${o.bridge || 'KNO₃'}(aq)</text>`
        : `<text x="380" y="180" text-anchor="middle" font-size="12" fill="#6b5a1e">salt bridge: ${o.bridge || 'KNO₃'}(aq)</text>`;
      if (lf) s += '</g>';
    } else s += cp ? `<text x="380" y="150" text-anchor="middle" font-size="${F(12)}" fill="#a3360f" font-weight="700">no salt bridge:</text><text x="380" y="176" text-anchor="middle" font-size="${F(12)}" fill="#a3360f" font-weight="700">the circuit is open</text>`
      : `<text x="380" y="150" text-anchor="middle" font-size="13" fill="#a3360f" font-weight="700">no salt bridge: the circuit is open</text>`;
    if (run) {
      // electrons along the wire from anode to cathode
      const path = anodeLeft ? [[xl, 120], [xl, 50], [xr, 50], [xr, 120]] : [[xr, 120], [xr, 50], [xl, 50], [xl, 120]];
      const segs = []; let tot = 0;
      for (let i = 0; i < 3; i++) { const d = Math.hypot(path[i + 1][0] - path[i][0], path[i + 1][1] - path[i][1]); segs.push(d); tot += d; }
      for (let j = 0; j < 7; j++) {
        let d = (((p * 90) + j * tot / 7) % tot);
        let i = 0; while (d > segs[i]) { d -= segs[i]; i++; }
        const f = d / segs[i], x = path[i][0] + (path[i + 1][0] - path[i][0]) * f, y = path[i][1] + (path[i + 1][1] - path[i][1]) * f;
        if (Math.abs(x - 380) < mr + 2 && y < 100) continue;
        s += `<circle cx="${x}" cy="${y}" r="${cp ? 8 : 6}" fill="#343a40"/>`;
      }
      s += `<text x="${anodeLeft ? 230 : 530}" y="40" text-anchor="middle" font-size="${F(12)}" fill="#343a40" font-weight="700">e⁻ ${anodeLeft ? '→' : '←'}</text>`;
      // ions in the bridge: cations (red) to the cathode, anions (blue) to the anode
      for (let j = 0; j < 4; j++) {
        const ph = ((p * 0.12) + j / 4) % 1;
        const cx = anodeLeft ? 262 + ph * 236 : 498 - ph * 236;
        const ax = anodeLeft ? 498 - ph * 236 : 262 + ph * 236;
        s += `<text x="${cx}" y="${cp ? 150 : 146}" text-anchor="middle" font-size="${F(12)}" font-weight="700" fill="#c92a2a">K⁺</text><text x="${ax}" y="${j % 2 ? (cp ? 170 : 160) : (cp ? 126 : 132)}" text-anchor="middle" font-size="${F(11)}" font-weight="700" fill="#1c64d6">${anion}</text>`;
      }
    }
    s += '</svg>';
    if (cp) s += `<p class="small muted" style="margin:6px 0 0">Left: ${L.sol}. Right: ${R.sol}.</p>`;
    return s;
  }
  const compactBox = box => (box.clientWidth || (box.parentNode && box.parentNode.clientWidth) || window.innerWidth) < 560;
  S.compactBox = compactBox;
  function mixC(a, b, p) { const pa = [1, 3, 5].map(i => parseInt(a.substr(i, 2), 16)), pb = [1, 3, 5].map(i => parseInt(b.substr(i, 2), 16)); return '#' + pa.map((v, i) => Math.round(v + (pb[i] - v) * p).toString(16).padStart(2, '0')).join(''); }
  S.cellSVG = cellSVG;

  /* ---------- B1 + B2: build and break a cell ---------- */
  S.tools.cell = {
    id: 'cell', mod: 28, section: '28.1', title: 'Build a cell',
    blurb: 'Choose any two half-cells. Electrons flow in the wire, ions drift in the salt bridge, and the anode, cathode, half-reactions, notation and Eθcell build alongside. Then try to break it.',
    render(el, params) {
      const st = { L: HC.find(c => c.id === (params.l || 'Zn')), R: HC.find(c => c.id === (params.r || 'Cu')), running: false, p: 0, elapsed: 0, predict: params.predict === '1', guess: {}, bridge: ['KNO₃', 'KCℓ', 'none'].includes(params.bridge) ? params.bridge : 'KNO₃', electrode: {}, revealed: false };
      const stage = h('div', { class: 'stage' }), svgBox = h('div'), cap = h('div', { class: 'cap', 'aria-live': 'polite' }), bar = h('div', { class: 'bar' });
      add(stage, [svgBox, cap, bar]);
      const ctl = h('div', { class: 'card', style: { marginTop: '14px' } }), side = h('div');
      add(el, [S.legend(), h('div', { class: 'split sticky' }, h('div', null, stage, ctl), side)]);
      let raf, last = 0;
      S.onLeave(() => cancelAnimationFrame(raf));
      function state() {
        const lr = hcRow(st.L), rr = hcRow(st.R);
        const anodeLeft = lr.E < rr.E;
        const an = anodeLeft ? st.L : st.R, ca = anodeLeft ? st.R : st.L;
        const aRow = hcRow(an), cRow = hcRow(ca);
        const sideOf = c => (c === st.L ? 'L' : 'R');
        // problems that break the cell
        let ppt = null, attacked = null, problem = null;
        const ag = [st.L, st.R].find(c => c.id === 'Ag');
        // Ag⁺ is a reactant when silver is the cathode (the reading drops) but a product when silver is the anode (against Br₂, Cℓ₂ or MnO₄⁻)
        const agAnode = !!ag && ag === an, mno4 = st.bridge === 'KCℓ' && [st.L, st.R].some(c => c.id === 'MnO4');
        if (st.bridge === 'KCℓ' && ag) { ppt = sideOf(ag); problem = agAnode ? 'Cℓ⁻ ions from the KCℓ bridge react with Ag⁺ ions to form a white AgCℓ precipitate. Here silver is the anode, so Ag⁺ is a product: [Ag⁺] decreases, so the forward reaction is favoured and the voltage increases. The cell is no longer standard. Use KNO₃.' : 'Cℓ⁻ ions from the KCℓ bridge react with Ag⁺ ions to form a white AgCℓ precipitate. Ag⁺ is removed from the silver half-cell, so the reading drops. Use KNO₃.'; }
        if (mno4) problem = 'MnO₄⁻ (+1,51 V) is a stronger oxidising agent than Cℓ₂ (+1,36 V): it oxidises the Cℓ⁻ from the bridge and is used up, so the reading drops. Use KNO₃ (2024 report, Q6.8).';
        ['L', 'R'].forEach(sd => {
          const c = sd === 'L' ? st.L : st.R, e = st.electrode[sd];
          if (!c.inert || !e || e === 'Pt' || e === 'graphite') return;
          if (e === 'Cu' && EC.reacts(EC.rowByKey('Cu²⁺/Cu'), hcRow(c))) { attacked = sd; problem = `Copper is not inert here: ${hcRow(c).oa} (${EC.ev(hcRow(c).E)} V) is a stronger oxidising agent than Cu²⁺ (+0,34 V), so it oxidises the copper electrode. An inert electrode must conduct and be unreactive.`; }
          if (e === 'Mn' && c.id === 'MnO4') { attacked = sd; problem = '“Mn(s) is not part of the given half-cell reaction. If used, a different reaction will occur.” (Examiners’ report 2024, Q6.1.) Use Pt or graphite.'; }
          if (e === 'Fe' && c.id === 'Fe3') { attacked = sd; problem = 'Iron is not inert here: Fe³⁺ (+0,77 V) is a stronger oxidising agent than Fe²⁺ (−0,44 V), so it oxidises the iron electrode (Fe + 2Fe³⁺ → 3Fe²⁺). An inert electrode must conduct and be unreactive. Use Pt or graphite.'; }
        });
        const noBridge = st.bridge === 'none';
        // SAGS 29/54: the SHE is always connected as the anode (negative terminal), so the reading is Eθ of the other half-cell, with its sign
        const she = an.she ? an : ca.she ? ca : null, other = she ? (she === an ? ca : an) : null;
        let value = she ? EC.eCellValue(hcRow(other), hcRow(she)) : EC.eCellValue(cRow, aRow);
        if (noBridge) value = 0;
        else if (ppt && st.elapsed > 2) { const k = Math.min(1, st.elapsed / 20); value = agAnode && !mno4 ? value + 0.1 * k : Math.max(0, value - 0.35 * k); }
        else if (mno4 && st.elapsed > 0) value = Math.max(0, value - 0.3 * Math.min(1, st.elapsed / 20));
        else if (st.elapsed > 0) value *= 1 - 0.1 * Math.min(1, st.elapsed / 30); // the reading falls a little as the concentrations change (28.7)
        return { an, ca, aRow, cRow, anodeLeft, ppt, attacked, problem, noBridge, value, she, other, aSide: anodeLeft ? 'L' : 'R', cSide: anodeLeft ? 'R' : 'L' };
      }
      function frame(ts) {
        const dt = last ? Math.min(0.05, (ts - last) / 1000) : 0; last = ts;
        st.p += dt; st.elapsed += dt;
        drawSVG();
        if (st.running) raf = requestAnimationFrame(frame);
      }
      function drawSVG() {
        const z = state();
        const same = st.L === st.R;
        const show = !st.predict || st.revealed;
        svgBox.innerHTML = cellSVG(st.L, st.R, { compact: compactBox(svgBox), anodeLeft: z.anodeLeft, running: st.running && !same, p: st.p, elapsed: st.elapsed, noBridge: z.noBridge, bridge: st.bridge, reading: same ? '0,00' : st.lift > 0.35 ? '0,00' : show || st.running ? EC.evPlain(z.value) : '?', lift: st.lift || 0, ppt: z.ppt, electrode: st.electrode, attacked: z.attacked, showRoles: show && !same });
      }
      const draw = () => S.keepFocus(el, draw0); // keep keyboard focus on the control that was used
      function draw0() {
        const z = state();
        const same = st.L === st.R;
        drawSVG();
        cap.textContent = same ? 'Choose two different half-cells.' : z.noBridge ? 'Without the salt bridge, charge builds up in the half-cells and the circuit is open: no current flows and the reading is 0.' : z.problem ? z.problem : st.running ? `Electrons flow through the wire from the ${hcRow(z.an).ra === 'H₂' ? 'platinum (SHE)' : z.an.inert ? elWord(z.aSide) : EC.NAMES[z.aRow.ra]} anode to the cathode. In the salt bridge, cations drift towards the cathode and anions towards the anode. Electrons never enter the solution. The reading falls slowly as the cell runs (see When a cell runs down).` : 'Press Play to run the cell.';
        clear(bar);
        add(bar, [h('button', { class: 'btn', type: 'button', disabled: same || (st.predict && !st.revealed), onclick: () => { st.running = !st.running; last = 0; if (st.running && !S.reduced()) raf = requestAnimationFrame(frame); else { cancelAnimationFrame(raf); if (st.running) { st.elapsed = 30; drawSVG(); } } draw(); } }, st.running ? 'Pause' : 'Play'),
          h('button', { class: 'btn ghost', type: 'button', onclick: () => { st.running = false; cancelAnimationFrame(raf); st.elapsed = 0; st.p = 0; draw(); } }, 'Reset'),
          seg([['explore', 'Explore'], ['predict', 'Predict']], st.predict ? 'predict' : 'explore', v => { st.predict = v === 'predict'; st.running = false; cancelAnimationFrame(raf); st.elapsed = 0; st.p = 0; st.revealed = false; st.guess = {}; draw(); })]);
        // controls
        clear(ctl);
        const opts = HC.map(c => [c.id, hcName(c)]);
        add(ctl, [h('div', { class: 'grid g2' },
          h('div', null, h('label', { class: 'f' }, 'Left half-cell'), select(opts, st.L.id, v => { st.L = HC.find(c => c.id === v); st.electrode = {}; reset(); }, { 'aria-label': 'Left half-cell' }),
            elSelect('L')),
          h('div', null, h('label', { class: 'f' }, 'Right half-cell'), select(opts, st.R.id, v => { st.R = HC.find(c => c.id === v); st.electrode = {}; reset(); }, { 'aria-label': 'Right half-cell' }),
            elSelect('R'))),
          h('label', { class: 'f' }, 'Salt bridge'), seg([['KNO₃', 'KNO₃(aq)'], ['KCℓ', 'KCℓ(aq)'], ['none', 'remove it']], st.bridge, v => { st.bridge = v; st.elapsed = 0; draw(); })]);
        clear(side);
        side.appendChild(same ? notice('', 'Choose two different half-cells.') : z.noBridge && !(st.predict && !st.revealed) ? h('div', { class: 'card' }, h('h3', null, 'No salt bridge'), h('p', null, 'The circuit is open. As soon as ions form in the anode half-cell and ions are used up in the cathode half-cell, charge builds up in the two solutions and stops the flow. So no current flows and nothing changes.'), h('p', { class: 'small muted' }, 'Put the salt bridge back to see what the cell does.')) : panel(z));
      }
      // the electrode word and symbol for an inert half-cell (SAGS: the SHE is always platinum)
      const ELW = { Pt: 'platinum', graphite: 'graphite', Cu: 'copper', Mn: 'manganese', Fe: 'iron' }, ELS = { Pt: 'Pt', graphite: 'C', Cu: 'Cu', Mn: 'Mn', Fe: 'Fe' };
      function elWord(sd) { return ELW[st.electrode[sd] || 'Pt']; }
      function elSelect(sd) {
        const c = sd === 'L' ? st.L : st.R, name = sd === 'L' ? 'Left electrode' : 'Right electrode';
        if (!c.inert) return null;
        if (c.she) return h('p', { class: 'small muted', style: { marginTop: '6px' } }, 'Electrode: platinum. The SHE is defined with platinum.');
        return h('div', null, h('label', { class: 'f' }, name), select([['Pt', 'platinum (Pt)'], ['graphite', 'graphite'], ['Cu', 'copper'], ...(c.metal ? [[c.metal, 'manganese']] : []), ...(c.id === 'Fe3' ? [['Fe', 'iron']] : [])], st.electrode[sd] || 'Pt', v => { st.electrode[sd] = v; draw(); }, { 'aria-label': name }));
      }
      function reset() { st.running = false; cancelAnimationFrame(raf); st.elapsed = 0; st.p = 0; st.revealed = false; st.guess = {}; draw(); }
      function panel(z) {
        const box = h('div', { class: 'card' });
        if (st.predict && !st.revealed) {
          const lname = st.L.inert ? 'left (' + elWord('L') + ')' : 'left (' + st.L.el + ')', rname = st.R.inert ? 'right (' + elWord('R') + ')' : 'right (' + st.R.el + ')';
          add(box, [h('h3', null, 'Predict first'),
            h('p', null, '1 · Which electrode is the anode?'), h('div', { class: 'row' }, [['L', lname], ['R', rname]].map(([v, l]) => h('button', { class: 'btn small ' + (st.guess.anode === v ? 'on' : 'ghost'), type: 'button', onclick: () => { st.guess.anode = v; draw(); } }, l))),
            h('p', { style: { marginTop: '10px' } }, '2 · Which way do electrons flow in the wire?'), h('div', { class: 'row' }, [['LR', 'left → right'], ['RL', 'right → left']].map(([v, l]) => h('button', { class: 'btn small ' + (st.guess.flow === v ? 'on' : 'ghost'), type: 'button', onclick: () => { st.guess.flow = v; draw(); } }, l))),
            h('button', { class: 'btn', type: 'button', style: { marginTop: '12px' }, disabled: !st.guess.anode || !st.guess.flow, onclick: () => {
              st.revealed = true; const okA = (st.guess.anode === 'L') === z.anodeLeft, okF = (st.guess.flow === 'LR') === z.anodeLeft;
              st.guess.result = [okA, okF]; logAttempt({ kind: 'supported', section: '28.1', id: 'cell-predict', correct: (okA ? 1 : 0) + (okF ? 1 : 0), total: 2 }); draw();
            } }, 'Reveal')]);
          return box;
        }
        const net = EC.netEquation(z.aRow, z.cRow);
        // with the SHE in the cell, the notation and Eθcell follow SAGS (SHE on the left); the half-reactions and net reaction stay spontaneous
        const sheRow = z.she ? hcRow(z.she) : null, oRow = z.she ? hcRow(z.other) : null;
        const cn = z.she ? EC.cellNotation(sheRow, oRow) : EC.cellNotation(z.aRow, z.cRow);
        const ec = z.she ? EC.eCell(oRow, sheRow) : EC.eCell(z.cRow, z.aRow);
        const sub = z.she ? `Eθcell = ${EC.evSub(oRow.E)} − ${EC.evSub(sheRow.E)}` : ec.substitute;
        const ptNote = 'A half-cell with no solid conductor needs an inert electrode (Pt, or C for graphite), written on the outside.';
        // the notation follows the electrodes on screen (the 2023 memo accepts Pt(s) or C(s))
        const leftSide = z.she ? (z.she === st.L ? 'L' : 'R') : z.aSide, rightSide = leftSide === 'L' ? 'R' : 'L';
        let cnText = cn.text;
        if (st.electrode[leftSide] && st.electrode[leftSide] !== 'Pt') cnText = cnText.replace(/^Pt/, ELS[st.electrode[leftSide]]);
        if (st.electrode[rightSide] && st.electrode[rightSide] !== 'Pt') cnText = cnText.replace(/Pt$/, ELS[st.electrode[rightSide]]);
        const cap1 = t => t[0].toUpperCase() + t.slice(1);
        const anName = z.an.inert ? `The ${elWord(z.aSide)} electrode in the ${z.aRow.ra} half-cell` : cap1(EC.NAMES[z.aRow.ra]);
        const caName = z.ca.inert ? `The ${elWord(z.cSide)} electrode in the ${z.cRow.oa} half-cell` : cap1(EC.NAMES[z.cRow.ra]);
        // the salt bridge, named for this cell (28.2 recipe: name the ions and the half-cells)
        const anion = st.bridge === 'KCℓ' ? 'Cℓ⁻' : 'NO₃⁻', charged = t => /[⁺⁻]$/.test(t);
        const aChange = z.an.inert && charged(z.aRow.ra) ? `${z.aRow.ra} ions are used up` : `${z.aRow.oa} ions form`;
        const cChange = charged(z.cRow.oa) ? `${z.cRow.oa} ions are used up` : `${z.cRow.ra} ions form`;
        const bridgeText = `${aChange} in the anode half-cell, so ${anion} ions move from the salt bridge into it (and positive ions move from it into the bridge). ${cChange} in the cathode half-cell, so K⁺ ions move from the bridge into it (and negative ions move from it into the bridge). This keeps both half-cells electrically neutral and completes the circuit. Electrons never pass through the salt bridge.`;
        // standard conditions for this cell
        const ionsOf = c => c.ions || [hcRow(c).oa], gases = [z.an, z.ca].filter(c => c.gas).map(c => c.gas + '(g)');
        const ions = [...new Set([...ionsOf(z.an), ...ionsOf(z.ca)])];
        const stdText = ions.map(i => '[' + i + ']').join(' = ') + ' = 1 mol·dm⁻³ (each ion, not each salt), at 25 °C (298 K)' + (gases.length ? `; ${gases.join(' and ')} at 1 atm.` : '. There is no gas, so there is no pressure condition.');
        if (st.guess.result) box.appendChild(notice(st.guess.result.every(Boolean) ? 'ok' : 'no', st.guess.result.every(Boolean) ? 'Both predictions right.' : `Anode: ${st.guess.result[0] ? 'right' : 'wrong'}. Electron flow: ${st.guess.result[1] ? 'right' : 'wrong'}. The anode holds the stronger reducing agent (higher on Table 4), and electrons leave from the anode.`));
        add(box, [h('h3', null, 'What the cell does'), h('div', { class: 'steps' },
          stepLine('ox', 'Anode (negative)', `${anName}`, `${z.aRow.ra} (${EC.ev(z.aRow.E)} V) is a stronger reducing agent than ${z.cRow.ra} (${EC.ev(z.cRow.E)} V), so ${z.aRow.ra} is oxidised.`),
          stepLine('ox', 'Anode half-reaction', chem(EC.oxidationHalf(z.aRow).text)),
          stepLine('red', 'Cathode (positive)', caName, `${z.cRow.oa} (${EC.ev(z.cRow.E)} V) is a stronger oxidising agent than ${z.aRow.oa} (${EC.ev(z.aRow.E)} V), so ${z.cRow.oa} is reduced.`),
          stepLine('red', 'Cathode half-reaction', chem(EC.reductionHalf(z.cRow).text)),
          stepLine('el', 'Overall cell reaction', chem(net.text)),
          stepLine('el', 'Electrons', `From the anode to the cathode, through the wire (${z.anodeLeft ? 'left to right' : 'right to left'}).`),
          stepLine('', 'Salt bridge', bridgeText),
          stepLine('', 'Standard conditions for this cell', stdText),
          stepLine('', z.she ? 'Cell notation (SHE as the anode)' : 'Cell notation', chem(cnText), z.she ? 'When used as a reference electrode, the SHE is connected as the anode (to the negative terminal of the voltmeter) even though it may not spontaneously act as the anode, so it is written on the left. ' + ptNote : cn.needsPt ? ptNote : null),
          stepLine('', 'Eθcell', h('span', null, ec.formula, h('br'), sub, h('br'), ec.answer), z.she && ec.value < 0 ? `The negative sign shows that ${oRow.oa} is not reduced: ${oRow.ra} is oxidised and H⁺ is reduced. The reaction does not occur spontaneously in the direction given in the cell notation.` : null),
          stepLine('', 'Observations', h('ul', { style: { margin: '0', paddingLeft: '18px', fontFamily: 'var(--font)', fontSize: '1rem' } }, observations(z.an, z.ca).map(o => h('li', null, o))))),
          z.problem ? h('div', { class: 'callout trap' }, h('h4', null, 'Why it fails'), z.problem) : null]);
        return box;
      }
      draw();
      // a narrated lesson can lift the salt bridge out on cue ("I'm going to lift the salt bridge out")
      el.addEventListener('lesson-beat', e => {
        const ev = e.detail || {};
        if (ev.bridge !== 'none' || st.bridge === 'none') return;
        const finish = () => { st.lift = 0; st.bridge = 'none'; st.running = false; cancelAnimationFrame(raf); draw(); };
        if (!ev.animate || S.reduced()) return finish();
        const t0 = performance.now(), wasRunning = st.running;
        cancelAnimationFrame(raf);
        const step = ts => { st.lift = Math.min(1, (ts - t0) / 1100); if (wasRunning) { st.p += 1 / 60; } drawSVG(); if (st.lift < 1) raf = requestAnimationFrame(step); else finish(); };
        raf = requestAnimationFrame(step);
      });
      if (params.run === '1' && st.L !== st.R && !st.predict) { st.running = true; last = 0; if (S.reduced()) { st.elapsed = 30; } else raf = requestAnimationFrame(frame); draw(); }
    }
  };

  /* ---------- B3: cell notation workshop ---------- */
  const NOTATION_SETS = [['Zn', 'Cu'], ['Mg', 'Ag'], ['Zn', 'Cl2'], ['Ni', 'Fe3'], ['Br2', 'Cl2'], ['SHE', 'Ag'], ['Al', 'Ni'], ['Cu', 'Ag'], ['Fe', 'Cl2'], ['I2', 'Fe3'], ['Pb', 'Cu'], ['Fe3', 'MnO4'], ['Co', 'Br2']];
  S.tools.notation = {
    id: 'notation', mod: 28, section: '28.4', title: 'Cell notation workshop',
    blurb: 'Build the notation from tiles. Feedback names the exact memo error: coefficients, a missing Pt, a comma or a line. Reverse mode reads a notation back.',
    render(el, params) {
      let mode = 'build', task, line, res;
      const box = h('div', { class: 'card' });
      el.appendChild(box);
      function fresh(first) {
        const given = first && params && HC.find(c => c.id === params.a) && HC.find(c => c.id === params.b) && params.a !== params.b ? [params.a, params.b] : null;
        const [a, b] = (given || pick(NOTATION_SETS)).map(id => HC.find(c => c.id === id));
        const ra = hcRow(a), rb = hcRow(b);
        const an = ra.E < rb.E ? a : b, ca = an === a ? b : a;
        task = { an, ca, aRow: hcRow(an), cRow: hcRow(ca), flip: Math.random() < 0.5 };
        line = []; res = null; draw();
      }
      function tokens() {
        const sp = new Set();
        [task.aRow, task.cRow].forEach(r => [...r.ox, ...r.red].forEach(t => { if (t.sp !== 'H₂O') sp.add(t.sp); }));
        const extra = ['Pt'];
        const net = EC.netEquation(task.aRow, task.cRow);
        net.left.concat(net.right).filter(t => t.c > 1).forEach(t => extra.push(t.c + t.sp));
        return shuffle([...sp, ...extra]).concat(['|', '||', ',']);
      }
      const draw = () => S.keepFocus(box, draw0);
      function draw0() {
        clear(box);
        add(box, [h('div', { class: 'row', style: { marginBottom: '10px' } }, seg([['build', 'Build the notation'], ['read', 'Read a notation']], mode, v => { mode = v; fresh(); }))]);
        // the half-cells are named in either order, so the learner must decide the anode (step 1 of the recipe)
        const pair = task.flip ? [task.ca, task.an] : [task.an, task.ca];
        const aq = pair.filter(c => c.id === 'Br2' || c.id === 'I2').map(c => c.id === 'Br2' ? 'bromine' : 'iodine');
        const desc = `A galvanic cell is made from the ${hcName(pair[0]).replace(' (Pt)', '')} half-cell and the ${hcName(pair[1]).replace(' (Pt)', '')} half-cell under standard conditions.` + (aq.length ? ` Assume that the ${aq.join(' and the ')} ${aq.length > 1 ? 'are' : 'is'} in aqueous solution.` : '');
        if (mode === 'build') {
          if (!task.toks) task.toks = tokens();
          add(box, [h('p', { class: 'prompt' }, desc + ' Write the cell notation.'),
            h('p', { class: 'small muted' }, 'Work out the anode first (the stronger reducing agent). Tap tiles to build the line; tap a placed tile to remove it.'),
            h('div', { class: 'line-build', 'aria-live': 'polite' }, line.length ? line.map((t, i) => h('button', { class: 'tok', type: 'button', style: { border: 0, cursor: 'pointer', font: 'inherit' }, onclick: () => { line.splice(i, 1); res = null; draw(); } }, t)) : h('span', { class: 'muted small' }, 'your notation…')),
            h('div', { class: 'tiles', style: { marginTop: '10px' } }, task.toks.map(t => h('button', { class: 'tile', type: 'button', onclick: () => { line.push(t); res = null; draw(); } }, t))),
            h('div', { class: 'row', style: { marginTop: '12px' } }, h('button', { class: 'btn', type: 'button', disabled: !line.length, onclick: check }, 'Check'), h('button', { class: 'btn ghost', type: 'button', onclick: () => { line = []; res = null; draw(); } }, 'Clear'), h('button', { class: 'btn ghost new-cell', type: 'button', onclick: () => { fresh(); S.focusTo(box.querySelector('.new-cell')); S.say('A new cell.'); } }, 'New cell')),
            res]);
        } else {
          const cn = EC.cellNotation(task.aRow, task.cRow).text;
          task.q = task.q || buildRead();
          add(box, [h('p', { class: 'prompt' }, 'Read this cell notation:'), h('div', { class: 'line-build', style: { borderStyle: 'solid' } }, chem(cn)),
            task.q.map((q, qi) => h('div', { style: { marginTop: '12px' } }, h('b', null, q.text), h('div', { class: 'choices' }, q.opts.map(o => h('button', { class: 'choice' + (q.ans !== undefined ? (o.ok ? ' right' : q.ans === o ? ' wrongc' : '') : ''), type: 'button', onclick: () => { if (q.ans !== undefined) return; q.ans = o; logAttempt({ kind: 'supported', section: '28.4', id: 'read-notation', correct: o.ok ? 1 : 0, total: 1 }); draw(); } }, chem(o.t)))))),
            h('div', { class: 'row', style: { marginTop: '12px' } }, h('button', { class: 'btn ghost', type: 'button', onclick: fresh }, 'New notation'))]);
        }
      }
      function buildRead() {
        const a = task.aRow, c = task.cRow, net = EC.netEquation(a, c);
        const anodeOpts = [{ t: task.an.inert ? 'Pt (in the ' + a.ra + ' half-cell)' : a.ra, ok: true }, { t: task.ca.inert ? 'Pt (in the ' + c.oa + ' half-cell)' : c.ra, ok: false }];
        return [
          { text: 'Which electrode is the anode?', opts: shuffle(anodeOpts) },
          { text: 'What is the reducing agent?', opts: shuffle([{ t: a.ra, ok: true }, { t: c.oa, ok: false }, { t: a.oa, ok: false }, { t: c.ra, ok: false }].filter((o, i, arr) => arr.findIndex(x => x.t === o.t) === i)) },
          { text: 'What is the oxidising agent?', opts: shuffle([{ t: c.oa, ok: true }, { t: a.ra, ok: false }, { t: c.ra, ok: false }, { t: a.oa, ok: false }].filter((o, i, arr) => arr.findIndex(x => x.t === o.t) === i)) },
          { text: 'What is the net cell reaction?', opts: S.netOptions(a, c).map(o => ({ t: o.t, ok: !!o.ok })) }
        ];
      }
      function check() {
        const attempt = line.join(' ').replace(/ , /g, ', ');
        const r = EC.checkNotation(attempt, task.aRow, task.cRow);
        logAttempt({ kind: 'supported', section: '28.4', id: 'notation', correct: r.ok ? 1 : 0, total: 1 });
        res = r.ok ? notice('ok', 'Correct: ', chem(r.correct)) : h('div', null, notice('no', h('ul', { style: { margin: 0, paddingLeft: '18px' } }, r.issues.map(i => h('li', null, i)))), h('div', { class: 'redo' }, 'Wrong? Reread 28.4 (Cell notation), fix the line and check again.'), h('details', { class: 'box' }, h('summary', null, 'Show the memo answer'), h('div', null, chem(r.correct))));
        draw();
      }
      fresh(true);
    }
  };

  /* ---------- B4 + B5: SHE explorer and build Table 4 yourself ---------- */
  S.tools.she = {
    id: 'she', mod: 28, section: '28.5', title: 'Standard hydrogen electrode explorer',
    blurb: 'The SHE is wired as the anode. Connect any half-cell: the signed reading is its Eθ. Measure ten and build part of Table 4 yourself.',
    render(el) {
      const others = HC.filter(c => !c.she);
      const st = { R: others.find(c => c.id === 'Ag'), measured: [], p: 0, playing: false };
      const SHE = HC.find(c => c.she);
      const stage = h('div', { class: 'stage' }), svgBox = h('div'), cap = h('div', { class: 'cap', 'aria-live': 'polite' });
      const bar = h('div', { class: 'bar' });
      add(stage, [svgBox, cap, bar]);
      const side = h('div');
      add(el, [h('div', { class: 'split' }, h('div', null, stage, h('div', { class: 'card', style: { marginTop: '14px' } }, h('h3', null, 'The standard hydrogen electrode'),
        h('ol', { class: 'rules' }, h('li', null, 'Hydrogen gas at 1 atm bubbles over platinum (coated with platinum black).'), h('li', null, 'The solution has [H⁺] = 1 mol·dm⁻³, at 25 °C.'), h('li', null, 'Its Eθ is defined as 0,00 V.'), h('li', null, 'When used as a reference electrode the standard hydrogen electrode is connected as the anode (to the negative terminal of a voltmeter) even though it may not spontaneously act as the anode. (SAGS)'), h('li', null, 'So the voltmeter reading is the Eθ of the other half-cell, with its sign: the reading is negative when the other half-cell’s metal is a stronger reducing agent than H₂.')))), side)]);
      let raf, last = 0;
      const frame = ts => { if (!st.playing) return; const dt = last ? Math.min(.05, (ts - last) / 1000) : 0; last = ts; st.p += dt; drawSVG(); raf = requestAnimationFrame(frame); };
      function drawBar() { // starts still (a frame with the electrons shown); the moving version is the learner's choice
        clear(bar);
        if (S.reduced()) return;
        add(bar, [h('button', { class: 'btn ghost', type: 'button', 'aria-pressed': String(st.playing), onclick: () => { st.playing = !st.playing; last = 0; cancelAnimationFrame(raf); if (st.playing) raf = requestAnimationFrame(frame); S.keepFocus(bar, drawBar); } }, st.playing ? 'Pause the motion' : 'Play the motion')]);
      }
      S.onLeave(() => cancelAnimationFrame(raf));
      function drawSVG() {
        const r = hcRow(st.R);
        const real = r.E > 0; // positive: SHE really is the anode
        svgBox.innerHTML = cellSVG(SHE, st.R, { compact: compactBox(svgBox), anodeLeft: real || Math.abs(r.E) < 1e-9, running: true, p: st.p, elapsed: 0, reading: EC.ev(r.E), showRoles: false, terminals: ['−', '+'] });
      }
      const draw = () => S.keepFocus(side, draw0);
      function draw0() {
        const r = hcRow(st.R);
        drawSVG();
        cap.textContent = r.E > 0 ? `Reading ${EC.ev(r.E)} V: positive, so the SHE really is the anode. ${r.oa} is reduced and H₂ is oxidised.` : `Reading ${EC.ev(r.E)} V: negative. The electrons really flow the other way: ${r.ra} is oxidised and H⁺ is reduced. ${r.oa} is not reduced.`;
        clear(side);
        const net = r.E > 0 ? EC.netEquation(EC.rowByKey('H⁺/H₂'), r) : EC.netEquation(r, EC.rowByKey('H⁺/H₂'));
        const box = h('div', { class: 'card' });
        add(box, [h('label', { class: 'f' }, 'Connect a half-cell to the SHE'), select(others.map(c => [c.id, hcName(c)]), st.R.id, v => { st.R = others.find(c => c.id === v); draw(); }, { 'aria-label': 'Half-cell' }),
          h('div', { class: 'steps', style: { marginTop: '12px' } },
            stepLine('', 'Cell notation (SHE as the anode)', chem(EC.cellNotation(EC.rowByKey('H⁺/H₂'), r).text)),
            stepLine(r.E > 0 ? 'red' : 'ox', 'Voltmeter reading', EC.ev(r.E) + ' V', r.E > 0 ? 'The reading is Eθ(' + r.oa + '/' + r.ra + '), because Eθ(SHE) = 0,00 V.' : 'The negative sign shows that ' + r.oa + ' is not reduced: ' + r.ra + ' is oxidised and H⁺ is reduced.'),
            stepLine('el', 'Net reaction that actually takes place', chem(net.text))),
          h('div', { class: 'row', style: { marginTop: '12px' } }, h('button', { class: 'btn', type: 'button', onclick: () => { if (!st.measured.includes(st.R.id)) st.measured.push(st.R.id); draw(); } }, 'Record this reading in my table')),
          h('h3', { style: { marginTop: '16px' } }, `My Table 4 (${st.measured.length >= 10 ? st.measured.length + ' measured' : st.measured.length + ' of 10 measured'})`),
          st.measured.length ? h('table', { class: 'plain' }, h('thead', null, h('tr', null, h('th', null, 'Half-reaction'), h('th', null, 'Reading (V)'))),
            h('tbody', null, st.measured.map(id => others.find(c => c.id === id)).sort((a, b) => hcRow(a).E - hcRow(b).E).map(c => { const rr = hcRow(c); return h('tr', null, h('td', null, chem(rr.leftText + ' ⇌ ' + rr.rightText)), h('td', null, EC.ev(rr.E))); }))) : h('p', { class: 'muted small' }, 'Each reading drops into place, most negative at the top, just like the data sheet.'),
          st.measured.length >= 10 ? notice('ok', 'You have built part of Table 4: it is a list of voltmeter readings against the SHE. The higher a row, the stronger the reducing agent on its right.') : null,
          h('div', { class: 'callout trap' }, h('h4', null, 'IEB trap'), '✗ Standard conditions are 0 °C and 1 atm.', h('br'), '✓ Standard conditions for cells: 25 °C (298 K), 1 mol·dm⁻³ ions, and 1 atm for a gas. STP (0 °C) is only for gas volumes.')]);
        side.appendChild(box);
      }
      draw(); drawBar();
    }
  };

  /* ---------- B6: running down ---------- */
  S.tools.rundown = {
    id: 'rundown', mod: 28, section: '28.7', title: 'When a cell runs down',
    blurb: 'A live voltage–time sketch while the ion concentrations change. Add Cu²⁺, add Zn²⁺, add Na₂S or dilute, and watch the reading fall to zero at equilibrium.',
    render(el) {
      const st = { cu: 1, zn: 1, t: 0, hist: [], running: false, last: null, msg: 'A standard Zn–Cu cell: [Zn²⁺] = [Cu²⁺] = 1 mol·dm⁻³, reading 1,10 V.' };
      const graph = h('div', { class: 'stage' }), side = h('div', { class: 'card' });
      add(el, [h('div', { class: 'split' }, graph, side)]);
      const V = () => Math.max(0, Math.min(1.6, 1.10 + 0.3 * Math.log10(Math.max(st.cu, 1e-9) / st.zn)));
      let raf;
      S.onLeave(() => cancelAnimationFrame(raf));
      function advance() {
        const v = V();
        const dx = Math.min(st.cu, 0.004 * v);
        st.cu -= dx; st.zn += dx; st.t += 1;
        st.hist.push([st.t, V()]);
        if (V() <= 0.0005) { st.running = false; st.msg = 'The reading is 0: the cell reaction has reached equilibrium (or the Cu²⁺ has been used up). It is flat, not “out of electrons”.'; }
      }
      function tick() {
        if (!st.running) return;
        if (S.reduced()) { let n = 0; while (st.running && n++ < 3000) advance(); st.running = false; draw(); return; } // no motion: jump to the end
        advance();
        if (!st.running) { draw(); return; }
        drawGraph(); if (refs.read) { refs.read.textContent = 'Reading: ' + EC.num(V(), 2) + ' V'; refs.cu.style.width = Math.min(100, st.cu / 2.5 * 100) + '%'; refs.zn.style.width = Math.min(100, st.zn / 2.5 * 100) + '%'; }
        raf = requestAnimationFrame(tick);
      }
      function act(kind) {
        if (kind !== 'cu' && V() <= 0.0005) { st.msg = 'The cell is already flat (0 V): this change cannot lower the reading further. Press Reset to start again.'; draw(); return; }
        if (kind === 'cu') { st.cu += 0.5; st.msg = '[Cu²⁺], a reactant, increases, so the forward reaction is favoured to use up the extra Cu²⁺ (to counteract the increase). The voltage increases.'; }
        if (kind === 'zn') { st.zn += 0.5; st.msg = '[Zn²⁺], a product, increases, so the reverse reaction is favoured to use up the extra Zn²⁺ (to counteract the increase). The voltage decreases.'; }
        if (kind === 'na2s') { st.cu *= 0.15; st.msg = 'Adding Na₂S to the copper half-cell precipitates CuS, so [Cu²⁺] decreases. The reverse reaction is favoured to make more Cu²⁺ (to counteract the decrease). The voltage decreases.'; }
        if (kind === 'dilute') { st.cu *= 0.5; st.msg = 'Diluting the copper half-cell lowers [Cu²⁺], a reactant. The reverse reaction is favoured to make more Cu²⁺ (to counteract the decrease), so the voltage decreases.'; }
        st.hist.push([st.t, V()]); draw();
      }
      const refs = {};
      function draw(...a) { return S.keepFocus(el, () => draw0(...a)); } // keep keyboard focus on the control that was used
      function draw0() { drawGraph(); drawSide(); }
      function drawGraph() {
        const Wd = 640, Hd = 330;
        const tmax = Math.max(900, st.t + 20);
        const x = t => 60 + t / tmax * 550, y = v => 280 - v / 1.6 * 240;
        let s = `<svg viewBox="0 0 ${Wd} ${Hd}" role="img" aria-label="Voltage against time sketch"><line x1="60" y1="280" x2="620" y2="280" stroke="#52677a"/><line x1="60" y1="30" x2="60" y2="280" stroke="#52677a"/>`;
        s += `<text x="340" y="312" text-anchor="middle" font-size="13" fill="#52677a">time</text><text x="24" y="150" font-size="13" fill="#52677a" transform="rotate(-90 24 150)" text-anchor="middle">reading (V)</text>`;
        s += `<line x1="56" y1="${y(1.10)}" x2="64" y2="${y(1.10)}" stroke="#52677a"/><text x="52" y="${y(1.10) + 4}" text-anchor="end" font-size="12" fill="#52677a">1,10</text><text x="52" y="284" text-anchor="end" font-size="12" fill="#52677a">0</text>`;
        if (st.hist.length > 1) s += `<polyline fill="none" stroke="#00646b" stroke-width="3" points="${st.hist.map(([t, v]) => x(t) + ',' + y(v)).join(' ')}"/>`;
        s += `<text x="610" y="48" text-anchor="end" font-size="12" fill="#a3360f">sketch, not to scale</text></svg>`;
        graph.innerHTML = s;
      }
      function drawSide() {
        clear(side);
        refs.read = h('h3', null, 'Reading: ' + EC.num(V(), 2) + ' V');
        refs.cu = h('i', { style: { width: Math.min(100, st.cu / 2.5 * 100) + '%', background: 'var(--red)' } });
        refs.zn = h('i', { style: { width: Math.min(100, st.zn / 2.5 * 100) + '%', background: 'var(--ox)' } });
        add(side, [refs.read,
          h('div', { class: 'meter' }, h('span', { style: { width: '90px' } }, chem('[Cu²⁺]')), h('div', { class: 'bar' }, refs.cu)),
          h('div', { class: 'meter', style: { marginTop: '6px' } }, h('span', { style: { width: '90px' } }, chem('[Zn²⁺]')), h('div', { class: 'bar' }, refs.zn)),
          h('p', { class: 'small muted', style: { marginTop: '8px' } }, chem('Zn + Cu²⁺ → Zn²⁺ + Cu'), ': as the cell runs, [Cu²⁺] falls and [Zn²⁺] rises.'),
          h('div', { class: 'row' }, h('button', { class: 'btn', type: 'button', onclick: () => { st.running = !st.running; if (st.running) { if (!st.hist.length) st.hist.push([0, V()]); raf = requestAnimationFrame(tick); } draw(); } }, st.running ? 'Pause' : 'Let it run'),
            h('button', { class: 'btn ghost', type: 'button', onclick: () => { st.running = false; cancelAnimationFrame(raf); st.cu = 1; st.zn = 1; st.t = 0; st.hist = []; st.msg = 'Reset to a standard cell.'; draw(); } }, 'Reset')),
          h('div', { class: 'row', style: { marginTop: '8px' } }, h('button', { class: 'btn ghost small', type: 'button', onclick: () => act('cu') }, 'Add Cu²⁺'), h('button', { class: 'btn ghost small', type: 'button', onclick: () => act('zn') }, 'Add Zn²⁺'), h('button', { class: 'btn ghost small', type: 'button', onclick: () => act('na2s') }, 'Add Na₂S to the Cu half-cell'), h('button', { class: 'btn ghost small', type: 'button', onclick: () => act('dilute') }, 'Dilute the Cu half-cell')),
          notice('', st.msg),
          h('div', { class: 'callout ex' }, h('h4', null, 'Examiner says · 2023 and 2024 reports'), 'Candidates “get zero credit for stating Le Chatelier’s Principle”. Apply it: name the concentration that changes, whether it is a reactant or a product, which reaction is favoured and why (to counteract the change), and what happens to the voltage.')]);
      }
      draw();
    }
  };

  /* ---------- B7: internal resistance bench ---------- */
  S.tools.resistance = {
    id: 'resistance', mod: 28, section: '28.8', title: 'Internal resistance bench',
    blurb: 'Change the electrode area, the salt bridge and the load. The emf stays the same; the current and the reading change.',
    render(el) {
      const st = { emf: 0.83, area: 1, bridge: 'long', R: 6, closed: true };
      const box = h('div', { class: 'split' }), L = h('div', { class: 'card' }), Rp = h('div', { class: 'card' });
      add(box, [L, Rp]); el.appendChild(box);
      const AREA = ['', 'small', 'medium', 'large'];
      const areaLab = h('label', { class: 'f', for: 'rb-area' }), rLab = h('label', { class: 'f', for: 'rb-r' });
      const areaIn = h('input', { id: 'rb-area', type: 'range', min: 1, max: 3, step: 1, value: st.area, 'aria-label': 'Electrode surface area', oninput: e => { st.area = +e.target.value; draw(); } });
      const rIn = h('input', { id: 'rb-r', type: 'range', min: 1, max: 20, step: 1, value: st.R, 'aria-label': 'External resistance R', oninput: e => { st.R = +e.target.value; draw(); } });
      add(L, [h('label', { class: 'f' }, 'Cell'), seg([['0.83', 'H₂O₂–MnO₄⁻ (0,83 V)'], ['1.1', 'Zn–Cu (1,10 V)']], String(st.emf), v => { st.emf = +v; draw(); }),
        areaLab, areaIn,
        h('label', { class: 'f' }, 'Salt bridge'), seg([['long', 'long and narrow'], ['short', 'short and wide']], st.bridge, v => { st.bridge = v; draw(); }),
        rLab, rIn,
        h('label', { class: 'f' }, 'Switch'), seg([['open', 'open'], ['closed', 'closed']], st.closed ? 'closed' : 'open', v => { st.closed = v === 'closed'; draw(); })]);
      function draw() {
        const r = 0.8 / st.area + (st.bridge === 'long' ? 1.2 : 0.3);
        const I = st.closed ? st.emf / (st.R + r) : 0;
        const V = st.emf - I * r;
        areaLab.textContent = `Electrode surface area: ${AREA[st.area]}`; areaIn.setAttribute('aria-valuetext', AREA[st.area]);
        rLab.textContent = `External resistance R = ${EC.num(st.R)} Ω`; rIn.setAttribute('aria-valuetext', EC.num(st.R) + ' ohms');
        clear(Rp);
        add(Rp, [h('div', { class: 'grid g2' },
          h('div', { class: 'card tight' }, h('div', { class: 'small muted' }, 'emf'), h('div', { class: 'score' }, EC.num(st.emf, 2) + ' V')),
          h('div', { class: 'card tight' }, h('div', { class: 'small muted' }, 'voltmeter reading (p.d.)'), h('div', { class: 'score' }, EC.num(V, 2) + ' V')),
          h('div', { class: 'card tight' }, h('div', { class: 'small muted' }, 'current'), h('div', { class: 'score' }, EC.num(I, 3) + ' A')),
          h('div', { class: 'card tight' }, h('div', { class: 'small muted' }, 'internal resistance r (model)'), h('div', { class: 'score' }, EC.num(r, 2) + ' Ω'))),
          h('p', { style: { marginTop: '10px' } }, chem('emf = I(R + r)'), ' (Module 11). ', st.closed ? `Some energy per coulomb is used inside the cell (Ir = ${EC.num(I * r, 2)} V), so the reading is less than the emf.` : 'With the switch open no current flows, so the reading equals the emf.'),
          h('div', { class: 'callout' }, h('h4', null, 'WE 28.10'), 'A larger electrode area, or a shorter, wider or more conductive salt bridge, lowers the internal resistance and raises the maximum current. Neither changes the emf: it depends only on the half-reactions and the conditions (concentration, gas pressure, temperature).'),
          h('div', { class: 'callout trap' }, h('h4', null, 'Examiners’ report 2024, Q6.6'), 'emf and potential difference are not the same: the emf is the reading when no current flows.')]);
      }
      draw();
    }
  };
})();
