/* v0.5: the in-slide viewer for "Everything in one place", and "Guide p. X" tags on slides
   where the guide goes deeper. Loaded after v4.js. */

const GUIDE_TAGS = {
  's-journey': 'Guide p. 3', 's-mistakes': 'Guide pp. 5–6', 's-foundation': 'Guide p. 7',
  's-generic': 'Guide pp. 4–5', 's-lenses': 'Guide p. 4', 's-plumbing': 'Guide pp. 4–5',
  's-canvas-fill': 'Guide pp. 8–9', 's-remote': 'Guide pp. 8–9, 11–12', 's-compare': 'Guide pp. 12–14',
  's-where': 'Guide pp. 11–12', 's-dials': 'Guide p. 10', 's-own': 'Guide pp. 15–16', 's-safe': 'Guide p. 16',
  's-steps': 'Guide p. 7 and pp. 16–17', 's-toolbox': 'Web guide: Your toolbox',
};

function addGuideTags() {
  Object.entries(GUIDE_TAGS).forEach(([id, txt]) => {
    const s = document.getElementById(id);
    if (!s || s.querySelector('.gtag')) return;
    const src = s.querySelector('.src'); if (src) src.style.display = 'none';
    const t = document.createElement('div'); t.className = 'gtag'; t.textContent = txt; s.appendChild(t);
  });
}

function setupViewer() {
  const v = document.createElement('div');
  v.className = 'viewer';
  v.innerHTML = '<button class="vout">Open outside the deck ↗</button><button class="vclose" aria-label="Close">×</button><div class="vbox"></div><div class="vnote">Esc or × to go back to the slides</div>';
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
  window.openView = (url, fb, phone) => {
    current = url;
    v.classList.add('on'); v.classList.toggle('phone', !!phone);
    if (/^https?:/.test(url) && fb) {
      box.innerHTML = `<img src="${fb}" alt="Offline copy">`;
      fetch(url, { mode: 'no-cors', cache: 'no-store' }).then(() => { if (v.classList.contains('on')) box.innerHTML = `<iframe src="${url}" title="Live page"></iframe>`; }).catch(() => {});
    } else {
      box.innerHTML = `<iframe src="${url}" title="Document"></iframe>`;
    }
  };
  document.querySelectorAll('.hublink, .bopen').forEach((b) => b.addEventListener('click', (e) => {
    e.stopPropagation();
    if (b.dataset.tab) { window.open(b.dataset.tab, '_blank', 'noopener'); return; }
    openView(b.dataset.view, b.dataset.fallback, b.dataset.phone);
  }));
  document.querySelectorAll('.bcenter').forEach((c) => c.addEventListener('click', () => c.querySelector('.bopen').click()));
}

function bStep(slide) {
  const steps = [...slide.querySelectorAll('.bs')];
  const vis = steps.filter((x) => x.classList.contains('visible'));
  const last = vis[vis.length - 1];
  steps.forEach((x) => x.classList.toggle('cur', x === last));
  if (!last || last.dataset.anim) return;
  last.dataset.anim = '1';
  const c = slide.querySelector('.bcenter'), scale = Reveal.getScale() || 1;
  const cr = c.getBoundingClientRect(), r = last.getBoundingClientRect();
  gsap.fromTo(last, { x: (cr.left + cr.width / 2 - r.left - r.width / 2) / scale, y: (cr.top + cr.height / 2 - r.top - r.height / 2) / scale, scale: 0.3, opacity: 0 },
    { x: 0, y: 0, scale: 1, opacity: 1, duration: d(0.8), ease: 'back.out(1.4)', clearProps: 'opacity' });
}

function tilesIn() {
  gsap.fromTo('#tiles6 .tile6', { y: 60, opacity: 0, rotate: -2 }, { y: 0, opacity: 1, rotate: 0, duration: d(0.6), stagger: d(0.15), ease: 'back.out(1.6)' });
}

ACT_FRAGMENT.bstep = (f) => bStep(f.closest('section'));
ACT_SLIDE['s-samemonth'] = tilesIn;
ACT_SLIDE['s-dash'] = (s) => bStep(s);
ACT_SLIDE['s-staff'] = (s) => bStep(s);

const _buildActs4 = buildActs;
buildActs = function () { _buildActs4(); addGuideTags(); setupViewer(); };

/* AI literacy slide: each click flips open a real spread with its idea as the caption. */
const AIL = [
  ['senior-1', 'How the models work, <em>and five ways they fail</em>'],
  ['senior-2', '"How strong is this study?" <em>Judge the evidence like a scientist</em>'],
  ['senior-3', 'What SA universities now do: <em>UCT dropped AI detectors, oral defences are back, declare your AI use</em>'],
  ['senior-3', 'Career data from the <em>World Economic Forum</em>'],
  ['senior-4', 'The IEB declaration, <em>and deepfakes are a crime</em>'],
  ['senior-5', 'At the end, learners write <em>their own AI policy</em>'],
];
function ailShow() {
  const slide = document.getElementById('s-ailit'); if (!slide) return;
  const vis = [...slide.querySelectorAll('.fragment.visible[data-ail]')];
  const k = vis.length ? +vis[vis.length - 1].dataset.ail : -1;
  const img = document.getElementById('ail-img'), cap = document.getElementById('ail-cap');
  const [src, txt] = k >= 0 ? AIL[k] : ['senior-1', 'Two booklets, written 28 Oct. <em>Click a cover to flip through sample spreads.</em>'];
  const next = 'demo/booklets/' + src + '.jpg';
  cap.innerHTML = txt;
  if (!img.src.endsWith(next)) gsap.timeline().to(img, { rotateY: -80, opacity: 0, duration: d(0.25), ease: 'power1.in', onComplete: () => { img.src = next; } }).to(img, { rotateY: 0, opacity: 1, duration: d(0.4), ease: 'power2.out' });
}
ACT_FRAGMENT.ail = () => ailShow();
delete ACT_SLIDE['s-ailit']; // the spread-flip clicks were replaced by the video (v0.5)
const _buildActs5 = buildActs;
buildActs = function () {
  _buildActs5();
  document.querySelectorAll('.ail-cover, .ail-chip').forEach((b) => b.addEventListener('click', (e) => { e.stopPropagation(); openView(b.dataset.view); }));
  document.querySelectorAll('.tile6[data-view]').forEach((t) => t.addEventListener('click', (e) => { e.stopPropagation(); openView(t.dataset.view); }));
};

