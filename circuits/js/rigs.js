/* Experiment rigs (studio_design.md §5). Pure: a rig builds a lattice spec from its settings, and measure() turns
   one reading's draws into the meter values shown. Draw order per reading (§5.0): a battery with scatter first
   (z_emf, z_r), then one z_R per scattered resistor in circuit order, then each meter in column order
   (a voltmeter: gain, offset; an ammeter: gain). */
(function (root) {
  'use strict';
  var S = root.CircuitSolver || (typeof require !== 'undefined' ? require('./solver.js') : null);
  var N = root.Noise || (typeof require !== 'undefined' ? require('./noise.js') : null);
  var P = N.P;

  /* hidden batteries (§5.0) and Gr 10 resistor boxes */
  var BOXES = {
    A: { emf: 1.5, r: 0.6, note: 'one cell' }, B: { emf: 4.5, r: 1.2 }, C: { emf: 6.0, r: 0.8 },
    D: { emf: 7.5, r: 1.6, note: 'the fixed box for the sample run' }, E: { emf: 12.0, r: 2.0 }, F: { emf: 20.0, r: 1.75 }
  };
  function boxR(seed) {             /* box R: emf from the list, r 0,30 to 3,00 Ω in 0,05 steps, from its own stream */
    var rnd = N.mulberry32((seed ^ 0x5bd1e995) >>> 0), E = [1.5, 3.0, 4.5, 6.0, 7.5, 12.0];
    return { emf: E[Math.floor(rnd() * E.length)], r: Math.round((0.30 + Math.floor(rnd() * 55) * 0.05) * 100) / 100 };
  }
  var XBOX = { X1: { marked: 4.7, R: 4.79 }, X2: { marked: 10, R: 10.2 }, X3: { marked: 2.2, R: 2.16 }, X4: { marked: 15, R: 14.8 } };
  var LOOP = [[[2, 0], [0, 0], [0, 1]], [[0, 2], [0, 3], [1, 3]], [[3, 3], [4, 3]], [[6, 3], [7, 3], [7, 2]], [[7, 1], [7, 0], [4, 0]]];

  var RIGS = {};
  /* §5.1 Ohm's law: 6,00 V ideal, switch, rheostat 0 to 20 Ω, X (or the 6,0 V 0,50 A filament bulb), A in series, V across X */
  RIGS.ohm = {
    id: 'ohm', rheoMax: 20,
    spec: function (st) {
      var load = st.load === 'bulb'
        ? { id: 'L', kind: 'bulb', a: [4, 3], b: [6, 3], R: 12, filament: { Rhot: 12, Vr: 6 }, label: 'bulb' }
        : { id: 'X', kind: 'resistor', a: [4, 3], b: [6, 3], R: XBOX[st.load || 'X1'].R, label: 'X', secret: true };
      return { parts: [
        { id: 'B', kind: 'battery', a: [4, 0], b: [2, 0], emf: 6, r: 0 },
        { id: 'S', kind: 'switch', a: [0, 1], b: [0, 2], closed: !!st.closed },
        { id: 'Rh', kind: 'rheostat', a: [1, 3], b: [3, 3], R: st.Rh, Rmax: 20 },
        load,
        { id: 'A', kind: 'ammeter', a: [7, 2], b: [7, 1] },
        { id: 'V', kind: 'voltmeter', a: [4, 3], b: [6, 3], side: 'down' }
      ], wires: LOOP };
    },
    batScatter: function () { return false; },
    scatterIds: function (st) { return st.load === 'bulb' ? [] : ['X']; },
    meters: ['V', 'A']
  };
  /* §5.3 emf and r: hidden box, 1,0 Ω protective resistor, rheostat 0 to 30 Ω, A in series, V across the battery */
  RIGS.emf = {
    id: 'emf', rheoMax: 30,
    spec: function (st) {
      return { parts: [
        { id: 'B', kind: 'battery', a: [4, 0], b: [2, 0], emf: st.emf, r: st.r },
        { id: 'S', kind: 'switch', a: [0, 1], b: [0, 2], closed: !!st.closed },
        { id: 'Rp', kind: 'resistor', a: [1, 3], b: [3, 3], R: 1.0, label: 'protective' },
        { id: 'Rh', kind: 'rheostat', a: [4, 3], b: [6, 3], R: st.Rh, Rmax: 30 },
        { id: 'A', kind: 'ammeter', a: [7, 2], b: [7, 1] },
        { id: 'V', kind: 'voltmeter', a: [4, 0], b: [2, 0], side: 'up' }
      ], wires: LOOP };
    },
    batScatter: function () { return true; },
    scatterIds: function () { return []; },
    meters: ['V', 'A']
  };
  /* §5.2 series and parallel rules: 10 Ω and 20 Ω on 4,5 V (r = 0, or 0,5 Ω after Module 11) */
  RIGS.rules = {
    id: 'rules',
    spec: function (st) {
      var r = st.r || 0;
      if (st.arr !== 'parallel') return { parts: [
        { id: 'B', kind: 'battery', a: [4, 0], b: [2, 0], emf: 4.5, r: r },
        { id: 'A1', kind: 'ammeter', a: [0, 1], b: [0, 2] },
        { id: 'R1', kind: 'resistor', a: [1, 3], b: [3, 3], R: 10 },
        { id: 'A2', kind: 'ammeter', a: [3, 3], b: [4, 3] },
        { id: 'R2', kind: 'resistor', a: [4, 3], b: [6, 3], R: 20 },
        { id: 'A3', kind: 'ammeter', a: [7, 2], b: [7, 1] },
        { id: 'V1', kind: 'voltmeter', a: [1, 3], b: [3, 3], side: 'down' },
        { id: 'V2', kind: 'voltmeter', a: [4, 3], b: [6, 3], side: 'down' },
        { id: 'V', kind: 'voltmeter', a: [4, 0], b: [2, 0], side: 'up' }
      ], wires: [[[2, 0], [0, 0], [0, 1]], [[0, 2], [0, 3], [1, 3]], [[6, 3], [7, 3], [7, 2]], [[7, 1], [7, 0], [4, 0]]] };
      var parts = [
        { id: 'B', kind: 'battery', a: [4, 0], b: [2, 0], emf: 4.5, r: r },
        { id: 'A', kind: 'ammeter', a: [0, 1], b: [0, 2] },
        { id: 'A1', kind: 'ammeter', a: [1, 3], b: [2, 3] },
        { id: 'R1', kind: 'resistor', a: [2, 3], b: [4, 3], R: 10 },
        { id: 'A2', kind: 'ammeter', a: [1, 5], b: [2, 5] },
        { id: 'R2', kind: 'resistor', a: [2, 5], b: [4, 5], R: 20 },
        { id: 'S3', kind: 'switch', a: [1, 7], b: [2, 7], closed: !!st.third, label: 'S' },
        { id: 'R3', kind: 'resistor', a: [2, 7], b: [4, 7], R: 30 },
        { id: 'V1', kind: 'voltmeter', a: [2, 3], b: [4, 3], side: 'up' },
        { id: 'V2', kind: 'voltmeter', a: [2, 5], b: [4, 5], side: 'down', lside: 'down' }
      ];
      return { parts: parts, wires: [[[2, 0], [0, 0], [0, 1]], [[0, 2], [0, 3], [1, 3]], [[1, 3], [1, 5]], [[1, 5], [1, 7]],
        [[4, 3], [5, 3]], [[4, 5], [5, 5], [5, 3]], [[4, 7], [5, 7], [5, 5]], [[5, 3], [6, 3], [6, 0], [4, 0]]] };
    },
    batScatter: function (st) { return (st.r || 0) > 0; },
    scatterIds: function (st) { return st.arr === 'parallel' ? ['R1', 'R2', 'R3'] : ['R1', 'R2']; },
    meters: function (st) { return st.arr === 'parallel' ? ['A', 'A1', 'A2', 'V1', 'V2'] : ['A1', 'A2', 'A3', 'V1', 'V2', 'V']; }
  };
  /* §5.4 power and brightness: 6 Ω bulbs on 12 V (ideal; r = 0,5 Ω after Module 11) */
  RIGS.power = {
    id: 'power',
    spec: function (st) {
      var r = st.r || 0, bulb = function (id, a, b) { var q = { id: id, kind: 'bulb', a: a, b: b, R: 6 }; if (st.filament) { q.filament = { Rhot: 12, Vr: 6 }; q.R = 12; } return q; };
      var bat = { id: 'B', kind: 'battery', a: [4, 0], b: [2, 0], emf: st.filament ? 6 : 12, r: r };
      if (st.arr === 'series') return { parts: [bat,
        { id: 'A', kind: 'ammeter', a: [0, 1], b: [0, 2] },
        bulb('L1', [1, 3], [3, 3]), bulb('L2', [4, 3], [6, 3]),
        { id: 'V1', kind: 'voltmeter', a: [1, 3], b: [3, 3], side: 'down' },
        { id: 'V2', kind: 'voltmeter', a: [4, 3], b: [6, 3], side: 'down' }
      ], wires: [[[2, 0], [0, 0], [0, 1]], [[0, 2], [0, 3], [1, 3]], [[3, 3], [4, 3]], [[6, 3], [7, 3], [7, 0], [4, 0]]] };
      if (st.arr === 'parallel') return { parts: [bat,
        { id: 'A1', kind: 'ammeter', a: [1, 3], b: [2, 3] }, bulb('L1', [2, 3], [4, 3]),
        { id: 'A2', kind: 'ammeter', a: [1, 5], b: [2, 5] }, bulb('L2', [2, 5], [4, 5]),
        { id: 'V1', kind: 'voltmeter', a: [2, 3], b: [4, 3], side: 'up' },
        { id: 'V2', kind: 'voltmeter', a: [2, 5], b: [4, 5], side: 'down' }
      ], wires: [[[2, 0], [0, 0], [0, 3], [1, 3]], [[1, 3], [1, 5]], [[4, 3], [5, 3]], [[4, 5], [5, 5], [5, 3]], [[5, 3], [6, 3], [6, 0], [4, 0]]] };
      return { parts: [bat,
        { id: 'A', kind: 'ammeter', a: [0, 1], b: [0, 2] }, bulb('L1', [2, 3], [4, 3]),
        { id: 'V1', kind: 'voltmeter', a: [2, 3], b: [4, 3], side: 'down' }
      ], wires: [[[2, 0], [0, 0], [0, 1]], [[0, 2], [0, 3], [2, 3]], [[4, 3], [6, 3], [6, 0], [4, 0]]] };
    },
    batScatter: function (st) { return (st.r || 0) > 0; },
    scatterIds: function (st) { return st.filament ? [] : (st.arr === 'one' || !st.arr ? ['L1'] : ['L1', 'L2']); },
    meters: function (st) { return st.arr === 'series' ? ['A', 'V1', 'V2'] : st.arr === 'parallel' ? ['A1', 'A2', 'V1', 'V2'] : ['A', 'V1']; },
    /* each bulb's own V and I */
    bulbs: function (st, read) {
      if (st.arr === 'series') return [{ id: 'L1', V: read.V1, I: read.A }, { id: 'L2', V: read.V2, I: read.A }];
      if (st.arr === 'parallel') return [{ id: 'L1', V: read.V1, I: read.A1 }, { id: 'L2', V: read.V2, I: read.A2 }];
      return [{ id: 'L1', V: read.V1, I: read.A }];
    }
  };

  function list(x, st) { return typeof x === 'function' ? x(st) : x; }
  function kindOf(spec, id) { for (var i = 0; i < spec.parts.length; i++) if (spec.parts[i].id === id) return spec.parts[i].kind; return null; }
  /* how many z values one reading needs */
  function zCount(rig, st) {
    var spec = rig.spec(st), n = (rig.batScatter(st) ? 2 : 0) + rig.scatterIds(st).length;
    list(rig.meters, st).forEach(function (m) { n += kindOf(spec, m) === 'voltmeter' ? 2 : 1; });
    return n;
  }
  function draw(rnd, rig, st) { var z = [], n = zCount(rig, st); for (var i = 0; i < n; i++) z.push(N.gauss(rnd)); return z; }
  /* z == null: no scatter (exact values). heat multiplies r (battery warming, §5.0). */
  function measure(rig, st, z, heat) {
    var spec = rig.spec(st), k = 0, zz = function () { return z ? z[k++] : 0; };
    var bat = spec.parts.filter(function (p) { return p.kind === 'battery'; })[0];
    if (rig.batScatter(st)) { bat.emf *= 1 + P.emf * zz(); bat.r *= (1 + P.r * zz()); }
    if (heat) bat.r *= heat;
    rig.scatterIds(st).forEach(function (id) { spec.parts.forEach(function (p) { if (p.id === id) p.R *= 1 + P.R * zz(); }); });
    var res = S.solve(spec, {}), read = {};
    list(rig.meters, st).forEach(function (m) {
      var v = res.read[m] == null ? 0 : res.read[m];
      if (kindOf(spec, m) === 'voltmeter') { var g = zz(), o = zz(); read[m] = v * (1 + P.Vg * g) + P.Vo * o; }
      else read[m] = v * (1 + P.Ig * zz());
    });
    return { read: read, res: res, spec: spec };
  }
  /* the range of currents a rheostat rig can give (exact values) */
  function currentRange(rig, st) {
    var a = Object.assign({}, st, { closed: true, Rh: 0 }), b = Object.assign({}, st, { closed: true, Rh: rig.rheoMax });
    return [measure(rig, b, null).read.A, measure(rig, a, null).read.A];
  }

  var api = { BOXES: BOXES, boxR: boxR, XBOX: XBOX, RIGS: RIGS, zCount: zCount, draw: draw, measure: measure, currentRange: currentRange, list: list };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.Rigs = api;
})(this);
