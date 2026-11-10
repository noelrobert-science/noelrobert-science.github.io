/* Mistake museum: real mistakes that the IEB examiners' reports and marking guidelines name, each on the question it was made on.
   The wrong answer is written the way the report describes it; the learner says what is wrong, then sees the memo wording and
   the examiners' own words (quoted exactly, with the source). Progress stays in this browser only. */
(function () {
  'use strict';
  const S = window.STUDIO;
  const { h, add, clear, store } = S;

  // ok: the index of the right diagnosis in why (shown shuffled)
  const EXHIBITS = [
    { mod: 27, title: 'The spectator that was not there', ieb: '2025-Q6.1to6.2', y: '2025',
      task: 'Chlorine gas is bubbled through an aqueous solution of potassium bromide. Write the balanced net ionic equation for the redox reaction that occurs.',
      wrote: 'Cℓ₂ + 2K → 2K⁺ + 2Cℓ⁻',
      why: ['Potassium is a spectator: KBr(aq) holds K⁺ ions, not K atoms. The bromide ions are the reducing agent.', 'Only the balancing is wrong: it needs 4K.', 'Chlorine is the reducing agent here, so it belongs on the right.'],
      fix: 'Cℓ₂ + 2Br⁻ → 2Cℓ⁻ + Br₂',
      quote: 'More than half the candidates chose potassium as the reducing agent, although KBr does not contain any potassium atoms, only potassium ions.', src: 'IEB Examiners’ Report 2025, Question 6.1' },
    { mod: 27, title: 'The arrow copied from Table 4', ieb: '2023-Q6.4', y: '2023',
      task: 'A galvanic cell has an iron half-cell (Fe in Fe³⁺(aq)) and a chlorine half-cell (Cℓ₂(g) bubbled through Cℓ⁻(aq)). Write down the net ionic equation for the reaction that takes place when this cell operates.',
      wrote: '2Fe + 3Cℓ₂ ⇌ 2Fe³⁺ + 6Cℓ⁻',
      why: ['The double arrow: a half-reaction or a redox equation takes a single arrow (→).', 'Iron forms Fe²⁺ here, not Fe³⁺.', 'The chloride ions belong on the left.'],
      fix: '2Fe + 3Cℓ₂ → 2Fe³⁺ + 6Cℓ⁻',
      quote: 'Candidates were penalised for use of a double arrow in 6.4 and a single arrow in 5.2.2(b).', src: 'IEB Examiners’ Report 2023, Paper 2 general comments' },
    { mod: 29, title: 'The wrong kind of agent', ieb: '2024-Q7.5to7.6', y: '2024',
      task: 'Cell Y holds 1 mol·dm⁻³ MgCℓ₂(aq) with graphite electrodes. Oxygen, not chlorine, forms at the anode R. Explain why.',
      wrote: 'H₂O is a stronger oxidising agent than Cℓ⁻, so water is oxidised.',
      why: ['Wrong role: at the anode the contest is between reducing agents. Compare H₂O and Cℓ⁻ as reducing agents.', 'Cℓ⁻ ions are not present in MgCℓ₂(aq).', 'It should say oxygen is more reactive than chlorine.'],
      fix: 'H₂O is a stronger reducing agent than Cℓ⁻, therefore H₂O is oxidised to O₂ at R (under standard conditions).',
      quote: 'NOT ACCEPTING: H2O is a stronger oxidising agent', src: 'IEB NSC 2014 Paper 2 marking guideline, Question 8.3.1 (an anode question)' },
    { mod: 29, title: 'Reducing ability', ieb: '2025-Q7.7to7.8', y: '2025',
      task: 'Blister copper with traces of gold and cobalt is purified electrochemically. Explain why Co²⁺ ions will be found in the CuSO₄ electrolyte but not Au³⁺ ions.',
      wrote: 'Cobalt has a higher reducing ability than gold, so it goes into solution.',
      why: ['“Reducing ability” is unclear. Name the agents, say stronger or weaker, and compare each metal with copper.', 'Cobalt is less reactive than gold, so it dissolves.', 'At the anode, compare the oxidising agents Co²⁺ and Au³⁺.'],
      fix: 'Co is a stronger reducing agent than Cu, so Co is oxidised (to Co²⁺). Au is a weaker reducing agent than Cu, so Au is not oxidised.',
      quote: 'Candidates should avoid the term \'reducing ability\' as it is unclear whether they mean the ability to be reduced or the ability to reduce something else.', src: 'IEB Examiners’ Report 2025, Question 7.7' },
    { mod: 28, title: 'A half-cell is not an electrode', ieb: '2023-Q6.2to6.3', y: '2023',
      task: 'The galvanic cell has an iron half-cell (Fe in Fe³⁺(aq)) and a chlorine half-cell (Cℓ₂(g) bubbled through Cℓ⁻(aq)). Identify the anode in this cell.',
      wrote: 'Fe/Fe³⁺',
      why: ['The anode is an electrode, a solid conductor: name the electrode, not the half-cell or the ion pair.', 'The anode is the chlorine half-cell.', 'It should be written the other way round: Fe³⁺/Fe.'],
      fix: 'Fe (the iron electrode)',
      quote: 'The anode is the solid conductor; Fe/Fe³⁺ was not accepted.', src: 'IEB Examiners’ Report 2023, Question 6.3' },
    { mod: 28, title: 'The missing platinum', ieb: '2025-Q6.3.2', y: '2025',
      task: 'A galvanic cell is set up using the reaction Cℓ₂ + 2Br⁻ → 2Cℓ⁻ + Br₂. Write the cell notation. Assume that both products are in aqueous solution. Conditions and state symbols are not required.',
      wrote: 'Br⁻ | Br₂ || Cℓ₂ | Cℓ⁻',
      why: ['No solid conductor in either half-cell, so each needs an inert Pt electrode on the outside; and Br⁻, Br₂ are in the same phase, so a comma separates them.', 'The anode belongs on the right.', 'It needs the coefficients: 2Br⁻ and 2Cℓ⁻.'],
      fix: 'Pt | Br⁻, Br₂ || Cℓ₂ | Cℓ⁻ | Pt',
      quote: 'Many candidates omitted the two Pt electrodes, needed because the cell does not involve any solid conductor.', src: 'IEB Examiners’ Report 2025, Question 6.3.2' },
    { mod: 28, title: 'Electronvolts', ieb: '2023-Q6.7', y: '2023',
      task: 'Calculate the standard cell potential, Eθcell, for the iron and chlorine cell (Fe³⁺/Fe −0,04 V; Cℓ₂/Cℓ⁻ +1,36 V).',
      wrote: 'Eθcell = 1,36 − (−0,04) = 1,40 eV',
      why: ['The unit: Eθcell is in volts (V), not eV and not the whole column heading.', 'The subtraction is the wrong way round.', 'Eθ of iron should be multiplied by 2 to balance the electrons.'],
      fix: 'Eθcell = Eθcathode − Eθanode = 1,36 − (−0,04) = 1,40 V',
      quote: 'Many candidates wrote the whole thing or "electronvolts" or eV instead of V as the unit for Eθcell.', src: 'IEB Examiners’ Report 2023, Question 6.7' },
    { mod: 28, title: 'Whose pressure?', ieb: '2023-Q6.6', y: '2023',
      task: 'Sam states: “For this cell to be operating at standard conditions, the atmospheric pressure must be 1,01 × 10⁵ Pa.” Correct Sam’s statement.',
      wrote: 'The air pressure must be 1,01 × 10⁵ Pa and the temperature 273 K.',
      why: ['It is the pressure of the gas in the cell (chlorine) that must be standard, and 273 K belongs to STP: standard conditions for cells are 298 K (25 °C).', 'Pressure is measured in mol·dm⁻³.', 'Nothing: Sam was right.'],
      fix: 'The pressure of the (chlorine) gas must be 1,01 × 10⁵ Pa.',
      quote: 'the GAS (chlorine) pressure must be at standard conditions.', src: 'IEB Examiners’ Report 2023, Question 6.6' },
    { mod: 28, title: 'Electrons in the salt bridge', ieb: null, y: '2014', see: ['#section/28.2', 'Learn › 28.2 The salt bridge'],
      task: 'Give two functions of the salt bridge in a galvanic cell.',
      wrote: 'It lets electrons flow from one half-cell to the other, and it maintains neutrality.',
      why: ['Electrons never pass through the salt bridge (only ions move there), and “maintains neutrality” alone is too thin: it completes the circuit and maintains electrical neutrality in the half-cells.', 'Only the order is wrong.', 'The salt bridge stores charge until the cell is used.'],
      fix: 'It completes the circuit. It maintains electrical neutrality in the half-cells (its ions move into the half-cells).',
      quote: 'NOT ACCEPTING: in bullets 2 and 3 ....not accepting "just maintains neutrality"', src: 'IEB NSC 2014 Paper 2 marking guideline, Question 7.9' },
    { mod: 29, title: 'Swapped products', ieb: '2024-Q7.7', y: '2024',
      task: 'Molten MgCℓ₂ is electrolysed at 750 °C with graphite electrodes. T is joined to the positive terminal, U to the negative terminal. Identify the substances that form at T and at U.',
      wrote: 'T: magnesium   U: chlorine',
      why: ['Swapped: T (positive) is the anode, where Cℓ⁻ is oxidised to Cℓ₂; U (negative) is the cathode, where Mg²⁺ is reduced to Mg.', 'Nothing forms: a molten salt does not conduct.', 'U gives hydrogen, because water is reduced.'],
      fix: 'T: Cℓ₂ (chlorine)   U: Mg (magnesium)',
      quote: 'Products were often swopped – candidates should know that the ions are attracted to the oppositely charged electrodes.', src: 'IEB Examiners’ Report 2024, Question 7.7.3' },
    { mod: 29, title: '“It is a liquid”', ieb: '2024-Q7.7', y: '2024',
      task: 'Explain briefly why a much higher temperature (750 °C) is needed for the cell with molten MgCℓ₂.',
      wrote: 'Because the magnesium chloride has to be a liquid.',
      why: ['It only restates the question. Give the bonding reason: MgCℓ₂ is ionic, so it has a high melting point.', 'A high temperature makes the reaction spontaneous.', 'A high temperature raises the emf of the cell.'],
      fix: 'MgCℓ₂ is an ionic compound – it has a high melting point.',
      quote: 'Simply stating \'It is a liquid\' was not awarded any marks – learners had to explain why a high temperature was necessary to keep the magnesium chloride in the molten state.', src: 'IEB Examiners’ Report 2024, Question 7.7.2' },
    { mod: 29, title: 'The forgotten water and ratio', ieb: '2024-Q7.4', y: '2024',
      task: 'The solubility of MgCℓ₂·6H₂O at 25 °C is 55 g per 100 cm³ of solution. Calculate the molar concentration of the chloride ions in the saturated solution.',
      wrote: 'n = 55 ÷ 95,3 = 0,577 mol\nc = 0,577 ÷ 0,1 = 5,77 mol·dm⁻³',
      why: ['Two slips: the molar mass must include the 6H₂O (203,3 g·mol⁻¹), and [Cℓ⁻] is twice the salt concentration because MgCℓ₂ gives 2Cℓ⁻.', 'The volume should be 100 dm³.', 'Only the rounding is wrong.'],
      fix: 'c(MgCℓ₂) = 55 ÷ (203,3 × 0,1) = 2,71 mol·dm⁻³\n[Cℓ⁻] = 2 × 2,71 = 5,42 mol·dm⁻³',
      quote: 'The overwhelming majority of learners did not know what to do with the 6H₂O waters of crystallisation. … Again, many learners did not make use of the ionic ratio to calculate the chloride ion concentration, which is the relevant consideration in this question.', src: 'IEB Examiners’ Report 2024, Question 7.4' },
    { mod: 29, title: 'One electron or two?', ieb: '2025-Q7.10', y: '2025',
      task: '0,2 mol of electrons passes through the electrorefining cell. Calculate the mass of copper deposited on the pure copper electrode.',
      wrote: 'n(Cu) = n(e⁻) = 0,2 mol\nm = 0,2 × 63,5 = 12,7 g',
      why: ['No ratio from the half-reaction: Cu²⁺ + 2e⁻ → Cu, so n(Cu) = n(e⁻) ÷ 2.', 'M(Cu) should be doubled to 127 g·mol⁻¹ for the two electrons.', 'The moles must be changed to coulombs first.'],
      fix: 'Cu²⁺ + 2e⁻ → Cu\nn(Cu) = 0,2 ÷ 2 = 0,1 mol\nm = 0,1 × 63,5 = 6,35 g',
      quote: 'Many candidates are still neglecting to use the ratio in the half-reaction.', src: 'IEB Examiners’ Report 2025, Question 7.10.2' },
    { mod: 29, title: 'Not the SAGS word', ieb: '2025-Q7.4to7.6', y: '2025',
      task: 'Give the correct term for the process of electrochemical purification of a metal.',
      wrote: 'Electrolysis purification',
      why: ['Not the SAGS term: the process is electrorefining.', 'It is electroplating.', 'It is an electrolytic cell.'],
      fix: 'electrorefining',
      quote: 'The SAGs terminology is \'electrorefining\'.', src: 'IEB Examiners’ Report 2025, Question 7.4' },
    { mod: 29, title: 'Refining is not plating', ieb: '2025-Q7.9', y: '2025',
      task: 'Blister copper (with cobalt) is electrorefined in acidified CuSO₄(aq). What happens to the [Cu²⁺] in the electrolyte? Explain.',
      wrote: 'It remains the same: every Cu²⁺ ion reduced at the cathode is replaced by one from the anode.',
      why: ['That is true for electroplating, not refining: cobalt is oxidised at the anode too, so less Cu²⁺ is made than is used up. [Cu²⁺] decreases.', 'It increases, because the anode dissolves.', 'It remains the same, because the cell runs under standard conditions.'],
      fix: 'DECREASE. Only Cu²⁺ is being reduced at the cathode. At the anode, Cu and other impurity atoms (Co) are being oxidised. Therefore, in the same time interval, more Cu²⁺ reacts than is produced.',
      quote: 'Thus, the [Cu²⁺] will decrease over time (unlike in electroplating, where it will remain the same).', src: 'IEB Examiners’ Report 2025, Question 7.9' },
  ];
  S.EXHIBITS = EXHIBITS;

  S.views.museum = function (el, arg, params) {
    let mod = ['27', '28', '29'].includes(params.m) ? params.m : 'all';
    let list = [], k = 0;
    const box = h('div'), score = h('p', { class: 'small muted', role: 'status' });
    add(el, [h('div', { class: 'head' }, h('div', null, h('h2', null, 'Mistake museum'),
        h('p', null, 'Real mistakes from IEB papers. Each one is named in an examiners’ report or a marking guideline. Each wrong answer is written the way the report describes it. Decide what is wrong, then see what earns the marks.'))),
      h('div', { class: 'row', style: { marginBottom: '10px' } }, S.seg([['all', 'All three modules'], ['27', 'Module 27'], ['28', 'Module 28'], ['29', 'Module 29']], mod, v => { mod = v; S.setParams({ m: v === 'all' ? null : v }); pickList(); show(); S.focusTo(box.querySelector('h3')); }), score),
      box]);
    function pickList() { list = EXHIBITS.map((x, i) => Object.assign({ n: i + 1 }, x)).filter(x => mod === 'all' || String(x.mod) === mod); k = 0; }
    function tally() { const got = store.get('museum', {}); const n = list.filter(x => got[x.n]).length; score.textContent = n + ' of ' + list.length + ' spotted first time'; }
    function show() {
      clear(box); tally();
      const x = list[k];
      // the right diagnosis is not always first: a fixed order per exhibit, so a class sees the same letters
      const order = [[0, 1, 2], [1, 0, 2], [2, 0, 1], [1, 2, 0], [0, 2, 1], [2, 1, 0]][x.n % 6];
      let pick = null;
      const card = h('div', { class: 'qcard ieb-card museum', style: { '--mc': (S.MODS[x.mod] || {}).colour } });
      function d() {
        clear(card);
        add(card, [h('div', { class: 'ieb-tags' }, h('span', { class: 'tag tag-paper' }, 'Exhibit ' + x.n), h('span', { class: 'tag tag-mod' }, 'Module ' + x.mod), h('span', { class: 'tag' }, 'IEB ' + x.y)),
          h('h3', { tabindex: '-1' }, x.title),
          h('div', { class: 'ieb-setup' }, h('span', { class: 'ieb-label' }, 'The question'), h('p', null, x.task)),
          h('div', { class: 'script' }, h('span', { class: 'ieb-label' }, 'A typical wrong answer'), h('p', { style: { whiteSpace: 'pre-line' } }, x.wrote)),
          h('p', { class: 'ieb-ask' }, 'What is wrong with it?'),
          h('div', { class: 'choices' }, order.map((j, i) => {
            let cls = 'choice';
            if (pick !== null) { if (j === 0) cls += ' right'; else if (j === pick) cls += ' wrongc'; }
            return h('button', { class: cls, type: 'button', 'aria-pressed': String(pick === j), disabled: pick !== null, onclick: () => {
              pick = j;
              const got = store.get('museum', {}); if (got[x.n] === undefined) { got[x.n] = j === 0; store.set('museum', got); }
              S.keepFocus(card, d); S.say(j === 0 ? 'Right.' : 'Not quite. The right reason is marked.'); const r = card.querySelector('.museum-fix'); if (r) S.focusTo(r);
            } }, h('span', { class: 'ieb-letter', 'aria-hidden': 'true' }, 'ABC'[i]), h('span', null, x.why[j]));
          })),
          pick === null ? null : h('div', { class: 'museum-fix', tabindex: '-1' },
            h('div', { class: 'sol' }, h('b', null, 'Write this instead'), h('div', { class: 'ln', style: { whiteSpace: 'pre-line' } }, x.fix)),
            h('div', { class: 'callout ex' }, h('h4', null, 'The examiners said'), '“' + x.quote + '”', h('div', { class: 'small muted', style: { marginTop: '4px' } }, x.src)),
            h('p', { class: 'small', style: { marginTop: '8px' } }, x.ieb ? h('a', { href: '#ieb?m=' + x.mod + '&y=' + x.y }, 'Find the real question in IEB questions (' + x.y + ', Module ' + x.mod + ')') : h('a', { href: x.see[0] }, x.see[1])))]);
      }
      d();
      add(box, [card, h('div', { class: 'row', style: { marginTop: '12px' } },
        h('button', { class: 'btn ghost', type: 'button', onclick: () => { k = (k + list.length - 1) % list.length; show(); S.focusTo(box.querySelector('h3')); } }, '← Previous'),
        h('span', { class: 'small muted' }, (k + 1) + ' of ' + list.length),
        h('button', { class: 'btn', type: 'button', onclick: () => { k = (k + 1) % list.length; show(); S.focusTo(box.querySelector('h3')); } }, 'Next exhibit →'))]);
    }
    pickList(); show();
  };
})();
