/* v0.2 behaviour for the full talk: act openers, the act ribbon, live demos
   with offline fallbacks, and the animations for acts 1 and 3 to 8.
   Loaded before deck.js; deck.js merges ACT_SLIDE and ACT_FRAGMENT into its handlers.
   Uses d() and ACTS from deck.js at call time. */

const ACT_FULL = {
  0: ['Cold open', 'This talk, and the book in my hand, were built with AI.'],
  1: ['My journey', 'From chatbot user to a co-worker on my PC, mistakes included.'],
  2: ['The lens', 'Why a great book comes from judgement, not a clever prompt.'],
  3: ['What I built', 'Books, answer books, studios and dashboards, shown live.'],
  4: ['AI on my computer', 'The AI does the clicking, so I keep the teaching.'],
  5: ['The plumbing', "How it's wired, and where the data boundaries are."],
  6: ["What's next", 'Guarded AI coaches, and one toolbox for the whole group.'],
  7: ['How it was built', 'Five versions, one expert: what the teacher decided.'],
  8: ['Start tomorrow', 'Five steps, and the AI does four of them.'],
};

// Invented demo data for the dashboard mock. Not real classes, learners or marks.
const DEMO = {
  classes: ['Class A', 'Class B', 'Class C', 'Class D'],
  tests: ['T1', 'T2', 'T3', 'T4'],
  avg: [[62, 66, 71, 74], [55, 58, 57, 63], [70, 68, 73, 77], [48, 54, 59, 61]],
  topics: ['Momentum', 'Moles', 'Bonding', 'Circuits'],
  gap: [[72, 48, 81, 66], [58, 41, 69, 52], [80, 63, 77, 71], [51, 38, 60, 57]],
};


/* v0.5.5: the map comes back. One shared component: a mini map on every act opener and on the closing map slide. */
function miniMap(cur, allDone) {
  const nx = cur + 1;
  return `<div class="minimap${allDone ? ' alldone' : ''}" aria-hidden="true">${ACTS.map(([n, nm]) => {
    const st = allDone || n < cur ? 'done' : n === cur ? 'now' : n === nx ? 'next' : '';
    const tag = allDone ? '' : n === cur ? '<b class="mtag">Now</b>' : n === nx ? '<b class="mtag">Next</b>' : '';
    return `<div class="mm ${st}" style="--i:${n}"><span class="mlab">${st === 'done' ? '✓ ' : ''}${n} · ${nm}</span><i></i>${tag}</div>`;
  }).join('')}</div>`;
}

/* ---------- Build markup ---------- */

function buildOpeners() {
  document.querySelectorAll('section[data-opener]').forEach((s) => {
    const n = +s.dataset.opener;
    const [name, line] = ACT_FULL[n];
    const a = ACTS.find((x) => x[0] === n);
    const lanes = ['Teachers', 'IT', 'Head office'].filter((_, i) => a[3][i]);
    const notes = s.querySelector('aside');
    s.insertAdjacentHTML('afterbegin', `
      <div class="frame">
        <div class="op-num">${n}</div>
        <div class="op-name">${name}</div>
        <div class="op-line">${line}</div>
        <div class="op-meta"><span class="min">${a[2]} min</span><span class="forlab">For:</span>${a[3].every(Boolean) ? '<span class="for">Everyone</span>' : ['Teachers', 'IT', 'Head office'].filter((l, i) => a[3][i]).map((l) => `<span class="for">${l}</span>`).join('')}</div>
      </div>
      ${miniMap(n)}`);
    if (notes) s.appendChild(notes);
  });
}

function buildRibbons() {
  document.querySelectorAll('.slides > section[data-act]').forEach((s) => {
    const act = +s.dataset.act;
    const r = document.createElement('div');
    r.className = 'ribbon';
    r.setAttribute('aria-hidden', 'true');
    r.innerHTML = ACTS.map(([n, nm]) => `<i class="${n === act ? 'on' : n < act ? 'done' : ''}" title="${n} · ${nm}"></i>`).join('');
    s.appendChild(r);
  });
}

