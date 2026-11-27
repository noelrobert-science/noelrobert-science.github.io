/* v0.10: the two "Try it" voice buttons on s-voice-once. One clip plays at a time; a second press stops it; leaving the slide stops it. */
(function () {
  const btns = [...document.querySelectorAll('#s-voice-once .vo-play')];
  if (!btns.length) return;
  const audio = new Audio(); audio.preload = 'none';
  let cur = null;
  const stop = () => { audio.pause(); audio.currentTime = 0; if (cur) { cur.classList.remove('on'); cur.querySelector('.ic').textContent = '▶'; } cur = null; };
  audio.addEventListener('ended', stop);
  btns.forEach((b) => b.addEventListener('click', (e) => {
    e.stopPropagation();
    if (cur === b) { stop(); return; }
    stop(); cur = b; b.classList.add('on'); b.querySelector('.ic').textContent = '■';
    audio.src = b.dataset.src; audio.play().catch(stop);
    if (window.gcEvent) window.gcEvent('deck: voice try ' + (b.dataset.src.includes('mr-r') ? 'mr-r' : 'leah'));
  }));
  if (window.Reveal) Reveal.on('slidechanged', (e) => { if (!e.currentSlide || e.currentSlide.id !== 's-voice-once') stop(); });
  window.__voTry = { audio, stop };
})();
