/* Display rule (studio_design.md §4.3 step 10): full precision inside; for display, round to 10 significant
   figures, then half up to 2 decimal places in decimal string arithmetic, with a decimal comma.
   13,125 -> 13,13; 0,625 -> 0,63; 1,005 -> 1,01; 0,145 -> 0,15; 13,124999999999 -> 13,13. */
(function (root) {
  'use strict';
  function plain(s) {           /* '1.23e-5' -> '0.0000123' */
    if (!/e/i.test(s)) return s;
    var m = s.match(/^(-?)(\d)(?:\.(\d+))?e([+-]\d+)$/i);
    if (!m) return s;
    var sign = m[1], digits = m[2] + (m[3] || ''), exp = parseInt(m[4], 10), point = 1 + exp;
    if (point <= 0) return sign + '0.' + '0'.repeat(-point) + digits;
    if (point >= digits.length) return sign + digits + '0'.repeat(point - digits.length);
    return sign + digits.slice(0, point) + '.' + digits.slice(point);
  }
  function round(x, dp) {
    if (dp == null) dp = 2;
    if (x == null || !isFinite(x)) return null;
    var neg = x < 0, s = plain(Math.abs(x).toPrecision(10));
    var parts = s.split('.'), ip = parts[0], fp = (parts[1] || '') + '0'.repeat(dp + 1);
    var keep = ip + fp.slice(0, dp), next = fp.charCodeAt(dp) - 48;
    var n = BigInt(keep);
    if (next >= 5) n = n + 1n;
    var t = n.toString().padStart(dp + 1, '0');
    var out = dp ? t.slice(0, t.length - dp) + '.' + t.slice(t.length - dp) : t;
    if (neg && /[1-9]/.test(out)) out = '-' + out;
    return out;                  /* decimal point string, e.g. '13.13' */
  }
  function num(x, dp) { var r = round(x, dp); return r == null ? '—' : r.replace('.', ',').replace('-', '−'); }
  /* meter faces: 2 dp, or 1 dp from 100 upwards */
  function meter(x) { if (x == null) return '—'; return num(x, Math.abs(x) >= 100 ? 1 : 2); }
  function unit(x, u, dp) { return x == null ? '—' : num(x, dp) + ' ' + u; }
  /* read a learner's number: accepts a decimal comma, spaces as thousands separators, a unicode minus */
  function parse(s) {
    if (s == null) return NaN;
    s = String(s).trim().replace(/−/g, '-').replace(/\s/g, '').replace(',', '.');
    if (!/^-?\d*\.?\d+(e-?\d+)?$/i.test(s)) return NaN;
    return parseFloat(s);
  }
  var api = { round: round, num: num, meter: meter, unit: unit, parse: parse };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.Fmt = api;
})(this);
