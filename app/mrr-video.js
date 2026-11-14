/* Mr R video player: one <video> with chapters, "pause and think" stops and keyboard skips.
   MrrVideo.mount(el, { src, vtt, poster, meta, title, onDone })
   meta = { dur, chapters: [{t, title}], stops: [{t}] }   (all optional)
   Keys: → / ← skip 5 s, Space plays or pauses. School-independent: no sign-in, nothing leaves the device. */
(function () {
  if (window.MrrVideo) return;
  var CSS =
    '.mv{--mv-ink:#183c32;--mv-acc:#205747;--mv-line:#dce4da;--mv-soft:#f2f6f1;font:16px/1.45 Arial,sans-serif;color:var(--mv-ink)}' +
    '.mv-stage{position:relative;background:#000;border-radius:14px;overflow:hidden;aspect-ratio:16/9;max-width:100%}' +
    '.mv video{display:block;width:100%;height:100%;background:#000}' +
    '.mv video::cue{font-size:clamp(14px,2.4vw,22px);background:rgba(0,0,0,.72)}' +
    '.mv-stop{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;text-align:center;padding:18px;background:rgba(18,40,33,.88);color:#fff}' +
    '.mv-stop[hidden]{display:none}' +
    '.mv-stop .k{font:700 13px Arial,sans-serif;letter-spacing:.12em;text-transform:uppercase;color:#d9efa0;margin:0}' +
    '.mv-stop h3{margin:0;font-size:clamp(22px,4vw,34px)}' +
    '.mv-stop p{margin:0;font-size:clamp(15px,2.2vw,19px);max-width:34em}' +
    '.mv-stop .row{display:flex;gap:10px;flex-wrap:wrap;justify-content:center;margin-top:6px}' +
    '.mv button{font:700 16px Arial,sans-serif;border-radius:99px;min-height:46px;padding:0 20px;cursor:pointer}' +
    '.mv-go{background:#d9efa0;color:#183c32;border:0}' +
    '.mv-ghost{background:transparent;color:#fff;border:1.5px solid rgba(255,255,255,.5)}' +
    '.mv-bar{display:flex;flex-wrap:wrap;gap:8px 14px;align-items:center;justify-content:space-between;margin:10px 2px 0;font-size:14px;color:#53665e}' +
    '.mv-bar kbd{font:700 12px Arial,sans-serif;border:1px solid var(--mv-line);border-bottom-width:2px;border-radius:5px;padding:1px 6px;background:#fff;color:var(--mv-ink)}' +
    '.mv-resume{background:var(--mv-soft);color:var(--mv-ink);border:1.5px solid var(--mv-line)}' +
    '.mv-resume[hidden]{display:none}' +
    '.mv-ch{list-style:none;margin:12px 0 0;padding:0;display:grid;gap:6px}' +
    '.mv-ch button{width:100%;display:flex;gap:12px;align-items:center;text-align:left;background:#fff;color:var(--mv-ink);border:1.5px solid var(--mv-line);border-radius:12px;min-height:44px;padding:6px 14px;font-weight:600}' +
    '.mv-ch button span{font:700 14px Arial,sans-serif;color:#53665e;min-width:3.2em}' +
    '.mv-ch button.on{border-color:var(--mv-acc);background:var(--mv-soft)}' +
    '.mv-ch button.on span{color:var(--mv-acc)}' +
    '@media (pointer:coarse){.mv-keys{display:none}}' +
    '.mv-ch .stops{margin-left:auto;font:400 13px Arial,sans-serif;color:#53665e;min-width:0}';
  function css() { if (document.getElementById('mv-css')) return; var s = document.createElement('style'); s.id = 'mv-css'; s.textContent = CSS; document.head.appendChild(s); }
  function fmt(t) { t = Math.max(0, Math.floor(t)); return Math.floor(t / 60) + ':' + ('0' + (t % 60)).slice(-2); }
  function store(k, v) { try { if (v === undefined) return localStorage.getItem(k); if (v === null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch (e) { return null; } }
  var active = null;   // the player the keyboard talks to
  window.addEventListener('keydown', function (e) {
    var p = active; if (!p || !document.body.contains(p.el) || e.altKey || e.ctrlKey || e.metaKey) return;
    var tg = e.target && e.target.tagName;
    if (tg === 'INPUT' || tg === 'TEXTAREA' || tg === 'SELECT') return;
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      e.preventDefault(); e.stopPropagation();
      if (!p.stopEl.hidden) return;
      p.v.currentTime = Math.min(Math.max(0, p.v.currentTime + (e.key === 'ArrowRight' ? 5 : -5)), (p.v.duration || 1e9) - 0.1);
    } else if (e.key === ' ' && tg !== 'BUTTON' && tg !== 'A') {
      e.preventDefault(); e.stopPropagation();
      if (!p.stopEl.hidden) { p.go(); return; }
      if (p.v.paused) p.v.play(); else p.v.pause();
    }
  }, true);

  function mount(el, o) {
    css(); o = o || {}; var meta = o.meta || {}, chapters = meta.chapters || [], stops = (meta.stops || []).map(function (s) { return { t: s.t, done: false }; });
    el.innerHTML = '<div class="mv"><div class="mv-stage"><video controls playsinline preload="metadata"' + (o.poster ? ' poster="' + o.poster + '"' : '') + '>' +
      '<source src="' + o.src + '" type="video/mp4">' + (o.vtt ? '<track kind="captions" srclang="en" label="Captions" src="' + o.vtt + '" default>' : '') + '</video>' +
      '<div class="mv-stop" hidden role="dialog" aria-live="polite"><p class="k">Pause and think</p><h3>Your turn</h3><p>Answer it on paper first. Then see if you were right.</p>' +
      '<div class="row"><button type="button" class="mv-go">I\'ve had a go: show me ▶</button><button type="button" class="mv-ghost">Hear the question again</button></div></div></div>' +
      '<div class="mv-bar"><button type="button" class="mv-resume" hidden></button><span><span class="mv-keys"><kbd>→</kbd> skip 5 s &nbsp;<kbd>←</kbd> back 5 s &nbsp;<kbd>Space</kbd> pause' + (stops.length ? ' &nbsp;·&nbsp; ' : '') + '</span>' + (stops.length ? 'It stops ' + stops.length + ' times for you to think.' : '') + '</span></div>' +
      (chapters.length ? '<ol class="mv-ch" aria-label="Chapters"></ol>' : '') + '</div>';
    var v = el.querySelector('video'), stopEl = el.querySelector('.mv-stop'), list = el.querySelector('.mv-ch'), resume = el.querySelector('.mv-resume');
    var P = { el: el, v: v, stopEl: stopEl }; active = P;
    el.addEventListener('pointerdown', function () { active = P; });
    if (list) {
      list.innerHTML = chapters.map(function (c, i) {
        var n = stops.filter(function (s) { return s.t >= c.t && (i + 1 >= chapters.length || s.t < chapters[i + 1].t); }).length;
        return '<li><button type="button" data-i="' + i + '"><span>' + fmt(c.t) + '</span>' + c.title + (n ? '<em class="stops">' + n + (n > 1 ? ' stops' : ' stop') + '</em>' : '') + '</button></li>';
      }).join('');
      list.addEventListener('click', function (e) { var b = e.target.closest('button'); if (!b) return; var c = chapters[+b.dataset.i]; seek(c.t + 0.01); v.play(); });
    }
    var cur = -1, last = 0, done = false, key = 'mv-pos:' + o.src, waitStop = null;
    function mark() {
      var t = v.currentTime, i = -1; chapters.forEach(function (c, k) { if (t + 0.25 >= c.t) i = k; });
      if (i !== cur && list) { cur = i; list.querySelectorAll('button').forEach(function (b, k) { b.classList.toggle('on', k === i); }); }
    }
    function seek(t) { stopEl.hidden = true; v.currentTime = t; last = t; stops.forEach(function (s) { if (s.t > t + 0.05) s.done = false; }); }
    P.go = function () { if (waitStop) waitStop.done = true; waitStop = null; stopEl.hidden = true; v.play(); };
    stopEl.querySelector('.mv-go').onclick = P.go;
    stopEl.querySelector('.mv-ghost').onclick = function () {
      var s = waitStop; waitStop = null; stopEl.hidden = true;
      var prev = stops.filter(function (x) { return x.t < (s ? s.t : v.currentTime) - 0.5; }).pop();
      var t = Math.max(prev ? prev.t + 0.1 : 0, (s ? s.t : v.currentTime) - 9); if (s) s.done = false; v.currentTime = t; last = t; v.play();
    };
    function tick() {
      var t = v.currentTime;
      if (!v.paused && !v.seeking) {
        for (var k = 0; k < stops.length; k++) {
          var s = stops[k];
          if (!s.done && last <= s.t && t >= s.t && t - s.t < 1.2) { v.pause(); v.currentTime = s.t; waitStop = s; stopEl.hidden = false; var b = stopEl.querySelector('.mv-go'); try { b.focus({ preventScroll: true }); } catch (e) {} break; }
        }
        last = t;
      }
      mark();
      if (!done && v.duration && t > v.duration * 0.9) { done = true; if (o.onDone) o.onDone(); }
      if (!v.paused) requestAnimationFrame(tick);
    }
    v.addEventListener('play', function () { active = P; if (!stopEl.hidden) { stopEl.hidden = true; if (waitStop) waitStop.done = true; waitStop = null; } last = v.currentTime; requestAnimationFrame(tick); });
    v.addEventListener('seeked', function () { if (v.paused || Math.abs(v.currentTime - last) > 1.5) { stops.forEach(function (s) { if (s.t > v.currentTime + 0.05) s.done = false; }); last = v.currentTime; } mark(); });
    v.addEventListener('timeupdate', function () { if (Math.floor(v.currentTime) % 5 === 0 && v.currentTime > 20) store(key, String(Math.floor(v.currentTime))); });
    v.addEventListener('ended', function () { store(key, null); if (!done) { done = true; if (o.onDone) o.onDone(); } });
    var saved = +(store(key) || 0);
    if (saved > 20 && (!meta.dur || saved < meta.dur - 20)) {
      resume.hidden = false; resume.textContent = '▶ Carry on from ' + fmt(saved);
      resume.onclick = function () { resume.hidden = true; seek(saved); stops.forEach(function (s) { if (s.t < saved) s.done = true; }); v.play(); };
      v.addEventListener('play', function () { resume.hidden = true; }, { once: true });
    }
    mark();
    return P;
  }
  window.MrrVideo = { mount: mount };
})();
