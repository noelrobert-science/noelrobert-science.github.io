/* node tutor/slips.js > tutor/slips.json : the named slips each practice engine already checks for, per topic,
   collected from 300 generated questions per question kind (used by tutor/build_packs.py). */
const C = require('../circuits/js/gens.js'), M = require('../momentum/js/mgens.js');
const out = {};
function collect(prefix, G, grades) {
  for (const t of Object.keys(G.STREAMS)) {
    const set = new Map();
    for (const id of G.STREAMS[t]) for (const g of grades) for (const star of [1, 2, 3]) for (let s = 1; s <= 100; s++) {
      if (G.GEN[id].grades && G.GEN[id].grades.indexOf(g) < 0) continue;
      let it; try { it = G.make(id, s, g, star); } catch (e) { continue; }
      it.parts.forEach(p => {
        (p.traps || []).forEach(x => { if (x.msg) set.set(x.msg, (set.get(x.msg) || 0) + 1); });
        if (p.kind === 'mcq') p.opts.forEach(o => { if (!o.ok && o.why) set.set('If a learner picks "' + o.t + '": ' + o.why, 1); });
      });
    }
    out[prefix + '-' + t] = [...set.entries()].sort((a, b) => b[1] - a[1]).map(e => e[0]).slice(0, 25);
  }
}
collect('circuits', C, [10, 11, 12]);
collect('momentum', M, [12]);
console.log(JSON.stringify(out, null, 1));
