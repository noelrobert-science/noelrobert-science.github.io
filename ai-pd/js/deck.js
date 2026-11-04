/* AI PD deck behaviour: builds the data-driven slides, then ties GSAP
   animations to reveal.js slide and fragment events. Every effect explains
   something (a book splitting into its parts, support fading, a page turning
   into its answer page). With prefers-reduced-motion, effects jump to their end state. */

const RM = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const d = (s) => (RM ? 0 : s);

/* ---------- Data ---------- */

// Grade 10 Coursebook Edition 1 (print copy), contents pp. 5-6: module, short name, sections.
const STRANDS = [
  { name: 'Getting started', c: '#2bb3c9', mods: [[1, 'Skills toolkit', 6]] },
  { name: 'Mechanics', c: '#4c8dff', mods: [[2, 'Vectors', 4], [3, 'Motion', 5], [4, 'Equations', 6], [5, 'Graphs', 7], [6, 'Energy', 6], [7, 'Momentum', 4], [8, 'Collisions', 4]] },
  { name: 'Electricity', c: '#9b7bff', mods: [[9, 'Electrostatics', 5], [10, 'Circuits', 7]] },
  { name: 'Matter and bonding', c: '#3fbf6a', mods: [[11, 'Atoms', 8], [12, 'Bonding', 6], [13, 'Chem language', 7]] },
  { name: 'Quantitative', c: '#ff9a3c', mods: [[14, 'Chemical calculations', 12]] },
  { name: 'Organic', c: '#ff6fa3', mods: [[15, 'Organic molecules', 8], [16, 'Isomers', 7]] },
  { name: 'Practical work', c: '#22c3b4', mods: [[17, 'Practical skills', 10]] },
  { name: 'Exam toolkit', c: '#b6c2d6', mods: [[18, 'Exam toolkit', 3]] },
];

// Outline doc, Proposed outline table: act number, short name, minutes, lanes [teachers, IT, head office].
const ACTS = [
  [0, 'Cold open', 2, [1, 1, 1]],
  [1, 'My journey', 6, [1, 1, 1]],
  [2, 'The lens', 8, [1, 0, 1]],
  [3, 'What I built', 8, [1, 1, 1]],
  [4, 'AI on my PC', 6, [1, 1, 0]],
  [5, 'Plumbing', 6, [0, 1, 0]],
  [6, "What's next", 6, [0, 0, 1]],
  [7, 'How it was built', 3, [1, 1, 1]],
  [8, 'Start tomorrow', 2, [1, 0, 0]],
];
const LANES = ['Teachers', 'IT', 'Head office'];

/* ---------- Build data-driven markup ---------- */

function buildStrands() {
  const host = document.getElementById('strand-rows');
  host.innerHTML = STRANDS.map((s) => `
    <div class="srow" style="--c:${s.c}">
      <div class="strand-name">${s.name}</div>
      <div class="tiles">${s.mods.map(([n, nm, k]) => `
        <div class="tile"><span class="num">${n}</span><span class="nm">${nm}</span>
          <span class="dots">${'<i></i>'.repeat(k)}</span></div>`).join('')}
      </div>
    </div>`).join('');
}

function buildMap() {
  const m = document.getElementById('map');
  let h = '<div class="h lane"></div>';
  h += ACTS.map(([n, nm, mins]) => `<div class="act" data-act="${n}"><span class="no">${n}</span><span class="nm">${nm}</span><span class="mn">${mins} min</span></div>`).join('');
  LANES.forEach((lane, li) => {
    h += `<div class="lane-name">${lane}</div>`;
    h += ACTS.map(([n, , , lanes]) => `<div class="cell" data-act="${n}"><i class="${lanes[li] ? 'on' : ''}"></i></div>`).join('');
  });
  m.innerHTML = h;
}

