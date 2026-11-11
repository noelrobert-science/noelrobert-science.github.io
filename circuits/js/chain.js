/* Explain a change: the cause-chain explorer (studio_design.md §7).
   Stages per event (D19): 0 set up, 1 predict (locked before the change, D14), 2 change (one 600 ms tween, D1-D3),
   3 compare (ghosts, table, first wrong card in reasoning order, D4), 4 reason (a separate, learner-paced panel, D6-D12),
   5 exam card and 6 check yourself (js/cards.js). Every value comes from the solver; nothing here is typed in by hand. */
(function () {
  'use strict';
  var V = window.StudioViews = window.StudioViews || {};
  var S = window.CircuitSolver, D = window.Draw, F = window.Fmt, PR = window.STUDIO.presets;
  var KEY = 'circ-chain-v1';
  var reduced = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  function clone(o) { return JSON.parse(JSON.stringify(o)); }
  function part(s, id) { for (var i = 0; i < s.parts.length; i++) if (s.parts[i].id === id) return s.parts[i]; return null; }
  function load() { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; } }
  function save(d) { try { localStorage.setItem(KEY, JSON.stringify(d)); } catch (e) { /* private window */ } }

  /* ---------- solving: the drawn spec keeps its look; the solved spec carries the electrical roles ---------- */
  function solveSpec(spec) {
    var s = clone(spec);
    s.parts.forEach(function (p) {
      if (p.as) p.kind = p.as;
      if (p.broken) { p.kind = 'switch'; p.closed = false; }
    });
    return s;
  }
  function solve(spec) { return S.solve(solveSpec(spec), {}); }
  function snap(spec, res) {
    var bat = spec.parts.filter(function (p) { return p.kind === 'battery'; })[0], be = res.el[bat.id] || {};
    var q = { emf: bat.emf, r: bat.r || 0, I: Math.abs(be.i || 0), Ir: res.battery[bat.id] ? res.battery[bat.id].lost : 0, term: Math.abs(be.v || 0), v: {}, i: {}, p: {}, read: res.read };
    Object.keys(res.el).forEach(function (k) { var e = res.el[k]; q.v[k] = Math.abs(e.v || 0); q.i[k] = Math.abs(e.i || 0); q.p[k] = e.p || 0; });
    q.Rext = q.I > 1e-9 ? q.term / q.I : Infinity; q.Rt = q.Rext + q.r;
    return q;
  }

  /* ---------- words ---------- */
  function n(x, u) { return F.num(x) + ' ' + u; }
  function same(x, y) { return F.round(x) === F.round(y); }
  function dirOf(x, y) { var a = +F.round(x), b = +F.round(y); return b > a ? 'increases' : b < a ? 'decreases' : 'stays the same'; }
  function WORD(x, y) { var d = dirOf(x, y); return d === 'increases' ? 'INCREASE' : d === 'decreases' ? 'DECREASE' : 'STAY THE SAME'; }
  function ft(x, y, u) { return same(x, y) ? 'at ' + n(y, u) : 'from ' + n(x, u) + ' to ' + n(y, u); }
  function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

  /* step templates (§7.6). Each returns {t, hl}; hl names the meters or parts the step brackets (D8). */
  function Steps(g, b, a, meta) {
    var ideal = !(b.r > 0) && !(a.r > 0), A = meta.amm, Vt = meta.volt;
    var S = {
      F: function (change) {
        return { t: ideal ? 'The emf (' + n(b.emf, 'V') + ') stays the same: it belongs to the battery and does not change when the circuit connected to it is changed. It is an ideal battery (no internal resistance), so the pd across it always equals the emf. What changed is the arrangement: ' + change + '.'
          : 'The emf (' + n(b.emf, 'V') + ') and the internal resistance (' + n(b.r, 'Ω') + ') stay the same: they belong to the battery and do not change when the circuit connected to it is changed. What changed is the arrangement: ' + change + '.', hl: [], code: ideal ? 'F-10' : 'F-r' };
      },
      Fbat: function (change) {
        return { t: 'The external circuit stays the same. What changed is the battery itself: ' + change + '.' + (g >= 11 ? ' The emf and r change only when the battery itself changes: another battery, an older one, or one that warms as it is used.' : ''), hl: [], code: 'F-bat' };
      },
      RX: function (reason) {
        return { t: 'The ' + (ideal ? 'total' : 'external') + ' resistance ' + dirOf(b.Rext, a.Rext) + ', ' + ft(b.Rext, a.Rext, 'Ω') + ', because ' + reason + '.', hl: [], code: 'RX' };
      },
      I: function () {
        return { t: 'So the current ' + dirOf(b.I, a.I) + ', ' + ft(b.I, a.I, 'A') + ', because ' + (ideal ? 'I = V/R and the emf is fixed.' : 'I = emf/(Rext + r) and the emf is fixed.'), hl: [A], code: ideal ? 'I-10' : 'I-r' };
      },
      Ibat: function () {
        return { t: 'So the current ' + dirOf(b.I, a.I) + ', ' + ft(b.I, a.I, 'A') + ', because ' + (ideal ? 'I = V/R: the battery’s pd (its emf) changed from ' + n(b.emf, 'V') + ' to ' + n(a.emf, 'V') + ' while the total resistance stayed at ' + n(a.Rt, 'Ω') + '.'
          : 'I = emf/(Rext + r): the emf changed from ' + n(b.emf, 'V') + ' to ' + n(a.emf, 'V') + ' while the total resistance stayed at ' + n(a.Rt, 'Ω') + '.'), hl: [A], code: ideal ? 'I-bat-10' : 'I-bat' };
      },
      LV: function () { return { t: 'So the lost volts ' + dirOf(b.Ir, a.Ir).replace('increases', 'increase').replace('decreases', 'decrease').replace('stays', 'stay') + ', ' + ft(b.Ir, a.Ir, 'V') + ', because Vinternal resistance = Ir and r is fixed.', hl: [], code: 'LV' }; },
      TV: function () { return { t: 'So the terminal pd ' + dirOf(b.term, a.term) + ', ' + ft(b.term, a.term, 'V') + ', because Vload = emf − Ir.', hl: [Vt], code: 'TV' }; },
      VF: function (X, id, hl, fixed) {
        return { t: 'The pd across ' + X + ' ' + dirOf(b.v[id], a.v[id]) + ', ' + ft(b.v[id], a.v[id], 'V') + ', because V = IR and the resistance of ' + (fixed || X) + ' is fixed.', hl: hl ? [hl] : [], code: 'VF' };
      },
      VS: function (Y, id, hl, why) {
        var to = ideal ? 'the emf (' + n(a.emf, 'V') + ')' : 'the terminal pd';
        return { t: 'So the pd across ' + Y + ' ' + dirOf(b.v[id], a.v[id]) + ', ' + ft(b.v[id], a.v[id], 'V') + ', because the pds in series add up to ' + to + (why ? ': ' + why : '') + '.', hl: hl ? [hl] : [], code: 'VS' };
      },
      IB: function (Y, id, hl) {
        return { t: 'So the current through ' + Y + ' ' + dirOf(b.i[id], a.i[id]) + ', ' + ft(b.i[id], a.i[id], 'A') + ', because I = V/R and R is fixed.', hl: hl ? [hl] : [], code: 'IB' };
      },
      P: function (id, who, eq) {
        who = who || 'the bulb';
        var d = dirOf(b.p[id], a.p[id]);
        return { t: 'So ' + who + '’s power ' + d + ', ' + ft(b.p[id], a.p[id], 'W') + ', because ' + (eq || 'P = V²/R') + ' and R is fixed' + (d === 'stays the same' ? ': ' + who + ' is just as bright.' : ': ' + who + ' is ' + (d === 'increases' ? 'brighter.' : 'dimmer.')), hl: [id], code: 'P' };
      },
      O1: function (why) { return { t: 'No current flows, because the circuit is open' + (why ? ' (' + why + ')' : '') + '. The current falls ' + ft(b.I, a.I, 'A') + '.', hl: [A], code: 'O1' }; },
      O2: function () {
        return ideal ? { t: 'The battery is ideal (no internal resistance), so the voltmeter across it reads the emf (' + n(a.emf, 'V') + ') whether or not a current flows.', hl: [Vt], code: 'O2-10' }
          : { t: 'So there are no lost volts (Ir = 0): the voltmeter across the battery reads the emf. ' + cap(Vt) + ' rises ' + ft(b.term, a.term, 'V') + '.', hl: [Vt], code: 'O2' };
      },
      O3: function (id, where) {
        return { t: 'No current flows anywhere, so there is no pd across any resistor (V = IR with I = 0). The two ends of the voltmeter across ' + where + ' are at the potentials of the two terminals, so it reads the emf. Its reading ' + dirOf(b.read[id], a.read[id]).replace('increases', 'rises').replace('decreases', 'falls') + ', ' + ft(b.read[id], a.read[id], 'V') + '.', hl: [id], code: 'O3' };
      },
      O4: function (id, Y) {
        return { t: 'No current flows in the branch with the open switch, so the resistors in that branch have no pd (V = IR with I = 0). So the voltmeter across the switch reads the pd across the whole branch: ' + n(a.read[id], 'V') + ', the same as the pd across ' + Y + ', which is in parallel with it.', hl: [id], code: 'O4' };
      },
      SC: function (X, id) { return { t: 'The ammeter has negligible resistance, so it short-circuits ' + X + ': no current flows through ' + X + '.', hl: id ? [id] : [], code: 'SC' }; },
      X: function (t, hl) { return { t: t, hl: hl || [], code: 'X' }; }
    };
    return S;
  }

  /* ---------- circuits and events (§7.2-§7.4) ---------- */
  var PAIR = 'the parallel pair (the bulb and R3)';
  var CIRC = {
    A: { preset: function (g) { return g === 10 ? 'A10' : 'A'; }, amm: 'A1', volt: 'V1', bulbs: ['L'] },
    B: { preset: function () { return 'B'; }, amm: 'A', volt: 'V', bulbs: ['L1'] },
    C: { preset: function () { return 'C'; }, amm: 'A', volt: 'V', bulbs: ['L1'] },
    D: { preset: function () { return 'D'; }, amm: 'A', volt: null, bulbs: ['X', 'Y'] },
    E: { preset: function (g) { return g === 10 ? 'E10' : 'E'; }, amm: 'A', volt: 'V1', bulbs: ['L'] }
  };
  var FAM = {
    rheo: 'Rheostat', main: 'Main switch', branch: 'Branch added or removed', fail: 'A part fails',
    meter: 'Meter swapped', battery: 'The battery changes', emf: 'A larger emf'
  };
  var PROBE_S1 = { id: 'Vs', kind: 'voltmeter', a: [0, 0], b: [0, 1], side: 'left', probe: true };
  var PROBE_S2 = { id: 'Vp', kind: 'voltmeter', a: [4, 4], b: [5, 4], side: 'down', off: 0.62, lx: 0.22, probe: true };
  function rh(g, up) { return g === 10 ? (up ? 6 : 2) : (up ? 5 : 1); }
  function rh0(g) { return g === 10 ? 4 : 3; }

  var EV = [
    { id: 'E1', fam: 'rheo', c: 'A', grades: [10, 11, 12], title: 'Turn the rheostat up', ask: 'L', route: true,
      banner: function (g) { return 'The rheostat’s resistance is increased from ' + rh0(g) + ' Ω to ' + rh(g, 1) + ' Ω. How will this affect the readings?'; },
      control: 'Turn the rheostat up', change: function (s, g) { part(s, 'Rh').R = rh(g, 1); },
      steps: function (S, g) {
        var c = 'the rheostat is turned up, from ' + rh0(g) + ' Ω to ' + rh(g, 1) + ' Ω';
        return g === 10 ? [S.F(c), S.RX('the rheostat’s resistance increases'), S.I(), S.VF(PAIR, 'R3', 'V3', 'the pair'), S.IB('the bulb', 'L', 'A2'), S.P('L')]
          : [S.F(c), S.RX('the rheostat’s resistance increases'), S.I(), S.LV(), S.TV(), S.VF(PAIR, 'R3', 'V3', 'the pair'), S.IB('the bulb', 'L', 'A2'), S.P('L')];
      },
      other: function (g, b, a) {
        return g === 10 ? 'V = IR alone cannot decide V2: the current falls (' + ft(b.I, a.I, 'A') + ') while the rheostat’s resistance rises. Use the pd shares instead: the pds in series add up to 12 V, and the pair’s pd falls (' + ft(b.v.R3, a.v.R3, 'V') + '), so the rheostat takes a bigger share: V2 rises ' + ft(b.v.Rh, a.v.Rh, 'V') + '.'
          : 'V = IR alone cannot decide V2: the current falls (' + ft(b.I, a.I, 'A') + ') while the rheostat’s resistance rises. Use the pds in series instead: V2 = V1 − V3, and V1 rose while V3 fell, so V2 rises ' + ft(b.v.Rh, a.v.Rh, 'V') + '.';
      } },
    { id: 'E2', fam: 'rheo', c: 'A', grades: [10, 11, 12], title: 'Turn the rheostat down', ask: 'L',
      banner: function (g) { return 'The rheostat’s resistance is decreased from ' + rh0(g) + ' Ω to ' + rh(g, 0) + ' Ω. How will this affect the readings?'; },
      control: 'Turn the rheostat down', change: function (s, g) { part(s, 'Rh').R = rh(g, 0); },
      steps: function (S, g) {
        var c = 'the rheostat is turned down, from ' + rh0(g) + ' Ω to ' + rh(g, 0) + ' Ω';
        return g === 10 ? [S.F(c), S.RX('the rheostat’s resistance decreases'), S.I(), S.VF(PAIR, 'R3', 'V3', 'the pair'), S.VS('the rheostat', 'Rh', 'V2'), S.P('L')]
          : [S.F(c), S.RX('the rheostat’s resistance decreases'), S.I(), S.LV(), S.TV(), S.VF(PAIR, 'R3', 'V3', 'the pair'), S.IB('the bulb', 'L', 'A2'), S.P('L')];
      } },
    { id: 'E3', fam: 'main', c: 'A', grades: [10, 11, 12], title: 'Open the main switch', ask: 'Vs', probes: [PROBE_S1],
      banner: function () { return 'Switch S1 is opened. How will this affect the readings? A voltmeter Vs is connected across S1.'; },
      control: 'Open S1', change: function (s) { part(s, 'S1').closed = false; },
      steps: function (S) { return [S.F('switch S1 is opened'), S.O1(), S.O2(), S.O3('Vs', 'the gap at S1')]; } },
    { id: 'E3b', fam: 'main', c: 'A', grades: [10, 11, 12], title: 'Close the main switch again', ask: 'V1', probes: [PROBE_S1],
      start: function (s) { part(s, 'S1').closed = false; },
      banner: function () { return 'Switch S1 is closed again. How will this affect the readings?'; },
      control: 'Close S1', change: function (s) { part(s, 'S1').closed = true; },
      steps: function (S, g, b, a) {
        var on = S.X('The circuit is closed, so a current flows: the current increases, ' + ft(b.I, a.I, 'A') + ', because ' + (g === 10 ? 'I = V/R = 12 V ÷ ' + F.num(a.Rt, 0) + ' Ω' : 'I = emf/(Rext + r)') + '.', ['A1']);
        return g === 10 ? [S.F('switch S1 is closed again'), on, S.X('The battery is ideal (no internal resistance), so V1 stays at ' + n(a.term, 'V') + ': the pd across it always equals the emf.', ['V1']), S.VF(PAIR, 'R3', 'V3', 'the pair')]
          : [S.F('switch S1 is closed again'), on, S.LV(), S.TV()];
      } },
    { id: 'E4', fam: 'branch', c: 'A', grades: [10, 11, 12], title: 'Open switch S2', ask: 'L', probes: [PROBE_S2], route: true,
      banner: function () { return 'Switch S2 is opened. How will this affect the readings? A voltmeter Vp is connected across S2.'; },
      control: 'Open S2', change: function (s) { part(s, 'S2').closed = false; },
      steps: function (S, g) {
        var c = 'switch S2 is opened, so the R3 branch is removed';
        return g === 10 ? [S.F(c), S.RX('there is one parallel path fewer'), S.I(), S.VF('the rheostat', 'Rh', 'V2'), S.VS('the bulb', 'L', 'V3'), S.P('L'), S.O4('Vp', 'the bulb')]
          : [S.F(c), S.RX('there is one parallel path fewer'), S.I(), S.LV(), S.TV(), S.VF('the rheostat', 'Rh', 'V2'), S.VS('the bulb', 'L', 'V3'), S.P('L'), S.O4('Vp', 'the bulb')];
      },
      other: function (g, b, a) {
        return g === 10 ? 'Another route, with pd shares: the pair’s resistance rises from 4 Ω to 6 Ω while the rheostat stays at 4 Ω, so the pair takes a bigger share of the 12 V: 12 × 6/10 = ' + n(a.v.L, 'V') + '.'
          : 'Another route: V1 = emf × Rext/(Rext + r) = 12 × ' + F.num(a.Rext, 0) + '/' + F.num(a.Rt, 0) + ' = ' + n(a.term, 'V') + '. Rext rose while the emf and r stayed the same, so V1 rises.';
      } },
    { id: 'E4b', fam: 'branch', c: 'A', grades: [10, 11, 12], title: 'Close switch S2 again', ask: 'L', probes: [PROBE_S2],
      start: function (s) { part(s, 'S2').closed = false; },
      banner: function () { return 'Switch S2 is closed again. How will this affect the readings?'; },
      control: 'Close S2', change: function (s) { part(s, 'S2').closed = true; },
      steps: function (S, g) {
        var c = 'switch S2 is closed, so a parallel path is added';
        return g === 10 ? [S.F(c), S.RX('a resistor added in parallel adds a path'), S.I(), S.VF('the rheostat', 'Rh', 'V2'), S.VS('the bulb', 'L', 'V3'), S.P('L')]
          : [S.F(c), S.RX('a resistor added in parallel adds a path'), S.I(), S.LV(), S.TV(), S.VF('the rheostat', 'Rh', 'V2'), S.VS('the bulb', 'L', 'V3'), S.P('L')];
      } },
    { id: 'E5', fam: 'fail', c: 'A', grades: [10, 11, 12], title: 'The bulb fails', ask: 'IR3', extra: ['IR3'], route: true,
      banner: function () { return 'The bulb’s filament breaks. How will this affect the readings and the current through R3?'; },
      control: 'The bulb fails', change: function (s) { part(s, 'L').broken = true; },
      steps: function (S, g) {
        var c = 'the bulb’s filament breaks, so its branch is open';
        var rx = S.RX('the pair becomes R3 alone: its resistance rises from 4 Ω to 12 Ω');
        return g === 10 ? [S.F(c), rx, S.I(), S.VF('the rheostat', 'Rh', 'V2'), S.VS('R3', 'R3', 'V3'), S.IB('R3', 'R3', 'IR3')]
          : [S.F(c), rx, S.I(), S.LV(), S.TV(), S.VF('the rheostat', 'Rh', 'V2'), S.VS('R3', 'R3', 'V3'), S.IB('R3', 'R3', 'IR3')];
      },
      other: function (g, b, a) {
        return 'V = IR alone cannot decide V3: the current falls (' + ft(b.I, a.I, 'A') + ') while the pair’s resistance rises (4 Ω to 12 Ω). Use the pds in series instead: V3 = ' + (g === 10 ? '12 V' : 'V1') + ' − V2 = ' + F.num(g === 10 ? 12 : a.term) + ' − ' + F.num(a.v.Rh) + ' = ' + n(a.v.R3, 'V') + '.';
      } },
    { id: 'E5b', fam: 'fail', c: 'A', grades: [10, 11, 12], title: 'The bulb fails with S2 open', ask: 'V3',
      start: function (s) { part(s, 'S2').closed = false; },
      banner: function () { return 'Switch S2 is open. The bulb’s filament breaks. How will this affect the readings?'; },
      control: 'The bulb fails', change: function (s) { part(s, 'L').broken = true; },
      steps: function (S) { return [S.F('the bulb’s filament breaks while S2 is open'), S.O1('the only path ran through the bulb'), S.O2(), S.O3('V3', 'the failed bulb')]; } },
    { id: 'E6a', fam: 'meter', c: 'A', grades: [10, 11, 12], title: 'An ammeter where V3 was', ask: 'L', swap: 'V3',
      banner: function () { return 'Voltmeter V3 is replaced by an ammeter. How will this affect the readings and the bulb?'; },
      control: 'Put an ammeter in V3’s place', change: function (s) { var m = part(s, 'V3'); m.as = 'ammeter'; m.letter = 'A'; m.unit = 'A'; },
      steps: function (S, g, b, a) {
        var c = 'an ammeter is connected where V3 was, across the bulb and R3';
        var out = S.X('No current flows through the bulb, so it goes out: its power falls ' + ft(b.p.L, a.p.L, 'W') + '.', ['L']);
        return g === 10 ? [S.F(c), S.SC('the bulb and R3'), S.RX('the pair is short-circuited, so its resistance is almost zero'), S.I(), S.VS('the rheostat', 'Rh', 'V2'), out]
          : [S.F(c), S.SC('the bulb and R3'), S.RX('the pair is short-circuited, so its resistance is almost zero'), S.I(), S.LV(), S.TV(), out];
      } },
    { id: 'E6b', fam: 'meter', c: 'A', grades: [10, 11, 12], title: 'An ammeter where V2 was', ask: 'L', swap: 'V2',
      banner: function () { return 'Voltmeter V2 is replaced by an ammeter. How will this affect the readings and the bulb?'; },
      control: 'Put an ammeter in V2’s place', change: function (s) { var m = part(s, 'V2'); m.as = 'ammeter'; m.letter = 'A'; m.unit = 'A'; },
      steps: function (S, g) {
        var c = 'an ammeter is connected where V2 was, across the rheostat';
        return g === 10 ? [S.F(c), S.SC('the rheostat', 'Rh'), S.RX('the rheostat is short-circuited'), S.I(), S.VS('the bulb', 'L', 'V3', 'the rheostat has no pd now'), S.P('L')]
          : [S.F(c), S.SC('the rheostat', 'Rh'), S.RX('the rheostat is short-circuited'), S.I(), S.LV(), S.TV(), S.VS('the bulb', 'L', 'V3', 'the rheostat has no pd now'), S.P('L')];
      } },
    { id: 'E6c', fam: 'meter', c: 'A', grades: [10, 11, 12], title: 'A voltmeter where A1 was', ask: 'A2', swap: 'A1',
      banner: function () { return 'Ammeter A1 is replaced by a voltmeter. What will each meter read?'; },
      control: 'Put a voltmeter in A1’s place', change: function (s) { var m = part(s, 'A1'); m.as = 'voltmeter'; m.letter = 'V'; m.unit = 'V'; },
      steps: function (S, g, b, a) {
        return [S.F('a voltmeter is connected where A1 was, in series'), S.X('The voltmeter’s resistance is very large, so almost no current flows: A2 falls ' + ft(b.read.A2, a.read.A2, 'A') + '.', ['A2']), S.O2(),
          S.X('No current flows, so there is no pd across any resistor (V = IR with I = 0). So the voltmeter in series reads the emf: ' + n(a.read.A1, 'V') + '.', ['A1'])];
      } },
    { id: 'E6d', fam: 'meter', c: 'A', grades: [11, 12], title: 'An ammeter across the battery', ask: 'L', swap: 'V1',
      banner: function () { return 'Voltmeter V1 is replaced by an ammeter, straight across the battery. What happens?'; },
      control: 'Put an ammeter in V1’s place', change: function (s) { var m = part(s, 'V1'); m.as = 'ammeter'; m.letter = 'A'; m.unit = 'A'; },
      steps: function (S, g, b, a) {
        return [S.F('an ammeter is connected across the battery, where V1 was'), S.SC('the external circuit'),
          S.X('The only resistance left is r, so I = emf/r = 12/' + F.num(a.r, 0) + ' = ' + n(a.read.V1, 'A') + ' through the new ammeter.', ['V1']),
          S.X('The terminal pd falls to 0 V, because the ammeter now joins the terminals: the bulb goes out, ' + ft(b.p.L, a.p.L, 'W') + '.', ['L']),
          S.X('All ' + n(a.Ir * a.read.V1, 'W') + ' is turned to heat inside the battery (P = I²r). Never do this.')];
      } },
    { id: 'E7', fam: 'battery', c: 'A', grades: [11, 12], title: 'The battery’s r increases', ask: 'V1', route: true, bat: true,
      banner: function () { return 'The battery is replaced by one with the same emf but an internal resistance of 2 Ω. How will this affect the readings?'; },
      control: 'Change r from 1 Ω to 2 Ω', change: function (s) { part(s, 'B').r = 2; },
      steps: function (S, g, b, a) {
        return [S.Fbat('the internal resistance increases, from 1 Ω to 2 Ω'),
          S.X('The total resistance (Rext + r) increases, ' + ft(b.Rt, a.Rt, 'Ω') + ', because r increased while Rext stayed at ' + n(a.Rext, 'Ω') + '.'),
          S.I(), S.X('So V1 decreases, ' + ft(b.term, a.term, 'V') + ', because V1 = I × Rext and Rext is fixed.', ['V1']),
          S.X('Look out: the lost volts increased, ' + ft(b.Ir, a.Ir, 'V') + ', although the current decreased. “Less current, fewer lost volts” fails here, because r changed too.')];
      },
      other: function () { return 'Vload = emf − Ir cannot decide V1 on its own here: I fell while r rose, so Ir could go either way. V1 = I × Rext can decide it, because Rext is fixed.'; } },
    { id: 'E7b', fam: 'battery', c: 'A', grades: [11, 12], title: 'The battery’s r decreases', ask: 'V1', bat: true,
      banner: function () { return 'The battery is replaced by one with the same emf but an internal resistance of 0,5 Ω. How will this affect the readings?'; },
      control: 'Change r from 1 Ω to 0,5 Ω', change: function (s) { part(s, 'B').r = 0.5; },
      steps: function (S, g, b, a) {
        return [S.Fbat('the internal resistance decreases, from 1 Ω to 0,5 Ω'),
          S.X('The total resistance (Rext + r) decreases, ' + ft(b.Rt, a.Rt, 'Ω') + ', because r decreased while Rext stayed at ' + n(a.Rext, 'Ω') + '.'),
          S.I(), S.X('So V1 increases, ' + ft(b.term, a.term, 'V') + ', because V1 = I × Rext and Rext is fixed.', ['V1']),
          S.X('Notice: the lost volts decreased, ' + ft(b.Ir, a.Ir, 'V') + ', although the current increased, because r changed too.')];
      } },
    { id: 'E8', fam: 'emf', c: 'A', grades: [10, 11, 12], title: 'A battery with a larger emf', ask: 'L', bat: true,
      banner: function () { return 'The battery is replaced by one with an emf of 18 V and the same internal resistance. How will this affect the readings?'; },
      control: 'Change the emf from 12 V to 18 V', change: function (s) { part(s, 'B').emf = 18; },
      steps: function (S, g, b, a) {
        return [S.Fbat('the emf increases, from 12 V to 18 V'), S.X('The total resistance stays the same, at ' + n(a.Rt, 'Ω') + '.'), S.Ibat(), S.VF(PAIR, 'R3', 'V3', 'the pair'), S.P('L', 'the bulb', 'P = I²R')];
      } },
    { id: 'B-1', fam: 'branch', c: 'B', grades: [11, 12], title: 'Start the car: headlamps and a starter motor', ask: 'L1',
      banner: function () { return 'The headlamps are on. Switch S2 is closed to start the motor. How will this affect the headlamps?'; },
      control: 'Close S2 (start the motor)', change: function (s) { part(s, 'S2').closed = true; },
      steps: function (S, g, b, a) {
        return [S.F('switch S2 is closed, so the starter motor is added in parallel'), S.RX('the motor adds a parallel path'), S.I(), S.LV(), S.TV(),
          S.X('The terminal pd is the pd across the headlamps, so the current through each headlamp decreases, ' + ft(b.i.L1, a.i.L1, 'A') + ', because I = V/R and R is fixed.'), S.P('L1', 'each headlamp')];
      } },
    { id: 'C-1', fam: 'branch', c: 'C', grades: [10, 11, 12], title: 'A second lamp across the battery', ask: 'L1',
      start: function (s, g) { if (g >= 11) part(s, 'B').r = 1; },
      banner: function (g) { return 'Switch S is closed, so lamp L2 is added in parallel with L1' + (g >= 11 ? ' (the battery has r = 1 Ω)' : '') + '. How will this affect L1?'; },
      control: 'Close S', change: function (s) { part(s, 'S').closed = true; },
      steps: function (S, g, b, a) {
        return g === 10 ? [S.F('switch S is closed, so L2 is added in parallel'), S.RX('L2 adds a parallel path'), S.I(), S.X('The pd across L1 stays the same, at ' + n(a.v.L1, 'V') + ': it is the battery’s pd, and an ideal battery’s pd is fixed.', ['V']), S.P('L1', 'L1')]
          : [S.F('switch S is closed, so L2 is added in parallel'), S.RX('L2 adds a parallel path'), S.I(), S.LV(), S.TV(), S.P('L1', 'L1')];
      } },
    { id: 'D-1', fam: 'branch', c: 'D', grades: [10, 11, 12], title: 'A lamp added across Y', ask: 'Y',
      banner: function () { return 'Switch S is closed, so lamp Z is added across lamp Y. What happens to lamps X and Y?'; },
      control: 'Close S', change: function (s) { part(s, 'S').closed = true; },
      steps: function (S) {
        return [S.F('switch S is closed, so lamp Z is added across Y'), S.RX('Z adds a parallel path across Y'), S.I(), S.P('X', 'lamp X', 'P = I²R'),
          S.VF('lamp X', 'X'), S.VS('lamp Y', 'Y', null, 'the pd across X increased'), S.P('Y', 'lamp Y')];
      } },
    { id: 'E-1', fam: 'rheo', c: 'E', grades: [10, 11, 12], title: 'A rheostat after the bulb', ask: 'L',
      banner: function () { return 'The rheostat comes after the bulb. Its resistance is increased from 3 Ω to 5 Ω. How will this affect the bulb?'; },
      control: 'Turn the rheostat up', change: function (s) { part(s, 'Rh').R = 5; },
      steps: function (S, g) {
        var c = 'the rheostat is turned up, from 3 Ω to 5 Ω', P = S.P('L', 'the bulb', 'P = I²R');
        P.t += ' A series loop has one current, so the rheostat changes the bulb’s current wherever it sits.';
        return g === 10 ? [S.F(c), S.RX('the rheostat’s resistance increases'), S.I(), P] : [S.F(c), S.RX('the rheostat’s resistance increases'), S.I(), S.LV(), S.TV(), P];
      } }
  ];
  function evById(id) { for (var i = 0; i < EV.length; i++) if (EV[i].id === id) return EV[i]; return null; }

  /* prediction cards: diagram order, never reasoning order (§7.7) */
  var LABELS = { L: 'Brightness of the bulb', L1: 'Brightness of L1', X: 'Brightness of lamp X', Y: 'Brightness of lamp Y', IR3: 'Current through R3' };
  function cardList(ev, spec, level) {
    var meta = CIRC[ev.c], all = [];
    spec.parts.forEach(function (p) {
      if ((p.kind === 'ammeter' || p.kind === 'voltmeter') && p.id !== ev.swap) all.push(p.id);
    });
    (ev.extra || []).forEach(function (x) { all.push(x); });
    meta.bulbs.forEach(function (b) { all.push(b); });
    if (level === 'A' || level === 'B') {
      var few = [ev.ask, meta.amm].concat(meta.bulbs.slice(0, 1));
      all = all.filter(function (x) { return few.indexOf(x) >= 0; });
    }
    return all;
  }
  function valueOf(q, id) {
    if (LABELS[id] && id !== 'IR3') return q.p[id];
    if (id === 'IR3') return q.i.R3;
    return q.read[id];
  }
  function cardName(id) { return LABELS[id] || ('Reading on ' + id.replace(/(\d)/, function (d) { return '₀₁₂₃₄₅₆₇₈₉'[d]; })); }
  function unitOf(spec, id) {
    if (LABELS[id]) return id === 'IR3' ? 'A' : 'W';
    var p = part(spec, id); return p.unit || (p.kind === 'ammeter' ? 'A' : 'V');
  }

  /* ---------- the list page ---------- */
  function levelOf(d, fam, g) { return (d.lv && d.lv[fam]) || (g === 12 ? 'B' : 'A'); }
  function list(ctx) {
    var h = ctx.h, g = ctx.grade(), d = load();
    document.title = 'Explain a change · Circuits Studio';
    var fams = {}, pre = h('div', {});
    if (window.ChainCards) window.ChainCards.preList(ctx, pre);
    EV.filter(function (e) { return e.grades.indexOf(g) >= 0; }).forEach(function (e) { (fams[e.fam] = fams[e.fam] || []).push(e); });
    ctx.main.appendChild(h('div', { class: 'wrap' }, [
      h('div', { class: 'row' }, [h('a', { class: 'chip', href: '#home', text: '← Studio home' }), h('span', { class: 'chip', text: g === 10 ? 'Book 10.3' : 'Book 11.3' })]),
      h('h1', { text: 'Explain a change', style: 'margin-top:10px' }),
      h('p', { text: 'Predict what each meter will do, make the change, compare, then reason it out step by step and answer it as an exam question.' }),
      h('div', { class: 'note small', text: 'Every reading changes at the same instant. The reasoning panel shows the order we reason in, not the order things happen.' }),
      pre,
      h('div', {}, Object.keys(FAM).filter(function (f) { return fams[f]; }).map(function (f) {
        return h('div', { style: 'margin-top:16px' }, [h('h2', { text: FAM[f] }),
          h('div', { class: 'grid' }, fams[f].map(function (e) {
            var done = d.done && d.done[g + '/' + e.id];
            return h('a', { class: 'card pcard', href: '#explain/' + e.id }, [h('h3', { text: e.title }), h('p', { class: 'small muted', text: e.banner(g) }),
              done ? h('span', { class: 'chip', text: 'Done' }) : null]);
          }))]);
      })),
      g === 10 ? h('p', { class: 'small muted', style: 'margin-top:14px', text: 'An ammeter straight across an ideal battery is a short circuit with no resistance at all, so the model stops there. Grade 11 meets internal resistance, which limits that current.' }) : null
    ]));
  }

  /* ---------- the operating-point card (D6; Gr 11 and 12) ---------- */
  function opCard(h, b, a) {
    var W = 300, Ht = 190, L = 44, T = 14, Rr = 14, B = 36, w = W - L - Rr, hh = Ht - T - B;
    var Imax = Math.max(0.5, Math.max(b.I, a.I) * 1.5), Vmax = Math.max(b.emf, a.emf) * 1.15;
    function X(i) { return L + w * i / Imax; } function Y(v) { return T + hh * (1 - v / Vmax); }
    function line(emf, r, cls) { var i2 = r > 0 ? Math.min(Imax, emf / r) : Imax, v2 = emf - r * i2; return '<line class="' + cls + '" x1="' + X(0) + '" y1="' + Y(emf) + '" x2="' + X(i2) + '" y2="' + Y(v2) + '"/>'; }
    var s = '<svg class="opcard" viewBox="0 0 ' + W + ' ' + Ht + '" role="img" aria-label="Terminal pd against current: the operating point">';
    s += '<line class="ax" x1="' + L + '" y1="' + (T + hh) + '" x2="' + (L + w) + '" y2="' + (T + hh) + '"/><line class="ax" x1="' + L + '" y1="' + T + '" x2="' + L + '" y2="' + (T + hh) + '"/>';
    s += '<text class="axl" x="' + (L + w / 2) + '" y="' + (Ht - 6) + '" text-anchor="middle">Current I (A)</text>';
    s += '<text class="axl" transform="translate(12 ' + (T + hh / 2) + ') rotate(-90)" text-anchor="middle">Terminal pd V (V)</text>';
    s += '<text class="tick" x="' + (L - 4) + '" y="' + (Y(b.emf) + 4) + '" text-anchor="end">' + F.num(b.emf, 0) + '</text>';
    if (a.emf !== b.emf) s += '<text class="tick" x="' + (L - 4) + '" y="' + (Y(a.emf) + 4) + '" text-anchor="end">' + F.num(a.emf, 0) + '</text>';
    var moved = a.emf !== b.emf || a.r !== b.r;
    if (moved) s += line(b.emf, b.r, 'ln old');
    s += line(a.emf, a.r, 'ln');
    s += '<circle class="dot old" cx="' + X(b.I) + '" cy="' + Y(b.term) + '" r="5"/><circle class="dot" cx="' + X(a.I) + '" cy="' + Y(a.term) + '" r="6"/>';
    s += '</svg>';
    var say = moved ? (a.r !== b.r ? 'The battery changed: the line is ' + (a.r > b.r ? 'steeper' : 'less steep') + ' (gradient −r), with the same intercept (the emf).' : 'The battery changed: the line moved up (intercept = emf), with the same gradient (−r).')
      : 'The battery did not change, so the line V = emf − rI stays still. The change in the circuit only moves the dot along it.';
    return h('div', { class: 'card', style: 'margin-top:12px' }, [h('h3', { text: 'The operating point' }), h('div', { html: s }),
      h('p', { class: 'small', text: say + ' Dot: (' + F.num(b.I) + ' A; ' + F.num(b.term) + ' V) to (' + F.num(a.I) + ' A; ' + F.num(a.term) + ' V).' })]);
  }

  /* ---------- one event: stages 0 to 4 ---------- */
  function run(id, params, ctx) {
    var h = ctx.h, g = ctx.grade(), ev = evById(id), main = ctx.main;
    if (!ev) { main.appendChild(h('div', { class: 'wrap' }, [h('h1', { text: 'This change is not in the studio' }), h('p', {}, [h('a', { href: '#explain', text: 'All changes' })])])); return; }
    if (ev.grades.indexOf(g) < 0) {
      main.appendChild(h('div', { class: 'wrap' }, [h('h1', { text: ev.title }),
        h('div', { class: 'warnc', text: 'This change uses a battery’s internal resistance, which is Grade 11 work.' }),
        h('div', { class: 'row' }, [h('button', { class: 'btn', text: 'Switch to Grade 11', onclick: function () { ctx.setGrade(11, true); ctx.route(); } }), h('a', { class: 'btn ghost', href: '#explain', text: 'Grade ' + g + ' changes' })])]));
      return;
    }
    var meta = CIRC[ev.c], pre = PR.byId(meta.preset(g));
    document.title = ev.title + ' · Explain a change';
    var d = load(), level = params.level && /^[A-E]$/.test(params.level) ? params.level : levelOf(d, ev.fam, g);
    var spec = clone(pre.spec);
    (ev.probes || []).forEach(function (p) { spec.parts.push(clone(p)); });
    if (ev.probes && ev.probes[0].id === 'Vp') part(spec, 'V3').off = 1.6;   /* V3 drops below the probe across S2 */
    if (ev.c === 'A') part(spec, 'L').lx = 0.4;   /* clear of A2's 'before' line */
    if (ev.start) ev.start(spec, g);
    var res0 = solve(spec), res = res0, after = null, ghosts = {};
    var pref = {}, imax = 0;
    spec.parts.forEach(function (q) { if (q.kind === 'bulb') pref[q.id] = Math.max(1, res0.el[q.id] ? res0.el[q.id].p : 1); });
    res0.net.els.forEach(function (e) { imax = Math.max(imax, Math.abs(res0.el[e.id].i || 0)); });
    if (!imax) imax = 1.5;
    var b = snap(spec, res0), a = null, cards = cardList(ev, spec, level), pred = {}, sure = null, locked = false, changed = false;

    var canvas = h('div', { class: 'canvas' }), capt = h('div', { class: 'caption off', 'aria-hidden': 'true', text: 'All readings change at the same instant' });
    var side = h('div', {}), panel = h('div', {}), more = h('div', {});
    canvas.appendChild(capt);
    main.appendChild(h('div', { class: 'wrap' }, [
      h('div', { class: 'row' }, [h('a', { class: 'chip', href: '#explain', text: '← Explain a change' }), h('span', { class: 'chip', text: FAM[ev.fam] }), h('span', { class: 'chip', text: 'Book ' + pre.book })]),
      h('h1', { text: ev.title, style: 'margin-top:10px' }),
      h('div', { class: 'note banner', text: ev.banner(g) }),
      pre.note ? h('p', { class: 'small muted', text: pre.note }) : null
    ]));
    main.appendChild(h('div', { class: 'wrap' }, [h('div', { class: 'lab' }, [h('div', {}, [canvas, h('p', { class: 'small muted', style: 'margin-top:8px', text: PR.IDEAL })]), h('div', {}, [side])]), panel, more]));

    var box = null, T = null, hl = [];
    function draw(r) {
      var out = D.render(spec, r, { grade: g, ghosts: ghosts, pref: pref, imax: imax, vmax: Math.max(12, b.emf), still: T != null || reduced, title: ev.title });
      var old = canvas.querySelector('svg'); if (old) old.remove();
      canvas.insertAdjacentHTML('afterbegin', out.svg);
      var svg = canvas.querySelector('svg');
      try {
        var bb = svg.getBBox(), m = 12, x0 = bb.x - m, y0 = bb.y - m, x1 = bb.x + bb.width + m, y1 = bb.y + bb.height + m;
        if (box) { x0 = Math.min(x0, box[0]); y0 = Math.min(y0, box[1]); x1 = Math.max(x1, box[2]); y1 = Math.max(y1, box[3]); }
        box = [x0, y0, x1, y1]; svg.setAttribute('viewBox', [x0, y0, x1 - x0, y1 - y0].map(function (v) { return v.toFixed(1); }).join(' '));
      } catch (e) { /* not rendered yet */ }
      mark();
    }
    function mark() {   /* D8: a step only brackets quantities that have already changed */
      var svg = canvas.querySelector('svg'); if (!svg) return;
      Array.prototype.forEach.call(svg.querySelectorAll('.hl'), function (el) { el.classList.remove('hl'); });
      hl.forEach(function (id) {
        Array.prototype.forEach.call(svg.querySelectorAll('[data-meter="' + id + '"],[data-id="' + id + '"]'), function (el) { el.classList.add('hl'); });
      });
    }
    function mix(x, y, e) {
      var m = { state: 'ok', net: y.net, V: y.V.map(function (v, i) { var o = x.V[i]; return o == null ? v : o + (v - o) * e; }), el: {}, read: {}, battery: y.battery, bypassed: y.bypassed, flags: y.flags };
      for (var k in y.el) { var p = x.el[k] || y.el[k], q = y.el[k]; m.el[k] = { v: q.v, i: (p.i || 0) + ((q.i || 0) - (p.i || 0)) * e, p: (p.p || 0) + ((q.p || 0) - (p.p || 0)) * e }; }
      for (k in y.read) { var r0 = x.read[k], r1 = y.read[k]; m.read[k] = r0 == null || r1 == null ? r1 : r0 + (r1 - r0) * e; }
      return m;
    }
    /* D1: one solve, one 600 ms clock for every value. The tween record is exposed for the tests. */
    function doChange() {
      if (!locked || changed) return;
      changed = true;
      ev.change(spec, g);
      after = solve(spec); a = snap(spec, after);
      ghosts = {};
      spec.parts.forEach(function (q) {
        if ((q.kind === 'ammeter' || q.kind === 'voltmeter') && q.id !== ev.swap && !q.probe) ghosts[q.id] = { v: res0.read[q.id], word: WORD(res0.read[q.id], after.read[q.id]).replace('STAY THE SAME', 'STAYS THE SAME').replace('INCREASE', 'INCREASES').replace('DECREASE', 'DECREASES') };
      });
      ctx.say.textContent = 'Changed. ' + cards.map(function (c) { return cardName(c) + ' ' + dirOf(valueOf(b, c), valueOf(a, c)); }).join('; ') + '.';
      var t0 = performance.now();
      window.__chainTween = { start: t0, ms: 600, easing: 'easeInOutQuad', values: cards.length };
      if (reduced) { res = after; draw(res); compare(); return; }
      capt.classList.remove('off');
      ctx.stop(function () { if (T) cancelAnimationFrame(T); });
      (function frame(t) {
        var k = Math.min(1, (t - t0) / 600), e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
        window.__chainTween.k = k;
        if (k >= 1) { T = null; res = after; draw(res); compare(); setTimeout(function () { capt.classList.add('off'); }, 2400); return; }
        T = requestAnimationFrame(frame);
        draw(mix(res0, after, e));
      })(t0);
    }

    /* Stage 1: predict */
    function predict() {
      side.innerHTML = '';
      var grid = h('div', { class: 'predcs' }), lockBtn = h('button', { class: 'btn', text: 'Lock my predictions', disabled: true });
      var chg = h('button', { class: 'btn big', text: ev.control, disabled: true, 'aria-describedby': 'chgnote' });
      var note = h('p', { class: 'small muted', id: 'chgnote', text: 'The change is locked until you lock your predictions.' });
      function ready() { lockBtn.disabled = !(cards.every(function (c) { return pred[c]; }) && (sure || cards.indexOf(ev.ask) < 0)); }
      cards.forEach(function (c) {
        var opts = h('div', { class: 'seg', role: 'group', 'aria-label': cardName(c) }, ['INCREASE', 'DECREASE', 'STAY THE SAME'].map(function (w) {
          return h('button', { class: 'chipbtn', 'aria-pressed': 'false', text: w, onclick: function (e) {
            if (locked) return; pred[c] = w;
            Array.prototype.forEach.call(opts.querySelectorAll('button'), function (x) { x.setAttribute('aria-pressed', String(x === e.currentTarget)); });
            ready();
          } });
        }));
        var kids = [h('div', { class: 'pname', text: cardName(c) + (c === ev.ask ? ' (the question)' : '') }), h('div', { class: 'small muted', text: 'Now ' + F.num(valueOf(b, c)) + ' ' + unitOf(spec, c) }), opts];
        if (c === ev.ask) {
          var sb = h('div', { class: 'seg', role: 'group', 'aria-label': 'How sure are you?' }, ['Sure', 'Not sure'].map(function (w) {
            return h('button', { class: 'chipbtn small', 'aria-pressed': 'false', text: w, onclick: function (e) {
              if (locked) return; sure = w;
              Array.prototype.forEach.call(sb.querySelectorAll('button'), function (x) { x.setAttribute('aria-pressed', String(x === e.currentTarget)); });
              ready();
            } });
          }));
          kids.push(sb);
        }
        grid.appendChild(h('div', { class: 'predc' + (c === ev.ask ? ' ask' : '') }, kids));
      });
      lockBtn.onclick = function () {
        locked = true; lockBtn.disabled = true; lockBtn.textContent = 'Predictions locked';
        Array.prototype.forEach.call(grid.querySelectorAll('button'), function (x) { x.disabled = true; });
        chg.disabled = false; note.textContent = 'Now make the change and watch every meter.';
        chg.focus();
      };
      chg.onclick = doChange;
      side.appendChild(h('div', { class: 'card' }, [h('h3', { text: '1. Predict' }), h('p', { class: 'small', text: 'What will each one do when the change is made? Pick a word on every card, and say how sure you are on the question card.' }), grid,
        h('div', { class: 'row', style: 'margin-top:10px' }, [lockBtn]),
        h('h3', { text: '2. Change', style: 'margin-top:16px' }), h('div', { class: 'row' }, [chg]), note]));
    }

    /* Stage 3: compare */
    var steps = null;
    function compare() {
      var S = Steps(g, b, a, meta);
      steps = ev.steps(S, g, b, a);
      var order = [];
      steps.forEach(function (s, k) { s.hl.forEach(function (x) { if (order.indexOf(x) < 0) order.push(x); }); });
      var rows = [], right = [], wrong = [];
      cards.forEach(function (c) {
        var w = WORD(valueOf(b, c), valueOf(a, c)), ok = pred[c] === w;
        (ok ? right : wrong).push(c);
        rows.push(h('tr', {}, [h('td', { text: cardName(c) }), h('td', { class: 'n before', text: F.num(valueOf(b, c)) + ' ' + unitOf(spec, c) }), h('td', { class: 'n', text: F.num(valueOf(a, c)) + ' ' + unitOf(spec, c) }),
          h('td', { text: pred[c] }), h('td', { class: ok ? 'ok' : 'no', text: ok ? '✓' : '✗' })]));
      });
      wrong.sort(function (x, y) { var i = order.indexOf(x), j = order.indexOf(y); return (i < 0 ? 99 : i) - (j < 0 ? 99 : j); });
      var fb = right.length + ' of ' + cards.length + ' right' + (right.length ? ': ' + right.map(cardName).join(', ') + '.' : '.');
      var first = wrong[0], at = -1;
      if (first) steps.forEach(function (s, k) { if (at < 0 && s.hl.indexOf(first) >= 0) at = k; });
      var act = first ? cardName(first) + ' ' + (WORD(valueOf(b, first), valueOf(a, first)) === 'STAY THE SAME' ? 'stayed the same' : dirOf(valueOf(b, first), valueOf(a, first)).replace(/s$/, 'd')) + '. Open the reasoning' + (at >= 0 ? ' at step ' + (at + 1) : '') + ' to see why.' : 'Every prediction was right. Now check that you can give the reasons.';
      /* record on the device only: predictions are practice, never marks */
      var dd = load(); dd.pred = dd.pred || {}; var r = dd.pred[ev.fam] || { n: 0, right: 0, sureWrong: 0 };
      r.n += cards.length; r.right += right.length; if (sure === 'Sure' && wrong.indexOf(ev.ask) >= 0) r.sureWrong++; r.date = new Date().toISOString().slice(0, 10);
      dd.pred[ev.fam] = r; save(dd);
      side.innerHTML = '';
      side.appendChild(h('div', { class: 'card' }, [h('h3', { text: '3. Compare' }),
        h('div', { class: 'twrap' }, [h('table', { class: 'readings cmp' }, [h('thead', {}, [h('tr', {}, ['', 'Before', 'After', 'You said', ''].map(function (x) { return h('th', { text: x }); }))]), h('tbody', {}, rows)])]),
        h('p', { text: fb }), h('div', { class: first ? 'warnc' : 'okc', text: act }),
        sure === 'Sure' && wrong.indexOf(ev.ask) >= 0 ? h('p', { class: 'small', text: 'You were sure about the question card, and it went the other way. That is the most useful kind of mistake: the reasoning below shows the step that decides it.' }) : null,
        h('div', { class: 'row', style: 'margin-top:10px' }, [h('button', { class: 'btn', text: 'Why? Open the reasoning', onclick: function () { reason(at >= 0 ? at : 0); } })])]));
      if (level === 'A' || level === 'B') reason(0);
    }

    /* Stage 4: the reasoning panel, a separate layer with a fixed heading (D7), learner-paced (D10) */
    function reason(start) {
      var k = start || 0, alt = false;
      panel.innerHTML = '';
      var list = h('ol', { class: 'chain' }), ctrl = h('div', { class: 'row' }), extra = h('div', {});
      var back = h('button', { class: 'btn ghost', text: 'Back' }), next = h('button', { class: 'btn', text: 'Next' }), replay = h('button', { class: 'btn ghost', text: 'Replay' });
      function show() {
        list.innerHTML = '';
        steps.forEach(function (s, i) {
          if (i > k) return;
          list.appendChild(h('li', { class: i === k ? 'now' : '', text: s.t }));
        });
        hl = steps[k].hl; mark();
        back.disabled = k === 0; next.disabled = k >= steps.length - 1;
        next.textContent = k >= steps.length - 1 ? 'That is the whole chain' : 'Next';
        ctx.say.textContent = 'Step ' + (k + 1) + ' of ' + steps.length + ': ' + steps[k].t;
        if (k >= steps.length - 1) done();
      }
      back.onclick = function () { if (k > 0) { k--; show(); } };
      next.onclick = function () { if (k < steps.length - 1) { k++; show(); } };
      replay.onclick = function () { k = 0; show(); };
      ctrl.appendChild(back); ctrl.appendChild(next); ctrl.appendChild(replay);
      var kids = [h('h2', { text: 'Why? This is the order we reason in, not the order things happen.' }), list, ctrl];
      if (ev.route && ev.other) {
        var box2 = h('div', { class: 'note small hidden', text: ev.other(g, b, a) });
        kids.push(h('div', { style: 'margin-top:10px' }, [h('button', { class: 'btn ghost small', 'aria-expanded': 'false', text: 'Show another route', onclick: function (e) {
          alt = !alt; box2.classList.toggle('hidden', !alt); e.currentTarget.setAttribute('aria-expanded', String(alt)); e.currentTarget.textContent = alt ? 'Hide the other route' : 'Show another route';
        } }), box2]));
      }
      if (g >= 11 && (b.r > 0 || a.r > 0)) kids.push(opCard(h, b, a));
      kids.push(extra);
      panel.appendChild(h('div', { class: 'card chainpanel', style: 'margin-top:16px' }, kids));
      show();
      panel.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
      function done() {
        var dd = load(); dd.done = dd.done || {}; dd.done[g + '/' + ev.id] = 1; save(dd);
        more.innerHTML = '';
        if (window.ChainCards && window.ChainCards.mount) window.ChainCards.mount(more, { ev: ev, g: g, b: b, a: a, level: params.level && /^[A-E]$/.test(params.level) ? params.level : null, ctx: ctx, steps: steps, fam: ev.fam });
        else more.appendChild(h('div', { class: 'card', style: 'margin-top:16px' }, [h('p', { text: 'Exam cards for this change are coming next.' }), h('a', { class: 'btn ghost', href: '#explain', text: 'Another change' })]));
      }
    }

    draw(res);
    predict();
  }

  V.explain = function (arg, params, ctx) { if (arg) run(arg, params, ctx); else list(ctx); };
  /* design §1.4 and the book's short code m11-5 write #chain/<event>: same page as #explain */
  V.chain = function () { location.replace(location.hash.replace(/^#chain/, '#explain')); };
  var prevHome = V._homeCards;
  V._homeCards = function (c) {
    var H = c.h;
    return H('div', {}, [
      H('h2', { text: 'Explain a change' }),
      H('div', { class: 'grid' }, [H('a', { class: 'card pcard', href: '#explain' }, [H('h3', { text: 'Predict, change, reason' }), H('p', { class: 'small muted', text: 'Change one thing in a circuit, watch every meter move at once, then build the chain that wins the marks.' }), H('span', { class: 'chip', text: c.grade() === 10 ? 'Book 10.3' : 'Book 11.3' })])]),
      prevHome ? H('div', { style: 'margin-top:18px' }, [prevHome(c)]) : null
    ]);
  };
  /* for the tests and for cards.js */
  window.Chain = { EV: EV, CIRC: CIRC, FAM: FAM, evById: evById, solve: solve, snap: snap, Steps: Steps, WORD: WORD, dirOf: dirOf, load: load, save: save, levelOf: levelOf, PR: PR };
})();
