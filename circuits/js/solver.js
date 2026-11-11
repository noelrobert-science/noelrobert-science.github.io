/* Circuits Studio: circuit solver (studio_design.md §4.3).
   Modified nodal analysis on a lattice netlist:
   - zero-ohm parts (wires, closed switches, ideal ammeters, 0 Ω resistors) are merged by union-find;
   - batteries with r > 0 are Norton sources, ideal batteries add one unknown each;
   - GMIN 1e-12 to the reference keeps floating parts solvable; partial pivoting, backstop 1e-14;
   - filament bulbs iterate (weighted geometric mean 0,3 / 0,7, stop at 1e-9 or 60 rounds);
   - currents in zero-ohm edges are the weighted minimum-norm flow (ideal ammeter weight 1e6),
     so a wire route across an ideal ammeter takes the current and the ammeter reads 0.
   Works in the browser (window.CircuitSolver) and in Node (module.exports). */
(function (root) {
  'use strict';
  var GMIN = 1e-12, PIVOT = 1e-14, W_AMM = 1e6;

  function key(p) { return p[0] + ',' + p[1]; }

  /* Build a netlist from the circuit spec: parts [{id, kind, a:[x,y], b:[x,y], ...}] and wires [[x,y], ...] polylines. */
  function netlist(spec) {
    var ix = {}, pts = [], els = [];
    function node(p) { var k = key(p); if (!(k in ix)) { ix[k] = pts.length; pts.push([p[0], p[1]]); } return ix[k]; }
    (spec.wires || []).forEach(function (w, wi) {
      for (var i = 0; i + 1 < w.length; i++) els.push({ id: '_w' + wi + '_' + i, kind: 'wire', a: node(w[i]), b: node(w[i + 1]), wire: wi, seg: i });
    });
    (spec.parts || []).forEach(function (p) {
      var e = {}; for (var k in p) e[k] = p[k];
      e.pa = p.a; e.pb = p.b; e.a = node(p.a); e.b = node(p.b);
      if (e.kind === 'motor' || e.kind === 'heater') { e.sym = e.kind; e.kind = 'resistor'; }
      els.push(e);
    });
    return { n: pts.length, pts: pts, ix: ix, els: els };
  }

  function uf(n) {
    var par = []; for (var i = 0; i < n; i++) par.push(i);
    function f(x) { while (par[x] !== x) { par[x] = par[par[x]]; x = par[x]; } return x; }
    function u(a, b) { a = f(a); b = f(b); if (a !== b) par[a] = b; }
    return { f: f, u: u };
  }

  function resOf(e) { return e.kind === 'bulb' ? e._R : e.R; }
  function isZero(e, real) {
    var k = e.kind;
    if (k === 'wire') return true;
    if (k === 'switch') return !!e.closed;
    if (k === 'ammeter') return !real;
    if ((k === 'resistor' || k === 'rheostat') && e.R === 0) return true;
    return false;
  }
  function conducts(e, real) {   /* a conducting part for the open-circuit test (voltmeters are not) */
    if (e.kind === 'switch') return !!e.closed;
    if (e.kind === 'voltmeter') return false;
    return true;
  }

  function gauss(A, b) {
    var n = b.length, M = [], i, j, k;
    for (i = 0; i < n; i++) { M.push(A[i].slice()); M[i].push(b[i]); }
    for (var c = 0; c < n; c++) {
      var p = c, best = Math.abs(M[c][c]);
      for (i = c + 1; i < n; i++) if (Math.abs(M[i][c]) > best) { best = Math.abs(M[i][c]); p = i; }
      if (best < PIVOT) return null;
      var t = M[c]; M[c] = M[p]; M[p] = t;
      for (i = c + 1; i < n; i++) {
        var m = M[i][c] / M[c][c];
        if (m) for (k = c; k <= n; k++) M[i][k] -= m * M[c][k];
      }
    }
    var x = new Array(n).fill(0);
    for (i = n - 1; i >= 0; i--) {
      var s = M[i][n];
      for (j = i + 1; j < n; j++) s -= M[i][j] * x[j];
      x[i] = s / M[i][i];
    }
    return x;
  }

  function filamentR(e, v) {
    var f = e.filament; /* {Rhot, Vr} */
    return f.Rhot * Math.max(0.1, Math.pow(Math.max(Math.abs(v), 1e-9) / f.Vr, 0.46));
  }

  /* opts: {real:false, RA:0.1, RV:1e7} */
  function solve(spec, opts) {
    opts = opts || {};
    var real = !!opts.real, RA = opts.RA || 0.10, RV = opts.RV || 1e7;
    var net = netlist(spec), n = net.n, els = net.els;
    var out = { net: net, state: 'ok', flags: [], V: new Array(n).fill(0), el: {}, read: {}, battery: {} };
    var bats = els.filter(function (e) { return e.kind === 'battery'; });

    /* connectivity tests from the graph (S3, S4, S6) */
    var deg = new Array(n).fill(0);
    els.forEach(function (e) { if (conducts(e, real) && e.kind !== 'voltmeter') { deg[e.a]++; deg[e.b]++; } });
    /* a voltmeter across an open switch is 'across the gap' (S3), not a voltmeter put in series (S4) */
    function acrossGap(v) {
      return els.some(function (e) { return e.kind === 'switch' && !e.closed && ((e.a === v.a && e.b === v.b) || (e.a === v.b && e.b === v.a)); });
    }
    function closedPath(withVolt) {
      return bats.some(function (bt) {
        var U = uf(n);
        els.forEach(function (e) {
          if (e === bt) return;
          if (conducts(e, real) || (withVolt && e.kind === 'voltmeter' && !acrossGap(e))) U.u(e.a, e.b);
        });
        return U.f(bt.a) === U.f(bt.b);
      });
    }
    var anyPath = bats.length && closedPath(false);
    if (!bats.length) out.flags.push('nobattery');
    else if (!anyPath) out.flags.push(closedPath(true) ? 'S4' : 'S3');

    /* merge zero-ohm parts */
    var U = uf(n);
    els.forEach(function (e) { if (isZero(e, real)) U.u(e.a, e.b); });
    var f = U.f, roots = [], ridx = {};
    for (var i = 0; i < n; i++) { var r = f(i); if (!(r in ridx)) { ridx[r] = roots.length; roots.push(r); } }
    var N = roots.length;
    function I(node) { return ridx[f(node)]; }

    var ideal = bats.filter(function (e) { return !(e.r > 0); });
    for (var q = 0; q < ideal.length; q++) if (I(ideal[q].a) === I(ideal[q].b)) { out.state = 'S0'; out.short = ideal[q].id; return finishBlank(out); }
    bats.forEach(function (e) { if (e.r > 0 && I(e.a) === I(e.b)) out.flags.push('S1'); });

    var bulbs = els.filter(function (e) { return e.kind === 'bulb'; });
    bulbs.forEach(function (e) { e._R = e.filament ? e.filament.Rhot : e.R; });
    var x = null, it;
    for (it = 0; it < 60; it++) {
      var M = N + ideal.length, A = [], z = new Array(M).fill(0), a, b;
      for (a = 0; a < M; a++) A.push(new Array(M).fill(0));
      var G = function (i, j, g) { if (i === j) return; A[i][i] += g; A[j][j] += g; A[i][j] -= g; A[j][i] -= g; };
      els.forEach(function (e) {
        var k = e.kind;
        if ((k === 'resistor' || k === 'rheostat') && e.R > 0) G(I(e.a), I(e.b), 1 / e.R);
        else if (k === 'bulb') G(I(e.a), I(e.b), 1 / e._R);
        else if (k === 'ammeter' && real) G(I(e.a), I(e.b), 1 / RA);
        else if (k === 'voltmeter' && real) G(I(e.a), I(e.b), 1 / (e.RV || RV));
        else if (k === 'battery' && e.r > 0) {
          var p = I(e.b), m = I(e.a);
          G(p, m, 1 / e.r); z[p] += e.emf / e.r; z[m] -= e.emf / e.r;
        }
      });
      ideal.forEach(function (e, k) {
        var p = I(e.b), m = I(e.a);
        A[N + k][p] += 1; A[N + k][m] -= 1; A[p][N + k] += 1; A[m][N + k] -= 1; z[N + k] = e.emf;
      });
      for (a = 0; a < N; a++) A[a][a] += GMIN;
      var ref = bats.length ? I(bats[0].a) : 0;
      A[ref] = new Array(M).fill(0); A[ref][ref] = 1; z[ref] = 0;
      x = gauss(A, z);
      if (!x) { out.state = 'S5'; return finishBlank(out); }
      if (!bulbs.some(function (e) { return e.filament; })) break;
      var mx = 0;
      bulbs.forEach(function (e) {
        if (!e.filament) return;
        var v = x[I(e.b)] - x[I(e.a)], Rn = filamentR(e, v);
        var Rnew = Math.exp(0.3 * Math.log(e._R) + 0.7 * Math.log(Rn));
        mx = Math.max(mx, Math.abs(Rnew - e._R) / e._R); e._R = Rnew;
      });
      if (mx < 1e-9) break;
    }
    out.iterations = it + 1;
    for (i = 0; i < n; i++) out.V[i] = x[I(i)];
    var V = function (nd) { return out.V[nd]; };

    /* currents: resistive parts, batteries with r, real meters; then the zero-ohm flow */
    var inj = new Array(n).fill(0), cur = {};
    els.forEach(function (e) {
      var k = e.kind, Va = V(e.a), Vb = V(e.b), c = null;
      if ((k === 'resistor' || k === 'rheostat') && e.R > 0) c = (Va - Vb) / e.R;
      else if (k === 'bulb') c = (Va - Vb) / e._R;
      else if (k === 'battery' && e.r > 0) c = (e.emf - (Vb - Va)) / e.r;
      else if (k === 'ammeter' && real) c = (Va - Vb) / RA;
      else if (k === 'voltmeter' && real) c = (Va - Vb) / (e.RV || RV);
      else if (k === 'voltmeter' || (k === 'switch' && !e.closed)) c = 0;
      if (c === null) return;
      cur[e.id] = c; inj[e.a] -= c; inj[e.b] += c;
    });
    var zero = els.filter(function (e) { return isZero(e, real) || (e.kind === 'battery' && !(e.r > 0)); });
    if (zero.length) {
      var nodes = [], zi = {};
      zero.forEach(function (e) { [e.a, e.b].forEach(function (nd) { if (!(nd in zi)) { zi[nd] = nodes.length; nodes.push(nd); } }); });
      var nn = nodes.length, L = [], rhs = [];
      for (a = 0; a < nn; a++) { L.push(new Array(nn).fill(0)); rhs.push(inj[nodes[a]]); }
      var w = zero.map(function (e) { return e.kind === 'ammeter' ? W_AMM : 1; });
      zero.forEach(function (e, j) {
        var p = zi[e.a], m = zi[e.b], g = 1 / w[j];
        if (p === m) return;
        L[p][p] += g; L[m][m] += g; L[p][m] -= g; L[m][p] -= g;
      });
      var U2 = uf(nn), seen = {};
      zero.forEach(function (e) { U2.u(zi[e.a], zi[e.b]); });
      for (a = 0; a < nn; a++) { var rr = U2.f(a); if (!seen[rr]) { seen[rr] = 1; L[a] = new Array(nn).fill(0); L[a][a] = 1; rhs[a] = 0; } }
      var phi = gauss(L, rhs) || new Array(nn).fill(0);
      zero.forEach(function (e, j) { cur[e.id] = (phi[zi[e.a]] - phi[zi[e.b]]) / w[j]; });
      /* phi solves sum over edges of (phi_a - phi_b)/w = inj; each edge carries +current from a to b (for a battery, out of +) */
    }

    /* bypassed parts (S2) */
    var byp = {};
    els.forEach(function (e) {
      if ((e.kind === 'resistor' || e.kind === 'rheostat' || e.kind === 'bulb') && resOf(e) > 0 && I(e.a) === I(e.b)) byp[e.id] = 1;
    });
    if (!real) {
      var U3 = uf(n);
      els.forEach(function (e) { if (isZero(e, false) && e.kind !== 'ammeter') U3.u(e.a, e.b); });
      els.forEach(function (e) { if (e.kind === 'ammeter' && U3.f(e.a) === U3.f(e.b)) byp[e.id] = 1; });
    }
    if (Object.keys(byp).length) out.flags.push('S2');
    out.bypassed = byp;

    /* results per element */
    var tiny = 1e-9;
    els.forEach(function (e) {
      var v = V(e.b) - V(e.a), c = cur[e.id] || 0;
      if (Math.abs(c) < tiny) c = 0;
      if (Math.abs(v) < tiny) v = 0;
      var rec = { v: v, i: c, p: 0 };
      if (e.kind === 'resistor' || e.kind === 'rheostat' || e.kind === 'bulb') { rec.p = c * c * (e.kind === 'bulb' ? e._R : e.R); rec.R = resOf(e); }
      if (e.kind === 'battery') {
        rec.terminal = v; rec.lost = (e.r > 0 ? c * e.r : 0); rec.p = e.emf * c;
        out.battery[e.id] = rec;
      }
      out.el[e.id] = rec;
      if (e.kind === 'ammeter') out.read[e.id] = Math.abs(c);
      if (e.kind === 'voltmeter') {
        var loose = deg[e.a] === 0 || deg[e.b] === 0;
        out.read[e.id] = loose ? null : Math.abs(v);
        if (loose) { out.flags.push('S6'); }
      }
    });
    return out;
  }

  function finishBlank(out) {
    out.net.els.forEach(function (e) {
      out.el[e.id] = { v: null, i: null, p: null };
      if (e.kind === 'ammeter' || e.kind === 'voltmeter') out.read[e.id] = null;
    });
    out.bypassed = {};
    return out;
  }

  /* KCL check for the tests: the largest current imbalance at any lattice point */
  function kclError(res) {
    var s = new Array(res.net.n).fill(0);
    res.net.els.forEach(function (e) { var c = res.el[e.id].i; if (c == null) return; s[e.a] -= c; s[e.b] += c; });
    return Math.max.apply(null, s.map(Math.abs));
  }

  var api = { solve: solve, netlist: netlist, kclError: kclError, key: key };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.CircuitSolver = api;
})(this);
