/* Live Table 4 (T1 T2 T4 T5 T6), the emf ruler (T3), the half-reaction builder (A3) and the electron balancer (A4). */
(function () {
  'use strict';
  const EC = window.EC, S = window.STUDIO;
  const { h, add, clear, chem, seg, select, stepLine, notice, readNum, close, shuffle, pick, logAttempt } = S;
  const ROWS = EC.ROWS;

  /* ---------- shared Table 4 helpers ---------- */
  function rowFor(sp, side) {
    if (side === 'ra') {
      const rs = EC.rowsWithRight(sp);
      return rs.sort((a, b) => a.red.length - b.red.length || a.E - b.E)[0];
    }
    const rs = EC.rowsWithLeft(sp);
    return rs.sort((a, b) => a.ox.length - b.ox.length || b.E - a.E)[0];
  }
  S.rowFor = rowFor;
  const nm = sp => EC.NAMES[sp] || sp;
  const eTxt = r => EC.ev(r.E) + ' V';

  // memo-style sentence about relative strengths (WE 27.5, 27.6)
  function memoSentence(raRow, oaRow) {
    const oa = oaRow.oa, otherOA = raRow.oa, ra = raRow.ra, prod = raRow.oa;
    if (Math.abs(oaRow.E - raRow.E) < 1e-9 && raRow !== oaRow) // two rows with the same Eθ (Ag⁺ and NO₃⁻ at +0,80 V)
      return `${oa} (${EC.ev(oaRow.E)} V) and ${otherOA} (${EC.ev(raRow.E)} V) are equally strong oxidising agents, so ${oa} cannot oxidise ${ra} to ${prod} under standard conditions.`;
    // the same oxidising agent on both rows (Fe³⁺, O₂, NO₃⁻): compare the two reducing agents, never a species with itself
    if (oa === otherOA) {
      return EC.reacts(raRow, oaRow) ? `${ra} (${EC.ev(raRow.E)} V) is a stronger reducing agent than ${oaRow.ra} (${EC.ev(oaRow.E)} V), so ${ra} reduces ${oa} to ${oaRow.ra}.`
        : `${ra} (${EC.ev(raRow.E)} V) is a weaker reducing agent than ${oaRow.ra} (${EC.ev(oaRow.E)} V), so ${ra} cannot reduce ${oa} to ${oaRow.ra}: no reaction.`;
    }
    if (EC.reacts(raRow, oaRow)) {
      return `${oa} (${EC.ev(oaRow.E)} V) is a stronger oxidising agent than ${otherOA} (${EC.ev(raRow.E)} V), so ${oa} oxidises ${ra} to ${prod}.`;
    }
    return `${oa} (${EC.ev(oaRow.E)} V) is a weaker oxidising agent than ${otherOA} (${EC.ev(raRow.E)} V), so ${oa} cannot oxidise ${ra} to ${prod}: no reaction.`;
  }
  S.memoSentence = memoSentence;

  /* distractors for a net equation, built from the real traps */
  function netOptions(raRow, oaRow) {
    const net = EC.netEquation(raRow, oaRow);
    const opts = [{ t: net.text, ok: true, why: 'Electrons lost = electrons gained, the species on both sides are cancelled, and the arrow is single.' }];
    const ox = EC.oxidationHalf(raRow), red = EC.reductionHalf(oaRow);
    if (net.ko !== 1 || net.kr !== 1) {
      const L = [...ox.left, ...red.left.filter(t => t.sp !== 'e⁻')], R = [...ox.right.filter(t => t.sp !== 'e⁻'), ...red.right];
      opts.push({ t: EC.eqText(L, R), why: 'The electrons are not balanced: electrons lost must equal electrons gained.' });
    }
    if (net.cancelled.length) opts.push({ t: net.added, why: 'Species on both sides have not been cancelled.' });
    opts.push({ t: EC.eqText(net.right, net.left), why: 'This is the reverse reaction: the reducing agent and oxidising agent must be the reactants.' });
    opts.push({ t: net.text.replace('→', '⇌'), why: 'Use a single arrow: the memo penalises a double arrow.' });
    const seen = new Set();
    return shuffle(opts.filter(o => (seen.has(o.t) ? false : seen.add(o.t))).slice(0, 4));
  }
  S.netOptions = netOptions;

  /* ---------- the table ---------- */
  function table4(state, onTap, opts) {
    opts = opts || {};
    const tbl = h('table', { class: 't4', 'aria-label': 'Table 4: standard electrode potentials' });
    tbl.appendChild(h('thead', null, h('tr', null,
      h('th', { class: 'small', style: { width: '26px' } }, ''),
      h('th', { class: 'small k-red', style: { textAlign: 'right', padding: '6px 8px', fontFamily: 'var(--font)' } }, 'oxidising agent side'),
      h('th', null, ''),
      h('th', { class: 'small k-ox', style: { textAlign: 'left', padding: '6px 8px', fontFamily: 'var(--font)' } }, 'reducing agent side'),
      h('th', { class: 'small', style: { textAlign: 'right', paddingRight: '10px', fontFamily: 'var(--font)' } }, 'Eθ (V)'))));
    const tb = h('tbody');
    const a = state.ra, b = state.oa;
    const lo = (a !== null && b !== null) ? Math.min(a, b) : -1, hi = (a !== null && b !== null) ? Math.max(a, b) : -1;
    const down = a !== null && b !== null && a < b;
    ROWS.forEach((r, i) => {
      const tr = h('tr', { class: [state.oa === i ? 'selOA' : '', state.ra === i ? 'selRA' : '', state.win && state.win.includes(i) ? 'win' : '', state.dim && !state.dim.includes(i) ? 'dim' : ''].join(' ') });
      const arr = h('td', { class: 'arr' });
      if (lo >= 0 && lo !== hi && Math.abs(ROWS[lo].E - ROWS[hi].E) > 1e-9 && i >= lo && i <= hi) {
        const bad = !down;
        const segEl = h('span', { class: 'arrseg' + (i === lo ? ' start' : '') + (i === hi ? ' end' : '') + (bad ? ' bad' : '') });
        arr.appendChild(segEl);
        if (down && i === hi) arr.appendChild(h('span', { class: 'arrhead down' }));
        if (!down && i === lo) arr.appendChild(h('span', { class: 'arrhead up bad' }));
        if (i === lo && down) arr.appendChild(h('span', { class: 'elab' }, 'e⁻'));
      }
      const two = opts.twoJobs ? EC.TWO_JOBS : [];
      // outline only the agent itself, not a species that only balances the row (O₂ + 2H₂O, NO₂ + H₂O)
      const lHas = two.includes(r.oa), rHas = two.includes(r.ra);
      const lb = h('button', { class: 'side' + (lHas ? ' two' : ''), type: 'button', 'aria-label': `${r.leftText}, Eθ ${EC.ev(r.E)} V: choose as oxidising agent`, onclick: () => onTap(i, 'oa') }, r.leftText);
      const rb = h('button', { class: 'side' + (rHas ? ' two' : ''), type: 'button', 'aria-label': `${r.rightText}, Eθ ${EC.ev(r.E)} V: choose as reducing agent`, onclick: () => onTap(i, 'ra') }, r.rightText);
      add(tr, [arr, h('td', { class: 'l' }, lb), h('td', { class: 'eq' }, '⇌'), h('td', { class: 'r' }, rb), h('td', { class: 'E' }, EC.ev(r.E))]);
      tb.appendChild(tr);
    });
    tbl.appendChild(tb);
    return h('div', { class: 't4wrap' }, tbl,
      h('div', { class: 'small muted', style: { padding: '8px 10px', borderTop: '1px solid var(--line)' } },
        h('span', { class: 'k-red' }, 'Strongest oxidising agent: F₂ (bottom left). '), h('span', { class: 'k-ox' }, 'Strongest reducing agent: Li (top right). '),
        'As on the IEB 2025 data sheet: most negative Eθ at the top.'));
  }
  S.table4 = table4;

  /* ---------- T1/T2: pair and build ---------- */
  S.tools.table4 = {
    id: 'table4', mod: 27, section: '27.2', title: 'Live Table 4 · pair and build',
    blurb: 'Tap a reducing agent (right, blue) and an oxidising agent (left, red). The studio builds both half-reactions, the net equation, the cell notation and Eθcell.',
    render(el, params) {
      const st = { ra: null, oa: null, mode: params.mode || 'pair', predict: params.predict === '1', win: null, dim: null, task: null, reagent: null, jobs: null };
      if (params.ra) { const r = rowFor(params.ra, 'ra'); if (r) st.ra = r.i; }
      if (params.oa) { const r = rowFor(params.oa, 'oa'); if (r) st.oa = r.i; }
      const left = h('div'), right = h('div');
      const bar = h('div', { class: 'row', style: { marginBottom: '12px' } });
      add(el, [S.legend(), bar, h('div', { class: 'split sticky' }, left, right)]);
      function drawBar(...a) { return S.keepFocus(el, () => drawBar0(...a)); } // keep keyboard focus on the control that was used
      function drawBar0() {
        clear(bar);
        add(bar, [
          seg([['pair', 'Pair and build'], ['window', 'Window finder'], ['reagent', 'Reagent translator'], ['jobs', 'Two jobs']], st.mode, v => { st.mode = v; st.win = null; st.dim = null; st.task = null; st.jobs = null; st.reagent = null; if (v === 'window') newWindow(); draw(); }),
          st.mode === 'pair' ? seg([['explore', 'Explore'], ['predict', 'Predict']], st.predict ? 'predict' : 'explore', v => { st.predict = v === 'predict'; draw(); }) : null,
          h('button', { class: 'btn ghost small', type: 'button', onclick: () => { st.ra = st.oa = null; st.win = st.dim = null; st.jobs = null; st.task = null; draw(); } }, 'Clear')
        ]);
      }
      function tap(i, side) {
        if (st.mode === 'window') return windowTap(i, side);
        if (st.mode === 'jobs') { st.jobs = { i, side }; draw(); return; }
        if (side === 'ra') st.ra = st.ra === i ? null : i; else st.oa = st.oa === i ? null : i;
        if (st.mode === 'reagent') st.mode = 'pair';
        draw();
        if (st.ra !== null && st.oa !== null && window.innerWidth < 861) right.scrollIntoView({ behavior: S.reduced() ? 'auto' : 'smooth', block: 'start' });
      }
      function prepare() {
        if (st.mode === 'reagent' && !st.reagent) {
          st.reagent = Object.keys(EC.REAGENTS)[0];
          const RR = EC.REAGENTS[st.reagent], rr = EC.rowByKey(RR.row); st.ra = st.oa = null; if (RR.role === 'OA') st.oa = rr.i; else st.ra = rr.i;
        }
        st.dim = null;
        if (st.mode === 'window' && !st.task) newWindow();
        if (st.mode === 'jobs' && st.jobs) {
          const r = ROWS[st.jobs.i];
          const sp0 = st.jobs.side === 'oa' ? r.oa : r.ra, sp = EC.TWO_JOBS.includes(sp0) ? sp0 : null;
          if (sp) { const j = EC.jobsOf(sp); st.dim = [j.asOA.filter(x => x.ox.some(t => t.sp === sp))[0].i, j.asRA[0].i]; }
        }
      }
      function draw(...a) { return S.keepFocus(el, () => draw0(...a)); } // keep keyboard focus on the control that was used
      function draw0() {
        prepare();
        drawBar();
        clear(left).appendChild(table4(st, tap, { twoJobs: st.mode === 'jobs' }));
        clear(right);
        if (st.mode === 'pair') right.appendChild(pairPanel(st, draw));
        if (st.mode === 'window') right.appendChild(windowPanel());
        if (st.mode === 'reagent') right.appendChild(reagentPanel());
        if (st.mode === 'jobs') right.appendChild(jobsPanel());
      }

      /* T5 window finder */
      const WINDOWS = [['Fe', 'Ni', ['Ag⁺', 'Cd²⁺', 'Zn²⁺', 'Cu²⁺'], '27.7'], ['Zn', 'Sn', ['Mg²⁺', 'Co', 'Br₂', 'Cd²⁺'], 'May 2026 Q1.6'], ['Fe', 'Cu', ['Pb²⁺', 'Zn²⁺', 'Ag⁺', 'Mg²⁺'], ''], ['Mg', 'Zn', ['Aℓ³⁺', 'Na⁺', 'Cu²⁺', 'Ag⁺'], ''], ['Cu', 'Ag', ['Fe³⁺', 'Zn²⁺', 'Cℓ₂', 'Ni²⁺'], ''], ['I⁻', 'Br⁻', ['Fe³⁺', 'Cu²⁺', 'Cℓ₂', 'Zn²⁺'], '']];
      function newWindow() {
        const [x, y, cands, src] = st.task && st.task.fixed ? st.task.fixed : pick(WINDOWS);
        const xr = rowFor(x, 'ra'), yr = rowFor(y, 'ra');
        st.task = { x, y, xr, yr, cands, src, answered: null, logged: false };
        st.win = ROWS.filter(r => r.E > xr.E && r.E < yr.E).map(r => r.i);
        st.dim = null; st.ra = null; st.oa = null;
      }
      function windowTap(i, side) {
        if (!st.task) newWindow();
        const t = st.task, logOnce = ok => { if (!t.logged) { t.logged = true; logAttempt({ kind: 'supported', section: '27.3', id: 'window', correct: ok ? 1 : 0, total: 1 }); } };
        if (side !== 'oa') { t.answered = { i, wrongSide: true }; logOnce(false); draw(); return; }
        t.answered = { i }; st.oa = t.cands.includes(ROWS[i].oa) ? rowFor(ROWS[i].oa, 'oa').i : i;   // a choice is lit on its strongest row
        const r = t.cands.includes(ROWS[i].oa) ? rowFor(ROWS[i].oa, 'oa') : ROWS[i];
        logOnce(t.cands.includes(r.oa) && r.E > t.xr.E && r.E < t.yr.E);
        draw();
      }
      function windowPanel() {
        if (!st.task || !st.task.xr) { newWindow(); }
        const t = st.task;
        const box = h('div', { class: 'card' });
        add(box, [h('h3', null, `Oxidise ${t.x}, but not ${t.y}`),
          h('p', null, `Which of these will oxidise ${t.x} to ${t.xr.oa} but not ${t.y} to ${t.yr.oa} under standard conditions: `, chem(t.cands.join(', ')), '? Tap your answer on the LEFT side of the table.'),
          t.src ? h('p', { class: 'small muted' }, 'From ' + (t.src.startsWith('May') ? 'IEB NSC ' + t.src + ' (our answer: no official memo yet)' : 'Worked example ' + t.src) + '.') : null]);
        const a = t.answered;
        if (a) {
          if (a.wrongSide) box.appendChild(notice('no', 'You tapped the reducing agent side. The species that oxidises something is an oxidising agent: it is on the LEFT.'));
          else {
            // judge a choice on its strongest row (lowest on the left): Fe³⁺ is on the −0,04 V and the +0,77 V rows
            const tapped = ROWS[a.i], cand = t.cands.includes(tapped.oa), r = cand ? rowFor(tapped.oa, 'oa') : tapped;
            const ok = cand && r.E > t.xr.E && r.E < t.yr.E, inWin = r.E > t.xr.E && r.E < t.yr.E;
            const also = r !== tapped ? ` You tapped the ${eTxt(tapped)} row: ${r.oa} is also on the ${eTxt(r)} row, lower on the left, where it is a stronger oxidising agent.` : '';
            box.appendChild(notice(ok ? 'ok' : 'no', (ok ? `Yes: ${r.oa} (${eTxt(r)}) lies between the two rows.` :
              !t.cands.includes(r.oa) ? `${r.oa} is not one of the four choices. Look for a choice inside the shaded window.` :
                r.E <= t.xr.E ? `${r.oa} (${eTxt(r)}) is too weak: it is a weaker oxidising agent than ${t.xr.oa} (${eTxt(t.xr)}), so it cannot oxidise ${t.x}.` :
                  `${r.oa} (${eTxt(r)}) is too strong: it is a stronger oxidising agent than ${t.yr.oa} (${eTxt(t.yr)}), so it would oxidise ${t.y} as well.`) + also));
            if (ok || !inWin) box.appendChild(h('div', { class: 'callout' }, h('h4', null, 'Window'),
              `The oxidising agent must be stronger than ${t.xr.oa} (${eTxt(t.xr)}) but weaker than ${t.yr.oa} (${eTxt(t.yr)}). Draw the two reducing agents’ rows, then look for an oxidising agent between them.`));
          }
        }
        box.appendChild(h('div', { class: 'row', style: { marginTop: '10px' } }, h('button', { class: 'btn ghost', type: 'button', onclick: () => { st.task = null; newWindow(); draw(); } }, 'New window question')));
        return box;
      }

      /* T4 reagent translator */
      function reagentPanel() {
        const box = h('div', { class: 'card' });
        const keys = Object.keys(EC.REAGENTS);
        const cur = st.reagent || keys[0];
        const R = EC.REAGENTS[cur];
        const row = EC.rowByKey(R.row);
        add(box, [h('h3', null, 'Reagent translator'),
          h('p', { class: 'muted small' }, 'Questions name reagents; Table 4 lists the species. Before you look up anything, write the solution as its ions.'),
          select(keys.map(k => [k, k]), cur, v => { st.reagent = v; const RR = EC.REAGENTS[v], rr = EC.rowByKey(RR.row); st.ra = st.oa = null; if (RR.role === 'OA') st.oa = rr.i; else st.ra = rr.i; draw(); }, { 'aria-label': 'Reagent' }),
          h('div', { class: 'steps', style: { marginTop: '10px' } },
            stepLine('', 'Made from', chem(R.formula)),
            stepLine(R.role === 'OA' ? 'red' : 'ox', 'Species that reacts', chem(R.species.join(' and ')), R.role === 'OA' ? 'oxidising agent: on the left of the row' : 'reducing agent: on the right of the row'),
            stepLine('', 'Spectator ions', R.spectators.length ? chem(R.spectators.join(', ')) : 'none', R.spectators.length ? 'They are there before and after, unchanged: nothing in this mixture is strong enough to react with them, so they take no part in the electron transfer.' : null),
            stepLine(R.role === 'OA' ? 'red' : 'ox', 'Its row in Table 4', chem(row.leftText + ' ⇌ ' + row.rightText), EC.ev(row.E) + ' V')),
          R.note ? notice('', R.note) : null,
          cur === 'potassium bromide' ? h('div', { class: 'callout ex' }, h('h4', null, 'Examiner says · IEB 2025 P2 Q6.1'), '“More than half the candidates chose potassium as the reducing agent, although KBr does not contain any potassium atoms, only potassium ions.”') : null,
          h('div', { class: 'row', style: { marginTop: '10px' } }, h('button', { class: 'btn', type: 'button', onclick: () => { st.mode = 'pair'; draw(); } }, 'Now pair it with a partner →'))]);
        return box;
      }

      /* T6 species with two jobs */
      function jobsPanel() {
        const box = h('div', { class: 'card' });
        add(box, [h('h3', null, 'Species with two jobs'), h('p', { class: 'muted' }, 'The outlined species appear on both sides of Table 4. Tap one to see both rows. The partner decides which job it does.')]);
        if (!st.jobs) { box.appendChild(h('div', { class: 'tiles' }, EC.TWO_JOBS.map(sp => h('span', { class: 'pill' }, sp)))); return box; }
        const r = ROWS[st.jobs.i];
        const sp0 = st.jobs.side === 'oa' ? r.oa : r.ra, terms = EC.TWO_JOBS.includes(sp0) ? [sp0] : [];
        if (!terms.length) { box.appendChild(notice('', 'This species has only one job. Tap an outlined species.')); return box; }
        const sp = terms[0];
        const j = EC.jobsOf(sp);
        const asOA = j.asOA.filter(x => x.ox.some(t => t.sp === sp))[0], asRA = j.asRA[0];
        add(box, [
          h('div', { class: 'steps' },
            stepLine('red', sp + ' as an oxidising agent (it is reduced)', chem(EC.reductionHalf(asOA).text), 'row ' + eTxt(asOA)),
            stepLine('ox', sp + ' as a reducing agent (it is oxidised)', chem(EC.oxidationHalf(asRA).text), 'row ' + eTxt(asRA))),
          h('p', { style: { marginTop: '10px' } }, `With a partner stronger as a reducing agent than ${asOA.ra} (above the ${EC.ev(asOA.E)} V row on the right), ${sp} is reduced. With a partner stronger as an oxidising agent than ${asRA.oa} (below the ${EC.ev(asRA.E)} V row on the left), ${sp} is oxidised.`),
          ['H₂O₂', 'SO₂'].includes(sp) ? notice('', `${sp} can even react with itself: its oxidising row (${EC.ev(asOA.E)} V) is below its reducing row (${EC.ev(asRA.E)} V).`) : null]);
        return box;
      }
      draw();
    }
  };

  /* the build panel */
  function pairPanel(st, redraw) {
    const box = h('div', { class: 'card' });
    if (st.ra === null || st.oa === null) {
      add(box, [h('h3', null, 'Pair and build'),
        h('ol', { class: 'rules' },
          h('li', null, 'Tap a ', h('span', { class: 'k-ox' }, 'reducing agent'), ' on the RIGHT side of a row (blue).'),
          h('li', null, 'Tap an ', h('span', { class: 'k-red' }, 'oxidising agent'), ' on the LEFT side of another row (red).'),
          h('li', null, 'Electrons run downhill: if the reducing agent is higher up than the oxidising agent, they react.')),
        h('p', { class: 'small muted' }, st.ra !== null ? 'Reducing agent chosen: ' + ROWS[st.ra].ra + ' (' + EC.ev(ROWS[st.ra].E) + ' V row). Now tap an oxidising agent.' : st.oa !== null ? 'Oxidising agent chosen: ' + ROWS[st.oa].oa + ' (' + EC.ev(ROWS[st.oa].E) + ' V row). Now tap a reducing agent.' : 'Try zinc (Zn, right) with copper(II) ions (Cu²⁺, left).')]);
      return box;
    }
    const ra = ROWS[st.ra], oa = ROWS[st.oa];
    if (ra === oa) { box.appendChild(notice('no', 'You chose both sides of the same row. A row cannot react with itself: choose a partner from a different row.')); return box; }
    const reacts = EC.reacts(ra, oa);
    // Fe is twice on the right and Fe³⁺ twice on the left: if the tapped rows do not react but the species' strongest rows do
    // (exam recipe step 3), the answer to "Will it react?" is still YES
    const raBest = rowFor(ra.ra, 'ra'), oaBest = rowFor(oa.oa, 'oa'), other = !reacts && EC.reacts(raBest, oaBest), yes = reacts || other;
    const net = EC.netEquation(ra, oa);
    const cn = EC.cellNotation(ra, oa);
    const ec = EC.eCell(oa, ra);
    const P = st.predict;
    st.reveal = st.reveal || {};
    const key = st.ra + ':' + st.oa;
    if (st.revealKey !== key) { st.reveal = {}; st.revealKey = key; st.guess = {}; }
    const R = st.reveal;
    const steps = h('div', { class: 'steps' });
    add(box, [h('h3', null, 'Pair and build'),
      h('p', null, h('span', { class: 'k-ox' }, ra.ra), ' (reducing agent, ', EC.ev(ra.E), ' V row) with ', h('span', { class: 'k-red' }, oa.oa), ' (oxidising agent, ', EC.ev(oa.E), ' V row)'), steps]);

    function lockable(id, cls, label, val, why, tryEl) {
      const locked = P && !R[id];
      const s = h('div', { class: 'step ' + cls + (locked ? ' locked' : '') }, h('div', { class: 'lab' }, label), h('div', { class: 'val' }, val), why ? h('div', { class: 'why' }, why) : null);
      if (locked) s.appendChild(h('div', { class: 'try' }, tryEl || h('button', { class: 'btn ghost small', type: 'button', onclick: () => { R[id] = 1; redraw(); } }, 'Write it on paper, then reveal')));
      return s;
    }
    // 1 will it react
    const yesNo = h('div', { class: 'row' }, ['YES', 'NO'].map(v => h('button', { class: 'btn ghost small', type: 'button', onclick: () => { st.guess.react = v; R.react = 1; logAttempt({ kind: 'supported', section: '27.3', id: 'react', correct: (v === 'YES') === yes ? 1 : 0, total: 1 }); redraw(); } }, v)));
    const g = st.guess.react;
    const also = [raBest !== ra ? `${ra.ra} is also on the ${eTxt(raBest)} row` : '', oaBest !== oa ? `${oa.oa} is also on the ${eTxt(oaBest)} row` : ''].filter(Boolean).join(', and ');
    const tappedRows = raBest !== ra && oaBest !== oa ? 'the rows you tapped' : `the ${eTxt(raBest !== ra ? ra : oa)} row you tapped`;
    const level = !reacts && !other && Math.abs(ra.E - oa.E) < 1e-9;
    steps.appendChild(lockable('react', 'el', '1 · Will it react?', level ? `NO: both rows have Eθ = ${EC.ev(ra.E)} V, so neither is the stronger oxidising agent and nothing pushes the electrons.` : reacts ? 'YES: the reducing agent is higher, so electrons run downhill to the oxidising agent.' :
      other ? `YES: ${also}. There the reducing agent is higher, so electrons run downhill to the oxidising agent. With ${tappedRows} they would have to run uphill.` :
        'NO: the reducing agent is lower than the oxidising agent, so the electrons would have to run uphill.',
      other ? memoSentence(raBest, oaBest) : memoSentence(ra, oa), h('div', null, h('div', { class: 'small' }, 'Predict: will a spontaneous reaction take place?'), yesNo)));
    if (g) steps.lastChild.appendChild(notice((g === 'YES') === yes ? 'ok' : 'no', (g === 'YES') === yes ? 'Your prediction was right.' : 'Your prediction was wrong. Find both rows: electrons only run downhill.'));
    if (other) {
      box.appendChild(h('div', { class: 'row', style: { marginTop: '10px' } }, h('button', { class: 'btn', type: 'button', onclick: () => { st.ra = raBest.i; st.oa = oaBest.i; redraw(); } }, 'Use the rows that react →')));
      return box;
    }
    if (!reacts) {
      steps.appendChild(lockable('ecell', '', '2 · Eθcell confirms it', h('span', null, ec.formula, h('br'), ec.substitute, h('br'), ec.answer), level ? 'Zero: not spontaneous under standard conditions.' : 'Negative: non-spontaneous under standard conditions.'));
      if (level) return box; // the reverse is also 0,00 V: nothing to swap
      const rev = h('div', { class: 'row', style: { marginTop: '10px' } }, h('button', { class: 'btn', type: 'button', onclick: () => {
        const nra = rowFor(oa.ra, 'ra'), noa = rowFor(ra.oa, 'oa');
        st.ra = nra.i; st.oa = noa.i; redraw();
      } }, 'What does react? Swap the partners →'));
      box.appendChild(rev);
      return box;
    }
    steps.appendChild(lockable('ox', 'ox', '2 · Oxidation (anode): the row backwards', chem(net.ox.k === 1 ? net.ox.text : EC.oxidationHalf(ra).text), EC.rowNote(ra, 'oxidation') + '. ' + ra.ra + ' loses electrons: it is oxidised, so it is the reducing agent.'));
    steps.appendChild(lockable('red', 'red', '3 · Reduction (cathode): the row copied', chem(EC.reductionHalf(oa).text), EC.rowNote(oa, 'reduction') + '. ' + oa.oa + ' gains electrons: it is reduced, so it is the oxidising agent.'));
    if (net.ko !== 1 || net.kr !== 1) steps.appendChild(lockable('bal', 'el', '4 · Balance the electrons', chem(`(${EC.oxidationHalf(ra).text}) × ${net.ko} and (${EC.reductionHalf(oa).text}) × ${net.kr}`), `${net.electrons}e⁻ each: electrons lost = electrons gained. Multiply the equations, never the Eθ values.`));
    // net equation: predict = choose
    const opts = st.netOpts && st.netOptsKey === key ? st.netOpts : (st.netOpts = netOptions(ra, oa), st.netOptsKey = key, st.netOpts);
    const choose = h('div', { class: 'choices' }, opts.map(o => h('button', { class: 'choice', type: 'button', onclick: () => { st.guess.net = o; R.net = 1; logAttempt({ kind: 'supported', section: '27.2', id: 'net', correct: o.ok ? 1 : 0, total: 1 }); redraw(); } }, chem(o.t))));
    const cancelTxt = net.cancelled.length ? `Added: ${net.added}. Cancel ${net.cancelled.join(', ')} from both sides. ` : '';
    steps.appendChild(lockable('net', 'el', (net.ko !== 1 || net.kr !== 1 ? '5' : '4') + ' · Net ionic equation', chem(net.text), cancelTxt + `Charge check: left ${EC.chargeText(net.check.leftCharge)}, right ${EC.chargeText(net.check.rightCharge)}. Atoms balance.`, h('div', null, h('div', { class: 'small' }, 'Predict: choose the balanced net equation.'), choose)));
    if (st.guess.net) steps.lastChild.appendChild(notice(st.guess.net.ok ? 'ok' : 'no', st.guess.net.ok ? 'Correct.' : st.guess.net.why));
    if (ra.ra === 'H₂O' || oa.oa === 'H₂O') steps.appendChild(stepLine('', 'Cell notation', 'Not shown here for a half-cell in which water itself is oxidised or reduced. When it is written, H₂O is included because water itself reacts (2024 examiners’ report, Q6.7).'));
    else steps.appendChild(lockable('cn', '', 'Cell notation (as a galvanic cell)', chem(cn.text), (cn.needsPt ? 'Pt is needed: a half-cell with no solid conductor. ' : '') + 'Anode on the left, salt bridge ||, no coefficients.'));
    const checkE = h('button', { class: 'btn small', type: 'button', onclick: () => {
      const v = readNum(st.guess.typedE || ''); if (isNaN(v)) { st.guess.eBlank = true; redraw(); return; }
      st.guess.eBlank = false; st.guess.e = v; R.ecell = 1; logAttempt({ kind: 'supported', section: '28.6', id: 'emf', correct: close(v, ec.value, 0.005) ? 1 : 0, total: 1 }); redraw();
    } }, 'Check');
    // the typed value survives redraws (choosing a net equation, a wrong-answer message), and Enter checks it
    const inp = h('input', { type: 'text', inputmode: 'decimal', placeholder: 'e.g. 1,10', 'aria-label': 'Your Eθcell in volts', value: st.guess.typedE || '', oninput: e => { st.guess.typedE = e.target.value; }, onkeydown: e => { if (e.key === 'Enter') { e.preventDefault(); checkE.click(); } } });
    const tryE = h('div', null, h('div', { class: 'small' }, 'Predict: Eθcell = Eθcathode − Eθanode = ?'), h('div', { class: 'answer-row' }, inp, h('span', null, 'V'), checkE), st.guess.eBlank ? notice('', 'Type a number (a decimal comma is fine).') : null);
    steps.appendChild(lockable('ecell', '', 'Eθcell', h('span', null, ec.formula, h('br'), ec.substitute, h('br'), ec.answer), 'Positive: spontaneous under standard conditions. Brackets round a negative Eθ; the unit is V.', tryE));
    if (st.guess.e !== undefined) steps.lastChild.appendChild(notice(close(st.guess.e, ec.value, 0.005) ? 'ok' : 'no', close(st.guess.e, ec.value, 0.005) ? 'Correct.' :
      close(st.guess.e, -ec.value, 0.005) ? 'The sign is wrong: cathode minus anode. The cathode is where the oxidising agent is reduced.' :
        close(st.guess.e, oa.E * net.kr - ra.E * net.ko, 0.005) ? 'You multiplied Eθ by the coefficients. Never multiply Eθ.' : 'Not yet: substitute the cathode Eθ first, then subtract the anode Eθ in brackets.'));
    return box;
  }

  /* ---------- T3: the emf ruler ---------- */
  S.tools.ruler = {
    id: 'ruler', mod: 28, section: '28.6', title: 'The emf ruler',
    blurb: 'Table 4 drawn to scale. The emf is the distance between two rows, so it never changes when you multiply a half-reaction.',
    render(el, params) {
      const st = { c: rowFor('Ag⁺', 'oa').i, a: rowFor('Mg', 'ra').i, times: [1, 2, 3].includes(+(params || {}).times) ? +params.times : 1 };
      const ctl = h('div', { class: 'card' }), stage = h('div', { class: 'stage ruler-stage' }), info = h('div');
      add(el, [h('div', { class: 'split' }, h('div', null, stage, h('p', { class: 'small muted', style: { marginTop: '6px' } }, 'Drag the red (cathode) or blue (anode) marker along the scale: it snaps to the nearest row. Or choose the rows from the lists.')), h('div', null, ctl, info))]);
      // the couple form fits a phone-width list and matches the labels on the scale
      const opts = ROWS.map(r => [String(r.i), `${r.oa} / ${r.ra}   (${EC.ev(r.E)} V)`]);
      const selC = select(opts, String(st.c), v => { st.c = +v; draw(); }, { 'aria-label': 'Cathode half-cell (reduction)' });
      const selA = select(opts, String(st.a), v => { st.a = +v; draw(); }, { 'aria-label': 'Anode half-cell (oxidation)' });
      const segBox = h('div');
      function drawSeg() { clear(segBox); segBox.appendChild(seg([['1', '× 1'], ['2', '× 2'], ['3', '× 3']], String(st.times), v => { st.times = +v; drawSeg(); draw(); const b = segBox.querySelector('[aria-pressed="true"]'); if (b) b.focus({ preventScroll: true }); })); }
      add(ctl, [h('label', { class: 'f' }, h('span', { class: 'k-red' }, 'Cathode half-cell (reduction)')), selC,
        h('label', { class: 'f' }, h('span', { class: 'k-ox' }, 'Anode half-cell (oxidation)')), selA,
        h('label', { class: 'f' }, 'Multiply the cathode half-reaction'), segBox]);
      drawSeg();
      const W = 420, H = 680, top = 30, bot = 650, Emin = -3.2, Emax = 3.0;
      const y = E => top + (E - Emin) / (Emax - Emin) * (bot - top);
      const Eof = yy => Emin + (yy - top) / (bot - top) * (Emax - Emin);
      function verdict(v) {
        return v > 0 ? 'The cathode row is lower (more positive): electrons run downhill. Positive Eθcell: spontaneous under standard conditions.'
          : v < 0 ? 'The cathode row is higher: electrons would have to run uphill. Negative Eθcell: non-spontaneous under standard conditions.'
          : 'The two rows are level (same Eθ): Eθcell = 0,00 V. Nothing pushes the electrons, so the reaction is not spontaneous under standard conditions.';
      }
      function drawStage() {
        const c = ROWS[st.c], a = ROWS[st.a], v = EC.eCellValue(c, a);
        const yc = y(c.E), ya = y(a.E);
        let svg = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Vertical Eθ scale. Cathode ${c.oa}/${c.ra} at ${EC.ev(c.E)} V, anode ${a.oa}/${a.ra} at ${EC.ev(a.E)} V, Eθcell ${EC.ev(v)} V.">`;
        svg += `<defs><marker id="ah" markerUnits="userSpaceOnUse" markerWidth="14" markerHeight="14" refX="14" refY="7" orient="auto"><path d="M0,0 L14,7 L0,14 z" fill="#343a40"/></marker></defs>`;
        svg += `<line x1="120" y1="${top}" x2="120" y2="${bot}" stroke="#52677a" stroke-width="2"/>`;
        for (let E = -3; E <= 3.001; E += 0.5) { const yy = y(E); svg += `<line x1="112" y1="${yy}" x2="128" y2="${yy}" stroke="#52677a"/><text x="104" y="${yy + 5}" text-anchor="end" font-size="13" fill="#52677a">${EC.ev(Math.round(E * 10) / 10)}</text>`; }
        ROWS.forEach(r => { const yy = y(r.E); svg += `<line x1="122" y1="${yy}" x2="134" y2="${yy}" stroke="#7d8d98" stroke-width="2"/>`; });
        // labels: cathode, anode and the dashed ×n mark, pushed apart so they never print on top of each other
        const wrong = st.times > 1 && c.E !== 0 ? c.E * st.times : null;
        const showWrong = wrong !== null && wrong < Emax && wrong > Emin;
        const labs = [{ k: 'c', y0: yc, y: yc }, { k: 'a', y0: ya, y: ya }].concat(showWrong ? [{ k: 'w', y0: y(wrong), y: y(wrong) }] : []);
        for (let pass = 0; pass < 8; pass++) {
          labs.sort((p, q) => p.y - q.y);
          for (let i = 1; i < labs.length; i++) { const gap = labs[i].y - labs[i - 1].y; if (gap < 18) { const d = (18 - gap) / 2; labs[i - 1].y -= d; labs[i].y += d; } }
          labs.forEach(l => { l.y = Math.max(top - 2, Math.min(bot + 2, l.y)); });
        }
        const L = k => labs.find(l => l.k === k);
        svg += `<line x1="128" y1="${yc}" x2="250" y2="${yc}" stroke="#c92a2a" stroke-width="3"/><line x1="250" y1="${yc}" x2="256" y2="${L('c').y}" stroke="#c92a2a"/>`;
        svg += `<line x1="128" y1="${ya}" x2="250" y2="${ya}" stroke="#1c64d6" stroke-width="3"/><line x1="250" y1="${ya}" x2="256" y2="${L('a').y}" stroke="#1c64d6"/>`;
        // drag handles on the scale
        svg += `<g class="handle" data-k="c" style="cursor: ns-resize; touch-action: none"><rect x="122" y="${yc - 16}" width="134" height="32" fill="transparent"/><circle cx="140" cy="${yc}" r="8" fill="#c92a2a" stroke="#fff" stroke-width="2"/></g>`;
        svg += `<g class="handle" data-k="a" style="cursor: ns-resize; touch-action: none"><rect x="122" y="${ya - 16}" width="134" height="32" fill="transparent"/><circle cx="160" cy="${ya}" r="8" fill="#1c64d6" stroke="#fff" stroke-width="2"/></g>`;
        svg += `<text x="260" y="${L('c').y + 5}" font-size="14" fill="#c92a2a" font-weight="700">${c.oa} / ${c.ra}  ${EC.ev(c.E)} V</text>`;
        svg += `<text x="260" y="${L('a').y + 5}" font-size="14" fill="#1c64d6" font-weight="700">${a.oa} / ${a.ra}  ${EC.ev(a.E)} V</text>`;
        if (showWrong) { const yw = y(wrong); svg += `<line x1="128" y1="${yw}" x2="230" y2="${yw}" stroke="#c92a2a" stroke-dasharray="5 5" opacity=".6"/><line x1="230" y1="${yw}" x2="236" y2="${L('w').y}" stroke="#a3360f"/><text x="240" y="${L('w').y + 5}" font-size="13" fill="#a3360f">✗ ${st.times}(${EC.evPlain(c.E)}): not the ${c.oa} row</text>`; }
        if (Math.abs(yc - ya) >= 30) svg += `<line x1="200" y1="${ya}" x2="200" y2="${yc}" stroke="#343a40" stroke-width="3" marker-end="url(#ah)"/>`;
        // the emf box: between the rows when there is room, otherwise in the first clear band beside the pair
        const lines = [yc, ya].concat(showWrong ? [y(wrong)] : []);
        const clearBand = b => b >= top - 2 && b + 28 <= bot + 2 && lines.every(l => l < b - 2 || l > b + 30);
        const lo = Math.max(yc, ya), hi = Math.min(yc, ya);
        let by = Math.abs(yc - ya) >= 34 ? (yc + ya) / 2 - 14 : null;
        if (by === null) by = [lo + 8, hi - 36, lo + 40, hi - 68].find(clearBand);
        if (by === undefined) by = lo + 8;
        svg += `<rect x="150" y="${by}" width="100" height="28" rx="6" fill="#fff" stroke="#343a40"/><text x="200" y="${by + 19}" text-anchor="middle" font-size="15" font-weight="700" fill="#343a40">${EC.evPlain(v)} V</text>`;
        svg += `<text x="20" y="${top - 10}" font-size="12" fill="#52677a">more negative: stronger reducing agents</text><text x="20" y="${bot + 22}" font-size="12" fill="#52677a">more positive: stronger oxidising agents</text></svg>`;
        stage.innerHTML = svg;
      }
      // dragging a marker: it snaps to the nearest Table 4 row
      let drag = null;
      stage.addEventListener('pointerdown', e => {
        const g = e.target.closest && e.target.closest('.handle'); if (!g) return;
        drag = g.dataset.k; stage.setPointerCapture(e.pointerId); e.preventDefault();
      });
      stage.addEventListener('pointermove', e => {
        if (!drag) return;
        const svg = stage.querySelector('svg'), r = svg.getBoundingClientRect();
        const yy = (e.clientY - r.top) * (H / r.height), E = Eof(yy);
        let best = ROWS[0]; ROWS.forEach(row => { if (Math.abs(row.E - E) < Math.abs(best.E - E)) best = row; });
        if (st[drag] !== best.i) { st[drag] = best.i; (drag === 'c' ? selC : selA).value = String(best.i); draw(true); }
      });
      const end = () => { if (drag) { drag = null; draw(); } };
      stage.addEventListener('pointerup', end); stage.addEventListener('pointercancel', end);
      function draw(...a) { return S.keepFocus(el, () => draw0(...a)); } // keep keyboard focus on the control that was used
      function draw0(quiet) {
        clear(info);
        drawStage();
        const c = ROWS[st.c], a = ROWS[st.a];
        const ec = EC.eCell(c, a), v = ec.value;
        const kred = EC.reductionHalf(c, st.times);
        add(info, [h('div', { class: 'steps', style: { marginTop: '12px' } },
          stepLine('red', 'Cathode half-reaction' + (st.times > 1 ? ' × ' + st.times : ''), chem(kred.text), 'Eθ stays ' + EC.ev(c.E) + ' V'),
          stepLine('ox', 'Anode half-reaction', chem(EC.oxidationHalf(a).text), 'Eθ stays ' + EC.ev(a.E) + ' V'),
          stepLine('el', 'Eθcell = cathode row − anode row', h('span', null, ec.formula, h('br'), ec.substitute, h('br'), ec.answer), verdict(v))),
          st.times > 1 ? h('div', { class: 'callout trap' }, h('h4', null, 'IEB trap · WE 28.7'),
            c.E === 0 ? `✗ ${st.times} × 0,00 is still 0,00, so the slip does not change the answer here.` : `✗ ${st.times}(${EC.evPlain(c.E)}) − ${EC.evSub(a.E)} = ${EC.evPlain(c.E * st.times - a.E)} V because the half-reaction was multiplied by ${st.times}.`, h('br'),
            `✓ Eθ does not depend on the number of electrons transferred, so it is never multiplied by a coefficient: Eθcell is still ${ec.valueText}. On the ruler, the row does not move.`) : null]);
        if (!quiet) S.say(`Cathode ${c.oa}/${c.ra} ${EC.ev(c.E)} V, anode ${a.oa}/${a.ra} ${EC.ev(a.E)} V. Eθcell = ${ec.valueText}${st.times > 1 ? ', unchanged by × ' + st.times : ''}. ${verdict(v)}`);
      }
      draw(true);
    }
  };

  /* ---------- A3: half-reaction builder ---------- */
  const HALF_TASKS = [
    ['reduction', 'Cℓ₂'], ['oxidation', 'Aℓ'], ['oxidation', 'Fe²⁺', 'Fe³⁺'], ['reduction', 'MnO₄⁻'], ['oxidation', 'H₂O₂', 'O₂'],
    ['reduction', 'Ag⁺'], ['oxidation', 'I⁻'], ['oxidation', 'Fe', 'Fe³⁺'], ['oxidation', 'Fe', 'Fe²⁺'], ['reduction', 'Cr₂O₇²⁻'], ['oxidation', 'Br⁻'],
    ['reduction', 'NO₃⁻', 'NO'], ['reduction', 'NO₃⁻', 'NO₂'], ['oxidation', 'Zn'], ['reduction', 'Cu²⁺'], ['reduction', 'Fe³⁺', 'Fe²⁺'],
    ['oxidation', 'SO₂', 'SO₄²⁻'], ['reduction', 'H₂O₂', 'H₂O'], ['oxidation', 'Mg'], ['reduction', 'O₂', 'H₂O'], ['oxidation', 'Sn²⁺', 'Sn⁴⁺'], ['oxidation', 'Cℓ⁻']
  ];
  function halfTarget(t) {
    const [dir, sp, prod] = t;
    let row;
    if (prod) row = EC.findHalf(sp, prod).row;
    else row = dir === 'reduction' ? rowFor(sp, 'oa') : rowFor(sp, 'ra');
    return { dir, sp, prod, row };
  }
  S.halfTarget = halfTarget; S.HALF_TASKS = HALF_TASKS;
  S.tools.halfrx = {
    id: 'halfrx', mod: 27, section: '27.2', title: 'Half-reaction builder',
    blurb: 'Pick the row, choose the direction, place the electrons. A live charge meter must balance, and the memo traps are named.',
    render(el) {
      let task, st;
      const box = h('div', { class: 'grid g2' });
      el.appendChild(box);
      function fresh() { task = halfTarget(pick(HALF_TASKS)); st = { row: null, dir: null, eSide: null, eN: 1, arrow: '→', checked: null }; draw(); }
      function draw(...a) { return S.keepFocus(el, () => draw0(...a)); } // keep keyboard focus on the control that was used
      function draw0() {
        clear(box);
        const L = h('div', { class: 'card' }), Rp = h('div', { class: 'card' });
        add(box, [L, Rp]);
        const verb = task.dir === 'reduction' ? 'reduction' : 'oxidation';
        add(L, [h('div', { class: 'qmeta' }, h('span', { class: 'pill ' + (task.dir === 'reduction' ? 'red' : 'ox') }, verb), h('span', null, '27.2')),
          h('p', { class: 'prompt' }, `Use Table 4 to write the half-reaction for the ${verb} of ${nm(task.sp)} (`, chem(task.sp), ')', task.prod ? h('span', null, ' to ', chem(task.prod)) : null, '.')]);
        // step 1 rows containing the species
        const cands = ROWS.filter(r => r.ox.some(t => t.sp === task.sp) || r.red.some(t => t.sp === task.sp));
        add(L, [h('label', { class: 'f' }, '1 · Pick the row (', chem(task.sp), ' appears in ' + cands.length + (cands.length > 1 ? ' rows: the product picks the row)' : ' row)')),
          h('div', { class: 'choices' }, cands.map(r => h('button', { class: 'choice', type: 'button', 'aria-pressed': String(st.row === r.i), onclick: () => { st.row = r.i; st.checked = null; draw(); } }, chem(`${r.leftText} ⇌ ${r.rightText}`), h('span', { class: 'muted small', style: { marginLeft: 'auto' } }, EC.ev(r.E) + ' V')))),
          h('label', { class: 'f' }, '2 · Direction'),
          seg([['copy', 'Copy the row (left to right)'], ['back', 'Write it backwards']], st.dir, v => { st.dir = v; st.checked = null; draw(); }),
          h('label', { class: 'f' }, '3 · Electrons'),
          h('div', { class: 'row' }, seg([['left', 'on the left'], ['right', 'on the right']], st.eSide, v => { st.eSide = v; st.checked = null; draw(); }),
            h('span', null, 'how many?'), seg([1, 2, 3, 4, 5, 6].map(n => [String(n), String(n)]), String(st.eN), v => { st.eN = +v; st.checked = null; draw(); })),
          h('label', { class: 'f' }, '4 · Arrow'), seg([['→', 'single →'], ['⇌', 'double ⇌']], st.arrow, v => { st.arrow = v; st.checked = null; draw(); })]);
        // preview
        let preview = '…', lq = null, rq = null, Ls = [], Rs = [];
        if (st.row !== null && st.dir) {
          const r = ROWS[st.row];
          Ls = (st.dir === 'copy' ? r.ox : r.red).map(t => ({ c: t.c, sp: t.sp }));
          Rs = (st.dir === 'copy' ? r.red : r.ox).map(t => ({ c: t.c, sp: t.sp }));
          if (st.eSide === 'left') Ls.push({ c: st.eN, sp: 'e⁻' }); if (st.eSide === 'right') Rs.push({ c: st.eN, sp: 'e⁻' });
          preview = EC.sideText(Ls) + ' ' + st.arrow + ' ' + EC.sideText(Rs);
          const ck = EC.balanceCheck(Ls, Rs); lq = ck.leftCharge; rq = ck.rightCharge;
        }
        add(Rp, [h('h3', null, 'Your half-reaction'), h('div', { class: 'line-build' }, chem(preview)),
          lq !== null ? h('div', { class: 'meter', style: { marginTop: '12px' } }, h('span', null, 'charge: left ', h('b', null, EC.chargeText(lq))), h('span', { style: { margin: '0 6px' } }, lq === rq ? '=' : '≠'), h('span', null, 'right ', h('b', null, EC.chargeText(rq))), h('span', { class: 'pill ' + (lq === rq ? '' : 'red') }, lq === rq ? 'balanced' : 'not balanced')) : null,
          h('div', { class: 'row', style: { marginTop: '12px' } }, h('button', { class: 'btn', type: 'button', disabled: st.row === null || !st.dir || !st.eSide, onclick: check }, 'Check'), h('button', { class: 'btn ghost', type: 'button', onclick: fresh }, 'New half-reaction'))]);
        if (st.checked) Rp.appendChild(st.checked);
      }
      function check() {
        const want = task.dir === 'reduction' ? EC.reductionHalf(task.row) : EC.oxidationHalf(task.row);
        const r = ROWS[st.row];
        const issues = [];
        if (r !== task.row) issues.push(task.prod ? `Wrong row: the product is ${task.prod}, so use the row that holds both ${task.sp} and ${task.prod} (${EC.ev(task.row.E)} V).` : `Use the row where ${task.sp} is on the ${task.dir === 'reduction' ? 'left (it gains electrons)' : 'right (it loses electrons)'}.`);
        const wantDir = task.dir === 'reduction' ? 'copy' : 'back';
        if (r === task.row && st.dir !== wantDir) issues.push(task.dir === 'reduction' ? 'A reduction is the row copied: the species gains electrons, so the electrons are on the left.' : 'An oxidation is the row written backwards: the species loses electrons, so the electrons end up on the right.');
        const wantSide = task.dir === 'reduction' ? 'left' : 'right';
        if (st.eSide !== wantSide) issues.push(`Electrons on the wrong side: in ${task.dir === 'reduction' ? 'a reduction they are gained (left)' : 'an oxidation they are lost (right)'}.`);
        if (r === task.row && st.eN !== task.row.n) issues.push(`Electron count: the charges must balance. ${task.sp === 'Br⁻' ? `2Br⁻ → Br₂ needs 2e⁻, not ${st.eN}.` : 'Check the charge meter.'}`);
        if (st.arrow !== '→') issues.push('Use a single arrow. The IEB memo deducts a mark for ⇌ in a half-reaction (examiners’ report 2025).');
        const ok = !issues.length;
        logAttempt({ kind: 'supported', section: '27.2', id: 'halfrx', correct: ok ? 1 : 0, total: 1 });
        st.checked = h('div', null, notice(ok ? 'ok' : 'no', ok ? h('span', null, 'Correct: ', chem(want.text), ' (', EC.rowNote(task.row, task.dir), ').') : h('ul', { style: { margin: 0, paddingLeft: '18px' } }, issues.map(i => h('li', null, i)))),
          ok ? null : h('div', { class: 'redo' }, 'Wrong? Reread 27.2 (Half-reactions from Table 4), then redo this one before taking a new one.'));
        draw();
      }
      fresh();
    }
  };

  /* ---------- A4: the electron balancer ---------- */
  const PAIRS = [['Aℓ', 'Ni²⁺'], ['Fe²⁺', 'MnO₄⁻'], ['H₂O₂', 'MnO₄⁻'], ['Mg', 'Ag⁺'], ['Zn', 'Ag⁺'], ['Cr', 'Ni²⁺'], ['Cu', 'Ag⁺'], ['Fe²⁺', 'Cr₂O₇²⁻'], ['Aℓ', 'Cu²⁺'], ['I⁻', 'Fe³⁺'], ['Zn', 'Fe³⁺'], ['Mg', 'Aℓ³⁺'], ['Sn²⁺', 'MnO₄⁻'], ['Br⁻', 'Cℓ₂'], ['Cu', 'NO₃⁻']];
  function pairRows(p) {
    const [r, o] = p;
    const raRow = r === 'H₂O₂' ? EC.rowByKey('O₂+H⁺/H₂O₂') : r === 'Fe²⁺' ? EC.rowByKey('Fe³⁺/Fe²⁺') : r === 'Sn²⁺' ? EC.rowByKey('Sn⁴⁺/Sn²⁺') : rowFor(r, 'ra');
    const oaRow = o === 'Fe³⁺' && r === 'Zn' ? EC.rowByKey('Fe³⁺/Fe²⁺') : o === 'NO₃⁻' ? EC.rowByKey('NO₃⁻+H⁺/NO+H₂O') : rowFor(o, 'oa');
    return { raRow, oaRow };
  }
  S.pairRows = pairRows; S.PAIRS = PAIRS;
  S.tools.balancer = {
    id: 'balancer', mod: 27, section: '27.2', title: 'Electron balancer',
    blurb: 'Multiply each half-reaction until the electron dots match, then add and cancel. Never multiply Eθ.',
    render(el, params) {
      let p, st;
      const box = h('div');
      el.appendChild(box);
      function fresh() { const pr = pick(PAIRS); p = pairRows(pr); st = { ko: 1, kr: 1, stage: 0 }; draw(); }
      function dots(n, cls) { return h('span', { 'aria-label': n + ' electrons' }, Array.from({ length: n }, () => h('span', { style: { display: 'inline-block', width: '14px', height: '14px', borderRadius: '50%', background: 'var(--el)', margin: '2px' } })), h('span', { class: 'small k-el', style: { marginLeft: '6px' } }, n + 'e⁻')); }
      function draw(...a) { return S.keepFocus(el, () => draw0(...a)); } // keep keyboard focus on the control that was used
      function draw0() {
        clear(box);
        const ox = EC.oxidationHalf(p.raRow, st.ko), red = EC.reductionHalf(p.oaRow, st.kr);
        const eo = p.raRow.n * st.ko, er = p.oaRow.n * st.kr;
        const net = EC.netEquation(p.raRow, p.oaRow);
        const stepper = (k, set) => seg([1, 2, 3, 4, 5, 6].map(n => [String(n), '×' + n]), String(k), v => { set(+v); st.stage = 0; draw(); });
        add(box, [h('div', { class: 'card' },
          h('p', { class: 'prompt' }, 'Combine the two half-reactions into a balanced net ionic equation.'),
          h('div', { class: 'steps' },
            h('div', { class: 'step ox' }, h('div', { class: 'lab' }, 'Oxidation (electrons lost)'), h('div', { class: 'val' }, chem(ox.text)), h('div', { class: 'row', style: { marginTop: '6px' } }, stepper(st.ko, v => st.ko = v), dots(eo))),
            h('div', { class: 'step red' }, h('div', { class: 'lab' }, 'Reduction (electrons gained)'), h('div', { class: 'val' }, chem(red.text)), h('div', { class: 'row', style: { marginTop: '6px' } }, stepper(st.kr, v => st.kr = v), dots(er)))),
          h('div', { class: 'row', style: { marginTop: '12px' } },
            h('button', { class: 'btn', type: 'button', onclick: () => { if (eo !== er) { st.stage = -1; } else st.stage = 1; draw(); } }, 'Add the half-reactions'),
            h('button', { class: 'btn ghost', type: 'button', onclick: fresh }, 'New pair')))]);
        const out = box.firstChild;
        if (st.stage === -1) out.appendChild(notice('no', `Electrons lost (${eo}) must equal electrons gained (${er}). Find the lowest common multiple of ${p.raRow.n} and ${p.oaRow.n}.`));
        if (st.stage >= 1) {
          const lcmOk = eo === net.electrons;
          const L = [...ox.left, ...red.left], R = [...ox.right, ...red.right];
          out.appendChild(h('div', { class: 'steps', style: { marginTop: '12px' } },
            lcmOk ? null : notice('', `That balances, but the lowest common multiple is ${net.electrons}e⁻. Divide everything by ${eo / net.electrons} at the end.`),
            stepLine('el', 'Add (electrons cancel)', chem(EC.eqText(L.filter(t => t.sp !== 'e⁻'), R.filter(t => t.sp !== 'e⁻')))),
            net.cancelled.length ? stepLine('el', 'Cancel what is on both sides', chem(net.cancelled.join(', ')), 'H⁺ and H₂O that appear on both sides cancel.') : null,
            stepLine('el', 'Net ionic equation', chem(net.text), `Charge: left ${EC.chargeText(net.check.leftCharge)}; right ${EC.chargeText(net.check.rightCharge)}. Atoms balance.`)));
          if (st.stage === 1) { logAttempt({ kind: 'supported', section: '27.2', id: 'balance', correct: 1, total: 1 }); st.stage = 2; }
        }
      }
      if (params.ra && params.oa) { p = { raRow: rowFor(params.ra, 'ra'), oaRow: rowFor(params.oa, 'oa') }; st = { ko: 1, kr: 1, stage: 0 }; draw(); } else fresh();
    }
  };
})();
