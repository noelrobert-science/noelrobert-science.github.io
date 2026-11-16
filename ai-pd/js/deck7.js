/* v0.7: one deck, six question-led parts, built for a teacher reading alone and for presenting.
   Keeps the v0.5 animations (the book exploding into its contents, the fading help bars, the page
   flip, the foundation chips, the live studios and demos) and adds the part map, the "Decide, then
   click" moments and the Copy button. Loaded after acts.js, v3.js, v4.js and v5.js.
   With prefers-reduced-motion, effects jump to their end state. */

const RM = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const d = (s) => (RM ? 0 : s);

/* ---------- Data ---------- */

// Coursebook contents: module, short name, number of sections.
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

// The six parts. acts.js's mini map reads [number, name] from here.
const ACTS = [
  [1, 'Is this any good?'],
  [2, "Will it harm my pupils' learning?"],
  [3, 'What makes the output good?'],
  [4, 'What could it do in my week?'],
  [5, 'Is it safe, and what goes wrong?'],
  [6, 'How do I start?'],
];
const PART_LINE = {
  1: 'The same AI made a weak page and a strong one. Decide which you would hand out.',
  2: 'What happened to nearly a thousand pupils when the AI was taken away.',
  3: 'The quality comes from the teacher’s rules, written down once.',
  4: 'Small jobs first, then where the same method can lead.',
  5: 'Pupil data, checking, my own mistakes, and what it costs.',
  6: 'One job to try, the words to paste, and one place where everything lives.',
};

/* ---------- Build markup ---------- */

// Part openers: the number, the question, one line, and the mini map. Replaces the act openers of v0.5.
buildOpeners = function () {
  document.querySelectorAll('section[data-opener]').forEach((s) => {
    const n = +s.dataset.opener;
    const name = ACTS.find((x) => x[0] === n)[1];
    const notes = s.querySelector('aside');
    s.insertAdjacentHTML('afterbegin', `
      <div class="frame">
        <div class="op-num">${n}</div>
        <div class="op-name">${name}</div>
        <div class="op-line">${PART_LINE[n]}</div>
      </div>
      ${miniMap(n)}`);
    if (notes) s.appendChild(notes);
  });
};

// Six numbered circles at the top right of every part slide: done parts ticked, the current one red.
function buildPartMaps() {
  document.querySelectorAll('section[data-part]').forEach((s) => {
    const p = +s.dataset.part; if (!p || s.dataset.opener !== undefined) return;
    const nav = document.createElement('nav');
    nav.className = 'pmap'; nav.setAttribute('aria-label', 'The six questions');
    nav.innerHTML = ACTS.map(([n, t]) => `<a href="#/s-a${n}" title="${n}. ${t}" class="${n < p ? 'done' : n === p ? 'now' : ''}">${n}</a>`).join('');
    s.appendChild(nav);
  });
}

function buildStrands() {
  const host = document.getElementById('strand-rows'); if (!host) return;
  host.innerHTML = STRANDS.map((s) => `
    <div class="srow" style="--c:${s.c}">
      <div class="strand-name">${s.name}</div>
      <div class="tiles">${s.mods.map(([n, nm, k]) => `
        <div class="tile"><span class="num">${n}</span><span class="nm">${nm}</span>
          <span class="dots">${'<i></i>'.repeat(k)}</span></div>`).join('')}
      </div>
    </div>`).join('');
}

function splitText() {
  document.querySelectorAll('[data-split]').forEach((p) => {
    const words = p.textContent.replace(/ /g, ' ').trim().split(' ');
    p.innerHTML = words.map((w) => `<span class="w">${[...w].map((ch) => `<span class="ch">${ch}</span>`).join('')}</span>`).join(' ');
  });
}

// Generic "open in place" buttons that v5.js does not already bind.
function bindOpeners() {
  document.querySelectorAll('[data-view]:not(.hublink):not(.bopen):not(.ail-cover):not(.ail-chip):not(.tile6)').forEach((b) => {
    b.addEventListener('click', (e) => { e.stopPropagation(); e.preventDefault(); openView(b.dataset.view, b.dataset.fallback, b.dataset.phone); });
  });
}

// A click anywhere on a slide moves on, because this talk is made to be read alone.
// Anything a reader can actually use (a link, a button, a demo, the video) is left alone,
// and so is a click that was really a text selection.
function setupClickToAdvance() {
  const KEEP = 'a, button, input, select, textarea, iframe, video, label, .viewer, .livebox, .bcenter, .backpill, [data-view], [data-tab], [data-copy], .pmap, .qmap, .shelf, .hubgrid';
  document.querySelector('.reveal .slides').addEventListener('click', (e) => {
    if (e.target.closest(KEEP)) return;
    if (document.querySelector('.viewer.on')) return;
    if (String(window.getSelection() || '').length > 2) return;
    if (document.body.classList.contains('ail-max') || window.__ailMax) return;
    Reveal.next();
  });
}

