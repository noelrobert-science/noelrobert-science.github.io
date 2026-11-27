/* "Model an answer" slide (s-model-answer): self-contained behaviour.
   - Each step fragment (data-ma-step="1..5") lights up its part of the answer page.
   - The last fragment (data-ma-step="6") hides the steps and leaves the full page.
   - Clicking the page opens it large in place; Esc, a click or × closes it.
   Needs reveal.js already loaded (window.Reveal). Load after the deck has called Reveal.initialize, or before: it waits. */
(function () {
  function sync(sec) {
    var shown = sec.querySelectorAll('.fragment.visible[data-ma-step]'), n = 0;
    shown.forEach(function (f) { n = Math.max(n, +f.dataset.maStep); });
    sec.setAttribute('data-step', String(n));
  }
  function lightbox() {
    var lb = document.querySelector('.ma-lb');
    if (lb) return lb;
    lb = document.createElement('div'); lb.className = 'ma-lb'; lb.setAttribute('role', 'dialog'); lb.setAttribute('aria-modal', 'true');
    lb.innerHTML = '<img alt=""><button type="button" aria-label="Close">×</button><div class="ma-lb-h">Esc or click to close</div>';
    lb.addEventListener('click', function () { lb.classList.remove('on'); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && lb.classList.contains('on')) { e.stopPropagation(); e.preventDefault(); lb.classList.remove('on'); } }, true);
    document.body.appendChild(lb);
    return lb;
  }
  function wire() {
    document.querySelectorAll('section.ma').forEach(function (sec) {
      var page = sec.querySelector('.ma-page');
      if (page && !page.dataset.maWired) {
        page.dataset.maWired = '1';
        page.addEventListener('click', function (e) {
          e.stopPropagation();
          var lb = lightbox(), img = page.querySelector('img');
          lb.querySelector('img').src = img.dataset.full || img.src; lb.querySelector('img').alt = img.alt;
          lb.classList.add('on');
        });
      }
      sync(sec);
    });
  }
  function start() {
    var R = window.Reveal;
    if (!R || !R.on) { setTimeout(start, 120); return; }
    wire();
    ['fragmentshown', 'fragmenthidden', 'slidechanged', 'ready'].forEach(function (ev) {
      R.on(ev, function () { document.querySelectorAll('section.ma').forEach(sync); });
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
