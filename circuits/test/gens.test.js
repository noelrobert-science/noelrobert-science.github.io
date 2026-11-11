/* node test/gens.test.js : every generator, every grade it serves, stars 1-3, 200 seeds each (§8.2 template test).
   Each item must: have finite exact values; keep currents 0,05-10 A in any solved circuit; match the solver for every
   meter a part asks about; never have a trap equal to the right answer; give Gr 10 no r; have 4 distinct MCQ options. */
const S = require('../js/solver.js'), G = require('../js/gens.js'), F = require('../js/fmt.js');
let fails = 0, n = 0; const seen = {};
function ok(c, msg) { n++; if (!c) { fails++; if (!seen[msg.split(':')[0]]) { seen[msg.split(':')[0]] = 1; console.log('FAIL', msg); } } }
function close(a, b) { return Math.abs(a - b) <= Math.max(0.011, Math.abs(b) * 0.011); }
const METER = /reading on (the ammeter|A1|A2|V1|V2|V3)\b|What does (\w+)/;
let items = 0;
for (const id of Object.keys(G.GEN)) {
  const gen = G.GEN[id];
  for (const g of gen.grades) for (const star of [1, 2, 3]) for (let seed = 1; seed <= 200; seed++) {
    let it;
    try { it = G.make(id, seed, g, star); } catch (e) { ok(false, id + ' g' + g + ' s' + star + ': ' + e.message); continue; }
    items++;
    const v = G.exact(it), tag = id + ' g' + g + ' s' + star + ' seed ' + seed;
    it.parts.forEach(p => {
      if (p.kind === 'calc') {
        ok(isFinite(v[p.key]), tag + ' part ' + p.key + ' not finite');
        p.traps.forEach(t => ok(!close(t.v, v[p.key]) || p.f.length === 0 && false, id + ' trap equals answer: ' + tag + ' ' + p.key + ' ' + t.v));
        ok(p.work && p.work.length, id + ' no worked lines: ' + p.key);
        ok(p.hint1 && p.hint2, id + ' no hints: ' + p.key);
      } else if (p.kind === 'mcq') {
        ok(p.opts.length === 4 && new Set(p.opts.map(o => o.t)).size === 4, id + ' mcq options: ' + tag);
        ok(p.opts.filter(o => o.ok).length === 1, id + ' mcq one right: ' + tag);
        ok(p.opts.filter(o => !o.ok).every(o => o.why), id + ' mcq every wrong option has a why: ' + tag);
      }
    });
    if (g === 10) {
      ok(!/internal resistance|\br =/.test(it.stem.replace('ideal (no internal resistance)', '').replace('negligible internal resistance', '')), id + ' Gr 10 mentions r: ' + it.stem);
      if (it.spec) ok(it.spec.parts.every(p => p.kind !== 'battery' || !(p.r > 0)), id + ' Gr 10 battery has r');
    }
    if (it.spec) {
      const res = S.solve(it.spec, {});
      ok(res.state === 'ok', id + ' solver state: ' + tag + ' ' + res.state + ' ' + res.flags.join(','));
      if (res.state !== 'ok') continue;
      const closed = it.spec.parts.every(p => p.kind !== 'switch' || p.closed);
      if (closed) Object.keys(res.el).forEach(k => { const e = res.el[k]; if (e.kind === 'resistor' || e.kind === 'bulb') ok(Math.abs(e.i) >= 0.05 - 1e-9 && Math.abs(e.i) <= 10, id + ' current range: ' + tag + ' ' + k + ' ' + e.i); });
      it.parts.forEach(p => {
        if (p.kind !== 'calc') return;
        const m = p.ask.match(METER); if (!m) return;
        const mid = m[1] === 'the ammeter' ? (res.read.A != null ? 'A' : 'A1') : (m[1] || m[2]);
        if (!(mid in res.read)) return;
        ok(close(res.read[mid], v[p.key]), id + ' meter ' + mid + ' vs solver: ' + tag + ' part ' + p.key + ' item ' + v[p.key] + ' solver ' + res.read[mid]);
      });
      // the given readings on the drawing (not hidden) must agree with the stem
      (it.stem.match(/(A1|A2|V1) reads ([\d,]+) (A|V)/g) || []).forEach(s => { const mm = s.match(/(A1|A2|V1) reads ([\d,]+)/); ok(close(res.read[mm[1]], +mm[2].replace(',', '.')), id + ' stem reading vs solver: ' + tag + ' ' + s); });
    }
  }
}
console.log(items + ' items from ' + Object.keys(G.GEN).length + ' generators; ' + (n - fails) + '/' + n + ' checks passed');
process.exit(fails ? 1 : 0);
