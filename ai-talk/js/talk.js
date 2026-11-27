/* The light talk (/ai-talk/): 14 slides. Reuses the logbook's look (../ai-pd/css) and its marking
   slider and chart (../ai-pd/js/v8.js), but keeps its own small set of behaviours here, so the
   logbook's scripts and slide ids can change without breaking this talk.
   With prefers-reduced-motion, effects jump to their end state. */
(function () {
  const RM = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const d = (s) => (RM ? 0 : s);

  /* ---------- Open in place: one overlay for every link (Esc or × returns) ---------- */
  const v = document.createElement('div');
  v.className = 'viewer';
  v.innerHTML = '<button class="vout">Open outside the talk ↗</button><button class="vclose" aria-label="Close">×</button><div class="vbox"></div><div class="vnote">Esc or × to go back to the slides</div>';
  document.body.appendChild(v);
  const box = v.querySelector('.vbox');
  let current = '';
  const closeView = () => { v.classList.remove('on'); box.innerHTML = ''; };
  v.querySelector('.vclose').addEventListener('click', closeView);
  v.querySelector('.vout').addEventListener('click', () => { if (current) window.open(current, '_blank', 'noopener'); });
  window.openView = (url) => { current = url; v.classList.add('on'); box.innerHTML = `<iframe src="${url}" title="Opened in place"></iframe>`; };
  document.querySelectorAll('[data-view]').forEach((b) => b.addEventListener('click', (e) => {
    e.stopPropagation(); e.preventDefault(); openView(b.dataset.view);
  }));
  window.addEventListener('message', (e) => { if (e.data === 'ai-pd:close-view' && v.classList.contains('on')) closeView(); });

  /* ---------- The class analysis card on the marking slide (opens in place) ---------- */
  const card = document.getElementById('an-card'), anOpen = document.getElementById('an-open');
  const showCard = (on) => { if (!card) return; card.hidden = !on; card.parentNode.classList.toggle('card-on', on); if (on) document.getElementById('an-x').focus(); };
  if (card && anOpen) {
    anOpen.addEventListener('click', (e) => { e.stopPropagation(); showCard(true); });
    document.getElementById('an-x').addEventListener('click', (e) => { e.stopPropagation(); showCard(false); });
    card.addEventListener('click', (e) => e.stopPropagation());
  }

  // Esc closes whatever is open in place, before reveal.js sees the key.
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    if (v.classList.contains('on')) { closeView(); e.preventDefault(); e.stopImmediatePropagation(); return; }
    if (card && !card.hidden) { showCard(false); e.preventDefault(); e.stopImmediatePropagation(); }
  }, true);

  /* ---------- Copy button ---------- */
  document.querySelectorAll('[data-copy]').forEach((b) => b.addEventListener('click', (e) => {
    e.stopPropagation();
    const src = document.getElementById(b.dataset.copy);
    const txt = [...src.childNodes].filter((n) => n.nodeType === 3).map((n) => n.textContent).join('').trim().replace(/^"|"$/g, '');
    const done = () => { b.textContent = 'Copied'; b.classList.add('ok'); setTimeout(() => { b.textContent = 'Copy'; b.classList.remove('ok'); }, 2200); };
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
    if (navigator.clipboard) navigator.clipboard.writeText(txt).then(done).catch(() => window.prompt('Copy this:', txt));
    else window.prompt('Copy this:', txt);
  }));

  /* ---------- A click on a slide moves on; anything usable is left alone ---------- */
  const KEEP = 'a, button, input, select, textarea, iframe, video, label, .viewer, .an-card, .mk-compare, [data-view], [data-copy]';
  document.querySelector('.reveal .slides').addEventListener('click', (e) => {
    if (e.target.closest(KEEP)) return;
    if (v.classList.contains('on') || (card && !card.hidden)) return;
    if (String(window.getSelection() || '').length > 2) return;
    Reveal.next();
  });

  const turnOk = document.getElementById('turn-ok');
  if (turnOk) turnOk.addEventListener('click', () => document.getElementById('turn').classList.add('off'));

  /* ---------- Animations ---------- */
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

  // Practice soared, learning sank: the practice bars dim, the exam bar drops below the line, the arrow draws.
  function bst(on) {
    const svg = document.getElementById('bst');
    const prac = svg.querySelectorAll('.bst-practice rect');
    const drop = svg.querySelector('.bst-drop'), arc = svg.querySelector('.bst-arc');
    if (!on) { gsap.to(prac, { opacity: 1, duration: d(0.3) }); return; }
    gsap.to(prac, { opacity: 0.55, duration: d(0.6) });
    gsap.fromTo(drop, { attr: { height: 0 } }, { attr: { height: 25 }, duration: d(0.9), ease: 'bounce.out', delay: d(0.5) });
    const len = arc.getTotalLength();
    gsap.fromTo(arc, { strokeDasharray: len, strokeDashoffset: len }, { strokeDashoffset: 0, duration: d(0.9), ease: 'power2.inOut' });
  }

  const ON_FRAGMENT = {
    focus: (f, shown) => focusLenses(shown),
    bst: (f, shown) => bst(shown),
  };

  /* ---------- Anonymous counter events for this talk (counted once per visit) ---------- */
  const seen = {};
  const once = (n) => { if (seen[n]) return; seen[n] = 1; if (window.gcEvent) window.gcEvent(n); };

  Reveal.initialize({
    width: 1920, height: 1080, margin: 0, minScale: 0.1, maxScale: 3,
    center: false, hash: true, controls: true, controlsTutorial: false, progress: true,
    slideNumber: 'c/t',
    transition: 'fade', transitionSpeed: 'default', backgroundTransition: 'fade', showNotes: false,
    plugins: [RevealNotes, RevealZoom],
  }).then(() => {
    Reveal.on('fragmentshown', (e) => { const fx = e.fragment.dataset.fx; if (ON_FRAGMENT[fx]) ON_FRAGMENT[fx](e.fragment, true); });
    Reveal.on('fragmenthidden', (e) => { const fx = e.fragment.dataset.fx; if (ON_FRAGMENT[fx]) ON_FRAGMENT[fx](e.fragment, false); });
    Reveal.on('slidechanged', (e) => {
      if (card && !card.hidden) showCard(false);
      if (e.currentSlide && e.currentSlide.id === 's-close') once('talk: reached the end');
    });
    const g7 = document.getElementById('g7-video');
    if (g7) {
      g7.addEventListener('play', () => once('talk: g7 video played'));
      g7.addEventListener('click', (e) => e.stopPropagation());
      Reveal.on('slidechanged', (e) => { if (e.currentSlide && e.currentSlide.id !== 's-scale' && !g7.paused) g7.pause(); });
    }
  });
})();