function svgBars(w, h, small) {
  const pad = small ? 10 : 56, bottom = small ? 10 : 46;
  const gw = (w - pad - 10) / DEMO.classes.length;
  const bw = (gw - 18) / DEMO.tests.length;
  const shades = ['#9fb8e8', '#6f95dc', '#3f6fc9', '#1c4fa8'];
  let s = `<svg viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img" aria-label="Demo bar chart of invented class averages">`;
  if (!small) [40, 60, 80].forEach((v) => { const y = h - bottom - (v / 100) * (h - bottom - 10); s += `<line x1="${pad}" x2="${w}" y1="${y}" y2="${y}" stroke="#d5dae3"/><text x="${pad - 8}" y="${y + 10}" font-size="30" text-anchor="end" fill="#596273">${v}</text>`; });
  DEMO.avg.forEach((vals, ci) => {
    vals.forEach((v, ti) => {
      const bh = (v / 100) * (h - bottom - 10);
      const x = pad + ci * gw + 9 + ti * bw;
      s += `<rect class="dbar" x="${x}" y="${h - bottom - bh}" width="${bw - 4}" height="${bh}" fill="${shades[ti]}" rx="3"/>`;
    });
    if (!small) s += `<text x="${pad + ci * gw + gw / 2}" y="${h - 8}" font-size="30" text-anchor="middle" fill="#1b2230">${DEMO.classes[ci].replace('Class ', '')}</text>`;
  });
  return s + '</svg>';
}

function svgHeat(w, h) {
  const left = 190, top = 44, cw = (w - left) / DEMO.classes.length, ch = (h - top) / DEMO.topics.length;
  const col = (v) => (v < 50 ? '#e3121b' : v < 65 ? '#f4a3a6' : '#dfe6f2');
  let s = `<svg viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img" aria-label="Demo heat map of invented topic scores">`;
  DEMO.classes.forEach((c, i) => { s += `<text x="${left + i * cw + cw / 2}" y="32" font-size="30" text-anchor="middle" fill="#1b2230">${c.replace('Class ', '')}</text>`; });
  DEMO.topics.forEach((t, r) => {
    s += `<text x="0" y="${top + r * ch + ch / 2 + 10}" font-size="30" fill="#1b2230">${t}</text>`;
    DEMO.gap[r].forEach((v, c) => {
      s += `<rect class="hcell" x="${left + c * cw + 4}" y="${top + r * ch + 4}" width="${cw - 8}" height="${ch - 8}" rx="8" fill="${col(v)}"/>`;
      s += `<text x="${left + c * cw + cw / 2}" y="${top + r * ch + ch / 2 + 11}" font-size="30" text-anchor="middle" fill="${v < 50 ? '#fff' : '#1b2230'}">${v}</text>`;
    });
  });
  return s + '</svg>';
}

function buildDemo() {
  const b = document.getElementById('demo-bars'); if (b) b.innerHTML = svgBars(860, 430, false);
  const h = document.getElementById('demo-heat'); if (h) h.innerHTML = svgHeat(700, 430);
  const m = document.querySelector('.mini-dash'); if (m) { m.innerHTML = svgBars(360, 300, true); m.style.marginBottom = '16px'; m.style.background = '#f6f7f9'; m.style.borderRadius = '8px'; }
}

function buildBars() {
  document.querySelectorAll('#bars .bbar').forEach((b) => { b.style.height = b.dataset.h + 'px'; });
}

function buildGit() {
  const data = window.BUILD_DATA;
  const list = document.getElementById('commit-list');
  const stats = document.getElementById('git-stats');
  if (!data || !list) return;
  list.innerHTML = data.commits.map((c) => `<div class="commit"><span class="tm">${c.t}</span><i class="dot"></i><span class="msg2">${c.m}</span></div>`).join('');
  stats.innerHTML = `
    <div class="stat2"><div class="n">${data.commits.length}</div><div class="l">saved steps (Git commits)</div></div>
    <div class="stat2"><div class="n">${data.minutes}</div><div class="l">minutes from first file to this version</div></div>
    <div class="stat2"><div class="n">${data.states}</div><div class="l">slide states checked by a robot browser, per run</div></div>`;
  document.getElementById('git-headline').innerHTML = `${data.commits.length} saved steps in ${data.minutes} minutes, <em>every one on record.</em>`;
}

/* ---------- Live demos ---------- */

function fitLive(box) {
  const s = box.clientWidth / 1440;
  box.querySelectorAll('img, iframe').forEach((el) => { el.style.transform = `scale(${s})`; });
}

