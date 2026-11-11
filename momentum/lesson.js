/* Momentum Studio: lesson mode.
   Opened as momentum/#lesson/<id> (from the app's "Learn it" step). It hides the toolbox and walks the learner
   through a few screens, one tool at a time, with one Next button. The last screen sends them back to their
   topic in the app and ticks "Learn it". Without #lesson/… the studio looks exactly as before. */
(function () {
  var m = /^#lesson\/([a-z-]+)/.exec(location.hash);
  if (!m) return;
  var LESSONS = {
    momentum: {
      title: 'Momentum, Δp and impulse', app: '10/momentum',
      screens: [
        { tab: 'learning', topic: 'momentum', h: 'What momentum is',
          say: 'Momentum is mass times velocity, p = mv. Direction matters, so pick a positive direction first. Read the worked example, then try the short "explain" question.' },
        { tab: 'impulse', h: 'Try it: a softer stop',
          say: 'Same mass, same speed, same stop. Make the stopping time longer. Guess first: does the force get bigger or smaller?' },
        { tab: 'learning', topic: 'impulse', h: 'Impulse and stopping force',
          say: 'Now the numbers. Find Δp first, with its sign, then divide by the stopping time.' }
      ]
    },
    conservation: {
      title: 'Conservation of momentum', app: '10/conservation',
      screens: [
        { tab: 'video', h: 'Watch and predict',
          say: 'A short lesson about two carts that stick together. It stops five times so you can predict first. Have paper and a calculator ready.' },
        { tab: 'collisions', h: 'Try it: test your prediction',
          say: 'Choose "Stick together". Set A to 2 kg at +3 m/s and B to 1 kg at rest. Predict the final velocity, then run it.' },
        { tab: 'learning', topic: 'conservation', h: 'The worked method',
          say: 'Total momentum before = total momentum after. Read the worked example, then try the "explain" question.' }
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
    top.innerHTML = '<div class="t"><span>Learn it · ' + L.title + '</span><a href="' + returnUrl() + '">✕ Close</a></div><div class="dots">' + L.screens.map(function () { return '<i></i>'; }).join('') + '</div>';
    document.body.insertBefore(top, document.body.firstChild);
    var card = document.createElement('div'); card.id = 'ls-card';
    document.querySelector('main').insertBefore(card, document.querySelector('main').firstChild);
    var bot = document.createElement('div'); bot.id = 'ls-bot';
    bot.innerHTML = '<div class="b"><button id="ls-prev" type="button">‹ Back</button><button id="ls-next" type="button"></button></div>';
    document.body.appendChild(bot);
    document.getElementById('ls-prev').onclick = function () { if (i > 0) show(i - 1); };
    document.getElementById('ls-next').onclick = function () {
      if (i < L.screens.length - 1) return show(i + 1);
      try { sessionStorage.setItem('mrr-done', JSON.stringify({ t: L.app, k: 'learn' })); } catch (e) {}
      location.href = returnUrl();
    };
    show(0);
  }
  function show(n) {
    i = n; var s = L.screens[n];
    var v = document.getElementById('momentum-video'); if (v && s.tab !== 'video') try { v.pause(); } catch (e) {}
    if (window.StudioBridge && window.StudioBridge.openTab) window.StudioBridge.openTab(s.tab);
    if (s.topic) { var b = document.querySelector('[data-learn-topic="' + s.topic + '"]'); if (b) b.click(); var me = document.getElementById('model-example'); if (me) me.open = true; }
    document.getElementById('ls-card').innerHTML = '<small>Step ' + (n + 1) + ' of ' + L.screens.length + '</small><h2>' + s.h + '</h2><p>' + s.say + '</p>';
    document.querySelectorAll('#ls-top .dots i').forEach(function (d, k) { d.className = k <= n ? 'on' : ''; });
    document.getElementById('ls-prev').style.visibility = n ? 'visible' : 'hidden';
    document.getElementById('ls-next').textContent = n < L.screens.length - 1 ? 'Next ›' : "Done. Back to my topic ›";
    window.scrollTo(0, 0);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { setTimeout(setup, 0); }); else setTimeout(setup, 0);
})();
