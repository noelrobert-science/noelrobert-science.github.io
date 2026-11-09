/* Practise, IEB questions, Check and Return later: question generators (fresh numbers every time), a concept bank
   written from the coursebook, one question renderer with stepped hints, and the four views. */
(function () {
  'use strict';
  const EC = window.EC, S = window.STUDIO;
  const { h, add, clear, chem, seg, select, notice, readNum, close, shuffle, pick, logAttempt, store } = S;
  const R = k => EC.rowByKey(k);
  const rows = keys => keys.map(R).filter(Boolean);

  /* ---------- species pools ---------- */
  const RA_POOL = rows(['Mg²⁺/Mg', 'Aℓ³⁺/Aℓ', 'Zn²⁺/Zn', 'Fe²⁺/Fe', 'Ni²⁺/Ni', 'Pb²⁺/Pb', 'Cu²⁺/Cu', 'I₂/I⁻', 'Br₂/Br⁻', 'Fe³⁺/Fe²⁺', 'O₂+H⁺/H₂O₂']);
  const OA_POOL = rows(['Pb²⁺/Pb', 'H⁺/H₂', 'Cu²⁺/Cu', 'I₂/I⁻', 'Fe³⁺/Fe²⁺', 'Ag⁺/Ag', 'Br₂/Br⁻', 'Cr₂O₇²⁻+H⁺/Cr³⁺+H₂O', 'Cℓ₂/Cℓ⁻', 'MnO₄⁻+H⁺/Mn²⁺+H₂O', 'Ni²⁺/Ni', 'Zn²⁺/Zn']);
  const METAL_ROWS = rows(['Mg²⁺/Mg', 'Aℓ³⁺/Aℓ', 'Zn²⁺/Zn', 'Cr³⁺/Cr', 'Fe²⁺/Fe', 'Co²⁺/Co', 'Ni²⁺/Ni', 'Sn²⁺/Sn', 'Pb²⁺/Pb', 'Cu²⁺/Cu', 'Ag⁺/Ag']);
  const CELL_ROWS = rows(['Mg²⁺/Mg', 'Aℓ³⁺/Aℓ', 'Zn²⁺/Zn', 'Fe²⁺/Fe', 'Ni²⁺/Ni', 'Pb²⁺/Pb', 'Cu²⁺/Cu', 'Ag⁺/Ag', 'Cℓ₂/Cℓ⁻', 'Br₂/Br⁻', 'I₂/I⁻', 'Fe³⁺/Fe²⁺']);
  const isMetalRow = r => EC.isMetal(r.ra);
  const half = r => isMetalRow(r) ? `${r.ra} | ${r.oa}` : `${r.oa}, ${r.ra} (Pt)`;
  const oaName = r => r.oa === 'MnO₄⁻' ? 'acidified MnO₄⁻' : r.oa === 'Cr₂O₇²⁻' ? 'acidified Cr₂O₇²⁻' : r.oa;
  function reactingPair() {
    for (let i = 0; i < 200; i++) { const ra = pick(RA_POOL), oa = pick(OA_POOL); if (ra !== oa && EC.reacts(ra, oa)) return [ra, oa]; }
    return [R('Zn²⁺/Zn'), R('Cu²⁺/Cu')];
  }
  function anyPair() {
    for (let i = 0; i < 200; i++) { const ra = pick(RA_POOL), oa = pick(OA_POOL); if (ra !== oa) return [ra, oa]; }
  }
  const opt = (t, ok, why) => ({ t, ok: !!ok, why });

  /* ---------- generators: each returns a question ---------- */
  const GEN = {};
  GEN.agents = () => {
    const [ra, oa] = reactingPair(), net = EC.netEquation(ra, oa);
    return { section: '27.1', stars: 1, type: 'mcq', prompt: ['In the reaction ', chem(net.text), ', which species is the oxidising agent?'],
      options: shuffle([opt(oa.oa, true, `${oa.oa} gains electrons: it is reduced, so it is the oxidising agent.`), opt(ra.ra, false, `${ra.ra} loses electrons: it is the reducing agent (the cross-over trap).`),
        opt(oa.ra, false, `${oa.ra} is a product. Name the reactant as the agent.`), opt(ra.oa, false, `${ra.oa} is the product of the oxidation.`)].filter((o, i, a) => a.findIndex(p => p.t === o.t) === i)),
      hints: ['Write the two half-reactions. Which species gains electrons?', `${EC.reductionHalf(oa).text}`],
      sol: [`Reduction: ${EC.reductionHalf(oa).text}`, `${oa.oa} gains electrons, so it is reduced: it is the oxidising agent.`] };
  };
  GEN.agentsOx = () => {
    const [ra, oa] = reactingPair(), net = EC.netEquation(ra, oa);
    return { section: '27.1', stars: 1, type: 'mcq', prompt: ['In the reaction ', chem(net.text), ', which species is oxidised?'],
      options: shuffle([opt(ra.ra, true, `${ra.ra} loses electrons: it is oxidised (and is the reducing agent).`), opt(oa.oa, false, `${oa.oa} gains electrons: it is reduced.`),
        opt(ra.oa, false, `${ra.oa} is what ${ra.ra} becomes: the product, not the species oxidised.`), opt(oa.ra, false, `${oa.ra} is the product of the reduction.`)].filter((o, i, a) => a.findIndex(p => p.t === o.t) === i)),
      hints: ['Oxidation is the loss of electrons. Which reactant loses electrons?', EC.oxidationHalf(ra).text],
      sol: [`Oxidation: ${EC.oxidationHalf(ra).text}`, `${ra.ra} loses electrons, so it is oxidised: it is the reducing agent.`] };
  };
  GEN.half = () => {
    const r = pick(EC.ROWS.filter(r => r.ox.length <= 3 && !/H₂O\/H₂\+OH/.test(r.key)));
    const type = Math.random() < 0.5 ? 'reduction' : 'oxidation';
    const good = type === 'reduction' ? EC.reductionHalf(r) : EC.oxidationHalf(r), bad = type === 'reduction' ? EC.oxidationHalf(r) : EC.reductionHalf(r);
    const sp = type === 'reduction' ? r.oa : r.ra, prod = type === 'reduction' ? r.ra : r.oa;
    const wrongN = good.text.replace(/(^|\s)(\d*)e⁻/, (m, a, n) => a + (r.n === 1 ? '2' : '') + 'e⁻');
    return { section: '27.2', stars: 1, type: 'mcq', prompt: [`Use Table 4 to write the half-reaction for the ${type} of `, chem(sp), ' to ', chem(prod), '.'],
      options: shuffle([opt(good.text, true, `Row ${EC.ev(r.E)} V, ${type === 'reduction' ? 'copied' : 'written backwards'}.`), opt(bad.text, false, `This is the ${type === 'reduction' ? 'oxidation' : 'reduction'}: the electrons are on the wrong side.`),
        opt(good.text.replace('→', '⇌'), false, 'Use a single arrow →: the memos take a mark off for ⇌.'), opt(wrongN, false, 'Check the charge: the two sides do not balance.')].filter((o, i, a) => a.findIndex(p => p.t === o.t) === i)),
      hints: [`Find ${sp} in Table 4. It is on the ${type === 'reduction' ? 'left' : 'right'} of the ${EC.ev(r.E)} V row.`, type === 'reduction' ? 'Reduction: copy the row with a single arrow.' : 'Oxidation: write the row backwards, so the electrons are on the right.'],
      sol: [good.text, EC.rowNote(r, type)] };
  };
  GEN.net = () => {
    const [ra, oa] = reactingPair();
    return { section: '27.2', stars: 2, type: 'mcq', prompt: [chem(ra.ra), ' reacts with ', chem(oaName(oa)), '. Choose the balanced net ionic equation.'],
      options: S.netOptions(ra, oa),
      hints: [`Oxidation: ${EC.oxidationHalf(ra).text}`, `Reduction: ${EC.reductionHalf(oa).text}`, 'Multiply so that electrons lost = electrons gained, add, then cancel.'],
      sol: [EC.oxidationHalf(ra).text, EC.reductionHalf(oa).text, EC.netEquation(ra, oa).text] };
  };
  GEN.react = () => {
    const [ra, oa] = anyPair(), yes = EC.reacts(ra, oa), net = EC.netEquation(ra, oa);
    return { section: '27.3', stars: 1, type: 'mcq', prompt: ['Will ', chem(ra.ra), ' react with ', chem(oaName(oa)), ' under standard conditions?'],
      options: [opt('Yes, it reacts', yes, S.memoSentence(ra, oa)), opt('No reaction', !yes, S.memoSentence(ra, oa))],
      hints: [`Compare the two oxidising agents: ${oa.oa} (${EC.ev(oa.E)} V) and ${ra.oa} (${EC.ev(ra.E)} V).`, 'The lower one on the left of Table 4 is the stronger oxidising agent.'],
      sol: [S.memoSentence(ra, oa)].concat(yes ? [net.text] : []) };
  };
  GEN.emfReact = () => {
    const [ra, oa] = anyPair(), net = EC.netEquation(ra, oa), e = EC.eCell(oa, ra, { labels: 'agents' });
    return { section: '28.6', stars: 2, type: 'num', unit: 'V', ans: e.value, tol: 0.006, signed: true,
      prompt: ['Calculate Eθ for the reaction ', chem(net.text), ' and say whether it is spontaneous.'],
      traps: [[-e.value, 'Check which species is reduced in the reaction AS WRITTEN: that one is the oxidising agent (cathode).'], [EC.round(oa.E + ra.E, 2), 'Subtract: Eθcell = EθOA − EθRA.']],
      hints: [`The oxidising agent is ${oa.oa} (${EC.ev(oa.E)} V); the reducing agent is ${ra.ra} (${EC.ev(ra.E)} V).`, 'Eθcell = EθOA − EθRA, with brackets round a negative value.'],
      sol: [e.formula, e.substitute, e.answer, e.value > 0 ? 'Positive: spontaneous.' : 'Negative: non-spontaneous (no reaction).'] };
  };
  const SPECT = [
    { t: 'Zinc is added to copper(II) sulfate solution.', s: ['SO₄²⁻'], others: ['Cu²⁺', 'Zn²⁺', 'none'] },
    { t: 'Copper wire is placed in silver nitrate solution.', s: ['NO₃⁻'], others: ['Ag⁺', 'Cu²⁺', 'none'] },
    { t: 'Chlorine gas is bubbled through potassium bromide solution.', s: ['K⁺'], others: ['Br⁻', 'Cℓ⁻', 'none'] },
    { t: 'Magnesium ribbon reacts with dilute hydrochloric acid.', s: ['Cℓ⁻'], others: ['H⁺', 'Mg²⁺', 'none'] },
    { t: 'Bromine water is added to sodium iodide solution.', s: ['Na⁺'], others: ['I⁻', 'Br⁻', 'none'] },
    { t: 'An iron nail is placed in copper(II) sulfate solution.', s: ['SO₄²⁻'], others: ['Fe²⁺', 'Cu²⁺', 'none'] },
    { t: 'Zinc granules react with dilute sulfuric acid.', s: ['SO₄²⁻'], others: ['H⁺', 'Zn²⁺', 'none'] },
    { t: 'Acidified potassium permanganate (H₂SO₄) oxidises iron(II) sulfate.', s: ['K⁺', 'SO₄²⁻'], others: ['K⁺ only', 'Fe²⁺ and K⁺', 'H⁺ and SO₄²⁻'] },
    { t: 'Chlorine gas is bubbled through sodium iodide solution.', s: ['Na⁺'], others: ['I⁻', 'Cℓ₂', 'none'] }
  ];
  GEN.spect = () => {
    const x = pick(SPECT), right = x.s.join(' and ');
    return { section: '27.4', stars: 1, type: 'mcq', prompt: x.t + ' Which ion(s) are spectators?',
      options: shuffle([opt(right, true, `${right} ${x.s.length > 1 ? 'are' : 'is'} unchanged on both sides: no electrons are gained or lost.`)].concat(x.others.map(o => opt(o === 'none' ? 'There are no spectator ions' : o, false, o === 'none' ? `${right} is in the solution before and after the reaction.` : `This species gains or loses electrons (or is not the full set of spectators).`)))),
      hints: ['Write every soluble ionic compound as its ions first.', 'Which ions are the same on both sides?'], sol: [`Spectators: ${right}. They take no part in the electron transfer.`] };
  };
  function twoCells(pool) { let a, b; do { a = pick(pool); b = pick(pool); } while (a === b || Math.abs(a.E - b.E) < 0.05); return a.E < b.E ? [a, b] : [b, a]; }
  GEN.anode = () => {
    const [an, ca] = twoCells(rows(['Mg²⁺/Mg', 'Aℓ³⁺/Aℓ', 'Zn²⁺/Zn', 'Fe²⁺/Fe', 'Ni²⁺/Ni', 'Pb²⁺/Pb', 'Cu²⁺/Cu', 'Ag⁺/Ag', 'Co²⁺/Co']));
    const order = shuffle([an, ca]);
    return { section: '28.1', stars: 1, type: 'mcq', prompt: `A galvanic cell is made from ${half(order[0])} and ${half(order[1])} half-cells under standard conditions. Which electrode is the anode?`,
      options: [opt(`the ${EC.NAMES[an.ra]} electrode`, true, `${an.ra} (${EC.ev(an.E)} V) is a stronger reducing agent than ${ca.ra} (${EC.ev(ca.E)} V), so ${an.ra} is oxidised: it is the anode.`), opt(`the ${EC.NAMES[ca.ra]} electrode`, false, `${ca.ra} is the weaker reducing agent: ${ca.oa} is reduced there, so it is the cathode.`)],
      hints: ['The anode is where oxidation happens.', 'The half-cell with the lower (more negative) Eθ contains the stronger reducing agent.'],
      sol: [`Anode: the ${EC.NAMES[an.ra]} electrode. ${an.ra} (${EC.ev(an.E)} V) is a stronger reducing agent than ${ca.ra} (${EC.ev(ca.E)} V), so ${an.ra} is oxidised.`, EC.oxidationHalf(an).text] };
  };
  GEN.flow = () => {
    const [an, ca] = twoCells(rows(['Mg²⁺/Mg', 'Zn²⁺/Zn', 'Fe²⁺/Fe', 'Ni²⁺/Ni', 'Pb²⁺/Pb', 'Cu²⁺/Cu', 'Ag⁺/Ag']));
    const A = EC.NAMES[an.ra], C = EC.NAMES[ca.ra];
    return { section: '28.1', stars: 1, type: 'mcq', prompt: `In a ${A}–${C} galvanic cell, in which direction do electrons flow?`,
      options: shuffle([opt(`from ${A} to ${C}, through the wire`, true, `${A} is the anode (oxidation): electrons leave it and travel through the external circuit to the ${C} cathode.`),
        opt(`from ${C} to ${A}, through the wire`, false, `${an.ra} is the stronger reducing agent, so the electrons start at the ${A}.`),
        opt(`from ${A} to ${C}, through the salt bridge`, false, 'Electrons never enter the salt bridge or the solutions: ions carry the charge there.')]),
      hints: ['First find the anode: the stronger reducing agent.', 'Electrons flow only through the external circuit.'], sol: [`From the ${A} electrode (anode) to the ${C} electrode (cathode), through the wire.`] };
  };
  GEN.notation = () => {
    const [an, ca] = twoCells(CELL_ROWS);
    const good = EC.cellNotation(an, ca).text, swap = EC.cellNotation(ca, an).text;
    const opts = [opt(good, true, 'Anode on the left, cathode on the right, inert electrodes on the outside.'), opt(swap, false, 'The sides are swapped: the anode (oxidation) goes on the left.'), opt(good.replace(' || ', ' | '), false, 'The salt bridge is shown by a double line ||.')];
    const n = EC.netEquation(an, ca);
    if (n.ko > 1 || n.kr > 1) {
      const k = n.ko > 1 ? n.ko : n.kr, target = n.ko > 1 ? an : ca;
      opts.push(opt(good.replace(new RegExp(target.oa.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')), k + target.oa), false, 'No coefficients in cell notation, even when the balanced equation needs them.'));
    } else if (/Pt/.test(good)) opts.push(opt(good.replace(/ \| Pt$/, '').replace(/^Pt \| /, ''), false, 'This half-cell has no solid conductor: it needs Pt on the outside.'));
    return { section: '28.4', stars: 2, type: 'mcq', prompt: `Choose the cell notation for a standard cell made from ${half(an)} and ${half(ca)}.`,
      options: shuffle(opts.filter((o, i, a) => a.findIndex(p => p.t === o.t) === i)),
      hints: [`The anode is the half-cell with the stronger reducing agent: ${an.ra} (${EC.ev(an.E)} V).`, 'Left: reducing agent | product of oxidation. Right: oxidising agent | product of reduction. Pt on the outside.'], sol: [good] };
  };
  GEN.she = () => {
    const r = pick(METAL_ROWS.concat(rows(['Cℓ₂/Cℓ⁻', 'Br₂/Br⁻', 'Fe³⁺/Fe²⁺'])));
    return { section: '28.5', stars: 1, type: 'num', unit: 'V', ans: r.E, tol: 0.006, signed: true,
      prompt: `A standard ${half(r)} half-cell is connected to a standard hydrogen electrode. The SHE is joined to the negative terminal of the voltmeter (Pt | H₂ | H⁺ || …). What does the voltmeter read? Include the sign.`,
      traps: [[-r.E, 'With the SHE on the left, the reading is Eθ of the other half-cell, with its own sign.']],
      hints: ['Eθ(SHE) = 0,00 V.', 'Eθcell = Eθcathode − Eθanode = Eθ(half-cell) − 0,00.'],
      sol: [`Eθcell = Eθ(${r.oa}/${r.ra}) − 0,00 = ${EC.ev(r.E)} V`, r.E < 0 ? `Negative: ${r.oa} is not reduced; ${r.ra} is oxidised and H⁺ is reduced.` : `Positive: ${r.oa} is reduced; H₂ is oxidised.`] };
  };
  GEN.emf = () => {
    const [an, ca] = twoCells(CELL_ROWS), e = EC.eCell(ca, an), net = EC.netEquation(an, ca);
    const traps = [[-e.value, 'Eθcell = Eθcathode − Eθanode: the cathode is the half-cell with the higher Eθ.'], [EC.round(ca.E + an.E, 2), 'Subtract the two values: Eθcell = Eθcathode − Eθanode.']];
    if (net.kr > 1) traps.push([EC.round(net.kr * ca.E - an.E, 2), 'Never multiply Eθ by the coefficients.']);
    if (net.ko > 1) traps.push([EC.round(ca.E - net.ko * an.E, 2), 'Never multiply Eθ by the coefficients.']);
    return { section: '28.6', stars: 1, type: 'num', unit: 'V', ans: e.value, tol: 0.006, signed: true,
      prompt: `Calculate the emf of a standard cell made from ${half(an)} and ${half(ca)} half-cells.`, traps,
      hints: [`The cathode is ${ca.oa}/${ca.ra} (${EC.ev(ca.E)} V): the higher Eθ.`, 'Eθcell = Eθcathode − Eθanode, with brackets round a negative value.'],
      sol: [e.formula, e.substitute, e.answer] };
  };
  const ELEC_KEYS = ['CuCℓ2-conc', 'CuSO4', 'NaCℓ-conc', 'NaCℓ-dil', 'KI', 'KBr', 'Na2SO4', 'H2SO4', 'AgNO3', 'ZnSO4', 'NiSO4', 'NaCℓ-molten', 'PbBr2-molten', 'MgCℓ2-molten'];
  GEN.elecEmf = () => {
    const key = pick(ELEC_KEYS.filter(k => !/molten/.test(k))), x = EC.electrolysis(key);
    return { section: '29.1', stars: 2, type: 'num', unit: 'V', ans: x.eCell.value, tol: 0.006, signed: true,
      prompt: `${EC.ELECTROLYTES[key].label} is electrolysed with inert electrodes. The products are ${prodLabel(x.cathode, 'c')} at the cathode and ${prodLabel(x.anode, 'a')} at the anode. Calculate Eθcell for this electrolytic cell.`,
      traps: [[-x.eCell.value, 'Use the electrodes of THIS cell: what is reduced at the cathode, minus what is oxidised at the anode. An electrolytic cell gives a negative answer.']],
      hints: [`Cathode: ${x.cathodeHalf.text} (${EC.ev(x.cathode.row.E)} V).`, `Anode: ${x.anodeHalf.text} (${EC.ev(x.anode.row.E)} V).`],
      sol: [x.eCell.formula, x.eCell.substitute, x.eCell.answer, `The supply must provide more than ${EC.num(Math.abs(x.eCell.value), 2)} V.`] };
  };
  function prodLabel(c, side) {
    if (side === 'c') return c.sp === 'H₂O' ? 'H₂ (and OH⁻)' : c.row ? c.row.ra : null;
    if (c.why === 'active anode') return `the ${EC.NAMES[c.sp]} anode dissolves`;
    if (c.sp === 'H₂O') return 'O₂ (and H⁺)';
    return c.row ? c.row.oa : null;
  }
  GEN.products = () => {
    const key = pick(ELEC_KEYS), aq = EC.ELECTROLYTES[key].aqueous, anode = aq && Math.random() < 0.25 ? pick(['Cu', 'Ni']) : 'graphite';
    const x = EC.electrolysis(key, { anode });
    const cs = x.cathodeContest.map(c => prodLabel(c, 'c')).filter(Boolean), as = x.anodeContest.map(c => prodLabel(c, 'a')).filter(Boolean);
    const rc = prodLabel(x.cathode, 'c'), ra = prodLabel(x.anode, 'a');
    const combos = [];
    cs.forEach(c => as.forEach(a => combos.push([c, a])));
    if (!/dissolves/.test(ra)) combos.push([ra, rc]);
    const right = `cathode: ${rc}; anode: ${ra}`;
    const wrong = shuffle(combos.map(([c, a]) => `cathode: ${c}; anode: ${a}`).filter(t => t !== right)).slice(0, 3);
    return { section: '29.3', stars: aq ? 2 : 1, type: 'mcq',
      prompt: `${EC.ELECTROLYTES[key].label} is electrolysed with ${anode === 'graphite' ? 'graphite electrodes' : 'a graphite cathode and a ' + EC.NAMES[anode] + ' anode'}. Which products form?`,
      options: shuffle([opt(right, true, [x.cathode.sp === 'H₂O' ? `${x.electrolyte.cations.join(', ')} is a weaker oxidising agent than H₂O, so water is reduced.` : x.electrolyte.aqueous ? `${x.cathode.sp} is a stronger oxidising agent than H₂O, so ${x.cathode.sp} is reduced.` : `${x.cathode.sp} is the only cation.`, x.concNote || ''].join(' '))].concat(wrong.map(t => opt(t, false, 'Run both contests: at the cathode the strongest oxidising agent wins; at the anode the strongest reducing agent wins (and an active anode dissolves).')))),
      hints: [aq ? 'List the ions AND water. Water can be reduced (−0,83 V) and oxidised (+1,23 V).' : 'In a melt there is no water: each ion is the only candidate at its electrode.', 'Cathode: compare the oxidising agents. Anode: compare the reducing agents (including the anode itself if it is not inert).'],
      sol: [`Cathode: ${x.cathodeHalf.text}`, `Anode: ${x.anodeHalf.text}`, `Overall: ${x.net.text}`] };
  };
  GEN.hydrate = () => {
    const item = pick(S.HYDRATES), m = pick([12, 15, 20, 25, 30, 40, 55]), V = pick([100, 250, 500]);
    const M = EC.molarMass(item.f), n = m / M, c = n / (V / 1000), ionC = EC.round(item.k * c, 2), salt = item.f.split('·')[0];
    return { section: '29.3', stars: 3, type: 'num', unit: 'mol·dm⁻³', ans: ionC, tol: 0.011,
      prompt: [`${EC.num(m)} g of `, chem(item.f), ` is dissolved to make ${V} cm³ of solution. Calculate [`, chem(item.ion), '].'],
      traps: [[EC.round(item.k * (m / EC.molarMass(salt)) / (V / 1000), 2), 'Include the waters of crystallisation in M.'], item.k > 1 ? [EC.round(c, 2), `That is [${salt}]. Each formula unit gives ${item.k} ${item.ion} ions.`] : null].filter(Boolean),
      hints: [EC.molarMassWorking(item.f), `n = m/M = ${EC.num(n, 4)} mol; c = n/V with V in dm³.`, `1 ${salt} → ${item.k === 1 ? '' : item.k}${item.ion}`],
      sol: [EC.molarMassWorking(item.f), `n = ${EC.num(m)} / ${EC.num(M)} = ${EC.num(n, 4)} mol`, `c(${salt}) = ${EC.num(n, 4)} / ${EC.num(V / 1000, 3)} = ${EC.num(c, 3)} mol·dm⁻³`, `[${item.ion}] = ${item.k === 1 ? '' : item.k + ' × '}${EC.num(c, 3)} = ${EC.num(ionC, 2)} mol·dm⁻³`] };
  };
  GEN.faraday = () => {
    const q = S.makeFaradayQ();
    return { section: '29.5', stars: 2, type: 'num', unit: q.unit, ans: q.ans, tol: Math.max(0.011, q.ans * 0.005), prompt: q.text, hints: q.hints, sol: q.sol,
      traps: [[q.traps.noRatio, 'Use the half-reaction ratio: moles of electrons are not moles of product.'], [q.traps.minutes, 'Change the time to seconds before q = It.']] };
  };
  GEN.faradayRev = () => {
    const k = pick(['Cu', 'Ag', 'Ni', 'Zn']), P = S.PROCS[k], m = pick([2.5, 5, 7.5, 10, 12.7, 15.9, 20]), I = pick([2, 2.5, 4, 5, 10, 20]);
    const f = EC.faradayFromMass({ m, M: P.M, ratio: P.ratio, I });
    const t = EC.round(f.t, 2);
    return { section: '29.5', stars: 3, type: 'num', unit: 's', ans: t, tol: Math.max(0.6, t * 0.003),
      prompt: `A constant current of ${EC.num(I)} A deposits ${EC.num(m)} g of ${EC.NAMES[k]} (${P.half}). Calculate the time taken, in seconds.`,
      traps: [[EC.round(t / P.ratio, 2), 'Use the ratio: n(e⁻) = ' + P.ratio + ' × n(' + k + ').']],
      hints: [`n(${k}) = m/M = ${EC.num(m)} / ${EC.num(P.M)}`, `${P.half}: n(e⁻) = ${P.ratio}n(${k}); then q = nF.`, 't = q/I'],
      sol: [`n(${k}) = ${EC.num(m)} / ${EC.num(P.M)} = ${EC.numSig(f.n, 6)} mol`, `n(e⁻) = ${P.ratio === 1 ? '' : P.ratio + ' × '}${EC.numSig(f.n, 6)} = ${EC.numSig(f.ne, 6)} mol`, `q = nF = (${EC.numSig(f.ne, 6)})(96 500) = ${EC.num(f.q, 2)} C`, `t = q/I = ${EC.num(f.q, 2)} / ${EC.num(I)} = ${EC.num(t, 2)} s`] };
  };

  /* ---------- concept bank, from the coursebook ---------- */
  const B = (section, stars, prompt, right, why, wrongs, hint) => ({ section, stars, type: 'mcq', prompt, options: [opt(right, true, why)].concat(wrongs.map(([t, w]) => opt(t, false, w))), hints: hint ? [hint] : [], sol: [right + '. ' + why] });
  S.BANK = [
    B('28.2', 1, 'What are the TWO functions of the salt bridge?', 'It completes the circuit and maintains electrical neutrality in the half-cells', 'The memo needs both.', [['It carries electrons between the half-cells', 'Electrons never enter the salt bridge.'], ['It supplies the energy of the cell', 'The energy comes from the redox reaction.'], ['It keeps the concentrations at 1 mol·dm⁻³', 'The concentrations change as the cell runs.']], 'One function is about the circuit, the other about charge.'),
    B('28.2', 2, 'In a Zn–Cu cell with a KNO₃ salt bridge, which ions move from the salt bridge into the zinc half-cell?', 'NO₃⁻ ions', 'Zn²⁺ ions form at the anode, so positive charge builds up: anions move in to neutralise it.', [['K⁺ ions', 'Cations move towards the cathode half-cell, where Cu²⁺ is removed.'], ['Electrons', 'Electrons flow only through the wire.'], ['Zn²⁺ ions', 'Zn²⁺ ions move OUT of the zinc half-cell into the bridge.']], 'What builds up in the anode half-cell?'),
    B('28.2', 2, 'Why can a KCℓ salt bridge not be used with a silver half-cell?', 'Cℓ⁻ ions react with Ag⁺ ions to form an AgCℓ precipitate', 'This removes Ag⁺ from the half-cell and lowers the voltage.', [['K⁺ ions are reduced at the silver electrode', 'K⁺ is a very weak oxidising agent: it is not reduced.'], ['Cℓ⁻ ions are oxidised by Ag⁺', 'Ag⁺ (+0,80 V) is too weak to oxidise Cℓ⁻ (+1,36 V).'], ['KCℓ does not conduct', 'KCℓ(aq) has free ions: it conducts.']]),
    B('28.2', 2, 'Why is a MnO₄⁻ half-cell acidified with H₂SO₄ and not HCℓ?', 'MnO₄⁻ is a stronger oxidising agent than Cℓ₂, so it would oxidise the Cℓ⁻ ions', 'Sulfate ions are not oxidised (2024 report).', [['HCℓ is a weak acid', 'HCℓ is a strong acid.'], ['Cℓ⁻ would precipitate the Mn²⁺', 'MnCℓ₂ is soluble.'], ['H₂SO₄ supplies more electrons', 'Acids supply H⁺, not electrons.']]),
    B('28.3', 1, 'Why does a Cℓ₂/Cℓ⁻ half-cell need an inert electrode?', 'There is no solid conductor in the half-reaction', 'It has a gas and an ion only.', [['Chlorine is too reactive for any metal', 'Platinum is a metal and is used.'], ['To make the reaction faster', 'The electrode only conducts.'], ['Inert electrodes give a bigger emf', 'The emf depends on the half-reactions only.']]),
    B('28.3', 2, 'Which electrode could be used in a Fe³⁺, Fe²⁺ half-cell?', 'platinum', 'It conducts and is unreactive.', [['copper', 'Fe³⁺ (+0,77 V) is a stronger oxidising agent than Cu²⁺ (+0,34 V): it would oxidise the copper.'], ['iron', 'Fe would be oxidised by Fe³⁺: a different reaction.'], ['zinc', 'Fe³⁺ would oxidise the zinc.']], 'An inert electrode must conduct and must not react.'),
    B('28.3', 1, 'Give TWO reasons why platinum is suitable as an inert electrode.', 'It conducts electricity and is unreactive', 'It does not take part in the reaction.', [['It is cheap and light', 'Neither is a chemical reason (and it is not cheap).'], ['It is a strong reducing agent', 'Then it would react.'], ['It increases the emf', 'The emf depends on the half-reactions.']]),
    B('28.5', 1, 'What are the standard conditions for a Zn–Cu cell?', '1 mol·dm⁻³ solutions and 25 °C', 'No gas, so no pressure condition (2017 memo).', [['1 mol·dm⁻³, 1 atm and 0 °C', '0 °C belongs to the gas volume at STP.'], ['1 mol·dm⁻³, 1 atm and 25 °C', 'This cell has no gas: give only the conditions that apply.'], ['2 mol·dm⁻³ and 25 °C', 'Standard concentration is 1 mol·dm⁻³.']]),
    B('28.5', 2, 'Which of these is part of the standard hydrogen electrode?', 'a platinum electrode in 1 mol·dm⁻³ H⁺ with H₂ gas at 1 atm', 'At 25 °C; Eθ = 0,00 V.', [['a hydrogen electrode in pure water', 'Water does not give 1 mol·dm⁻³ H⁺.'], ['a copper electrode in 1 mol·dm⁻³ H⁺', 'Copper is not inert to all conditions; the SHE uses platinum.'], ['H₂ gas at 2 atm', 'Standard pressure is 1 atm.']]),
    B('28.7', 2, 'In a working Zn–Cu cell, concentrated Cu(NO₃)₂ is added to the copper half-cell. What happens to the voltage?', 'It increases', '[Cu²⁺], a reactant, increases, so the forward reaction is favoured.', [['It decreases', 'Cu²⁺ is a reactant, not a product.'], ['It stays the same', 'Concentration changes the cell potential (non-standard conditions).'], ['It drops to zero', 'Only equilibrium gives zero.']], 'Le Châtelier: is Cu²⁺ a reactant or a product?'),
    B('28.7', 2, 'Na₂S is added to the copper half-cell of a Zn–Cu cell (CuS precipitates). What happens to the voltage?', 'It decreases', '[Cu²⁺] decreases, so the reverse reaction is favoured to make more Cu²⁺ (2023 memo).', [['It increases', 'Removing a reactant favours the reverse reaction.'], ['It stays the same', 'The concentration of a reactant changed.'], ['It doubles', 'There is no simple proportion.']]),
    B('28.7', 1, 'Why is the voltage of a flat cell zero?', 'The reaction has reached equilibrium (or a reactant is used up)', 'There is no net reaction to drive electrons.', [['It has run out of electrons', 'Electrons are not used up.'], ['The salt bridge has dried out', 'That would open the circuit, but that is not why a cell goes flat.'], ['The electrodes have become inert', 'No.']]),
    B('28.8', 1, 'Define internal resistance.', 'Opposition to the flow of charge through the electrodes and electrolytes in a cell', 'SAGS wording.', [['The resistance of the wire and the voltmeter', 'That is external.'], ['The difference between the emf and the reading', 'That is the effect, not the definition.'], ['The energy lost per coulomb in the salt bridge only', 'It includes the electrodes and electrolytes.']]),
    B('28.8', 2, 'The electrodes of a cell are replaced with ones of larger surface area. What happens?', 'The maximum current increases; the emf stays the same', 'The internal resistance decreases. The emf depends only on the half-reactions and the conditions.', [['The emf increases', 'The emf does not depend on the size of the electrodes.'], ['The maximum current decreases', 'Larger electrodes lower the internal resistance.'], ['Both stay the same', 'The internal resistance changes.']]),
    B('28.8', 2, 'Which change to the salt bridge increases the maximum current?', 'a shorter, wider salt bridge', 'It lowers the internal resistance.', [['a longer, narrower salt bridge', 'That raises the internal resistance.'], ['a KCℓ salt bridge next to a silver half-cell', 'AgCℓ would precipitate.'], ['removing the salt bridge', 'Then no current flows.']]),
    B('29.1', 1, 'Which statement about an electrolytic cell is correct?', 'The anode is positive and oxidation takes place there', 'It is joined to the positive terminal of the supply.', [['The anode is negative', 'That is a galvanic cell.'], ['Reduction takes place at the anode', 'Oxidation is always at the anode.'], ['Electrons flow through the electrolyte', 'Ions carry the charge in the electrolyte.']]),
    B('29.1', 1, 'What is the energy conversion in an electrolytic cell?', 'electrical energy to chemical energy', 'A non-spontaneous reaction is driven by the supply.', [['chemical energy to electrical energy', 'That is a galvanic cell.'], ['heat to electrical energy', 'No.'], ['chemical energy to heat only', 'No.']]),
    B('29.1', 2, 'Why must a DC (not AC) supply be used for electrolysis?', 'DC keeps each electrode’s polarity fixed, so the same reaction continues at each electrode', 'With AC the electrodes would keep swapping (May 2026, our answer).', [['DC gives a higher voltage', 'AC can give any voltage.'], ['AC would melt the electrolyte', 'No.'], ['DC supplies the ions', 'The electrolyte supplies the ions.']]),
    B('29.1', 2, 'Molten MgCℓ₂ needs a much higher temperature than MgCℓ₂(aq). Why?', 'It is ionic, with strong forces in the lattice, so it melts only at a high temperature; only then are the ions free to move', '“It is a liquid” scored nothing (2024 report).', [['Magnesium needs heat to be reduced', 'Melting is about freeing the ions.'], ['To boil off the chlorine', 'No.'], ['It is a liquid', 'The report gave no marks for this.']]),
    B('29.2', 1, 'Which of these is an inert electrode in exam questions?', 'graphite', 'Platinum, graphite (and titanium in the membrane cell).', [['copper', 'A copper anode is oxidised.'], ['nickel', 'A nickel anode is oxidised.'], ['zinc', 'Zinc is a strong reducing agent.']]),
    B('29.2', 2, 'KBr(aq) is electrolysed with a nickel anode. Does bromine form at the anode?', 'No: Ni is a stronger reducing agent than Br⁻, so the nickel anode is oxidised', 'Ni (−0,25 V) is far above Br⁻ (+1,09 V) on the right of Table 4.', [['Yes: Br⁻ is attracted to the anode', 'Attraction does not decide which species reacts.'], ['Yes: nickel is inert', 'Only Pt, graphite and Ti are inert.'], ['No: water is oxidised', 'The nickel itself is the strongest reducing agent.']]),
    B('29.4', 1, 'In electroplating a spoon with silver, the spoon is…', 'the cathode, joined to the negative terminal', 'Ag⁺ is reduced on it.', [['the anode, joined to the positive terminal', 'Then it would be oxidised.'], ['the anode, joined to the negative terminal', 'The negative electrode is the cathode.'], ['kept out of the electrolyte', 'It must be in the electrolyte.']]),
    B('29.4', 2, 'During copper electrorefining with cobalt and gold impurities, what happens to the gold?', 'It falls to the bottom as anode sludge', 'Au is a weaker reducing agent than Cu, so it is not oxidised.', [['It is oxidised to Au³⁺', 'Au is a weaker reducing agent than Cu.'], ['It deposits on the cathode', 'It is never in solution.'], ['It dissolves as Au⁺', 'No.']]),
    B('29.4', 2, 'What happens to [Cu²⁺] during electrorefining of blister copper containing cobalt?', 'It slowly decreases', 'Co is oxidised at the anode too, but only Cu²⁺ is reduced at the cathode (2025 memo).', [['It stays the same', 'That is electroplating.'], ['It increases', 'Cu²⁺ is removed faster than it forms.'], ['It drops to zero at once', 'No.']]),
    B('29.4', 2, 'Why is SATURATED brine used in the membrane cell?', 'The high [Cℓ⁻] makes the oxidation of Cℓ⁻ predominant over water at the anode', 'Dilute brine would give oxygen too (2024 report wanted the reason).', [['To make more NaOH at the anode', 'NaOH forms on the cathode side.'], ['Because Na⁺ is then reduced', 'Na⁺ is never reduced in water.'], ['To stop the membrane dissolving', 'No.']]),
    B('29.4', 1, 'What does the membrane in the membrane cell let through?', 'only Na⁺ ions (cations)', 'It keeps Cℓ₂ away from H₂ and NaOH, and keeps Cℓ⁻ out of the NaOH.', [['only Cℓ⁻ ions', 'Anions cannot cross.'], ['all ions', 'That is a diaphragm (2023 Q1.8).'], ['electrons', 'Electrons flow through the external circuit.']]),
    B('29.4', 2, 'Why can aluminium not be plated from AℓCℓ₃(aq)?', 'Aℓ³⁺ is a weaker oxidising agent than H₂O, so water is reduced instead', 'Hydrogen bubbles off at the object.', [['Aluminium is too soft', 'Not a chemical reason.'], ['Cℓ⁻ is reduced at the cathode', 'Anions go to the anode.'], ['Aℓ³⁺ is too strong an oxidising agent', 'It is far too weak (−1,66 V).']])
  ];
  GEN.bank = section => {
    const pool = S.BANK.filter(q => !section || q.section === section);
    const q = pick(pool.length ? pool : S.BANK);
    return Object.assign({}, q, { options: shuffle(q.options) });
  };
  S.GEN = GEN;

  /* a fresh question for a section */
  function makeQ(section, key) {
    const sec = S.sectionById(section);
    const k = key || pick(sec.gen);
    const q = k === 'bank' ? GEN.bank(section) : GEN[k]();
    if (q.traps) q.traps = q.traps.filter(([t]) => Math.abs(t - q.ans) > (q.tol || 0.011));
    q.gen = k; q.section = q.section && S.sectionById(q.section) && sec.gen.includes(k) ? section : q.section;
    return q;
  }
  S.makeQ = makeQ;

  /* ---------- the question renderer ---------- */
  function sectionOf(q) { return S.sectionById(q.section); }
  function renderQ(el, q, o) {
    o = o || {};
    const mode = o.mode || 'supported'; // supported | independent | check
    const st = { pick: null, val: '', shown: 0, done: false, ok: null, solShown: false, conf: null };
    const box = h('div', { class: 'qcard' });
    el.appendChild(box);
    function judge() {
      if (q.type === 'mcq') { const opt = q.options[st.pick]; return { ok: !!(opt && opt.ok), why: opt && opt.why }; }
      const v = readNum(st.val);
      if (isNaN(v)) return { ok: false, why: 'Type a number (a decimal comma is fine).', blank: true };
      const ok = close(v, q.ans, q.tol || 0.011);
      let why = ok ? 'Correct.' : null;
      if (!ok) (q.traps || []).forEach(([t, w]) => { if (!why && t !== undefined && close(v, t, q.tol || 0.011)) why = w; });
      if (!ok && !why) why = q.signed && close(Math.abs(v), Math.abs(q.ans), q.tol || 0.011) ? 'Check the sign.' : 'Not yet.';
      return { ok, why };
    }
    function draw() {
      clear(box);
      const sec = sectionOf(q);
      add(box, [h('div', { class: 'row small muted', style: { justifyContent: 'space-between' } }, h('span', null, (sec ? sec.id + ' · ' + sec.short : '')), h('span', { 'aria-label': q.stars + ' star' }, '★'.repeat(q.stars || 1))),
        h('p', { class: 'prompt' }, q.prompt)]);
      if (q.type === 'mcq') {
        box.appendChild(h('div', { class: 'choices' }, q.options.map((op, i) => {
          let cls = 'choice';
          if (st.done && mode !== 'check') { if (op.ok) cls += ' right'; else if (i === st.pick) cls += ' wrongc'; }
          return h('button', { class: cls, type: 'button', 'aria-pressed': String(st.pick === i), disabled: st.done, onclick: () => { st.pick = i; if (mode === 'check') o.onChange && o.onChange(api); draw(); } }, chem(op.t));
        })));
      } else {
        const inp = h('input', { type: 'text', inputmode: 'decimal', value: st.val, disabled: st.done, 'aria-label': 'Your answer', oninput: e => { st.val = e.target.value; if (mode === 'check') o.onChange && o.onChange(api); }, onkeydown: e => { if (e.key === 'Enter' && mode !== 'check') submit(); } });
        box.appendChild(h('div', { class: 'answer-row' }, inp, h('span', null, q.unit || '')));
      }
      if (mode === 'check') {
        box.appendChild(h('div', { class: 'conf', style: { marginTop: '10px' } }, h('span', { class: 'small muted' }, 'Circle one:'), ['C', 'U'].map(c => h('button', { type: 'button', 'aria-pressed': String(st.conf === c), disabled: st.done, 'aria-label': c === 'C' ? 'C: confident' : 'U: unsure', title: c === 'C' ? 'confident' : 'unsure', onclick: () => { st.conf = c; draw(); } }, c)), h('span', { class: 'small muted' }, 'C = confident · U = unsure')));
      }
      if (mode !== 'check' && !st.done) box.appendChild(h('div', { class: 'row', style: { marginTop: '10px' } }, h('button', { class: 'btn', type: 'button', onclick: submit }, 'Check my answer'),
        mode === 'supported' && st.shown < (q.hints || []).length ? h('button', { class: 'btn ghost', type: 'button', onclick: () => { st.shown++; draw(); } }, st.shown ? 'Next hint' : 'I need a hint') : null,
        mode === 'independent' ? h('span', { class: 'small muted' }, 'On your own: hints unlock after you check.') : null));
      (q.hints || []).slice(0, st.shown).forEach((t, i) => box.appendChild(h('div', { class: 'hint' }, h('b', null, 'Hint ' + (i + 1) + ': '), chem(t))));
      if (st.done && mode !== 'check') feedback();
      if (st.done && mode === 'check' && o.reveal) feedback();
    }
    function feedback() {
      const j = judge();
      box.appendChild(notice(j.ok ? 'ok' : 'no', j.ok ? (q.type === 'mcq' ? 'Correct. ' + (j.why || '') : 'Correct: ' + EC.num(q.ans, 2) + ' ' + (q.unit || '') + '.') : (j.why || 'Not yet.')));
      if (!j.ok || st.solShown) box.appendChild(h('div', { class: 'sol' }, h('b', null, 'Worked solution'), (q.sol || []).map(l => h('div', { class: 'ln' }, chem(l)))));
      else box.appendChild(h('button', { class: 'btn ghost small', type: 'button', onclick: () => { st.solShown = true; draw(); } }, 'Show the worked solution'));
      const sec = sectionOf(q);
      if (!j.ok && sec) box.appendChild(h('div', { class: 'redo' }, h('b', null, 'Wrong? '), 'Reread ', h('a', { href: '#section/' + sec.id }, sec.reread), ', then redo ', h('button', { class: 'linkbtn', type: 'button', onclick: () => o.onNext && o.onNext() }, 'a fresh question'), '.'));
      if (mode === 'independent' && (q.hints || []).length && st.shown < q.hints.length) box.appendChild(h('button', { class: 'btn ghost small', type: 'button', onclick: () => { st.shown = q.hints.length; draw(); } }, 'Show the hints'));
    }
    function submit() {
      const j = judge();
      if (j.blank || (q.type === 'mcq' && st.pick === null)) { if (q.type === 'mcq') return; }
      st.done = true; st.ok = j.ok;
      if (o.log !== false) logAttempt({ kind: mode === 'independent' ? (o.delayed ? 'delayed' : 'independent') : 'supported', section: q.section, id: q.gen || 'q', correct: j.ok ? 1 : 0, total: 1 });
      o.onAnswer && o.onAnswer(j.ok);
      draw();
    }
    const api = {
      answered: () => q.type === 'mcq' ? st.pick !== null : st.val.trim() !== '',
      finish: () => { const j = judge(); st.done = true; st.ok = j.ok; o.reveal = true; draw(); return { ok: j.ok, conf: st.conf }; },
      q
    };
    draw();
    return api;
  }
  S.renderQ = renderQ;

  /* ---------- Practise ---------- */
  S.views.practise = function (el, arg, params) {
    let section = params.s && S.sectionById(params.s) ? params.s : '27.1';
    let streak = 0, n = 0, right = 0;
    const head = h('div'), area = h('div'), score = h('p', { class: 'score score-only small muted' });
    add(el, [h('div', { class: 'head' }, h('div', null, h('h2', null, 'Practise'), h('p', null, 'Fresh questions every time, with hints in steps and a worked solution. Choose a section, or try a mixed module.'))), head, score, area]);
    function header() {
      clear(head);
      add(head, [h('label', { class: 'f' }, 'Section'), h('div', { class: 'filters', style: { gridTemplateColumns: 'minmax(0, 1fr) auto auto' } },
        select([['mix27', 'Mixed: Module 27'], ['mix28', 'Mixed: Module 28'], ['mix29', 'Mixed: Module 29'], ['mixall', 'Mixed: all three']].concat(S.SECTIONS.map(s => [s.id, s.id + ' ' + s.title])), section, v => { section = v; next(); }, { 'aria-label': 'Section' }),
        /^\d/.test(section) ? h('a', { class: 'btn ghost small', href: '#section/' + section }, 'Learning route') : null,
        h('a', { class: 'btn ghost small', href: '#ieb' + (/^\d/.test(section) ? '?m=' + section.slice(0, 2) : '') }, 'IEB questions'))]);
    }
    function next() {
      header(); clear(area);
      let sid = section;
      if (/^mix/.test(section)) { const m = section.slice(3); sid = pick(S.SECTIONS.filter(s => m === 'all' || String(s.mod) === m)).id; }
      const q = makeQ(sid);
      renderQ(area, q, { mode: 'supported', onNext: next, onAnswer: ok => { n++; if (ok) { right++; streak++; } else streak = 0; score.textContent = `This session: ${right} of ${n} right${streak > 2 ? ' · ' + streak + ' in a row' : ''}.`; } });
      area.appendChild(h('div', { class: 'row', style: { marginTop: '12px' } }, h('button', { class: 'btn', type: 'button', onclick: next }, 'Next question')));
    }
    next();
  };

  /* ---------- IEB questions ---------- */
  S.views.ieb = function (el, arg, params) {
    const items = window.IEB || [];
    let mod = params.m || 'all', year = 'all', text = '';
    const years = Array.from(new Set(items.map(x => x.year)));
    const list = h('div'), filt = h('div', { class: 'filters' });
    add(el, [h('div', { class: 'head' }, h('div', null, h('h2', null, 'IEB questions'), h('p', null, `${items.length} questions from IEB Paper 2 (2020 to May 2026) on Modules 27 to 29. Answer on paper first, then open the memo and mark yourself. Diagrams are described in words.`))),
      h('p', { class: 'small muted' }, 'Reproduced with acknowledgement to the IEB: see ', h('a', { href: '#about' }, 'About'), '. May 2026 answers are ours: there is no official memo yet.'), filt, list]);
    function filters() {
      clear(filt);
      add(filt, [select([['all', 'All modules'], ['27', 'Module 27'], ['28', 'Module 28'], ['29', 'Module 29']], mod, v => { mod = v; draw(); }, { 'aria-label': 'Module' }),
        select([['all', 'All years']].concat(years.map(y => [y, y])), year, v => { year = v; draw(); }, { 'aria-label': 'Year' }),
        h('input', { type: 'search', placeholder: 'Search, e.g. salt bridge', value: text, 'aria-label': 'Search the questions', oninput: e => { text = e.target.value.toLowerCase(); draw(); } })]);
    }
    function card(x) {
      const marks = store.get('ieb', {});
      const c = h('div', { class: 'qcard' });
      let open = false;
      function d() {
        clear(c);
        add(c, [h('div', { class: 'row small muted', style: { justifyContent: 'space-between' } }, h('span', null, `${x.paper} · ${x.q}`), h('span', null, `Module ${x.module} · ${x.marks} mark${x.marks > 1 ? 's' : ''}${marks[x.id] !== undefined ? ' · you scored ' + marks[x.id] : ''}`)),
          h('p', { class: 'prompt', style: { whiteSpace: 'pre-line' } }, x.question),
          !open ? h('button', { class: 'btn ghost small', type: 'button', onclick: () => { open = true; d(); } }, 'I have answered: show the memo') :
            h('div', null, h('div', { class: 'sol' }, h('b', null, x.noMemo ? 'Our answer (no official memo)' : 'Memo'), h('div', { class: 'ln', style: { whiteSpace: 'pre-line' } }, x.memo)),
              x.report ? h('div', { class: 'callout ex' }, h('h4', null, 'Examiners’ report ' + x.year), x.report) : null,
              h('div', { class: 'row', style: { marginTop: '8px' } }, h('span', { class: 'small' }, 'Mark yourself:'),
                Array.from({ length: x.marks + 1 }, (_, i) => h('button', { type: 'button', class: 'btn small ' + (marks[x.id] === i ? 'on' : 'ghost'), 'aria-pressed': String(marks[x.id] === i), onclick: () => {
                  const m = store.get('ieb', {}); m[x.id] = i; store.set('ieb', m);
                  logAttempt({ kind: 'supported', section: 'IEB-' + x.module, id: x.id, correct: i, total: x.marks }); d();
                } }, i + '/' + x.marks))))]);
      }
      d();
      return c;
    }
    function draw() {
      filters(); clear(list);
      const show = items.filter(x => (mod === 'all' || String(x.module) === mod) && (year === 'all' || x.year === year) && (!text || (x.question + ' ' + x.memo).toLowerCase().includes(text)));
      list.appendChild(h('p', { class: 'small muted' }, show.length + ' question' + (show.length === 1 ? '' : 's')));
      show.forEach(x => list.appendChild(card(x)));
    }
    draw();
  };

  /* ---------- Check ---------- */
  S.views.check = function (el, arg, params) {
    let scope = params.m || 'all', qs = [], apis = [], submitted = false;
    const body = h('div');
    add(el, [h('div', { class: 'head' }, h('div', null, h('h2', null, 'Check yourself'), h('p', null, 'Eight fresh questions, mixed. No hints and no feedback until you submit. Circle C (confident) or U (unsure) for each: it tells you which marks were luck.'))), body]);
    function build() {
      submitted = false; clear(body);
      const pool = S.SECTIONS.filter(s => scope === 'all' || String(s.mod) === scope);
      const picks = shuffle(pool).slice(0, 8);
      while (picks.length < 8) picks.push(pick(pool));
      qs = picks.map(s => makeQ(s.id)); apis = [];
      add(body, [h('div', { class: 'row' }, seg([['all', 'All three modules'], ['27', 'Module 27'], ['28', 'Module 28'], ['29', 'Module 29']], scope, v => { scope = v; build(); }))]);
      qs.forEach((q, i) => { const w = h('div'); w.appendChild(h('h3', { style: { marginTop: '18px' } }, 'Question ' + (i + 1))); body.appendChild(w); apis.push(renderQ(w, q, { mode: 'check', log: false })); });
      body.appendChild(h('div', { class: 'row', style: { marginTop: '14px' } }, h('button', { class: 'btn', type: 'button', onclick: submit }, 'Submit and mark'), h('button', { class: 'btn ghost', type: 'button', onclick: build }, 'New set')));
    }
    function submit() {
      if (submitted) return;
      const blank = apis.filter(a => !a.answered()).length;
      if (blank && !confirm(`${blank} question${blank > 1 ? 's are' : ' is'} blank. Submit anyway?`)) return;
      submitted = true;
      const res = apis.map(a => a.finish());
      const bySec = {};
      res.forEach((r, i) => { const s = qs[i].section; bySec[s] = bySec[s] || { c: 0, t: 0 }; bySec[s].t++; if (r.ok) bySec[s].c++; });
      Object.keys(bySec).forEach(s => logAttempt({ kind: 'independent', section: s, id: 'check', correct: bySec[s].c, total: bySec[s].t }));
      const right = res.filter(r => r.ok).length, lucky = res.filter(r => r.ok && r.conf === 'U').length, sure = res.filter(r => !r.ok && r.conf === 'C').length;
      const weak = Object.keys(bySec).filter(s => bySec[s].c < bySec[s].t);
      const sum = h('div', { class: 'card', style: { marginTop: '14px' } }, h('h3', null, `You scored ${right} out of 8`),
        lucky ? h('p', null, `${lucky} right answer${lucky > 1 ? 's were' : ' was'} marked U: practise ${lucky > 1 ? 'those sections' : 'that section'} again.`) : null,
        sure ? h('p', null, `${sure} wrong answer${sure > 1 ? 's were' : ' was'} marked C: a misconception. Reread the trap box in the section.`) : null,
        weak.length ? h('div', null, h('p', null, 'Wrong? Reread, then redo:'), h('ul', null, weak.map(s => { const sec = S.sectionById(s); return h('li', null, h('a', { href: '#section/' + s }, s + ' ' + sec.title), ' · ', h('a', { href: '#practise?s=' + s }, 'practise')); }))) : h('p', null, 'All correct. These sections will come back in Return later.'),
        h('p', { class: 'small muted' }, 'Each section you tried is scheduled in Return later (after 1, 3, 7 and 21 days).'));
      body.insertBefore(sum, body.children[1]);
      window.scrollTo(0, 0);
    }
    build();
  };

  /* ---------- Return later ---------- */
  S.views.review = function (el) {
    const rv = store.get('reviews', {}), due = S.dueReviews();
    const upcoming = Object.keys(rv).filter(k => !due.includes(k) && S.sectionById(k)).sort((a, b) => rv[a].due - rv[b].due);
    const body = h('div');
    add(el, [h('div', { class: 'head' }, h('div', null, h('h2', null, 'Return later'), h('p', null, 'Sections come back after 1, 3, 7 and 21 days. A right answer pushes a section further out; a wrong one brings it back tomorrow.'))), body]);
    function draw() {
      clear(body);
      const dueNow = S.dueReviews().filter(k => S.sectionById(k));
      add(body, [h('div', { class: 'grid g2' },
        h('div', { class: 'card' }, h('h3', null, dueNow.length ? `${dueNow.length} section${dueNow.length > 1 ? 's' : ''} due now` : 'Nothing due right now'),
          dueNow.length ? h('div', null, h('ul', null, dueNow.map(s => h('li', null, s + ' ' + S.sectionById(s).title))), h('button', { class: 'btn', type: 'button', onclick: () => run(dueNow) }, 'Start the review')) : h('p', { class: 'muted' }, 'Finish an “On your own” question or a Check, and the section is scheduled here.'),
          upcoming.length ? h('div', null, h('h4', null, 'Coming up'), h('ul', { class: 'small' }, upcoming.map(s => h('li', null, `${s} ${S.sectionById(s).short}: ${new Date(rv[s].due).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' })}`)))) : null),
        h('div', { class: 'card' }, h('h3', null, 'Definitions: flip cards'), h('p', { class: 'small muted' }, 'Say the SAGS wording out loud, then flip.'), flip())),
        h('div', { class: 'card', style: { marginTop: '14px' } }, h('h3', null, 'Your learning record'), record())]);
    }
    function run(list) {
      clear(body);
      let i = 0;
      const area = h('div');
      body.appendChild(area);
      function nextOne() {
        clear(area);
        if (i >= list.length) { area.appendChild(notice('ok', 'Review done. Each section has been rescheduled.')); area.appendChild(h('button', { class: 'btn', type: 'button', onclick: draw }, 'Back to Return later')); return; }
        const s = list[i];
        area.appendChild(h('p', { class: 'muted' }, `Review ${i + 1} of ${list.length}: ${s} ${S.sectionById(s).title}`));
        renderQ(area, makeQ(s), { mode: 'independent', delayed: true, onNext: () => { }, onAnswer: () => { area.appendChild(h('button', { class: 'btn', type: 'button', style: { marginTop: '10px' }, onclick: () => { i++; nextOne(); } }, i + 1 < list.length ? 'Next section' : 'Finish')); } });
      }
      nextOne();
    }
    function flip() {
      const defs = S.DEFS;
      let k = 0, open = false;
      const w = h('div');
      function d() {
        clear(w);
        const x = defs[k];
        add(w, [h('button', { class: 'flip', type: 'button', 'aria-label': open ? 'Show the term' : 'Show the definition', onclick: () => { open = !open; d(); } }, h('b', null, x.term), open ? h('span', null, x.def) : h('span', { class: 'muted' }, 'Tap to flip'), h('small', { class: 'muted' }, 'Section ' + x.section)),
          h('div', { class: 'row', style: { marginTop: '8px' } }, h('button', { class: 'btn ghost small', type: 'button', onclick: () => { k = (k + defs.length - 1) % defs.length; open = false; d(); } }, '← Previous'), h('span', { class: 'small muted' }, `${k + 1} of ${defs.length}`), h('button', { class: 'btn ghost small', type: 'button', onclick: () => { k = (k + 1) % defs.length; open = false; d(); } }, 'Next →'))]);
      }
      d();
      return w;
    }
    function record() {
      const att = store.get('attempts', []);
      const by = {};
      att.forEach(a => { if (!S.sectionById(a.section)) return; const s = by[a.section] = by[a.section] || { sup: [0, 0], ind: [0, 0] }; const t = a.kind === 'supported' ? s.sup : s.ind; t[0] += a.correct; t[1] += a.total; });
      const ks = Object.keys(by).sort((a, b) => parseFloat(a) - parseFloat(b));
      const w = h('div');
      add(w, [ks.length ? h('div', { style: { overflowX: 'auto' } }, h('table', { class: 'plain' }, h('thead', null, h('tr', null, h('th', null, 'Section'), h('th', null, 'With help'), h('th', null, 'On your own'), h('th', null, 'Next review'))),
        h('tbody', null, ks.map(s => h('tr', null, h('td', null, s + ' ' + S.sectionById(s).short), h('td', null, by[s].sup[1] ? `${by[s].sup[0]}/${by[s].sup[1]}` : '–'), h('td', null, by[s].ind[1] ? `${by[s].ind[0]}/${by[s].ind[1]}` : '–'), h('td', null, rv[s] ? new Date(rv[s].due).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' }) : '–')))))) : h('p', { class: 'muted' }, 'No attempts yet.'),
        h('p', { class: 'small muted' }, '“On your own” counts what you did without help (On your own, Check and reviews): that is the number that predicts the exam.'),
        h('div', { class: 'row' }, h('button', { class: 'btn ghost small', type: 'button', onclick: download }, 'Download my record'), h('button', { class: 'btn ghost small', type: 'button', onclick: () => { if (confirm('Clear all your progress in this browser?')) { store.reset(); draw(); } } }, 'Clear my progress'))]);
      function download() {
        const lines = ['Electrochemistry Studio: learning record', 'Downloaded ' + new Date().toLocaleString('en-ZA'), '', 'Section, with help, on your own, next review'];
        ks.forEach(s => lines.push(`${s} ${S.sectionById(s).title}, ${by[s].sup[0]}/${by[s].sup[1]}, ${by[s].ind[0]}/${by[s].ind[1]}, ${rv[s] ? new Date(rv[s].due).toLocaleDateString('en-ZA') : '-'}`));
        const ieb = store.get('ieb', {});
        if (Object.keys(ieb).length) { lines.push('', 'IEB questions self-marked'); Object.keys(ieb).forEach(k => lines.push(`${k}: ${ieb[k]}`)); }
        const a = h('a', { href: URL.createObjectURL(new Blob([lines.join('\n')], { type: 'text/plain' })), download: 'electrochemistry-record.txt' });
        document.body.appendChild(a); a.click(); a.remove();
      }
      return w;
    }
    draw();
  };
})();
