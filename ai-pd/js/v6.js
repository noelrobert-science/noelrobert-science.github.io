/* v0.6 read-alone talk: part map on every part slide, the fading-help bars, the page flip,
   the lens focus, an in-slide viewer, a Copy button, and the portrait-phone hint.
   With prefers-reduced-motion, effects jump to their end state. */

const RM = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const d = (s) => (RM ? 0 : s);
const PARTS = ['Is this any good?', "Will it harm my pupils' learning?", 'What makes the output good?',
  'What could it do in my week?', 'Is it safe, and what goes wrong?', 'How do I start?'];
const PART_START = ['p1-2', 'p2-1', 'p3-1', 'p4-1', 'p5-1', 'p6-1'];

/* ---------- Part map ---------- */
function buildPartMaps() {
  document.querySelectorAll('section[data-part]').forEach((s) => {
    const p = +s.dataset.part; if (!p) return;
    const nav = document.createElement('nav');
    nav.className = 'pmap'; nav.setAttribute('aria-label', 'The six questions');
    nav.innerHTML = PARTS.map((t, i) => `<a href="#/${PART_START[i]}" title="${i + 1}. ${t}" class="${i + 1 < p ? 'done' : i + 1 === p ? 'now' : ''}">${i + 1}</a>`).join('');
    s.appendChild(nav);
  });
  document.querySelectorAll('section[data-extra]:not([data-extra="shelf"])').forEach((s) => {
    const nav = document.createElement('nav');
    nav.className = 'xnav';
    nav.innerHTML = '<a href="#/x0">All extras</a><a href="#/p1-4">The six questions</a>';
    s.appendChild(nav);
  });
}

/* ---------- Effects ---------- */
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

const ON_SLIDE = { 'p3-4': seqStep };
const ON_FRAGMENT = {
  seq: seqStep,
  flip: (f, shown) => flip(shown),
  focus: (f, shown) => focusLenses(shown),
  greyscale2: (f, shown) => document.getElementById('pl-after2').classList.toggle('on', shown),
};

/* ---------- Viewer (booklets, studios, kit, demos) ---------- */
function setupViewer() {
  const v = document.createElement('div');
  v.className = 'viewer';
  v.innerHTML = '<button class="vout">Open outside the talk ↗</button><button class="vclose" aria-label="Close">×</button><div class="vbox"></div><div class="vnote">Esc or × to go back to the slides</div>';
  document.body.appendChild(v);
  const box = v.querySelector('.vbox');
  let current = '';
  const close = () => { v.classList.remove('on', 'phone'); box.innerHTML = ''; };
  v.querySelector('.vclose').addEventListener('click', close);
  v.querySelector('.vout').addEventListener('click', () => { if (current) window.open(current, '_blank', 'noopener'); });
  document.addEventListener('keydown', (e) => {
    if (v.classList.contains('on') && e.key === 'Escape') { close(); e.preventDefault(); e.stopImmediatePropagation(); }
  }, true);
  window.addEventListener('message', (e) => { if (e.data === 'ai-pd:close-view' && v.classList.contains('on')) close(); });
  const open = (url, fb, phone) => {
    current = url;
    v.classList.add('on'); v.classList.toggle('phone', !!phone);
    if (/^https?:/.test(url) && fb) {
      box.innerHTML = `<img src="${fb}" alt="Offline copy">`;
      fetch(url, { mode: 'no-cors', cache: 'no-store' }).then(() => { if (v.classList.contains('on')) box.innerHTML = `<iframe src="${url}" title="Live page"></iframe>`; }).catch(() => {});
    } else box.innerHTML = `<iframe src="${url}" title="Document"></iframe>`;
  };
  document.querySelectorAll('[data-view]').forEach((b) => b.addEventListener('click', (e) => {
    e.stopPropagation(); e.preventDefault();
    open(b.dataset.view, b.dataset.fallback, b.dataset.phone);
  }));
  document.querySelectorAll('.bcenter').forEach((c) => c.addEventListener('click', () => c.querySelector('.bopen').click()));
}

/* ---------- Copy button ---------- */
function setupCopy() {
  document.querySelectorAll('[data-copy]').forEach((b) => b.addEventListener('click', (e) => {
    e.stopPropagation();
    const src = document.getElementById(b.dataset.copy);
    const txt = [...src.childNodes].filter((n) => n.nodeType === 3).map((n) => n.textContent).join('').trim().replace(/^"|"$/g, '');
    const done = () => { b.textContent = 'Copied'; b.classList.add('ok'); setTimeout(() => { b.textContent = 'Copy'; b.classList.remove('ok'); }, 2200); };
    if (navigator.clipboard) navigator.clipboard.writeText(txt).then(done).catch(() => { window.prompt('Copy this:', txt); });
    else window.prompt('Copy this:', txt);
  }));
}

/* ---------- Start ---------- */
buildPartMaps();
setupViewer();
setupCopy();
document.querySelectorAll('#seq .support').forEach((b) => { b.style.height = b.dataset.h + 'px'; });
document.getElementById('turn-ok').addEventListener('click', () => document.getElementById('turn').classList.add('off'));

Reveal.initialize({
  width: 1920, height: 1080, margin: 0, minScale: 0.1, maxScale: 3,
  center: false, hash: true, controls: true, controlsTutorial: false, progress: true,
  slideNumber: false, transition: 'fade', backgroundTransition: 'fade', showNotes: false,
  plugins: [RevealNotes],
}).then(() => {
  const run = (s) => { const fn = ON_SLIDE[s.id]; if (fn) fn(s); };
  run(Reveal.getCurrentSlide());
  Reveal.on('slidechanged', (e) => run(e.currentSlide));
  Reveal.on('fragmentshown', (e) => { const fx = e.fragment.dataset.fx; if (ON_FRAGMENT[fx]) ON_FRAGMENT[fx](e.fragment, true); });
  Reveal.on('fragmenthidden', (e) => { const fx = e.fragment.dataset.fx; if (ON_FRAGMENT[fx]) ON_FRAGMENT[fx](e.fragment, false); });
});
