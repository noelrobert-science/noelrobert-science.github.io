/* Circuits Studio practice generators (studio_design.md §8.3). Each generator makes one item from a seed:
   a stem, an optional circuit, parts (calc, mcq or word) with exact values, traps (value → message), hints for the
   feedback ladder (§8.5) and memo-style worked lines. Values are worked out here and checked against the solver
   by test/gens.test.js. Gr 10 never shows r. Runs in the browser and in node. */
(function (root) {
  'use strict';
  var F = root.Fmt || (typeof require !== 'undefined' ? require('./fmt.js') : null);
  var N = root.Noise || (typeof require !== 'undefined' ? require('./noise.js') : null);

  function n(x, dp) { return F.num(x, dp == null ? 2 : dp); }
  function nice(x) { return String(+(+x).toFixed(4)).replace('.', ',').replace('-', '−'); }
  function u(x, unit, dp) { return n(x, dp) + ' ' + unit; }
  function rngOf(seed) { var r = N.mulberry32(seed >>> 0); return { f: r, pick: function (a) { return a[Math.floor(r() * a.length)]; }, int: function (a, b) { return a + Math.floor(r() * (b - a + 1)); } }; }
  function sum(a) { return a.reduce(function (s, x) { return s + x; }, 0); }
  function par(a) { return 1 / sum(a.map(function (x) { return 1 / x; })); }
  /* a value is usable when it does not sit on a rounding half and does not round to zero */
  function clean(x) { var s = Math.abs(x) * 100, f = s - Math.floor(s); return Math.abs(x) >= 0.005 && Math.abs(f - 0.5) > 0.02; }
  function okI(i) { return i >= 0.05 && i <= 10; }

  /* ---------- the formula list (§8.4): data-sheet forms and their rearrangements, in groups ---------- */
  var FORM = [
    { id: 'V=IR', t: 'V = IR', grp: 'ohm' }, { id: 'R=V/I', t: 'R = V/I', grp: 'ohm' }, { id: 'I=V/R', t: 'I = V/R', grp: 'ohm' },
    { id: 'RS', t: 'RS = R1 + R2 + …', grp: 'ser' }, { id: 'RP', t: '1/RP = 1/R1 + 1/R2 + …', grp: 'par' }, { id: 'RPps', t: 'RP = R1R2/(R1 + R2)', grp: 'par' },
    { id: 'emf=I(R+r)', t: 'emf = I(Rext + r)', grp: 'emf', r: 1 }, { id: 'I=emf/(R+r)', t: 'I = emf/(Rext + r)', grp: 'emf', r: 1 },
    { id: 'emf=V+Ir', t: 'emf = Vload + Vinternal resistance', grp: 'emf', r: 1 }, { id: 'V=emf-Ir', t: 'Vload = emf − Ir', grp: 'emf', r: 1 },
    { id: 'r=(emf-V)/I', t: 'r = (emf − Vload)/I', grp: 'emf', r: 1 },
    { id: 'P=VI', t: 'P = VI', grp: 'pow' }, { id: 'P=I2R', t: 'P = I²R', grp: 'pow' }, { id: 'P=V2/R', t: 'P = V²/R', grp: 'pow' },
    { id: 'I=P/V', t: 'I = P/V', grp: 'pow' }, { id: 'R=V2/P', t: 'R = V²/P', grp: 'pow' },
    { id: 'W=Pt', t: 'W = Pt', grp: 'en' }, { id: 'W=VIt', t: 'W = VIt', grp: 'en' }, { id: 'W=I2Rt', t: 'W = I²Rt', grp: 'en' }, { id: 'W=V2t/R', t: 'W = V²t/R', grp: 'en' },
    { id: 'q=It', t: 'q = It', t10: 'Q = It', grp: 'q' }, { id: 'I=q/t', t: 'I = q/t', t10: 'I = Q/t', grp: 'q' },
    { id: 'V=W/q', t: 'V = W/q', t10: 'V = W/Q', grp: 'wq' }, { id: 'W=Vq', t: 'W = Vq', t10: 'W = VQ', grp: 'wq' },
    { id: 'kWh', t: 'energy (kWh) = P (kW) × t (h)', grp: 'kwh' }, { id: 'cost', t: 'cost = energy (kWh) × tariff', grp: 'cost' }
  ];
  function formsFor(g) { return FORM.filter(function (f) { return !(g === 10 && f.r); }); }
  function formText(f, g) { return g === 10 && f.t10 ? f.t10 : f.t; }

  /* ---------- circuit builders (lattice as data/presets.js: x right, y down; battery a is −, b is +) ---------- */
  function bat(a, b, emf, r) { return { id: 'B', kind: 'battery', a: a, b: b, emf: emf, r: r || 0 }; }
  /* resistors in series along the bottom; an ammeter (or a switch and an ammeter) on the left */
  function seriesSpec(emf, r, Rs, o) {
    o = o || {};
    var k = Rs.length, end = 1 + 2 * k, right = end + 1, mid = right / 2;
    var parts = [bat([mid + 1, 0], [mid - 1, 0], emf, r)], wires = [];
    if (o.sw) { parts.push({ id: 'S', kind: 'switch', a: [0, 0], b: [0, 1], closed: !o.open }); wires.push([[mid - 1, 0], [0, 0]]); }
    else wires.push([[mid - 1, 0], [0, 0], [0, 1]]);
    parts.push({ id: 'A', kind: 'ammeter', a: [0, 1], b: [0, 2] });
    wires.push([[0, 2], [0, 3], [1, 3]]);
    Rs.forEach(function (R, i) { parts.push({ id: (o.ids || [])[i] || 'R' + (i + 1), kind: o.kind || 'resistor', a: [1 + 2 * i, 3], b: [3 + 2 * i, 3], R: R }); });
    wires.push([[end, 3], [right, 3], [right, 0], [mid + 1, 0]]);
    if (o.v1) parts.push({ id: 'V1', kind: 'voltmeter', a: [mid + 1, 0], b: [mid - 1, 0], side: 'up' });
    if (o.vs) parts.push({ id: 'Vs', kind: 'voltmeter', a: [0, 0], b: [0, 1], side: 'left' });
    if (o.vr) parts.push({ id: 'V2', kind: 'voltmeter', a: [1, 3], b: [3, 3], side: 'down' });
    return { parts: parts, wires: wires };
  }
  /* resistors in parallel across the battery (2 or 3 branches) */
  function parallelSpec(emf, r, Rs, o) {
    o = o || {};
    var parts = [bat([4, 0], [2, 0], emf, r), { id: 'A', kind: 'ammeter', a: [0, 1], b: [0, 2] }];
    var wires = [[[2, 0], [0, 0], [0, 1]], [[0, 2], [0, 3], [1, 3]]];
    Rs.forEach(function (R, i) {
      var y = 3 + i;
      if (i > 0) { wires.push([[1, y - 1], [1, y]]); wires.push([[5, y], [5, y - 1]]); }
      if (o.a2 && i === 0) { parts.push({ id: 'A2', kind: 'ammeter', a: [1, y], b: [2, y] }); }
      else wires.push([[1, y], [2, y]]);
      parts.push({ id: 'R' + (i + 1), kind: 'resistor', a: [2, y], b: [4, y], R: R });
      wires.push([[4, y], [5, y]]);
    });
    wires.push([[5, 3], [5, 0], [4, 0]]);
    if (o.v1) parts.push({ id: 'V1', kind: 'voltmeter', a: [4, 0], b: [2, 0], side: 'up' });
    return { parts: parts, wires: wires };
  }
  /* a series resistor, then a parallel pair (Circuit A's shape); o.a2 puts an ammeter in the R2 branch */
  function comboSpec(emf, r, Rs, Ra, Rb, o) {
    o = o || {};
    var parts = [bat([4, 0], [2, 0], emf, r), { id: 'A1', kind: 'ammeter', a: [0, 1], b: [0, 2] },
      { id: 'R1', kind: 'resistor', a: [1, 3], b: [3, 3], R: Rs },
      { id: 'R2', kind: 'resistor', a: [5, 3], b: [7, 3], R: Ra }, { id: 'R3', kind: 'resistor', a: [5, 4], b: [7, 4], R: Rb }];
    var wires = [[[2, 0], [0, 0], [0, 1]], [[0, 2], [0, 3], [1, 3]], [[3, 3], [4, 3]], [[4, 3], [4, 4]], [[4, 4], [5, 4]], [[7, 4], [7, 3], [7, 0], [4, 0]]];
    if (o.a2) parts.push({ id: 'A2', kind: 'ammeter', a: [4, 3], b: [5, 3] }); else wires.push([[4, 3], [5, 3]]);
    if (o.v1) parts.push({ id: 'V1', kind: 'voltmeter', a: [4, 0], b: [2, 0], side: 'up' });
    if (o.v2) parts.push({ id: 'V2', kind: 'voltmeter', a: [1, 3], b: [3, 3], side: 'down', off: 0.62 });
    if (o.v3) parts.push({ id: 'V3', kind: 'voltmeter', a: [4, 4], b: [7, 4], side: 'down' });
    return { parts: parts, wires: wires };
  }
  /* a series pair in one branch, in parallel with a third resistor (Circuit B2's shape) */
  function pairBranchSpec(emf, r, R1, R2, R3) {
    return { parts: [bat([4, 0], [2, 0], emf, r), { id: 'A', kind: 'ammeter', a: [0, 1], b: [0, 2] },
      { id: 'R1', kind: 'resistor', a: [1, 3], b: [3, 3], R: R1 }, { id: 'R2', kind: 'resistor', a: [3, 3], b: [5, 3], R: R2 },
      { id: 'R3', kind: 'resistor', a: [2, 4], b: [5, 4], R: R3 }, { id: 'V1', kind: 'voltmeter', a: [4, 0], b: [2, 0], side: 'up' }],
      wires: [[[2, 0], [0, 0], [0, 1]], [[0, 2], [0, 3], [1, 3]], [[1, 3], [1, 4], [2, 4]], [[5, 3], [6, 3]], [[5, 4], [6, 4], [6, 3]], [[6, 3], [6, 0], [4, 0]]] };
  }

  /* ---------- item helpers ---------- */
  /* a calc part: f(v) gives the exact value from earlier answers v (follow-through); forms are formula groups */
  function C(key, ask, unit, forms, f, o) { o = o || {}; return { key: key, kind: 'calc', ask: ask, unit: unit, forms: forms, f: f, traps: o.traps || [], inter: o.inter || [], hint1: o.hint1, hint2: o.hint2, gap: o.gap, hl: o.hl || [], work: o.work }; }
  function T(v, msg, mus) { return { v: v, msg: msg, mus: mus || null }; }
  function MCQ(key, ask, right, wrongs, why) { return { key: key, kind: 'mcq', ask: ask, opts: [{ t: right, ok: true }].concat(wrongs.map(function (w) { return { t: w[0], why: w[1] }; })), why: why }; }
  function grade10(g) { return g === 10; }
  function rOK(g, s) { return g >= 11; }
  function idealNote(g, r) { return g === 10 || !r ? (g === 10 ? 'The battery is ideal (no internal resistance).' : 'The battery has negligible internal resistance.') : ''; }
  function emfWord(g) { return 'emf'; }

  /* exact values of every calc part, in order, from the item's own functions */
  function exact(item) { var v = {}; item.parts.forEach(function (p) { if (p.kind === 'calc') v[p.key] = p.f(v); }); return v; }

  var E12 = [2, 3, 4, 5, 6, 8, 10, 12, 15, 20, 24, 30];
  var EMF = [3, 4.5, 6, 9, 12, 18, 24];
  var RINT = [0.2, 0.25, 0.5, 1, 1.5, 2];
  var PAIRS = [[4, 12], [6, 12], [6, 3], [10, 15], [20, 30], [8, 8], [12, 4], [3, 6], [5, 20]];

  /* try a maker until its values are usable (§8.3 rule); the seed moves on each retry */
  function draw(seed, maker) {
    for (var k = 0; k < 60; k++) { var it = maker(rngOf(seed * 7919 + k * 104729 + 13)); if (it) { it.seed = seed; return it; } }
    throw new Error('no usable values');
  }

  /* ---------- the generators (§8.3) ---------- */
  var GEN = {};
  function G(id, o) { o.id = id; GEN[id] = o; }

  G('charge', { topic: 'T1', grades: [10, 11, 12], title: 'Charge and current', sags: ['P-E1.2'], make: function (R, g, s) {
    var I = R.pick([0.2, 0.25, 0.4, 0.5, 0.8, 1.2, 1.5, 2, 2.5, 3, 4]), Q = g === 10 ? 'Q' : 'q';
    if (s >= 3) {
      var q = R.pick([12, 18, 24, 30, 45, 60, 90, 120, 150, 180]), mins = R.pick([1, 2, 3, 4, 5]), t = mins * 60, Ix = q / t;
      if (!clean(Ix) || !okI(Ix)) return null;
      return { stem: 'A charge of ' + nice(q) + ' C passes a point in a wire in ' + mins + ' minute' + (mins > 1 ? 's' : '') + '.', parts: [
        C('a', 'Calculate the current in the wire.', 'A', ['q'], function () { return q / t; }, { traps: [T(q / mins, 'Change minutes to seconds: × 60.', 'X9')], hint1: 'Current is the rate of flow of charge: how many coulombs pass each second?', hint2: 'I = ' + Q + '/t = ' + nice(q) + '/(' + mins + ' × 60)', work: ['I = ' + Q + '/t', '= ' + nice(q) + '/' + t, '= ' + u(Ix, 'A')] })] };
    }
    var useMin = s >= 2, mins2 = R.pick([2, 3, 4, 5, 8, 10]), secs = R.pick([10, 20, 30, 40, 50, 60, 90, 120]), t2 = useMin ? mins2 * 60 : secs;
    var qv = I * t2;
    return { stem: 'A current of ' + nice(I) + ' A flows in a conductor for ' + (useMin ? mins2 + ' minutes' : secs + ' s') + '.', parts: [
      C('a', 'Calculate the charge that passes a point in the conductor.', 'C', ['q'], function () { return I * t2; }, { traps: useMin ? [T(I * mins2, 'Change minutes to seconds: × 60.', 'X9')] : [T(I / t2, Q + ' = It: multiply, do not divide.')], hint1: 'Charge is current × time, with the time in seconds.', hint2: Q + ' = It = ' + nice(I) + ' × ' + (useMin ? mins2 + ' × 60' : t2), work: [Q + ' = It', '= ' + nice(I) + ' × ' + t2, '= ' + u(qv, 'C')] })] };
  } });

  G('energy-q', { topic: 'T1', grades: [10, 11, 12], title: 'pd: energy per coulomb', sags: ['P-E1.3'], make: function (R, g, s) {
    var V = R.pick([1.5, 3, 4.5, 6, 9, 12, 24]), q = R.pick([2, 5, 8, 10, 15, 20, 40, 50, 100, 250]), Q = g === 10 ? 'Q' : 'q', W = V * q;
    if (s >= 2) {
      return { stem: 'A battery transfers ' + nice(W) + ' J of energy to ' + nice(q) + ' C of charge that passes through it.', parts: [
        C('a', 'Calculate the potential difference across the battery’s terminals.', 'V', ['wq'], function () { return W / q; }, { traps: [T(q / W, 'pd is energy per coulomb: V = W/' + Q + ', not ' + Q + '/W.'), T(W * q, 'Divide: V = W/' + Q + '.')], hint1: 'pd is the energy transferred per coulomb of charge.', hint2: 'V = W/' + Q + ' = ' + nice(W) + '/' + nice(q), work: ['V = W/' + Q, '= ' + nice(W) + '/' + nice(q), '= ' + u(V, 'V')] })] };
    }
    return { stem: 'The potential difference across a lamp is ' + nice(V) + ' V. A charge of ' + nice(q) + ' C passes through it.', parts: [
      C('a', 'Calculate the energy transferred in the lamp.', 'J', ['wq'], function () { return V * q; }, { traps: [T(V / q, 'pd is energy per coulomb, so W = V' + Q + '.'), T(q / V, 'pd is energy per coulomb, so W = V' + Q + '.')], hint1: 'Each coulomb transfers ' + nice(V) + ' J. How many coulombs pass?', hint2: 'W = V' + Q + ' = ' + nice(V) + ' × ' + nice(q), work: ['W = V' + Q, '= ' + nice(V) + ' × ' + nice(q), '= ' + u(W, 'J')] })] };
  } });

  G('ohm', { topic: 'T2', grades: [10, 11, 12], title: 'Ohm’s law', sags: ['P-E2.1'], make: function (R, g, s) {
    var Rv = R.pick(E12.concat([47, 100, 220])), I = R.pick([0.1, 0.2, 0.25, 0.4, 0.5, 0.8, 1.2, 1.5, 2]), V = Rv * I;
    if (V > 240) return null;
    if (s === 1) return { stem: 'The pd across a resistor is ' + nice(V) + ' V and the current through it is ' + nice(I) + ' A.', parts: [
      C('a', 'Calculate the resistance of the resistor.', 'Ω', ['ohm'], function () { return V / I; }, { traps: [T(I / V, 'R = V/I, not I/V.'), T(V * I, 'R = V/I: divide the pd by the current.')], hint1: 'Resistance is the pd per ampere of current.', hint2: 'R = V/I = ' + nice(V) + '/' + nice(I), work: ['R = V/I', '= ' + nice(V) + '/' + nice(I), '= ' + u(Rv, 'Ω')] })] };
    if (s === 2) return { stem: 'A current of ' + nice(I) + ' A flows through a ' + nice(Rv) + ' Ω resistor.', parts: [
      C('a', 'Calculate the pd across the resistor.', 'V', ['ohm'], function () { return Rv * I; }, { traps: [T(Rv / I, 'V = IR: multiply.'), T(I / Rv, 'V = IR: multiply.')], hint1: 'pd = current × resistance for this resistor.', hint2: 'V = IR = ' + nice(I) + ' × ' + nice(Rv), work: ['V = IR', '= ' + nice(I) + ' × ' + nice(Rv), '= ' + u(V, 'V')] })] };
    var V2 = R.pick([1.5, 3, 4.5, 6, 9, 12]), I2 = V2 / Rv;
    if (!clean(I2) || !okI(I2)) return null;
    return { stem: 'A pd of ' + nice(V2) + ' V is applied across a ' + nice(Rv) + ' Ω resistor.', parts: [
      C('a', 'Calculate the current through the resistor.', 'A', ['ohm'], function () { return V2 / Rv; }, { traps: [T(Rv / V2, 'I = V/R: the pd divided by the resistance.'), T(V2 * Rv, 'I = V/R: divide.')], hint1: 'Use Ohm’s law for this one resistor.', hint2: 'I = V/R = ' + nice(V2) + '/' + nice(Rv), work: ['I = V/R', '= ' + nice(V2) + '/' + nice(Rv), '= ' + u(I2, 'A')] })] };
  } });

  G('series', { topic: 'T3', grades: [10, 11, 12], title: 'Resistors in series', sags: ['P-E1.6'], make: function (R, g, s) {
    var k = s >= 2 ? R.pick([2, 3]) : 2, Rs = [], i;
    for (i = 0; i < k; i++) Rs.push(R.pick(E12.slice(0, 9)));
    var emf = R.pick(EMF), RS = sum(Rs), I = emf / RS, V1 = I * Rs[0];
    if (!okI(I) || !clean(I) || !clean(V1)) return null;
    var list = Rs.map(nice).join(' Ω, ') + ' Ω';
    var parts = [
      C('a', 'Calculate the total resistance of the circuit.', 'Ω', ['ser'], function () { return RS; }, { traps: [T(par(Rs), 'That is the parallel rule. In series, add.'), T(1 / RS, 'In series, add the resistances: RS = R1 + R2 + …')], hint1: 'The same current passes through every resistor, one after the other.', hint2: 'RS = ' + Rs.map(nice).join(' + '), work: ['RS = R1 + R2' + (k > 2 ? ' + R3' : ''), '= ' + Rs.map(nice).join(' + '), '= ' + u(RS, 'Ω')] }),
      C('b', 'Calculate the reading on the ammeter.', 'A', ['ohm'], function (v) { return emf / v.a; }, { traps: [T(emf / Rs[0], 'Use the total resistance of the circuit, not one resistor.', 'X5')], hint1: 'The ammeter reads the current through the whole circuit.', hint2: 'I = V/R = ' + nice(emf) + '/RS', work: ['I = V/R', '= ' + nice(emf) + '/' + n(RS), '= ' + u(I, 'A')] })];
    if (s >= 2) parts.push(C('c', 'Calculate the pd across R1.', 'V', ['ohm'], function (v) { return v.b * Rs[0]; }, { traps: [T(emf, 'The resistors share the emf: V1 = IR1.', 'X13')], hint1: 'R1 carries the circuit current.', hint2: 'V = IR = I × ' + nice(Rs[0]), work: ['V = IR', '= ' + n(I) + ' × ' + nice(Rs[0]), '= ' + u(V1, 'V')] }));
    return { stem: 'Resistors of ' + list + ' are connected in series to a battery of emf ' + nice(emf) + ' V. ' + idealNote(g, 0), spec: seriesSpec(emf, 0, Rs), hide: { A: 1 }, parts: parts };
  } });

  G('parallel', { topic: 'T3', grades: [10, 11, 12], title: 'Resistors in parallel', sags: ['P-E1.6'], make: function (R, g, s) {
    var k = s >= 3 ? 3 : 2, Rs = [];
    for (var i = 0; i < k; i++) Rs.push(R.pick([3, 4, 6, 8, 10, 12, 15, 20, 30]));
    var emf = R.pick(EMF), RP = par(Rs), I = emf / RP, I1 = emf / Rs[0];
    if (!clean(RP) || !clean(1 / RP) || !okI(I) || !clean(I) || !clean(I1)) return null;
    var parts = [
      C('a', 'Calculate the total resistance of the resistors.', 'Ω', ['par'], function () { return RP; }, { inter: [1 / RP], traps: [T(1 / RP, 'That is 1/RP. Now take the reciprocal.'), T(sum(Rs), 'That is the series rule. In parallel, add the reciprocals.'), T(sum(Rs) / k, 'Not the average: add the reciprocals.')], hint1: 'Each resistor is another path for the current, so RP is smaller than the smallest resistor.', hint2: '1/RP = ' + Rs.map(function (x) { return '1/' + nice(x); }).join(' + '), work: ['1/RP = ' + Rs.map(function (x, j) { return '1/R' + (j + 1); }).join(' + '), '= ' + Rs.map(function (x) { return '1/' + nice(x); }).join(' + '), '1/RP = ' + n(1 / RP, 3) + ' Ω⁻¹, so RP = ' + u(RP, 'Ω')] }),
      C('b', 'Calculate the current through R1.', 'A', ['ohm'], function () { return emf / Rs[0]; }, { traps: [T(I / k, 'The current does not split equally unless the branches are equal: use I = V/R for this branch.'), T(I, 'That is the total current. Each branch has the full pd across it.', 'X5')], hint1: 'What is the pd across each branch?', hint2: 'I1 = V/R1 = ' + nice(emf) + '/' + nice(Rs[0]), work: ['I = V/R', '= ' + nice(emf) + '/' + nice(Rs[0]), '= ' + u(I1, 'A')] })];
    if (s >= 2) parts.push(C('c', 'Calculate the reading on the ammeter.', 'A', ['ohm'], function (v) { return emf / v.a; }, { traps: [T(I1, 'The ammeter carries the current of every branch.', 'X5')], hint1: 'The ammeter is in the main line.', hint2: 'I = V/RP = ' + nice(emf) + '/RP', work: ['I = V/R', '= ' + nice(emf) + '/' + n(RP), '= ' + u(I, 'A')] }));
    return { stem: 'Resistors of ' + Rs.map(nice).join(' Ω, ') + ' Ω are connected in parallel to a battery of emf ' + nice(emf) + ' V. ' + idealNote(g, 0), spec: parallelSpec(emf, 0, Rs), hide: { A: 1 }, parts: parts };
  } });

  function comboVals(R, g, withR) {
    var pr = R.pick(PAIRS), Rs = R.pick([2, 3, 4, 5, 6]), emf = R.pick([6, 9, 12, 18, 24]), r = withR ? R.pick([0.5, 1, 2]) : 0;
    var RP = par(pr), Rt = Rs + RP + r, I = emf / Rt, Vp = I * RP, Ia = Vp / pr[0], Ib = Vp / pr[1];
    if (!okI(I) || !okI(Ia) || !okI(Ib) || ![RP, I, Vp, Ia, Ib, I * Rs, I * r].every(function (x) { return x === 0 || clean(x); })) return null;
    return { pr: pr, Rs: Rs, emf: emf, r: r, RP: RP, Rt: Rt, I: I, Vp: Vp, Ia: Ia, Ib: Ib };
  }
  G('combo', { topic: 'T3', grades: [10, 11, 12], title: 'Series and parallel together', sags: ['P-E1.6'], make: function (R, g, s) {
    var c = comboVals(R, g, false); if (!c) return null;
    var parts = [
      C('a', 'Calculate the resistance of the parallel pair (R2 and R3).', 'Ω', ['par'], function () { return c.RP; }, { inter: [1 / c.RP], traps: [T(1 / c.RP, 'That is 1/RP. Now take the reciprocal.'), T(c.pr[0] + c.pr[1], 'That is the series rule. R2 and R3 are in parallel.')], hint1: 'R2 and R3 sit side by side between the same two junctions.', hint2: '1/RP = 1/' + nice(c.pr[0]) + ' + 1/' + nice(c.pr[1]), work: ['1/RP = 1/R2 + 1/R3', '= 1/' + nice(c.pr[0]) + ' + 1/' + nice(c.pr[1]), 'RP = ' + u(c.RP, 'Ω')] }),
      C('b', 'Calculate the total resistance of the circuit.', 'Ω', ['ser'], function (v) { return c.Rs + v.a; }, { traps: [T(par([c.Rs, c.pr[0], c.pr[1]]), 'R1 is in series with the pair: add it.'), T(c.Rs + c.pr[0] + c.pr[1], 'Use RP for the pair, then add R1.')], hint1: 'Which resistor carries the whole current?', hint2: 'R = R1 + RP = ' + nice(c.Rs) + ' + RP', work: ['R = R1 + RP', '= ' + nice(c.Rs) + ' + ' + n(c.RP), '= ' + u(c.Rs + c.RP, 'Ω')] })];
    if (s >= 2) parts.push(C('c', 'Calculate the reading on A1.', 'A', ['ohm'], function (v) { return c.emf / v.b; }, { traps: [T(c.emf / c.Rs, 'You used only the series resistor. Use the total resistance.'), T(c.emf / c.RP, 'You used only the pair. Use the total resistance.')], hint1: 'A1 is in the main line: it carries the current from the battery.', hint2: 'I = V/R = ' + nice(c.emf) + '/R', work: ['I = V/R', '= ' + nice(c.emf) + '/' + n(c.Rs + c.RP), '= ' + u(c.I, 'A')] }));
    if (s >= 3) {
      parts.push(C('d', 'Calculate the pd across R3.', 'V', ['ohm'], function (v) { return v.c * v.a; }, { traps: [T(c.emf, 'R1 takes part of the pd. Use V = IR for the pair.', 'X13'), T(c.I * c.Rs, 'That is the pd across R1.', 'X5')], hint1: 'R3 has the same pd as the pair. Which current passes through the pair as a whole?', hint2: 'Vpair = I × RP', work: ['V = IR', '= ' + n(c.I) + ' × ' + n(c.RP), '= ' + u(c.Vp, 'V')] }));
      parts.push(C('e', 'Calculate the current through R3.', 'A', ['ohm'], function (v) { return v.d / c.pr[1]; }, { traps: [T(c.I / 2, 'The current splits in inverse ratio, not in half.'), T(c.I, 'That is the total current.', 'X5')], hint1: 'Use the pd across R3 and its own resistance.', hint2: 'I3 = V3/R3 = V3/' + nice(c.pr[1]), work: ['I = V/R', '= ' + n(c.Vp) + '/' + nice(c.pr[1]), '= ' + u(c.Ib, 'A')] }));
    }
    return { stem: 'R1 = ' + nice(c.Rs) + ' Ω is in series with R2 = ' + nice(c.pr[0]) + ' Ω and R3 = ' + nice(c.pr[1]) + ' Ω in parallel. The battery’s emf is ' + nice(c.emf) + ' V. ' + idealNote(g, 0), spec: comboSpec(c.emf, 0, c.Rs, c.pr[0], c.pr[1]), hide: { A1: 1 }, parts: parts };
  } });

  G('share', { topic: 'T3', grades: [10, 11, 12], title: 'Where the volts go', sags: ['P-E1.6'], make: function (R, g, s) {
    var c = comboVals(R, g, false); if (!c) return null;
    return { stem: 'R1 = ' + nice(c.Rs) + ' Ω is in series with R2 = ' + nice(c.pr[0]) + ' Ω and R3 = ' + nice(c.pr[1]) + ' Ω in parallel, on a ' + nice(c.emf) + ' V battery. ' + idealNote(g, 0) + ' A1 reads ' + u(c.I, 'A') + '.', spec: comboSpec(c.emf, 0, c.Rs, c.pr[0], c.pr[1], { v2: 1, v3: 1 }), hide: { V2: 1, V3: 1 }, parts: [
      C('a', 'Calculate the reading on V2 (across R1).', 'V', ['ohm'], function () { return c.I * c.Rs; }, { traps: [T(c.emf * c.Rs / (c.Rs + c.pr[0] + c.pr[1]), 'A ratio guess using all three resistors. Use V = IR with A1’s current.', 'X13')], hint1: 'R1 carries the whole current.', hint2: 'V2 = I × R1 = ' + n(c.I) + ' × ' + nice(c.Rs), work: ['V = IR', '= ' + n(c.I) + ' × ' + nice(c.Rs), '= ' + u(c.I * c.Rs, 'V')] }),
      C('b', 'Calculate the reading on V3 (across the pair).', 'V', ['ohm', 'ser'], function (v) { return c.emf - v.a; }, { traps: [T(c.emf, 'R1 takes part of the emf.', 'X13'), T(c.emf / 2, 'The pd does not split in half: the pds in series add up to the emf.', 'X13')], hint1: 'The pds around the loop add up to the emf.', hint2: 'V3 = emf − V2', work: ['emf = V2 + V3', 'V3 = ' + nice(c.emf) + ' − ' + n(c.I * c.Rs), '= ' + u(c.Vp, 'V')] })] };
  } });

  G('chainback', { topic: 'T3', grades: [10, 11, 12], title: 'From one branch current to the emf', sags: ['P-E1.6', 'P-E3.4'], make: function (R, g, s) {
    var withR = g >= 11 && s >= 2, c = comboVals(R, g, withR); if (!c) return null;
    var parts = [
      C('a', 'Calculate the pd across R2.', 'V', ['ohm'], function () { return c.Ia * c.pr[0]; }, { hint1: 'A2 tells you the current in R2.', hint2: 'V = IR = ' + n(c.Ia) + ' × ' + nice(c.pr[0]), work: ['V = IR', '= ' + n(c.Ia) + ' × ' + nice(c.pr[0]), '= ' + u(c.Vp, 'V')] }),
      C('b', 'Calculate the current through R3.', 'A', ['ohm'], function (v) { return v.a / c.pr[1]; }, { traps: [T(c.Ia, 'R3 has the same pd as R2, but not the same current.')], hint1: 'R2 and R3 are in parallel: what do they share?', hint2: 'I3 = V/R3 = V/' + nice(c.pr[1]), work: ['I = V/R', '= ' + n(c.Vp) + '/' + nice(c.pr[1]), '= ' + u(c.Ib, 'A')] }),
      C('c', 'Calculate the reading on A1.', 'A', ['ser', 'ohm'], function (v) { return c.Ia + v.b; }, { traps: [T(c.Ia, 'A1 carries both branch currents.', 'X5')], hint1: 'The branch currents join again before A1.', hint2: 'I = I2 + I3', work: ['I = I2 + I3', '= ' + n(c.Ia) + ' + ' + n(c.Ib), '= ' + u(c.I, 'A')] }),
      C('d', 'Calculate the pd across R1.', 'V', ['ohm'], function (v) { return v.c * c.Rs; }, { traps: [T(c.Ia * c.Rs, 'R1 carries the total current, not the branch current.', 'X5')], hint1: 'R1 is in the main line.', hint2: 'V = IR = I × ' + nice(c.Rs), work: ['V = IR', '= ' + n(c.I) + ' × ' + nice(c.Rs), '= ' + u(c.I * c.Rs, 'V')] })];
    if (withR) parts.push(C('e', 'Calculate the emf of the battery.', 'V', ['emf'], function (v) { return v.a + v.d + v.c * c.r; }, { traps: [T(c.Vp + c.I * c.Rs, 'That is the terminal pd. Add the lost volts, Ir.')], hint1: 'The emf equals the terminal pd plus the lost volts.', hint2: 'emf = Vload + Ir = (V across R1 + V across the pair) + I × ' + nice(c.r), work: ['emf = Vload + Ir', '= (' + n(c.I * c.Rs) + ' + ' + n(c.Vp) + ') + ' + n(c.I) + ' × ' + nice(c.r), '= ' + u(c.emf, 'V')] }));
    else parts.push(C('e', 'Calculate the emf of the battery.', 'V', ['ser'], function (v) { return v.a + v.d; }, { traps: [T(c.Vp, 'Add the pd across R1 as well.')], hint1: 'The pds around the loop add up to the emf.', hint2: 'emf = V(R1) + V(pair)', work: ['emf = V1 + Vpair', '= ' + n(c.I * c.Rs) + ' + ' + n(c.Vp), '= ' + u(c.emf, 'V')] }));
    var spec = comboSpec(c.emf, c.r, c.Rs, c.pr[0], c.pr[1], { a2: 1 });
    return { stem: 'R1 = ' + nice(c.Rs) + ' Ω is in series with R2 = ' + nice(c.pr[0]) + ' Ω and R3 = ' + nice(c.pr[1]) + ' Ω in parallel. A2 reads ' + u(c.Ia, 'A') + '. ' + (withR ? 'The battery has an internal resistance of ' + nice(c.r) + ' Ω.' : idealNote(g, 0)), spec: spec, hide: { A1: 1 }, hideEmf: true, parts: parts };
  } });

  G('identical', { topic: 'T3', grades: [10, 11], title: 'Identical bulbs: rank the brightness', sags: ['P-E1.6', 'P-E2.3'], make: function (R, g, s) {
    var v = R.pick([0, 1, 2]);
    if (v === 0) return { stem: 'Three identical bulbs: X is in series with Y and Z, which are in parallel with each other. The battery is ideal.', spec: { parts: [bat([4, 0], [2, 0], 12, 0), { id: 'X', kind: 'bulb', a: [1, 3], b: [3, 3], R: 4 }, { id: 'Y', kind: 'bulb', a: [4, 3], b: [6, 3], R: 4 }, { id: 'Z', kind: 'bulb', a: [4, 4], b: [6, 4], R: 4 }], wires: [[[2, 0], [0, 0], [0, 3], [1, 3]], [[3, 3], [4, 3]], [[3, 3], [3, 4], [4, 4]], [[6, 3], [7, 3]], [[6, 4], [7, 4], [7, 3]], [[7, 3], [7, 0], [4, 0]]] }, parts: [
      MCQ('a', 'Rank the bulbs from brightest to dimmest.', 'X brightest; Y and Z equal and dimmer', [['All three equally bright', 'They are not all in the same arrangement: X carries the current of both Y and Z.'], ['Y and Z brightest; X dimmest', 'X carries the total current, so X has the larger pd and the larger power.'], ['X, then Y, then Z', 'Y and Z are identical and in parallel: they have the same pd, so they are equally bright.']], 'X carries the whole current; Y and Z share it. So X has twice their current, four times their power.')] };
    if (v === 1) return { stem: 'Two identical bulbs are connected in series to an ideal battery. Two more identical bulbs are connected in parallel to an identical battery.', parts: [
      MCQ('a', 'How does the brightness of one bulb in series compare with one bulb in parallel?', 'The bulb in parallel is brighter', [['They are equally bright', 'Compare each bulb’s pd: in series each gets half the emf; in parallel each gets the full emf.'], ['The bulb in series is brighter', 'In series each bulb gets half the emf, so it has a quarter of the power of a bulb with the full emf.'], ['It depends on which bulb is first', 'Current is not used up: the order of series bulbs does not matter.']], 'In parallel each bulb has the full emf across it; in series each has half.')] };
    return { stem: 'Two identical bulbs, P and Q, are in parallel across an ideal battery. A switch in Q’s branch is opened.', parts: [
      MCQ('a', 'What happens to the brightness of P?', 'It stays the same', [['It becomes brighter', 'An ideal battery keeps the same pd across P, so P’s current and power do not change.'], ['It becomes dimmer', 'P has the same pd as before: the full emf.'], ['It goes out', 'P is on its own path, which is still complete.']], 'With an ideal battery the pd across each branch is the emf, whatever the other branches do.')] };
  } });

  G('mcq', { topic: 'T3', grades: [10, 11, 12], title: 'Current in terms of emf and R', sags: ['P-E1.6'], make: function (R, g, s) {
    var v = R.pick([0, 1, 2]);
    var shapes = [
      { d: 'Three identical resistors, each of resistance R: two in parallel, then in series with the third.', ok: '2ε/(3R)', w: [['3ε/(2R)', 'The fraction is upside down: Rtotal = R + R/2 = 3R/2, so I = ε ÷ 3R/2.'], ['ε/(3R)', 'That treats all three as in series.'], ['ε/R', 'That ignores the pair.']] },
      { d: 'Three identical resistors, each of resistance R, all in parallel.', ok: '3ε/R', w: [['ε/(3R)', 'That is the series answer: in parallel, Rtotal = R/3.'], ['ε/R', 'That is one branch only.'], ['R/(3ε)', 'The fraction is upside down.']] },
      { d: 'Two identical resistors, each of resistance R, in series with each other, and that pair in parallel with a third identical resistor.', ok: '3ε/(2R)', w: [['2ε/(3R)', 'The fraction is upside down: Rtotal = (2R × R)/(3R) = 2R/3.'], ['ε/(3R)', 'That treats all three as in series.'], ['3ε/R', 'That treats all three as in parallel.']] }];
    var sh = shapes[v];
    return { stem: sh.d + ' They are connected to a battery of emf ε with negligible internal resistance.', parts: [MCQ('a', 'Which expression gives the current from the battery?', sh.ok, sh.w, 'Find Rtotal in terms of R first, then I = ε/Rtotal.')] };
  } });

  G('matched', { topic: 'T3', grades: [10, 11, 12], title: 'Matched values', sags: ['P-E1.6', 'P-E2.1'], make: function (R, g, s) {
    var c = comboVals(R, g, false); if (!c) return null;
    var spec = comboSpec(c.emf, 0, c.Rs, c.pr[0], c.pr[1], { a2: 1, v3: 1, v1: 1 });
    return { stem: 'Use the meter readings on the circuit. ' + idealNote(g, 0), spec: spec, hideR: ['R3'], parts: [
      C('a', 'Calculate the current through R3.', 'A', ['ser'], function () { return c.I - c.Ia; }, { traps: [T(c.I, 'That is the current in the main line.', 'X5'), T(c.Ia, 'That is the current in R2.', 'X5')], hint1: 'The current in the main line splits between R2 and R3.', hint2: 'I3 = A1 − A2', work: ['I3 = I − I2', '= ' + n(c.I) + ' − ' + n(c.Ia), '= ' + u(c.Ib, 'A')] }),
      C('b', 'Calculate the resistance of R3.', 'Ω', ['ohm'], function (v) { return c.Vp / v.a; }, { traps: [T(c.Vp / c.I, 'Matched values: V3 belongs with R3’s own current, not A1’s.', 'X5'), T(c.emf / c.Ib, 'R3’s pd is V3, not the emf.', 'X5')], hint1: 'Use the pd across R3 and the current through R3: both must belong to R3.', hint2: 'R3 = V3/I3 = ' + n(c.Vp) + '/I3', work: ['R = V/I', '= ' + n(c.Vp) + '/' + n(c.Ib), '= ' + u(c.pr[1], 'Ω')] })] };
  } });

  G('openV', { topic: 'T7', grades: [10, 11, 12], title: 'Readings with a switch open', sags: ['P-E3.1'], make: function (R, g, s) {
    var emf = R.pick(EMF), r = g >= 11 ? R.pick(RINT) : 0, Rs = [R.pick(E12.slice(0, 8)), R.pick(E12.slice(0, 8))];
    var spec = seriesSpec(emf, r, Rs, { sw: 1, open: 1, v1: 1, vs: 1, vr: 1 });
    return { stem: 'Switch S is open. ' + (g >= 11 ? 'The battery has an emf of ' + nice(emf) + ' V and an internal resistance of ' + nice(r) + ' Ω.' : 'The battery is ideal with an emf of ' + nice(emf) + ' V.'), spec: spec, hide: { A: 1, V1: 1, Vs: 1, V2: 1 }, parts: [
      C('a', 'What does the ammeter read?', 'A', [], function () { return 0; }, { traps: [T(emf / sum(Rs), 'The switch is open: there is no complete path, so no current.')], hint1: 'Is there a complete path through the ammeter?', hint2: 'With S open, I = 0.', work: ['S is open, so there is no complete circuit: I = 0 A.'] }),
      C('b', 'What does V2 (across R1) read?', 'V', [], function () { return 0; }, { traps: [T(emf, 'With no current there is no pd across a resistor: V = IR = 0.', 'X3')], hint1: 'V = IR for R1. What is I?', hint2: 'V2 = IR1 = 0 × ' + nice(Rs[0]), work: ['V = IR = 0 × ' + nice(Rs[0]) + ' = 0 V'] }),
      C('c', 'What does Vs (across the open switch) read?', 'V', [], function () { return emf; }, { traps: [T(0, 'An open switch is not “no pd”: with no current, the whole emf appears across the gap.', 'X3')], hint1: 'There is no pd across R1, R2' + (g >= 11 ? ' or r' : '') + '. So where is the emf?', hint2: 'Vs = emf − (pds across the resistors) = emf − 0', work: ['No current, so no pd across R1, R2' + (g >= 11 ? ' or r' : '') + ': Vs = emf = ' + u(emf, 'V')] }),
      C('d', 'What does V1 (across the battery) read?', 'V', [], function () { return emf; }, { traps: [T(0, 'The battery still has its emf across its terminals: with no current there are no lost volts.', 'X3')].concat(g >= 11 ? [T(emf / (sum(Rs) + r) * sum(Rs), 'That is the reading with the switch closed. With S open, I = 0, so Ir = 0.')] : []), hint1: g >= 11 ? 'What are the lost volts when I = 0?' : 'An ideal battery’s pd is its emf.', hint2: 'V1 = emf − Ir = emf − 0', work: ['V1 = emf − Ir = ' + nice(emf) + ' − 0 = ' + u(emf, 'V')] })] };
  } });

  G('power', { topic: 'T4', grades: [10, 11, 12], title: 'Power', sags: ['P-E2.3'], make: function (R, g, s) {
    if (s <= 2) {
      var Rv = R.pick([2, 4, 5, 6, 8, 10, 12, 20]), I = R.pick([0.5, 1, 1.5, 2, 2.5, 3]), V = I * Rv, P = V * I;
      if (s === 1) return { stem: 'The current through a resistor is ' + nice(I) + ' A and the pd across it is ' + nice(V) + ' V.', parts: [C('a', 'Calculate the power of the resistor.', 'W', ['pow'], function () { return V * I; }, { traps: [T(V / I, 'P = VI. V/I gives the resistance.'), T(I / V, 'P = VI.')], hint1: 'Power is pd × current.', hint2: 'P = VI = ' + nice(V) + ' × ' + nice(I), work: ['P = VI', '= ' + nice(V) + ' × ' + nice(I), '= ' + u(P, 'W')] })] };
      return { stem: 'A current of ' + nice(I) + ' A flows through a ' + nice(Rv) + ' Ω resistor.', parts: [C('a', 'Calculate the power of the resistor.', 'W', ['pow'], function () { return I * I * Rv; }, { traps: [T(I * Rv, 'That is the pd. P = I²R: square the current.'), T(2 * I * Rv, 'Square the current; do not double it.')], hint1: 'You know I and R: which power equation uses those?', hint2: 'P = I²R = ' + nice(I) + '² × ' + nice(Rv), work: ['P = I²R', '= (' + nice(I) + ')² × ' + nice(Rv), '= ' + u(P, 'W')] })] };
    }
    var c = comboVals(R, g, false); if (!c) return null;
    return { stem: 'R1 = ' + nice(c.Rs) + ' Ω is in series with R2 = ' + nice(c.pr[0]) + ' Ω and R3 = ' + nice(c.pr[1]) + ' Ω in parallel. A1 reads ' + u(c.I, 'A') + '. The emf is ' + nice(c.emf) + ' V. ' + idealNote(g, 0), spec: comboSpec(c.emf, 0, c.Rs, c.pr[0], c.pr[1]), parts: [
      C('a', 'Calculate the pd across R3.', 'V', ['ohm', 'ser'], function () { return c.Vp; }, { traps: [T(c.emf, 'R1 takes part of the emf. Use the pd across this part.', 'X13')], hint1: 'First the pd across R1, then what is left for the pair.', hint2: 'Vpair = emf − I × R1', work: ['V1 = IR1 = ' + n(c.I) + ' × ' + nice(c.Rs) + ' = ' + u(c.I * c.Rs, 'V'), 'Vpair = ' + nice(c.emf) + ' − ' + n(c.I * c.Rs) + ' = ' + u(c.Vp, 'V')] }),
      C('b', 'Calculate the power of R3.', 'W', ['pow'], function (v) { return v.a * v.a / c.pr[1]; }, { traps: [T(c.emf * c.emf / c.pr[1], 'Use the pd across this part, not the emf.'), T(c.I * c.I * c.pr[1], 'R3 does not carry the total current.', 'X5')], hint1: 'You know R3’s pd and its resistance.', hint2: 'P = V²/R = V²/' + nice(c.pr[1]), work: ['P = V²/R', '= (' + n(c.Vp) + ')²/' + nice(c.pr[1]), '= ' + u(c.Vp * c.Vp / c.pr[1], 'W')] })] };
  } });

  G('energy', { topic: 'T4', grades: [10, 11, 12], title: 'Electrical energy', sags: ['P-E2.2'], make: function (R, g, s) {
    var V = R.pick([6, 9, 12, 24, 230]), I = R.pick([0.5, 1.5, 2, 2.5, 4, 5]), unitT = s === 1 ? 's' : s === 2 ? 'min' : 'h', tv = unitT === 's' ? R.pick([30, 45, 60, 90, 120]) : unitT === 'min' ? R.pick([2, 5, 10, 15, 20]) : R.pick([1, 2, 3]);
    var t = unitT === 's' ? tv : unitT === 'min' ? tv * 60 : tv * 3600, W = V * I * t;
    return { stem: 'A heater on ' + nice(V) + ' V draws a current of ' + nice(I) + ' A for ' + tv + (unitT === 's' ? ' s' : unitT === 'min' ? ' minutes' : ' hour' + (tv > 1 ? 's' : '')) + '.', parts: [
      C('a', 'Calculate the energy transferred by the heater, in joules.', 'J', ['en'], function () { return W; }, { traps: [T(V * I * tv, (unitT === 'min' ? 'Change minutes to seconds: × 60.' : 'Change hours to seconds: × 3 600.'), 'X9'), T(V * I, 'That is the power. Energy = power × time.', 'X9')], hint1: 'Energy is power × time, with the time in seconds.', hint2: 'W = VIt = ' + nice(V) + ' × ' + nice(I) + ' × ' + t, work: ['W = VIt', '= ' + nice(V) + ' × ' + nice(I) + ' × ' + t, '= ' + u(W, 'J')] })] };
  } });

  G('rating', { topic: 'T4', grades: [10, 11, 12], title: 'Power ratings', sags: ['P-E2.3'], make: function (R, g, s) {
    var P = R.pick([60, 100, 500, 750, 1200, 2000, 2400, 3000]), V = R.pick([220, 230]), I = P / V, Rv = V * V / P;
    var parts = [MCQ('a', 'A kettle is rated ' + nice(P) + ' W, ' + V + ' V. What does ' + nice(P) + ' W mean?', 'It transfers ' + nice(P) + ' J of energy each second when connected to ' + V + ' V', [['It uses ' + nice(P) + ' W per second', 'Power is already energy per second: “watts per second” is not a power.'], ['It always transfers ' + nice(P) + ' J, on any supply', 'The rating holds only at the rated pd.'], ['It needs ' + nice(P) + ' A of current', 'Watts measure power, not current.']], 'A watt is a joule per second, at the stated pd.')];
    if (s >= 2) parts.push(C('b', 'Calculate the current in the kettle when it works at its rating.', 'A', ['pow'], function () { return P / V; }, { traps: [T(V / P, 'I = P/V: the power divided by the pd.')], hint1: 'P = VI, and you know P and V.', hint2: 'I = P/V = ' + nice(P) + '/' + V, work: ['P = VI', nice(P) + ' = ' + V + ' × I', 'I = ' + u(I, 'A')] }));
    if (s >= 3) parts.push(C('c', 'Calculate the resistance of the kettle’s element.', 'Ω', ['pow', 'ohm'], function (v) { return V / v.b; }, { traps: [T(P / V, 'That is the current.')], hint1: 'Use V and I, or V and P.', hint2: 'R = V²/P = ' + V + '²/' + nice(P), work: ['R = V²/P', '= ' + V + '²/' + nice(P), '= ' + u(Rv, 'Ω')] }));
    return { stem: 'Read the rating on the kettle.', parts: parts };
  } });

  G('cost', { topic: 'T5', grades: [10, 11, 12], title: 'kWh and cost', sags: ['P-E2.4'], make: function (R, g, s) {
    var P = R.pick([60, 100, 150, 800, 1200, 1500, 2000, 2500, 3000]), useMin = s >= 2, hrs = R.pick([1, 2, 3, 4, 5, 6, 8]), mins = R.pick([15, 20, 30, 45, 90]);
    var th = useMin ? mins / 60 : hrs, kWh = P / 1000 * th, tariff = R.pick([2, 2.5, 3, 3.2, 3.5, 4]), days = s >= 3 ? R.pick([7, 30]) : 1;
    var E = kWh * days, cost = E * tariff;
    if (!clean(E) || !clean(cost)) return null;
    var when = (useMin ? mins + ' minutes' : hrs + ' hour' + (hrs > 1 ? 's' : '')) + (days > 1 ? ' a day for ' + days + ' days' : '');
    return { stem: 'A ' + nice(P) + ' W appliance is used for ' + when + '. Electricity costs R' + n(tariff) + ' per kWh.', parts: [
      C('a', 'Calculate the energy used, in kWh.', 'kWh', ['kwh'], function () { return E; }, { traps: [T(P * th * days, 'Change watts to kilowatts: ÷ 1 000.', 'X10'), T(P / 1000 * (useMin ? mins : hrs) * days, useMin ? 'Change minutes to hours: ÷ 60.' : 'Use the time in hours.', 'X10')], hint1: 'A kilowatt hour is power in kW × time in hours.', hint2: 'E = ' + n(P / 1000, 3) + ' kW × ' + n(th * days, 3) + ' h', work: ['E = P × t', '= ' + n(P / 1000, 3) + ' × ' + n(th * days, 3), '= ' + u(E, 'kWh')] }),
      C('b', 'Calculate the cost.', 'R', ['cost'], function (v) { return v.a * tariff; }, { traps: [T(E / tariff, 'Multiply the kWh by the tariff.')], hint1: 'Each kWh costs R' + n(tariff) + '.', hint2: 'cost = kWh × tariff = E × ' + n(tariff), work: ['cost = energy × tariff', '= ' + n(E) + ' × ' + n(tariff), '= R' + n(cost)] })] };
  } });

  G('network', { topic: 'T6', grades: [10, 11, 12], title: 'Networks of three resistors', sags: ['P-E3.4'], make: function (R, g, s) {
    var shape = R.pick([0, 1, 2]), withR = g >= 11, r = withR ? R.pick([0.5, 1]) : 0, emf = R.pick([6, 9, 12, 18]), Rx, I, spec, stem, pr, Rext;
    if (shape === 0) { var c = comboVals(R, g, withR); if (!c) return null; Rext = c.Rs + c.RP; emf = c.emf; r = c.r; spec = comboSpec(c.emf, c.r, c.Rs, c.pr[0], c.pr[1], { v1: 1 }); stem = 'R1 = ' + nice(c.Rs) + ' Ω is in series with R2 = ' + nice(c.pr[0]) + ' Ω and R3 = ' + nice(c.pr[1]) + ' Ω in parallel.'; pr = c.pr; Rx = c.RP; }
    else if (shape === 1) { var a = R.pick([2, 4, 6]), b = R.pick([4, 6, 8, 10]), c3 = R.pick([6, 8, 12]); Rx = par([a + b, c3]); Rext = Rx; spec = pairBranchSpec(emf, r, a, b, c3); stem = 'R1 = ' + nice(a) + ' Ω and R2 = ' + nice(b) + ' Ω in series form one branch; R3 = ' + nice(c3) + ' Ω is the other branch.'; pr = [a + b, c3]; }
    else { var rs = [R.pick([4, 6, 12]), R.pick([6, 12, 3]), R.pick([12, 4, 6])]; Rx = par(rs); Rext = Rx; spec = parallelSpec(emf, r, rs, { v1: 1 }); stem = 'Three resistors, ' + rs.map(nice).join(' Ω, ') + ' Ω, are in parallel.'; pr = rs; }
    I = emf / (Rext + r);
    if (!okI(I) || ![Rx, Rext, I, I * r].every(function (x) { return x === 0 || clean(x); })) return null;
    var parts = [
      C('a', 'Calculate the resistance of the parallel part.', 'Ω', ['par', 'ser'], function () { return Rx; }, { inter: [1 / Rx], traps: [T(1 / Rx, 'That is 1/RP. Now take the reciprocal.'), T(sum(pr), 'That is the series rule.')], hint1: 'Which resistors sit side by side between the same two junctions?' + (shape === 1 ? ' Add the series pair first.' : ''), hint2: '1/RP = ' + pr.map(function (x) { return '1/' + nice(x); }).join(' + '), work: [(shape === 1 ? 'R1 + R2 = ' + u(pr[0], 'Ω') + '; ' : '') + '1/RP = ' + pr.map(function (x) { return '1/' + nice(x); }).join(' + '), 'RP = ' + u(Rx, 'Ω')] })];
    if (shape === 0) parts.push(C('b', 'Calculate the external resistance.', 'Ω', ['ser'], function (v) { return v.a + (Rext - Rx); }, { hint1: 'Add the series resistor.', hint2: 'Rext = R1 + RP', work: ['Rext = R1 + RP = ' + nice(Rext - Rx) + ' + ' + n(Rx) + ' = ' + u(Rext, 'Ω')] }));
    parts.push(C('c', 'Calculate the current from the battery.', 'A', withR ? ['emf'] : ['ohm'], function (v) { return emf / ((shape === 0 ? v.b : v.a) + r); }, { traps: withR ? [T(emf / Rext, 'Include r: I = emf/(Rext + r).')] : [], hint1: withR ? 'The current passes through r as well.' : 'Use the total resistance.', hint2: withR ? 'I = emf/(Rext + r) = ' + nice(emf) + '/(Rext + ' + nice(r) + ')' : 'I = V/R = ' + nice(emf) + '/R', work: [withR ? 'I = emf/(Rext + r)' : 'I = V/R', '= ' + nice(emf) + '/' + (withR ? '(' + n(Rext) + ' + ' + nice(r) + ')' : n(Rext)), '= ' + u(I, 'A')] }));
    if (withR && s >= 2) parts.push(C('d', 'Calculate the reading on V1.', 'V', ['emf', 'ohm'], function (v) { return emf - v.c * r; }, { traps: [T(emf, 'Some pd is lost inside the battery.'), T(I * r, 'That is the lost volts. V1 = emf − Ir.')], hint1: 'V1 reads the terminal pd.', hint2: 'Vload = emf − Ir', work: ['Vload = emf − Ir', '= ' + nice(emf) + ' − ' + n(I) + ' × ' + nice(r), '= ' + u(emf - I * r, 'V')] }));
    return { stem: stem + ' ' + (withR ? 'The battery has an emf of ' + nice(emf) + ' V and an internal resistance of ' + nice(r) + ' Ω.' : 'The battery is ideal with an emf of ' + nice(emf) + ' V.'), spec: spec, hide: { A: 1, A1: 1, V1: 1 }, parts: parts };
  } });

  G('emf-r', { topic: 'T7', grades: [11, 12], title: 'emf, lost volts and terminal pd', sags: ['P-E3.2', 'P-E3.3'], make: function (R, g, s) {
    var emf = R.pick([4.5, 6, 9, 12, 18, 24]), r = R.pick(RINT.concat([2.5, 3])), Rv = R.pick(E12.concat([16, 18])), I = emf / (Rv + r);
    if (!okI(I) || !clean(I) || !clean(I * r) || !clean(emf - I * r)) return null;
    var parts = [C('a', 'Calculate the reading on the ammeter.', 'A', ['emf'], function () { return I; }, { traps: [T(emf / Rv, 'Include r: I = emf/(Rext + r).'), T(emf / r, 'The current passes through R as well as r.')], hint1: 'The current passes through the external resistor and through r.', hint2: 'I = emf/(Rext + r) = ' + nice(emf) + '/(' + nice(Rv) + ' + ' + nice(r) + ')', work: ['emf = I(Rext + r)', nice(emf) + ' = I(' + nice(Rv) + ' + ' + nice(r) + ')', 'I = ' + u(I, 'A')] })];
    if (s >= 2) parts.push(C('b', 'Calculate the lost volts.', 'V', ['ohm', 'emf'], function (v) { return v.a * r; }, { traps: [T(I * Rv, 'That is the pd across R, the terminal pd.')], hint1: 'The lost volts are the pd across r.', hint2: 'Vinternal resistance = Ir = I × ' + nice(r), work: ['V = Ir', '= ' + n(I) + ' × ' + nice(r), '= ' + u(I * r, 'V')] }));
    parts.push(C('c', 'Calculate the reading on V1.', 'V', ['emf', 'ohm'], function (v) { return emf - (v.b != null ? v.b : v.a * r); }, { traps: [T(emf, 'Some pd is lost inside the battery: Vload = emf − Ir.'), T(I * r, 'That is the lost volts.')], hint1: 'V1 reads the terminal pd: the emf minus the lost volts.', hint2: 'Vload = emf − Ir = ' + nice(emf) + ' − I × ' + nice(r), work: ['Vload = emf − Ir', '= ' + nice(emf) + ' − ' + n(I) + ' × ' + nice(r), '= ' + u(emf - I * r, 'V')] }));
    return { stem: 'A battery of emf ' + nice(emf) + ' V and internal resistance ' + nice(r) + ' Ω is connected to a ' + nice(Rv) + ' Ω resistor.', spec: seriesSpec(emf, r, [Rv], { v1: 1 }), hide: { A: 1, V1: 1 }, parts: parts };
  } });

  G('lostvolts', { topic: 'T7', grades: [11, 12], title: 'Find r from the readings', sags: ['P-E3.3'], make: function (R, g, s) {
    var emf = R.pick([6, 9, 12]), r = R.pick([0.5, 1, 1.5, 2]), Rv = R.pick([4, 5, 6, 8, 10]), I = emf / (Rv + r), V = I * Rv;
    if (!clean(I) || !clean(V) || !clean(emf - V)) return null;
    var Ir = +F.round(I), Vr = +F.round(V), rr = (emf - Vr) / Ir;
    return { stem: 'With the switch open, the voltmeter across the battery reads ' + nice(emf) + ' V. With the switch closed, it reads ' + n(Vr) + ' V and the ammeter reads ' + n(Ir) + ' A.', spec: seriesSpec(emf, r, [Rv], { sw: 1, v1: 1 }), hideR: ['B'], hide: { V1: 1, A: 1 }, parts: [
      C('a', 'Calculate the lost volts.', 'V', ['emf', 'ser'], function () { return emf - Vr; }, { traps: [T(Vr, 'That is the terminal pd.')], hint1: 'The open-switch reading is the emf.', hint2: 'Ir = emf − Vload = ' + nice(emf) + ' − ' + n(Vr), work: ['emf = Vload + Ir', 'Ir = ' + nice(emf) + ' − ' + n(Vr), '= ' + u(emf - Vr, 'V')] }),
      C('b', 'Calculate the internal resistance of the battery.', 'Ω', ['ohm', 'emf'], function (v) { return v.a / Ir; }, { traps: [T(Vr / Ir, 'V/I gives Rext, not r.'), T(emf / Ir, 'emf/I gives Rext + r.')], hint1: 'r is the lost volts per ampere.', hint2: 'r = Ir/I = (lost volts)/' + n(Ir), work: ['V = Ir', n(emf - Vr) + ' = ' + n(Ir) + ' × r', 'r = ' + u(rr, 'Ω')] })] };
  } });

  G('solve-r', { topic: 'T8', grades: [11, 12], title: 'Choose R for a current', sags: ['P-E3.4'], make: function (R, g, s) {
    var emf = R.pick([6, 9, 12, 18, 24]), r = R.pick([0.5, 1, 1.5, 2]), I = R.pick([0.5, 0.75, 1, 1.2, 1.5, 2, 2.5, 3]), Rv = emf / I - r;
    if (Rv < 1 || !clean(Rv)) return null;
    return { stem: 'A battery has an emf of ' + nice(emf) + ' V and an internal resistance of ' + nice(r) + ' Ω.', parts: [
      C('a', 'Calculate the resistance of the external resistor needed for a current of ' + nice(I) + ' A.', 'Ω', ['emf'], function () { return Rv; }, { traps: [T(emf / I, 'You forgot r: emf/I is Rext + r.'), T(emf / I + r, 'Subtract r: Rext = emf/I − r.')], hint1: 'emf/I gives the total resistance, r included.', hint2: 'emf = I(Rext + r): ' + nice(emf) + ' = ' + nice(I) + '(Rext + ' + nice(r) + ')', work: ['emf = I(Rext + r)', nice(emf) + ' = ' + nice(I) + '(Rext + ' + nice(r) + ')', 'Rext = ' + u(Rv, 'Ω')] })] };
  } });

  G('twostate', { topic: 'T8', grades: [11, 12], title: 'Two states: switch open, then closed', sags: ['P-E3.3', 'P-E3.4'], make: function (R, g, s) {
    var emf = R.pick([6, 9, 12]), r = R.pick([0.5, 1, 1.5, 2]), pr = R.pick([[6, 3], [12, 6], [8, 8], [4, 12]]), RP = par(pr), I = emf / (RP + r), V = I * RP, Ib = V / pr[1];
    if (!clean(I) || !clean(V) || !clean(Ib)) return null;
    var Ir = +F.round(I), Vr = +F.round(V);
    return { stem: 'With the switch open the voltmeter reads ' + nice(emf) + ' V. When the switch is closed, the voltmeter reads ' + n(Vr) + ' V and the ammeter in the main line reads ' + n(Ir) + ' A.', spec: parallelSpec(emf, r, pr, { v1: 1 }), hideR: ['B'], hide: { A: 1, V1: 1 }, parts: [
      C('a', 'Write down the emf of the battery.', 'V', [], function () { return emf; }, { traps: [T(Vr, 'That is the terminal pd with a current flowing.')], hint1: 'With the switch open no current flows, so there are no lost volts.', hint2: 'emf = the open-circuit reading', work: ['No current: emf = ' + u(emf, 'V')] }),
      C('b', 'Calculate the internal resistance.', 'Ω', ['emf', 'ohm'], function (v) { return (v.a - Vr) / Ir; }, { traps: [T((emf - Vr) / (Vr / pr[1]), 'Divide by the current through r: the main-line current, not one branch’s.', 'X5'), T(Vr / Ir, 'V/I gives Rext, not r.')], hint1: 'The drop in the voltmeter reading is the lost volts.', hint2: 'r = (emf − Vload)/I = (' + nice(emf) + ' − ' + n(Vr) + ')/' + n(Ir), work: ['emf = Vload + Ir', nice(emf) + ' = ' + n(Vr) + ' + ' + n(Ir) + 'r', 'r = ' + u((emf - Vr) / Ir, 'Ω')] })] };
  } });

  G('simul', { topic: 'T8', grades: [12], title: 'Two equations: emf and r', sags: ['P-E3.4'], make: function (R, g, s) {
    var emf = R.pick([6, 9, 12]), r = R.pick([0.5, 1, 1.5, 2]), R1 = R.pick([2, 3, 4, 5]), R2 = R1 + R.pick([3, 4, 6, 8]);
    var I1 = emf / (R1 + r), I2 = emf / (R2 + r), V1 = I1 * R1, V2 = I2 * R2;
    var a = [I1, I2, V1, V2].map(function (x) { return +F.round(x); });
    if (![I1, I2, V1, V2].every(clean)) return null;
    var rr = (a[3] - a[2]) / (a[0] - a[1]), ee = a[2] + a[0] * rr;
    return { stem: 'A battery is connected to a rheostat. With the rheostat at one setting the ammeter reads ' + n(a[0]) + ' A and the voltmeter across the battery reads ' + n(a[2]) + ' V. At a second setting the readings are ' + n(a[1]) + ' A and ' + n(a[3]) + ' V.', parts: [
      C('a', 'Calculate the internal resistance of the battery.', 'Ω', ['emf'], function () { return rr; }, { traps: [T(-rr, 'Subtract whole equations: (V₂ − V₁) = −r(I₂ − I₁). r is positive.'), T(a[2] / a[0], 'V/I gives Rext, not r.')], hint1: 'Write emf = V + Ir for each setting. The emf and r are the same in both.', hint2: 'emf = ' + n(a[2]) + ' + ' + n(a[0]) + 'r and emf = ' + n(a[3]) + ' + ' + n(a[1]) + 'r', work: ['emf = ' + n(a[2]) + ' + ' + n(a[0]) + 'r … (1)', 'emf = ' + n(a[3]) + ' + ' + n(a[1]) + 'r … (2)', '(1) − (2): 0 = ' + n(a[2] - a[3]) + ' + ' + n(a[0] - a[1]) + 'r, so r = ' + u(rr, 'Ω')] }),
      C('b', 'Calculate the emf of the battery.', 'V', ['emf'], function (v) { return a[2] + a[0] * v.a; }, { traps: [T(a[2], 'That is the terminal pd at the first setting.')], hint1: 'Put r back into either equation.', hint2: 'emf = ' + n(a[2]) + ' + ' + n(a[0]) + ' × r', work: ['emf = Vload + Ir', '= ' + n(a[2]) + ' + ' + n(a[0]) + ' × ' + n(rr), '= ' + u(ee, 'V')] })] };
  } });

  G('unit', { topic: 'T10', grades: [10, 11, 12], title: 'The unit of a gradient', sags: ['S-4.3'], make: function (R, g, s) {
    var v = R.pick(g === 10 ? [0, 1] : [0, 1, 2]);
    var sets = [
      { d: 'potential difference (V, in volts) on the y-axis against current (I, in amperes) on the x-axis', ok: 'V·A⁻¹ (the ohm, Ω)', w: [['A·V⁻¹', 'Gradient = Δy/Δx: the y-unit divided by the x-unit.'], ['V·A', 'Divide, do not multiply.'], ['no unit', 'A gradient keeps the units of its axes.']] },
      { d: 'current (I, in amperes) on the y-axis against potential difference (V, in volts) on the x-axis', ok: 'A·V⁻¹ (Ω⁻¹)', w: [['V·A⁻¹', 'Gradient = Δy/Δx: here the y-unit is the ampere.'], ['Ω', 'This gradient is 1/R, so its unit is Ω⁻¹.'], ['no unit', 'A gradient keeps the units of its axes.']] },
      { d: 'terminal pd (V) on the y-axis against current (A) on the x-axis', ok: 'V·A⁻¹; the gradient is −r', w: [['A·V⁻¹; the gradient is r', 'Δy/Δx with V on y: V·A⁻¹. The line slopes down, so the gradient is −r.'], ['V; the gradient is the emf', 'The emf is the y-intercept, not the gradient.'], ['V·A⁻¹; the gradient is Rext', 'The gradient of this graph is −r.']] }];
    var x = sets[v];
    return { stem: 'A graph shows ' + x.d + '.', parts: [MCQ('a', 'What is the unit of its gradient?', x.ok, x.w, 'Gradient = Δy/Δx, so its unit is the y-unit per x-unit, written with negative indices.')] };
  } });

  G('table', { topic: 'T11', grades: [10, 11, 12], title: 'Tables of readings', sags: ['S-3.2'], make: function (R, g, s) {
    var v = R.pick([0, 1]);
    if (v === 0) return { stem: 'A learner records ammeter readings in a table.', parts: [MCQ('a', 'Which column heading is set out correctly?', 'Current (A)', [['Current', 'Add the unit in brackets.'], ['A (current)', 'The quantity comes first, then its unit in brackets.'], ['Current (amps) 1,5', 'A heading carries the quantity and unit only; readings go in the cells.']], 'A heading names the quantity, with its unit in brackets.')] };
    return { stem: 'An ammeter shows readings to two decimal places.', parts: [MCQ('a', 'How should a reading of one and a half amperes be recorded?', '1,50', [['1,5', 'Keep the meter’s precision: two decimal places.'], ['1,500', 'Do not add precision the meter does not give.'], ['1½', 'Write decimals, not fractions.']], 'Record to the precision of the instrument, with the same number of decimal places in a column.')] };
  } });

  /* ---------- streams: practice routes #practise/<T1…T11>?type= (§16) ---------- */
  var STREAMS = {
    T1: ['charge', 'energy-q'], T2: ['ohm'], T3: ['series', 'parallel', 'combo', 'share', 'chainback', 'identical', 'mcq', 'matched', 'openV'],
    T4: ['power', 'energy', 'rating'], T5: ['cost'], T6: ['network', 'chainback'], T7: ['emf-r', 'lostvolts', 'openV'],
    T8: ['solve-r', 'twostate', 'simul'], T10: ['unit'], T11: ['table']
  };
  var TYPE = { chain: 'chainback', simul: 'simul', parallel: 'parallel', share: 'share', matched: 'matched', energy: 'energy', place: null };
  var TOPIC_NAME = { T1: 'Charge, current and pd', T2: 'Ohm’s law', T3: 'Series and parallel', T4: 'Power and energy', T5: 'kWh and cost', T6: 'Networks', T7: 'emf and internal resistance', T8: 'Solving circuits with r', T9: 'Explaining changes', T10: 'Graphs', T11: 'Practical skills' };

  function make(genId, seed, g, star) {
    var gen = GEN[genId];
    var it = draw(seed, function (R) { return gen.make(R, g, star || 2); });
    it.gen = genId; it.topic = gen.topic; it.title = gen.title; it.sags = gen.sags; it.star = star || 2; it.g = g;
    if (g === 10 && it.spec) it.spec.parts.forEach(function (p) { if (p.kind === 'battery') p.r = 0; });
    /* a trap that lands on the right answer (equal branches, round numbers) is dropped for this item */
    var ex = exact(it);
    it.parts.forEach(function (p) { if (p.kind === 'calc') p.traps = p.traps.filter(function (t) { return Math.abs(t.v - ex[p.key]) > Math.max(0.011, Math.abs(ex[p.key]) * 0.011); }); });
    return it;
  }

  var api = { GEN: GEN, STREAMS: STREAMS, TYPE: TYPE, TOPIC_NAME: TOPIC_NAME, FORM: FORM, formsFor: formsFor, formText: formText, make: make, exact: exact,
    seriesSpec: seriesSpec, parallelSpec: parallelSpec, comboSpec: comboSpec, pairBranchSpec: pairBranchSpec, nice: nice };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.Gens = api;
})(typeof window !== 'undefined' ? window : this);
