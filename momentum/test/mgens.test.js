/* node momentum/test/mgens.test.js : every Momentum generator, stars 1-3, 200 seeds each (same standard as circuits).
   Each item is solved again here by separate code (momentum conservation and Δp from the raw data, not the generator's
   own functions), and the worked answer must follow Noel's vector rule: size + unit + direction on the last line, and
   never a negative number and a direction on the same line. */
const G = require('../js/mgens.js'), F = require('../../circuits/js/fmt.js');
let fails = 0, n = 0, items = 0; const seen = {};
function ok(c, msg) { n++; if (!c) { fails++; const k = msg.split(':')[0]; if (!seen[k]) { seen[k] = 1; console.log('FAIL', msg); } } }
const close = (a, b) => Math.abs(a - b) <= Math.max(0.011, Math.abs(b) * 0.011);
const tiny = (x) => Math.abs(x) < 1e-6;
const DIRS = /\b(east|west|forwards|backwards|towards the wall|away from the wall)\b/;

/* the second solver: what each answer must be, from the raw numbers only */
function solve(it, ans) {
  const d = it.data, k = d.k;
  if (k === 'p') return { a: d.m * d.v };
  if (k === 'dp') { const a = d.m * (d.vf - d.vi); return d.dt ? { a, b: a / d.dt } : { a }; }
  if (k === 'stop') { const a = d.m * (d.vf - d.vi); return { a, b: a / d.dt }; }
  /* conservation cases: the answer must make total momentum before = after */
  if (k === 'stick') return { check: tiny(d.mA * d.vAi + d.mB * d.vBi - (d.mA + d.mB) * ans.a) };
  if (k === 'bounce') return { check: tiny(d.mA * d.vAi + d.mB * d.vBi - d.mA * d.vAf - d.mB * ans.a) };
  if (k === 'explode') return { check: tiny(d.mA * d.vA + d.mB * ans.a) };
  if (k === 'explode-m') return { check: tiny(d.mA * d.vA + ans.a * d.vB) };
  if (k === 'elastic') return { a: 0.5 * d.mA * d.vAi ** 2, b: 0.5 * d.mA * d.vAf ** 2 + 0.5 * d.mB * d.vBf ** 2, mom: tiny(d.mA * d.vAi - d.mA * d.vAf - d.mB * d.vBf) };
  throw new Error('no solver for ' + k);
}

for (const id of Object.keys(G.GEN)) for (const star of [1, 2, 3]) for (let seed = 1; seed <= 200; seed++) {
  const tag = id + ' s' + star + ' seed ' + seed;
  let it;
  try { it = G.make(id, seed, 12, star); } catch (e) { ok(false, id + ' s' + star + ': ' + e.message); continue; }
  items++;
  const v = G.exact(it), sol = solve(it, v);
  ok(typeof it.stem === 'string' && it.stem.length > 20, id + ' stem: ' + tag);
  if ('check' in sol) ok(sol.check, id + ' conservation fails: ' + tag + ' ' + JSON.stringify(it.data) + ' ans ' + v.a);
  if ('mom' in sol) ok(sol.mom, id + ' elastic data breaks momentum: ' + tag);
  it.parts.forEach(p => {
    if (p.kind === 'mcq') {
      ok(p.opts.length === 4 && new Set(p.opts.map(o => o.t)).size === 4 && p.opts.filter(o => o.ok).length === 1, id + ' mcq options: ' + tag);
      if (id === 'elastic') ok(p.opts.find(o => o.ok).t.startsWith(close(sol.a, sol.b) ? 'Elastic' : 'Inelastic'), id + ' wrong verdict: ' + tag);
      return;
    }
    const x = v[p.key];
    ok(isFinite(x), id + ' not finite: ' + tag + ' ' + p.key);
    ok(G.clean(x), id + ' not clean to 2 dp: ' + tag + ' ' + p.key + ' ' + x);
    if (p.key in sol) ok(close(x, sol[p.key]), id + ' second solver disagrees: ' + tag + ' ' + p.key + ' ' + x + ' vs ' + sol[p.key]);
    p.traps.forEach(t => ok(!close(Math.abs(t.v), Math.abs(x)), id + ' trap equals answer: ' + tag));
    ok(p.hint1 && p.hint2, id + ' hints: ' + tag);
    const w = p.work || [];
    ok(w.length >= 3, id + ' worked answer too short: ' + tag);
    w.forEach(l => ok(!(/−\s?\d/.test(l.replace(/\(−[\d,]+\)/g, '')) && DIRS.test(l) && /=/.test(l) && !/Take /.test(l)), id + ' negative and direction on one line: ' + tag + ' "' + l + '"'));
    if (p.vec) {
      ok(it.axis && it.axis.length === 2, id + ' vector part without directions: ' + tag);
      const last = w[w.length - 1], dir = it.axis[x >= 0 ? 0 : 1];
      ok(last.indexOf(F.num(Math.abs(x))) >= 0 && last.endsWith(dir) && !/−/.test(last), id + ' last line is not size, unit, direction: ' + tag + ' "' + last + '"');
      if (x < 0) ok(/−/.test(w[w.length - 2]), id + ' negative result not shown on the line before: ' + tag);
      ok(/^Take .* as positive\.$/.test(w[0]) || /^Fnet|^FnetΔt/.test(w[0]), id + ' no sign convention stated: ' + tag + ' "' + w[0] + '"');
    } else ok(!DIRS.test(w[w.length - 1]), id + ' scalar answer with a direction: ' + tag);
  });
}
console.log(items + ' items from ' + Object.keys(G.GEN).length + ' generators; ' + (n - fails) + '/' + n + ' checks passed');
process.exitCode = fails ? 1 : 0;
