/* Momentum question makers for the keeper practice engine (circuits/js/practice.js), 25 Nov 2026.
   Same item shape as circuits/js/gens.js: { stem, parts:[calc|mcq], axis, scene, data }.
   Vector answers follow Noel's rule: the learner chooses the positive direction; the answer is a size, a unit and a
   direction; a negative result is written on its own line, then the size with what the negative means as a direction.
   Exact values are signed with axis[0] positive. it.data holds the raw numbers so the test can solve each item again
   by separate code (momentum/test/mgens.test.js). Nothing here leaves the device. */
(function (root) {
  'use strict';
  var F = root.Fmt || (typeof require !== 'undefined' ? require('../../circuits/js/fmt.js') : null);
  var N = root.Noise || (typeof require !== 'undefined' ? require('../../circuits/js/noise.js') : null);

  function rngOf(seed) { var r = N.mulberry32(seed >>> 0); return { f: r, pick: function (a) { return a[Math.floor(r() * a.length)]; } }; }
  function n(x, dp) { return F.num(x, dp == null ? 2 : dp); }
  function nice(x) { return String(+(+x).toFixed(4)).replace('.', ',').replace('-', '−'); }
  function sg(x) { return x < 0 ? '(' + nice(x) + ')' : nice(x); }      /* a signed number inside a substitution */
  function clean(x) { var s = Math.abs(x) * 100; return Math.abs(x) >= 0.005 && Math.abs(s - Math.round(s)) < 1e-6; }
  function close(a, b) { return Math.abs(a - b) <= Math.max(0.011, Math.abs(b) * 0.011); }

  var PU = 'kg·m·s⁻¹', VU = 'm·s⁻¹';
  var FORM = [
    { id: 'p=mv', t: 'p = mv', grp: 'p' },
    { id: 'dp=mvf-mvi', t: 'Δp = mvf − mvi', grp: 'dp' }, { id: 'dp=m(vf-vi)', t: 'Δp = m(vf − vi)', grp: 'dp' },
    { id: 'Fdt=dp', t: 'FnetΔt = Δp', grp: 'imp' }, { id: 'F=dp/dt', t: 'Fnet = Δp/Δt', grp: 'imp' },
    { id: 'Fdt=mvf-mvi', t: 'FnetΔt = mvf − mvi', grp: 'imp' },
    { id: 'sum', t: 'Σpi = Σpf', grp: 'cons' }, { id: 'cons2', t: 'm₁v₁i + m₂v₂i = m₁v₁f + m₂v₂f', grp: 'cons' },
    { id: 'ek', t: 'Ek = ½mv²', grp: 'ek' }
  ];
  function formsFor() { return FORM; }
  function formText(f) { return f.t; }

  function C(key, ask, unit, forms, f, o) {
    o = o || {};
    return { key: key, kind: 'calc', ask: ask, unit: unit, unitAlt: o.unitAlt || [], forms: forms, f: f, traps: o.traps || [], inter: o.inter || [],
      hint1: o.hint1, hint2: o.hint2, work: o.work, vec: !!o.vec, qty: o.qty };
  }
  function T(v, msg) { return { v: v, msg: msg }; }
  function MCQ(key, ask, right, wrongs, why) { return { key: key, kind: 'mcq', ask: ask, opts: [{ t: right, ok: true }].concat(wrongs.map(function (w) { return { t: w[0], why: w[1] }; })), why: why }; }
  function exact(item) { var v = {}; item.parts.forEach(function (p) { if (p.kind === 'calc') v[p.key] = p.f(v); }); return v; }

  /* the last lines of a vector answer: one line if positive; the negative, then the size with its direction */
  function vecEnd(sym, x, unit, axis) {
    if (x >= 0) return [sym + ' = ' + n(x) + ' ' + unit + ' ' + axis[0]];
    return ['= ' + n(x) + ' ' + unit, sym + ' = ' + n(-x) + ' ' + unit + ' ' + axis[1]];
  }
  function draw(seed, maker) {
    for (var k = 0; k < 80; k++) { var it = maker(rngOf(seed * 7919 + k * 104729 + 29)); if (it) { it.seed = seed; return it; } }
    throw new Error('no usable values');
  }

  var GEN = {};
  function G(id, o) { o.id = id; GEN[id] = o; }
  var EW = ['east', 'west'];

  /* 1. p = mv */
  G('p', { topic: 'M1', title: 'Momentum p = mv', make: function (R, s) {
    var obj = R.pick([['A trolley', [0.5, 0.8, 1.2, 1.5, 2, 2.5, 4]], ['A rugby player', [75, 80, 90, 100, 110]], ['A car', [800, 1000, 1200, 1500]]]);
    var west = R.f() < 0.5, kmh = s >= 3 && obj[0] === 'A car', grams = s >= 2 && !kmh;
    var m = grams ? R.pick([0.05, 0.06, 0.15, 0.2, 0.25, 0.4, 0.45]) : R.pick(obj[1]);
    var v = kmh ? R.pick([18, 36, 54, 72, 90, 108]) / 3.6 : R.pick([1.5, 2, 2.5, 3, 4, 5, 6, 8, 10, 12]);
    var name = grams ? R.pick(['A cricket ball', 'A tennis ball', 'A hockey ball', 'A netball']) : obj[0];
    var p = m * v * (west ? -1 : 1);
    if (!clean(p)) return null;
    var mTxt = grams ? nice(m * 1000) + ' g' : nice(m) + ' kg', vTxt = kmh ? nice(v * 3.6) + ' km·h⁻¹' : nice(v) + ' ' + VU;
    var traps = [];
    if (grams) traps.push(T(m * 1000 * v * (west ? -1 : 1), 'Change grams to kilograms first: ÷ 1 000.'));
    if (kmh) traps.push(T(m * v * 3.6 * (west ? -1 : 1), 'The formula needs m·s⁻¹: km·h⁻¹ ÷ 3,6 gives m·s⁻¹.'));
    return { stem: name + ' of mass ' + mTxt + ' moves at ' + vTxt + ' ' + (west ? 'west' : 'east') + '.', axis: EW,
      data: { k: 'p', m: m, v: v * (west ? -1 : 1) },
      scene: { rows: [{ label: 'Now', objs: [{ n: name.replace(/^An? /, ''), m: mTxt, v: vTxt, d: west ? -1 : 1 }] }] },
      parts: [C('a', 'Calculate the momentum of ' + name.toLowerCase().replace(/^an? /, 'the ') + '.', PU, ['p'], function () { return p; }, {
        vec: true, qty: 'momentum', traps: traps,
        hint1: 'Momentum is mass × velocity, with the mass in kg and the velocity in m·s⁻¹. Velocity has a direction: give it a sign.',
        hint2: 'p = mv = ' + nice(m) + ' × ' + sg(v * (west ? -1 : 1)) + ' (with east positive)',
        work: ['Take east as positive.', 'p = mv', '= ' + nice(m) + ' × ' + sg(v * (west ? -1 : 1))].concat(vecEnd('p', p, PU, EW)) })] };
  } });

  /* 2. Δp and the force of a bounce */
  G('dp', { topic: 'M1', title: 'Δp and force', make: function (R, s) {
    var ax = ['towards the wall', 'away from the wall'];
    var m = s >= 2 ? R.pick([0.05, 0.06, 0.15, 0.2, 0.4, 0.45, 0.5]) : R.pick([0.2, 0.4, 0.5, 0.6, 1.5, 2]);
    var vi = R.pick([4, 5, 6, 8, 10, 12, 15, 20]), vf = R.pick([2, 3, 4, 5, 6, 8, 10, 12]);
    if (vf >= vi) return null;
    var dp = m * (-vf - vi);
    if (!clean(dp)) return null;
    var mTxt = s >= 2 ? nice(m * 1000) + ' g' : nice(m) + ' kg', name = R.pick(['A ball', 'A squash ball', 'A football']);
    var traps = [T(m * (vf - vi), 'The ball changes direction: the rebound velocity has the opposite sign.'), T(m * (vi - vf), 'The ball changes direction: the rebound velocity has the opposite sign.')];
    if (s >= 2) traps.push(T(m * 1000 * (-vf - vi), 'Change grams to kilograms first: ÷ 1 000.'));
    var parts = [C('a', 'Calculate the change in momentum of the ball.', PU, ['dp'], function () { return dp; }, {
      vec: true, qty: 'change in momentum', unitAlt: ['N·s'], traps: traps,
      hint1: 'Δp is final momentum minus initial momentum. After the bounce the velocity points the other way.',
      hint2: 'Δp = m(vf − vi) = ' + nice(m) + '(' + sg(-vf) + ' − ' + nice(vi) + ') (towards the wall positive)',
      work: ['Take towards the wall as positive.', 'Δp = m(vf − vi)', '= ' + nice(m) + '(' + sg(-vf) + ' − ' + nice(vi) + ')'].concat(vecEnd('Δp', dp, PU, ax)) })];
    var data = { k: 'dp', m: m, vi: vi, vf: -vf };
    var stem = name + ' of mass ' + mTxt + ' hits a wall at ' + nice(vi) + ' ' + VU + ' and bounces straight back at ' + nice(vf) + ' ' + VU + '.';
    if (s >= 2) {
      var ms = s >= 3, dt = ms ? R.pick([20, 25, 40, 50, 80, 100]) / 1000 : R.pick([0.02, 0.04, 0.05, 0.1, 0.2]);
      var Fx = dp / dt;
      if (!clean(Fx)) return null;
      stem += ' It is in contact with the wall for ' + (ms ? nice(dt * 1000) + ' ms' : nice(dt) + ' s') + '.';
      data.dt = dt;
      parts.push(C('b', 'Calculate the average net force the wall exerts on the ball.', 'N', ['imp'], function (v) { return v.a / dt; }, {
        vec: true, qty: 'force', traps: ms ? [T(dp / (dt * 1000), 'Change milliseconds to seconds first: ÷ 1 000.')] : [T(dp * dt, 'Force is Δp ÷ Δt: divide, do not multiply.')],
        hint1: 'The net force is the rate of change of momentum: use your Δp from (a) and the contact time in seconds.',
        hint2: 'Fnet = Δp/Δt = ' + sg(dp) + '/' + nice(dt),
        work: ['FnetΔt = Δp', 'Fnet × ' + nice(dt) + ' = ' + sg(dp)].concat(vecEnd('Fnet', Fx, 'N', ax)) }));
    }
    return { stem: stem, axis: ax, data: data, scene: { wall: true, rows: [{ label: 'Before', objs: [{ n: 'ball', m: mTxt, v: nice(vi) + ' ' + VU, d: 1 }] }, { label: 'After', objs: [{ n: 'ball', m: mTxt, v: nice(vf) + ' ' + VU, d: -1 }] }] }, parts: parts };
  } });

  /* 3. Impulse: stopping, airbags and catches */
  G('stop', { topic: 'M1', title: 'Impulse: airbags and catches', make: function (R, s) {
    var ax = ['forwards', 'backwards'], kmh = s >= 2;
    var m = R.pick([60, 65, 70, 75, 80]), u = kmh ? R.pick([18, 36, 54, 72, 90]) / 3.6 : R.pick([5, 8, 10, 12, 15, 20]);
    var dt = R.pick([0.05, 0.1, 0.2, 0.25, 0.4, 0.5]), dp = m * (0 - u), Fx = dp / dt;
    if (!clean(dp) || !clean(Fx)) return null;
    var uTxt = kmh ? nice(u * 3.6) + ' km·h⁻¹' : nice(u) + ' ' + VU;
    var stem = 'A crash-test dummy of mass ' + nice(m) + ' kg moves forwards at ' + uTxt + '. In a crash it is brought to rest by an airbag in ' + nice(dt) + ' s.';
    var parts = [
      C('a', 'Calculate the change in momentum of the dummy.', PU, ['dp'], function () { return dp; }, {
        vec: true, qty: 'change in momentum', unitAlt: ['N·s'], traps: [T(m * u, 'Δp = final − initial. The final momentum is zero, so Δp points backwards.')].concat(kmh ? [T(m * (0 - u * 3.6), 'The formula needs m·s⁻¹: km·h⁻¹ ÷ 3,6 gives m·s⁻¹.')] : []),
        hint1: 'The dummy ends at rest, so its final momentum is zero.',
        hint2: 'Δp = m(vf − vi) = ' + nice(m) + '(0 − ' + nice(u) + ') (forwards positive)',
        work: ['Take forwards as positive.', 'Δp = m(vf − vi)', '= ' + nice(m) + '(0 − ' + nice(u) + ')'].concat(vecEnd('Δp', dp, PU, ax)) }),
      C('b', 'Calculate the average net force on the dummy.', 'N', ['imp'], function (v) { return v.a / dt; }, {
        vec: true, qty: 'force', traps: [T(dp * dt, 'Force is Δp ÷ Δt: divide, do not multiply.')],
        hint1: 'Net force × time = change in momentum. Use your answer to (a).',
        hint2: 'Fnet = Δp/Δt = ' + sg(dp) + '/' + nice(dt),
        work: ['FnetΔt = Δp', 'Fnet × ' + nice(dt) + ' = ' + sg(dp)].concat(vecEnd('Fnet', Fx, 'N', ax)) })];
    if (s >= 3) parts.push(MCQ('c', 'Without the airbag, the dummy stops against the dashboard in a much shorter time. How does that change the average net force?',
      'It is larger: the same Δp happens in less time', [['It is the same: the change in momentum is the same', 'Same Δp, but Fnet = Δp/Δt: less time means a larger force.'],
        ['It is smaller: the dummy stops more quickly', 'Stopping more quickly means a smaller Δt, so a larger force.'], ['It is zero: the dummy is at rest afterwards', 'The force acts while the momentum changes, not afterwards.']],
      'Δp is fixed by the mass and the speed. Fnet = Δp/Δt, so a shorter time means a larger force.'));
    return { stem: stem, axis: ax, data: { k: 'stop', m: m, vi: u, vf: 0, dt: dt },
      scene: { rows: [{ label: 'Before', objs: [{ n: 'dummy', m: nice(m) + ' kg', v: uTxt, d: 1 }] }, { label: 'After', objs: [{ n: 'dummy', m: nice(m) + ' kg', v: '0', d: 0 }] }] }, parts: parts };
  } });

  /* two-trolley collisions share one picture and one data shape */
  function trolleys(R) { return R.pick([['trolley A', 'trolley B'], ['trolley P', 'trolley Q'], ['car A', 'car B']]); }
  function MASS(R) { return R.pick([0.5, 1, 1.5, 2, 2.5, 3, 4]); }

  /* 4. stick together */
  G('stick', { topic: 'M2', title: 'Stick together', make: function (R, s) {
    var nm = trolleys(R), mA = MASS(R), mB = MASS(R), vA = R.pick([2, 3, 4, 5, 6]);
    var vB = s === 1 ? 0 : s === 2 ? R.pick([0.5, 1, 1.5, 2]) : -R.pick([1, 2, 3, 4, 5]);
    if (s === 2 && vB >= vA) return null;
    var vf = (mA * vA + mB * vB) / (mA + mB);
    if (!clean(vf) || Math.abs(vf) < 0.1) return null;
    var traps = [T((mA * vA + mB * vB) / mA, 'After the collision the two move together: divide by the total mass.')];
    if (vB < 0) traps.push(T((mA * vA - mB * vB) / (mA + mB), 'They move in opposite directions: give ' + nm[1] + '’s velocity a negative sign.'));
    var bTxt = vB === 0 ? 'is at rest' : 'moves ' + (vB > 0 ? 'east' : 'west') + ' at ' + nice(Math.abs(vB)) + ' ' + VU;
    return { stem: cap(nm[0]) + ' (' + nice(mA) + ' kg) moves east at ' + nice(vA) + ' ' + VU + ' on a frictionless track. ' + cap(nm[1]) + ' (' + nice(mB) + ' kg) ' + bTxt + '. They collide and stick together.',
      axis: EW, data: { k: 'stick', mA: mA, mB: mB, vAi: vA, vBi: vB },
      scene: { rows: [{ label: 'Before', objs: [{ n: short(nm[0]), m: nice(mA) + ' kg', v: nice(vA) + ' ' + VU, d: 1 }, { n: short(nm[1]), m: nice(mB) + ' kg', v: vB === 0 ? '0' : nice(Math.abs(vB)) + ' ' + VU, d: vB > 0 ? 1 : vB < 0 ? -1 : 0 }] },
        { label: 'After', objs: [{ n: short(nm[0]) + ' + ' + short(nm[1]), m: nice(mA + mB) + ' kg', v: 'v = ?', d: 0 }] }] },
      parts: [C('a', 'Calculate the velocity of the two together just after the collision.', VU, ['cons'], function () { return vf; }, {
        vec: true, qty: 'velocity', traps: traps, inter: [mA * vA + mB * vB],
        hint1: 'The total momentum before equals the total momentum after. Afterwards they move as one mass.',
        hint2: nice(mA) + ' × ' + sg(vA) + ' + ' + nice(mB) + ' × ' + sg(vB) + ' = (' + nice(mA) + ' + ' + nice(mB) + ')vf (east positive)',
        work: ['Take east as positive.', 'Σpi = Σpf', 'mAvAi + mBvBi = (mA + mB)vf', nice(mA) + ' × ' + sg(vA) + ' + ' + nice(mB) + ' × ' + sg(vB) + ' = ' + nice(mA + mB) + 'vf'].concat(vecEnd('vf', vf, VU, EW)) })] };
  } });

  /* 5. bounce apart: find B's velocity after */
  G('bounce', { topic: 'M2', title: 'Bounce apart', make: function (R, s) {
    var nm = trolleys(R), mA = MASS(R), mB = MASS(R), vA = R.pick([2, 3, 4, 5, 6]);
    var vBi = s >= 3 ? -R.pick([1, 2, 3]) : 0, vAf = s === 1 ? R.pick([0.5, 1, 1.5, 2]) : -R.pick([0.5, 1, 1.5, 2]);
    if (s === 1 && vAf >= vA) return null;
    var vBf = (mA * vA + mB * vBi - mA * vAf) / mB;
    if (!clean(vBf) || Math.abs(vBf) < 0.1 || Math.abs(vBf) > 10) return null;
    var traps = [];
    if (vAf < 0) traps.push(T((mA * vA + mB * vBi + mA * vAf) / mB, nm[0] + ' rebounds, so its final velocity is negative.'));
    if (vBi < 0) traps.push(T((mA * vA - mB * vBi - mA * vAf) / mB, nm[1] + ' starts moving west: its initial velocity is negative.'));
    traps.push(T((mA * vA + mB * vBi - mA * vAf) / mA, 'Divide by ' + nm[1] + '’s mass, not ' + nm[0] + '’s.'));
    var bTxt = vBi === 0 ? 'is at rest' : 'moves west at ' + nice(-vBi) + ' ' + VU;
    var aAfter = vAf > 0 ? 'continues east at ' + nice(vAf) : 'bounces back west at ' + nice(-vAf);
    return { stem: cap(nm[0]) + ' (' + nice(mA) + ' kg) moves east at ' + nice(vA) + ' ' + VU + ' on a frictionless track. ' + cap(nm[1]) + ' (' + nice(mB) + ' kg) ' + bTxt + '. After they collide, ' + nm[0] + ' ' + aAfter + ' ' + VU + '.',
      axis: EW, data: { k: 'bounce', mA: mA, mB: mB, vAi: vA, vBi: vBi, vAf: vAf },
      scene: { rows: [{ label: 'Before', objs: [{ n: short(nm[0]), m: nice(mA) + ' kg', v: nice(vA) + ' ' + VU, d: 1 }, { n: short(nm[1]), m: nice(mB) + ' kg', v: vBi === 0 ? '0' : nice(-vBi) + ' ' + VU, d: vBi < 0 ? -1 : 0 }] },
        { label: 'After', objs: [{ n: short(nm[0]), m: nice(mA) + ' kg', v: nice(Math.abs(vAf)) + ' ' + VU, d: vAf > 0 ? 1 : -1 }, { n: short(nm[1]), m: nice(mB) + ' kg', v: 'v = ?', d: 0 }] }] },
      parts: [C('a', 'Calculate the velocity of ' + nm[1] + ' just after the collision.', VU, ['cons'], function () { return vBf; }, {
        vec: true, qty: 'velocity', traps: traps, inter: [mA * vA + mB * vBi],
        hint1: 'Total momentum before = total momentum after. Give every velocity a sign, including ' + nm[0] + '’s after.',
        hint2: nice(mA) + ' × ' + sg(vA) + ' + ' + nice(mB) + ' × ' + sg(vBi) + ' = ' + nice(mA) + ' × ' + sg(vAf) + ' + ' + nice(mB) + 'vBf (east positive)',
        work: ['Take east as positive.', 'Σpi = Σpf', nice(mA) + ' × ' + sg(vA) + ' + ' + nice(mB) + ' × ' + sg(vBi) + ' = ' + nice(mA) + ' × ' + sg(vAf) + ' + ' + nice(mB) + 'vBf'].concat(vecEnd('vBf', vBf, VU, EW)) })] };
  } });

  /* 6. explosions and recoil, from rest */
  G('explode', { topic: 'M2', title: 'Explosions and recoil', make: function (R, s) {
    var pair = R.pick([['trolley C', 'trolley D', 'are held together at rest with a compressed spring between them, then released'],
      ['the skater', 'her partner', 'stand still on the ice, then push each other apart'], ['the astronaut', 'the tool bag', 'float at rest, then the astronaut throws the bag']]);
    var mA = s >= 2 && pair[0] === 'trolley C' ? R.pick([200, 250, 400, 500, 800]) / 1000 : pair[0] === 'trolley C' ? MASS(R) : pair[0] === 'the skater' ? R.pick([45, 50, 55, 60]) : R.pick([80, 90, 100, 120]);
    var mB = pair[0] === 'trolley C' ? (s >= 2 ? R.pick([200, 250, 400, 500, 1000]) / 1000 : MASS(R)) : pair[0] === 'the skater' ? R.pick([60, 65, 70, 75, 80]) : R.pick([2, 4, 5, 8, 10]);
    var vA = R.pick([0.5, 1, 1.5, 2, 2.5, 3, 4]);   /* A moves west */
    var vB = mA * vA / mB;                            /* B moves east */
    if (!clean(vB) || vB > 40) return null;
    var g = s >= 2 && pair[0] === 'trolley C', mAt = g ? nice(mA * 1000) + ' g' : nice(mA) + ' kg', mBt = g ? nice(mB * 1000) + ' g' : nice(mB) + ' kg';
    var findMass = s >= 3 && pair[0] !== 'trolley C';
    var stem = cap(pair[0]) + ' (' + mAt + ') and ' + pair[1] + (findMass ? '' : ' (' + mBt + ')') + ' ' + pair[2] + '. ' + cap(pair[0]) + ' moves west at ' + nice(vA) + ' ' + VU + '.' + (findMass ? ' ' + cap(pair[1]) + ' moves east at ' + nice(vB) + ' ' + VU + '.' : '');
    var part = findMass
      ? C('a', 'Calculate the mass of ' + pair[1] + '.', 'kg', ['cons'], function () { return mB; }, {
        traps: [T(vA * vB / mA, 'Use Σpi = Σpf with Σpi = 0, then solve for the mass.'), T(mA * vB / vA, 'mA × vA = mB × vB: keep each mass with its own velocity.')],
        hint1: 'They start at rest, so the total momentum after is zero.',
        hint2: '0 = ' + nice(mA) + ' × ' + sg(-vA) + ' + mB × ' + sg(vB) + ' (east positive)',
        work: ['Take east as positive.', 'Σpi = Σpf', '0 = ' + nice(mA) + ' × ' + sg(-vA) + ' + mB × ' + sg(vB), 'mB = ' + n(mB) + ' kg'] })
      : C('a', 'Calculate the velocity of ' + pair[1] + ' just after.', VU, ['cons'], function () { return vB; }, {
        vec: true, qty: 'velocity', traps: [T(mB * vA / mA, 'Keep each mass with its own velocity: mA × vA = mB × vB.'), T(vA, 'Different masses move off at different speeds.')],
        hint1: 'They start at rest, so the total momentum before is zero, and so is the total after.',
        hint2: '0 = ' + nice(mA) + ' × ' + sg(-vA) + ' + ' + nice(mB) + 'vB (east positive)',
        work: ['Take east as positive.', 'Σpi = Σpf', '0 = ' + nice(mA) + ' × ' + sg(-vA) + ' + ' + nice(mB) + 'vB'].concat(vecEnd('vB', vB, VU, EW)) });
    return { stem: stem, axis: findMass ? null : EW, data: { k: findMass ? 'explode-m' : 'explode', mA: mA, mB: mB, vA: -vA, vB: vB },
      scene: { rows: [{ label: 'Before', objs: [{ n: short(pair[0]), m: mAt, v: '0', d: 0 }, { n: short(pair[1]), m: findMass ? 'm = ?' : mBt, v: '0', d: 0 }] },
        { label: 'After', objs: [{ n: short(pair[0]), m: mAt, v: nice(vA) + ' ' + VU, d: -1 }, { n: short(pair[1]), m: findMass ? 'm = ?' : mBt, v: findMass ? nice(vB) + ' ' + VU : 'v = ?', d: findMass ? 1 : 0 }] }] },
      parts: [part] };
  } });

  /* 7. elastic or inelastic: decide with kinetic energy, never with momentum */
  G('elastic', { topic: 'M2', title: 'Elastic or inelastic?', make: function (R, s) {
    var nm = trolleys(R), mA = MASS(R), mB = MASS(R), vA = R.pick([2, 3, 4, 5, 6]), elastic = R.f() < 0.5, vAf, vBf;
    if (elastic) { vAf = (mA - mB) / (mA + mB) * vA; vBf = 2 * mA / (mA + mB) * vA; }
    else { vAf = R.pick([-1, -0.5, 0, 0.5, 1]); vBf = (mA * vA - mA * vAf) / mB; }
    if (!clean(vBf) || vBf > 10 || (vAf !== 0 && !clean(vAf))) return null;
    var kb = 0.5 * mA * vA * vA, ka = 0.5 * mA * vAf * vAf + 0.5 * mB * vBf * vBf;
    if (!clean(kb) || !clean(ka) || ka > kb + 1e-9) return null;
    if (!elastic && Math.abs(ka - kb) < 0.05 * kb) return null;
    elastic = Math.abs(ka - kb) < 1e-9;
    var aWord = vAf === 0 ? 'stops' : vAf > 0 ? 'continues east at ' + nice(vAf) + ' ' + VU : 'bounces back west at ' + nice(-vAf) + ' ' + VU;
    return { stem: cap(nm[0]) + ' (' + nice(mA) + ' kg) moves east at ' + nice(vA) + ' ' + VU + ' and hits ' + nm[1] + ' (' + nice(mB) + ' kg), which is at rest. Afterwards ' + nm[0] + ' ' + aWord + ' and ' + nm[1] + ' moves east at ' + nice(vBf) + ' ' + VU + '.',
      axis: null, data: { k: 'elastic', mA: mA, mB: mB, vAi: vA, vAf: vAf, vBf: vBf },
      scene: { rows: [{ label: 'Before', objs: [{ n: short(nm[0]), m: nice(mA) + ' kg', v: nice(vA) + ' ' + VU, d: 1 }, { n: short(nm[1]), m: nice(mB) + ' kg', v: '0', d: 0 }] },
        { label: 'After', objs: [{ n: short(nm[0]), m: nice(mA) + ' kg', v: vAf === 0 ? '0' : nice(Math.abs(vAf)) + ' ' + VU, d: vAf > 0 ? 1 : vAf < 0 ? -1 : 0 }, { n: short(nm[1]), m: nice(mB) + ' kg', v: nice(vBf) + ' ' + VU, d: 1 }] }] },
      parts: [
        C('a', 'Calculate the total kinetic energy before the collision.', 'J', ['ek'], function () { return kb; }, {
          traps: [T(mA * vA * vA, 'Ek = ½mv²: remember the ½.'), T(0.5 * mA * vA, 'Ek = ½mv²: square the speed.')],
          hint1: 'Only ' + nm[0] + ' moves before the collision.', hint2: 'Ek = ½mv² = ½ × ' + nice(mA) + ' × ' + nice(vA) + '²',
          work: ['Ek = ½mv²', '= ½ × ' + nice(mA) + ' × ' + nice(vA) + '²', '= ' + n(kb) + ' J'] }),
        C('b', 'Calculate the total kinetic energy after the collision.', 'J', ['ek'], function () { return ka; }, {
          traps: [T(0.5 * mB * vBf * vBf, 'Add the kinetic energy of both trolleys.'), T(mA * vAf * vAf + mB * vBf * vBf, 'Ek = ½mv²: remember the ½.')],
          hint1: 'Add the kinetic energy of each object after the collision.', hint2: 'Ek = ½ × ' + nice(mA) + ' × ' + nice(Math.abs(vAf)) + '² + ½ × ' + nice(mB) + ' × ' + nice(vBf) + '²',
          work: ['Ek = ½mAvA² + ½mBvB²', '= ½ × ' + nice(mA) + ' × ' + nice(Math.abs(vAf)) + '² + ½ × ' + nice(mB) + ' × ' + nice(vBf) + '²', '= ' + n(ka) + ' J'] }),
        elastic
          ? MCQ('c', 'Is the collision elastic or inelastic?', 'Elastic: the total kinetic energy is conserved', [['Inelastic: the total kinetic energy is not conserved', 'Compare (a) and (b): they are equal.'], ['Elastic: the total momentum is conserved', 'Momentum is conserved in every collision of an isolated system. Decide with kinetic energy.'], ['Inelastic: the total momentum is not conserved', 'Momentum is conserved in every collision of an isolated system.']], 'The total kinetic energy before equals the total after, so the collision is elastic.')
          : MCQ('c', 'Is the collision elastic or inelastic?', 'Inelastic: the total kinetic energy is not conserved', [['Elastic: the total kinetic energy is conserved', 'Compare (a) and (b): kinetic energy was lost.'], ['Elastic: the total momentum is conserved', 'Momentum is conserved in every collision of an isolated system. Decide with kinetic energy.'], ['Inelastic: the total momentum is not conserved', 'Momentum is conserved in every collision of an isolated system. Decide with kinetic energy.']], 'Kinetic energy after is less than before, so the collision is inelastic.')
      ] };
  } });

  function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }
  function short(s) { return s.replace(/^the /, '').replace(/^trolley /, '').replace(/^car /, 'car '); }

  var STREAMS = { M1: ['p', 'dp', 'stop'], M2: ['stick', 'bounce', 'explode', 'elastic'] };
  var TOPIC_NAME = { M1: 'Momentum, Δp and impulse', M2: 'Conservation of momentum' };

  function make(genId, seed, g, star) {
    var gen = GEN[genId];
    var it = draw(seed, function (R) { return gen.make(R, star || 2); });
    it.gen = genId; it.topic = gen.topic; it.title = gen.title; it.star = star || 2; it.g = g || 12;
    var ex = exact(it);
    it.parts.forEach(function (p) { if (p.kind === 'calc') p.traps = p.traps.filter(function (t) { return !close(Math.abs(t.v), Math.abs(ex[p.key])); }); });
    return it;
  }

  /* the picture: Before / After rows, objects as boxes, velocity arrows; an unknown has no arrow */
  function picture(it, g, h) {
    if (!it.scene || !h) return null;
    var sc = it.scene, rows = sc.rows, W = 440, rowH = 96, H = rows.length * rowH + 12, out = [];
    out.push('<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc(it.stem) + '" style="width:100%;max-width:520px;height:auto;display:block;margin:0 auto;font-family:inherit">');
    out.push('<defs><marker id="mar" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="#0b7285"/></marker></defs>');
    rows.forEach(function (r, i) {
      var y = 12 + i * rowH, base = y + 62, k = r.objs.length;
      out.push('<text x="4" y="' + (y + 14) + '" font-size="14" font-weight="600" fill="#1b2230">' + esc(r.label) + '</text>');
      out.push('<line x1="4" y1="' + base + '" x2="' + (sc.wall ? 400 : 436) + '" y2="' + base + '" stroke="#8a94a6" stroke-width="2"/>');
      if (sc.wall) out.push('<rect x="400" y="' + (y + 4) + '" width="14" height="' + (base - y - 4) + '" fill="#cfd6e0" stroke="#8a94a6"/>');
      r.objs.forEach(function (o, j) {
        var cx = k === 1 ? (sc.wall ? 290 : 220) : 110 + j * 220, bw = Math.max(74, o.n.length * 9 + 20);
        out.push('<rect x="' + (cx - bw / 2) + '" y="' + (base - 38) + '" width="' + bw + '" height="36" rx="6" fill="#e7f5f7" stroke="#0b7285" stroke-width="1.5"/>');
        out.push('<text x="' + cx + '" y="' + (base - 22) + '" font-size="15" text-anchor="middle" font-weight="600" fill="#1b2230">' + esc(o.n) + '</text>');
        out.push('<text x="' + cx + '" y="' + (base - 7) + '" font-size="13" text-anchor="middle" fill="#3d4757">' + esc(o.m) + '</text>');
        if (o.d) {
          var x0 = o.d > 0 ? cx + bw / 2 + 6 : cx - bw / 2 - 6, x1 = x0 + o.d * 44;
          out.push('<line x1="' + x0 + '" y1="' + (base - 18) + '" x2="' + x1 + '" y2="' + (base - 18) + '" stroke="#0b7285" stroke-width="2.5" marker-end="url(#mar)"/>');
          out.push('<text x="' + (x0 + o.d * 22) + '" y="' + (base - 46) + '" font-size="14" text-anchor="middle" fill="#0b7285">' + esc(o.v) + '</text>');
        } else out.push('<text x="' + cx + '" y="' + (base - 46) + '" font-size="14" text-anchor="middle" fill="#0b7285">' + esc(o.v === '0' ? 'at rest' : o.v) + '</text>');
      });
    });
    out.push('</svg>');
    var wrap = h('div', { class: 'canvas pcanvas' }); wrap.innerHTML = out.join(''); return wrap;
  }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  var api = { GEN: GEN, STREAMS: STREAMS, TOPIC_NAME: TOPIC_NAME, FORM: FORM, formsFor: formsFor, formText: formText, make: make, exact: exact, picture: picture, clean: clean };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.MomentumGens = api;
})(typeof window !== 'undefined' ? window : globalThis);
