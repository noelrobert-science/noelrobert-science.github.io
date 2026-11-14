/* Momentum Studio: lesson mode.
   Opened as momentum/#lesson/<id> (from the app's "Learn it" step). It hides the toolbox and walks the learner
   through a few screens, one tool at a time, with one Next button. The last screen sends them back to their
   topic in the app and ticks "Learn it". Without #lesson/… the studio looks exactly as before. */
(function () {
  var m = /^#lesson\/([a-z-]+)/.exec(location.hash);
  if (!m) return;
  // Every topic has the same shape: Learn it = the explanation (lesson), Try it = one lab on its own screen.
  // "noel" marks the place where a short Mr Robert face-and-voice clip will go later.
  var LESSONS = {
    momentum: {
      title: 'Momentum, Δp and impulse', app: '10/momentum', k: 'learn', label: 'Learn it',
      screens: [
        { video: 'media/m7/lesson', h: 'Watch the lesson',
          say: 'Mr Robert, about 8½ minutes. It stops 10 times so you can think first. Have paper, a pencil and a calculator ready. Prefer to read? <a href="?read#lesson/momentum-read">Read the worked examples instead</a>.' }
      ]
    },
    'momentum-read': {
      title: 'Momentum, Δp and impulse', app: '10/momentum', k: 'learn', label: 'Learn it',
      screens: [
        { tab: 'learning', topic: 'momentum', h: 'What momentum is', noel: 'walk through this example',
          say: 'Momentum is mass times velocity, p = mv. Direction matters, so pick a positive direction first. Read the worked example, then try the short "explain" question.' },
        { tab: 'learning', topic: 'impulse', h: 'Impulse and stopping force', noel: 'walk through this example',
          say: 'Impulse is the change in momentum, Δp. Find Δp first, with its sign, then divide by the stopping time to get the force.' }
      ]
    },
    conservation: {
      title: 'Conservation of momentum', app: '10/conservation', k: 'learn', label: 'Learn it',
      screens: [
        { tab: 'video', h: 'Watch and predict',
          say: 'A short lesson about two carts that stick together. It stops five times so you can predict first. Have paper and a calculator ready.' },
        { tab: 'learning', topic: 'conservation', h: 'The worked method', noel: 'walk through this example',
          say: 'Total momentum before = total momentum after. Read the worked example, then try the "explain" question.' }
      ]
    },
    'impulse-lab': {
      title: 'Momentum, Δp and impulse', app: '10/momentum', k: 'try', label: 'Try it',
      screens: [
        { tab: 'impulse', h: 'A softer stop', clip: 'media/m7/clip-what-to-watch', clipTitle: 'Mr R: what to watch',
          say: 'Same mass, same speed, same stop. Make the stopping time longer. Guess first: does the force get bigger or smaller? Then try "Push a trolley from rest".' }
      ]
    },
    'collision-lab': {
      title: 'Conservation of momentum', app: '10/conservation', k: 'try', label: 'Try it',
      screens: [
        { tab: 'collisions', h: 'Test your prediction',
          say: 'Choose "Stick together". Set A to 2 kg at +3 m/s and B to 1 kg at rest. Predict the final velocity, then run it. Then try "Bounce".' }
      ]
    }
  };
  var L = LESSONS[m[1]];
  if (!L) return;
  var i = 0;

  var css = document.createElement('style');
  css.textContent =
    'body.lesson header, body.lesson footer, body.lesson #feedback { display: none !important }' +
    'body.lesson main { padding-bottom: 120px }' +
    'body.lesson .ls-hide { display: none !important }' +
    'body.ls-video main > *:not(#ls-card):not(#ls-video) { display: none !important }' +
    '#ls-video { margin: 0 0 18px } #ls-video[hidden] { display: none }' +
    '#ls-video .mv { max-width: min(100%, calc((100vh - 330px) * 1.778)); margin: 0 auto }' +
    /* a phone turned sideways: the picture fills the screen height (audit A4) */
    '@media (orientation: landscape) and (max-height: 520px) { #ls-video .mv { max-width: min(100%, calc((100vh - 12px) * 1.778)) } body.ls-video #ls-top, body.ls-video #ls-bot { position: static } }' +
    '#ls-turn { display: none; margin: 8px 2px 0; font-size: 14px; color: #53665e } @media (orientation: portrait) and (max-width: 600px) { #ls-turn { display: block } }' +
    'body.ls-video #ls-card { padding: 12px 18px; margin: 12px 0 } body.ls-video #ls-card h2 { font-size: 22px; margin: 2px 0 4px } body.ls-video #ls-card p { font-size: 16px }' +
    '#ls-clip { margin-top: 14px; max-width: 400px } #ls-clipk { margin: 14px 0 -6px; font: 700 14px Arial, sans-serif; color: #53665e } #ls-clip[hidden] { display: none }' +
    '#ls-card a { color: #205747; font-weight: 700 }' +
    '#ls-top { position: sticky; top: 0; z-index: 50; background: #183c32; color: #fff; padding: 12px max(18px, env(safe-area-inset-left, 0px)); font: 600 15px/1.3 Arial, sans-serif }' +
    '#ls-top .t { display: flex; justify-content: space-between; gap: 12px; align-items: center; max-width: 1080px; margin: 0 auto }' +
    '#ls-top a { color: #d9efa0; text-decoration: none; white-space: nowrap }' +
    '#ls-top .dots { display: flex; gap: 6px; max-width: 1080px; margin: 10px auto 0 }' +
    '#ls-top .dots i { flex: 1; height: 5px; border-radius: 9px; background: rgba(255,255,255,.25) }' +
    '#ls-top .dots i.on { background: #d9efa0 }' +
    '#ls-card { background: #fff; border: 2px solid #205747; border-radius: 14px; padding: 18px 20px; margin: 18px 0 }' +
    '#ls-card small { display: block; font: 700 13px Arial, sans-serif; letter-spacing: .08em; text-transform: uppercase; color: #53665e }' +
    '#ls-card h2 { margin: 4px 0 8px; font-size: 26px }' +
    '#ls-card p { margin: 0; font-size: 18px; line-height: 1.5 }' +
    '#ls-bot { position: fixed; left: 0; right: 0; bottom: 0; z-index: 50; background: #fff; border-top: 1px solid #dce4da; padding: 12px max(18px, env(safe-area-inset-right, 0px)) calc(12px + env(safe-area-inset-bottom, 0px)) max(18px, env(safe-area-inset-left, 0px)) }' +
    '#ls-bot .b { display: flex; gap: 10px; justify-content: space-between; align-items: center; max-width: 1080px; margin: 0 auto }' +
    '#ls-bot button { min-height: 52px; border-radius: 99px; font: 700 17px Arial, sans-serif; padding: 0 20px; cursor: pointer; white-space: nowrap }' +
    '#ls-prev { padding: 0 16px !important }' +
    '#ls-prev { background: #fff; color: #183c32; border: 1.5px solid #dce4da }' +
    '#ls-next { background: #205747; color: #fff; border: 0; margin-left: auto }';
  document.head.appendChild(css);

  function withPlayer(fn) {
    if (window.MrrVideo) return fn();
    var sc = document.createElement('script'); sc.src = '/app/mrr-video.js'; sc.onload = fn; document.head.appendChild(sc);
  }
  function getJSON(u, fn) { fetch(u).then(function (r) { return r.json(); }).then(fn, function () { fn({}); }); }
  function returnUrl() {
    var to = null; try { to = sessionStorage.getItem('mrr-return'); } catch (e) {}
    return (to && to.charAt(0) === '/' && to.indexOf('//') !== 0) ? to : '/app/next.html#t/' + L.app;
  }
  function hideIn(sel, list) { var p = document.querySelector(sel); if (!p) return; list.forEach(function (q) { p.querySelectorAll(q).forEach(function (el) { el.classList.add('ls-hide'); }); }); }

  function setup() {
    document.body.classList.add('lesson');
    // the "back to the app" bar from back.js is replaced by the lesson bar
    var bb = document.getElementById('mrr-back'); if (bb) bb.remove();
    // Learn panel: keep only the worked example
    hideIn('#learning', [':scope > p.small', ':scope > .section-head', ':scope > .topic-paths', ':scope > .learning-target', '#prerequisites', '#scaffold-card']);
    // Video panel: keep the player and the prediction checks
    hideIn('#video', [':scope > .section-head', '.download-links', '.video-card > p.small:last-child', ':scope > .card.learning-block']);
    // Labs: no download buttons
    hideIn('#collisions', ['#download-cart-top', ':scope > .section-head']);
    hideIn('#impulse', [':scope > .section-head']);
    var top = document.createElement('div'); top.id = 'ls-top';
    top.innerHTML = '<div class="t"><span>' + L.label + ' · ' + L.title + '</span><a href="' + returnUrl() + '">✕ Close</a></div><div class="dots"' + (L.screens.length > 1 ? '' : ' hidden') + '>' + L.screens.map(function () { return '<i></i>'; }).join('') + '</div>';
    document.body.insertBefore(top, document.body.firstChild);
    var card = document.createElement('div'); card.id = 'ls-card';
    document.querySelector('main').insertBefore(card, document.querySelector('main').firstChild);
    var vbox = document.createElement('div'); vbox.id = 'ls-video'; vbox.hidden = true; card.after(vbox);
    var bot = document.createElement('div'); bot.id = 'ls-bot';
    bot.innerHTML = '<div class="b"><button id="ls-prev" type="button">‹ Back</button><button id="ls-next" type="button"></button></div>';
    document.body.appendChild(bot);
    document.getElementById('ls-prev').onclick = function () { if (i > 0) show(i - 1); };
    document.getElementById('ls-next').onclick = function () {
      if (i < L.screens.length - 1) return show(i + 1);
      try { sessionStorage.setItem('mrr-done', JSON.stringify({ t: L.app, k: L.k })); } catch (e) {}
      location.href = returnUrl();
    };
    show(0);
  }
  function show(n) {
    i = n; var s = L.screens[n];
    var v = document.getElementById('momentum-video'); if (v && s.tab !== 'video') try { v.pause(); } catch (e) {}
    if (window.StudioBridge && window.StudioBridge.openTab) window.StudioBridge.openTab(s.tab);
    if (s.topic) { var b = document.querySelector('[data-learn-topic="' + s.topic + '"]'); if (b) b.click(); var me = document.getElementById('model-example'); if (me) me.open = true; }
    document.getElementById('ls-card').innerHTML = (L.screens.length > 1 ? '<small>Step ' + (n + 1) + ' of ' + L.screens.length + '</small>' : '<small>' + L.label + '</small>') + '<h2>' + s.h + '</h2><p>' + s.say + '</p>' + (s.clip ? '<p id="ls-clipk">▶ ' + (s.clipTitle || 'Mr R explains') + ' (19 s). Watch this first.</p><div id="ls-clip"></div>' : '');
    var vb = document.getElementById('ls-video'); document.body.classList.toggle('ls-video', !!s.video); vb.hidden = !s.video; vb.innerHTML = '';
    if (s.video) withPlayer(function () { getJSON(s.video + '.json', function (meta) { vb.innerHTML = '<div></div><p id="ls-turn">Tip: turn your phone sideways for a bigger picture.</p>'; MrrVideo.mount(vb.firstChild, { src: s.video + '.mp4', vtt: s.video + '.vtt', poster: s.video + '.jpg', meta: meta, onDone: function () { var b = document.getElementById('ls-next'); b.style.boxShadow = '0 0 0 4px #d9efa0'; } }); }); });
    if (s.clip) withPlayer(function () { MrrVideo.mount(document.getElementById('ls-clip'), { src: s.clip + '.mp4', vtt: s.clip + '.vtt', poster: s.clip + '.jpg' }); });
    document.querySelectorAll('#ls-top .dots i').forEach(function (d, k) { d.className = k <= n ? 'on' : ''; });
    document.getElementById('ls-prev').style.visibility = n ? 'visible' : 'hidden';
    document.getElementById('ls-next').textContent = n < L.screens.length - 1 ? 'Next ›' : "Done. Back to my topic ›";
    window.scrollTo(0, 0); setTimeout(function () { if (s.video && SIDE.matches) toVideo(); else window.scrollTo(0, 0); }, 400);
  }
  var SIDE = matchMedia('(orientation: landscape) and (max-height: 520px)');
  function toVideo() { var vb = document.getElementById('ls-video'); if (vb && !vb.hidden) vb.scrollIntoView({ block: 'start' }); }
  try { SIDE.addEventListener('change', function () { if (SIDE.matches && document.body.classList.contains('ls-video')) setTimeout(toVideo, 250); }); } catch (e) {}
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { setTimeout(setup, 0); }); else setTimeout(setup, 0);
})();
