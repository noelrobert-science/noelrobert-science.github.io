/* Golden vectors from lead_calc/noise.py and fix_studioA/noiseA.py (studio_design.md §5.0, §5.1, §5.3). */
const N = require('../js/noise.js');
let pass = 0, fail = 0;
function ok(c, m) { if (c) pass++; else { fail++; console.log('FAIL', m); } }
const near = (a, b, t) => Math.abs(a - b) <= t;
const r = N.mulberry32(20261110);
const U = [0.475855248049, 0.43722783844, 0.773696853779, 0.29374126601, 0.347153743729, 0.085415343987, 0.160040843766, 0.046464766841, 0.917737384094, 0.423640517984];
U.forEach((u, k) => ok(near(r(), u, 1e-11), 'uniform ' + k));
const g = N.mulberry32(7), G = [2.759372987029, -0.068051356507, -0.945948960445, 0.07814913415];
G.forEach((z, k) => ok(near(N.gauss(g), z, 1e-10), 'gauss ' + k));
const X1 = N.ohmRun(20261110, 4.79, 6.0, [20, 12, 8, 5, 3, 1.5, 0]);
ok(JSON.stringify(X1.map(x => x.I)) === JSON.stringify([0.24, 0.36, 0.47, 0.61, 0.76, 0.95, 1.25]), 'X1 currents ' + X1.map(x => x.I));
ok(JSON.stringify(X1.map(x => x.V)) === JSON.stringify([1.16, 1.7, 2.25, 2.94, 3.69, 4.58, 5.99]), 'X1 pds ' + X1.map(x => x.V));
const fx = N.lsq(X1.map(x => x.I), X1.map(x => x.V));
ok(near(fx.m, 4.8128, 5e-5), 'X1 gradient ' + fx.m); ok(near(fx.c, -0.003, 6e-4), 'X1 intercept ' + fx.c);
const D = N.emfRun(20261110, 7.5, 1.6, 1.0, [25, 15, 10, 6, 4, 2, 1]);
ok(JSON.stringify(D.map(x => x.I)) === JSON.stringify([0.27, 0.42, 0.59, 0.87, 1.13, 1.66, 2.08]), 'box D currents ' + D.map(x => x.I));
ok(JSON.stringify(D.map(x => x.V)) === JSON.stringify([7.07, 6.79, 6.57, 6.12, 5.66, 4.99, 4.19]), 'box D pds ' + D.map(x => x.V));
const fd = N.lsq(D.map(x => x.I), D.map(x => x.V));
ok(near(fd.m, -1.5534, 5e-5) && near(fd.c, 7.4707, 5e-5), 'box D fit ' + fd.m + ' ' + fd.c);
ok(near(fd.sd, 0.0575, 5e-4), 'box D residual SD ' + fd.sd);
console.log(pass + '/' + (pass + fail) + ' passed'); if (fail) process.exit(1);
// the rigs reproduce the golden tables when driven like the sample runs (one draw per reading)
{
  const R = require('../js/rigs.js'), F = require('../js/fmt.js');
  const r2 = x => +F.round(x, 2);
  let rnd = N.mulberry32(20261110), rows = [];
  for (const Rh of [20, 12, 8, 5, 3, 1.5, 0]) { const st = { load: 'X1', Rh, closed: true }; const z = R.draw(rnd, R.RIGS.ohm, st); const m = R.measure(R.RIGS.ohm, st, z).read; rows.push([r2(m.A), r2(m.V)]); }
  ok(JSON.stringify(rows.map(x => x[0])) === '[0.24,0.36,0.47,0.61,0.76,0.95,1.25]' && JSON.stringify(rows.map(x => x[1])) === '[1.16,1.7,2.25,2.94,3.69,4.58,5.99]', 'ohm rig = X1 table ' + JSON.stringify(rows));
  rnd = N.mulberry32(20261110); rows = [];
  for (const Rh of [25, 15, 10, 6, 4, 2, 1]) { const st = { emf: 7.5, r: 1.6, Rh, closed: true }; const z = R.draw(rnd, R.RIGS.emf, st); const m = R.measure(R.RIGS.emf, st, z).read; rows.push([r2(m.A), r2(m.V)]); }
  ok(JSON.stringify(rows.map(x => x[0])) === '[0.27,0.42,0.59,0.87,1.13,1.66,2.08]' && JSON.stringify(rows.map(x => x[1])) === '[7.07,6.79,6.57,6.12,5.66,4.99,4.19]', 'emf rig = box D table ' + JSON.stringify(rows));
  const cr = R.currentRange(R.RIGS.emf, { emf: 7.5, r: 1.6 });
  ok(Math.abs(cr[0] - 0.23) < 0.005 && Math.abs(cr[1] - 2.88) < 0.005, 'box D achievable currents ' + cr);
  // exact values of §5.2 and §5.4
  const ser = R.measure(R.RIGS.rules, { arr: 'series' }, null).read, par = R.measure(R.RIGS.rules, { arr: 'parallel' }, null).read;
  ok(r2(ser.A1) === 0.15 && r2(ser.A3) === 0.15 && r2(ser.V1) === 1.5 && r2(ser.V2) === 3 && r2(ser.V) === 4.5, 'series rules ' + JSON.stringify(ser));
  ok(Math.abs(par.A - 0.675) < 1e-9 && r2(par.A2) === 0.23 && r2(par.V2) === 4.5, 'parallel rules ' + JSON.stringify(par));
  const serR = R.measure(R.RIGS.rules, { arr: 'series', r: 0.5 }, null).read, parR = R.measure(R.RIGS.rules, { arr: 'parallel', r: 0.5 }, null).read;
  ok(r2(serR.V) === 4.43 && r2(serR.V2) === 2.95 && r2(parR.A) === 0.63 && r2(parR.V1) === 4.19 && r2(parR.A2) === 0.21, 'rules with r = 0,5 ' + JSON.stringify([serR, parR]));
  const p1 = R.measure(R.RIGS.power, { arr: 'one' }, null).read, ps = R.measure(R.RIGS.power, { arr: 'series' }, null).read, pp = R.measure(R.RIGS.power, { arr: 'parallel' }, null).read;
  ok(r2(p1.A) === 2 && r2(ps.V1) === 6 && r2(ps.A) === 1 && r2(pp.A1) === 2 && r2(pp.V2) === 12, 'power arrangements');
  const pr = R.measure(R.RIGS.power, { arr: 'one', r: 0.5 }, null).read, psr = R.measure(R.RIGS.power, { arr: 'series', r: 0.5 }, null).read, ppr = R.measure(R.RIGS.power, { arr: 'parallel', r: 0.5 }, null).read;
  ok(r2(pr.V1 * pr.A) === 20.45 && r2(psr.V1 * psr.A) === 5.53 && r2(ppr.V1 * ppr.A1) === 17.63, 'power with r = 0,5 ' + [pr.V1 * pr.A, psr.V1 * psr.A, ppr.V1 * ppr.A1]);
  const fil = R.measure(R.RIGS.power, { arr: 'series', filament: true }, null).read;
  ok(Math.abs(fil.A - 0.344) < 0.0006 && r2(fil.V1 * fil.A) === 1.03, 'filament pair ' + fil.A + ' ' + fil.V1 * fil.A);
  console.log(pass + '/' + (pass + fail) + ' passed (with rigs)'); if (fail) process.exit(1);
}
