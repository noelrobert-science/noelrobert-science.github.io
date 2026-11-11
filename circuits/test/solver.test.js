/* node test/solver.test.js : every preset's expect block, the display rule, KCL, bypassed parts, states */
const S = require('../js/solver.js'), F = require('../js/fmt.js'), PR = require('../data/presets.js');
let fails = 0, n = 0;
function ok(c, msg) { n++; if (!c) { fails++; console.log('FAIL', msg); } }
function clone(o) { return JSON.parse(JSON.stringify(o)); }
function apply(spec, set) {
  const s = clone(spec);
  for (const id in (set || {})) { const p = s.parts.find(q => q.id === id); if (!p) throw new Error('no part ' + id); Object.assign(p, set[id]); }
  return s;
}
function value(res, key) {
  if (key in res.read) return res.read[key];
  const m = key.match(/^(P|I|V|lost)_(.+)$/); if (!m) return undefined;
  const e = res.el[m[2]]; if (!e) return undefined;
  if (m[1] === 'P') return e.p; if (m[1] === 'I') return Math.abs(e.i); if (m[1] === 'V') return Math.abs(e.v);
  if (m[1] === 'lost') return res.battery[m[2]].lost;
}
// display rule
[[13.125, '13.13'], [0.625, '0.63'], [13.124999999999, '13.13'], [1.005, '1.01'], [0.145, '0.15'], [810, '810.00'], [-2.5, '-2.50'], [1e-7, '0.00']].forEach(([x, w]) => ok(F.round(x) === w, `round ${x} -> ${F.round(x)} (want ${w})`));
ok(F.num(13.125) === '13,13', 'decimal comma');
ok(F.parse('4,5') === 4.5 && F.parse(' 1 500 ') === 1500 && F.parse('−2,5') === -2.5 && isNaN(F.parse('4,5,1')), 'parse');
// presets
for (const p of PR.list) {
  const runs = [{ label: 'start', set: {}, expect: p.expect.start }].concat(p.expect.events || []);
  for (const r of runs) {
    const res = S.solve(apply(p.spec, r.set));
    ok(res.state === 'ok', `${p.id} ${r.label}: state ${res.state}`);
    ok(S.kclError(res) < 1e-6, `${p.id} ${r.label}: KCL ${S.kclError(res)}`);
    for (const k in (r.expect || {})) {
      const v = value(res, k);
      ok(v != null && F.round(v) === F.round(r.expect[k]), `${p.id} ${r.label}: ${k} = ${v == null ? v : F.round(v)} (want ${F.round(r.expect[k])})`);
    }
  }
}
// bypassed ideal ammeter (§4.3 step 8): 12 V, r 1 Ω, 5 Ω; a 5-segment wire route across the ammeter
{
  const spec = { parts: [{ id: 'B', kind: 'battery', a: [2, 0], b: [0, 0], emf: 12, r: 1 }, { id: 'R', kind: 'resistor', a: [0, 2], b: [2, 2], R: 5 },
    { id: 'A', kind: 'ammeter', a: [2, 2], b: [2, 1] }],
    wires: [[[0, 0], [0, 2]], [[2, 1], [2, 0]], [[2, 2], [3, 2], [4, 2], [4, 1], [3, 1], [2, 1]]] };
  const res = S.solve(spec);
  ok(F.round(res.el.R.i) === '2.00' || F.round(-res.el.R.i) === '2.00', 'bypass: 2,00 A in R');
  ok(res.read.A < 1e-4, 'bypassed ammeter reads 0,00 A: ' + res.read.A);
  ok(res.bypassed.A, 'bypassed ammeter flagged S2');
}
// short circuits: ideal battery (S0), battery with r (S1), open circuit (S3), voltmeter in series (S4)
{
  const s0 = S.solve({ parts: [{ id: 'B', kind: 'battery', a: [1, 0], b: [0, 0], emf: 12, r: 0 }], wires: [[[0, 0], [0, 1], [1, 1], [1, 0]]] });
  ok(s0.state === 'S0', 'S0 ideal short');
  const s1 = S.solve({ parts: [{ id: 'B', kind: 'battery', a: [1, 0], b: [0, 0], emf: 12, r: 1 }], wires: [[[0, 0], [0, 1], [1, 1], [1, 0]]] });
  ok(s1.flags.includes('S1') && F.round(s1.battery.B.i) === '12.00' && F.round(Math.abs(s1.battery.B.terminal)) === '0.00', 'S1 short with r: 12,00 A, 0 V');
  const s3 = S.solve({ parts: [{ id: 'B', kind: 'battery', a: [2, 0], b: [0, 0], emf: 9, r: 0 }, { id: 'S', kind: 'switch', a: [0, 1], b: [0, 2], closed: false },
    { id: 'R', kind: 'resistor', a: [0, 2], b: [2, 2], R: 4 }, { id: 'V', kind: 'voltmeter', a: [0, 1], b: [0, 2] }], wires: [[[0, 0], [0, 1]], [[2, 2], [2, 0]]] });
  ok(s3.flags.includes('S4') || s3.flags.includes('S3'), 'open circuit flagged');
  ok(F.round(s3.read.V) === '9.00', 'voltmeter across an open switch reads the emf: ' + s3.read.V);
  const s4 = S.solve({ parts: [{ id: 'B', kind: 'battery', a: [2, 0], b: [0, 0], emf: 9, r: 0 }, { id: 'V', kind: 'voltmeter', a: [0, 1], b: [0, 2] },
    { id: 'R', kind: 'resistor', a: [0, 2], b: [2, 2], R: 4 }], wires: [[[0, 0], [0, 1]], [[2, 2], [2, 0]]] });
  ok(s4.flags.includes('S4'), 'S4 voltmeter in series');
  ok(S.solve(PR.byId('meters').spec, {}).flags.join() === 'S3', 'voltmeter across an open switch is S3, not S4');
}
// real meters (Gr 12): circuit A
{
  const A = PR.byId('A'); const res = S.solve(clone(A.spec), { real: true });
  ok(F.round(res.read.A1) === '1.47' && F.round(res.read.V1) === '10.53' && F.round(res.read.V2) === '4.42' && F.round(res.read.V3) === '5.96', 'real meters on A: ' + ['A1','V1','V2','V3'].map(k => F.round(res.read[k])).join(' '));
  const L = PR.byId('loading'); const sp = clone(L.spec); sp.parts.find(p => p.id === 'V').RV = 1000;
  ok(F.round(S.solve(sp, { real: true }).read.V) === '4.00', 'loading: 1 kΩ voltmeter reads 4,00 V');
}
// filament bulbs: two 6,0 V 0,50 A bulbs in series on 6 V take 0,344 A
{
  const fil = { Rhot: 12, Vr: 6 };
  const res = S.solve({ parts: [{ id: 'B', kind: 'battery', a: [4, 0], b: [0, 0], emf: 6, r: 0 }, { id: 'L1', kind: 'bulb', a: [0, 1], b: [2, 1], filament: fil },
    { id: 'L2', kind: 'bulb', a: [2, 1], b: [4, 1], filament: fil }], wires: [[[0, 0], [0, 1]], [[4, 1], [4, 0]]] });
  ok(Math.abs(Math.abs(res.el.L1.i) - 0.344) < 0.001 && F.round(res.el.L1.p) === '1.03', 'filament pair: ' + res.el.L1.i + ' A ' + res.el.L1.p + ' W');
}
console.log(`${n - fails}/${n} passed`); process.exit(fails ? 1 : 0);