function placeMapHighlights() {
  // Position the "Now" and "Next" boxes over act 0 and act 2 columns (in slide pixels).
  const wrap = document.getElementById('map-wrap');
  const scale = Reveal.getScale() || 1;
  const wr = wrap.getBoundingClientRect();
  [['hl-now', 0], ['hl-next', 2]].forEach(([id, act]) => {
    const col = wrap.querySelector(`.act[data-act="${act}"]`);
    const last = [...wrap.querySelectorAll(`.cell[data-act="${act}"]`)].pop();
    const a = col.getBoundingClientRect(), b = last.getBoundingClientRect();
    const el = document.getElementById(id);
    el.style.left = ((a.left - wr.left) / scale - 4) + 'px';
    el.style.width = (a.width / scale + 8) + 'px';
    el.style.top = ((a.top - wr.top) / scale - 14) + 'px';
    el.style.height = ((b.bottom - a.top) / scale + 22) + 'px';
    el.querySelector('.map-label').style.left = (a.width / scale / 2 + 4) + 'px';
  });
}

function splitText() {
  document.querySelectorAll('[data-split]').forEach((p) => {
    const words = p.textContent.replace(/ /g, ' ').trim().split(' ');
    p.innerHTML = words.map((w) => `<span class="w">${[...w].map((ch) => `<span class="ch">${ch}</span>`).join('')}</span>`).join(' ');
  });
}

/* ---------- Animations ---------- */

function kinetic(el) {
  const chars = el.querySelectorAll('.ch');
  gsap.fromTo(chars, { yPercent: 110, opacity: 0, rotateX: -70 },
    { yPercent: 0, opacity: 1, rotateX: 0, duration: d(0.7), ease: 'power3.out', stagger: d(0.022) });
}

function titleIn() {
  kinetic(document.querySelector('#s-title .kt.first'));
}

function bookIn() {
  kinetic(document.querySelector('#s-title .kt.second'));
  gsap.fromTo('#s-title .cover-hero', { x: 260, rotate: 9, opacity: 0, scale: 0.92 },
    { x: 0, rotate: 0, opacity: 1, scale: 1, duration: d(1.1), ease: 'power3.out' });
}

function explode() {
  const stage = document.querySelector('#s-explode .explode');
  const cover = stage.querySelector('.mini-cover');
  const tiles = [...stage.querySelectorAll('.tile')];
  const names = stage.querySelectorAll('.strand-name');
  const scale = Reveal.getScale() || 1;
  const sr = cover.getBoundingClientRect();
  const cx = sr.left + sr.width / 2, cy = sr.top + sr.height / 2;
  gsap.killTweensOf([cover, tiles, names]);
  gsap.set(cover, { opacity: 1, scale: 1 });
  gsap.set(names, { opacity: 0 });
  const tl = gsap.timeline();
  tl.set(tiles, {
    x: (i, el) => { const r = el.getBoundingClientRect(); return (cx - (r.left + r.width / 2)) / scale; },
    y: (i, el) => { const r = el.getBoundingClientRect(); return (cy - (r.top + r.height / 2)) / scale; },
    scale: 0.2, opacity: 0,
  });
  tl.to(cover, { scale: 1.06, duration: d(0.35), ease: 'power1.inOut' }, d(0.5));
  tl.to(cover, { scale: 0.4, opacity: 0, duration: d(0.5), ease: 'power2.in' });
  tl.to(tiles, { x: 0, y: 0, scale: 1, opacity: 1, duration: d(0.9), ease: 'expo.out', stagger: d(0.035) }, '-=0.25');
  tl.to(names, { opacity: 1, duration: d(0.5), stagger: d(0.05) }, '-=0.6');
}

function seqStep(stepsShown) {
  // Bars shrink into place as each step appears; the first is always visible.
  const bars = document.querySelectorAll('#seq .support');
  bars.forEach((b, i) => {
    const h = +b.dataset.h;
    if (i <= stepsShown) gsap.to(b, { height: h, duration: d(0.8), ease: 'power2.out' });
    else gsap.set(b, { height: 0 });
  });
}

function seqCount() {
  return document.querySelectorAll('#seq .step.fragment.visible').length;
}