function setupCopy() {
  document.querySelectorAll('[data-copy]').forEach((b) => b.addEventListener('click', (e) => {
    e.stopPropagation();
    const src = document.getElementById(b.dataset.copy);
    const txt = [...src.childNodes].filter((n) => n.nodeType === 3).map((n) => n.textContent).join('').trim().replace(/^"|"$/g, '');
    const done = () => { b.textContent = 'Copied'; b.classList.add('ok'); setTimeout(() => { b.textContent = 'Copy'; b.classList.remove('ok'); }, 2200); };
    // execCommand first: it is the one that still works from a folder on disk (file://),
    // where the newer clipboard API is blocked.
    let ok = false;
    try {
      const ta = document.createElement('textarea');
      ta.value = txt; ta.setAttribute('readonly', '');
      ta.style.cssText = 'position:fixed;top:0;left:0;opacity:0';
      document.body.appendChild(ta); ta.select(); ta.setSelectionRange(0, txt.length);
      ok = document.execCommand('copy');
      document.body.removeChild(ta);
    } catch (err) { ok = false; }
    if (ok) { done(); return; }
    if (navigator.clipboard) navigator.clipboard.writeText(txt).then(done).catch(() => { window.prompt('Copy this:', txt); });
    else window.prompt('Copy this:', txt);
  }));
}

/* ---------- Animations ---------- */

function kinetic(el) {
  const chars = el.querySelectorAll('.ch');
  gsap.fromTo(chars, { yPercent: 110, opacity: 0, rotateX: -70 },
    { yPercent: 0, opacity: 1, rotateX: 0, duration: d(0.7), ease: 'power3.out', stagger: d(0.022) });
}

function titleIn() { kinetic(document.querySelector('#s-title .kt.first')); }

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

function seqStep() {
  const shown = document.querySelectorAll('#seq .step.fragment.visible').length;
  document.querySelectorAll('#seq .support').forEach((b, i) => {
    if (i <= shown) gsap.to(b, { height: +b.dataset.h, duration: d(0.8), ease: 'power2.out' });
    else gsap.set(b, { height: 0 });
  });
}

function flip(show) {
  const ans = document.querySelector('#flip .ans'), lrn = document.querySelector('#flip .lrn');
  if (show) {
    gsap.timeline().to(lrn, { rotateY: -8, x: -14, duration: d(0.3), ease: 'power1.in' })
      .to(ans, { opacity: 1, duration: d(0.7), ease: 'power2.out' }, '<0.1')
      .to(lrn, { rotateY: 0, x: 0, duration: d(0.4) }, '<');
  } else gsap.to(ans, { opacity: 0, duration: d(0.4) });
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

function grow(el) { gsap.fromTo(el, { scaleX: 0 }, { scaleX: 1, duration: d(0.6), ease: 'power2.out' }); }

/* ---------- Wire up ---------- */

const ON_SLIDE = {
  's-title': titleIn,
  's-explode': explode,
  's-sequence': seqStep,
};

const ON_FRAGMENT = {
  'book-in': (f, shown) => { if (shown) bookIn(); },
  seq: seqStep,
  flip: (f, shown) => flip(shown),
  focus: (f, shown) => focusLenses(shown),
  greyscale: (f, shown) => document.getElementById('pl-after').classList.toggle('on', shown),
  grow: (f, shown) => { if (shown) grow(f); },
};

// The foundation slide's panel text, without anything about pupil names.
if (typeof FD_TEXT !== 'undefined') {
  FD_TEXT.hub = ['One rules page', "It's like the induction pack every new teacher gets: one file of my rules that the AI reads before it starts. My house style, never overwrite a delivered file, check your own work. I stopped repeating myself in every chat."];
  FD_TEXT.gh = ['A home online', 'A free home for those folders, which also turns a folder into a website. That is how pupils open the studios, and how this talk is online.'];
}

if (typeof buildActs === 'function') { buildActs(); Object.assign(ON_SLIDE, ACT_SLIDE); Object.assign(ON_FRAGMENT, ACT_FRAGMENT); }
buildPartMaps();
buildStrands();
bindOpeners();
setupCopy();
setupClickToAdvance();
document.querySelectorAll('#seq .support').forEach((b) => { b.style.height = b.dataset.h + 'px'; });
splitText();
const turnOk = document.getElementById('turn-ok');
if (turnOk) turnOk.addEventListener('click', () => document.getElementById('turn').classList.add('off'));

Reveal.initialize({
  width: 1920, height: 1080, margin: 0, minScale: 0.1, maxScale: 3,
  center: false, hash: true, controls: true, controlsTutorial: false, progress: true,
  transition: 'fade', transitionSpeed: 'default', backgroundTransition: 'fade', showNotes: false,
  plugins: [RevealNotes, RevealZoom],
}).then(() => {
  const run = (slide) => { const fn = ON_SLIDE[slide.id]; if (fn) fn(slide); };
  run(Reveal.getCurrentSlide());
  Reveal.on('slidechanged', (e) => run(e.currentSlide));
  Reveal.on('fragmentshown', (e) => { const fx = e.fragment.dataset.fx; if (ON_FRAGMENT[fx]) ON_FRAGMENT[fx](e.fragment, true); });
  Reveal.on('fragmenthidden', (e) => { const fx = e.fragment.dataset.fx; if (ON_FRAGMENT[fx]) ON_FRAGMENT[fx](e.fragment, false); });
});
