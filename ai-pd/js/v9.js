/* v0.9: the Grade 7 lesson video (s-g7-videos). Counted once per visit, like the other deck video; paused when the slide is left. */
(function () {
  const v = document.getElementById('g7-video');
  if (!v) return;
  let counted = false;
  v.addEventListener('play', () => { if (!counted && window.gcEvent) { counted = true; window.gcEvent('deck: g7 video played'); } });
  v.addEventListener('click', (e) => e.stopPropagation());
  if (window.Reveal) Reveal.on('slidechanged', (e) => { if (e.currentSlide && e.currentSlide.id !== 's-g7-videos' && !v.paused) v.pause(); });
})();
