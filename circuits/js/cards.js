/* Explain a change, stages 5 and 6 (studio_design.md §7.8, §7.9, §7.11).
   Exam cards: select, then write (D17); a rule-based keyword checker that is fully shown; self-marking with the
   checker's view beside each tick; fading levels A to E per family. Then one backwards item and one 'Who is right?'
   item per family, and the D20 before/after check. Everything is recorded on the device only. */
(function () {
  'use strict';
  var C = window.Chain;

  /* ---------- the checker's vocabulary (§7.8 'What the checker looks for') ---------- */
  var Q = {
    R: /(total|external|effective|equivalent)\s+resistance|resistance of the (external )?circuit|\bR\s?(ext|t|total)\b/i,
    I: /\b(total|circuit|main|battery)\s+current\b|\bthe current\b(?!\s+through\s+(the\s+)?(bulb|lamp|r3|headlamp))|current (in|through|from) the (circuit|battery)|reading on a1|\ba1\b|\bcurrent increases|\bcurrent decreases|\bless current|\bmore current/i,
    LV: /lost volts|lost voltage|\bIr\b|(pd|potential difference|voltage) across (the )?(internal resistance|r\b)|internal (pd|voltage)/i,
    TV: /terminal (pd|potential difference|voltage)|load voltage|\bv ?load\b|\bv1\b|\bv₁\b|reading on v1|external (pd|voltage)/i,
    V2: /\bv2\b|\bv₂\b|(pd|potential difference|voltage) across (the )?rheostat/i,
    Vb: /(pd|potential difference|voltage) across (the )?(bulb|lamp|pair|parallel|headlamps?|l1)|\bv3\b|\bv₃\b/i,
    Ib: /current (through|in) (the )?(bulb|lamp|headlamps?|l1)|\ba2\b|\ba₂\b/i,
    P: /bright|dim|power|\bP\s*=|heat|energy/i,
    IR3: /current (through|in) r3|r3('s)? current/i,
    VR3: /(pd|potential difference|voltage) across r3|\bv3\b|\bv₃\b/i,
    PX: /\bx\b.{0,40}(bright|power)|(bright|power).{0,40}\bx\b/i,
    VY: /(pd|potential difference|voltage) across (lamp )?y\b/i,
    ZERO: /no current|zero current|current is zero|current (falls|drops) to zero|\bI\s*=\s*0\b|almost no current|stops the current/i,
    NOPD: /no (pd|potential difference|voltage|lost volts)|(pd|potential difference|voltage) (is|of) zero|no current/i,
    SC: /short|negligible resistance|no resistance|zero resistance/i,
    OUT: /goes out|go out|bulb.{0,20}(off|out)|no current.{0,30}(bulb|lamp)|external circuit.{0,30}no (pd|current)/i,
    HEAT: /heat|I²r|I\^?2r|144/i,
    FIX: /(battery|terminal|emf|its)\W.{0,40}(fixed|same|constant|unchanged)|(pd|voltage).{0,30}(same|constant|fixed)/i
  };
  var EQ = {
    I: /I\s*=\s*emf\s*\/|I\s*=\s*ε\s*\/|I\s*=\s*V\s*\/\s*R|V\s*=\s*I\s*R|emf\s*=\s*I\s*\(/i,
    P: /P\s*=\s*(I²R|I\^?2\s*R|V²\s*\/\s*R|V\^?2\s*\/\s*R|VI)/i,
    V: /V\s*=\s*I\s*R|V1?\s*=\s*I\s*[×x*]?\s*R\s?(ext)?|I\s*[×x]\s*R\s?ext/i,
    Ir: /I\s*=\s*emf\s*\/\s*r|I\s*=\s*ε\s*\/\s*r|12\s*\/\s*1|12,00 A|12 A/i
  };
  var DIR = {
    '+': /goes up|go up|went up|increas|\brise|\brises|risen|\bmore\b|larger|greater|higher|bigger|brighter/i,
    '-': /goes down|go down|went down|decreas|\bfall|\bfalls|drop|\bless\b|fewer|smaller|lower|dimmer/i,
    '0': /stays? the same|remains? (the same|constant|unchanged)|constant|unchanged|does not change|doesn't change/i
  };
  var REASON = /because|\bso\b|since|therefore|\bas\b|which means|I\s*=|V\s*=|P\s*=|emf\s*=|add up|adds? a path|short/i;
  var NAMED = /P\s*=\s*I²r|I\s*=\s*emf\s*\/\s*\(\s*R\s?ext\s*\+\s*r\s*\)|I\s*=\s*emf\s*\/\s*r|V\s?load\s*=\s*emf\s*[−-]\s*Ir|emf\s*=\s*I\s*\(\s*R\s?ext\s*\+\s*r\s*\)|emf\s*=\s*V\s?load\s*\+\s*V\s?internal(\s+resistance)?|I\s*=\s*V\s*\/\s*R|V\s*=\s*IR|P\s*=\s*(I²R|V²\/R|VI|I\^?2R|V\^?2\/R)|V1?\s*=\s*I\s*[×x]\s*R\s?ext|V\s?internal(\s+resistance)?\s*=\s*Ir/gi;
  var QNAME = { R: 'Total resistance', I: 'Current', LV: 'Lost volts', TV: 'Terminal pd (V1)', V2: 'pd across the rheostat (V2)', Vb: 'pd across the bulb', Ib: 'Current through the bulb',
    P: 'Power and brightness', IR3: 'Current through R3', VR3: 'pd across R3', PX: 'Lamp X', VY: 'pd across lamp Y', ZERO: 'Current', NOPD: 'pd across the parts', SC: 'The ammeter', OUT: 'The bulb', HEAT: 'The energy', FIX: 'The pd across L1', EQI: 'The equation', EQP: 'The equation', EQV: 'The equation' };

  /* ---------- the card bank: 34 cards (§7.8) ---------- */
  function L(k, d, m, o) { o = o || {}; o.k = k; o.d = d; o.m = m; return o; }
  var STEM = 'Will the reading on {m} INCREASE, DECREASE or STAY THE SAME? Explain your answer.';
  function stem(m) { return STEM.replace('{m}', m); }
  var IDV = ['INCREASE', 'DECREASE', 'STAY THE SAME'], BRT = ['BRIGHTER', 'DIMMER', 'STAYS THE SAME'];
  function g10(g, a, b) { return g === 10 ? a : b; }
  var CARDS = [
    { id: 'E1-bulb', ev: 'E1', grades: [10, 11, 12], src: 'printed', srcNote: 'IEB NSC Nov 2020 Paper 1 memo, Q7.2.5',
      stem: function () { return 'The rheostat’s resistance is increased. What happens to the brightness of the bulb? Explain your answer by making use of a suitable equation.'; },
      rows: function () { return [{ opts: BRT, v: 'DIMMER', vm: 'The bulb is dimmer: less power is dissipated in it.', lines: [L(['Ib', 'Vb'], '-', 'The current through the bulb (and the pd across it) decreases.'), L('EQP', null, 'P = I²R (or P = V²/R), and the bulb’s resistance is fixed.', { eq: EQ.P })] }]; } },
    { id: 'E1-V1', ev: 'E1', grades: [11, 12], src: 'inferred', srcNote: 'old-syllabus chains N14-7.1.6, N16-7.1.6, S16-7.2.6, in the 25M-7.2.7 layout',
      stem: function () { return 'The rheostat’s resistance is increased. ' + stem('V1'); },
      rows: function () { return [{ opts: IDV, v: 'INCREASE', vm: 'So V1 increases, because Vload = emf − Ir.', lines: [L('R', '+', 'The external resistance increases.'), L('I', '-', 'So the current decreases, because I = emf/(Rext + r) and the emf is fixed.'), L('LV', '-', 'So the lost volts (Ir) decrease, because r is fixed.')] }]; } },
    { id: 'E1-A1-10', ev: 'E1', grades: [10], src: 'studio',
      stem: function () { return 'The rheostat’s resistance is increased. ' + stem('A1'); },
      rows: function () { return [{ opts: IDV, v: 'DECREASE', vm: 'The reading on A1 decreases.', lines: [L('R', '+', 'The total resistance increases, so the current decreases, because I = V/R and the battery’s pd is fixed.', { eq: EQ.I })] }]; } },
    { id: 'E2-V1', ev: 'E2', grades: [11, 12], src: 'layout', srcNote: '25M-7.2.7 bullet layout',
      stem: function () { return 'The rheostat’s resistance is decreased. Write only INCREASES, DECREASES or REMAINS THE SAME for the reading on V1, and explain your answer.'; },
      rows: function () { return [{ opts: ['INCREASES', 'DECREASES', 'REMAINS THE SAME'], v: 'DECREASES', vm: 'Therefore V1 decreases.', lines: [L('R', '-', 'The total resistance decreases.'), L('I', '+', 'The total current increases.'), L('LV', '+', 'The lost volts increase.')] }]; } },
    { id: 'E2-bulb', ev: 'E2', grades: [10, 11, 12], src: 'printed', srcNote: 'the 20N-7.2.5 pattern, reversed',
      stem: function () { return 'The rheostat’s resistance is decreased. What happens to the brightness of the bulb? Explain your answer by making use of a suitable equation.'; },
      rows: function () { return [{ opts: BRT, v: 'BRIGHTER', vm: 'The bulb is brighter: more power is dissipated in it.', lines: [L('Ib', '+', 'The current through the bulb increases.'), L('EQP', null, 'P = I²R, and the bulb’s resistance is fixed.', { eq: EQ.P })] }]; } },
    { id: 'E2-V2-10', ev: 'E2', grades: [10], src: 'studio', star: 3,
      stem: function () { return 'The rheostat’s resistance is decreased. ' + stem('V2'); },
      rows: function () { return [{ opts: IDV, v: 'DECREASE', vm: 'So V2 = 12 V − V3 decreases, because the pds in series add up to 12 V.', lines: [L('I', '+', 'The total resistance decreases, so the current increases.'), L('Vb', '+', 'The pd across the parallel pair increases, because V = IR and the pair’s resistance is fixed.')] }]; } },
    { id: 'E3-V1', ev: 'E3', grades: [11, 12], src: 'inferred', srcNote: '25N-8.1.8 (2 marks)',
      stem: function () { return 'Switch S1 is opened. What will V1 read? Explain your answer.'; },
      rows: function () { return [{ opts: ['0,00 V', '10,50 V', '12,00 V'], v: '12,00 V', vm: 'V1 reads 12,00 V, the emf.', lines: [L('ZERO', null, 'No current flows, so there are no lost volts.')] }]; } },
    { id: 'E3-Vs', ev: 'E3', grades: [10, 11, 12], src: 'studio', srcNote: 'the slip in 19N-7.1.3 and 25N-8.1.7',
      stem: function () { return 'Switch S1 is opened. A voltmeter is connected across S1. What will it read? Explain your answer.'; },
      rows: function (g) { return [{ opts: ['0,00 V', '6,00 V', '12,00 V'], v: '12,00 V', vm: 'It reads 12,00 V.', lines: [L('NOPD', null, g10(g, 'No current flows, so there is no pd across any resistor: the ends of the voltmeter are at the potentials of the battery’s terminals.', 'No current flows, so there is no pd across any resistor (or r): the ends of the voltmeter are at the potentials of the battery’s terminals.'))] }]; } },
    { id: 'E3b-V1', ev: 'E3b', grades: [11, 12], src: 'inferred', srcNote: 'IEB NSC Nov 2019 Paper 1 memo, Q7.1.4',
      stem: function () { return 'Switch S1 is closed again. ' + stem('V1'); },
      rows: function () { return [{ opts: IDV, v: 'DECREASE', vm: 'V1 decreases.', lines: [L('I', '+', 'A current now flows: the current increases from zero.'), L('LV', null, 'So there are lost volts: Vload = emf − Ir is less than the emf.')] }]; } },
    { id: 'E4-9', ev: 'E4', grades: [12], src: 'layout', srcNote: '26M-8.6 layout and printed carry-over caps',
      stem: function () { return 'Switch S2 is opened. For each quantity, write INCREASE, DECREASE or REMAINS THE SAME and give two reasons.'; },
      rows: function () {
        var o = ['INCREASE', 'DECREASE', 'REMAINS THE SAME'];
        return [{ label: 'Reading on A1', opts: o, v: 'DECREASE', vm: 'DECREASE', lines: [L('R', '+', 'The total resistance increases (one parallel path fewer).'), L('FIXE', null, 'The emf stays the same, so I = emf/(Rext + r) decreases.', { re: /emf.{0,40}(same|constant|fixed|unchanged)|(total voltage|emf) remains/i })] },
          { label: 'Reading on V1', opts: o, v: 'INCREASE', vm: 'INCREASE', cap: 2, lines: [L('I', '-', 'The current has decreased.'), L('LV', '-', 'So there are fewer lost volts.')] },
          { label: 'Brightness of the bulb', opts: o, v: 'INCREASE', vm: 'INCREASE', cap: 3, lines: [L('Vb', '+', 'The pd across the bulb increases (the terminal pd rises and the pd across the rheostat falls).'), L('Ib', '+', 'The current through the bulb increases.')] }];
      } },
    { id: 'E4-8', ev: 'E4', grades: [11, 12], src: 'layout', srcNote: '24N-9.7 layout (2 + 3 + 3); the third bulb mark is inferred',
      stem: function () { return 'Switch S2 is opened. For each of the questions below, circle the appropriate answer and explain your answer when instructed to.'; },
      rows: function () {
        return [{ label: 'V2 (no reason needed)', opts: IDV, v: 'DECREASE', vm: 'DECREASE', vmarks: 2, lines: [] },
          { label: 'V1: explain', opts: IDV, v: 'INCREASE', vm: 'INCREASE', lines: [L('I', '-', 'Less current flows.'), L('LV', '-', 'So there are fewer lost volts (Ir).')] },
          { label: 'Brightness of the bulb: explain', opts: IDV, v: 'INCREASE', vm: 'INCREASE', lines: [L('Vb', '+', 'There is a greater pd across the bulb,'), L('V2', '-', 'because the pd across the rheostat falls while the terminal pd rises.')] }];
      } },
    { id: 'E4-A1-10', ev: 'E4', grades: [10], src: 'studio',
      stem: function () { return 'Switch S2 is opened. ' + stem('A1'); },
      rows: function () { return [{ opts: IDV, v: 'DECREASE', vm: 'A1 decreases.', lines: [L('R', '+', 'There is one path fewer, so the total resistance increases, and I = V/R decreases.', { eq: EQ.I })] }]; } },
    { id: 'E4-bulb-10', ev: 'E4', grades: [10], src: 'studio', star: 3,
      stem: function () { return 'Switch S2 is opened. What happens to the brightness of the bulb? Explain your answer.'; },
      rows: function () { return [{ opts: BRT, v: 'BRIGHTER', vm: 'So P = V²/R increases: the bulb is brighter.', lines: [L('V2', '-', 'V2 decreases, because V = IR: the current is smaller and Rh is fixed.'), L('Vb', '+', 'So the pd across the bulb (12 V − V2) increases.')] }]; } },
    { id: 'E4b-A1', ev: 'E4b', grades: [10, 11, 12], src: 'inferred', srcNote: 'IEB NSC Nov 2021 Paper 1 memo, Q7.2.6',
      stem: function () { return 'Switch S2 is closed again. ' + stem('A1'); },
      rows: function (g) { return [{ opts: IDV, v: 'INCREASE', vm: 'A1 increases.', lines: [L('R', '-', g10(g, 'Adding a resistor in parallel adds a path, so the total resistance decreases.', 'Adding a resistor in parallel adds a path, so the external resistance decreases.')), L('EQI', null, g10(g, 'I = V/R, and the battery’s pd is fixed.', 'I = emf/(Rext + r), and the emf is fixed.'), { eq: EQ.I })] }]; } },
    { id: 'E4b-V1', ev: 'E4b', grades: [11, 12], src: 'inferred', srcNote: '23M-7.10; compare 18N-7.1.8',
      stem: function () { return 'Switch S2 is closed again. ' + stem('V1'); },
      rows: function () { return [{ opts: IDV, v: 'DECREASE', vm: 'So V1 decreases (Vload = emf − Ir).', lines: [L('I', '+', 'The total resistance decreases, so the current increases.'), L('LV', '+', 'So the lost volts increase.')] }]; } },
    { id: 'E4b-bulb', ev: 'E4b', grades: [10, 11, 12], src: 'studio', srcNote: 'built like 26M-8.6.3',
      stem: function () { return 'Switch S2 is closed again. What happens to the brightness of the bulb? Explain your answer.'; },
      rows: function (g) { return [{ opts: BRT, v: 'DIMMER', vm: 'The bulb is dimmer.', lines: [L('Vb', '-', g10(g, 'The pd across the bulb decreases, because V2 rises and the pds in series add up to 12 V.', 'The pd across the bulb decreases, because the terminal pd falls and the pd across the rheostat rises.')), L('EQP', null, 'P = V²/R, and the bulb’s resistance is fixed.', { eq: EQ.P })] }]; } },
    { id: 'B-lamps', ev: 'B-1', grades: [11, 12], src: 'inferred', srcNote: '23N-8.9 (five links)',
      stem: function () { return 'The headlamps are on. The starter motor is switched on. What happens to the brightness of the headlamps? Explain your answer.'; },
      rows: function () { return [{ opts: BRT, v: 'DIMMER', vm: 'The current through the headlamps decreases, so their brightness decreases.', lines: [L('R', '-', 'The external resistance decreases (the motor is added in parallel).'), L('I', '+', 'The battery current increases.'), L('LV', '+', 'The lost volts increase.'), L('TV', '-', 'The terminal pd decreases: this is the pd across the headlamps.')] }]; } },
    { id: 'C-L1', ev: 'C-1', grades: [10, 11, 12], src: 'studio', srcNote: '22N-1.8 and 24M-1.8, key D; 23N-8.9',
      stem: function (g) { return 'Switch S is closed, so L2 is added in parallel with L1' + (g >= 11 ? ' (the battery has r = 1 Ω)' : '') + '. What happens to the brightness of L1? Explain your answer.'; },
      rows: function (g) {
        return g === 10 ? [{ opts: BRT, v: 'STAYS THE SAME', vm: 'L1’s brightness stays the same.', lines: [L('FIX', null, 'L1’s pd is the battery’s pd, which is fixed (an ideal battery), so P = V²/R stays the same.')] }]
          : [{ opts: BRT, v: 'DIMMER', vm: 'L1 is dimmer.', lines: [L('LV', '+', 'The current increases, so the lost volts increase, so the terminal pd (the pd across L1) decreases.')] }];
      } },
    { id: 'D-XY', ev: 'D-1', grades: [10, 11, 12], src: 'studio', srcNote: '23M-1.10, key C',
      stem: function () { return 'Switch S is closed, so lamp Z is added across lamp Y. What happens to the brightness of lamp Y? Explain, and say what happens to lamp X.'; },
      rows: function () { return [{ opts: BRT, v: 'DIMMER', vm: 'Y is dimmer.', lines: [L('I', '+', 'The total resistance decreases, so the current increases.'), L('PX', '+', 'X is brighter, because P = I²R and X’s resistance is fixed.'), L('VY', '-', 'The pd across X increases, so the pd across Y (12 V − VX) decreases.')] }]; } },
    { id: 'E5-A1', ev: 'E5', grades: [10, 11, 12], src: 'studio',
      stem: function () { return 'The bulb’s filament breaks. ' + stem('A1'); },
      rows: function (g) { return [{ opts: IDV, v: 'DECREASE', vm: 'A1 decreases.', lines: [L('R', '+', g10(g, 'The bulb’s branch is broken, so the pair’s resistance rises from 4 Ω to 12 Ω and the total resistance increases.', 'The bulb’s branch is broken, so the pair’s resistance rises from 4 Ω to 12 Ω and the external resistance increases.')), L('EQI', null, g10(g, 'I = V/R, and the battery’s pd is fixed.', 'I = emf/(Rext + r), and the emf is fixed.'), { eq: EQ.I })] }]; } },
    { id: 'E5-R3', ev: 'E5', grades: [10, 11, 12], src: 'studio', srcNote: 'built like 24N-9.7.3',
      stem: function () { return 'The bulb’s filament breaks. Will the current through R3 INCREASE, DECREASE or STAY THE SAME? Explain your answer.'; },
      rows: function (g) { return [{ opts: IDV, v: 'INCREASE', vm: 'The current through R3 increases.', lines: [L('VR3', '+', g10(g, 'The pd across R3 increases, because V2 falls and the pds in series add up to 12 V.', 'The pd across R3 increases, because the terminal pd rises and the pd across the rheostat falls.')), L('EQI', null, 'I = V/R, and R3’s resistance is fixed.', { eq: /I\s*=\s*V\s*\/\s*R|V\s*=\s*IR/i })] }]; } },
    { id: 'E5b-V3', ev: 'E5b', grades: [10, 11, 12], src: 'studio',
      stem: function () { return 'S2 is open and the bulb’s filament breaks. What will V3 read? Explain your answer.'; },
      rows: function (g) { return [{ opts: ['0,00 V', '7,20 V', '12,00 V'], v: '12,00 V', vm: 'V3 reads 12,00 V.', lines: [L('NOPD', null, g10(g, 'No current flows, so there is no pd across the rheostat: the voltmeter across the gap reads the emf.', 'No current flows, so there is no pd across the rheostat (or r): the voltmeter across the gap reads the emf.'))] }]; } },
    { id: 'E6a-V1', ev: 'E6a', grades: [11, 12], src: 'inferred', srcNote: 'IEB NSC Nov 2025 Paper 1 memo, Q8.1.9',
      stem: function () { return 'V3 is replaced by an ammeter. ' + stem('V1'); },
      rows: function () { return [{ opts: IDV, v: 'DECREASE', vm: 'V1 decreases.', lines: [L('I', '+', 'The ammeter has negligible resistance, so the circuit current increases.'), L('LV', '+', 'So there are more lost volts.')] }]; } },
    { id: 'E6a-bulb', ev: 'E6a', grades: [10, 11, 12], src: 'inferred', srcNote: '22M-6.1.7',
      stem: function () { return 'V3 is replaced by an ammeter. What happens to the bulb? Explain your answer.'; },
      rows: function () { return [{ opts: ['BRIGHTER', 'DIMMER', 'GOES OUT'], v: 'GOES OUT', vm: 'The bulb goes out.', lines: [L('SC', null, 'No current flows through it, because the ammeter is a path of negligible resistance across it (a short circuit).')] }]; } },
    { id: 'E6a-A1-10', ev: 'E6a', grades: [10], src: 'studio',
      stem: function () { return 'V3 is replaced by an ammeter. ' + stem('A1'); },
      rows: function () { return [{ opts: IDV, v: 'INCREASE', vm: 'A1 increases.', lines: [L('R', '-', 'The pair is short-circuited, so the total resistance decreases.')] }]; } },
    { id: 'E6b-V1', ev: 'E6b', grades: [11, 12], src: 'layout', srcNote: '25M-7.2.7 layout',
      stem: function () { return 'V2 is replaced by an ammeter. ' + stem('V1'); },
      rows: function () { return [{ opts: IDV, v: 'DECREASE', vm: 'Therefore V1 decreases.', lines: [L('R', '-', 'The total resistance decreases (the rheostat is short-circuited).'), L('I', '+', 'The total current increases.'), L('LV', '+', 'The lost volts increase.')] }]; } },
    { id: 'E6b-bulb', ev: 'E6b', grades: [10, 11, 12], src: 'layout', srcNote: '25M-7.1.2 layout',
      stem: function () { return 'V2 is replaced by an ammeter. What happens to the brightness of the bulb? Explain your answer by making use of a suitable equation.'; },
      rows: function (g) {
        var ls = [L('I', '+', 'The current increases.'), L('EQP', null, 'P = I²R, and the bulb’s resistance is fixed.', { eq: EQ.P })];
        if (g >= 11) ls.unshift(L('R', '-', 'The total resistance decreases (the rheostat is short-circuited).'));
        return [{ opts: BRT, v: 'BRIGHTER', vm: 'The brightness of the bulb increases.', lines: ls }];
      } },
    { id: 'E6c', ev: 'E6c', grades: [10, 11, 12], src: 'studio', srcNote: 'beyond the papers',
      stem: function () { return 'A1 is replaced by a voltmeter. What does that voltmeter read? Explain your answer.'; },
      rows: function (g) { return [{ opts: ['0,00 V', '6,00 V', '12,00 V'], v: '12,00 V', vm: 'It reads 12,00 V, the emf.', lines: [L('NOPD', null, g10(g, 'Its very large resistance stops the current, so there is no pd across the other parts.', 'Its very large resistance stops the current, so there is no pd across the other parts (and no lost volts).'))] }]; } },
    { id: 'E6d', ev: 'E6d', grades: [11, 12], src: 'studio',
      stem: function () { return 'V1 is replaced by an ammeter, straight across the battery. What does it read, and what happens to the bulb? Explain your answer.'; },
      rows: function () { return [{ opts: ['1,50 A', '3,00 A', '12,00 A'], v: '12,00 A', vm: 'I = emf/r = 12/1 = 12,00 A.', lines: [L('OUT', null, 'The external circuit has no pd across it, so the bulb goes out.'), L('HEAT', null, 'The energy is turned to heat inside the battery, because P = I²r and the current is large.')] }]; } },
    { id: 'E7-A1', ev: 'E7', grades: [11, 12], src: 'studio', srcNote: '23N-1.8, key D',
      stem: function () { return 'The battery is replaced by one with the same emf and r = 2 Ω. ' + stem('A1'); },
      rows: function () { return [{ opts: IDV, v: 'DECREASE', vm: 'A1 decreases.', lines: [L('R', '+', 'The total resistance (Rext + r) increases, and the emf is fixed.')] }]; } },
    { id: 'E7-V1', ev: 'E7', grades: [11, 12], src: 'studio', star: 3, srcNote: '23N-1.8; the 22N-24M twist',
      stem: function () { return 'The battery is replaced by one with the same emf and r = 2 Ω. ' + stem('V1'); },
      rows: function () { return [{ opts: IDV, v: 'DECREASE', vm: 'V1 decreases. (The lost volts increase here, so do not argue from “fewer lost volts”.)', lines: [L('I', '-', 'The current decreases.'), L('EQV', null, 'V1 = I × Rext, and Rext is fixed.', { eq: EQ.V })] }]; } },
    { id: 'E7b-V1', ev: 'E7b', grades: [11, 12], src: 'studio',
      stem: function () { return 'The battery is replaced by one with the same emf and r = 0,5 Ω. ' + stem('V1'); },
      rows: function () { return [{ opts: IDV, v: 'INCREASE', vm: 'V1 increases.', lines: [L('I', '+', 'The current increases.'), L('EQV', null, 'V1 = I × Rext, and Rext is fixed.', { eq: EQ.V })] }]; } },
    { id: 'E8-bulb', ev: 'E8', grades: [10, 11, 12], src: 'studio',
      stem: function () { return 'The battery is replaced by one with a larger emf (18 V) and the same r. What happens to the brightness of the bulb? Explain your answer.'; },
      rows: function () { return [{ opts: BRT, v: 'BRIGHTER', vm: 'The bulb is brighter.', lines: [L('I', '+', 'The current increases, because the emf increases and the total resistance is the same.'), L('EQP', null, 'P = I²R, and the bulb’s resistance is fixed.', { eq: EQ.P })] }]; } },
    { id: 'E-bulb', ev: 'E-1', grades: [10, 11, 12], src: 'studio',
      stem: function () { return 'The rheostat comes after the bulb. Its resistance is increased. What happens to the brightness of the bulb? Explain your answer.'; },
      rows: function () { return [{ opts: BRT, v: 'DIMMER', vm: 'The bulb is dimmer.', lines: [L(['I', 'Ib'], '-', 'A series loop has one current, so raising the rheostat’s resistance lowers the current through the bulb, wherever the rheostat sits.')] }]; } }
  ];

  /* distractor tiles from the misconception register (§7.8 select phase) */
  var DISTRACT = [
    { t: 'The emf decreases.', cancels: 'I', not: ['E8'] },
    { t: 'The internal resistance increases.', cancels: 'LV', not: ['E7', 'E7b'] },
    { t: 'The bulb uses up current, so less current comes back to the battery.', cancels: 'Ib' },
    { t: 'The battery supplies the same current as before.', cancels: 'I' },
    { t: 'The change reaches the bulb later.', cancels: 'P' },
    { t: 'The lost volts decrease because the current decreases.', cancels: 'LV', only: ['E7'] }
  ];
  var IRRELEVANT = 'The emf and the internal resistance stay the same.';

  function keyOf(line) { return [].concat(line.k)[0]; }
  function matchQ(k, s) { if (k === 'EQP') return EQ.P.test(s); if (k === 'EQI') return true; if (k === 'EQV') return EQ.V.test(s); return Q[k] ? Q[k].test(s) : false; }
  /* the checker credits a line when one bullet names its quantity, gives the right direction, and has any equation the map needs */
  /* clause by clause: the quantity and its direction must sit in the same clause, so 'the resistance decreases, so the
     current increases' credits a current-increases link and never a resistance-increases one */
  var SPLIT = /[,;:.]|\bso\b|\bbecause\b|\band\b|\bwhile\b|\bwhich\b|\bsince\b|\btherefore\b|\bas\b|\bbut\b|\balthough\b/i;
  function credits(line, bullets) {
    return bullets.some(function (b) {
      var s = b.replace(/\s+/g, ' ');
      if (line.eq && !line.eq.test(s)) return false;
      var plain = s.replace(/\([^()]*\)/g, ' ');
      var parts = line.d ? plain.split(SPLIT) : [s];
      return parts.some(function (c) {
        var qOk = line.re ? line.re.test(c) : [].concat(line.k).some(function (k) { return matchQ(k, c); });
        return qOk && (!line.d || DIR[line.d].test(c));
      });
    });
  }
  function bulletNotes(b, ev) {
    var notes = [], s = b.trim(); if (!s) return notes;
    var bare = s.replace(NAMED, ' ');
    var anyQ = Object.keys(Q).some(function (k) { return Q[k].test(s); }) || /\bemf\b/i.test(s), named = s.search(NAMED) >= 0; NAMED.lastIndex = 0;
    if (/^\s*it\b/i.test(s)) notes.push('Name the quantity: it can mean several things.');
    else if (!anyQ && !named) notes.push('Name the quantity in full.');
    if (anyQ && !named && !DIR['+'].test(s) && !DIR['-'].test(s) && !DIR['0'].test(s) && !/\bno\b|goes out|reads|zero|stops|fixed/i.test(s)) notes.push('Say which way it changes.');
    if (/[↑↓→⇒∴∝]/.test(s) || /=/.test(bare)) notes.push('Use words, not symbols or arrows, in an explanation.');
    if (ev !== 'E8' && /\bemf\b\s+(decreases|drops|falls|changes|decreased|dropped|fell|changed|will decrease|will drop|will fall)/i.test(bare)) notes.push('The emf does not change here: it belongs to the battery. (Mistake museum: “the emf changes”.)');
    if (ev !== 'E7' && ev !== 'E7b' && /(?<!across (the )?)(internal resistance|\br\b)\s+(increases|decreases|changes|increased|decreased|changed|will increase|will decrease)/i.test(bare)) notes.push('The internal resistance does not change here: it belongs to the battery.');
    if (/used up|uses (up )?(the )?current/i.test(s)) notes.push('Current is not used up: the same current leaves and returns. Energy is transferred.');
    if (/same current( as before)?/i.test(s) && ev !== 'C-1') notes.push('The battery does not give a fixed current: it changes when the circuit changes.');
    if (/voltage (flows|through)|pd (flows|through)|potential difference (flows|through)/i.test(s)) notes.push('A pd is across a part, never through it, and it does not flow.');
    return notes;
  }

  /* ---------- levels A to E per family (§7.8 fading) ---------- */
  var LV = ['A', 'B', 'C', 'D', 'E'];
  function bump(fam, g, frac) {
    var d = C.load(); d.lv = d.lv || {}; d.streak = d.streak || {};
    var lv = C.levelOf(d, fam, g), i = LV.indexOf(lv);
    if (frac >= 1) { d.streak[fam] = (d.streak[fam] || 0) + 1; if (d.streak[fam] >= 2 && i < 4) { d.lv[fam] = LV[i + 1]; d.streak[fam] = 0; } }
    else { d.streak[fam] = 0; if (frac < 0.5 && i > 0) d.lv[fam] = LV[i - 1]; }
    if (!d.lv[fam]) d.lv[fam] = lv;
    C.save(d);
    return d.lv[fam];
  }
  function cardsFor(ev, g) {
    var mine = CARDS.filter(function (c) { return c.ev === ev.id && c.grades.indexOf(g) >= 0; });
    if (mine.length) return mine;
    return CARDS.filter(function (c) { var e = C.evById(c.ev); return e && e.fam === ev.fam && c.grades.indexOf(g) >= 0 && e.grades.indexOf(g) >= 0; });
  }

  /* ---------- stage 5: the exam card ---------- */
  function mount(host, o) {
    var h = o.ctx.h, g = o.g, ev = o.ev;
    var list = cardsFor(ev, g), d = C.load(); d.seen = d.seen || {};
    var pick = list.filter(function (c) { return !d.seen[g + '/' + c.id]; })[0] || list[0];
    host.innerHTML = '';
    if (!pick) { host.appendChild(h('div', { class: 'card', style: 'margin-top:16px' }, [h('a', { class: 'btn ghost', href: '#explain', text: 'Another change' })])); return; }
    card(host, o, pick, list);
  }

  function card(host, o, cd, list) {
    var h = o.ctx.h, g = o.g, ev = o.ev, d0 = C.load(), level = o.level && /^[A-E]$/.test(o.level) ? o.level : C.levelOf(d0, ev.fam, g);
    var rows = cd.rows(g), total = 0;
    rows.forEach(function (r) { total += (r.vmarks || 1) + r.lines.length; });
    var box = h('div', { class: 'card examcard', style: 'margin-top:16px' });
    host.innerHTML = ''; host.appendChild(box);
    var srcTxt = { printed: 'Mark split printed in the memo', layout: 'Mark split from the memo’s bullet lines', inferred: 'One mark per link, read from a memo that does not print a split', studio: 'Studio card: no memo; built by analogy' }[cd.src];
    box.appendChild(h('div', { class: 'row' }, [h('h2', { text: '5. Answer it as an exam question', style: 'margin:0' }), h('span', { class: 'chip', text: 'Level ' + level }), cd.star ? h('span', { class: 'chip', text: '★★★' }) : null]));
    box.appendChild(h('p', { class: 'stem', html: esc(cd.stem(g)) + ' <b>[' + total + ']</b>' }));
    box.appendChild(h('p', { class: 'small muted', text: srcTxt + (cd.srcNote ? ' (' + cd.srcNote + ').' : '.') }));
    var area = h('div', {}); box.appendChild(area);
    var verdict = rows.map(function () { return null; }), chosen = rows.map(function () { return []; });

    /* select phase (levels A and B only; C onwards has no tiles) */
    function selectPhase() {
      area.innerHTML = '';
      rows.forEach(function (r, ri) {
        var wrap = h('div', { class: 'selrow' });
        if (r.label) wrap.appendChild(h('h3', { text: r.label }));
        var chips = h('div', { class: 'seg', role: 'group', 'aria-label': 'Your answer' + (r.label ? ' for ' + r.label : '') }, r.opts.map(function (w) {
          return h('button', { 'aria-pressed': 'false', text: w, onclick: function (e) { verdict[ri] = w; Array.prototype.forEach.call(chips.querySelectorAll('button'), function (x) { x.setAttribute('aria-pressed', String(x === e.currentTarget)); }); } });
        }));
        wrap.appendChild(chips);
        if (r.lines.length) {
          var tiles = r.lines.map(function (l, i) { return { t: l.m, line: i }; });
          if (level === 'B') {
            var nd = (C.load().fullOnce || {})[ev.fam] ? 3 : 2, pool = DISTRACT.filter(function (x) { return (!x.not || x.not.indexOf(ev.id) < 0) && (!x.only || x.only.indexOf(ev.id) >= 0); });
            pool.slice(0, nd).forEach(function (x) { tiles.push({ t: x.t, bad: x }); });
            if (!ev.bat) tiles.push({ t: IRRELEVANT, spare: true });
            tiles.sort(function (a, b) { return a.t.length % 7 - b.t.length % 7; });   /* a fixed shuffle, so the order is no hint */
          }
          var tl = h('div', { class: 'tiles' }), ord = h('ol', { class: 'order' });
          function drawOrder() {
            ord.innerHTML = '';
            chosen[ri].forEach(function (t, k) {
              ord.appendChild(h('li', {}, [h('span', { text: t.t }), level === 'B' ? h('span', { class: 'row' }, [
                h('button', { class: 'btn ghost small', 'aria-label': 'Move up', text: '↑', disabled: k === 0, onclick: function () { var x = chosen[ri][k]; chosen[ri][k] = chosen[ri][k - 1]; chosen[ri][k - 1] = x; drawOrder(); } }),
                h('button', { class: 'btn ghost small', 'aria-label': 'Remove', text: '✕', onclick: function () { chosen[ri].splice(k, 1); drawTiles(); drawOrder(); } })]) : null]));
            });
          }
          function drawTiles() {
            tl.innerHTML = '';
            tiles.forEach(function (t) {
              var on = chosen[ri].indexOf(t) >= 0;
              tl.appendChild(h('button', { class: 'tile' + (on ? ' on' : ''), 'aria-pressed': String(on), text: t.t, disabled: level === 'A', onclick: function () {
                var i = chosen[ri].indexOf(t); if (i >= 0) chosen[ri].splice(i, 1); else chosen[ri].push(t); drawTiles(); drawOrder();
              } }));
            });
          }
          if (level === 'A') { chosen[ri] = tiles.slice(); wrap.appendChild(h('p', { class: 'small', text: 'Level A: the links are given in order. Pick the answer, read the links, and you will write them in your own words next.' })); }
          else wrap.appendChild(h('p', { class: 'small', text: 'Pick the links that earn marks, in the order you would reason. Some tiles are false.' }));
          drawTiles(); wrap.appendChild(tl);
          wrap.appendChild(h('div', { class: 'small muted', text: 'Your chain:' })); wrap.appendChild(ord); drawOrder();
        }
        area.appendChild(wrap);
      });
      var msg = h('div', {});
      area.appendChild(h('div', { class: 'row', style: 'margin-top:10px' }, [h('button', { class: 'btn', text: 'Check my selection', onclick: function () { scoreSelect(msg); } })]));
      area.appendChild(msg);
    }
    function scoreSelect(msg) {
      if (verdict.some(function (v) { return !v; })) { msg.innerHTML = ''; msg.appendChild(h('div', { class: 'warnc', text: 'Pick an answer first.' })); return; }
      var got = 0, notes = [];
      rows.forEach(function (r, ri) {
        var vOk = verdict[ri] === r.v, rowGot = vOk ? (r.vmarks || 1) : 0, linesGot = 0;
        var cancelled = {};
        chosen[ri].forEach(function (t) { if (t.bad) { notes.push('“' + t.t + '” is false' + (cancel(r, t.bad.cancels) >= 0 ? ', so it cancels the mark for the ' + QNAME[t.bad.cancels].toLowerCase() + ' link. (A studio rule.)' : '.')); cancelled[cancel(r, t.bad.cancels)] = 1; } if (t.spare) notes.push('“' + t.t + '” is true, but not needed for the marks here.'); });
        var order = ['R', 'I', 'LV', 'TV'], seen = [];
        chosen[ri].forEach(function (t) {
          if (t.line == null || cancelled[t.line]) return;
          var k = keyOf(r.lines[t.line]), pos = order.indexOf(k);
          if (pos > 0 && seen.some(function (s) { return order.indexOf(s) > pos; })) { notes.push('The ' + QNAME[k].toLowerCase() + ' link comes too late: the chain runs total resistance, current, lost volts, terminal pd.'); return; }
          seen.push(k); linesGot++;
        });
        if (!vOk && r.cap != null) linesGot = Math.min(linesGot, r.cap);
        rowGot += linesGot; got += rowGot;
        var miss = r.lines.filter(function (l, i) { return !chosen[ri].some(function (t) { return t.line === i; }); });
        if (miss.length) notes.push('Missing: ' + miss.map(function (l) { return QNAME[keyOf(l)].toLowerCase(); }).join(', ') + '.');
        if (!vOk) notes.push((r.label ? r.label + ': ' : '') + 'the answer is ' + r.v + '.');
      });
      msg.innerHTML = '';
      msg.appendChild(h('div', { class: got === total ? 'okc' : 'warnc' }, [h('b', { text: 'Selection: ' + got + '/' + total + '. ' }), document.createTextNode(notes.join(' ') || 'Every link is there, in order.')]));
      msg.appendChild(h('div', { class: 'row', style: 'margin-top:10px' }, [h('button', { class: 'btn', text: 'Now write it', onclick: writePhase })]));
    }
    function cancel(r, k) { for (var i = 0; i < r.lines.length; i++) if ([].concat(r.lines[i].k).indexOf(k) >= 0 || (k === 'P' && r.lines[i].k === 'EQP')) return i; return -1; }

    /* write phase: the learner writes each bullet; tiles cannot be pasted */
    var boxes = [];
    function writePhase() {
      area.innerHTML = ''; boxes = [];
      if (level !== 'A' && level !== 'B') {
        rows.forEach(function (r, ri) {
          if (r.label || rows.length > 1) area.appendChild(h('h3', { text: r.label || '' }));
          var chips = h('div', { class: 'seg', role: 'group', 'aria-label': 'Your answer' }, r.opts.map(function (w) {
            return h('button', { 'aria-pressed': String(verdict[ri] === w), text: w, onclick: function (e) { verdict[ri] = w; Array.prototype.forEach.call(chips.querySelectorAll('button'), function (x) { x.setAttribute('aria-pressed', String(x === e.currentTarget)); }); } });
          }));
          area.appendChild(chips);
        });
      }
      area.appendChild(h('p', { class: 'small', text: level === 'E' ? 'Write your explanation as you would in the paper, in full sentences.' : 'Write each link as one bullet in words: the quantity, which way it changes, and why. No arrows or symbols.' }));
      var nLines = rows.reduce(function (s, r) { return s + r.lines.length; }, 0);
      if (level === 'E') {
        var ta = h('textarea', { rows: '6', 'aria-label': 'Your answer', class: 'ans' }); boxes.push(ta); area.appendChild(ta);
        if (o.ctx) { var t0 = Date.now(), tm = h('p', { class: 'small muted' }); area.appendChild(tm); var iv = setInterval(function () { var m = (Date.now() - t0) / 60000, lim = 0.9 * total; tm.textContent = 'Time: ' + m.toFixed(1).replace('.', ',') + ' min of ' + lim.toFixed(1).replace('.', ',') + ' min (0,9 min per mark). The timer is only a guide.'; }, 1000); o.ctx.stop(function () { clearInterval(iv); }); }
      } else {
        rows.forEach(function (r) {
          r.lines.forEach(function (l, i) {
            var lab = level === 'D' ? 'Bullet ' + (boxes.length + 1) : QNAME[keyOf(l)];
            var ph = level === 'A' ? l.m.split(' ').slice(0, 4).join(' ') + ' …' : '';
            var ta = h('textarea', { rows: '2', class: 'ans', 'aria-label': lab, placeholder: ph });
            ta.addEventListener('paste', function (e) { e.preventDefault(); });
            boxes.push(ta); area.appendChild(h('label', { class: 'small b', text: lab })); area.appendChild(ta);
          });
        });
        if (!nLines) area.appendChild(h('p', { class: 'small muted', text: 'No explanation is asked for: the marks are for the answer.' }));
      }
      area.appendChild(h('details', { class: 'small' }, [h('summary', { text: 'What the checker looks for' }), h('ul', {}, [
        'The quantity named in full (total or external resistance, current, lost volts or Ir, terminal pd or V1, pd across the bulb, brightness or power), never just “it”.',
        'Which way it changes: increases, decreases, stays the same, rises, falls, more, less.',
        'A reason or an equation: because, so, since, therefore; or I = V/R, V = IR, I = emf/(Rext + r), Vload = emf − Ir, P = I²R, P = V²/R, pds in series add up, parallel adds a path.',
        'Words, not symbols: no arrows, ∴ or ∝, and no bare = outside a named equation.',
        'No banned claims: the emf or r changing (unless the battery changed), current used up, the battery giving the same current, voltage flowing through a part.'
      ].map(function (x) { return h('li', { text: x }); }))]));
      var res = h('div', {});
      area.appendChild(h('div', { class: 'row', style: 'margin-top:10px' }, [h('button', { class: 'btn', text: 'Check my answer', onclick: function () { selfMark(res); } })]));
      area.appendChild(res);
    }

    /* self-marking with the checker beside each tick (§7.8) */
    function selfMark(res) {
      var text = boxes.map(function (b) { return b.value; });
      var bullets = level === 'E' ? text.join(' ').split(/[.;\n]+/) : text;
      if (!text.join('').trim() && rows.some(function (r) { return r.lines.length; })) { res.innerHTML = ''; res.appendChild(h('div', { class: 'warnc', text: 'Write your bullets first.' })); return; }
      if (verdict.some(function (v) { return !v; })) { res.innerHTML = ''; res.appendChild(h('div', { class: 'warnc', text: 'Pick the answer word first.' })); return; }
      var notes = [];
      bullets.forEach(function (b, i) { bulletNotes(b, ev.id).forEach(function (n) { notes.push((level === 'E' ? '' : 'Bullet ' + (i + 1) + ': ') + n); }); });
      if (!bullets.some(function (b) { return REASON.test(b); }) && rows.some(function (r) { return r.lines.length; })) notes.push('Give the reason or the equation for each link: because, so, or an equation such as I = V/R.');
      if (!/emf|battery/i.test(text.join(' ')) && !ev.bat) notes.push(g === 10 ? 'Start with what stays the same: the emf.' : 'Start with what stays the same: the emf and r.');
      res.innerHTML = '';
      var items = [];
      rows.forEach(function (r, ri) {
        items.push({ row: ri, verdict: true, m: (r.label ? r.label + ': ' : '') + r.vm, marks: r.vmarks || 1, check: verdict[ri] === r.v });
        r.lines.forEach(function (l) { items.push({ row: ri, m: l.m, marks: 1, check: credits(l, bullets), line: l }); });
      });
      var ticks = items.map(function () { return h('input', { type: 'checkbox' }); });
      var markList = h('ul', { class: 'marks' }, items.map(function (it, i) {
        return h('li', {}, [h('label', {}, [ticks[i], h('span', { text: ' ' + it.m + (it.marks > 1 ? ' [' + it.marks + ']' : '') })])]);
      }));
      var out = h('div', {});
      res.appendChild(h('div', { class: 'card inner' }, [h('h3', { text: 'The model answer: tick each mark you earned' }), markList,
        notes.length ? h('div', { class: 'note small' }, [h('b', { text: 'The checker noticed: ' }), h('ul', {}, notes.map(function (n) { return h('li', { text: n }); }))]) : null,
        h('div', { class: 'row' }, [h('button', { class: 'btn', text: 'Done marking', onclick: finish })]), out]));
      function finish() {
        var self = 0, chk = 0, low = 0, dis = [];
        var byRow = rows.map(function () { return { self: 0, chk: 0 }; });
        items.forEach(function (it, i) {
          var t = ticks[i].checked;
          if (t) byRow[it.row].self += it.marks; if (it.check) byRow[it.row].chk += it.marks;
          if (t && !it.check) dis.push('You ticked “' + it.m + '”, but ' + (it.verdict ? 'your answer word was ' + verdict[it.row] + '.' : 'your bullets do not show this link with its direction' + (it.line && it.line.eq ? ' and its equation' : '') + '.'));
          if (!t && it.check) dis.push('The checker found “' + it.m + '” in your answer. Give yourself the mark if you agree.');
        });
        rows.forEach(function (r, ri) {
          var cap = verdict[ri] !== r.v && r.cap != null ? r.cap : 99;
          var s = Math.min(byRow[ri].self, cap), c = Math.min(byRow[ri].chk, cap);
          self += s; chk += c; low += Math.min(s, c);
        });
        var frac = low / total;
        var dd = C.load(); dd.seen = dd.seen || {}; dd.seen[g + '/' + cd.id] = 1; dd.cards = dd.cards || [];
        dd.cards.push({ id: cd.id, g: g, level: level, self: self, total: total, agree: self === chk, date: new Date().toISOString().slice(0, 10) });
        if (dd.cards.length > 200) dd.cards = dd.cards.slice(-200);
        if (frac >= 1) { dd.fullOnce = dd.fullOnce || {}; dd.fullOnce[ev.fam] = 1; }
        C.save(dd);
        var nl = bump(ev.fam, g, frac);
        out.innerHTML = '';
        var first = items.filter(function (it) { return !it.check && !it.verdict; })[0];
        out.appendChild(h('div', { class: frac >= 1 ? 'okc' : 'warnc' }, [h('b', { text: 'You gave yourself ' + self + '/' + total + '; the checker found ' + chk + '/' + total + '. ' }),
          document.createTextNode(first ? 'The first missing link: ' + first.m + ' Add it, and say why.' : 'Every link is there.')]));
        if (dis.length) out.appendChild(h('ul', { class: 'small' }, dis.map(function (x) { return h('li', { text: x }); })));
        out.appendChild(h('p', { class: 'small muted', text: 'This is practice, kept on this device only. Level for “' + C.FAM[ev.fam] + '”: ' + nl + '.' }));
        var other = list.filter(function (c) { return c !== cd; });
        out.appendChild(h('div', { class: 'row' }, [
          other.length ? h('button', { class: 'btn ghost', text: 'A fresh card', onclick: function () { card(host, o, other[(other.indexOf(cd) + 1) % other.length] || other[0], list); } }) : null,
          h('button', { class: 'btn', text: '6. Check yourself', onclick: function () { stage6(host, o); } })]));
      }
    }

    if (level === 'A' || level === 'B') selectPhase(); else writePhase();
    if (level !== 'A') box.appendChild(h('p', { class: 'small', style: 'margin-top:10px' }, [h('button', { class: 'btn ghost small', text: 'I want the worked version', onclick: function () { var d = C.load(); d.lv = d.lv || {}; d.lv[ev.fam] = 'A'; C.save(d); o.level = 'A'; card(host, o, cd, list); } })]));
  }
  function esc(s) { return String(s).replace(/[&<>]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]; }); }

  /* ---------- stage 6: one backwards item and one 'Who is right?' item per family (§7.9) ---------- */
  function back(fam, g) {
    var B = {
      rheo: g === 10 ? { q: 'V2 rose from 6,00 V to 7,20 V although the current fell from 1,50 A to 1,20 A. Which two facts explain it? Pick two.', two: true,
        o: [['The pd across the parallel pair fell (V = IR, the pair’s resistance is fixed).', 1], ['The pds in series add up to 12 V, so the rheostat takes a bigger share.', 1], ['The change reached the rheostat before the bulb.', 0], ['The emf increased.', 0]] }
        : { q: 'V2 rose from 4,50 V to 6,00 V although the current fell. Which two facts explain it? Pick two.', two: true,
        o: [['V1 rose, because the current fell and so the lost volts fell.', 1], ['V3 fell, and V2 = V1 − V3.', 1], ['The change reached the rheostat before the bulb.', 0], ['The emf increased.', 0]] },
      main: g === 10 ? { q: 'A1 fell from 1,50 A to 0,00 A and the voltmeter across S1 rose from 0,00 V to 12,00 V. Why does that voltmeter now read the emf?',
        o: [['No current flows, so no resistor has a pd, and the voltmeter’s ends sit at the potentials of the terminals.', 1], ['The open switch stores the voltage.', 0], ['The current through the voltmeter is now 12 A.', 0]] }
        : { q: 'V1 rose from 10,50 V to 12,00 V. What happened to the current, and why does that raise V1?',
        o: [['The current fell to zero, so there are no lost volts and V1 equals the emf.', 1], ['The current rose, so V1 rose.', 0], ['The emf increased when the switch opened.', 0]] },
      branch: g === 10 ? { q: 'A1 rose from 1,20 A to 1,50 A and V3 fell from 7,20 V to 6,00 V. Was a branch added or removed? Pick the two links.', two: true,
        o: [['A branch was added, so the total resistance decreased.', 1], ['The current increased, so the pd across the rheostat rose and V3 = 12 V − V2 fell.', 1], ['A branch was removed, so the current increased.', 0], ['The battery gave less voltage.', 0]] }
        : { q: 'A1 rose and V1 fell. Was a branch added or removed? Pick the two links.', two: true,
        o: [['A branch was added, so the external resistance decreased.', 1], ['The current increased, so the lost volts increased.', 1], ['A branch was removed, so the current increased.', 0], ['The emf fell.', 0]] },
      fail: { q: 'R3’s current rose from 0,50 A to 0,75 A when the bulb failed. Which explanation is right?',
        o: [['The total current fell, but all of it now goes through R3, and the pd across R3 rose.', 1], ['The bulb’s 1,00 A moved into R3.', 0], ['R3’s resistance fell.', 0]] },
      meter: { q: g === 10 ? 'V2 rose from 6,00 V to 12,00 V and the bulb went out. Which meter was put where?' : 'V1 fell to 9,00 V and the bulb went out. Which meter was put where?',
        o: [['An ammeter in V3’s place, across the bulb and R3.', 1], ['A voltmeter in A1’s place.', 0], ['An ammeter in V2’s place, across the rheostat.', 0]] },
      battery: { q: 'A1 and V1 both fell, but nobody touched the external circuit. What changed?',
        o: [['The internal resistance increased.', 1], ['The emf increased.', 0], ['The rheostat was turned up.', 0]] },
      emf: { q: 'Every current and pd rose by the same factor, 1,5. What changed?',
        o: [['The emf rose from 12 V to 18 V.', 1], ['The internal resistance fell.', 0], ['A branch was added.', 0]] }
    };
    return B[fam];
  }
  function who(fam, g, evId) {
    var W = {
      rheo: { q: 'The rheostat comes after the bulb (Circuit E). Does turning it up change the bulb?', p: [
        ['Pieter', 'No: the current reaches the bulb before the rheostat, so the bulb does not notice.', 0],
        ['Zoe', 'Yes: a series loop has one current, so the bulb dims, ' + (g === 10 ? '9,00 W to 6,61 W.' : '8,00 W to 5,88 W.'), 1],
        ['Ravi', 'Only the parts after the rheostat change.', 0]], why: 'Zoe. Pieter reasons in sequence, as if the change travels round the loop; Ravi reasons locally. The current is the same everywhere in a series loop, and it changes everywhere at once.' },
      main: { q: 'S1 is opened. What does the voltmeter across the open switch read?', p: [
        ['Thabo', 'It reads 0 V, because no current flows through it.', 0],
        ['Lerato', 'It reads 12 V, the emf, because no current flows anywhere, so no resistor has a pd.', 1],
        ['Pieter', 'It reads 6 V, because the pd is shared between the gap and the bulb.', 0]], why: 'Lerato. With no current, every resistor has V = IR = 0, so the whole emf appears across the gap.' },
      open: { q: 'S2 is open and current still flows in the rest of the circuit. What does the voltmeter across S2 read?', p: [
        ['Pieter', 'An open switch always reads the emf, so 12 V.', 0],
        ['Lerato', 'No current flows through it, so 0 V.', 0],
        ['Thabo', 'It reads the pd across its branch, 7,20 V, the same as the bulb next to it.', 1]], why: 'Thabo. R3 carries no current, so it has no pd: the voltmeter reads the pd across the whole branch. It reads the emf only when no current flows anywhere.' },
      branch: g === 10 ? { q: 'Circuit C: L2 is added in parallel with L1 on an ideal battery. Does the battery give a fixed current?', p: [
        ['Aisha', 'Yes, so L1 and L2 share 1,00 A, and L1 dims.', 0],
        ['Thabo', 'No: L1 keeps its 6 V and 1,00 A, and the battery’s current doubles to 2,00 A.', 1],
        ['Ravi', 'L1 gets brighter, because there is more current.', 0]], why: 'Thabo. An ideal battery keeps the same pd, not the same current. Each lamp has the full 6 V.' }
        : { q: 'Circuit C: L2 is added in parallel with L1. What does r change?', p: [
        ['Aisha', 'Nothing: adding L2 never changes L1, the battery just gives more current.', 0],
        ['Thabo', 'With r = 0, L1 stays at 6,00 W. With r = 1 Ω, the larger current gives more lost volts, so L1 dims from 4,41 W to 3,38 W.', 1],
        ['Ravi', 'The battery gives a fixed current, so it is shared and L1 gets half.', 0]], why: 'Thabo. Internal resistance is why adding a branch dims the others: more current, more lost volts, less terminal pd.' },
      fail: { q: 'The bulb fails. What happens to the current through R3?', p: [
        ['Aisha', 'R3 now carries the bulb’s 1,00 A as well, so 1,50 A.', 0],
        ['Thabo', 'It stays at 0,50 A, because its branch was not touched.', 0],
        ['Zoe', g === 10 ? 'The total resistance rises from 8,00 Ω to 16,00 Ω, so the total current falls to 0,75 A, and all of it now goes through R3.' : 'The external resistance rises from 7,00 Ω to 15,00 Ω, so the total current falls to 0,75 A, and all of it now goes through R3.', 1]], why: 'Zoe. Aisha treats the battery as a constant-current source; Thabo reasons locally.' },
      meter: { q: 'An ammeter is put where V3 was, across the bulb and R3. What happens?', p: [
        ['Ravi', 'An ammeter only measures current, so across the pair it just measures the pair’s current.', 0],
        ['Lerato', 'The ammeter has almost no resistance, so it short-circuits the pair: the bulb goes out and A1 rises from 1,50 A to 3,00 A.', 1],
        ['Pieter', 'The ammeter adds resistance, so A1 falls.', 0]], why: 'Lerato. A meter is part of the circuit: an ammeter is a path of almost no resistance.' },
      battery: { q: 'The battery is replaced by one with the same emf but r = 2 Ω. What happens to V1?', p: [
        ['Thabo', 'Less current means fewer lost volts, so V1 rises.', 0],
        ['Aisha', 'r doubled, so the lost volts rose from 1,50 V to 2,67 V although the current fell, and V1 fell from 10,50 V to 9,33 V.', 1],
        ['Ravi', 'The emf fell, so V1 fell.', 0]], why: 'Aisha. “Less current, fewer lost volts” works only when r is fixed.' },
      emf: { q: 'The battery is replaced by one with a larger emf. Why is the bulb brighter?', p: [
        ['Pieter', 'A bigger battery gives more current.', 0],
        ['Zoe', 'A battery with a larger emf drives a larger current through the same total resistance, so 1,50 A becomes 2,25 A.', 1],
        ['Lerato', 'The battery now has more current stored in it.', 0]], why: 'Zoe. A battery’s size is not its emf, and a battery stores energy, not current.' }
    };
    if (fam === 'branch' && (evId === 'E4' || evId === 'E4b')) return W.open;
    return W[fam];
  }
  function stage6(host, o) {
    var h = o.ctx.h, g = o.g, ev = o.ev;
    host.innerHTML = '';
    var box = h('div', { class: 'card', style: 'margin-top:16px' }, [h('h2', { text: '6. Check yourself', style: 'margin-top:0' })]);
    host.appendChild(box);
    var b = back(ev.fam, g);
    if (b) box.appendChild(mcq(h, 'Work backwards', b.q, b.o, b.two, null));
    var w = who(ev.fam, g, ev.id);
    if (w) box.appendChild(mcq(h, 'Who is right?', w.q, w.p.map(function (p) { return [p[0] + ': ' + p[1], p[2]]; }), false, w.why));
    box.appendChild(h('div', { class: 'row', style: 'margin-top:12px' }, [h('a', { class: 'btn', href: '#explain', text: 'Another change' })]));
  }
  function mcq(h, title, q, opts, two, why) {
    var sel = [], wrap = h('div', { class: 'mcq' }), fb = h('div', {});
    wrap.appendChild(h('h3', { text: title })); wrap.appendChild(h('p', { text: q }));
    var btns = opts.map(function (op, i) {
      return h('button', { class: 'tile', 'aria-pressed': 'false', text: op[0], onclick: function (e) {
        var k = sel.indexOf(i);
        if (two) { if (k >= 0) sel.splice(k, 1); else if (sel.length < 2) sel.push(i); }
        else sel = [i];
        btns.forEach(function (x, j) { x.setAttribute('aria-pressed', String(sel.indexOf(j) >= 0)); x.classList.toggle('on', sel.indexOf(j) >= 0); });
      } });
    });
    wrap.appendChild(h('div', { class: 'tiles' }, btns));
    wrap.appendChild(h('div', { class: 'row', style: 'margin-top:8px' }, [h('button', { class: 'btn ghost', text: 'Check', onclick: function () {
      var need = opts.filter(function (x) { return x[1]; }).length;
      if (sel.length < need) { fb.innerHTML = ''; fb.appendChild(h('div', { class: 'warnc', text: two ? 'Pick two.' : 'Pick one.' })); return; }
      var ok = sel.every(function (i) { return opts[i][1]; });
      fb.innerHTML = '';
      fb.appendChild(h('div', { class: ok ? 'okc' : 'warnc', text: (ok ? 'Right. ' : 'Not quite. The right answer: ' + opts.filter(function (x) { return x[1]; }).map(function (x) { return x[0]; }).join(' ') + ' ') + (why || '') }));
    } })]));
    wrap.appendChild(fb);
    return wrap;
  }

  /* ---------- the D20 check (§7.11) and the two-ammeter check (register R1), shown on the list page ---------- */
  var REASONS = [['The total resistance changed, so the current changed everywhere in the loop at once.', 1], ['The change has not reached the lamp yet.', 0], ['Only the parts after the change are affected.', 0], ['The battery gives the same current, so the lamp is unchanged.', 0]];
  function form(f, g) {
    if (f === 'P') return g === 10 ? { q: 'A lamp (3 Ω) is connected to an ideal 6 V battery in a series loop. A 3 Ω resistor is added in the loop, after the lamp in the direction of the current. What happens to the lamp?', v: 'DIMMER', note: 'The current falls from 2,00 A to 1,00 A, and the lamp from 12,00 W to 3,00 W.' }
      : { q: 'A lamp (3 Ω) is connected to a battery (emf 6 V, r = 1 Ω) in a series loop. A 2 Ω resistor is added in the loop, after the lamp in the direction of the current. What happens to the lamp?', v: 'DIMMER', note: 'The current falls from 1,50 A to 1,00 A, and the lamp from 6,75 W to 3,00 W.' };
    return g === 10 ? { q: 'Lamps L1 and L2 (4 Ω each) and a rheostat are in series with an ideal 12 V battery, in that order. The rheostat is turned down from 4 Ω to 2 Ω. What happens to L1?', v: 'BRIGHTER', note: 'The current rises from 1,00 A to 1,20 A, and L1 from 4,00 W to 5,76 W.' }
      : { q: 'Lamps L1 and L2 (4 Ω each) and a rheostat are in series with a battery (emf 9 V, r = 1 Ω), in that order. The rheostat is turned down from 3 Ω to 1 Ω. What happens to L1?', v: 'BRIGHTER', note: 'The current rises from 0,75 A to 0,90 A, and L1 from 2,25 W to 3,24 W.' };
  }
  function d20Card(h, g, which, done) {
    var d = C.load(); d.d20 = d.d20 || {};
    if (!d.d20.first) { d.d20.first = Math.random() < 0.5 ? 'P' : 'Q'; C.save(d); }
    var f = which === 'before' ? d.d20.first : (d.d20.first === 'P' ? 'Q' : 'P'), F = form(f, g), v = null, r = null;
    var box = h('div', { class: 'card', style: 'margin:14px 0' });
    box.appendChild(h('h2', { text: which === 'before' ? 'Before you start: one quick question' : 'One more quick question', style: 'margin-top:0' }));
    box.appendChild(h('p', { text: F.q }));
    var vs = h('div', { class: 'seg', role: 'group', 'aria-label': 'What happens to the lamp' }, ['BRIGHTER', 'DIMMER', 'NO CHANGE'].map(function (w) {
      return h('button', { 'aria-pressed': 'false', text: w, onclick: function (e) { v = w; Array.prototype.forEach.call(vs.querySelectorAll('button'), function (x) { x.setAttribute('aria-pressed', String(x === e.currentTarget)); }); } });
    }));
    box.appendChild(vs);
    box.appendChild(h('p', { class: 'small', text: 'Which reason fits best?' }));
    var rb = REASONS.map(function (x, i) { return h('button', { class: 'tile', 'aria-pressed': 'false', text: x[0], onclick: function () { r = i; rb.forEach(function (b, j) { b.setAttribute('aria-pressed', String(j === i)); b.classList.toggle('on', j === i); }); } }); });
    box.appendChild(h('div', { class: 'tiles' }, rb));
    var fb = h('div', {});
    box.appendChild(h('div', { class: 'row', style: 'margin-top:8px' }, [h('button', { class: 'btn', text: 'Send my answer', onclick: function () {
      if (!v || r == null) { fb.innerHTML = ''; fb.appendChild(h('div', { class: 'warnc', text: 'Pick a word and a reason.' })); return; }
      var dd = C.load(); dd.d20 = dd.d20 || {}; dd.d20[which] = { form: f, right: v === F.v && REASONS[r][1] === 1, reason: r, date: new Date().toISOString().slice(0, 10) }; C.save(dd);
      fb.innerHTML = '';
      fb.appendChild(h('div', { class: 'note', text: which === 'before' ? 'Thanks. You will meet a question like this again later, to see how your reasoning has grown. It stays on this device.' : (v === F.v && REASONS[r][1] ? 'Right. ' : 'The lamp is ' + F.v.toLowerCase() + '. ') + F.note + ' ' + REASONS[0][0] }));
      setTimeout(done, which === 'before' ? 1500 : 4000);
    } }), h('button', { class: 'btn ghost', text: 'Skip', onclick: function () { var dd = C.load(); dd.d20 = dd.d20 || {}; dd.d20[which] = { skipped: true }; C.save(dd); done(); } })]));
    box.appendChild(fb);
    return box;
  }
  function twoA(h, done) {
    var box = h('div', { class: 'card', style: 'margin:14px 0' }), fb = h('div', {});
    box.appendChild(h('h2', { text: 'Ammeters on both sides of the bulb', style: 'margin-top:0' }));
    box.appendChild(h('p', { text: 'A bulb is in a series loop with an ideal 12 V battery and a 3 Ω resistor; the bulb is 9 Ω. An ammeter is put on each side of the bulb. Will the ammeter after the bulb read MORE, LESS or THE SAME as the one before it?' }));
    box.appendChild(h('div', { class: 'seg', role: 'group', 'aria-label': 'Your prediction' }, ['MORE', 'LESS', 'THE SAME'].map(function (w) {
      return h('button', { 'aria-pressed': 'false', text: w, onclick: function () {
        fb.innerHTML = '';
        fb.appendChild(h('div', { class: w === 'THE SAME' ? 'okc' : 'warnc', text: (w === 'THE SAME' ? 'Right: ' : 'Both read the same: ') + 'each ammeter reads 1,00 A. The bulb does not use up current; it transfers energy. The same current leaves the battery and returns to it.' }));
        var d = C.load(); d.twoA = { said: w, date: new Date().toISOString().slice(0, 10) }; C.save(d);
        setTimeout(done, 4000);
      } });
    })));
    box.appendChild(fb);
    return box;
  }
  /* the list page asks Chain for a pre-list card */
  function preList(ctx, host) {
    var h = ctx.h, g = ctx.grade(), d = C.load(); d.d20 = d.d20 || {};
    function again() { host.innerHTML = ''; preList(ctx, host); }
    if (!d.d20.before) { host.appendChild(d20Card(h, g, 'before', again)); return; }
    if (!d.twoA) { host.appendChild(twoA(h, again)); return; }
    var atC = Object.keys(C.FAM).filter(function (f) { return 'CDE'.indexOf((d.lv || {})[f] || 'A') >= 0; }).length;
    if (atC >= 4 && !d.d20.after) host.appendChild(d20Card(h, g, 'after', again));
  }

  window.ChainCards = { mount: mount, CARDS: CARDS, credits: credits, bulletNotes: bulletNotes, preList: preList, back: back, who: who, cardsFor: cardsFor };
})();
