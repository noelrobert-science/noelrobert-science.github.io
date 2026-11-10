/* v0.6 (10 Nov 2026): the week timeline, the guards' support bars and the 90-second video.
   Loaded after v5.js and before deck.js; adds to ACT_SLIDE and ACT_FRAGMENT. */

/* Week timeline (simple): each click adds the next step and the red bar grows to its dot. */
function wkStep() {
  const box = document.getElementById('wk'); if (!box) return;
  const n = box.querySelectorAll('.wk2-col.fragment.visible').length; // 0..4
  gsap.to(box.querySelector('.wk2-fill'), { scaleX: n / 4, duration: d(0.8), ease: 'power2.inOut' });
  const last = box.querySelectorAll('.wk2-col')[n];
  if (last && last.dataset.anim !== String(n)) { last.dataset.anim = String(n); gsap.fromTo(last.querySelector('.wk2-pic'), { y: 40, opacity: 0 }, { y: 0, opacity: 1, duration: d(0.6), delay: d(0.2), ease: 'power3.out' }); }
}

/* Guards: the same shrinking support bars as Act 2. */
function seq2Step() {
  const sec = document.getElementById('seq2'); if (!sec) return;
  const shown = sec.querySelectorAll('.step.fragment.visible').length;
  sec.querySelectorAll('.support').forEach((b, i) => {
    if (i <= shown) gsap.to(b, { height: +b.dataset.h, duration: d(0.8), ease: 'power2.out' });
    else gsap.set(b, { height: 0 });
  });
}

/* 90-second video: Play/Space toggles; if the file isn't there yet, say so instead of failing. */
function setupWeekVideo() {
  const v = document.getElementById('wv-video'), b = document.getElementById('wv-play'); if (!v) return;
  const box = v.parentNode, soon = box.querySelector('.wv-soon');
  const missing = () => { soon.hidden = false; b.hidden = true; };
  const src = v.querySelector('source');
  if (src) src.addEventListener('error', missing);
  v.addEventListener('error', missing);
  if (location.protocol !== 'file:') fetch('video/week/week.mp4', { method: 'HEAD', cache: 'no-store' }).then((r) => { if (!r.ok) missing(); }).catch(() => {});
  const toggle = (e) => { if (e) e.stopPropagation(); if (!soon.hidden) return; if (v.paused) { v.play(); box.classList.add('playing'); } else { v.pause(); box.classList.remove('playing'); } };
  b.addEventListener('click', toggle); v.addEventListener('click', toggle);
  // captions are burned into the picture; the caption file is there for screen readers
  try { v.textTracks[0].mode = 'hidden'; } catch (e) {}
  Reveal.on('slidechanged', (e) => { if (e.previousSlide && e.previousSlide.id === 's-weekvid' && !v.paused) { v.pause(); box.classList.remove('playing'); } });
  window.addEventListener('keydown', (e) => {
    if ((e.key === ' ' || e.code === 'Space') && Reveal.getCurrentSlide && Reveal.getCurrentSlide().id === 's-weekvid' && soon.hidden) { e.preventDefault(); e.stopImmediatePropagation(); toggle(); }
  }, true);
}

ACT_SLIDE['s-week'] = () => { wkStep(); };
ACT_SLIDE['s-guards'] = () => seq2Step();
ACT_FRAGMENT.wk = () => wkStep();
ACT_FRAGMENT.seq2 = () => seq2Step();
const _buildActsV6 = buildActs;
buildActs = function () {
  _buildActsV6();
  document.querySelectorAll('#seq2 .support').forEach((b) => { b.style.height = b.dataset.h + 'px'; });
  document.querySelectorAll('.bcenter.vshot').forEach((c) => c.classList.add('opens'));
  setTimeout(setupWeekVideo, 0);
};
