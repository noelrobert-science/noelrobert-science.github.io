/* The 17 coursebook sections: rules, a worked example as steps, the IEB trap, Who is right?, the labs and the
   question generators for each. Wording follows the coursebook and the IEB memos. */
(function () {
  'use strict';
  const S = window.STUDIO;

  S.SECTIONS = [
    /* ---------------- Module 27 ---------------- */
    {
      id: '27.1', mod: 27, short: 'the two agents', title: 'Oxidation, reduction and the two agents',
      intro: 'In zinc and copper(II) sulfate each zinc atom loses two electrons and each Cu²⁺ ion gains two. The electrons lost are exactly the electrons gained: one cannot happen without the other. That is a redox reaction.',
      defs: [['Redox reaction', 'A reaction involving the transfer of electrons.'], ['Electrolyte', 'A substance that can conduct electricity due to the presence of free (mobile) ions when molten or dissolved in solution.'], ['Oxidation', 'The loss of electrons.'], ['Reduction', 'The gain of electrons.'], ['Oxidising agent', 'A substance that accepts electrons.'], ['Reducing agent', 'A substance that donates electrons.'], ['Anode', 'The electrode where oxidation takes place.'], ['Cathode', 'The electrode where reduction takes place.']],
      rules: ['Write every soluble ionic compound and every strong acid as its ions. Cross out the ions that are the same on both sides: they are spectators.',
        'The species that loses electrons is oxidised. It is the reducing agent.',
        'The species that gains electrons is reduced. It is the oxidising agent.',
        'Name the reactant, never the product, as the agent: Cu²⁺, not Cu.'],
      worked: { n: '27.1', title: 'Magnesium and hydrochloric acid', marks: 5,
        q: 'Mg + 2HCℓ → MgCℓ₂ + H₂. (a) Write the equation in terms of the particles that react. (b) Which species is oxidised? (c) Identify the oxidising agent. (d) Why is this a redox reaction?',
        steps: [
          { lab: '(a) Ions', text: 'Mg + 2H⁺ + 2Cℓ⁻ → Mg²⁺ + 2Cℓ⁻ + H₂, so Mg + 2H⁺ → Mg²⁺ + H₂ ✓', why: 'HCℓ and MgCℓ₂ are written as ions; Cℓ⁻ is on both sides, so cross it out.' },
          { lab: '(b) Oxidised', text: 'Magnesium, Mg: Mg → Mg²⁺ + 2e⁻ ✓', why: 'It loses two electrons.', cls: 'ox' },
          { lab: '(c) Oxidising agent', text: 'H⁺: 2H⁺ + 2e⁻ → H₂ ✓', why: 'It accepts electrons. Not H₂: that is the product.', cls: 'red' },
          { lab: '(d) Redox', text: 'Electrons are transferred ✓: Mg loses electrons (is oxidised) and H⁺ gains them (is reduced) ✓', cls: 'el' }] },
      trap: { wrong: 'An oxidising agent is oxidised.', right: 'An oxidising agent is reduced: it accepts electrons. It oxidises something else.' },
      who: { q: 'Three learners discuss Zn + Cu²⁺ → Zn²⁺ + Cu.', people: [
        { name: 'Ravi', says: 'Zinc is the oxidising agent, because zinc is oxidised.' },
        { name: 'Zoe', says: 'Cu²⁺ is the oxidising agent: it takes electrons from the zinc, so it oxidises the zinc and is itself reduced.', right: true },
        { name: 'Pieter', says: 'Copper is the oxidising agent, because copper is formed.' }],
        why: 'Zoe. Ravi has the cross-over: the species oxidised is the REDUCING agent. Pieter names the product: the agent is always a reactant.' },
      tools: ['zinc', 'roles', 'isredox'], gen: ['agents', 'agentsOx'],
      reread: 'the definitions and the Exam recipe in 27.1'
    },
    {
      id: '27.2', mod: 27, short: 'half-reactions', title: 'Half-reactions from Table 4',
      intro: 'Every row of Table 4 is a reduction. Copy a row to write a reduction; write it backwards to write an oxidation. The product you need picks the row.',
      defs: [['Arrows', 'Use single arrows when writing equations for any half-reactions and redox reactions from the table of standard electrode potentials (Table 4 on the Data Sheet).']],
      rules: ['Find the species in Table 4. Left of ⇌: it can be reduced. Right of ⇌: it can be oxidised.',
        'Reduction: copy the whole row, including any H⁺ and H₂O, with a single arrow →.',
        'Oxidation: write the whole row backwards with a single arrow →. The electrons are now on the right.',
        'Check that atoms and charges balance on both sides. To add two half-reactions, multiply so that electrons lost = electrons gained. Never multiply Eθ.'],
      worked: { n: '27.2', title: 'Five half-reactions from the table', marks: 10,
        q: 'Use Table 4 to write the half-reaction for: (a) the reduction of chlorine; (b) the oxidation of aluminium; (c) the oxidation of iron(II) ions; (d) the reduction of permanganate ions in acid; (e) the oxidation of hydrogen peroxide.',
        steps: [
          { lab: '(a) Reduction', text: 'Cℓ₂ + 2e⁻ → 2Cℓ⁻ ✓✓', why: 'Row +1,36 V, copied.', cls: 'red' },
          { lab: '(b) Oxidation', text: 'Aℓ → Aℓ³⁺ + 3e⁻ ✓✓', why: 'Row −1,66 V, backwards.', cls: 'ox' },
          { lab: '(c) Oxidation', text: 'Fe²⁺ → Fe³⁺ + e⁻ ✓✓', why: 'Fe²⁺ is on the right of the +0,77 V row. The Fe²⁺ on the left of the −0,44 V row would be a reduction to Fe.', cls: 'ox' },
          { lab: '(d) Reduction', text: 'MnO₄⁻ + 8H⁺ + 5e⁻ → Mn²⁺ + 4H₂O ✓✓', why: 'Row +1,51 V, copied. Charge: −1 + 8 − 5 = +2 on the left; +2 on the right.', cls: 'red' },
          { lab: '(e) Oxidation', text: 'H₂O₂ → O₂ + 2H⁺ + 2e⁻ ✓✓', why: 'H₂O₂ is on the right of the +0,68 V row, so write it backwards.', cls: 'ox' }] },
      trap: { wrong: '2Br⁻ → Br₂ + e⁻', right: '2Br⁻ → Br₂ + 2e⁻. Check the charge: −2 on the left must equal 0 + 2(−1) on the right.' },
      tools: ['halfrx', 'balancer', 'ruler', 'table4'], gen: ['half', 'net'],
      reread: 'the Exam recipe for half-reactions in 27.2'
    },
    {
      id: '27.3', mod: 27, short: 'will it react?', title: 'Will it react? Spontaneity from Table 4',
      intro: 'A redox reaction is spontaneous under standard conditions when the oxidising agent is lower down on the left of Table 4 than the reducing agent is on the right. Explain it with named species and the words stronger and weaker.',
      rules: ['List every species really present: metals, ions, molecules and water.',
        'On the left of Table 4 a species can act as an oxidising agent; on the right, as a reducing agent.',
        'Pick the strongest oxidising agent present (lowest on the left) and the strongest reducing agent present (highest on the right). If the oxidising agent is lower in the table, they react.',
        'Explain: “X is a stronger oxidising agent than Y, so X oxidises Z to …”. “More reactive” names no agent and earns nothing.'],
      worked: { n: '27.5', title: 'Will the metal dissolve in the acid?', marks: 7,
        q: 'Use the relative strengths of the oxidising agents to predict whether (a) zinc and (b) copper reacts with dilute hydrochloric acid. Where there is a reaction, write the balanced equation.',
        steps: [
          { lab: 'Species', text: 'In dilute HCℓ: H⁺ (oxidising agent), Cℓ⁻ (spectator) and water.' },
          { lab: '(a)', text: 'H⁺ (0,00 V) is a stronger oxidising agent than Zn²⁺ (−0,76 V) ✓, so H⁺ oxidises Zn to Zn²⁺: zinc reacts ✓.', cls: 'red' },
          { lab: 'Equation', text: 'Zn + 2H⁺ → Zn²⁺ + H₂ (reactants ✓ products ✓ balanced ✓)', cls: 'el' },
          { lab: '(b)', text: 'H⁺ (0,00 V) is a weaker oxidising agent than Cu²⁺ (+0,34 V) ✓, so H⁺ cannot oxidise Cu: no reaction ✓.' }] },
      trap: { wrong: 'Copper does not react with the acid because copper is less reactive.', right: 'H⁺ is a weaker oxidising agent than Cu²⁺, so H⁺ cannot oxidise Cu. Name both agents and compare like with like.' },
      who: { q: 'Three learners explain why silver does not react with iron(II) sulfate solution.', people: [
        { name: 'Lerato', says: 'Fe²⁺ is a weaker oxidising agent than Ag⁺, so Fe²⁺ cannot oxidise Ag to Ag⁺.', right: true },
        { name: 'Thabo', says: 'Silver has a higher reducing ability than iron.' },
        { name: 'Aisha', says: 'Fe²⁺ is too high up in the table: it is a strong reducing agent, so it cannot take electrons.' }],
        why: 'Lerato. She names both oxidising agents and compares their strengths. Thabo is wrong twice: Ag is the weaker reducing agent, and the IEB warns: “Candidates should avoid the term ‘reducing ability’ as it is unclear whether they mean the ability to be reduced or the ability to reduce something else.” (2025 report, Q7.7) Aisha confuses the two sides: as an oxidising agent Fe²⁺ (−0,44 V) is weak, but “strong reducing agent” describes Fe, not Fe²⁺.' },
      tools: ['table4', 'testtube'], gen: ['react', 'net'],
      reread: 'the Exam recipe for Will it react? in 27.3'
    },
    {
      id: '27.4', mod: 27, short: 'spectator ions', title: 'Spectator ions',
      intro: 'Spectator ions are in the solution before and after the reaction. They take no part in the electron transfer, so they are left out of the net ionic equation.',
      rules: ['Write the full balanced equation.',
        'Split every soluble ionic compound (aq) and every strong acid into its ions. Keep solids, gases, water and molecular substances (Cℓ₂, Br₂, H₂O₂) as they are.',
        'Cross out the ions that appear unchanged on both sides: these are the spectator ions.',
        'Group 1 ions and NO₃⁻, SO₄²⁻ in neutral solution are usually spectators. In acid, NO₃⁻ is a strong oxidising agent.'],
      worked: { n: '27.9', title: 'Chlorine and potassium bromide', marks: 6,
        q: 'Chlorine gas is bubbled through potassium bromide solution. (a) Write the balanced net ionic equation. (b) Identify the oxidising agent. (c) Name the spectator ion and explain why it is not the reducing agent. ((a) and (b) are IEB 2025 P2 Q6.1 and Q6.2.)',
        steps: [
          { lab: 'Ions', text: 'KBr(aq) is K⁺(aq) and Br⁻(aq). There are no K atoms.' },
          { lab: 'Oxidation', text: '2Br⁻ → Br₂ + 2e⁻', why: 'Br⁻ is on the right of the +1,09 V row.', cls: 'ox' },
          { lab: 'Reduction', text: 'Cℓ₂ + 2e⁻ → 2Cℓ⁻', why: '+1,36 V: lower down, so it reacts.', cls: 'red' },
          { lab: '(a)', text: 'Cℓ₂ + 2Br⁻ → 2Cℓ⁻ + Br₂ (reactants ✓ products ✓ balanced ✓)', cls: 'el' },
          { lab: '(b)', text: 'Chlorine, Cℓ₂ ✓' },
          { lab: '(c)', text: 'K⁺ ✓. It has already lost its outer electron and appears only on the left of Table 4, so it cannot donate electrons ✓.' }] },
      trap: { wrong: 'K is the reducing agent in KBr(aq).', right: 'KBr(aq) contains K⁺ and Br⁻ ions. Br⁻ is the reducing agent; K⁺ is a spectator. (2025 report: more than half the candidates chose potassium.)' },
      who: { q: 'Zinc granules react with dilute hydrochloric acid: Zn + 2HCℓ → ZnCℓ₂ + H₂.', people: [
        { name: 'Lerato', says: 'Cℓ⁻ is the spectator ion: it is in the solution before and after the reaction.', right: true },
        { name: 'Ravi', says: 'H⁺ is the spectator ion, because hydrogen just bubbles off as a gas.' },
        { name: 'Zoe', says: 'There are no spectator ions here: ZnCℓ₂ contains chloride, so the chloride ions react.' }],
        why: 'Lerato. H⁺ gains electrons (it is the oxidising agent). Cℓ⁻ is unchanged on both sides, even though it ends up “in” ZnCℓ₂(aq), which is just Zn²⁺ and Cℓ⁻ ions.' },
      tools: ['spectators', 'testtube', 'table4'], gen: ['spect'],
      reread: 'the Exam recipe for spectator ions in 27.4'
    },
    /* ---------------- Module 28 ---------------- */
    {
      id: '28.1', mod: 28, short: 'how it works', title: 'How a galvanic cell works',
      intro: 'A galvanic cell keeps the oxidising agent and the reducing agent apart, so the electrons must travel through a wire to get from one to the other. That flow is the current.',
      defs: [['Galvanic cell', 'An electrochemical cell that converts the chemical energy of spontaneous redox reactions into electrical energy.']],
      rules: ['List the species in each half-cell, including the electrode metal. Find each in Table 4.',
        'The half-cell with the lower (more negative) Eθ contains the stronger reducing agent: it is oxidised, so it is the anode (negative).',
        'Cathode: copy the reduction row of the other half-cell with a single arrow →. Anode: write its row backwards.',
        'Overall: multiply to balance the electrons, add, and cancel the electrons. Leave out spectator ions.'],
      worked: { n: '28.1', title: 'The zinc–copper cell', marks: 12,
        q: 'A zinc electrode in 1 mol·dm⁻³ Zn(NO₃)₂(aq) and a copper electrode in 1 mol·dm⁻³ Cu(NO₃)₂(aq). (a) Identify the anode, with a reason. (b) Write the half-reactions. (c) Write the overall reaction. (d) State the direction of electron flow. (e) State ONE observation at each electrode.',
        steps: [
          { lab: '(a) Anode', text: 'Zinc ✓. Zn (−0,76 V) is a stronger reducing agent than Cu (+0,34 V), so Zn is oxidised ✓.', cls: 'ox' },
          { lab: '(b) Anode', text: 'Zn → Zn²⁺ + 2e⁻ ✓✓', cls: 'ox' },
          { lab: '(b) Cathode', text: 'Cu²⁺ + 2e⁻ → Cu ✓✓', cls: 'red' },
          { lab: '(c) Overall', text: 'Zn + Cu²⁺ → Zn²⁺ + Cu (reactants ✓ products ✓ balanced ✓)', cls: 'el' },
          { lab: '(d) Electrons', text: 'From the zinc electrode to the copper electrode, through the wire ✓.', cls: 'el' },
          { lab: '(e)', text: 'The zinc electrode gets thinner ✓. A reddish-brown layer of copper forms on the copper electrode ✓.' }] },
      trap: { wrong: 'Electrons flow from the zinc half-cell through the salt bridge to the copper half-cell.', right: 'Electrons flow only through the external circuit (the wire and the electrodes). Ions carry the charge through the solutions and the salt bridge.' },
      tools: ['cell'], gen: ['anode', 'flow'],
      reread: 'the Exam recipe for the anode in 28.1'
    },
    {
      id: '28.2', mod: 28, short: 'the salt bridge', title: 'The salt bridge',
      intro: 'Without the salt bridge, positive charge builds up in the anode half-cell and negative charge in the cathode half-cell, and the current stops at once.',
      defs: [['Functions of the salt bridge', 'Completing the circuit; maintaining electrical neutrality in the half-cells.']],
      rules: ['The salt bridge completes the circuit and maintains electrical neutrality in the half-cells.',
        'Say what builds up: “In the anode half-cell Zn²⁺ ions form, so positive charge builds up.”',
        'Ions move both ways: “NO₃⁻ ions move from the salt bridge into the zinc half-cell, and Zn²⁺ ions move from the zinc half-cell into the salt bridge.” If the cathode is asked too: “In the copper half-cell Cu²⁺ ions are removed, so K⁺ ions move from the salt bridge into it, and anions move from it into the bridge.”',
        'Its ions must not react with either half-cell. KNO₃ is usual. KCℓ fails next to Ag⁺ (AgCℓ precipitates) and next to MnO₄⁻ (Cℓ⁻ is oxidised).'],
      worked: { n: '28.3', title: 'The salt bridge in a silver cell', marks: 6,
        q: 'A copper half-cell is joined to a silver half-cell by a KNO₃(aq) salt bridge. (a) State the TWO functions of the salt bridge. (b) Towards which half-cell do the K⁺ ions move? Explain. (c) Explain why a KCℓ salt bridge would be unsuitable.',
        steps: [
          { lab: '(a)', text: 'It completes the circuit ✓ and maintains electrical neutrality in the half-cells ✓.' },
          { lab: '(b)', text: 'Towards the silver half-cell ✓. Silver is the cathode: Ag⁺ ions are removed from the solution, so K⁺ ions move in to keep the half-cell neutral ✓.', cls: 'red' },
          { lab: '(c)', text: 'Cℓ⁻ ions from the bridge would react with Ag⁺ ions ✓ to form an AgCℓ precipitate, removing Ag⁺ from the cathode half-cell ✓.' }] },
      trap: { wrong: 'Ions flow through the salt bridge.', right: 'That earns nothing on its own. Name the ions and the half-cells: “NO₃⁻ ions move from the salt bridge into the zinc half-cell, and Zn²⁺ ions move from the zinc half-cell into the salt bridge.”' },
      who: { q: 'Three learners explain why a galvanic cell stops working when the salt bridge is removed.', people: [
        { name: 'Thabo', says: 'The salt bridge carries the electrons back from the copper half-cell to the zinc half-cell, so without it the electrons are stuck.' },
        { name: 'Aisha', says: 'Without the bridge, charge builds up in the half-cells and the circuit is open, so no current can flow.', right: true },
        { name: 'Lerato', says: 'The salt bridge is where the energy of the cell comes from.' }],
        why: 'Aisha. The salt bridge completes the circuit and keeps the half-cells neutral. Thabo is wrong: electrons never flow through the bridge, only ions do. Lerato is wrong: the energy comes from the spontaneous redox reaction.' },
      tools: ['cell'], gen: ['bridge', 'bridge', 'bank'],
      reread: 'the Exam recipe for the salt bridge in 28.2'
    },
    {
      id: '28.3', mod: 28, short: 'inert electrodes', title: 'Inert electrodes',
      intro: 'When a half-reaction has no solid conductor (a gas and an ion, or two ions), the half-cell needs an inert electrode: one that conducts and does not react.',
      rules: ['If none of the species in the half-reaction is a solid that conducts (two ions, or a gas and an ion), use an inert electrode.',
        'Platinum or graphite: they conduct electricity and are unreactive.',
        'A metal that is not in the half-reaction may react: Fe³⁺ (+0,77 V) would oxidise a copper electrode.',
        'Pt goes on the outside in cell notation.'],
      worked: { n: '28.4', title: 'A zinc–chlorine cell', marks: 8,
        q: 'Chlorine at 1 atm is bubbled over a platinum electrode in 1 mol·dm⁻³ KCℓ(aq). This half-cell is joined to a Zn | Zn²⁺ half-cell. (a) Write the cathode half-reaction. (b) Write the overall reaction. (c) Explain why an inert electrode is needed, and give TWO reasons why platinum is suitable.',
        steps: [
          { lab: '(a) Cathode', text: 'Cℓ₂ + 2e⁻ → 2Cℓ⁻ ✓✓', cls: 'red' },
          { lab: 'Anode', text: 'Zn → Zn²⁺ + 2e⁻', cls: 'ox' },
          { lab: '(b) Overall', text: 'Zn + Cℓ₂ → Zn²⁺ + 2Cℓ⁻ (reactants ✓ products ✓ balanced ✓)', cls: 'el' },
          { lab: '(c)', text: 'There is no solid conductor in the half-reaction (a gas and an ion) ✓. Platinum conducts electricity ✓ and is unreactive: it does not take part in the reaction ✓.' }] },
      trap: { wrong: 'Use a copper electrode in the Fe³⁺, Fe²⁺ half-cell: copper conducts well.', right: 'Copper is not inert here. Fe³⁺ (+0,77 V) is a stronger oxidising agent than Cu²⁺ (+0,34 V), so Fe³⁺ would oxidise the copper electrode.' },
      tools: ['cell', 'notation'], gen: ['inert', 'bank'],
      reread: 'section 28.3 on inert electrodes'
    },
    {
      id: '28.4', mod: 28, short: 'cell notation', title: 'Cell notation',
      intro: 'Cell notation is a short way to write a whole cell: anode on the left, cathode on the right, the salt bridge as || in the middle.',
      rules: ['The anode half-cell goes on the left: reducing agent | product of oxidation. Exception (28.5): a SHE used as the reference always goes on the left.',
        'The cathode half-cell goes on the right: oxidising agent | product of reduction.',
        'Put || between the half-cells, and any inert electrode (Pt) on the outside.',
        'Same phase: comma. Different phases: |. No coefficients, no electrons, no spectator ions.'],
      worked: { n: '28.5', title: 'Writing cell notation', marks: 7,
        q: 'Write the cell notation for (a) the zinc–chlorine cell and (b) a cell in which nickel is oxidised by Fe³⁺ ions at a platinum electrode, with state symbols and standard conditions.',
        steps: [
          { lab: '(a)', text: 'Zn | Zn²⁺ || Cℓ₂ | Cℓ⁻ | Pt', why: 'anode ✓ salt bridge ✓ cathode with Pt ✓' },
          { lab: '(b)', text: 'Ni(s) | Ni²⁺(aq, 1 mol·dm⁻³) || Fe³⁺(aq, 1 mol·dm⁻³), Fe²⁺(aq, 1 mol·dm⁻³) | Pt(s) at 25 °C', why: 'anode ✓ cathode ✓ comma ✓ conditions ✓. Fe³⁺ and Fe²⁺ are both in solution, so a comma separates them.' }] },
      trap: { wrong: 'Mg | Mg²⁺ || 2Ag⁺ | 2Ag', right: 'Mg | Mg²⁺ || Ag⁺ | Ag. Cell notation has no coefficients, even when the balanced equation needs them.' },
      tools: ['notation'], gen: ['notation'],
      reread: 'the Exam recipe for cell notation in 28.4'
    },
    {
      id: '28.5', mod: 28, short: 'standard conditions and the SHE', title: 'Standard conditions and the hydrogen electrode',
      intro: 'Electrode potentials are measured against the standard hydrogen electrode (SHE), given 0,00 V. Each value in Table 4 is the reading of a cell made from that half-cell and the SHE.',
      defs: [['The hydrogen electrode as reference', 'When used as a reference electrode the standard hydrogen electrode is connected as the anode (to the negative terminal of a voltmeter) even though it may not spontaneously act as the anode.']],
      rules: ['Standard conditions: 1 mol·dm⁻³ for every aqueous solution of ions, 1 atm for every gas, and 25 °C (298 K) for the whole cell. Give only the ones that apply: a Zn–Cu cell has no gas, so no pressure (2017 memo).',
        'The SHE: Pt electrode, H₂ gas at 1 atm, 1 mol·dm⁻³ H⁺, 25 °C. Eθ = 0,00 V.',
        'With the SHE as the reference on the left (Pt | H₂ | H⁺ || …), the reading is Eθ of the other half-cell, positive or negative.',
        'A negative reading means the other half-cell is really the anode: its metal is oxidised and H⁺ is reduced.'],
      worked: { n: '28.6', title: 'Using the hydrogen electrode as a reference', marks: 8,
        q: 'A Ag⁺ | Ag half-cell is connected to a SHE under standard conditions; the SHE is on the negative terminal of the voltmeter. (a) Write the cell notation. (b) What will the voltmeter read? (c) The silver half-cell is replaced by Mg²⁺ | Mg. Predict the reading and write the net cell reaction.',
        steps: [
          { lab: '(a)', text: 'Pt | H₂ | H⁺ || Ag⁺ | Ag', why: 'SHE as anode ✓ Ag half-cell ✓' },
          { lab: '(b)', text: '+0,80 V ✓', why: 'The reading is Eθ(Ag⁺/Ag), because Eθ(SHE) = 0,00 V.' },
          { lab: '(c) Reading', text: '−2,37 V ✓' },
          { lab: 'Net', text: 'Mg + 2H⁺ → Mg²⁺ + H₂ (reactants ✓ products ✓ balanced ✓)', why: 'The negative sign shows that Mg²⁺ is not reduced: magnesium is oxidised and H⁺ is reduced ✓.', cls: 'el' }] },
      trap: { wrong: 'Standard conditions are 0 °C and 1 atm.', right: 'For electrode potentials the standard temperature is 25 °C. The 0 °C (273 K) on the data sheet belongs to the molar gas volume at STP.' },
      tools: ['she'], gen: ['she', 'bank'],
      reread: 'section 28.5 on standard conditions and the SHE'
    },
    {
      id: '28.6', mod: 28, short: 'calculating emf', title: 'Calculating emf and predicting spontaneity',
      intro: 'The emf of a cell is the difference between the two electrode potentials. Positive: spontaneous under standard conditions. Negative: non-spontaneous under standard conditions.',
      defs: [['Positive Eθcell', 'A positive value of the standard emf (Eθcell) is an indication that a redox reaction is spontaneous under standard conditions.'], ['Negative Eθcell', 'A negative value of the standard emf (Eθcell) is an indication that a redox reaction is non-spontaneous under standard conditions.'], ['Non-standard conditions', 'Cell potentials will differ when conditions are not standard.']],
      rules: ['In a reaction, find the oxidising agent (gains electrons) and the reducing agent (loses electrons) in the reaction as written. In a cell, the oxidising agent is at the cathode.',
        'Eθcell = Eθcathode − Eθanode = EθOA − EθRA, values from Table 4, with brackets round a negative value.',
        'Write the formula, substitute, and give the answer with the unit V. Never multiply Eθ by a coefficient.',
        'Positive: spontaneous under standard conditions. Negative: non-spontaneous.'],
      worked: { n: '28.7', title: 'The emf of a cell', marks: 3,
        q: 'Calculate the emf of a standard cell made from a Mg | Mg²⁺ half-cell and a Ag⁺ | Ag half-cell.',
        steps: [
          { lab: 'Formula', text: 'Eθcell = Eθcathode − Eθanode ✓' },
          { lab: 'Substitute', text: 'Eθcell = 0,80 − (−2,37) ✓', why: 'Ag⁺ is reduced at the cathode; Mg is oxidised at the anode.' },
          { lab: 'Answer', text: 'Eθcell = 3,17 V ✓' }] },
      trap: { wrong: 'Eθcell = 1,36 − −0,04 = 1,32 eV', right: 'Eθcell = 1,36 − (−0,04) = 1,40 V. Put brackets round a negative Eθ before you subtract it, and give the unit as V (volt). (2023 report, Q6.7)' },
      tools: ['ruler', 'table4'], gen: ['emf', 'emfReact', 'spont'],
      reread: 'the Exam recipe for emf in 28.6'
    },
    {
      id: '28.7', mod: 28, short: 'when a cell runs down', title: 'When a cell runs down: concentration and voltage',
      intro: 'A working cell is a reaction moving towards equilibrium. As reactants are used and products build up, the voltage falls; at equilibrium it is zero: the cell is flat.',
      defs: [['How long a cell delivers current', 'The galvanic cell has the capacity to deliver current until the reaction reaches chemical equilibrium or has run to completion.'], ['A flat cell', 'Once a galvanic cell reaches chemical equilibrium or has run to completion the voltage of the cell equals zero.']],
      rules: ['Say what the change does to a concentration: “[Cu²⁺], a reactant, increases.”',
        'Le Châtelier: say which reaction is favoured, forward or reverse …',
        '… and why: “to use up the extra Cu²⁺” or “to make more Cu²⁺”.',
        'State the effect on the voltage. At equilibrium the voltage is zero.'],
      worked: { n: '28.9', title: 'Changing concentrations in a zinc–copper cell', marks: 8,
        q: 'Predict and explain the effect on the voltage of: (a) using 2 mol·dm⁻³ Cu²⁺; (b) adding concentrated Zn(NO₃)₂ to the zinc half-cell; (c) leaving the cell connected for several days.',
        steps: [
          { lab: '(a)', text: '[Cu²⁺], a reactant, increases ✓, so the forward reaction is favoured ✓: the voltage increases ✓.' },
          { lab: '(b)', text: '[Zn²⁺], a product, increases ✓, so the reverse reaction is favoured ✓: the voltage decreases ✓.' },
          { lab: '(c)', text: 'The reaction approaches equilibrium (or the zinc or Cu²⁺ is used up) ✓, so the voltage decreases to zero ✓.' }] },
      trap: { wrong: 'The cell has run out of electrons.', right: 'Electrons are not used up. The reaction has reached equilibrium, or a reactant has run out: either way the voltage is zero.' },
      who: { q: 'A torch cell is completely flat.', people: [
        { name: 'Pieter', says: 'All the zinc has been used up, so there is nothing left to react.' },
        { name: 'Lerato', says: 'The reaction has reached equilibrium, or one reactant has run out. Either way, the voltage is zero.', right: true },
        { name: 'Thabo', says: 'The cell has run out of electrons.' }],
        why: 'Lerato. A cell delivers current until the reaction reaches chemical equilibrium or has run to completion. Pieter gives only one of the two possibilities, and there is often zinc left. Thabo is wrong: electrons are transferred from the reducing agent; they are not stored in the cell.' },
      tools: ['rundown'], gen: ['conc', 'conc', 'bank'],
      reread: 'the Exam recipe in 28.7'
    },
    {
      id: '28.8', mod: 28, short: 'internal resistance', title: 'Internal resistance of a cell',
      intro: 'A cell resists the flow of charge through its own electrodes and electrolytes. So when a current flows, the reading across the cell drops below the emf.',
      defs: [['Internal resistance', 'Opposition to the flow of charge through the electrodes and electrolytes in a cell.'], ['Electrode surface area', 'Increased surface area of the electrodes increases the rate of the reaction by lowering the internal resistance and increasing the maximum current that the cell can deliver, but does not affect the emf of the cell.'], ['Salt bridge size', 'The wider, shorter and/or more conductive salt bridge lowers internal resistance thereby increasing the maximum current that the cell can deliver, but does not affect the emf of the cell.']],
      rules: ['When a current flows, some energy per coulomb is used inside the cell, so the reading is less than the emf.',
        'Lower the internal resistance: larger electrode surface area; a shorter, wider or more conductive salt bridge.',
        'Lower internal resistance raises the maximum current.',
        'The emf depends only on the half-reactions and the conditions (concentration, pressure, temperature), not on the size of the cell.'],
      worked: { n: '28.10', title: 'Internal resistance and the reading', marks: 6,
        q: 'A cell has an emf of 0,83 V. When a current flows, the reading drops to 0,70 V. (a) Explain why. (b) State TWO changes that would make the drop smaller. (c) Would either change affect the emf? Explain. (Adapted from IEB 2024 P2 Q6.6.)',
        steps: [
          { lab: '(a)', text: 'The cell has internal resistance ✓. When a current flows, some energy per coulomb is used inside the cell, so the potential difference across the cell is less than the emf ✓.' },
          { lab: '(b)', text: 'Increase the surface area of the electrodes ✓. Use a shorter, wider or more conductive salt bridge ✓.' },
          { lab: '(c)', text: 'No ✓. Both changes lower the internal resistance; the emf depends only on the half-reactions and the conditions ✓.' }] },
      trap: { wrong: 'Bigger electrodes give a bigger emf.', right: 'Bigger electrodes lower the internal resistance and raise the maximum current. The emf stays the same.' },
      tools: ['resistance'], gen: ['bank'],
      reread: 'section 28.8 on internal resistance'
    },
    /* ---------------- Module 29 ---------------- */
    {
      id: '29.1', mod: 29, short: 'how it works', title: 'How an electrolytic cell works',
      intro: 'An electrolytic cell uses electrical energy to drive a non-spontaneous redox reaction. The supply pushes electrons onto the cathode and pulls them off the anode.',
      defs: [['Electrolytic cell', 'An electrochemical cell that uses electrical energy to cause a non-spontaneous redox reaction to occur. Thus, electrical energy is converted into chemical energy.']],
      rules: ['Anode: joined to the positive terminal (oxidation). Cathode: joined to the negative terminal (reduction).',
        'List every species present: the ions, water (if aqueous), and the electrode itself if it is not inert.',
        'Cathode: the strongest oxidising agent present is reduced. Anode: an anode that is not inert is oxidised itself if it is the strongest reducing agent present, as it usually is (29.2). At an inert anode the strongest reducing agent present is oxidised. One exception (29.3): in a concentrated chloride solution Cℓ⁻ is oxidised, although water is the slightly stronger reducing agent.',
        'Overall: balance the electrons and add. The species reduced is the oxidising agent. With inert electrodes Eθcell = Eθcathode − Eθanode is negative: the supply must give more than that many volts (0 V when the anode is the plating metal, 29.4).',
        'A melt has no water: the cation is reduced and the anion is oxidised. The ions are free to move only once the lattice melts. Use a DC supply: it keeps the sign of each electrode fixed.'],
      worked: { n: '29.1', title: 'Copper(II) chloride solution', marks: 13,
        q: 'Concentrated CuCℓ₂(aq) is electrolysed with graphite electrodes. (a) Write the half-reactions. (b) Write the overall ionic reaction. (c) Identify the oxidising agent and the reducing agent. (d) Use Eθcell to show that the reaction is non-spontaneous.',
        steps: [
          { lab: '(a) Cathode', text: 'Cu²⁺ + 2e⁻ → Cu ✓✓', cls: 'red' },
          { lab: '(a) Anode', text: '2Cℓ⁻ → Cℓ₂ + 2e⁻ ✓✓', why: 'In a concentrated solution the high [Cℓ⁻] makes the oxidation of Cℓ⁻ predominant over water.', cls: 'ox' },
          { lab: '(b) Overall', text: 'Cu²⁺ + 2Cℓ⁻ → Cu + Cℓ₂ (reactants ✓ products ✓ balanced ✓)', cls: 'el' },
          { lab: '(c)', text: 'Oxidising agent: Cu²⁺ ✓ (it is reduced). Reducing agent: Cℓ⁻ ✓ (it is oxidised).' },
          { lab: '(d)', text: 'Eθcell = Eθcathode − Eθanode ✓ = 0,34 − 1,36 ✓ = −1,02 V ✓', why: 'Negative, so non-spontaneous ✓: the supply must provide more than 1,02 V.' }] },
      trap: { wrong: 'In an electrolytic cell the anode is negative, as in a galvanic cell.', right: 'In an electrolytic cell the anode is positive (joined to + of the supply). Oxidation is still at the anode.' },
      who: { q: 'Three learners discuss the CuCℓ₂ cell.', people: [
        { name: 'Aisha', says: 'The electrode joined to the positive terminal is the cathode, because the Cu²⁺ ions are positive.' },
        { name: 'Pieter', says: 'The positive electrode is the anode: it attracts the Cℓ⁻ ions and takes their electrons, so Cℓ⁻ is oxidised.', right: true },
        { name: 'Lerato', says: 'Electrons flow through the solution from the anode to the cathode.' }],
        why: 'Pieter. The anode is joined to the positive terminal; anions move to it and are oxidised there. Pieter is right for this cell, but being attracted is not always enough: in 29.3 you meet anions, such as SO₄²⁻, that reach the anode but are not oxidised. Aisha: positive Cu²⁺ ions are attracted to the negative electrode, the cathode. Lerato: electrons flow only through the wires and electrodes; ions carry the charge through the solution.' },
      tools: ['twoway', 'electrolysis'], gen: ['elecEmf', 'productsMelt', 'bank'],
      reread: 'the Exam recipe for electrolytic cells in 29.1'
    },
    {
      id: '29.2', mod: 29, short: 'choosing electrodes', title: 'Choosing electrodes',
      intro: 'An inert electrode only passes electrons on. A metal anode that is a stronger reducing agent than everything else at the anode is oxidised itself and dissolves.',
      rules: ['Inert electrodes in exam questions: platinum and graphite (and titanium, the anode of the membrane cell).',
        'Reasons for an inert electrode: it conducts electricity, and it is not oxidised and does not react with the electrolyte or the products.',
        'A copper, nickel or silver anode is oxidised and dissolves when it is the strongest reducing agent present (it usually is).',
        'Potassium, sodium and magnesium are never suitable in water: such strong reducing agents react with the water of the electrolyte. Give both reasons for an inert electrode: “it is inert” alone repeats the question. In a molten cell graphite also has a very high melting point; “so that it doesn’t melt” earns nothing.'],
      worked: { n: '29.3', title: 'Choosing the electrodes for KI(aq)', marks: 5,
        q: 'A learner wants to make iodine by electrolysing potassium iodide solution. (a) Suggest a suitable material for the electrodes and give TWO reasons. (b) Explain why a copper anode would not produce iodine.',
        steps: [
          { lab: '(a)', text: 'Graphite (or platinum) ✓. It conducts electricity ✓ and it is inert: it is not oxidised and does not react with the electrolyte or the iodine ✓.' },
          { lab: '(b)', text: 'Cu (+0,34 V) is a stronger reducing agent than I⁻ (+0,54 V) ✓. So the copper anode itself is oxidised, Cu → Cu²⁺ + 2e⁻, and dissolves, instead of the iodide ions ✓.', cls: 'ox' }] },
      trap: { wrong: 'A metal electrode is always inert.', right: 'Only Pt, graphite (and Ti in the membrane cell) are inert. A Cu, Ni or Ag anode is oxidised and dissolves when it is the strongest reducing agent present.' },
      tools: ['electrolysis'], gen: ['productsActive', 'bank'],
      reread: 'section 29.2 on choosing electrodes'
    },
    {
      id: '29.3', mod: 29, short: 'which reaction wins?', title: 'Which reaction wins in aqueous electrolysis?',
      intro: 'In a solution there is a second player at both electrodes: water. It can be reduced at the cathode (−0,83 V) and oxidised at the anode (+1,23 V). The reaction that wins is the predominant half-reaction.',
      rules: ['List the ions and water. Note the concentration and whether the electrodes are inert.',
        'Cathode: compare the metal ion with H₂O (−0,83 V). The stronger oxidising agent is reduced. In acid, H⁺ (0,00 V) is reduced to H₂.',
        'Anode: an active metal anode is oxidised itself. At an inert anode compare the anion with H₂O (+1,23 V); for Cℓ⁻ use the concentration (concentrated: Cℓ₂ forms).',
        'Explain with named species: “Na⁺ is a weaker oxidising agent than H₂O, so H₂O is reduced.” One idea per mark, in bullets.',
        'Concentration of an ion from a hydrate: the waters of crystallisation go into M (CuSO₄·5H₂O: 249,5 g·mol⁻¹); the ion ratio turns c(salt) into [ion]: [Cℓ⁻] = 2c(CaCℓ₂) (2024 report).'],
      worked: { n: '29.6', title: 'Copper(II) sulfate with inert electrodes', marks: 9,
        q: 'CuSO₄(aq) is electrolysed with graphite electrodes. (a) Write the half-reactions. (b) Write the overall ionic equation. (c) Describe TWO changes in the solution as the electrolysis continues. (Based on IEB 2023 P2 Q7.1.2, Cell B.)',
        steps: [
          { lab: '(a) Cathode', text: 'Cu²⁺ + 2e⁻ → Cu ✓✓', why: 'Cu²⁺ (+0,34 V) is a stronger oxidising agent than H₂O (−0,83 V).', cls: 'red' },
          { lab: '(a) Anode', text: '2H₂O → O₂ + 4H⁺ + 4e⁻ ✓✓', why: 'SO₄²⁻ is not oxidised: it is only on the left of Table 4.', cls: 'ox' },
          { lab: '(b)', text: '2Cu²⁺ + 2H₂O → 2Cu + O₂ + 4H⁺ ✓✓✓', cls: 'el' },
          { lab: '(c)', text: 'The blue colour fades, because Cu²⁺ is used up ✓. The solution becomes acidic (pH decreases), because H⁺ forms ✓.' }] },
      trap: { wrong: 'Na⁺ ions are attracted to the cathode, so they are reduced to sodium when NaCℓ(aq) is electrolysed.', right: 'Attraction decides only which way the ions drift; Table 4 decides which species reacts. Na⁺ is a weaker oxidising agent than H₂O, so water is reduced and H₂ forms.' },
      tools: ['electrolysis', 'hydrate'], gen: ['productsAq', 'productsActive', 'hydrate'],
      reread: 'the Exam recipe for aqueous electrolysis in 29.3'
    },
    {
      id: '29.4', mod: 29, short: 'plating, refining, membrane cell', title: 'Electroplating, electrorefining and the membrane cell',
      intro: 'Three industrial uses of electrolysis. Plating and refining both move a metal from the anode to the cathode; the membrane cell makes chlorine and sodium hydroxide from brine.',
      rules: ['Electroplating: the object is the cathode (negative); the anode is the plating metal; the electrolyte contains ions of the plating metal. The [metal ion] stays the same.',
        'Electrorefining: impure metal is the anode; pure metal is the cathode. Impurities that are stronger reducing agents are oxidised; weaker ones fall as anode sludge. The [Cu²⁺] slowly decreases.',
        'Membrane cell: titanium anode, steel cathode, saturated brine. The membrane lets only Na⁺ through. 2NaCℓ + 2H₂O → 2NaOH + Cℓ₂ + H₂.',
        'At the anode compare REDUCING agents (the metals); at the cathode compare OXIDISING agents (the ions).'],
      worked: { n: '29.8', title: 'Copper-plating baby shoes', marks: 8,
        q: 'Baby shoes are copper-plated in acidified copper(II) sulfate. (a) The shoes are coated with metallic paint first. Why? (b) To which terminal is the shoe connected? Give a reason. (c) Write the half-reaction at the shoe. (d) Suggest a suitable anode, and explain why the [Cu²⁺] stays constant. (Adapted from IEB May 2026 P2 Q7.3, parts (c) and (d) added. Our answer: there is no official memo yet.)',
        steps: [
          { lab: '(a)', text: 'A shoe does not conduct: the paint gives it a conducting surface, so that it can act as the cathode ✓.' },
          { lab: '(b)', text: 'The negative terminal ✓. The shoe must be the cathode, where Cu²⁺ ions are reduced to copper ✓.', cls: 'red' },
          { lab: '(c) Reduction at the shoe (cathode)', text: 'Cu²⁺ + 2e⁻ → Cu ✓✓', cls: 'red' },
          { lab: '(d)', text: 'A copper bar ✓. It is oxidised, Cu → Cu²⁺ + 2e⁻, at the same rate as Cu²⁺ is reduced at the shoe ✓, so the [Cu²⁺] stays the same ✓.', cls: 'ox' }] },
      trap: { wrong: 'At the anode: Co²⁺ is a weaker oxidising agent than Cu²⁺, so Co is oxidised.', right: 'At the anode compare the reducing agents: “Co is a stronger reducing agent than Cu, so Co is oxidised.” At the cathode compare the oxidising agents.' },
      who: { q: 'Three learners compare electroplating and electrorefining with copper electrodes.', people: [
        { name: 'Thabo', says: 'In both, the [Cu²⁺] stays the same, because the anode is copper.' },
        { name: 'Zoe', says: 'In electrorefining the [Cu²⁺] slowly decreases: the impurities like Co are oxidised too, but only Cu²⁺ is reduced.', right: true },
        { name: 'Ravi', says: 'In electrorefining the [Cu²⁺] increases, because the anode dissolves.' }],
        why: 'Zoe. Some electrons at the anode come from impurity atoms, but all the electrons at the cathode go to Cu²⁺, so Cu²⁺ is used up faster than it forms (2025 memo). Thabo is right only for electroplating. Ravi forgets that Cu²⁺ is also removed at the cathode.' },
      tools: ['plating', 'membrane'], gen: ['plate', 'bank', 'bank'],
      reread: 'section 29.4 on plating, refining and the membrane cell'
    },
    {
      id: '29.5', mod: 29, short: 'Faraday calculations', title: 'Faraday calculations',
      intro: 'The charge that flows tells you how many moles of electrons moved. The half-reaction tells you how many moles of product those electrons make.',
      rules: ['Write the half-reaction at the electrode. It gives the ratio: Ag⁺ + e⁻ → Ag (1 e⁻ per Ag); Cu²⁺ + 2e⁻ → Cu (2); 2Cℓ⁻ → Cℓ₂ + 2e⁻ (2); 2H₂O → O₂ + 4H⁺ + 4e⁻ (4).',
        'Convert what you know to moles: n = m/M, n = V/Vm or n(e⁻) = q/F.',
        'Use the ratio to go between moles of electrons and moles of substance.',
        'Finish with q = It (time in seconds), m = nM or V = nVm. Round only the final answer, to two decimals.'],
      worked: { n: '29.11', title: 'Charge to mass', marks: 6,
        q: '19,3 × 10³ C of charge passes through a copper electrorefining cell (IEB 2025 P2 Q7.10). (a) How many moles of electrons is this? (b) Calculate the mass of copper deposited on the pure copper electrode.',
        steps: [
          { lab: '(a)', text: 'n(e⁻) = q/F = 19,3 × 10³ / 96 500 = 0,20 mol ✓✓✓' },
          { lab: 'Ratio (reduction at the cathode)', text: 'Cu²⁺ + 2e⁻ → Cu, so n(Cu) = ½n(e⁻) = 0,10 mol ✓', cls: 'red' },
          { lab: 'Mass', text: 'm = nM = (0,10)(63,5) = 6,35 g ✓✓' }] },
      trap: { wrong: 'n(Cu) = n(e⁻), so 0,2 mol of electrons deposits 0,2 mol of copper.', right: 'Cu²⁺ + 2e⁻ → Cu: each Cu needs two electrons, so 0,2 mol of electrons deposits only 0,1 mol of copper.' },
      tools: ['faraday'], gen: ['faraday', 'faradayRev'],
      reread: 'the Exam recipe for Faraday calculations in 29.5'
    }
  ];
  S.sectionById = id => S.SECTIONS.find(s => s.id === id);


  /* Words that win marks: the tables at the end of Part B in the Modules 27 to 29 coursebooks (When you… / Write this / Not this) */
  S.WORDS = [{"mod": 27, "when": "define redox", "yes": "a reaction involving the transfer of electrons", "no": "“oxygen is added”, “an exchange of ions”"},
    {"mod": 27, "when": "define an oxidising agent", "yes": "a substance that accepts electrons", "no": "“a substance that is oxidised”"},
    {"mod": 27, "when": "define anode or cathode", "yes": "the ELECTRODE where oxidation (reduction) takes place", "no": "“the half-cell where…”, or “Fe/Fe³⁺”"},
    {"mod": 27, "when": "define electrolyte", "yes": "a substance that can conduct electricity due to the presence of free (mobile) ions when molten or dissolved in solution", "no": "“a liquid that will conduct” (mercury conducts by electrons)"},
    {"mod": 27, "when": "name or give the symbol of an agent", "yes": "NAME: permanganate (ion); SYMBOL: MnO₄⁻", "no": "the other one, or the product"},
    {"mod": 27, "when": "name an agent", "yes": "the reactant: Cu²⁺ (or copper(II) ions)", "no": "the product (Cu), or “copper” for Cu²⁺"},
    {"mod": 27, "when": "write a half-reaction", "yes": "single arrow →; electrons on the correct side; charges balance", "no": "⇌, or 2Br⁻ → Br₂ + e⁻"},
    {"mod": 27, "when": "balance a redox equation", "yes": "multiply the half-reactions so e⁻ lost = e⁻ gained", "no": "multiplying the Eθ values"},
    {"mod": 27, "when": "explain spontaneity", "yes": "Cℓ₂ is a stronger oxidising agent than Br₂, so Cℓ₂ oxidises Br⁻ to Br₂", "no": "“copper is less reactive” with no agents named; “reducing ability”"},
    {"mod": 27, "when": "find the reducing agent in KBr(aq)", "yes": "Br⁻ (the bromide ions)", "no": "K or K⁺"},
    {"mod": 27, "when": "write a net ionic equation", "yes": "only the species that change; spectators crossed out", "no": "ions unchanged on both sides left in (K⁺, Na⁺; NO₃⁻ or SO₄²⁻ when nothing reacts with them)"},
    {"mod": 28, "when": "describe a galvanic cell", "yes": "an electrochemical cell that converts the chemical energy of spontaneous redox reactions into electrical energy", "no": "“makes electricity”"},
    {"mod": 28, "when": "identify the anode", "yes": "the electrode (e.g. the zinc electrode) where oxidation takes place", "no": "“the zinc half-cell”, “the Zn²⁺ solution”"},
    {"mod": 28, "when": "write a half-reaction", "yes": "single arrow →; electrons on the correct side; charges balance", "no": "⇌ or electrons on the wrong side"},
    {"mod": 28, "when": "describe electron flow", "yes": "from the anode to the cathode through the external circuit", "no": "“through the salt bridge”"},
    {"mod": 28, "when": "describe the salt bridge", "yes": "completes the circuit; maintains electrical neutrality; anions move into the anode half-cell", "no": "“ions flow” (no names or directions)"},
    {"mod": 28, "when": "compare two agents", "yes": "Ag⁺ is a stronger oxidising agent than Cu²⁺", "no": "“silver is more reactive”, “higher reducing ability”"},
    {"mod": 28, "when": "write cell notation", "yes": "Pt on the outside; comma for the same phase; no coefficients", "no": "2Ag⁺, missing Pt"},
    {"mod": 28, "when": "give an emf", "yes": "1,10 V, from Eθ values exactly as printed", "no": "a multiplied Eθ; a missing unit"},
    {"mod": 29, "when": "describe an electrolytic cell", "yes": "uses electrical energy to cause a non-spontaneous redox reaction; electrical → chemical energy", "no": "“makes electricity”"},
    {"mod": 29, "when": "identify the anode", "yes": "the electrode joined to the positive terminal, where oxidation takes place", "no": "“the negative electrode”"},
    {"mod": 29, "when": "explain a cathode product", "yes": "Na⁺ is a weaker oxidising agent than H₂O, so H₂O is reduced", "no": "“sodium is too reactive”"},
    {"mod": 29, "when": "explain Cℓ₂ from brine", "yes": "the high [Cℓ⁻] favours the oxidation of Cℓ⁻ over water", "no": "“chlorine is more reactive than oxygen”"},
    {"mod": 29, "when": "give reasons for an inert electrode", "yes": "conducts electricity and is not oxidised / does not react", "no": "“it is inert” only"},
    {"mod": 29, "when": "name the process", "yes": "electrorefining; electroplating", "no": "“electrolysis purification”, “refining”"},
    {"mod": 29, "when": "do a Faraday calculation", "yes": "write the half-reaction; use its e⁻ ratio; t in seconds", "no": "n(metal) = n(e⁻) for Cu; minutes in q = It"},
    {"mod": 29, "when": "identify the oxidising agent in aqueous electrolysis", "yes": "H₂O, when water is reduced at the cathode", "no": "“Na⁺”, “K⁺”, “the power supply”"}];
  /* The definitions to learn word for word (SAGS), for the flip cards in Return later */
  S.DEFS = [];
  S.SECTIONS.forEach(s => (s.defs || []).forEach(([t, d]) => S.DEFS.push({ term: t, def: d, section: s.id })));
  S.DEFS.push({ term: 'Spectator ions', def: 'The spectator ions do not take part in the electron transfer.', section: '27.4' });
  S.DEFS.push({ term: 'Electroplating', def: 'Using electrolysis to coat an object (the cathode) with a thin layer of a metal.', section: '29.4', cls: true });
  S.DEFS.push({ term: 'Faraday constant', def: 'The charge carried by one mole of electrons: F = 96 500 C·mol⁻¹ (on the data sheet).', section: '29.5', cls: true });
})();
