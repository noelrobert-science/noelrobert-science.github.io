/* Grade 7 showcase deck: reveal.js set-up (same canvas as the AI PD deck), page lightbox, video voice picker. */
(function () {
  var lb = document.getElementById('sc-lb'), lbImg = lb.querySelector('img');
  function open(src, alt) { lbImg.src = src; lbImg.alt = alt || ''; lb.classList.add('on'); lb.querySelector('button').focus(); }
  function close() { lb.classList.remove('on'); }
  lb.addEventListener('click', close);
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && lb.classList.contains('on')) { e.preventDefault(); e.stopPropagation(); close(); }
  }, true);
  document.querySelectorAll('[data-full]').forEach(function (b) {
    b.addEventListener('click', function (e) {
      e.preventDefault(); e.stopPropagation();
      var img = b.querySelector('img'); open(b.dataset.full, img ? img.alt : '');
      if (window.gcEvent) window.gcEvent('g7-showcase-open-' + b.dataset.full.replace(/^img\//, ''));
    });
  });

  // video: load the player only when its slide is shown; voice buttons swap the clip
  var vf = document.getElementById('vframe');
  function loadClip(c) { vf.src = '../clips/g7/play.html?c=' + c + '&embed=1'; }
  document.querySelectorAll('.voices button').forEach(function (b) {
    b.addEventListener('click', function () {
      document.querySelectorAll('.voices button').forEach(function (x) { x.classList.toggle('on', x === b); });
      loadClip(b.dataset.c);
      if (window.gcEvent) window.gcEvent('g7-showcase-voice-' + b.dataset.c);
    });
  });
  function onSlide(s) {
    if (s && s.id === 's-try' && !vf.getAttribute('src')) loadClip(document.querySelector('.voices button.on').dataset.c);
    if (hearAudio && !hearAudio.paused && s && s.id !== 's-why') hearAudio.pause();
    if (s && s.id !== 's-try' && vf.getAttribute('src')) { try { vf.contentWindow.document.querySelectorAll('video').forEach(function (v) { v.pause(); }); } catch (e) {} }
  }

  // full screen: button + F key hint on the cover; hidden when already full screen or not supported (e.g. iPhone)
  var fsHint = document.querySelector('.fs-hint'), fsBtn = document.getElementById('fs-btn');
  var root = document.documentElement;
  var canFs = !!(document.fullscreenEnabled || document.webkitFullscreenEnabled) && !!(root.requestFullscreen || root.webkitRequestFullscreen);
  function fsSync() { if (fsHint) fsHint.classList.toggle('off', !canFs || !!(document.fullscreenElement || document.webkitFullscreenElement)); }
  if (fsBtn) fsBtn.addEventListener('click', function (e) {
    e.stopPropagation();
    var p = root.requestFullscreen ? root.requestFullscreen() : root.webkitRequestFullscreen();
    if (p && p.catch) p.catch(function () {});
  });
  document.addEventListener('fullscreenchange', fsSync); document.addEventListener('webkitfullscreenchange', fsSync); fsSync();

  // slide 5: "hear it" plays just the one sentence from the video
  var hear = document.getElementById('hear-it'), hearAudio = null, hearStop = null;
  if (hear) hear.addEventListener('click', function (e) {
    e.stopPropagation();
    if (!hearAudio) { hearAudio = new Audio(hear.dataset.src); hearAudio.preload = 'auto'; }
    var from = +hear.dataset.from, to = +hear.dataset.to;
    clearInterval(hearStop);
    var go = function () { hearAudio.currentTime = from; hearAudio.play().catch(function () {}); hear.classList.add('playing');
      hearStop = setInterval(function () { if (hearAudio.currentTime >= to || hearAudio.paused) { hearAudio.pause(); clearInterval(hearStop); hear.classList.remove('playing'); } }, 100); };
    if (hearAudio.readyState >= 1) go(); else hearAudio.addEventListener('loadedmetadata', go, { once: true });
    if (window.gcEvent) window.gcEvent('g7-showcase-hear-it');
  });

  var ok = document.getElementById('turn-ok');
  if (ok) ok.addEventListener('click', function () { document.getElementById('turn').classList.add('off'); });

  Reveal.initialize({
    width: 1920, height: 1080, margin: 0, minScale: 0.1, maxScale: 3,
    center: false, hash: true, controls: true, controlsTutorial: false, progress: true,
    transition: 'fade', transitionSpeed: 'default', backgroundTransition: 'fade', showNotes: false,
    plugins: [RevealNotes]
  }).then(function () {
    onSlide(Reveal.getCurrentSlide());
    Reveal.on('slidechanged', function (e) { onSlide(e.currentSlide); });
    // scroll view (narrow phones): the player slide may never be "current", so load it when near
    if (Reveal.isScrollView && Reveal.isScrollView()) loadClip(document.querySelector('.voices button.on').dataset.c);
  });
})();
