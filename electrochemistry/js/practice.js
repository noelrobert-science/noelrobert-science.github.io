/* Practise, IEB questions, Check and Return later: question generators (fresh numbers every time), a concept bank
   written from the coursebook, one question renderer with stepped hints, and the four views. */
(function () {
  'use strict';
  const EC = window.EC, S = window.STUDIO;
  const { h, add, clear, chem, seg, select, notice, readNum, close, shuffle, pick, logAttempt, store } = S;
  const isN = v => typeof v === 'number' && !isNaN(v);
  const R = k => EC.rowByKey(k);
  const rows = keys => keys.map(R).filter(Boolean);

  /* ---------- species pools ---------- */
  const RA_POOL = rows(['Mg²⁺/Mg', 'Aℓ³⁺/Aℓ', 'Zn²⁺/Zn', 'Fe²⁺/Fe', 'Ni²⁺/Ni', 'Pb²⁺/Pb', 'Cu²⁺/Cu', 'I₂/I⁻', 'Br₂/Br⁻', 'Fe³⁺/Fe²⁺', 'O₂+H⁺/H₂O₂']);
  const OA_POOL = rows(['Pb²⁺/Pb', 'H⁺/H₂', 'Cu²⁺/Cu', 'I₂/I⁻', 'Fe³⁺/Fe²⁺', 'Ag⁺/Ag', 'Br₂/Br⁻', 'Cr₂O₇²⁻+H⁺/Cr³⁺+H₂O', 'Cℓ₂/Cℓ⁻', 'MnO₄⁻+H⁺/Mn²⁺+H₂O', 'Ni²⁺/Ni', 'Zn²⁺/Zn']);
  const METAL_ROWS = rows(['Mg²⁺/Mg', 'Aℓ³⁺/Aℓ', 'Zn²⁺/Zn', 'Cr³⁺/Cr', 'Fe²⁺/Fe', 'Co²⁺/Co', 'Ni²⁺/Ni', 'Sn²⁺/Sn', 'Pb²⁺/Pb', 'Cu²⁺/Cu', 'Ag⁺/Ag']);
  const CELL_ROWS = rows(['Mg²⁺/Mg', 'Aℓ³⁺/Aℓ', 'Zn²⁺/Zn', 'Fe²⁺/Fe', 'Ni²⁺/Ni', 'Pb²⁺/Pb', 'Cu²⁺/Cu', 'Ag⁺/Ag', 'Cℓ₂/Cℓ⁻', 'Br₂/Br⁻', 'I₂/I⁻', 'Fe³⁺/Fe²⁺']);
  const isMetalRow = r => EC.isMetal(r.ra);
  const half = r => isMetalRow(r) ? `${r.ra} | ${r.oa}` : `${r.oa}${EC.phaseOf(r.oa) === EC.phaseOf(r.ra) ? ', ' : ' | '}${r.ra} (Pt)`;
  /* a calculation marked per step, as the memo ticks it. A later box also earns its mark when it follows correctly
     from the learner's own earlier numbers (the memos' follow-through), except where two values were simply swapped. */
  const ST = (lab, ans, unit, o) => Object.assign({ lab, ans, unit, tol: Math.max(0.0001, Math.abs(ans) * 0.02) }, o || {});
  const cfDiff = (v, a, b) => isN(v[0]) && isN(v[1]) && !(close(v[0], b, 0.006) && close(v[1], a, 0.006)) ? EC.round(v[0] - v[1], 2) : undefined;
  const eSteps = (labA, a, labB, b, val, tipA, tipB, formula) => [
    ST(labA, a, 'V', { signed: true, tol: 0.006, tip: tipA }), ST(labB, b, 'V', { signed: true, tol: 0.006, tip: tipB }),
    ST('Eθcell', val, 'V', { signed: true, tol: 0.006, cf: v => cfDiff(v, a, b), tip: formula })];
  const oaName = r => r.oa === 'MnO₄⁻' ? 'acidified MnO₄⁻' : r.oa === 'Cr₂O₇²⁻' ? 'acidified Cr₂O₇²⁻' : r.oa;
  // iron with an oxidising agent stronger than Fe³⁺ goes to Fe³⁺ ("the product picks the row"), so those pairs are not drawn
  const ironClash = (ra, oa) => ra.key === 'Fe²⁺/Fe' && oa.E > 0.77;
  function reactingPair() {
    for (let i = 0; i < 200; i++) { const ra = pick(RA_POOL), oa = pick(OA_POOL); if (ra !== oa && !ironClash(ra, oa) && EC.reacts(ra, oa)) return [ra, oa]; }
    return [R('Zn²⁺/Zn'), R('Cu²⁺/Cu')];
  }
  function anyPair() {
    for (let i = 0; i < 200; i++) { const ra = pick(RA_POOL), oa = pick(OA_POOL); if (ra !== oa && !ironClash(ra, oa)) return [ra, oa]; }
  }
  const opt = (t, ok, why) => ({ t, ok: !!ok, why });
  // "NaCℓ(aq), dilute" → "Dilute NaCℓ(aq)", "molten PbBr₂" → "Molten PbBr₂": an electrolyte named at the start of a sentence
  S.labelStart = lab => lab.replace(/^molten (.*)$/, 'Molten $1').replace(/^(.*), (dilute|concentrated)(.*)$/, (w, a, b, c) => b[0].toUpperCase() + b.slice(1) + ' ' + a + c);

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
      sol: [good.text, EC.rowNote(r, type).replace(/^r/, 'R') + '.'] };
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
    const good = S.memoSentence(ra, oa);
    const opposite = yes ? `${oa.oa} (${EC.ev(oa.E)} V) is a weaker oxidising agent than ${ra.oa} (${EC.ev(ra.E)} V), so no reaction takes place.`
      : `${oa.oa} (${EC.ev(oa.E)} V) is a stronger oxidising agent than ${ra.oa} (${EC.ev(ra.E)} V), so ${oa.oa} oxidises ${ra.ra} to ${ra.oa}.`;
    const opts = [opt(good, true, (yes ? 'It reacts. ' : 'No reaction. ') + 'This is the memo standard: two oxidising agents compared, with their Eθ values.'),
      opt(opposite, false, `Check the Eθ values: the more positive one (lower on the left of Table 4) is the stronger oxidising agent. Here that is ${oa.E > ra.E ? oa.oa : ra.oa}.`),
      opt(yes ? `It reacts: ${ra.ra} is more reactive than ${oa.ra}.` : `No reaction: ${ra.ra} is less reactive than ${oa.ra}.`, false, '“More reactive” earns no marks: compare the strengths of the oxidising agents (or of the reducing agents), with their Eθ values.'),
      opt(yes ? `It reacts: ${oa.oa} is a stronger oxidising agent than ${ra.ra}.` : `No reaction: ${oa.oa} is a weaker oxidising agent than ${ra.ra}.`, false, `Compare like with like: ${ra.ra} is a reducing agent. Compare ${oa.oa} with the other oxidising agent, ${ra.oa}.`)];
    return { section: '27.3', stars: 1, type: 'mcq', prompt: ['Will ', chem(ra.ra), ' react with ', chem(oaName(oa)), ' under standard conditions? Choose the answer that earns full marks.'],
      options: shuffle(opts.filter((o, i, a) => a.findIndex(p => p.t === o.t) === i)),
      hints: [`Compare the two oxidising agents: ${oa.oa} (${EC.ev(oa.E)} V) and ${ra.oa} (${EC.ev(ra.E)} V).`, 'The lower one on the left of Table 4 is the stronger oxidising agent.'],
      sol: [S.memoSentence(ra, oa)].concat(yes ? [net.text] : []) };
  };
  GEN.emfReact = () => {
    let ra, oa;
    do { [ra, oa] = anyPair(); } while (ra.key === 'O₂+H⁺/H₂O₂' && oa.key === 'H⁺/H₂'); // H⁺ would cancel out of the equation given
    const net = EC.netEquation(ra, oa), e = EC.eCell(oa, ra, { labels: 'agents' });
    return { section: '28.6', stars: 2, type: 'num', unit: 'V', ans: e.value, tol: 0.006, signed: true,
      steps: eSteps('EθOA (oxidising agent)', oa.E, 'EθRA (reducing agent)', ra.E, e.value, `In the reaction as written, ${oa.oa} gains electrons: it is the oxidising agent.`, `${ra.ra} loses electrons: it is the reducing agent.`, 'Eθcell = EθOA − EθRA'),
      prompt: ['Calculate Eθcell for the reaction ', chem(net.text), '. Include the sign.'],
      traps: [[-e.value, 'Check which species is reduced in the reaction AS WRITTEN: that one is the oxidising agent (cathode).'], [EC.round(oa.E + ra.E, 2), 'Subtract: Eθcell = EθOA − EθRA.']],
      hints: [`The oxidising agent is ${oa.oa} (${EC.ev(oa.E)} V); the reducing agent is ${ra.ra} (${EC.ev(ra.E)} V).`, 'Eθcell = EθOA − EθRA, with brackets round a negative value.'],
      sol: [e.formula, e.substitute, e.answer, e.value > 0 ? 'Positive: spontaneous under standard conditions.' : 'Negative: non-spontaneous under standard conditions (no reaction).'] };
  };
  GEN.spont = () => {
    const [ra, oa] = anyPair(), net = EC.netEquation(ra, oa), e = EC.eCell(oa, ra, { labels: 'agents' }), yes = e.value > 0;
    const why = `${e.substitute} = ${EC.ev(e.value)} V. ${yes ? 'Positive: spontaneous under standard conditions.' : 'Negative: non-spontaneous under standard conditions.'}`;
    return { section: '28.6', stars: 2, type: 'mcq', prompt: ['Is the reaction ', chem(net.text), ' spontaneous under standard conditions?'],
      options: [opt('Yes: Eθcell is positive', yes, why), opt('No: Eθcell is negative', !yes, why)],
      hints: [`In the reaction as written, the oxidising agent is ${oa.oa} (${EC.ev(oa.E)} V) and the reducing agent is ${ra.ra} (${EC.ev(ra.E)} V).`, 'Eθcell = EθOA − EθRA. The sign decides.'],
      sol: [e.formula, e.substitute, e.answer, yes ? 'Positive: spontaneous under standard conditions.' : 'Negative: non-spontaneous under standard conditions.'] };
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
      options: shuffle([opt(`the ${EC.NAMES[an.ra]} electrode`, true, `${an.ra} (${EC.ev(an.E)} V) is a stronger reducing agent than ${ca.ra} (${EC.ev(ca.E)} V), so ${an.ra} is oxidised: it is the anode.`),
        opt(`the ${EC.NAMES[ca.ra]} electrode`, false, `${ca.ra} is the weaker reducing agent: ${ca.oa} is reduced there, so it is the cathode.`),
        opt(`the ${half(an)} half-cell`, false, 'Name the electrode, not the half-cell: the anode is an electrode (the 2023 report did not accept a half-cell).'),
        opt(`the ${half(ca)} half-cell`, false, 'This is the cathode half-cell, and the anode is an electrode, not a half-cell.')]),
      hints: ['The anode is where oxidation happens.', 'The half-cell with the lower (more negative) Eθ contains the stronger reducing agent.'],
      sol: [`Anode: the ${EC.NAMES[an.ra]} electrode. ${an.ra} (${EC.ev(an.E)} V) is a stronger reducing agent than ${ca.ra} (${EC.ev(ca.E)} V), so ${an.ra} is oxidised.`, EC.oxidationHalf(an).text] };
  };
  GEN.flow = () => {
    const [an, ca] = twoCells(rows(['Mg²⁺/Mg', 'Zn²⁺/Zn', 'Fe²⁺/Fe', 'Ni²⁺/Ni', 'Pb²⁺/Pb', 'Cu²⁺/Cu', 'Ag⁺/Ag']));
    const A = EC.NAMES[an.ra], C = EC.NAMES[ca.ra], [p, r] = shuffle([an, ca]);
    return { section: '28.1', stars: 1, type: 'mcq', prompt: `In a galvanic cell made from ${EC.NAMES[p.ra]} and ${EC.NAMES[r.ra]} half-cells, in which direction do electrons flow?`,
      options: shuffle([opt(`from ${A} to ${C}, through the wire`, true, `The ${A} electrode is the anode (oxidation): electrons leave it and travel through the external circuit to the ${C} electrode (cathode).`),
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
    const [p, r] = shuffle([an, ca]);
    return { section: '28.4', stars: 2, type: 'mcq', prompt: `Choose the cell notation for a standard cell made from ${half(p)} and ${half(r)}.`,
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
    const [p, r] = shuffle([an, ca]);
    return { section: '28.6', stars: 1, type: 'num', unit: 'V', ans: e.value, tol: 0.006, signed: true,
      steps: eSteps('Eθcathode', ca.E, 'Eθanode', an.E, e.value, `The cathode is the half-cell with the higher Eθ: ${ca.oa}/${ca.ra}.`, `The anode holds the stronger reducing agent: ${an.ra}.`, 'Eθcell = Eθcathode − Eθanode'),
      prompt: `Calculate the emf of a standard cell made from ${half(p)} and ${half(r)} half-cells.`, traps,
      hints: [`The cathode is ${ca.oa}/${ca.ra} (${EC.ev(ca.E)} V): the higher Eθ.`, 'Eθcell = Eθcathode − Eθanode, with brackets round a negative value.'],
      sol: [e.formula, e.substitute, e.answer] };
  };
  const ELEC_KEYS = ['CuCℓ2-conc', 'CuSO4', 'NaCℓ-conc', 'NaCℓ-dil', 'KI', 'KBr', 'Na2SO4', 'H2SO4', 'AgNO3', 'ZnSO4', 'NiSO4', 'NaCℓ-molten', 'PbBr2-molten', 'MgCℓ2-molten'];
  GEN.elecEmf = () => {
    const key = pick(ELEC_KEYS.filter(k => !/molten/.test(k))), x = EC.electrolysis(key);
    return { section: '29.1', stars: 2, type: 'num', unit: 'V', ans: x.eCell.value, tol: 0.006, signed: true,
      steps: eSteps('Eθcathode', x.cathode.row.E, 'Eθanode', x.anode.row.E, x.eCell.value, `At the cathode: ${x.cathodeHalf.text}.`, `At the anode: ${x.anodeHalf.text}.`, 'Eθcell = Eθcathode − Eθanode: negative for an electrolytic cell'),
      prompt: `${S.labelStart(EC.ELECTROLYTES[key].label)} is electrolysed with inert electrodes. The products are ${prodLabel(x.cathode, 'c')} at the cathode and ${prodLabel(x.anode, 'a')} at the anode. Calculate Eθcell for this electrolytic cell.`,
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
  GEN.products = mode => {
    // mode: 'melt' (29.1), 'active' (a Cu or Ni anode, 29.2), 'aq' (graphite in a solution, 29.3), or none (any)
    const aqKeys = ELEC_KEYS.filter(k => EC.ELECTROLYTES[k].aqueous), meltKeys = ELEC_KEYS.filter(k => !EC.ELECTROLYTES[k].aqueous);
    let key, anode, x;
    for (let i = 0; i < 60; i++) {
      key = pick(mode === 'melt' ? meltKeys : mode ? aqKeys : ELEC_KEYS);
      const aq = EC.ELECTROLYTES[key].aqueous;
      anode = mode === 'active' ? pick(['Cu', 'Ni']) : mode ? 'graphite' : (aq && Math.random() < 0.25 ? pick(['Cu', 'Ni']) : 'graphite');
      x = EC.electrolysis(key, { anode });
      if (anode === 'graphite' || x.eCell.value <= 0) break; // a spontaneous "electrolysis" is not an electrolysis question
    }
    const aq = EC.ELECTROLYTES[key].aqueous;
    const cs = x.cathodeContest.map(c => prodLabel(c, 'c')).filter(Boolean), as = x.anodeContest.map(c => prodLabel(c, 'a')).filter(Boolean);
    const rc = prodLabel(x.cathode, 'c'), ra = prodLabel(x.anode, 'a');
    const combos = [];
    cs.forEach(c => as.forEach(a => combos.push([c, a])));
    if (!/dissolves/.test(ra)) combos.push([ra, rc]);
    if (!aq) { combos.push(['H₂ (and OH⁻)', ra]); combos.push([rc, 'O₂ (and H⁺)']); } // a melt has no water: the classic slip
    const right = `cathode: ${rc}; anode: ${ra}`;
    const wrong = shuffle(combos.map(([c, a]) => `cathode: ${c}; anode: ${a}`).filter((t, i, all) => t !== right && all.indexOf(t) === i)).slice(0, 3);
    const anodeWhy = x.anode.why === 'active anode' ? `${x.anode.sp} is the strongest reducing agent present, so the ${EC.NAMES[x.anode.sp]} anode dissolves.`
      : !aq ? `${x.anode.sp} is the only anion.`
      : x.anode.sp === 'H₂O' ? (x.electrolyte.anions.some(a => EC.rowsWithRight(a).length) ? `Under standard conditions H₂O (+1,23 V) is a stronger reducing agent than ${x.electrolyte.anions.join(', ')}, so water is oxidised.` : `${x.electrolyte.anions.join(', ')} ${x.electrolyte.anions.length > 1 ? 'are' : 'is'} not oxidised (only on the left of Table 4), so water is oxidised.`)
      : x.concNote ? '' : `${x.anode.sp} (${EC.ev(x.anode.row.E)} V) is a stronger reducing agent than H₂O (+1,23 V), so ${x.anode.sp} is oxidised.`;
    const lab = EC.ELECTROLYTES[key].label, mPrompt = S.labelStart(lab);
    return { section: mode === 'melt' ? '29.1' : mode === 'active' ? '29.2' : '29.3', stars: aq ? 2 : 1, type: 'mcq',
      prompt: `${mPrompt} is electrolysed with ${anode === 'graphite' ? 'graphite electrodes' : 'a graphite cathode and a ' + EC.NAMES[anode] + ' anode'}. Which products form?`,
      options: shuffle([opt(right, true, [x.cathode.sp === 'H₂O' ? `${x.electrolyte.cations.join(', ')} is a weaker oxidising agent than H₂O, so water is reduced.` : x.electrolyte.aqueous ? `${x.cathode.sp} is a stronger oxidising agent than H₂O, so ${x.cathode.sp} is reduced.` : `${x.cathode.sp} is the only cation.`, anodeWhy, x.concNote || ''].filter(Boolean).join(' '))].concat(wrong.map(t => opt(t, false, 'Run both contests: at the cathode the strongest oxidising agent wins; at the anode the strongest reducing agent wins (and an active anode dissolves).')))),
      hints: [aq ? 'List the ions AND water. Water can be reduced (−0,83 V) and oxidised (+1,23 V).' : 'In a melt there is no water: each ion is the only candidate at its electrode.', 'Cathode: compare the oxidising agents. Anode: compare the reducing agents (including the anode itself if it is not inert).'],
      sol: [`Cathode: ${x.cathodeHalf.text}`, `Anode: ${x.anodeHalf.text}`, /^no net/.test(x.net.text) ? `Overall: ${EC.NAMES[x.anode.sp]} moves from the anode to the cathode; [${x.anode.row.oa}] stays the same.` : `Overall: ${x.net.text}`] };
  };
  GEN.productsMelt = () => GEN.products('melt');
  GEN.productsActive = () => GEN.products('active');
  GEN.productsAq = () => GEN.products('aq');
  GEN.hydrate = () => {
    const item = pick(S.HYDRATES), m = pick([12, 15, 20, 25, 30, 40, 55]), V = pick([100, 250, 500]);
    const M = EC.molarMass(item.f), n = m / M, c = n / (V / 1000), ionC = EC.round(item.k * c, 2), salt = item.f.split('·')[0];
    const Vd = V / 1000;
    return { section: '29.3', stars: 3, type: 'num', unit: 'mol·dm⁻³', ans: ionC, tol: 0.011,
      steps: [ST('M(' + item.f + ')', M, 'g·mol⁻¹', { tol: 0.6, tip: 'Include the waters of crystallisation in M.' }),
        ST('n(' + salt + ')', n, 'mol', { cf: v => isN(v[0]) && v[0] > 0 ? m / v[0] : undefined, tip: 'n = m/M' }),
        ST('c(' + salt + ')', c, 'mol·dm⁻³', { cf: v => isN(v[1]) ? v[1] / Vd : undefined, tip: 'c = n/V, with V in dm³.' }),
        ST('[' + item.ion + ']', ionC, 'mol·dm⁻³', { tol: Math.max(0.011, ionC * 0.01), cf: v => isN(v[2]) ? item.k * v[2] : undefined, tip: `1 ${salt} gives ${item.k} ${item.ion}.` })],
      prompt: [`${EC.num(m)} g of `, chem(item.f), ` is dissolved to make ${V} cm³ of solution. Calculate [`, chem(item.ion), '].'],
      traps: [[EC.round(item.k * (m / EC.molarMass(salt)) / (V / 1000), 2), 'Include the waters of crystallisation in M.'], item.k > 1 ? [EC.round(c, 2), `That is [${salt}]. Each formula unit gives ${item.k} ${item.ion} ions.`] : null].filter(Boolean),
      hints: [EC.molarMassWorking(item.f), `n = m/M = ${EC.num(n, 4)} mol; c = n/V with V in dm³.`, `1 ${salt} → ${item.k === 1 ? '' : item.k}${item.ion}`],
      sol: [EC.molarMassWorking(item.f), `n = ${EC.num(m)} / ${EC.num(M)} = ${EC.num(n, 4)} mol`, `c(${salt}) = ${EC.num(n, 4)} / ${EC.num(V / 1000, 3)} = ${EC.num(c, 4)} mol·dm⁻³`, `[${item.ion}] = ${item.k === 1 ? '' : item.k + ' × '}${EC.num(c, 4)} = ${EC.num(ionC, 2)} mol·dm⁻³`] };
  };
  GEN.faraday = () => {
    const q = S.makeFaradayQ(), p = q.parts, k = p.P.gas ? EC.VM : p.P.M;
    return { section: '29.5', stars: 2, type: 'num', unit: q.unit, ans: q.ans, tol: Math.max(0.011, q.ans * 0.005), prompt: q.text, hints: q.hints, sol: q.sol,
      steps: [ST('q', p.q, 'C', { tol: Math.max(0.6, p.q * 0.002), tip: 'q = It, with t in seconds.' }),
        ST('n(e⁻)', p.ne, 'mol', { cf: v => isN(v[0]) ? v[0] / EC.F : undefined, tip: 'n(e⁻) = q/F' }),
        ST('n(' + p.P.sp + ')', p.n, 'mol', { cf: v => isN(v[1]) ? v[1] / p.P.ratio : undefined, tip: 'Use the ratio in ' + p.P.half + '.' }),
        ST(p.P.gas ? 'V' : 'm', q.ans, q.unit, { tol: Math.max(0.011, q.ans * 0.01), cf: v => isN(v[2]) ? v[2] * k : undefined, tip: p.P.gas ? 'V = nVm (22,4 dm³·mol⁻¹ at STP)' : 'm = nM' })],
      traps: [[q.traps.noRatio, 'Use the half-reaction ratio: moles of electrons are not moles of product.'], [q.traps.minutes, 'Change the time to seconds before q = It.']] };
  };
  GEN.faradayRev = () => {
    const k = pick(['Cu', 'Ag', 'Ni', 'Zn']), P = S.PROCS[k], m = pick([2.5, 5, 7.5, 10, 12.7, 15.9, 20]), I = pick([2, 2.5, 4, 5, 10, 20]);
    const f = EC.faradayFromMass({ m, M: P.M, ratio: P.ratio, I });
    const t = EC.round(f.t, 2);
    return { section: '29.5', stars: 3, type: 'num', unit: 's', ans: t, tol: Math.max(0.6, t * 0.003),
      steps: [ST('n(' + k + ')', f.n, 'mol', { tip: 'n = m/M' }),
        ST('n(e⁻)', f.ne, 'mol', { cf: v => isN(v[0]) ? v[0] * P.ratio : undefined, tip: 'Use the ratio in ' + P.half + '.' }),
        ST('q', f.q, 'C', { tol: Math.max(0.6, f.q * 0.005), cf: v => isN(v[1]) ? v[1] * EC.F : undefined, tip: 'q = nF' }),
        ST('t', t, 's', { tol: Math.max(0.6, t * 0.005), cf: v => isN(v[2]) ? v[2] / I : undefined, tip: 't = q/I' })],
      prompt: `A constant current of ${EC.num(I)} A deposits ${EC.num(m)} g of ${EC.NAMES[k]} (${P.half}). Calculate the time taken, in seconds.`,
      traps: [[EC.round(t / P.ratio, 2), 'Use the ratio: n(e⁻) = ' + P.ratio + ' × n(' + k + ').']],
      hints: [`n(${k}) = m/M = ${EC.num(m)} / ${EC.num(P.M)}`, `${P.half}: n(e⁻) = ${P.ratio === 1 ? '' : P.ratio}n(${k}); then q = nF.`, 't = q/I'],
      sol: [`n(${k}) = ${EC.num(m)} / ${EC.num(P.M)} = ${EC.numSig(f.n, 6)} mol`, `n(e⁻) = ${P.ratio === 1 ? 'n(' + k + ')' : P.ratio + ' × ' + EC.numSig(f.n, 6)} = ${EC.numSig(f.ne, 6)} mol`, `q = nF = (${EC.numSig(f.ne, 6)})(96 500) = ${EC.num(f.q, 2)} C`, `t = q/I = ${EC.num(f.q, 2)} / ${EC.num(I)} = ${EC.num(t, 2)} s`] };
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
    B('28.7', 2, 'Na₂S is added to the copper half-cell of a Zn–Cu cell (CuS precipitates). What happens to the voltage?', 'It decreases', '[Cu²⁺] decreases, so the reverse reaction is favoured to make more Cu²⁺ (the four-step method of the 2023 memo, Q6.8).', [['It increases', 'Removing a reactant favours the reverse reaction.'], ['It stays the same', 'The concentration of a reactant changed.'], ['It doubles', 'There is no simple proportion.']]),
    B('28.7', 1, 'Why is the voltage of a flat cell zero?', 'The reaction has reached equilibrium (or a reactant is used up)', 'There is no net reaction to drive electrons.', [['It has run out of electrons', 'Electrons are not used up.'], ['The salt bridge has dried out', 'That would open the circuit, but that is not why a cell goes flat.'], ['The electrodes have become inert', 'The electrodes have not changed: the concentrations have, until there is no net reaction.']]),
    B('28.8', 1, 'Define internal resistance.', 'Opposition to the flow of charge through the electrodes and electrolytes in a cell', 'SAGS wording.', [['The resistance of the wire and the voltmeter', 'That is external.'], ['The difference between the emf and the reading', 'That is the effect, not the definition.'], ['The energy lost per coulomb in the salt bridge only', 'It includes the electrodes and electrolytes.']]),
    B('28.8', 2, 'The electrodes of a cell are replaced with ones of larger surface area. What happens?', 'The maximum current increases; the emf stays the same', 'The internal resistance decreases. The emf depends only on the half-reactions and the conditions.', [['The emf increases', 'The emf does not depend on the size of the electrodes.'], ['The maximum current decreases', 'Larger electrodes lower the internal resistance.'], ['Both stay the same', 'The internal resistance changes.']]),
    B('28.8', 2, 'Which change to the salt bridge increases the maximum current?', 'a shorter, wider salt bridge', 'It lowers the internal resistance.', [['a longer, narrower salt bridge', 'That raises the internal resistance.'], ['a KCℓ salt bridge next to a silver half-cell', 'AgCℓ would precipitate.'], ['removing the salt bridge', 'Then no current flows.']]),
    B('29.1', 1, 'Which statement about an electrolytic cell is correct?', 'The anode is positive and oxidation takes place there', 'It is joined to the positive terminal of the supply.', [['The anode is negative', 'That is a galvanic cell.'], ['Reduction takes place at the anode', 'Oxidation is always at the anode.'], ['Electrons flow through the electrolyte', 'Ions carry the charge in the electrolyte.']]),
    B('29.1', 1, 'What is the energy conversion in an electrolytic cell?', 'electrical energy to chemical energy', 'A non-spontaneous reaction is driven by the supply.', [['chemical energy to electrical energy', 'That is a galvanic cell.'], ['heat to electrical energy', 'The supply is electrical, and nothing is heated to make electricity.'], ['chemical energy to heat only', 'Electrical energy goes in and is stored as chemical energy.']]),
    B('29.1', 2, 'Why must a DC (not AC) supply be used for electrolysis?', 'DC keeps each electrode’s polarity fixed, so the same reaction continues at each electrode', 'With AC the electrodes would keep swapping (May 2026, our answer).', [['DC gives a higher voltage', 'AC can give any voltage.'], ['AC would melt the electrolyte', 'The kind of current does not melt anything: the problem is that the electrodes keep swapping.'], ['DC supplies the ions', 'The electrolyte supplies the ions.']], 'With AC the signs of the electrodes keep swapping. What would happen at each electrode?'),
    B('29.1', 2, 'Molten MgCℓ₂ needs a much higher temperature than MgCℓ₂(aq). Why?', 'It is ionic, with strong forces in the lattice, so it melts only at a high temperature; only then are the ions free to move', '“It is a liquid” scored nothing (2024 report).', [['Magnesium needs heat to be reduced', 'Melting is about freeing the ions.'], ['To boil off the chlorine', 'Chlorine is already a gas: the heat is needed to melt the lattice.'], ['It is a liquid', 'The report gave no marks for this.']], 'What must the ions be able to do before a current can flow? What holds them in the solid?'),
    B('29.2', 1, 'Which of these is an inert electrode in exam questions?', 'graphite', 'Platinum, graphite (and titanium in the membrane cell).', [['copper', 'A copper anode is oxidised.'], ['nickel', 'A nickel anode is oxidised.'], ['zinc', 'Zinc is a strong reducing agent.']]),
    B('29.2', 2, 'KBr(aq) is electrolysed with a nickel anode. Does bromine form at the anode?', 'No: Ni is a stronger reducing agent than Br⁻, so the nickel anode is oxidised', 'Ni (−0,25 V) is far above Br⁻ (+1,09 V) on the right of Table 4.', [['Yes: Br⁻ is attracted to the anode', 'Attraction does not decide which species reacts.'], ['Yes: nickel is inert', 'Only Pt, graphite and Ti are inert.'], ['No: water is oxidised', 'The nickel itself is the strongest reducing agent.']]),
    B('29.4', 1, 'In electroplating a spoon with silver, the spoon is…', 'the cathode, joined to the negative terminal', 'Ag⁺ is reduced on it.', [['the anode, joined to the positive terminal', 'Then it would be oxidised.'], ['the anode, joined to the negative terminal', 'The negative electrode is the cathode.'], ['kept out of the electrolyte', 'It must be in the electrolyte.']]),
    B('29.4', 2, 'During copper electrorefining with cobalt and gold impurities, what happens to the gold?', 'It falls to the bottom as anode sludge', 'Au is a weaker reducing agent than Cu, so it is not oxidised.', [['It is oxidised to Au³⁺', 'Au is a weaker reducing agent than Cu.'], ['It deposits on the cathode', 'It is never in solution.'], ['It dissolves as Au⁺', 'Gold is never oxidised here, so it never forms Au⁺: it falls as sludge.']]),
    B('29.4', 2, 'What happens to [Cu²⁺] during electrorefining of blister copper containing cobalt?', 'It slowly decreases', 'Co is oxidised at the anode too, but only Cu²⁺ is reduced at the cathode (2025 memo).', [['It stays the same', 'That is electroplating.'], ['It increases', 'Cu²⁺ is removed faster than it forms.'], ['It drops to zero at once', 'Cu²⁺ is still reduced and replaced in part: it falls slowly.']]),
    B('29.4', 2, 'Why is SATURATED brine used in the membrane cell?', 'The high [Cℓ⁻] makes the oxidation of Cℓ⁻ predominant over water at the anode', 'Dilute brine would give oxygen too (2024 report wanted the reason).', [['To make more NaOH at the anode', 'NaOH forms on the cathode side.'], ['Because Na⁺ is then reduced', 'Na⁺ is never reduced in water.'], ['To stop the membrane dissolving', 'The membrane does not dissolve in dilute brine either: the reason is the anode contest.']]),
    B('29.4', 1, 'What does the membrane in the membrane cell let through?', 'only Na⁺ ions (cations)', 'It keeps Cℓ₂ away from H₂ and NaOH, and keeps Cℓ⁻ out of the NaOH.', [['only Cℓ⁻ ions', 'Anions cannot cross.'], ['all ions', 'That is a diaphragm (2023 Q1.8).'], ['electrons', 'Electrons flow through the external circuit.']]),
    B('29.4', 2, 'Why can aluminium not be plated from AℓCℓ₃(aq)?', 'Aℓ³⁺ is a weaker oxidising agent than H₂O, so water is reduced instead', 'Hydrogen bubbles off at the object.', [['Aluminium is too soft', 'Not a chemical reason.'], ['Cℓ⁻ is reduced at the cathode', 'Cℓ⁻ appears only on the right of Table 4, so it cannot be reduced (it can only be oxidised). At the cathode H₂O (−0,83 V) is a stronger oxidising agent than Aℓ³⁺ (−1,66 V), so water is reduced.'], ['Aℓ³⁺ is too strong an oxidising agent', 'It is far too weak (−1,66 V).']])
  ];
  // two-step hints for every bank item, in the order of S.BANK above
  const BANK_HINTS = [
    ['One function is about the circuit.', 'The other is about the charge in each half-cell as ions form and are used up.'],
    ['What builds up in the anode half-cell as the zinc dissolves?', 'Zn²⁺ ions form there, so positive charge builds up. Which ions from the bridge cancel it?'],
    ['What do Cℓ⁻ ions do with Ag⁺ ions?', 'AgCℓ is insoluble: it precipitates.'],
    ['Compare MnO₄⁻ (+1,51 V) with Cℓ₂ (+1,36 V) on the left of Table 4.', 'The stronger oxidising agent would oxidise the Cℓ⁻ ions of the acid.'],
    ['Look at the half-reaction Cℓ₂ + 2e⁻ → 2Cℓ⁻.', 'Is there a solid in it that can conduct the electrons?'],
    ['An inert electrode must conduct and must not react.', 'Would Fe³⁺ (+0,77 V) oxidise copper, iron or zinc?'],
    ['One reason is about electricity.', 'The other is about the reaction.'],
    ['Standard conditions: 1 mol·dm⁻³, 1 atm (for gases) and 25 °C.', 'Does this cell have a gas?'],
    ['The SHE has H₂ gas and H⁺ ions, so it needs an inert electrode.', 'Standard: 1 mol·dm⁻³ H⁺ and 1 atm H₂, at 25 °C.'],
    ['Le Châtelier: is Cu²⁺ a reactant or a product of Zn + Cu²⁺ → Zn²⁺ + Cu?', 'Adding a reactant favours the forward reaction.'],
    ['CuS precipitates: what happens to [Cu²⁺]?', 'Removing a reactant favours the reverse reaction.'],
    ['A cell gives a voltage only while there is a net reaction.', 'What state has no net reaction?'],
    ['It is an opposition to the flow of charge.', 'Where? Inside the cell: through the electrodes and the electrolytes.'],
    ['Surface area changes the internal resistance, not the half-reactions.', 'What depends only on the half-reactions and the conditions?'],
    ['Which salt bridge resists the flow of charge less?', 'A shorter, wider or more conductive bridge lowers the internal resistance.'],
    ['In an electrolytic cell the anode is joined to the positive terminal.', 'Oxidation always happens at the anode.'],
    ['The supply drives a non-spontaneous reaction.', 'Which form of energy goes in, and which is stored?'],
    ['With AC the polarity keeps reversing.', 'What must stay the same at each electrode?'],
    ['What holds the ions in place in the solid?', 'Why must the ions be free to move?'],
    ['Inert electrodes conduct and do not react.', 'The exam uses platinum, graphite (and titanium in the membrane cell).'],
    ['At the anode the strongest reducing agent is oxidised.', 'Compare Ni (−0,25 V), Br⁻ (+1,09 V) and H₂O (+1,23 V) on the right of Table 4.'],
    ['Silver must be deposited on the spoon.', 'Deposition is a reduction: where does reduction happen?'],
    ['Is Au a stronger or a weaker reducing agent than Cu?', 'A metal that is not oxidised does not dissolve.'],
    ['At the anode both Cu and Co are oxidised.', 'At the cathode only Cu²⁺ is reduced.'],
    ['Under standard conditions H₂O (+1,23 V) is a stronger reducing agent than Cℓ⁻ (+1,36 V).', 'What does a very high [Cℓ⁻] do to the anode contest?'],
    ['The membrane is a cation-exchange membrane.', 'Which ion must reach the cathode side to form NaOH?'],
    ['At the cathode, compare Aℓ³⁺ (−1,66 V) with H₂O (−0,83 V).', 'The stronger oxidising agent is reduced.']
  ];
  S.BANK.forEach((q, i) => { if (BANK_HINTS[i]) q.hints = BANK_HINTS[i]; });
  S.BANK.push(
    B('28.8', 2, 'The reading across a cell drops from 1,10 V to 0,95 V when it delivers a current. Why?', 'The cell has internal resistance, so some of the energy per coulomb is used inside the cell', 'The emf has not changed: the potential difference across the cell is less than the emf (2024 report, Q6.6).', [['The emf of the cell decreases', 'The emf depends on the half-reactions and the conditions, which have not changed.'], ['The concentration of the electrolyte changes at once', 'Concentration changes the emf only slowly, as the cell runs down.'], ['The voltmeter uses up electrons', 'Charge is not used up in a circuit.']], 'What is different when a current flows?'),
    B('28.8', 1, 'Which change does NOT affect the emf of a cell?', 'a larger electrode surface area', 'Surface area changes only the internal resistance and the maximum current.', [['a higher concentration of the oxidising agent', 'Concentration changes the emf (28.7).'], ['a higher temperature', 'Temperature changes the emf.'], ['a different metal in the anode half-cell', 'A different half-reaction gives a different emf.']], 'The emf depends on the half-reactions and the conditions.'),
    B('28.8', 2, 'The KNO₃ solution in a salt bridge is replaced with a more concentrated one. What happens?', 'The maximum current increases; the emf stays the same', 'More ions carry the charge: the internal resistance is lower (SAGS).', [['The emf increases', 'The salt bridge is not part of either half-reaction.'], ['The maximum current decreases', 'A more conductive bridge lowers the internal resistance.'], ['The cell reaction is reversed', 'Nothing about the half-reactions has changed.']], 'Is the bridge part of either half-reaction?'),
    B('28.8', 2, 'Which TWO changes lower the internal resistance of a cell?', 'larger electrodes, and a shorter, wider salt bridge', 'Both let charge flow more easily inside the cell (SAGS).', [['more concentrated half-cell solutions and a higher gas pressure', 'These change the emf (28.7), not the internal resistance.'], ['a longer salt bridge and thinner electrodes', 'Both raise the internal resistance.'], ['a bigger voltmeter and longer wires', 'These are outside the cell.']], 'Internal resistance is inside the cell: the electrodes and the electrolytes.'),
    B('29.4', 2, 'During electroplating with a silver anode in AgNO₃(aq), what happens to [Ag⁺]?', 'It stays the same', 'The anode dissolves (Ag → Ag⁺ + e⁻) as fast as Ag⁺ is deposited on the object.', [['It decreases', 'That happens with an inert anode.'], ['It increases', 'Ag⁺ forms and is used up at the same rate.'], ['It drops to zero', 'Ag⁺ is replaced as fast as it is used.']], 'Compare what happens at the anode with what happens at the object.'),
    B('29.4', 2, 'Why does an electrorefining cell need only a small voltage?', 'The same reaction runs backwards at the two electrodes, so Eθcell is about 0 V', 'Cu → Cu²⁺ + 2e⁻ at the anode, Cu²⁺ + 2e⁻ → Cu at the cathode.', [['Copper is a very good conductor', 'Conductivity does not set the voltage needed.'], ['The impurities supply the energy', 'The supply provides the energy; the reactions at the two electrodes almost cancel.'], ['The electrolyte is concentrated', 'Concentration is not the reason.']], 'Write the half-reaction at each electrode.')
  );
  // no repeat of the item just shown, per section
  const lastBank = {};
  GEN.bank = section => {
    const pool = S.BANK.filter(q => !section || q.section === section);
    const all = pool.length ? pool : S.BANK, fresh = all.filter(x => x !== lastBank[section || '*']);
    const q = pick(fresh.length ? fresh : all);
    lastBank[section || '*'] = q;
    return Object.assign({}, q, { options: shuffle(q.options) });
  };

  /* ---------- generators for the sections that used to draw only on the bank ---------- */
  const GAL = rows(['Zn²⁺/Zn', 'Fe²⁺/Fe', 'Ni²⁺/Ni', 'Pb²⁺/Pb', 'Cu²⁺/Cu', 'Ag⁺/Ag']);
  const NITRATE = { 'Zn²⁺': 'Zn(NO₃)₂', 'Fe²⁺': 'Fe(NO₃)₂', 'Ni²⁺': 'Ni(NO₃)₂', 'Pb²⁺': 'Pb(NO₃)₂', 'Cu²⁺': 'Cu(NO₃)₂', 'Ag⁺': 'AgNO₃' };
  // 28.2: which ions move where (the 2025 Q1.8 pattern)
  GEN.bridge = () => {
    const [an, ca] = twoCells(GAL), A = EC.NAMES[an.ra], C = EC.NAMES[ca.ra];
    const salts = [['KNO₃', 'K⁺', 'NO₃⁻'], ['NaNO₃', 'Na⁺', 'NO₃⁻']].concat([an, ca].some(r => /Ag|Pb/.test(r.oa)) ? [] : [['KCℓ', 'K⁺', 'Cℓ⁻'], ['Na₂SO₄', 'Na⁺', 'SO₄²⁻']]);
    const [salt, cat, ani] = pick(salts), kind = pick(['anode', 'cathode', 'towards']);
    const anWhy = `The ${A} electrode is the anode: ${an.oa} ions form in that half-cell, so positive charge builds up and the ${ani} ions move in to keep it neutral.`;
    const caWhy = `The ${C} electrode is the cathode: ${ca.oa} ions are used up in that half-cell, so the ${cat} ions move in to keep it neutral.`;
    const base = { section: '28.2', stars: 2, type: 'mcq', hints: ['First find the anode: the half-cell with the stronger reducing agent.', 'At the anode positive ions form; at the cathode positive ions are used up.'] };
    if (kind === 'towards') return Object.assign(base, { prompt: `A galvanic cell is made from ${A} and ${C} half-cells with a ${salt} salt bridge. Towards which half-cell do the ${cat} ions of the salt bridge move?`,
      options: shuffle([opt(`towards the ${C} half-cell`, true, caWhy), opt(`towards the ${A} half-cell`, false, `The ${ani} ions move there: ${an.oa} ions form in the anode half-cell.`), opt('they do not move', false, 'The bridge ions move to keep both half-cells neutral.')]), sol: [caWhy] });
    const into = kind === 'anode' ? A : C;
    return Object.assign(base, { prompt: `A galvanic cell is made from ${A} and ${C} half-cells with a ${salt} salt bridge. Which ions move from the salt bridge into the ${into} half-cell?`,
      options: shuffle([opt(`${kind === 'anode' ? ani : cat} ions`, true, kind === 'anode' ? anWhy : caWhy), opt(`${kind === 'anode' ? cat : ani} ions`, false, kind === 'anode' ? `Those move into the ${C} half-cell, where ${ca.oa} is used up.` : `Those move into the ${A} half-cell, where ${an.oa} forms.`),
        opt('electrons', false, 'Electrons never enter the salt bridge: they flow through the wire.'), opt(`${(kind === 'anode' ? an : ca).oa} ions`, false, 'These belong to the half-cell itself, not to the salt bridge.')]), sol: [kind === 'anode' ? anWhy : caWhy] });
  };
  // 28.3: which half-cell needs an inert electrode, and which electrode will do
  GEN.inert = () => {
    const non = pick(rows(['Cℓ₂/Cℓ⁻', 'Br₂/Br⁻', 'I₂/I⁻', 'Fe³⁺/Fe²⁺', 'H⁺/H₂', 'MnO₄⁻+H⁺/Mn²⁺+H₂O']));
    if (Math.random() < 0.5) {
      const mets = shuffle(GAL).slice(0, 3);
      return { section: '28.3', stars: 1, type: 'mcq', prompt: 'Which of these half-cells needs an inert electrode such as platinum?',
        options: shuffle([opt(`${half(non).replace(' (Pt)', '')}`, true, `Neither ${non.oa} nor ${non.ra} is a solid that can conduct: an inert electrode is needed.`)].concat(mets.map(m => opt(`${m.ra} | ${m.oa}`, false, `The ${EC.NAMES[m.ra]} itself is the electrode: it conducts and takes part in the half-reaction.`)))),
        hints: ['A half-cell needs a solid conductor.', 'Which half-reaction has no metal in it?'], sol: [`${half(non)}: there is no solid conductor in the half-reaction, so platinum is used.`] };
    }
    const strong = pick(rows(['Cℓ₂/Cℓ⁻', 'Br₂/Br⁻', 'Fe³⁺/Fe²⁺', 'MnO₄⁻+H⁺/Mn²⁺+H₂O']));
    const mets = shuffle(rows(['Cu²⁺/Cu', 'Fe²⁺/Fe', 'Zn²⁺/Zn', 'Ni²⁺/Ni', 'Pb²⁺/Pb'])).slice(0, 3);
    return { section: '28.3', stars: 2, type: 'mcq', prompt: [`Which electrode could be used in a ${half(strong).replace(' (Pt)', '')} half-cell?`],
      options: shuffle([opt('platinum', true, 'It conducts and is unreactive.')].concat(mets.map(m => opt(EC.NAMES[m.ra], false, `${strong.oa} (${EC.ev(strong.E)} V) is a stronger oxidising agent than ${m.oa} (${EC.ev(m.E)} V): it would oxidise the ${EC.NAMES[m.ra]}.`)))),
      hints: ['An inert electrode must conduct and must not react.', `Would ${strong.oa} (${EC.ev(strong.E)} V) oxidise the metal?`], sol: [`Platinum: it conducts and does not react. ${strong.oa} would oxidise each of the metals.`] };
  };
  // 28.7: something is added to one half-cell of a working cell
  GEN.conc = () => {
    const [an, ca] = twoCells(GAL), A = EC.NAMES[an.ra], C = EC.NAMES[ca.ra], net = EC.netEquation(an, ca).text;
    const acts = [
      [`A concentrated ${NITRATE[ca.oa]} solution is added to the ${C} half-cell`, 'up', `[${ca.oa}], a reactant, increases`],
      [`A concentrated ${NITRATE[an.oa]} solution is added to the ${A} half-cell`, 'down', `[${an.oa}], a product, increases`],
      [`Water is added to the ${C} half-cell`, 'down', `[${ca.oa}], a reactant, decreases`],
      [`Na₂S solution is added to the ${C} half-cell, and a sulfide precipitates`, 'down', `[${ca.oa}], a reactant, decreases`],
      [`Na₂S solution is added to the ${A} half-cell, and a sulfide precipitates`, 'up', `[${an.oa}], a product, decreases`]];
    const [act, dir, why] = pick(acts);
    const full = `${why}, so the ${dir === 'up' ? 'forward' : 'reverse'} reaction is favoured and the voltage ${dir === 'up' ? 'increases' : 'decreases'}.`;
    return { section: '28.7', stars: 2, type: 'mcq', prompt: [`A ${A}–${C} cell (`, chem(net), `) is delivering a current. ${act}. What happens to the voltmeter reading?`],
      options: shuffle([opt('It increases', dir === 'up', full), opt('It decreases', dir === 'down', full), opt('It stays the same', false, 'A concentration changed, so the cell potential changes (non-standard conditions).'), opt('It drops to zero at once', false, 'Only equilibrium (a flat cell) gives zero.')]),
      hints: [`Write the cell reaction: ${net}. Is the ion that changed a reactant or a product?`, 'More reactant (or less product) favours the forward reaction: the voltage increases.'], sol: [full] };
  };
  // 29.4: electroplating set-ups
  const PLATE = [['silver', 'Ag', 'Ag⁺', 'AgNO₃(aq)'], ['copper', 'Cu', 'Cu²⁺', 'CuSO₄(aq)'], ['nickel', 'Ni', 'Ni²⁺', 'NiSO₄(aq)'], ['zinc', 'Zn', 'Zn²⁺', 'ZnSO₄(aq)']];
  GEN.plate = () => {
    const [name, M, ion, sol] = pick(PLATE), obj = pick(['a steel key', 'an iron nail', 'a brass tap', 'a steel spoon']);
    const row = rows([ion + '/' + M])[0], halfR = row ? EC.reductionHalf(row).text : `${ion} + e⁻ → ${M}`;
    if (Math.random() < 0.5) return { section: '29.4', stars: 1, type: 'mcq', prompt: `${obj[0].toUpperCase() + obj.slice(1)} is to be electroplated with ${name}. Choose the set-up.`,
      options: shuffle([opt(`cathode: ${obj.split(' ').slice(1).join(' ')}; anode: ${name}; electrolyte: ${sol}`, true, `The object is the cathode, where ${ion} is reduced on it. The ${name} anode dissolves and replaces the ${ion}.`),
        opt(`cathode: ${name}; anode: ${obj.split(' ').slice(1).join(' ')}; electrolyte: ${sol}`, false, 'The object would be the anode and would be oxidised.'),
        opt(`cathode: ${obj.split(' ').slice(1).join(' ')}; anode: ${name}; electrolyte: NaNO₃(aq)`, false, `The electrolyte must contain ${ion} ions; Na⁺ is never reduced in water.`),
        opt(`cathode: ${obj.split(' ').slice(1).join(' ')}; anode: graphite; electrolyte: water`, false, `There are no ${ion} ions to deposit.`)]),
      hints: [`${name[0].toUpperCase() + name.slice(1)} must be deposited on the object: that is a reduction.`, 'Reduction happens at the cathode, joined to the negative terminal.'], sol: [`Object = cathode: ${halfR}. Anode = ${name}; electrolyte = ${sol}.`] };
    return { section: '29.4', stars: 2, type: 'mcq', prompt: `${obj[0].toUpperCase() + obj.slice(1)} is electroplated with ${name} in ${sol}, with a ${name} anode. Which half-reaction takes place on the object?`,
      options: shuffle([opt(halfR, true, `The object is the cathode: ${ion} is reduced there.`), opt(row ? EC.oxidationHalf(row).text : `${M} → ${ion} + e⁻`, false, 'That is the oxidation at the anode.'),
        opt('2H₂O + 2e⁻ → H₂ + 2OH⁻', false, `${ion} (${row ? EC.ev(row.E) + ' V' : ''}) is a stronger oxidising agent than H₂O (−0,83 V), so ${ion} is reduced.`), opt('2H₂O → O₂ + 4H⁺ + 4e⁻', false, 'That is an oxidation, and it would happen at an inert anode.')]),
      hints: ['The object is the cathode.', `Compare ${ion} with H₂O as oxidising agents.`], sol: [`On the object (cathode): ${halfR}`] };
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
  // o.state lets a view keep a question's answers across visits (Check keeps the last set until "New set")
  let qCount = 0;
  function renderQ(el, q, o) {
    const uid = 'q' + (++qCount);
    o = o || {};
    const mode = o.mode || 'supported'; // supported | independent | check
    const stepped = mode === 'check' && q.steps && q.steps.length;
    const st = o.state || { pick: null, val: '', vals: [], shown: 0, done: false, ok: null, solShown: false, conf: null, warn: null };
    if (!st.vals) st.vals = [];
    const box = h('div', { class: 'qcard' });
    el.appendChild(box);
    const redraw = () => S.keepFocus(box, draw);
    function judgeSteps() {
      const vals = q.steps.map((s, i) => readNum(st.vals[i]));
      const res = q.steps.map((s, i) => {
        const v = vals[i];
        if (isNaN(v)) return { ok: false, blank: true };
        if (close(v, s.ans, s.tol)) return { ok: true };
        const c = s.cf ? s.cf(vals) : undefined;
        if (isN(c) && close(v, c, s.signed ? Math.max(s.tol, Math.abs(c) * 0.01) : Math.max(0.0001, Math.abs(c) * 0.02))) return { ok: true, cf: true };
        return { ok: false };
      });
      const got = res.filter(r => r.ok).length;
      return { ok: got === q.steps.length, got, of: q.steps.length, res, blank: res.every(r => r.blank) };
    }
    function judge() {
      if (stepped) return judgeSteps();
      if (q.type === 'mcq') { const opt = q.options[st.pick]; return { ok: !!(opt && opt.ok), why: opt && opt.why, blank: st.pick === null, got: opt && opt.ok ? 1 : 0, of: 1 }; }
      const v = readNum(st.val);
      if (isNaN(v)) return { ok: false, why: 'Type a number (a decimal comma is fine).', blank: true, got: 0, of: 1 };
      const unitTyped = (String(st.val).trim().match(/[a-zA-Zμ]+$/) || [''])[0];
      if (q.unit === 'V' && unitTyped && !/^v$/i.test(unitTyped)) return { ok: false, why: unitTyped + ' is not the unit of Eθcell: write V (volt).', got: 0, of: 1 };
      const ok = close(v, q.ans, q.tol || 0.011);
      let why = ok ? 'Correct.' : null;
      if (!ok) (q.traps || []).forEach(([t, w]) => { if (!why && t !== undefined && close(v, t, q.tol || 0.011)) why = w; });
      if (!ok && !why) why = q.signed && close(Math.abs(v), Math.abs(q.ans), q.tol || 0.011) ? 'Check the sign.' : 'Not yet.';
      return { ok, why, got: ok ? 1 : 0, of: 1 };
    }
    const revealed = () => st.done && (mode !== 'check' || o.reveal);
    function draw() {
      clear(box);
      const sec = sectionOf(q);
      add(box, [h('div', { class: 'ieb-tags' }, sec ? h('span', { class: 'tag tag-paper' }, sec.id + ' · ' + sec.short.charAt(0).toUpperCase() + sec.short.slice(1)) : null,
        stepped ? h('span', { class: 'tag score-only' }, q.steps.length + ' marks') : null, h('span', { class: 'tag tag-star', 'aria-label': (q.stars || 1) + ' star' + ((q.stars || 1) > 1 ? 's' : '') }, '★'.repeat(q.stars || 1))),
        h('p', { class: 'prompt' }, q.prompt)]);
      if (q.type === 'mcq') {
        box.appendChild(h('div', { class: 'choices' }, q.options.map((op, i) => {
          let cls = 'choice', mark = null;
          if (revealed()) {
            if (op.ok) { cls += ' right'; mark = h('span', { class: 'mark' }, i === st.pick ? ' ✓ your answer, right' : ' ✓ right answer'); }
            else if (i === st.pick) { cls += ' wrongc'; mark = h('span', { class: 'mark' }, ' ✗ your answer'); }
          }
          return h('button', { class: cls, type: 'button', 'aria-pressed': String(st.pick === i), disabled: st.done, onclick: () => { st.pick = i; if (mode === 'check') o.onChange && o.onChange(api); redraw(); } }, h('span', { class: 'ieb-letter', 'aria-hidden': 'true' }, 'ABCDEF'[i]), chem(op.t), mark);
        })));
      } else if (stepped) {
        const j = revealed() ? judgeSteps() : null;
        box.appendChild(h('p', { class: 'small muted' }, 'Show your working: one box per step, as the memo marks it.'));
        box.appendChild(h('div', { class: 'stepmarks' }, q.steps.map((s, i) => {
          const r = j && j.res[i];
          return h('div', { class: 'stepmark' + (r ? (r.ok ? ' ok' : ' no') : '') },
            h('label', { class: 'f', for: 'sm-' + uid + '-' + i }, chem(s.lab)),
            h('div', { class: 'answer-row' }, h('input', { id: 'sm-' + uid + '-' + i, type: 'text', inputmode: s.signed ? 'text' : 'decimal', value: st.vals[i] || '', disabled: st.done, oninput: e => { st.vals[i] = e.target.value; o.onChange && o.onChange(api); } }), h('span', null, s.unit || '')),
            r ? h('div', { class: 'small' }, r.ok ? (r.cf ? '✓ follows from your earlier step' : '✓') : '✗ ' + (r.blank ? 'not answered. ' : '') + 'Memo: ' + (s.unit === 'mol' ? EC.numSig(s.ans, 4) : EC.num(s.ans, 2)) + ' ' + (s.unit || '') + '. ' + (s.tip || '')) : null);
        })));
      } else {
        // the iPhone decimal keypad has no minus key, so a question whose answer can be negative gets the full keyboard
        const inp = h('input', { type: 'text', inputmode: q.signed ? 'text' : 'decimal', value: st.val, disabled: st.done, 'aria-label': 'Your answer', oninput: e => { st.val = e.target.value; if (mode === 'check') o.onChange && o.onChange(api); }, onkeydown: e => { if (e.key === 'Enter' && mode !== 'check') submit(); } });
        box.appendChild(h('div', { class: 'answer-row' }, inp, h('span', null, q.unit || '')));
        if (st.warn && !st.done) box.appendChild(notice('', st.warn));
      }
      if (mode === 'check') {
        box.appendChild(h('div', { class: 'conf', style: { marginTop: '10px' } }, h('span', { class: 'small muted' }, 'Circle one:'), ['C', 'U'].map(c => h('button', { type: 'button', 'aria-pressed': String(st.conf === c), disabled: st.done, 'aria-label': c === 'C' ? 'C: confident' : 'U: unsure', title: c === 'C' ? 'confident' : 'unsure', onclick: () => { st.conf = c; redraw(); } }, c)), h('span', { class: 'small muted' }, 'C = confident · U = unsure')));
      }
      if (mode !== 'check' && !st.done) box.appendChild(h('div', { class: 'row', style: { marginTop: '10px' } }, h('button', { class: 'btn', type: 'button', onclick: submit }, 'Check my answer'),
        mode === 'supported' && st.shown < (q.hints || []).length ? h('button', { class: 'btn ghost', type: 'button', onclick: () => { st.shown++; redraw(); } }, st.shown ? 'Next hint' : 'I need a hint') : null,
        mode === 'independent' ? h('span', { class: 'small muted' }, 'On your own: hints unlock after you check.') : null));
      (q.hints || []).slice(0, st.shown).forEach((t, i) => box.appendChild(h('div', { class: 'hint' }, h('b', null, 'Hint ' + (i + 1) + ': '), chem(t))));
      if (revealed()) feedback();
    }
    function feedback() {
      const j = judge();
      let msg;
      if (stepped) msg = `${j.got} of ${j.of} steps right.` + (j.ok ? '' : ' Each ✗ step says what the memo wanted.');
      else if (mode === 'check' && j.blank) msg = 'Not answered.';
      else msg = j.ok ? (q.type === 'mcq' ? 'Correct. ' + (j.why || '') : 'Correct: ' + EC.num(q.ans, 2) + ' ' + (q.unit || '') + '.') : (j.why || 'Not yet.');
      box.appendChild(h('div', { class: 'notice ' + (j.ok ? 'ok' : 'no') + (stepped ? ' score-only' : '') }, chem(msg)));
      if (!j.ok || st.solShown) box.appendChild(h('div', { class: 'sol' }, h('b', null, 'Worked solution'), (q.sol || []).map(l => h('div', { class: 'ln' }, chem(l)))));
      else box.appendChild(h('button', { class: 'btn ghost small', type: 'button', onclick: () => { st.solShown = true; redraw(); } }, 'Show the worked solution'));
      const sec = sectionOf(q);
      if (!j.ok && sec) box.appendChild(h('div', { class: 'redo' }, h('b', null, 'Wrong? '), 'Reread ', h('a', { href: '#section/' + sec.id }, sec.reread), ', then redo ',
        o.onNext ? h('button', { class: 'linkbtn', type: 'button', onclick: o.onNext }, 'a fresh question') : h('a', { href: '#practise?s=' + sec.id }, 'a fresh question in Practise'), '.'));
      if (mode === 'independent' && (q.hints || []).length && st.shown < q.hints.length) box.appendChild(h('button', { class: 'btn ghost small', type: 'button', onclick: () => { st.shown = q.hints.length; redraw(); } }, 'Show the hints'));
      return msg;
    }
    function submit() {
      if (q.type === 'mcq' && st.pick === null) return;
      const j = judge();
      // a blank or unreadable number is not an answer: ask again, without locking, logging or showing the solution
      if (j.blank) { st.warn = j.why; draw(); const i = box.querySelector('input'); if (i) i.focus(); S.say(j.why); return; }
      st.warn = null; st.done = true; st.ok = j.ok;
      if (o.log !== false) logAttempt({ kind: mode === 'independent' ? (o.delayed ? 'delayed' : 'independent') : 'supported', section: q.section, id: q.gen || 'q', correct: j.ok ? 1 : 0, total: 1 });
      o.onAnswer && o.onAnswer(j.ok);
      draw();
      const n = box.querySelector('.notice'); if (n) { n.tabIndex = -1; n.focus({ preventScroll: true }); S.say(n.textContent); }
    }
    const api = {
      answered: () => stepped ? q.steps.some((s, i) => !isNaN(readNum(st.vals[i]))) : q.type === 'mcq' ? st.pick !== null : !isNaN(readNum(st.val)),
      finish: () => { const j = judge(); st.done = true; st.ok = j.ok; o.reveal = true; draw(); return { ok: j.ok, conf: st.conf, got: j.got, of: j.of }; },
      marks: () => stepped ? q.steps.length : 1,
      q, st
    };
    if (st.done && mode === 'check') o.reveal = true;
    draw();
    return api;
  }
  S.renderQ = renderQ;

  /* ---------- Practise ---------- */
  const MIX = { mix27: '27', mix28: '28', mix29: '29', mixall: 'all' };
  S.views.practise = function (el, arg, params) {
    const okSec = s => S.sectionById(s) || MIX[s];
    let section = params.s && okSec(params.s) ? params.s : '27.1';
    let stars = ['1', '2', '3'].includes(params.lvl) ? +params.lvl : 0;
    let streak = 0, n = 0, right = 0;
    const head = h('div'), area = h('div'), score = h('p', { class: 'session-score score-only small muted', role: 'status' });
    add(el, [h('div', { class: 'head' }, h('div', null, h('h2', null, 'Practise'), h('p', null, 'Fresh questions every time, with hints in steps and a worked solution. Choose a section or a mixed module, and a level if you like.'))), head, score, area]);
    const secSel = select([['mix27', 'Mixed: Module 27'], ['mix28', 'Mixed: Module 28'], ['mix29', 'Mixed: Module 29'], ['mixall', 'Mixed: all three']].concat(S.SECTIONS.map(s => [s.id, s.id + ' ' + s.title])), section, v => { section = v; S.setParams({ s: v }); links(); next(); }, { 'aria-label': 'Section' });
    const lvlSel = select([['0', 'All levels'], ['1', '★ only'], ['2', '★★ only'], ['3', '★★★ only']], String(stars), v => { stars = +v; S.setParams({ lvl: stars || null }); next(); }, { 'aria-label': 'Level' });
    const linkBox = h('span', { class: 'row' });
    add(head, [h('label', { class: 'f' }, 'Section and level'), h('div', { class: 'filters pfilters' }, secSel, lvlSel, linkBox)]);
    function links() {
      clear(linkBox);
      const mod = MIX[section] ? (MIX[section] === 'all' ? '' : MIX[section]) : section.slice(0, 2);
      add(linkBox, [/^\d/.test(section) ? h('a', { class: 'btn ghost small', href: '#section/' + section }, 'Learning route') : null,
        h('a', { class: 'btn ghost small', href: '#ieb' + (mod ? '?m=' + mod : '') }, 'IEB questions')]);
    }
    function pool() { const m = MIX[section]; return m ? S.SECTIONS.filter(s => m === 'all' || String(s.mod) === m) : [S.sectionById(section)]; }
    function next() {
      clear(area);
      let q = null;
      for (let k = 0; k < 60; k++) { const c = makeQ(pick(pool()).id); if (!stars || c.stars === stars) { q = c; break; } }
      if (!q) { area.appendChild(notice('', `There are no ${'★'.repeat(stars)} questions in this choice yet. Choose another level, or All levels.`)); return; }
      renderQ(area, q, { mode: 'supported', onNext: next, onAnswer: ok => { n++; if (ok) { right++; streak++; } else streak = 0; score.textContent = `This session: ${right} of ${n} right${streak > 2 ? ' · ' + streak + ' in a row' : ''}.`; } });
      area.appendChild(h('div', { class: 'row', style: { marginTop: '12px' } }, h('button', { class: 'btn', type: 'button', onclick: () => { next(); const b = area.querySelector('.choice, input'); if (b) b.focus({ preventScroll: true }); } }, 'Next question')));
    }
    links(); next();
  };

  /* ---------- IEB questions ---------- */
  // search the way a learner types: l for ℓ, plain digits for sub- and superscripts, - for −, no θ
  const SUPS = { '⁰': '0', '¹': '1', '²': '2', '³': '3', '⁴': '4', '⁵': '5', '⁶': '6', '⁷': '7', '⁸': '8', '⁹': '9', '⁺': '+', '⁻': '-' };
  const norm = s => String(s).toLowerCase().replace(/ℓ/g, 'l').replace(/[₀-₉]/g, c => String(c.charCodeAt(0) - 0x2080)).replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹⁺⁻]/g, c => SUPS[c]).replace(/[−–]/g, '-').replace(/θ/g, '').replace(/\s+/g, ' ').trim();
  S.normSearch = norm;
  /* An IEB question as calm parts: the set-up (our words for the paper's diagrams), the question in the IEB's own words
     (without the quote marks), numbered sub-questions with their marks, and the options A to D as separate cards. */
  const curly = s => s.replace(/"([^"]*)"/g, '“$1”').replace(/(\w)'(\w)/g, '$1’$2');
  function iebParts(x) {
    let s = x.question.trim(), opts = null;
    // options at the end: one per line (A …\nB …), or inline (A …; B …; C …; D …)
    const lines = s.split('\n');
    const at = lines.findIndex(l => /^A /.test(l));
    if (at > 0 && lines.slice(at, at + 4).map(l => l[0]).join('') === 'ABCD' && lines.length === at + 4) {
      opts = lines.slice(at).map(l => l.slice(2).trim()); s = lines.slice(0, at).join('\n').trim();
    } else {
      const b = s.lastIndexOf('; B '), a = b > 0 ? s.lastIndexOf(' A ', b) : -1;
      if (a > 0 && /; C .*; D /.test(s.slice(b))) {
        const m = s.slice(a + 1).match(/^A (.+?); B (.+?); C (.+?); D (.+?)\.?$/);
        if (m) { opts = m.slice(1, 5); s = s.slice(0, a).trim(); }
      }
    }
    if (opts) opts = opts.map(o => o.replace(/^"(.*)"\.?$/, '$1'));
    // numbered sub-questions (6.1.1 …), on their own lines or run together
    const subRe = /(?:^|\s)(\d{1,2}\.\d{1,2}(?:\.\d{1,2})?)\s(?=[A-Z"])/g;
    const cuts = []; let m;
    while ((m = subRe.exec(s))) cuts.push({ i: m.index + (m[0].length - m[1].length - 1), n: m[1] });
    let lead = s, subs = [];
    if (cuts.length) {
      lead = s.slice(0, cuts[0].i).trim();
      subs = cuts.map((c, k) => { let t = s.slice(c.i + c.n.length, k + 1 < cuts.length ? cuts[k + 1].i : s.length).trim(), mk = null;
        const mm = t.match(/\s*\((\d+)\)\s*$/); if (mm) { mk = +mm[1]; t = t.slice(0, mm.index).trim(); }
        return { n: c.n, t, marks: mk }; });
    }
    // the lead: words outside quote marks are the set-up, quoted words are the question
    const asks = [], setup = [];
    let rest = lead.replace(/"([^"]+)"\s*(?:\((\d+)\))?/g, (all, q, mk) => { asks.push({ t: q.trim(), marks: mk ? +mk : null }); return '\u0000'; });
    rest.split('\u0000').map(t => t.trim()).filter(Boolean).forEach(t => setup.push(t));
    if (!asks.length && !subs.length && setup.length) asks.push({ t: setup.pop(), marks: null });
    const unq = t => t.replace(/^"(.*)"$/, '$1').replace(/"/g, '');
    subs.forEach(sb => { sb.t = unq(sb.t); });
    return { setup: [x.stem, ...setup].filter(Boolean), asks, subs, opts };
  }
  S.iebParts = iebParts;
  S.views.ieb = function (el, arg, params) {
    const items = window.IEB || [];
    // 2021 Q7.6 was split into two cards (7.6.1 to 7.6.2, and 7.6.3): an old self-mark cannot be shared out, so ask for it again
    const old = store.get('ieb', {}), split = old['2021-Q7.6.1to7.6.3'] !== undefined && old['2021-Q7.6.1to7.6.2'] === undefined && old['2021-Q7.6.3'] === undefined;
    if (split) { delete old['2021-Q7.6.1to7.6.3']; store.set('ieb', old); }
    const years = Array.from(new Set(items.map(x => x.year)));
    let mod = ['27', '28', '29'].includes(params.m) ? params.m : 'all', year = years.includes(params.y) ? params.y : 'all', text = '';
    const list = h('div'), filt = h('div', { class: 'filters' });
    add(el, [h('div', { class: 'head' }, h('div', null, h('h2', null, 'IEB questions'), h('p', null, `${items.length} questions from IEB NSC Paper 2 (2020 to May 2026) on Modules 27 to 29. Answer on paper first, then open the memo and mark yourself. The question is in the IEB’s own words; the set-up describes the paper’s diagrams in words.`))),
      h('p', { class: 'small muted' }, 'Reproduced with acknowledgement to the IEB: see ', h('a', { href: '#about' }, 'About'), '. May 2026 answers are ours: there is no official memo yet.'),
      h('div', { class: 'callout warm' }, h('h4', null, 'Exam technique'), 'Tick each question number when you finish it. Always choose an option on a multiple-choice or circle-the-answer item. Answer briefly: long answers often contradict themselves.'),
      split ? notice('warn', '2021 Question 7.6 is now two cards (7.6.1 to 7.6.2, and 7.6.3), so its old mark was cleared. Please mark them again.') : null,
      filt, list]);
    add(filt, [select([['all', 'All modules'], ['27', 'Module 27'], ['28', 'Module 28'], ['29', 'Module 29']], mod, v => { mod = v; S.setParams({ m: v === 'all' ? null : v }); draw(); }, { 'aria-label': 'Module' }),
      select([['all', 'All years']].concat(years.map(y => [y, y])), year, v => { year = v; S.setParams({ y: v === 'all' ? null : v }); draw(); }, { 'aria-label': 'Year' }),
      h('input', { type: 'search', placeholder: 'Search, e.g. salt bridge', value: text, 'aria-label': 'Search the questions', oninput: e => { text = norm(e.target.value); draw(); } })]);
    function card(x) {
      const c = h('div', { class: 'qcard ieb-card', style: { '--mc': (S.MODS[x.module] || {}).colour || 'var(--acc)' } });
      const P = iebParts(x), key = x.mcq ? (x.memo.match(/^([A-D])\b/) || [])[1] : null;
      let open = false, pick = null;
      function d() {
        const marks = store.get('ieb', {}); // read on every redraw: before the first mark is saved, store.get returns a new {} each time
        clear(c);
        const paper = x.paper.replace(/^IEB NSC /, 'IEB ').replace(' Paper 2', ''), qn = x.q.replace(/^Question /, 'Q');
        add(c, [h('div', { class: 'ieb-tags' }, h('span', { class: 'tag tag-paper' }, paper + ' · ' + qn), h('span', { class: 'tag tag-mod' }, 'Module ' + x.module),
            h('span', { class: 'tag' }, x.marks + ' mark' + (x.marks > 1 ? 's' : '')), marks[x.id] !== undefined ? h('span', { class: 'tag tag-score score-only' }, 'You: ' + marks[x.id] + '/' + x.marks) : null),
          P.setup.length ? h('div', { class: 'ieb-setup' }, h('span', { class: 'ieb-label' }, 'Set-up'), P.setup.map(t => h('p', null, curly(t)))) : null,
          P.asks.map(a => h('p', { class: 'ieb-ask' }, a.t, a.marks ? h('span', { class: 'tag tag-mk' }, '(' + a.marks + ')') : null)),
          P.subs.length ? h('ol', { class: 'ieb-subs' }, P.subs.map(sb => h('li', null, h('span', { class: 'ieb-n' }, sb.n), h('span', { class: 'ieb-st' }, sb.t), sb.marks ? h('span', { class: 'tag tag-mk' }, '(' + sb.marks + ')') : null))) : null,
          P.opts ? h('div', { class: 'ieb-opts' + (Math.max(...P.opts.map(o => o.length)) > 34 ? ' long' : ''), role: 'group', 'aria-label': 'Options' }, P.opts.map((o, i) => { const L = 'ABCD'[i];
            const cls = 'ieb-opt' + (open && key ? (L === key ? ' right' : pick === L ? ' wrongc' : '') : '');
            return h('button', { type: 'button', class: cls, 'aria-pressed': String(pick === L), onclick: () => { if (open) return; pick = pick === L ? null : L; S.keepFocus(c, d); } },
              h('span', { class: 'ieb-letter', 'aria-hidden': 'true' }, L), h('span', { class: 'sr' }, 'Option ' + L + ': '), h('span', null, curly(o))); })) : null,
          !open ? h('button', { class: 'btn ghost small ieb-show', type: 'button', onclick: () => { open = true; S.keepFocus(c, d); const s = c.querySelector('.sol'); if (s) { s.tabIndex = -1; s.focus({ preventScroll: true }); } } }, 'I have answered: show the memo') :
            h('div', null, h('div', { class: 'sol' }, h('b', null, x.noMemo ? 'Our answer (no official memo)' : 'Memo'), h('div', { class: 'ln', style: { whiteSpace: 'pre-line' } }, curly(x.memo).replace(/(?:;|\.)\s+(?=\d+\.\d+(?:\.\d+)?:)/g, m => (m[0] === '.' ? '.' : '') + '\n')), key && pick ? h('p', { class: 'small', style: { margin: '6px 0 0' } }, pick === key ? 'You chose ' + pick + ': right.' : 'You chose ' + pick + '. The answer is ' + key + '.') : null),
              x.report ? h('div', { class: 'callout ex' }, h('h4', null, 'Examiners’ report ' + x.year), curly(x.report)) : null,
              h('div', { class: 'row score-only', style: { marginTop: '8px' } }, h('span', { class: 'small' }, 'Mark yourself:'),
                Array.from({ length: x.marks + 1 }, (_, i) => h('button', { type: 'button', class: 'btn small ' + (marks[x.id] === i ? 'on' : 'ghost'), 'aria-pressed': String(marks[x.id] === i), onclick: () => {
                  store.fresh();
                  const m = store.get('ieb', {}), changed = m[x.id] !== i; m[x.id] = i; store.set('ieb', m);
                  if (changed) logAttempt({ kind: 'supported', section: 'IEB-' + x.module, id: x.id, correct: i, total: x.marks });
                  S.keepFocus(c, d); S.say('Marked ' + i + ' out of ' + x.marks + '.');
                } }, i + '/' + x.marks))))]);
      }
      d();
      return c;
    }
    function draw() { // rebuilds the list only: the filter row is built once, so the search box and the selects keep focus
      clear(list);
      const show = items.filter(x => (mod === 'all' || String(x.module) === mod) && (year === 'all' || x.year === year) && (!text || norm((x.stem || '') + ' ' + x.question + ' ' + x.memo).includes(text)));
      list.appendChild(h('p', { class: 'small muted', role: 'status' }, show.length + ' question' + (show.length === 1 ? '' : 's')));
      show.forEach(x => list.appendChild(card(x)));
    }
    draw();
  };

  /* ---------- Check ---------- */
  // the last set (answers, marks and summary) survives moving around the studio, so a learner can follow every reread link
  S.lastCheck = null;
  S.views.check = function (el, arg, params) {
    let scope = ['27', '28', '29'].includes(params.m) ? params.m : (S.lastCheck ? S.lastCheck.scope : 'all');
    let apis = [];
    const body = h('div');
    add(el, [h('div', { class: 'head' }, h('div', null, h('h2', null, 'Check yourself'), h('p', null, 'Eight fresh questions, mixed. No hints and no feedback until you submit. Calculations are marked per step, as the memo ticks them. Circle C (confident) or U (unsure) for each: it tells you which marks were luck.'))),
      h('div', { class: 'callout warm no-present' }, h('h4', null, 'Exam technique'), 'Answer every question: a blank earns nothing. Show each step of a calculation. Answer briefly.'), body]);
    function fresh() {
      const pool = S.SECTIONS.filter(s => scope === 'all' || String(s.mod) === scope);
      const picks = shuffle(pool).slice(0, 8);
      while (picks.length < 8) picks.push(pick(pool));
      S.lastCheck = { scope, qs: picks.map(s => makeQ(s.id)), states: picks.map(() => null), submitted: false };
      build();
    }
    function build() {
      const L = S.lastCheck;
      clear(body); apis = [];
      add(body, [h('div', { class: 'row' }, seg([['all', 'All three modules'], ['27', 'Module 27'], ['28', 'Module 28'], ['29', 'Module 29']], scope, v => { scope = v; S.setParams({ m: v === 'all' ? null : v }); fresh(); S.focusTo(body.querySelector('[aria-pressed="true"]')); S.say('A new set of 8 questions.'); }))]);
      L.qs.forEach((q, i) => {
        const w = h('div'); w.appendChild(h('h3', { style: { marginTop: '18px' } }, 'Question ' + (i + 1))); body.appendChild(w);
        const api = renderQ(w, q, { mode: 'check', log: false, state: L.states[i] || undefined });
        L.states[i] = api.st; apis.push(api);
      });
      body.appendChild(h('div', { class: 'row', style: { marginTop: '14px' } }, L.submitted ? null : h('button', { class: 'btn', type: 'button', onclick: submit }, 'Submit and mark'), h('button', { class: 'btn ghost', type: 'button', onclick: fresh }, 'New set')));
      if (L.submitted) summary(false);
    }
    function submit() {
      const L = S.lastCheck;
      if (L.submitted) return;
      const blank = apis.filter(a => !a.answered()).length;
      if (blank && !confirm(`${blank} question${blank > 1 ? 's are' : ' is'} blank or not a number. Submit anyway?`)) return;
      L.submitted = true;
      summary(true);
      const b = body.querySelector('button.btn:not(.ghost)'); if (b && /Submit/.test(b.textContent)) b.remove();
    }
    function summary(log) {
      const L = S.lastCheck;
      const res = apis.map(a => a.finish());
      const bySec = {};
      res.forEach((r, i) => { const s = L.qs[i].section; bySec[s] = bySec[s] || { c: 0, t: 0 }; bySec[s].t += r.of; bySec[s].c += r.got; });
      if (log) Object.keys(bySec).forEach(s => logAttempt({ kind: 'independent', section: s, id: 'check', correct: bySec[s].c, total: bySec[s].t }));
      const got = res.reduce((a, r) => a + r.got, 0), of = res.reduce((a, r) => a + r.of, 0);
      const lucky = res.filter(r => r.ok && r.conf === 'U').length, sure = res.filter(r => !r.ok && r.conf === 'C').length;
      const secs = f => [...new Set(res.flatMap((r, i) => f(r) ? [L.qs[i].section] : []))];
      const secLinks = list => list.map((s, i) => [i ? ', ' : '', h('a', { href: '#section/' + s }, s)]);
      const weak = Object.keys(bySec).filter(s => bySec[s].c < bySec[s].t);
      const old = body.querySelector('.check-sum'); if (old) old.remove();
      const sum = h('div', { class: 'card check-sum', style: { marginTop: '14px' }, tabindex: '-1' }, h('h3', { class: 'score-only' }, `You scored ${got} out of ${of} marks`),
        h('p', { class: 'small muted score-only' }, res.map((r, i) => `Q${i + 1}: ${r.got}/${r.of}`).join(' · ')),
        lucky ? h('p', { class: 'score-only' }, `${lucky} right answer${lucky > 1 ? 's were' : ' was'} marked U: practise `, secLinks(secs(r => r.ok && r.conf === 'U')), ' again.') : null,
        sure ? h('p', { class: 'score-only' }, `${sure} wrong answer${sure > 1 ? 's were' : ' was'} marked C: a misconception. Reread the trap box in `, secLinks(secs(r => !r.ok && r.conf === 'C')), '.') : null,
        weak.length ? h('div', null, h('p', null, 'Wrong? Reread, then redo:'), h('ul', null, weak.map(s => { const sec = S.sectionById(s); return h('li', null, h('a', { href: '#section/' + s }, s + ' ' + sec.title), ' · ', h('a', { href: '#practise?s=' + s }, 'practise')); }))) : h('p', null, 'All correct. These sections will come back in Return later.'),
        h('p', { class: 'small muted' }, 'Each section you tried is scheduled in Return later (after 1, 3, 7 and 21 days). Use the browser’s Back button to come back to this set.'));
      body.insertBefore(sum, body.children[1]);
      if (log) { window.scrollTo(0, 0); sum.focus({ preventScroll: true }); S.say(`You scored ${got} out of ${of} marks.`); }
    }
    if (S.lastCheck && (S.lastCheck.scope === scope)) build(); else fresh();
  };

  /* ---------- Return later ---------- */
  S.views.review = function (el) {
    const body = h('div');
    add(el, [h('div', { class: 'head' }, h('div', null, h('h2', null, 'Return later'), h('p', null, 'Sections come back after 1, 3, 7 and 21 days. A right answer when a section is due pushes it further out; a wrong one brings it back tomorrow.'))), body]);
    function draw() {
      store.fresh();
      clear(body);
      const rv = store.get('reviews', {}), dueNow = S.dueReviews().filter(k => S.sectionById(k));
      const upcoming = Object.keys(rv).filter(k => !dueNow.includes(k) && S.sectionById(k)).sort((a, b) => rv[a].due - rv[b].due);
      add(body, [h('div', { class: 'grid g2' },
        h('div', { class: 'card' }, h('h3', null, dueNow.length ? `${dueNow.length} section${dueNow.length > 1 ? 's' : ''} due now` : 'Nothing due right now'),
          dueNow.length ? h('div', null, h('ul', null, dueNow.map(s => h('li', null, s + ' ' + S.sectionById(s).title))), h('button', { class: 'btn', type: 'button', onclick: () => run(dueNow) }, 'Start the review')) : h('p', { class: 'muted' }, 'Finish an “On your own” question or a Check, and the section is scheduled here.'),
          upcoming.length ? h('div', { class: 'score-only' }, h('h4', null, 'Coming up'), h('ul', { class: 'small' }, upcoming.map(s => h('li', null, `${s} ${S.sectionById(s).short}: ${new Date(rv[s].due).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' })}`)))) : null),
        h('div', { class: 'card' }, h('h3', null, 'Definitions: flip cards'), h('p', { class: 'small muted' }, 'Say the SAGS wording out loud, then flip.'), flip())),
        h('div', { class: 'card score-only', style: { marginTop: '14px' } }, h('h3', null, 'Your learning record'), record(rv))]);
    }
    function run(list) {
      clear(body);
      let i = 0;
      const area = h('div');
      body.appendChild(area);
      function nextOne() {
        clear(area);
        if (i >= list.length) { const n = notice('ok', 'Review done. Each section has been rescheduled.'); area.appendChild(n); area.appendChild(h('button', { class: 'btn', type: 'button', onclick: () => { draw(); S.focusTo(body.querySelector('h3')); } }, 'Back to Return later')); S.focusTo(n); return; }
        const s = list[i];
        const head = h('p', { class: 'muted' }, `Review ${i + 1} of ${list.length}: ${s} ${S.sectionById(s).title}`);
        area.appendChild(head); S.focusTo(head);
        renderQ(area, makeQ(s), { mode: 'independent', delayed: true, onAnswer: () => { area.appendChild(h('button', { class: 'btn', type: 'button', style: { marginTop: '10px' }, onclick: () => { i++; nextOne(); } }, i + 1 < list.length ? 'Next section' : 'Finish')); } });
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
        add(w, [h('button', { class: 'flip', type: 'button', 'aria-expanded': String(open), onclick: () => { open = !open; S.keepFocus(w, d); if (open) S.say(x.def); } }, h('b', null, x.term), open ? h('span', null, x.def) : h('span', { class: 'muted' }, 'Tap to flip'), h('small', { class: 'muted' }, 'Section ' + x.section + (x.cls ? ' · class definition (not in SAGS)' : ''))),
          h('div', { class: 'row', style: { marginTop: '8px' } }, h('button', { class: 'btn ghost small', type: 'button', onclick: () => { k = (k + defs.length - 1) % defs.length; open = false; S.keepFocus(w, d); } }, '← Previous'), h('span', { class: 'small muted' }, `${k + 1} of ${defs.length}`), h('button', { class: 'btn ghost small', type: 'button', onclick: () => { k = (k + 1) % defs.length; open = false; S.keepFocus(w, d); } }, 'Next →'))]);
      }
      d();
      return w;
    }
    function record(rv) {
      const by = S.tallies();
      const ks = Object.keys(by).filter(k => S.sectionById(k)).sort((a, b) => S.SECTIONS.indexOf(S.sectionById(a)) - S.SECTIONS.indexOf(S.sectionById(b)));
      const items = window.IEB || [], ieb = store.get('ieb', {});
      const iebIds = Object.keys(ieb).filter(k => items.find(x => x.id === k));
      const iebGot = iebIds.reduce((a, k) => a + ieb[k], 0), iebOf = iebIds.reduce((a, k) => a + items.find(x => x.id === k).marks, 0);
      const frac = p => p && p[1] ? p[0] + '/' + p[1] : '–';
      const date = s => rv[s] ? new Date(rv[s].due).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' }) : '–';
      const w = h('div');
      add(w, [ks.length ? h('div', { style: { overflowX: 'auto' } }, h('table', { class: 'plain record' }, h('thead', null, h('tr', null, h('th', null, 'Section'), h('th', null, 'With help'), h('th', null, 'On your own'), h('th', null, 'After a delay'), h('th', null, 'Next review'))),
        h('tbody', null, ks.map(s => h('tr', null, h('td', null, s + ' ' + S.sectionById(s).short), h('td', null, frac(by[s].sup)), h('td', null, frac(by[s].ind)), h('td', null, frac(by[s].del)), h('td', null, date(s))))))) : (iebIds.length ? null : h('p', { class: 'muted' }, 'No attempts yet.')),
        iebIds.length ? h('p', null, `IEB questions: ${iebIds.length} self-marked, ${iebGot}/${iebOf} marks.`) : null,
        h('p', { class: 'small muted' }, '“With help” counts Now you, Practise and the labs. “On your own” counts On your own questions and Check, done without help. “After a delay” counts Return later reviews: what you can still do days later is the best guide to the exam.'),
        h('div', { class: 'row' }, h('button', { class: 'btn ghost small', type: 'button', onclick: download }, 'Download my record'), h('button', { class: 'btn ghost small', type: 'button', onclick: () => { if (confirm('Clear all your progress in this browser?')) { store.reset(); S.lastCheck = null; draw(); } } }, 'Clear my progress'))]);
      function download() {
        const lines = ['Electrochemistry Studio: learning record', 'Downloaded ' + new Date().toLocaleString('en-ZA'), '', 'Section | with help | on your own | after a delay | next review'];
        ks.forEach(s => lines.push([s + ' ' + S.sectionById(s).title, frac(by[s].sup), frac(by[s].ind), frac(by[s].del), rv[s] ? new Date(rv[s].due).toLocaleDateString('en-ZA') : '–'].join(' | ')));
        if (iebIds.length) { lines.push('', `IEB questions self-marked: ${iebGot}/${iebOf} marks`); iebIds.forEach(k => { const x = items.find(i => i.id === k); lines.push(`${x.paper} ${x.q}: ${ieb[k]}/${x.marks}`); }); }
        const a = h('a', { href: URL.createObjectURL(new Blob([lines.join('\n')], { type: 'text/plain' })), download: 'electrochemistry-record.txt' });
        document.body.appendChild(a); a.click(); a.remove();
      }
      return w;
    }
    draw();
  };
})();