function goLive(slide) {
  slide.querySelectorAll('.livebox[data-live]').forEach((box) => {
    fitLive(box);
    if (box.dataset.tried || !navigator.onLine) return;
    box.dataset.tried = '1';
    // Only swap in the live page if it is reachable; otherwise the screenshot stays.
    fetch(box.dataset.live, { mode: 'no-cors', cache: 'no-store' }).then(() => addFrame(box)).catch(() => {});
  });
}

function addFrame(box) {
    const f = document.createElement('iframe');
    f.src = box.dataset.live;
    f.title = 'Live demo';
    f.loading = 'lazy';
    f.style.opacity = '0';
    f.addEventListener('load', () => {
      f.style.transition = 'opacity .6s'; f.style.opacity = '1';
      const b = box.querySelector('.badge'); b.textContent = 'live'; b.classList.add('on');
    });
    box.appendChild(f);
    fitLive(box);
}

/* ---------- Animations ---------- */

function countUp(el) {
  el.querySelectorAll('[data-count]').forEach((n) => {
    const to = +n.dataset.count; const o = { v: 0 };
    gsap.to(o, { v: to, duration: d(1.4), ease: 'power2.out', onUpdate: () => { n.textContent = Math.round(o.v); } });
  });
}

function lanes() {
  const fills = document.querySelectorAll('#lanes .fill');
  fills.forEach((f, i) => {
    f.parentNode.querySelectorAll('.done').forEach((x) => x.remove());
    gsap.fromTo(f, { scaleX: 0 }, {
      scaleX: 1, duration: d(2.2 + (i % 3) * 0.35), ease: 'power1.inOut', delay: d(0.3),
      onComplete: () => { const t = document.createElement('span'); t.className = 'done'; t.textContent = 'done ✓'; f.parentNode.appendChild(t); },
    });
  });
}

function growBar(col) {
  const b = col.querySelector('.bbar');
  if (b) gsap.fromTo(b, { scaleY: 0 }, { scaleY: 1, duration: d(1), ease: 'power2.out' });
}

function stackUp() {
  const layers = [...document.querySelectorAll('#stack .layer')].reverse();
  gsap.fromTo(layers, { y: 80, opacity: 0 }, { y: 0, opacity: 1, duration: d(0.6), stagger: d(0.25), ease: 'power2.out' });
}

function dashIn() {
  gsap.fromTo('#demo-bars .dbar', { scaleY: 0, transformOrigin: '50% 100%' }, { scaleY: 1, duration: d(0.8), stagger: d(0.03), ease: 'power2.out' });
}

function heatIn() {
  gsap.fromTo('#demo-heat .hcell', { opacity: 0 }, { opacity: 1, duration: d(0.4), stagger: d(0.04) });
}

function gitReplay() {
  const box = document.querySelector('#s-gitlog .commits');
  const list = document.getElementById('commit-list');
  if (!list) return;
  const rows = list.querySelectorAll('.commit');
  gsap.set(list, { y: 0 });
  gsap.fromTo(rows, { opacity: 0, x: -30 }, { opacity: 1, x: 0, duration: d(0.35), stagger: d(0.12) });
  const scale = Reveal.getScale() || 1;
  const over = list.getBoundingClientRect().height / scale - box.getBoundingClientRect().height / scale;
  if (over > 0) gsap.to(list, { y: -over - 20, duration: d(Math.max(2, rows.length * 0.12)), ease: 'none', delay: d(0.8) });
}

const ACT_SLIDE = {
  's-momentum': (s) => goLive(s),
  's-parallel': lanes,
  's-bigbuilds': () => countUp(document.querySelector('#s-bigbuilds .stat2')),
  's-stack': stackUp,
  's-dashboard': dashIn,
  's-gitlog': gitReplay,
};

const ACT_FRAGMENT = {
  count: (f, shown) => { if (shown) countUp(f); },
  bars: (f, shown) => { if (shown) growBar(f); },
};

function buildActs() {
  buildOpeners();
  buildRibbons();
  buildDemo();
  buildBars();
  buildGit();
  const dashFrag = document.querySelector('#s-dashboard .panel.fragment');
  if (dashFrag) dashFrag.dataset.fx = 'heat';
  ACT_FRAGMENT.heat = (f, shown) => { if (shown) heatIn(); };
}
