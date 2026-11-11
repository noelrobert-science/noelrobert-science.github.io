/* Seeded meter scatter (studio_design.md §5.0). One mulberry32 stream per run; two uniforms per z (u first,
   floored at 1e-12, then v; the sine value is unused). Bit-for-bit the same as lead_calc/noise.py. */
(function (root) {
  'use strict';
  function mulberry32(seed) {
    var a = seed >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) >>> 0;
      var t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t = (t ^ (t + Math.imul(t ^ (t >>> 7), t | 61))) >>> 0;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function gauss(rnd) { var u = Math.max(rnd(), 1e-12), v = rnd(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); }
  var P = { emf: 0.003, r: 0.04, R: 0.003, Vg: 0.002, Vo: 0.005, Ig: 0.005 };
  function r2(x) { var F = root.Fmt || (typeof require !== 'undefined' ? require('./fmt.js') : null); return +F.round(x, 2); }
  /* the emf rig: one reading = z_emf, z_r, z_Vgain, z_Voffset, z_Igain */
  function emfReading(rnd, emf, r, Rext) {
    var z = [gauss(rnd), gauss(rnd), gauss(rnd), gauss(rnd), gauss(rnd)];
    return { z: z, calc: function (rHeat) {
      var e = emf * (1 + P.emf * z[0]), rr = (rHeat == null ? r : rHeat) * (1 + P.r * z[1]), I = e / (Rext + rr), V = e - I * rr;
      return { I: I * (1 + P.Ig * z[4]), V: V * (1 + P.Vg * z[2]) + P.Vo * z[3], Itrue: I, Vtrue: V };
    } };
  }
  /* the Ohm rig: z_R, z_Vgain, z_Voffset, z_Igain */
  function ohmReading(rnd, Rx, E, Rrh) {
    var z = [gauss(rnd), gauss(rnd), gauss(rnd), gauss(rnd)];
    return { z: z, calc: function () {
      var Rk = Rx * (1 + P.R * z[0]), I = E / (Rk + Rrh), V = I * Rk;
      return { I: I * (1 + P.Ig * z[3]), V: V * (1 + P.Vg * z[1]) + P.Vo * z[2], Itrue: I, Vtrue: V };
    } };
  }
  function emfRun(seed, emf, r, Rprot, settings) {
    var rnd = mulberry32(seed);
    return settings.map(function (Rr) { var o = emfReading(rnd, emf, r, Rprot + Rr).calc(); return { R: Rr, I: r2(o.I), V: r2(o.V) }; });
  }
  function ohmRun(seed, Rx, E, settings) {
    var rnd = mulberry32(seed);
    return settings.map(function (Rr) { var o = ohmReading(rnd, Rx, E, Rr).calc(); return { R: Rr, I: r2(o.I), V: r2(o.V) }; });
  }
  /* least squares: m, c, residual SD (n-2), centroid */
  function lsq(xs, ys) {
    var n = xs.length, mx = 0, my = 0, i;
    for (i = 0; i < n; i++) { mx += xs[i]; my += ys[i]; }
    mx /= n; my /= n;
    var sxx = 0, sxy = 0;
    for (i = 0; i < n; i++) { sxx += (xs[i] - mx) * (xs[i] - mx); sxy += (xs[i] - mx) * (ys[i] - my); }
    var m = sxy / sxx, c = my - m * mx, ss = 0;
    for (i = 0; i < n; i++) { var e = ys[i] - (m * xs[i] + c); ss += e * e; }
    return { m: m, c: c, sd: n > 2 ? Math.sqrt(ss / (n - 2)) : 0, mx: mx, my: my };
  }
  var api = { mulberry32: mulberry32, gauss: gauss, P: P, emfReading: emfReading, ohmReading: ohmReading, emfRun: emfRun, ohmRun: ohmRun, lsq: lsq };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.Noise = api;
})(this);
