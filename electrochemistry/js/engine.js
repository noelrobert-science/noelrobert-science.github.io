/* Electrochemistry Studio: chemistry engine.
   One engine drives every tool. It holds Table 4 exactly as the IEB 2025 Paper 2 data sheet prints it,
   writes half-reactions, balances electrons, writes cell notation, calculates Eθcell, predicts
   electrolysis products and runs the Faraday chain. House conventions: decimal comma, Cℓ and Aℓ,
   single arrows, brackets round negative values, unit V.
   Works as a browser script (window.EC) and as a Node module (require). */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.EC = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  /* ---------- constants ---------- */
  const F = 96500;          // C·mol⁻¹
  const VM = 22.4;          // dm³·mol⁻¹ at STP
  const ARROW = '→';
  const MINUS = '−';

  // Relative atomic masses as used in the coursebooks (IEB data sheet values)
  const AR = {
    H: 1, He: 4, Li: 7, Be: 9, B: 10.8, C: 12, N: 14, O: 16, F: 19, Ne: 20, Na: 23, Mg: 24.3, Al: 27, Si: 28,
    P: 31, S: 32, Cl: 35.5, Ar: 40, K: 39, Ca: 40, Ti: 48, Cr: 52, Mn: 55, Fe: 56, Co: 59, Ni: 59, Cu: 63.5,
    Zn: 65.4, Br: 80, Sr: 88, Ag: 108, Cd: 112, Sn: 119, I: 127, Cs: 133, Ba: 137.3, Pt: 195, Au: 197, Hg: 200.6, Pb: 207
  };

  /* ---------- Table 4 (IEB 2025 data sheet, top to bottom: most negative first) ---------- */
  const T4_SRC = [
    ['Li⁺ + e⁻', 'Li', -3.05], ['K⁺ + e⁻', 'K', -2.93], ['Cs⁺ + e⁻', 'Cs', -2.92], ['Ba²⁺ + 2e⁻', 'Ba', -2.90],
    ['Sr²⁺ + 2e⁻', 'Sr', -2.89], ['Ca²⁺ + 2e⁻', 'Ca', -2.87], ['Na⁺ + e⁻', 'Na', -2.71], ['Mg²⁺ + 2e⁻', 'Mg', -2.37],
    ['Aℓ³⁺ + 3e⁻', 'Aℓ', -1.66], ['Mn²⁺ + 2e⁻', 'Mn', -1.18], ['2H₂O + 2e⁻', 'H₂(g) + 2OH⁻', -0.83], ['Zn²⁺ + 2e⁻', 'Zn', -0.76],
    ['Cr³⁺ + 3e⁻', 'Cr', -0.74], ['Fe²⁺ + 2e⁻', 'Fe', -0.44], ['Cd²⁺ + 2e⁻', 'Cd', -0.40], ['Co²⁺ + 2e⁻', 'Co', -0.28],
    ['Ni²⁺ + 2e⁻', 'Ni', -0.25], ['Sn²⁺ + 2e⁻', 'Sn', -0.14], ['Pb²⁺ + 2e⁻', 'Pb', -0.13], ['Fe³⁺ + 3e⁻', 'Fe', -0.04],
    ['2H⁺ + 2e⁻', 'H₂(g)', 0.00], ['S + 2H⁺ + 2e⁻', 'H₂S(g)', 0.14], ['Sn⁴⁺ + 2e⁻', 'Sn²⁺', 0.15],
    ['SO₄²⁻ + 4H⁺ + 2e⁻', 'SO₂(g) + 2H₂O', 0.17], ['Cu²⁺ + 2e⁻', 'Cu', 0.34], ['2H₂O + O₂ + 4e⁻', '4OH⁻', 0.40],
    ['SO₂ + 4H⁺ + 4e⁻', 'S + 2H₂O', 0.45], ['I₂ + 2e⁻', '2I⁻', 0.54], ['O₂(g) + 2H⁺ + 2e⁻', 'H₂O₂', 0.68],
    ['Fe³⁺ + e⁻', 'Fe²⁺', 0.77], ['Hg²⁺ + 2e⁻', 'Hg', 0.79], ['NO₃⁻ + 2H⁺ + e⁻', 'NO₂(g) + H₂O', 0.80], ['Ag⁺ + e⁻', 'Ag', 0.80],
    ['NO₃⁻ + 4H⁺ + 3e⁻', 'NO(g) + 2H₂O', 0.96], ['Br₂ + 2e⁻', '2Br⁻', 1.09],
    ['MnO₂ + 4H⁺ + 2e⁻', 'Mn²⁺ + 2H₂O', 1.21], ['O₂ + 4H⁺ + 4e⁻', '2H₂O', 1.23], ['Cr₂O₇²⁻ + 14H⁺ + 6e⁻', '2Cr³⁺ + 7H₂O', 1.33],
    ['Cℓ₂(g) + 2e⁻', '2Cℓ⁻', 1.36], ['Au³⁺ + 3e⁻', 'Au', 1.42], ['MnO₄⁻ + 8H⁺ + 5e⁻', 'Mn²⁺ + 4H₂O', 1.51],
    ['H₂O₂ + 2H⁺ + 2e⁻', '2H₂O', 1.77], ['F₂(g) + 2e⁻', '2F⁻', 2.87]
  ];

  /* ---------- species catalogue ---------- */
  const METALS = ['Li', 'K', 'Cs', 'Ba', 'Sr', 'Ca', 'Na', 'Mg', 'Aℓ', 'Mn', 'Zn', 'Cr', 'Fe', 'Cd', 'Co', 'Ni', 'Sn', 'Pb', 'Cu', 'Hg', 'Ag', 'Au', 'Pt', 'Ti'];
  const GASES = ['H₂', 'O₂', 'Cℓ₂', 'F₂', 'NO', 'NO₂', 'SO₂', 'H₂S'];
  const NAMES = {
    'Li': 'lithium', 'K': 'potassium', 'Cs': 'caesium', 'Ba': 'barium', 'Sr': 'strontium', 'Ca': 'calcium', 'Na': 'sodium',
    'Mg': 'magnesium', 'Aℓ': 'aluminium', 'Mn': 'manganese', 'Zn': 'zinc', 'Cr': 'chromium', 'Fe': 'iron', 'Cd': 'cadmium',
    'Co': 'cobalt', 'Ni': 'nickel', 'Sn': 'tin', 'Pb': 'lead', 'Cu': 'copper', 'Hg': 'mercury', 'Ag': 'silver', 'Au': 'gold',
    'Pt': 'platinum', 'S': 'sulfur',
    'Li⁺': 'lithium ions', 'K⁺': 'potassium ions', 'Cs⁺': 'caesium ions', 'Ba²⁺': 'barium ions', 'Sr²⁺': 'strontium ions',
    'Ca²⁺': 'calcium ions', 'Na⁺': 'sodium ions', 'Mg²⁺': 'magnesium ions', 'Aℓ³⁺': 'aluminium ions',
    'Mn²⁺': 'manganese(II) ions', 'Zn²⁺': 'zinc ions', 'Cr³⁺': 'chromium(III) ions', 'Fe²⁺': 'iron(II) ions',
    'Fe³⁺': 'iron(III) ions', 'Cd²⁺': 'cadmium ions', 'Co²⁺': 'cobalt(II) ions', 'Ni²⁺': 'nickel(II) ions',
    'Sn²⁺': 'tin(II) ions', 'Sn⁴⁺': 'tin(IV) ions', 'Pb²⁺': 'lead(II) ions', 'Cu²⁺': 'copper(II) ions', 'Hg²⁺': 'mercury(II) ions',
    'Ag⁺': 'silver ions', 'Au³⁺': 'gold(III) ions', 'H⁺': 'hydrogen ions', 'OH⁻': 'hydroxide ions', 'H₂O': 'water',
    'H₂': 'hydrogen', 'O₂': 'oxygen', 'Cℓ₂': 'chlorine', 'Br₂': 'bromine', 'I₂': 'iodine', 'F₂': 'fluorine',
    'Cℓ⁻': 'chloride ions', 'Br⁻': 'bromide ions', 'I⁻': 'iodide ions', 'F⁻': 'fluoride ions',
    'H₂O₂': 'hydrogen peroxide', 'H₂S': 'hydrogen sulfide', 'SO₂': 'sulfur dioxide', 'SO₄²⁻': 'sulfate ions',
    'NO₃⁻': 'nitrate ions', 'NO₂': 'nitrogen dioxide', 'NO': 'nitrogen monoxide', 'MnO₄⁻': 'permanganate ions',
    'MnO₂': 'manganese dioxide', 'Cr₂O₇²⁻': 'dichromate ions'
  };
  const COLOURS = {   // solution or substance colours learners are asked to observe
    'Cu²⁺': 'blue', 'Fe²⁺': 'pale green', 'Fe³⁺': 'yellow-brown', 'Ni²⁺': 'green', 'Co²⁺': 'pink',
    'MnO₄⁻': 'purple', 'Mn²⁺': 'colourless (very pale pink)', 'Cr₂O₇²⁻': 'orange', 'Cr³⁺': 'green',
    'Br₂': 'orange-brown', 'I₂': 'brown (yellow-brown)', 'Cℓ₂': 'pale green-yellow', 'Cu': 'reddish-brown (pink)', 'Ag': 'grey-silver'
  };

  /* ---------- formula helpers ---------- */
  const SUP = { '⁰': 0, '¹': 1, '²': 2, '³': 3, '⁴': 4, '⁵': 5, '⁶': 6, '⁷': 7, '⁸': 8, '⁹': 9 };
  const SUB = { '₀': 0, '₁': 1, '₂': 2, '₃': 3, '₄': 4, '₅': 5, '₆': 6, '₇': 7, '₈': 8, '₉': 9 };
  const TO_SUB = '₀₁₂₃₄₅₆₇₈₉';
  const TO_SUP = '⁰¹²³⁴⁵⁶⁷⁸⁹';

  function charge(sp) {
    const m = sp.match(/([⁰¹²³⁴⁵⁶⁷⁸⁹]*)([⁺⁻])$/);
    if (!m) return 0;
    const n = m[1] ? Number([...m[1]].map(c => SUP[c]).join('')) : 1;
    return m[2] === '⁺' ? n : -n;
  }

  // atom counts: 'Cr₂O₇²⁻' -> {Cr:2, O:7}; 'MgCℓ₂·6H₂O' handled
  function atoms(formula) {
    let f = formula.replace(/\((g|s|aq|ℓ|l)\)/g, '').replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹⁺⁻]+$/, '');
    f = f.replace(/Cℓ/g, 'Cl').replace(/Aℓ/g, 'Al').replace(/[₀-₉]/g, c => String(SUB[c]));
    const out = {};
    const parts = f.split('·');
    for (const part of parts) {
      const pm = part.match(/^(\d*)(.*)$/);
      const mult = pm[1] ? Number(pm[1]) : 1;
      const counts = parseGroup(pm[2]);
      for (const k in counts) out[k] = (out[k] || 0) + counts[k] * mult;
    }
    return out;
  }
  function parseGroup(s) {
    const stack = [{}];
    const re = /([A-Z][a-z]?)(\d*)|(\()|(\))(\d*)/g;
    let m;
    while ((m = re.exec(s))) {
      if (m[1]) { const top = stack[stack.length - 1]; top[m[1]] = (top[m[1]] || 0) + (m[2] ? Number(m[2]) : 1); }
      else if (m[3]) stack.push({});
      else if (m[4]) {
        const g = stack.pop(); const k = m[5] ? Number(m[5]) : 1; const top = stack[stack.length - 1];
        for (const e in g) top[e] = (top[e] || 0) + g[e] * k;
      }
    }
    return stack[0];
  }
  function molarMass(formula) {
    const a = atoms(formula); let M = 0;
    for (const e in a) { if (!(e in AR)) throw new Error('No Ar for ' + e); M += AR[e] * a[e]; }
    return round(M, 4);
  }
  // working line as the book writes it: M(MgCℓ₂·6H₂O) = 24,3 + 2(35,5) + 6(18) = 203,3 g·mol⁻¹
  function molarMassWorking(formula) {
    const parts = formula.split('·');
    const bits = [];
    const head = parts[0];
    const a = parseGroup(head.replace(/Cℓ/g, 'Cl').replace(/Aℓ/g, 'Al').replace(/[₀-₉]/g, c => String(SUB[c])));
    for (const e in a) bits.push(a[e] === 1 ? num(AR[e]) : `${a[e]}(${num(AR[e])})`);
    for (const p of parts.slice(1)) {
      const pm = p.match(/^(\d*)(.*)$/);
      const k = pm[1] ? Number(pm[1]) : 1;
      bits.push(`${k}(${num(molarMass(pm[2]))})`);
    }
    return `M(${formula}) = ${bits.join(' + ')} = ${num(molarMass(formula))} g·mol⁻¹`;
  }

  function sub(n) { return String(n).split('').map(d => TO_SUB[+d]).join(''); }
  function sup(n) { return String(n).split('').map(d => TO_SUP[+d]).join(''); }
  // turn plain ASCII like "Cu2+" or "SO4 2-" into display form
  function pretty(s) {
    return s.replace(/Cl/g, 'Cℓ').replace(/Al/g, 'Aℓ')
      .replace(/\^(\d*)([+-])/g, (m, d, sg) => (d ? sup(d) : '') + (sg === '+' ? '⁺' : '⁻'))
      .replace(/([A-Za-zℓ)])(\d+)/g, (m, a, d) => a + sub(d));
  }

  /* ---------- number formatting (decimal comma, grouped thousands) ---------- */
  function round(x, dp) { const f = Math.pow(10, dp); return Math.round((x + Number.EPSILON * Math.sign(x)) * f) / f; }
  function group(intStr) { return intStr.length > 3 ? intStr.replace(/\B(?=(\d{3})+(?!\d))/g, ' ') : intStr; }
  // num(2416.3, 2) -> "2 416,30"; num(0.5) -> "0,5"; negative uses a true minus
  function num(x, dp) {
    let s;
    if (dp === undefined) { s = String(round(x, 10)); if (/e/i.test(s)) s = Math.abs(x).toFixed(10).replace(/0+$/, '').replace(/\.$/, ''); }
    else s = Math.abs(round(x, dp)).toFixed(dp);
    s = s.replace('-', '');
    const [i, d] = s.split('.');
    const out = group(i) + (d !== undefined ? ',' + d : '');
    return (x < 0 && Number(s) !== 0 ? MINUS : '') + out;
  }
  // significant figures, as the books carry intermediate values (0,250394; 186,528)
  function sig(x, n) {
    if (x === 0) return 0;
    const p = n - 1 - Math.floor(Math.log10(Math.abs(x)));
    return p >= 0 ? round(x, p) : Math.round(x / Math.pow(10, -p)) * Math.pow(10, -p);
  }
  function numSig(x, n) {
    if (x === 0) return '0';
    const v = sig(x, n);
    const p = Math.max(0, n - 1 - Math.floor(Math.log10(Math.abs(v))));
    let s = num(v, p);
    if (s.includes(',')) s = s.replace(/0+$/, '').replace(/,$/, '');
    return s;
  }
  // E value as Table 4 prints it: +0,34 / −0,76 / 0,00
  function ev(e) { return Math.abs(e) < 1e-9 ? '0,00' : (e > 0 ? '+' : MINUS) + Math.abs(e).toFixed(2).replace('.', ','); }
  // E value inside a subtraction: negative values in brackets
  function evSub(e) { return e < 0 ? `(${MINUS}${Math.abs(e).toFixed(2).replace('.', ',')})` : Math.abs(e).toFixed(2).replace('.', ','); }
  function evPlain(e) { return Math.abs(e) < 1e-9 ? '0,00' : (e < 0 ? MINUS : '') + Math.abs(e).toFixed(2).replace('.', ','); }
  // standard form: 1,8 × 10⁷
  function sci(x, sf) {
    if (x === 0) return '0';
    let e = Math.floor(Math.log10(Math.abs(x)));
    let m = round(x / Math.pow(10, e), (sf || 2) - 1);
    if (Math.abs(m) >= 10) { m = round(m / 10, (sf || 2) - 1); e += 1; }
    let ms = num(m, (sf || 2) - 1);
    ms = ms.replace(/,?0+$/, '') || '0';
    return `${ms} × 10${e < 0 ? '⁻' : ''}${sup(Math.abs(e))}`;
  }

  /* ---------- terms and rows ---------- */
  function parseTerm(t) {
    t = t.trim();
    const m = t.match(/^(\d*)(.+?)(?:\((g|s|aq|ℓ)\))?$/);
    const sp = m[2];
    return { c: m[1] ? Number(m[1]) : 1, sp, gasMark: m[3] === 'g' };
  }
  function parseSide(s) { return s.split(' + ').map(parseTerm); }

  const ROWS = T4_SRC.map(([l, r, E], i) => {
    const left = parseSide(l), right = parseSide(r);
    const eTerm = left.find(t => t.sp === 'e⁻');
    const row = {
      i, E, n: eTerm.c, leftText: l, rightText: r,
      ox: left.filter(t => t.sp !== 'e⁻'),   // left side: oxidised form (oxidising agent side)
      red: right,                             // right side: reduced form (reducing agent side)
    };
    row.key = row.ox.map(t => t.sp).join('+') + '/' + row.red.map(t => t.sp).join('+');
    // main species: the one that changes oxidation number (skip H⁺, H₂O, OH⁻ helpers)
    row.oa = mainSpecies(row.ox);
    row.ra = mainSpecies(row.red);
    return row;
  });
  function mainSpecies(terms) {
    const helpers = ['H⁺', 'H₂O', 'OH⁻'];
    const main = terms.filter(t => !helpers.includes(t.sp));
    return (main.length ? main[0] : terms[0]).sp;
  }

  function rowsWithLeft(sp) { return ROWS.filter(r => r.ox.some(t => t.sp === sp)); }
  function rowsWithRight(sp) { return ROWS.filter(r => r.red.some(t => t.sp === sp)); }
  function rowByE(E, hint) {
    const rs = ROWS.filter(r => Math.abs(r.E - E) < 1e-9);
    if (rs.length === 1 || !hint) return rs[0];
    return rs.find(r => r.key.includes(hint)) || rs[0];
  }
  function rowByKey(k) { return ROWS.find(r => r.key === k); }

  /* "The product picks the row": find the row for reactant -> product */
  function findHalf(reactant, product) {
    for (const r of ROWS) {
      const L = r.ox.map(t => t.sp), R = r.red.map(t => t.sp);
      if (L.includes(reactant) && R.includes(product)) return { row: r, dir: 'reduction' };
      if (R.includes(reactant) && L.includes(product)) return { row: r, dir: 'oxidation' };
    }
    return null;
  }
  // the rows in which a species does each job: only rows where it is THE oxidising (or reducing) agent,
  // not rows where it just balances the equation (H₂O in SO₄²⁻ + 4H⁺ + 2e⁻ ⇌ SO₂ + 2H₂O is not a reducing agent)
  function jobsOf(sp) {
    return {
      asOA: rowsWithLeft(sp).filter(r => r.oa === sp),    // can be reduced: oxidising agent
      asRA: rowsWithRight(sp).filter(r => r.ra === sp)    // can be oxidised: reducing agent
    };
  }
  const TWO_JOBS = (() => {
    const L = new Set(), R = new Set();
    ROWS.forEach(r => { r.ox.forEach(t => L.add(t.sp)); r.red.forEach(t => R.add(t.sp)); });
    return [...L].filter(s => R.has(s) && !['H⁺', 'e⁻'].includes(s));
  })();

  /* ---------- writing terms and equations ---------- */
  function termText(t, opts) {
    const c = t.c === 1 ? '' : String(t.c);
    let sp = t.sp;
    if (opts && opts.states) sp += '(' + phaseOf(t.sp) + ')';
    return c + sp;
  }
  function sideText(terms, opts) { return terms.map(t => termText(t, opts)).join(' + '); }
  function eqText(left, right, opts) {
    if (!left.length && !right.length) return 'no net reaction: everything cancels';
    return sideText(left, opts) + ' ' + ARROW + ' ' + sideText(right, opts);
  }

  function scale(terms, k) { return terms.map(t => ({ c: t.c * k, sp: t.sp })); }
  const E_TERM = n => ({ c: n, sp: 'e⁻' });

  function reductionHalf(row, k) {
    k = k || 1;
    const left = scale(row.ox, k).concat([E_TERM(row.n * k)]);
    const right = scale(row.red, k);
    return { left, right, text: eqText(left, right), type: 'reduction', row, k };
  }
  function oxidationHalf(row, k) {
    k = k || 1;
    const left = scale(row.red, k);
    const right = scale(row.ox, k).concat([E_TERM(row.n * k)]);
    return { left, right, text: eqText(left, right), type: 'oxidation', row, k };
  }
  // how the book describes the row: "row +1,36 V, copied" / "row −1,66 V, backwards"
  function rowNote(row, type) { return `row ${ev(row.E)} V, ${type === 'reduction' ? 'copied' : 'backwards'}`; }

  function merge(terms) {
    const out = [];
    for (const t of terms) {
      const f = out.find(o => o.sp === t.sp);
      if (f) f.c += t.c; else out.push({ c: t.c, sp: t.sp });
    }
    return out.filter(t => t.c > 0);
  }
  function gcd(a, b) { return b ? gcd(b, a % b) : a; }
  function lcm(a, b) { return a * b / gcd(a, b); }

  /* Net ionic equation from an oxidation row (its reducing agent reacts) and a reduction row.
     opts.first: 'ox' (default) lists the oxidation half first, 'red' lists the reduction half first,
     to match the order the coursebook uses in each worked example. Returns every step for display. */
  function netEquation(oxRow, redRow, opts) {
    opts = opts || {};
    const L = lcm(oxRow.n, redRow.n);
    const ko = L / oxRow.n, kr = L / redRow.n;
    const ox = oxidationHalf(oxRow, ko);
    const red = reductionHalf(redRow, kr);
    const halves = opts.first === 'red' ? [red, ox] : [ox, red];
    let left = merge([].concat(...halves.map(h => h.left)).filter(t => t.sp !== 'e⁻'));
    let right = merge([].concat(...halves.map(h => h.right)).filter(t => t.sp !== 'e⁻'));
    const steps = { electrons: L, ko, kr, ox, red, added: eqText(left, right), cancelled: [] };
    // H⁺ + OH⁻ on the same side make water
    for (const side of [left, right]) {
      const h = side.find(t => t.sp === 'H⁺'), oh = side.find(t => t.sp === 'OH⁻');
      if (h && oh) {
        const m = Math.min(h.c, oh.c);
        h.c -= m; oh.c -= m;
        const w = side.find(t => t.sp === 'H₂O');
        if (w) w.c += m; else side.push({ c: m, sp: 'H₂O' });
        steps.cancelled.push(`${m}H⁺ + ${m}OH⁻ → ${m}H₂O`);
      }
    }
    left = left.filter(t => t.c > 0); right = right.filter(t => t.c > 0);
    // cancel species on both sides
    for (const t of left) {
      const u = right.find(r => r.sp === t.sp);
      if (u) {
        const m = Math.min(t.c, u.c);
        t.c -= m; u.c -= m;
        steps.cancelled.push(`${m === 1 ? '' : m}${t.sp}`);
      }
    }
    left = left.filter(t => t.c > 0); right = right.filter(t => t.c > 0);
    const g = [...left, ...right].reduce((a, t) => gcd(a, t.c), 0);
    if (g > 1) { left = scale(left, 1 / g); right = scale(right, 1 / g); }
    const text = eqText(left, right);
    return Object.assign(steps, { left, right, text, check: balanceCheck(left, right) });
  }

  function balanceCheck(left, right) {
    const cnt = side => {
      const a = {}; let q = 0;
      for (const t of side) {
        if (t.sp === 'e⁻') { q -= t.c; continue; }
        const at = atoms(t.sp);
        for (const e in at) a[e] = (a[e] || 0) + at[e] * t.c;
        q += charge(t.sp) * t.c;
      }
      return { a, q };
    };
    const l = cnt(left), r = cnt(right);
    const keys = new Set([...Object.keys(l.a), ...Object.keys(r.a)]);
    let atomsOk = true;
    keys.forEach(k => { if ((l.a[k] || 0) !== (r.a[k] || 0)) atomsOk = false; });
    return { atomsOk, chargeOk: l.q === r.q, leftCharge: l.q, rightCharge: r.q, ok: atomsOk && l.q === r.q };
  }
  function chargeText(q) { return q === 0 ? '0' : (q > 0 ? '+' : MINUS) + Math.abs(q); }

  /* ---------- strength comparisons ---------- */
  // Does reducing agent ra (in row raRow) react with oxidising agent oa (in row oaRow)?
  // Electrons go downhill: the RA row must sit higher (more negative Eθ) than the OA row.
  function reacts(raRow, oaRow) { return eCellValue(oaRow, raRow) > 0; }
  function eCellValue(cathodeRow, anodeRow) { return round(cathodeRow.E - anodeRow.E, 2); }

  /* Eθcell working as the memo sets it out */
  function eCell(cathodeRow, anodeRow, opts) {
    opts = opts || {};
    const v = eCellValue(cathodeRow, anodeRow);
    const lab = opts.labels === 'agents' ? ['EθOA', 'EθRA'] : ['Eθcathode', 'Eθanode'];
    const formula = `Eθcell = ${lab[0]} ${MINUS} ${lab[1]}`;
    const substitute = `Eθcell = ${evPlain(cathodeRow.E)} ${MINUS} ${evSub(anodeRow.E)}`;
    const valueText = (opts.plus && v > 0 ? '+' : '') + evPlain(v) + ' V';
    const answer = `Eθcell = ${valueText}`;
    return { value: v, formula, substitute, answer, valueText, spontaneous: v > 0, line: `${substitute} = ${valueText}` };
  }

  /* A species is judged on its strongest row (simplest row first, as rowFor in tools-t4.js):
     Fe³⁺ is on the −0,04 V and +0,77 V rows, Fe on the −0,44 V and −0,04 V rows. */
  const strongestOA = r => rowsWithLeft(r.oa).filter(x => x.oa === r.oa).sort((a, b) => a.ox.length - b.ox.length || b.E - a.E)[0] === r;
  const strongestRA = r => rowsWithRight(r.ra).filter(x => x.ra === r.ra).sort((a, b) => a.red.length - b.red.length || a.E - b.E)[0] === r;
  /* Window finder: oxidising agents that oxidise X (reducing agent) but not Y. */
  function windowOA(xRow, yRow) {
    const lo = Math.min(xRow.E, yRow.E), hi = Math.max(xRow.E, yRow.E);
    return ROWS.filter(r => r.E > xRow.E && r.E < yRow.E && r.E > lo && r.E < hi && strongestOA(r));
  }
  /* Reducing agents that reduce X (oxidising agent) but not Y. */
  function windowRA(xRow, yRow) { return ROWS.filter(r => r.E < xRow.E && r.E > yRow.E && strongestRA(r)); }

  /* ---------- phases and cell notation ---------- */
  function isMetal(sp) { return METALS.includes(sp); }
  function phaseOf(sp) {
    if (sp === 'H₂O') return 'ℓ';
    if (sp === 'Hg') return 'ℓ';
    if (GASES.includes(sp)) return 'g';
    if (isMetal(sp) || sp === 'S' || sp === 'MnO₂') return 's';
    return 'aq';
  }
  function cond(sp, opts) {
    const ph = phaseOf(sp);
    if (!opts || !opts.states) return sp;
    if (ph === 'aq') return `${sp}(aq, ${opts.conc || '1 mol·dm⁻³'})`;
    if (ph === 'g') return `${sp}(g, 1 atm)`;
    return `${sp}(${ph})`;
  }
  // one half-cell. For the anode the reduced form comes first, for the cathode the oxidised form.
  function halfCellParts(row, role) {
    const skip = (role === 'anode' ? row.ra : row.oa) === 'H₂O' ? [] : ['H₂O'];
    const red = row.red.map(t => t.sp).filter(s => !skip.includes(s));
    const ox = row.ox.map(t => t.sp).filter(s => !skip.includes(s));
    const metal = red.find(s => isMetal(s) && s !== 'Hg');
    const electrode = metal || 'Pt';
    const order = role === 'anode' ? [red, ox] : [ox, red];
    const species = [].concat(...order).filter(s => s !== electrode);
    return { electrode, species, inert: !metal };
  }
  function joinPhases(list, opts) {
    // aqueous species share a phase (comma); a gas or solid is a separate phase (line)
    let out = '';
    list.forEach((s, i) => {
      if (i > 0) {
        const prev = list[i - 1];
        out += (phaseOf(prev) === 'aq' && phaseOf(s) === 'aq') ? ', ' : ' | ';
      }
      out += cond(s, opts);
    });
    return out;
  }
  function cellNotation(anodeRow, cathodeRow, opts) {
    opts = opts || {};
    const a = halfCellParts(anodeRow, 'anode'), c = halfCellParts(cathodeRow, 'cathode');
    const el = s => opts.states ? `${s}(s)` : s;
    const left = `${el(a.electrode)} | ${joinPhases(a.species, opts)}`;
    const right = `${joinPhases(c.species, opts)} | ${el(c.electrode)}`;
    let text = `${left} || ${right}`;
    if (opts.states && opts.temp) text += ' at 25 °C';
    return { text, anode: a, cathode: c, needsPt: a.inert || c.inert };
  }
  // Common notation errors the workshop names (memo words)
  function checkNotation(attempt, anodeRow, cathodeRow) {
    const correct = cellNotation(anodeRow, cathodeRow).text;
    // protect the salt bridge '||' before single lines are spaced (two separate '|' tiles stay two lines)
    const norm = s => s.replace(/\s+/g, ' ').replace(/\s*\|\|\s*/g, '\u0000').replace(/\s*\|\s*/g, ' | ').replace(/\u0000/g, ' || ').replace(/\s*,\s*/g, ', ').trim();
    const a = norm(attempt), c = norm(correct);
    const issues = [];
    if (a === c) return { ok: true, issues, correct };
    if (/(^|[\s|,])\d+[A-Z]/.test(a)) issues.push('coefficients: cell notation has no coefficients, even when the balanced equation needs them');
    // Pt is checked half-cell by half-cell, so a Pt on the wrong side is named
    const ptSides = s => s.split('||').map(x => (x.match(/Pt/g) || []).length);
    const sideName = l => l.length === 2 ? 'both half-cells' : l[0] ? 'the cathode half-cell (right)' : 'the anode half-cell (left)';
    if (a.includes('||') && ptSides(a).length === 2) {
      const cs = ptSides(correct), as = ptSides(a), miss = [0, 1].filter(i => as[i] < cs[i]), extra = [0, 1].filter(i => as[i] > cs[i]);
      if (miss.length) issues.push(`missing Pt in ${sideName(miss)}: a half-cell with no solid conductor needs an inert platinum electrode on the outside`);
      extra.forEach(i => issues.push(cs[i] === 0 ? `extra Pt in ${sideName([i])}: this half-cell has a metal electrode, so it needs no Pt. Pt is only for a half-cell with no solid conductor` : `extra Pt in ${sideName([i])}: one inert electrode per half-cell, on the outside`));
    } else {
      const pt = (correct.match(/Pt/g) || []).length, ptA = (a.match(/Pt/g) || []).length;
      if (ptA < pt) issues.push('missing Pt: a half-cell with no solid conductor needs an inert platinum electrode on the outside');
      if (ptA > pt) issues.push('extra Pt: Pt is only for a half-cell with no solid conductor');
    }
    if (!a.includes('||')) issues.push('salt bridge: show it with a double line ||');
    const [aL] = a.split(' || ');
    const [cL] = c.split(' || ');
    // the cathode half-cell written as if it were the anode (the whole cell backwards), or the two halves swapped as written
    const backwards = norm(cellNotation(cathodeRow, anodeRow).text);
    if (a === backwards || (aL && cL && aL !== cL && a.split(' || ').reverse().join(' || ') === c)) issues.push('sides swapped: the anode goes on the left');
    if (/[⇌↔]/.test(a)) issues.push('arrows do not belong in cell notation');
    if (!issues.length) issues.push('check the order inside each half-cell and the comma (same phase) or line (phase boundary)');
    return { ok: false, issues, correct };
  }

  /* ---------- reagent translator (T4) ---------- */
  const REAGENTS = {
    'acidified potassium permanganate': { formula: 'KMnO₄ + H₂SO₄', species: ['MnO₄⁻', 'H⁺'], spectators: ['K⁺', 'SO₄²⁻'], row: 'MnO₄⁻+H⁺/Mn²⁺+H₂O', role: 'OA' },
    'acidified potassium dichromate': { formula: 'K₂Cr₂O₇ + H₂SO₄', species: ['Cr₂O₇²⁻', 'H⁺'], spectators: ['K⁺', 'SO₄²⁻'], row: 'Cr₂O₇²⁻+H⁺/Cr³⁺+H₂O', role: 'OA' },
    'potassium bromide': { formula: 'KBr', species: ['Br⁻'], spectators: ['K⁺'], row: 'Br₂/Br⁻', role: 'RA' },
    'potassium iodide': { formula: 'KI', species: ['I⁻'], spectators: ['K⁺'], row: 'I₂/I⁻', role: 'RA' },
    'sodium chloride': { formula: 'NaCℓ', species: ['Cℓ⁻'], spectators: ['Na⁺'], row: 'Cℓ₂/Cℓ⁻', role: 'RA' },
    'chlorine water': { formula: 'Cℓ₂(aq)', species: ['Cℓ₂'], spectators: [], row: 'Cℓ₂/Cℓ⁻', role: 'OA' },
    'bromine water': { formula: 'Br₂(aq)', species: ['Br₂'], spectators: [], row: 'Br₂/Br⁻', role: 'OA' },
    'copper(II) sulfate': { formula: 'CuSO₄', species: ['Cu²⁺'], spectators: ['SO₄²⁻'], row: 'Cu²⁺/Cu', role: 'OA' },
    'silver nitrate': { formula: 'AgNO₃', species: ['Ag⁺'], spectators: ['NO₃⁻'], row: 'Ag⁺/Ag', role: 'OA' },
    'iron(II) sulfate': { formula: 'FeSO₄', species: ['Fe²⁺'], spectators: ['SO₄²⁻'], row: 'Fe³⁺/Fe²⁺', role: 'RA' },
    'iron(III) chloride': { formula: 'FeCℓ₃', species: ['Fe³⁺'], spectators: ['Cℓ⁻'], row: 'Fe³⁺/Fe²⁺', role: 'OA' },
    'zinc sulfate': { formula: 'ZnSO₄', species: ['Zn²⁺'], spectators: ['SO₄²⁻'], row: 'Zn²⁺/Zn', role: 'OA' },
    'nickel(II) nitrate': { formula: 'Ni(NO₃)₂', species: ['Ni²⁺'], spectators: ['NO₃⁻'], row: 'Ni²⁺/Ni', role: 'OA' },
    'dilute hydrochloric acid': { formula: 'HCℓ', species: ['H⁺'], spectators: ['Cℓ⁻'], row: 'H⁺/H₂', role: 'OA' },
    'dilute sulfuric acid': { formula: 'H₂SO₄', species: ['H⁺'], spectators: ['SO₄²⁻'], row: 'H⁺/H₂', role: 'OA' },
    'concentrated nitric acid': { formula: 'HNO₃', species: ['NO₃⁻', 'H⁺'], spectators: [], row: 'NO₃⁻+H⁺/NO₂+H₂O', role: 'OA', note: 'NO₃⁻ is NOT a spectator here: it is the oxidising agent. Concentrated acid gives brown NO₂.' },
    'dilute nitric acid': { formula: 'HNO₃', species: ['NO₃⁻', 'H⁺'], spectators: [], row: 'NO₃⁻+H⁺/NO+H₂O', role: 'OA', note: 'NO₃⁻ is NOT a spectator here: it is the oxidising agent. Dilute acid gives colourless NO.' },
    'hydrogen peroxide (acidified)': { formula: 'H₂O₂ + H⁺', species: ['H₂O₂', 'H⁺'], spectators: [], row: 'H₂O₂+H⁺/H₂O', role: 'OA' }
  };

  /* ---------- electrolysis ---------- */
  const WATER_RED = () => rowByKey('H₂O/H₂+OH⁻');     // −0,83 V
  const WATER_OX = () => rowByKey('O₂+H⁺/H₂O');       // +1,23 V
  // Electrolytes in the coursebook's products table plus the worked examples
  const ELECTROLYTES = {
    'CuCℓ2-conc': { label: 'CuCℓ₂(aq), concentrated', cations: ['Cu²⁺'], anions: ['Cℓ⁻'], aqueous: true, concentrated: true },
    'CuCℓ2-dil': { label: 'CuCℓ₂(aq), dilute', cations: ['Cu²⁺'], anions: ['Cℓ⁻'], aqueous: true, concentrated: false },
    'CuSO4': { label: 'CuSO₄(aq)', cations: ['Cu²⁺'], anions: ['SO₄²⁻'], aqueous: true },
    'NaCℓ-conc': { label: 'NaCℓ(aq), concentrated (brine)', cations: ['Na⁺'], anions: ['Cℓ⁻'], aqueous: true, concentrated: true },
    'NaCℓ-dil': { label: 'NaCℓ(aq), dilute', cations: ['Na⁺'], anions: ['Cℓ⁻'], aqueous: true, concentrated: false },
    'KI': { label: 'KI(aq)', cations: ['K⁺'], anions: ['I⁻'], aqueous: true },
    'KBr': { label: 'KBr(aq)', cations: ['K⁺'], anions: ['Br⁻'], aqueous: true },
    'Na2SO4': { label: 'Na₂SO₄(aq)', cations: ['Na⁺'], anions: ['SO₄²⁻'], aqueous: true },
    'K2SO4': { label: 'K₂SO₄(aq)', cations: ['K⁺'], anions: ['SO₄²⁻'], aqueous: true },
    'H2SO4': { label: 'H₂SO₄(aq), dilute', cations: ['H⁺'], anions: ['SO₄²⁻'], aqueous: true },
    'AgNO3': { label: 'AgNO₃(aq)', cations: ['Ag⁺'], anions: ['NO₃⁻'], aqueous: true },
    'ZnSO4': { label: 'ZnSO₄(aq)', cations: ['Zn²⁺'], anions: ['SO₄²⁻'], aqueous: true },
    'NiSO4': { label: 'NiSO₄(aq)', cations: ['Ni²⁺'], anions: ['SO₄²⁻'], aqueous: true },
    'AℓCℓ3': { label: 'AℓCℓ₃(aq)', cations: ['Aℓ³⁺'], anions: ['Cℓ⁻'], aqueous: true, concentrated: false },
    'MgCℓ2-aq': { label: 'MgCℓ₂(aq), concentrated', cations: ['Mg²⁺'], anions: ['Cℓ⁻'], aqueous: true, concentrated: true },
    'MgCℓ2-aq-dil': { label: 'MgCℓ₂(aq), dilute', cations: ['Mg²⁺'], anions: ['Cℓ⁻'], aqueous: true, concentrated: false },
    'NaCℓ-molten': { label: 'molten NaCℓ', cations: ['Na⁺'], anions: ['Cℓ⁻'], aqueous: false },
    'PbBr2-molten': { label: 'molten PbBr₂', cations: ['Pb²⁺'], anions: ['Br⁻'], aqueous: false },
    'MgCℓ2-molten': { label: 'molten MgCℓ₂', cations: ['Mg²⁺'], anions: ['Cℓ⁻'], aqueous: false }
  };
  const INERT = ['graphite', 'Pt', 'Ti'];

  /* Predict both electrode products.
     e: electrolyte key or object; opts.anode: 'graphite' | 'Pt' | metal symbol (active anode); opts.concentrated overrides.
     Returns the two contests (every candidate with its row), the winners, half-reactions, net equation, Eθcell. */
  function electrolysis(e, opts) {
    opts = opts || {};
    const el = typeof e === 'string' ? ELECTROLYTES[e] : e;
    const conc = opts.concentrated !== undefined ? opts.concentrated : !!el.concentrated;
    const anodeMat = opts.anode || 'graphite';
    // Cathode contest: the strongest oxidising agent present is reduced (highest Eθ)
    const cath = [];
    el.cations.forEach(sp => {
      const r = rowsWithLeft(sp).filter(r => r.ox.length === 1)
        .sort((a, b) => a.red.length - b.red.length || b.E - a.E)[0];
      if (r) cath.push({ sp, row: r, why: sp });
    });
    if (el.aqueous) cath.push({ sp: 'H₂O', row: WATER_RED(), why: 'water' });
    cath.sort((a, b) => b.row.E - a.row.E);
    let cWin = cath[0];
    // Anode contest: the strongest reducing agent present is oxidised (lowest Eθ, as a right-hand species)
    const an = [];
    if (!INERT.includes(anodeMat)) {
      const r = rowsWithRight(anodeMat).filter(r => r.red.length === 1).sort((a, b) => a.E - b.E)[0];
      if (r) an.push({ sp: anodeMat, row: r, why: 'active anode' });
    }
    el.anions.forEach(sp => {
      const r = rowsWithRight(sp)[0];
      if (r) an.push({ sp, row: r, why: sp });
      else an.push({ sp, row: null, why: 'cannot be oxidised (not on the right of Table 4)' });
    });
    if (el.aqueous) an.push({ sp: 'H₂O', row: WATER_OX(), why: 'water' });
    const ranked = an.filter(c => c.row).sort((a, b) => a.row.E - b.row.E);
    let aWin = ranked[0];
    let concNote = null;
    // the concentrated-chloride case: high [Cℓ⁻] makes the oxidation of Cℓ⁻ predominant
    const cl = an.find(c => c.sp === 'Cℓ⁻');
    if (cl && el.aqueous && aWin && aWin.sp === 'H₂O' && conc) {
      aWin = cl;
      concNote = 'Under standard conditions water (+1,23 V) is a slightly stronger reducing agent than Cℓ⁻ (+1,36 V); in a concentrated solution the high [Cℓ⁻] makes the oxidation of Cℓ⁻ predominant.';
    }
    const cHalf = reductionHalf(cWin.row);
    const aHalf = oxidationHalf(aWin.row);
    const net = netEquation(aWin.row, cWin.row, { first: 'red' });
    const cell = eCell(cWin.row, aWin.row);
    const products = {
      cathode: cWin.row.red.map(t => t.sp),
      anode: aWin.row.ox.map(t => t.sp)
    };
    return {
      electrolyte: el, concentrated: conc, anodeMaterial: anodeMat,
      cathodeContest: cath, anodeContest: an, cathode: cWin, anode: aWin,
      cathodeHalf: cHalf, anodeHalf: aHalf, net, eCell: cell, products, concNote,
      spectators: [...el.cations, ...el.anions].filter(s => s !== cWin.sp && s !== aWin.sp)
    };
  }

  /* Electrorefining: which impurity metals are oxidised at the anode, and which fall to the sludge.
     Compare REDUCING agents at the anode (the metals); compare OXIDISING agents at the cathode (the ions). */
  function refine(metal, impurities) {
    const mRow = rowsWithRight(metal).filter(r => r.red.length === 1).sort((a, b) => a.E - b.E)[0];
    const res = { metal, row: mRow, oxidised: [], sludge: [], depositedOnly: metal };
    impurities.forEach(x => {
      const r = rowsWithRight(x).filter(r => r.red.length === 1).sort((a, b) => a.E - b.E)[0];
      const item = { metal: x, row: r, ion: r.oa };
      if (r.E < mRow.E) { item.why = `${x} is a stronger reducing agent than ${metal}, so ${x} is oxidised and ${r.oa} goes into the electrolyte`; res.oxidised.push(item); }
      else { item.why = `${x} is a weaker reducing agent than ${metal}, so ${x} is not oxidised and falls to the anode sludge`; res.sludge.push(item); }
    });
    res.cathodeWhy = `${mRow.oa} is a stronger oxidising agent than ${res.oxidised.map(i => i.ion).join(' and ') || 'the other ions'}, so only ${mRow.oa} is reduced at the cathode`;
    res.concentration = res.oxidised.length ? 'decreases' : 'stays the same';
    return res;
  }

  /* ---------- Faraday chain ---------- */
  // carry values to 6 significant figures, as the coursebooks do
  const C6 = x => sig(x, 6);
  /* From a half-reaction ratio: ratio = moles of electrons per mole of substance (e.g. Cu²⁺ + 2e⁻ → Cu: 2) */
  function faradayFromCharge(p) {
    // p: {I, t} or {q}; ratio; M or gas:true
    const lines = [];
    let q = p.q;
    if (q === undefined) { q = C6(p.I * p.t); lines.push(`q = It = (${num(p.I)})(${num(p.t)}) = ${q >= 1e7 ? sci(q, 6) : num(q)} C`); }
    const ne = C6(q / F);
    lines.push(`n(e⁻) = q/F = ${q >= 1e7 ? sci(q, 6) : num(q)} / 96 500 = ${numSig(ne, 6)} mol`);
    const n = C6(ne / p.ratio);
    lines.push(`n = ${p.ratio === 1 ? '' : '1/' + p.ratio + ' × '}n(e⁻) = ${numSig(n, 6)} mol`);
    const out = { q, ne, n, lines };
    if (p.M) { out.m = round(n * p.M, 2); lines.push(`m = nM = (${numSig(n, 6)})(${num(p.M)}) = ${num(out.m, 2)} g`); }
    if (p.gas) { out.V = round(n * VM, 2); lines.push(`V = nVm = (${numSig(n, 6)})(22,4) = ${num(out.V, 2)} dm³`); }
    return out;
  }
  function faradayFromMass(p) {
    // p: {m, M, ratio, I?}
    const lines = [];
    const n = C6(p.m / p.M);
    lines.push(`n = m/M = ${num(p.m)} / ${num(p.M)} = ${numSig(n, 6)} mol`);
    const ne = C6(n * p.ratio);
    lines.push(`n(e⁻) = ${p.ratio === 1 ? '' : p.ratio}n = ${p.ratio === 1 ? '' : p.ratio + ' × '}${numSig(n, 6)} = ${numSig(ne, 6)} mol`);
    const q = ne * F;
    lines.push(`q = nF = (${numSig(ne, 6)})(96 500) = ${num(q, 2)} C`);
    const out = { n, ne, q, lines };
    if (p.I) { out.t = round(q / p.I, 2); lines.push(`t = q/I = ${num(q, 2)} / ${num(p.I)} = ${num(out.t, 2)} s`); }
    return out;
  }

  /* ---------- the public interface ---------- */
  return {
    F, VM, AR, ROWS, NAMES, COLOURS, REAGENTS, ELECTROLYTES, TWO_JOBS, METALS,
    charge, atoms, molarMass, molarMassWorking, pretty, sub, sup,
    num, numSig, sig, round, ev, evSub, evPlain, sci, chargeText,
    rowByE, rowByKey, rowsWithLeft, rowsWithRight, findHalf, jobsOf,
    reductionHalf, oxidationHalf, rowNote, netEquation, balanceCheck, eqText, sideText,
    reacts, eCell, eCellValue, windowOA, windowRA,
    phaseOf, isMetal, cellNotation, checkNotation, halfCellParts,
    electrolysis, refine, faradayFromCharge, faradayFromMass
  };
});