/* AI literacy video: click to play or pause, captions added in code (works offline from file://). */
const AIL_CUES = window.AIL_CUES || [];
function setupAilVideo() {
  const v = document.getElementById('ail-video'), b = document.getElementById('ail-play'); if (!v) return;
  // captions start hidden (the text is already on screen); the CC chip shows them
  let tr = null; try { tr = v.addTextTrack('captions', 'English', 'en'); AIL_CUES.forEach(([a, z, s]) => { const c = new VTTCue(a, z, s); c.line = -3; tr.addCue(c); }); tr.mode = 'hidden'; } catch (e) {}
  const toggle = (e) => { e && e.stopPropagation(); if (v.paused) { v.play(); v.parentNode.classList.add('playing'); } else { v.pause(); v.parentNode.classList.remove('playing'); } };
  b.addEventListener('click', toggle); v.addEventListener('click', toggle);
  // Space plays or pauses the video while this slide is showing; elsewhere it still moves on
  window.__ailSpace = () => { if (Reveal.getCurrentSlide().id === 's-ailit') toggle(); else Reveal.next(); };
  // chapter dots under the video: click to jump; the current chapter is lit
  const row = document.getElementById('ail-chapters');
  if (row && window.AIL_CHAPTERS) {
    AIL_CHAPTERS.forEach(([a, z, name], i) => {
      const d = document.createElement('button'); d.className = 'ail-dot'; d.type = 'button'; d.dataset.a = a; d.dataset.z = z;
      d.innerHTML = `<i></i><span>${i + 1} · ${name}</span>`;
      d.addEventListener('click', (e) => { e.stopPropagation(); v.currentTime = a + 0.05; if (v.paused) toggle(); });
      row.appendChild(d);
    });
    const cc = document.createElement('button'); cc.className = 'ail-dot ail-cc'; cc.type = 'button'; cc.textContent = 'CC';
    cc.addEventListener('click', (e) => { e.stopPropagation(); if (tr) { tr.mode = tr.mode === 'showing' ? 'hidden' : 'showing'; cc.classList.toggle('on', tr.mode === 'showing'); } });
    row.appendChild(cc);
    v.addEventListener('timeupdate', () => row.querySelectorAll('.ail-dot[data-a]').forEach((d) => d.classList.toggle('on', v.currentTime >= +d.dataset.a && v.currentTime < +d.dataset.z)));
  }
  v.addEventListener('ended', () => v.parentNode.classList.remove('playing'));
  Reveal.on('slidechanged', () => { if (!v.paused) { v.pause(); v.parentNode.classList.remove('playing'); } });
}
const _buildActs6 = buildActs;
buildActs = function () { _buildActs6(); setupAilVideo(); };

/* v0.5.1: a "Back to slide N" pill after any jump that skips slides; Backspace goes back too.
   Also tags every clickable card with a small "Open ▸" cue. */
function setupBackPill() {
  const pill = document.createElement('button');
  pill.className = 'backpill'; pill.type = 'button';
  document.body.appendChild(pill);
  let from = null;
  const hide = () => { from = null; pill.classList.remove('on'); };
  const goBack = () => { if (from === null) return false; const t = from; hide(); Reveal.slide(t); return true; };
  pill.addEventListener('click', goBack);
  Reveal.on('slidechanged', (e) => {
    const prev = e.previousSlide ? Reveal.getIndices(e.previousSlide).h : null;
    if (prev === null) return;
    if (Math.abs(e.indexh - prev) > 1) { from = prev; pill.textContent = '↩ Back to slide ' + (prev + 1); pill.classList.add('on'); }
    else hide(); // any ordinary step forward or back clears it
  });
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Backspace' || /INPUT|TEXTAREA/.test(document.activeElement.tagName)) return;
    const vw = document.querySelector('.viewer.on'); if (vw) return;
    if (goBack()) { e.preventDefault(); e.stopImmediatePropagation(); }
  }, true);
}
function tagOpeners() {
  document.querySelectorAll('.tile6[data-view], .hublink, .ail-cover, .bcenter').forEach((el) => el.classList.add('opens'));
}
const _buildActs7 = buildActs;
buildActs = function () {
  _buildActs7(); tagOpeners(); setupBackPill();
  // reveal.js normally uses P for "previous"; here it toggles the progress bar instead
  // one keyboard map (Reveal.configure replaces it whole): P toggles the progress bar; Space plays the AI literacy video on its slide
  Reveal.configure({ keyboard: { 80: () => document.body.classList.toggle('no-progress'), 32: () => (window.__ailSpace ? window.__ailSpace() : Reveal.next()) } });
};