function flip(show) {
  const ans = document.querySelector('#flip .ans');
  const lrn = document.querySelector('#flip .lrn');
  if (show) {
    gsap.timeline()
      .to(lrn, { rotateY: -8, x: -14, duration: d(0.3), ease: 'power1.in' })
      .to(ans, { opacity: 1, duration: d(0.7), ease: 'power2.out' }, '<0.1')
      .to(lrn, { rotateY: 0, x: 0, duration: d(0.4) }, '<');
  } else {
    gsap.to(ans, { opacity: 0, duration: d(0.4) });
  }
}

function focusLenses(on) {
  const ring = document.getElementById('focus-ring');
  const lenses = document.querySelectorAll('#s-lenses .lens:not([data-fx="focus"])');
  if (on) {
    gsap.fromTo(ring, { scale: 1.9, opacity: 0 }, { scale: 1, opacity: 1, duration: d(1.1), ease: 'expo.out' });
    gsap.to(lenses, { opacity: 0.38, duration: d(0.6) });
  } else {
    gsap.to(ring, { opacity: 0, duration: d(0.3) });
    gsap.to(lenses, { clearProps: 'opacity', duration: d(0.3) });
  }
}

function timeline() {
  const card = document.querySelector('#s-predict .timeline-card');
  const tl = card.querySelector('.tl');
  let bar = tl.querySelector('.bar');
  if (!bar) { bar = document.createElement('span'); bar.className = 'bar'; tl.prepend(bar); }
  gsap.fromTo(card.querySelector('.tl-answer'), { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: d(0.6), ease: 'power2.out' });
  gsap.fromTo(bar, { scaleX: 0 }, { scaleX: 1, duration: d(1.6), ease: 'power1.inOut', delay: d(0.4) });
  gsap.fromTo(tl.querySelectorAll('.pt'), { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: d(0.5), stagger: d(0.3), delay: d(0.4) });
  gsap.fromTo(card.querySelectorAll('.facts .fact'), { opacity: 0 }, { opacity: 1, duration: d(0.5), stagger: d(0.15), delay: d(2) });
}

function grow(el) {
  gsap.fromTo(el, { scaleX: 0 }, { scaleX: 1, duration: d(0.6), ease: 'power2.out' });
}

/* ---------- Wire up ---------- */

const ON_SLIDE = {
  's-title': titleIn,
  's-explode': explode,
  's-map': placeMapHighlights,
  's-sequence': () => seqStep(seqCount()),
};

const ON_FRAGMENT = {
  'book-in': (f, shown) => { if (shown) bookIn(); },
  timeline: (f, shown) => { if (shown) timeline(); },
  seq: () => seqStep(seqCount()),
  flip: (f, shown) => flip(shown),
  focus: (f, shown) => focusLenses(shown),
  greyscale: (f, shown) => document.getElementById('pl-after').classList.toggle('on', shown),
  grow: (f, shown) => { if (shown) grow(f); },
};

buildStrands();
buildMap();
document.querySelectorAll('#seq .support').forEach((b) => { b.style.height = b.dataset.h + 'px'; });
splitText();

Reveal.initialize({
  width: 1920,
  height: 1080,
  margin: 0,
  minScale: 0.1,
  maxScale: 3,
  center: false,
  hash: true,
  controls: true,
  controlsTutorial: false,
  progress: true,
  transition: 'fade',
  transitionSpeed: 'default',
  backgroundTransition: 'fade',
  showNotes: false,
  plugins: [RevealNotes],
}).then(() => {
  const run = (slide) => { const fn = ON_SLIDE[slide.id]; if (fn) fn(); };
  run(Reveal.getCurrentSlide());
  Reveal.on('slidechanged', (e) => run(e.currentSlide));
  Reveal.on('resize', () => { if (Reveal.getCurrentSlide().id === 's-map') placeMapHighlights(); });
  Reveal.on('fragmentshown', (e) => { const fx = e.fragment.dataset.fx; if (ON_FRAGMENT[fx]) ON_FRAGMENT[fx](e.fragment, true); });
  Reveal.on('fragmenthidden', (e) => { const fx = e.fragment.dataset.fx; if (ON_FRAGMENT[fx]) ON_FRAGMENT[fx](e.fragment, false); });
  document.fonts.ready.then(() => { if (Reveal.getCurrentSlide().id === 's-map') placeMapHighlights(); });
});
