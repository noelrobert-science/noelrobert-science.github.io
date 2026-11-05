/* Deck events for the anonymous counter: which acts people reach, whether they reach the end, and video plays. Each counted once per visit. */
(function () {
  var seen = {};
  function once(name) { if (seen[name]) return; seen[name] = 1; if (window.gcEvent) window.gcEvent(name); }
  function hook() {
    if (!window.Reveal || !Reveal.isReady()) return setTimeout(hook, 500);
    Reveal.on('slidechanged', function (e) {
      var s = e.currentSlide; if (!s) return;
      if (s.dataset.opener !== undefined) once('deck: reached act ' + s.dataset.opener);
      if (s.id === 's-close') once('deck: reached the end');
    });
    var v = document.getElementById('ail-video');
    if (v) {
      v.addEventListener('play', function () { once('deck: video played'); });
      v.addEventListener('ended', function () { once('deck: video watched to the end'); });
    }
  }
  hook();
})();
