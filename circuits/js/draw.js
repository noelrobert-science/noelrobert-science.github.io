/* Circuits Studio: draws a lattice circuit as an IEB-style SVG diagram (studio_design.md §4.1, §4.9, §4.10).
   Parts sit on lattice edges; voltmeters are drawn as an offset loop across their two points; every meter shows
   its name and reading on the diagram; colours follow one quantity each (tokens in css/studio.css). */
(function (root) {
  'use strict';
  var U = 64;                         /* lattice pitch in SVG units */
  var INK = '#343A40', CUR = '#C2410C', PD = '#862E9C', GHOST = '#6C757D', GLOW = '#FFD43B', ANS = '#1D5FD1';
  var F = root.Fmt;

  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  /* 'A1' -> A with subscript 1; 'Rh' stays; 'R3' -> R₃ */
  function name(id, label) {
    if (label) return esc(label);
    var m = String(id).match(/^([A-Za-z]+?)(\d+)$/);
    if (!m) return esc(id);
    return esc(m[1]) + '<tspan class="sub" dy="4">' + esc(m[2]) + '</tspan><tspan dy="-4"></tspan>';
  }
  function plainName(id) { var m = String(id).match(/^([A-Za-z]+?)(\d+)$/); return m ? m[1] + m[2].replace(/\d/g, function (d) { return '₀₁₂₃₄₅₆₇₈₉'[d]; }) : id; }
  function ohm(R) { return F.num(R, R % 1 ? (R * 10 % 1 ? 3 : 1) : 0).replace(/,?0+$/, function (z) { return z.indexOf(',') >= 0 ? '' : z; }) + ' Ω'; }
  function short(x) { var s = F.num(x, 3); return s.replace(/,?0+$/, function (z) { return z.indexOf(',') >= 0 ? (z.length > 1 && z[0] === ',' ? '' : '') : z; }); }
  function nice(x) { /* 12 -> '12', 0.5 -> '0,5', 9.625 -> '9,625' */
    var s = String(+x.toFixed(4)); return s.replace('.', ',');
  }

  function pt(p) { return [p[0] * U, p[1] * U]; }

  function render(spec, res, o) {
    o = o || {};
    var grade = o.grade || 11, view = o.view || 'circuit', ghosts = o.ghosts || {}, pref = o.pref || {}, hidden = o.hide || {};
    var parts = spec.parts.filter(function (p) { return !p.hidden; });
    var out = [], top = [], dots = {}, deg = {}, xs = [], ys = [];
    function addPt(p) { xs.push(p[0]); ys.push(p[1]); }
    function d(p) { var k = p[0] + ',' + p[1]; deg[k] = (deg[k] || 0) + 1; }
    (spec.wires || []).forEach(function (w) { w.forEach(addPt); for (var i = 0; i + 1 < w.length; i++) { d(w[i]); d(w[i + 1]); } });
    parts.forEach(function (p) { addPt(p.a); addPt(p.b); d(p.a); d(p.b); });
    var cx = (Math.min.apply(null, xs) + Math.max.apply(null, xs)) / 2, cy = (Math.min.apply(null, ys) + Math.max.apply(null, ys)) / 2;
    var minx = Math.min.apply(null, xs), maxx = Math.max.apply(null, xs), miny = Math.min.apply(null, ys), maxy = Math.max.apply(null, ys);

    var V = res && res.state === 'ok' ? res.V : null, net = res && res.net, Vmax = o.vmax || 12;
    function potAt(p) { if (!V) return null; var k = p[0] + ',' + p[1]; return k in net.ix ? V[net.ix[k]] : null; }
    function ramp(v) { /* #868E96 at 0 V -> #212529 at Vmax */
      if (v == null) return INK;
      var t = Math.max(0, Math.min(1, v / Vmax)), a = [0x86, 0x8E, 0x96], b = [0x21, 0x25, 0x29];
      return 'rgb(' + a.map(function (c, i) { return Math.round(c + (b[i] - c) * t); }).join(',') + ')';
    }
    function wireColour(p, q) { return view === 'potential' ? ramp(potAt(p)) : INK; }
    var maxI = o.imax || 1;
    function drift(x1, y1, x2, y2, i) {
      if (!i || Math.abs(i) < 1e-6 || o.still) return '';
      if (i < 0) { var t = x1; x1 = x2; x2 = t; t = y1; y1 = y2; y2 = t; }
      var I = Math.abs(i), sp = I > 5 ? 5 * (1 + Math.log(I / 5)) : I;
      var speed = 60 * sp / Math.max(maxI, 1e-6);          /* units per second */
      var dur = Math.max(0.15, 24 / Math.max(speed, 1));
      return '<line class="drift" x1="' + x1 + '" y1="' + y1 + '" x2="' + x2 + '" y2="' + y2 + '" style="animation-duration:' + dur.toFixed(3) + 's"/>';
    }

    /* wires */
    var wireCur = {};
    if (res && res.state === 'ok') res.net.els.forEach(function (e) { if (e.kind === 'wire') wireCur[e.wire + '_' + e.seg] = res.el[e.id].i; });
    (spec.wires || []).forEach(function (w, wi) {
      for (var i = 0; i + 1 < w.length; i++) {
        var a = pt(w[i]), b = pt(w[i + 1]);
        out.push('<line class="wire" x1="' + a[0] + '" y1="' + a[1] + '" x2="' + b[0] + '" y2="' + b[1] + '" stroke="' + wireColour(w[i]) + '"/>');
        top.push(drift(a[0], a[1], b[0], b[1], wireCur[wi + '_' + i]));
      }
      if (o.arrows !== false && res && res.state === 'ok') {   /* one current arrow on the longest segment of each wire */
        var best = -1, bl = 0;
        for (i = 0; i + 1 < w.length; i++) { var l = Math.abs(w[i + 1][0] - w[i][0]) + Math.abs(w[i + 1][1] - w[i][1]); if (l > bl) { bl = l; best = i; } }
        var c = wireCur[wi + '_' + best];
        if (best >= 0 && c && Math.abs(c) > 1e-6) top.push(arrow(pt(w[best]), pt(w[best + 1]), c));
      }
    });

    /* parts */
    var labels = [];
    parts.forEach(function (p) {
      var a = pt(p.a), b = pt(p.b), r = res && res.state === 'ok' ? res.el[p.id] : null;
      var dx = b[0] - a[0], dy = b[1] - a[1], L = Math.sqrt(dx * dx + dy * dy), ang = Math.atan2(dy, dx) * 180 / Math.PI;
      var mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2, horiz = Math.abs(dx) >= Math.abs(dy);
      var col = wireColour(p.a), byp = res && res.bypassed && res.bypassed[p.id];
      if (p.kind === 'voltmeter') { drawVoltmeter(p, r); return; }
      var half = { resistor: 24, rheostat: 24, motor: 15, heater: 24, bulb: 14, ammeter: 14, switch: 17, battery: Math.min(L / 2 - 6, p.r > 0 && grade >= 11 ? 44 : 12) }[p.kind] || 14;
      var g = '<g class="part k-' + p.kind + (byp ? ' bypassed' : '') + '" data-id="' + esc(p.id) + '" transform="translate(' + mx + ' ' + my + ') rotate(' + ang + ')">';
      g += '<line class="wire" x1="' + (-L / 2) + '" y1="0" x2="' + (-half) + '" y2="0" stroke="' + col + '"/>';
      g += '<line class="wire" x1="' + half + '" y1="0" x2="' + (L / 2) + '" y2="0" stroke="' + wireColour(p.b) + '"/>';
      var i = r ? r.i : 0;
      if (p.kind === 'resistor' || p.kind === 'heater') g += '<rect class="sym" x="-24" y="-8" width="48" height="16"/>';
      else if (p.kind === 'rheostat') g += '<rect class="sym" x="-24" y="-8" width="48" height="16"/><path class="sym arrowline" d="M-20 14 L18 -14" marker-end="url(#ah)"/>';
      else if (p.kind === 'motor') g += '<circle class="sym" r="15"/><text class="mlet" transform="rotate(' + (-ang) + ')" y="5">M</text>';
      else if (p.kind === 'bulb') {
        var P = r ? r.p : 0, ref = pref[p.id] || 6, k = Math.min(1.3, Math.sqrt(Math.max(P, 0) / ref));
        if (!byp && P > 0.02 * ref) {
          g += '<circle class="glow" r="' + (14 + 16 * k).toFixed(1) + '"/>';
          var n = Math.max(1, Math.min(8, Math.round(8 * Math.min(1, k))));
          for (var q = 0; q < n; q++) { var th = q * 2 * Math.PI / 8 + Math.PI / 8; g += '<line class="ray" x1="' + (18 * Math.cos(th)).toFixed(1) + '" y1="' + (18 * Math.sin(th)).toFixed(1) + '" x2="' + ((22 + 6 * k) * Math.cos(th)).toFixed(1) + '" y2="' + ((22 + 6 * k) * Math.sin(th)).toFixed(1) + '"/>'; }
        }
        g += '<circle class="sym bulbc" r="14"/><path class="sym" d="M-10 -10 L10 10 M-10 10 L10 -10"/>';
      }
      else if (p.kind === 'ammeter') g += '<circle class="sym meter" r="14"/><text class="mlet" transform="rotate(' + (-ang) + ')" y="5">A</text>';
      else if (p.kind === 'switch') {
        g += '<circle class="sw" cx="-17" r="3.2"/><circle class="sw" cx="17" r="3.2"/>';
        g += p.closed ? '<line class="sym swl" x1="-17" y1="0" x2="17" y2="0"/>' : '<line class="sym swl" x1="-17" y1="0" x2="13" y2="-15"/>';
        g += '<rect class="hit" x="-26" y="-22" width="52" height="40"/>';
      }
      else if (p.kind === 'battery') {
        var showR = p.r > 0 && grade >= 11 && !o.ideal;
        /* + terminal is at b (local +x end); cell: long thin plate (+) nearer b, short thick plate (−) */
        if (showR) {
          g += '<rect class="bbox" x="' + (-half) + '" y="-20" width="' + (2 * half) + '" height="40" rx="3"/>';
          g += '<line class="wire" x1="' + (-half) + '" y1="0" x2="-4" y2="0"/><line class="wire" x1="4" y1="0" x2="10" y2="0"/>';
          g += '<line class="plate-long" x1="4" y1="-14" x2="4" y2="14"/><line class="plate-short" x1="-4" y1="-7" x2="-4" y2="7"/>';
          g += '<rect class="sym small" x="10" y="-5" width="' + (half - 14) + '" height="10"/><line class="wire" x1="' + (half - 4) + '" y1="0" x2="' + half + '" y2="0"/>';
        } else {
          g += '<line class="wire" x1="' + (-half) + '" y1="0" x2="-4" y2="0"/><line class="wire" x1="4" y1="0" x2="' + half + '" y2="0"/>';
          g += '<line class="plate-long" x1="4" y1="-14" x2="4" y2="14"/><line class="plate-short" x1="-4" y1="-7" x2="-4" y2="7"/>';
        }
        g += '<rect class="hit" x="' + (-half - 4) + '" y="-24" width="' + (2 * half + 8) + '" height="48"/>';
      }
      if (p.kind === 'rheostat' || p.kind === 'resistor' || p.kind === 'bulb' || p.kind === 'motor' || p.kind === 'heater') g += '<rect class="hit" x="-26" y="-20" width="52" height="40"/>';
      g += '</g>';
      out.push(g);
      /* label on the outer side, or the other side when a voltmeter loop uses that side */
      var side = labelSide(p, horiz);
      labels.push(partLabel(p, r, mx, my, side, horiz, byp));
    });

    function labelSide(p, horiz) {
      var vm = spec.parts.filter(function (q) { return q.kind === 'voltmeter' && ((same(q.a, p.a) && same(q.b, p.b)) || (same(q.a, p.b) && same(q.b, p.a))); })[0];
      if (p.lside) return p.lside;
      /* a part stacked one unit away on that side (parallel branches) takes the side, so turn away from it */
      function stacked(dx, dy) {
        return spec.parts.some(function (q) { return q !== p && q.kind !== 'voltmeter' && q.a && q.b &&
          Math.min(q.a[0], q.b[0]) < Math.max(p.a[0], p.b[0]) + dx * 0 + (dx ? 1 : 0.5) && Math.max(q.a[0], q.b[0]) > Math.min(p.a[0], p.b[0]) - (dx ? 1 : 0.5) &&
          (dy ? (q.a[1] === p.a[1] + dy && q.b[1] === p.b[1] + dy) : (q.a[0] === p.a[0] + dx && q.b[0] === p.b[0] + dx)) &&
          (dy ? true : Math.min(q.a[1], q.b[1]) < Math.max(p.a[1], p.b[1]) && Math.max(q.a[1], q.b[1]) > Math.min(p.a[1], p.b[1])); });
      }
      if (horiz) {
        var outer = (p.a[1] <= cy) ? 'up' : 'down';
        if (vm && vm.side === outer) outer = outer === 'up' ? 'down' : 'up';
        else if (stacked(0, outer === 'up' ? -1 : 1) && !stacked(0, outer === 'up' ? 1 : -1)) outer = outer === 'up' ? 'down' : 'up';
        if (p.label === 'wire') outer = 'down';
        return outer;
      }
      var o2 = (p.a[0] <= cx) ? 'left' : 'right';
      if (vm && vm.side === o2) o2 = o2 === 'left' ? 'right' : 'left';
      else if (stacked(o2 === 'left' ? -1 : 1, 0) && !stacked(o2 === 'left' ? 1 : -1, 0)) o2 = o2 === 'left' ? 'right' : 'left';
      return o2;
    }
    function same(a, b) { return a[0] === b[0] && a[1] === b[1]; }

    function partLabel(p, r, mx, my, side, horiz, byp) {
      var lines = [], meterLine = null;
      if (p.kind === 'battery') {
        var showR = p.r > 0 && grade >= 11 && !o.ideal;
        lines.push('<tspan class="chip">emf ' + (o.hideEmf ? '= ?' : nice(p.emf) + ' V') + ' 🔒</tspan>');
        if (showR) lines.push('<tspan class="chip">r ' + (o.hideR ? '= ?' : nice(p.r) + ' Ω') + ' 🔒</tspan>');
        else if (grade === 10 || o.ideal || !(p.r > 0)) lines.push('<tspan class="note">' + (grade === 10 ? 'ideal battery' : 'ideal, r = 0') + '</tspan>');
      } else if (p.kind === 'ammeter') {
        meterLine = meterPill(p.id, res ? res.read[p.id] : null, 'A');
      } else if (p.kind === 'switch') {
        lines.push('<tspan class="nm">' + name(p.id, p.label === 'wire' ? null : p.label) + '</tspan> <tspan class="note">' + (p.closed ? 'closed' : 'open') + '</tspan>');
      } else {
        var R = p.kind === 'bulb' && p.filament ? null : p.R;
        var nm = p.label ? '<tspan class="nm">' + esc(p.label) + '</tspan>' : '<tspan class="nm">' + name(p.id) + '</tspan>';
        lines.push(nm + (R != null ? ' <tspan class="val">' + ohm(R) + '</tspan>' : ''));
        if (byp) lines.push('<tspan class="byp">no current: bypassed</tspan>');
        else if (o.showPower && p.kind === 'bulb' && r) lines.push('<tspan class="pw">P = ' + F.num(r.p) + ' W</tspan>');
      }
      var off = p.kind === 'battery' ? 34 : 26, x = mx, y = my, anchor = 'middle';
      if (side === 'up') y = my - off - (lines.length - 1) * 15 - (meterLine ? 6 : 0);
      if (side === 'down') y = my + off + 8;
      if (side === 'left') { x = mx - off; anchor = 'end'; y = my + 4 - (lines.length - 1) * 7; }
      if (side === 'right') { x = mx + off; anchor = 'start'; y = my + 4 - (lines.length - 1) * 7; }
      var s = '';
      if (lines.length) {
        s += '<text class="lbl" x="' + x + '" y="' + y + '" text-anchor="' + anchor + '">';
        lines.forEach(function (l, k) { s += '<tspan x="' + x + '" dy="' + (k ? 15 : 0) + '">' + l + '</tspan>'; });
        s += '</text>';
      }
      if (meterLine) s += meterLine(x, y, anchor, side);
      return s;
    }

    function meterPill(id, val, u) {
      return function (x, y, anchor, side) {
        var txt = (hidden[id] ? '?' : F.meter(val)) + ' ' + u;
        var g = ghosts[id], s = '<text class="lbl mread" x="' + x + '" y="' + y + '" text-anchor="' + anchor + '" data-meter="' + esc(id) + '"><tspan class="nm">' + name(id) + '</tspan> <tspan class="reading">' + esc(txt) + '</tspan></text>';
        if (g && !hidden[id]) {
          var gy = side === 'up' ? y - 15 : y + 15;
          s += '<text class="lbl ghost" x="' + x + '" y="' + gy + '" text-anchor="' + anchor + '">before ' + esc(F.meter(g.v)) + ' ' + u + ' · <tspan class="word ' + g.word.replace(/ /g, '') + '">' + g.word + '</tspan></text>';
        }
        return s;
      };
    }

    function drawVoltmeter(p, r) {
      var a = pt(p.a), b = pt(p.b), off = 0.78 * U, side = p.side || 'up';
      var v = side === 'up' ? [0, -off] : side === 'down' ? [0, off] : side === 'left' ? [-off, 0] : [off, 0];
      var a2 = [a[0] + v[0], a[1] + v[1]], b2 = [b[0] + v[0], b[1] + v[1]], m = [(a2[0] + b2[0]) / 2, (a2[1] + b2[1]) / 2];
      addPt([a2[0] / U, a2[1] / U]); addPt([b2[0] / U, b2[1] / U]);
      var horiz = Math.abs(b2[0] - a2[0]) >= Math.abs(b2[1] - a2[1]);
      var g = '<g class="part k-voltmeter" data-id="' + esc(p.id) + '">';
      g += '<polyline class="vwire" points="' + [a, a2, b2, b].map(function (q) { return q.join(','); }).join(' ') + '"/>';
      g += '<circle class="sym meter" cx="' + m[0] + '" cy="' + m[1] + '" r="14"/><text class="mlet" x="' + m[0] + '" y="' + (m[1] + 5) + '">V</text>';
      g += '<circle class="jdot" cx="' + a[0] + '" cy="' + a[1] + '" r="3.6"/><circle class="jdot" cx="' + b[0] + '" cy="' + b[1] + '" r="3.6"/></g>';
      out.push(g);
      var val = res ? res.read[p.id] : null, x = m[0], y = m[1], anchor = 'middle';
      if (horiz) y = side === 'down' ? m[1] + 34 : m[1] - 22;
      else { x = side === 'left' ? m[0] - 22 : m[0] + 22; anchor = side === 'left' ? 'end' : 'start'; y = m[1] + 5; }
      labels.push(meterPill(p.id, val, 'V')(x, y, anchor, horiz ? side : 'down'));
      xs.push((x + (anchor === 'end' ? -90 : anchor === 'start' ? 90 : 0)) / U); ys.push(y / U + 0.4); ys.push(y / U - 0.4);
    }

    /* junction dots: three or more connections */
    Object.keys(deg).forEach(function (k) { if (deg[k] >= 3) { var q = k.split(',').map(Number); out.push('<circle class="jdot" cx="' + q[0] * U + '" cy="' + q[1] * U + '" r="3.6"/>'); } });

    /* potential pills (potential view): one per connected wire group */
    if (view === 'potential' && V) {
      var seen = {};
      Object.keys(deg).forEach(function (k) {
        var q = k.split(',').map(Number), v = potAt(q); if (v == null) return;
        var key2 = F.round(v, 2); if (seen[key2]) return; seen[key2] = 1;
        labels.push('<g class="vpill"><rect x="' + (q[0] * U + 6) + '" y="' + (q[1] * U + 6) + '" width="58" height="18" rx="9"/><text x="' + (q[0] * U + 35) + '" y="' + (q[1] * U + 19) + '">' + F.num(v) + ' V</text></g>');
      });
    }

    var pad = 1.6;
    var vb = [(Math.min.apply(null, xs) - pad) * U, (Math.min.apply(null, ys) - pad + 0.35) * U, (Math.max.apply(null, xs) - Math.min.apply(null, xs) + 2 * pad) * U, (Math.max.apply(null, ys) - Math.min.apply(null, ys) + 2 * pad - 0.35) * U];
    var defs = '<defs><marker id="ah" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 z" fill="' + INK + '"/></marker></defs>';
    return { svg: '<svg class="circ view-' + view + '" viewBox="' + vb.map(function (n) { return n.toFixed(1); }).join(' ') + '" role="img" aria-label="' + esc(o.title || 'circuit diagram') + '">' + defs + out.join('') + top.join('') + labels.join('') + '</svg>', viewBox: vb };
  }

  function arrow(a, b, i) {
    var mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2, ang = Math.atan2(b[1] - a[1], b[0] - a[0]) * 180 / Math.PI + (i < 0 ? 180 : 0);
    return '<path class="carrow" transform="translate(' + mx + ' ' + my + ') rotate(' + ang + ')" d="M-6 -6 L6 0 L-6 6 z"/>';
  }

  var api = { render: render, name: name, plainName: plainName, nice: nice, U: U };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.Draw = api;
})(this);
