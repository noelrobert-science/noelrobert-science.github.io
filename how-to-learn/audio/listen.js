/* Listen button: plays a short clip in the AI voice of Mr R and shows the words as they are spoken.
   Use: <div class="l2l-listen" data-src="…/three-habits.mp3" data-vtt="…/three-habits.vtt" data-label="…"></div>
   Plays only in this browser; nothing is saved or sent. */
(function () {
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function parse(vtt) {
    var cues = [];
    vtt.replace(/\r/g, '').split(/\n\n+/).forEach(function (b) {
      var m = b.match(/(\d+):(\d+):(\d+\.\d+)\s+-->\s+(\d+):(\d+):(\d+\.\d+)\n([\s\S]+)/);
      if (m) cues.push({ a: +m[1] * 3600 + +m[2] * 60 + +m[3], b: +m[4] * 3600 + +m[5] * 60 + +m[6], t: m[7].trim() });
    });
    return cues;
  }
  document.querySelectorAll('.l2l-listen').forEach(function (box) {
    var label = box.getAttribute('data-label') || 'Listen';
    box.innerHTML = '<button type="button" class="l2l-btn" aria-pressed="false"><span class="l2l-ic" aria-hidden="true">▶️</span> <span class="l2l-lb">' + esc(label) + '</span></button>' +
      '<p class="l2l-cap" aria-live="polite"></p>' +
      '<details class="l2l-words"><summary>Read the words</summary><div class="l2l-all"></div></details>';
    var audio = new Audio(); audio.preload = 'none'; audio.src = box.getAttribute('data-src');
    var btn = box.querySelector('.l2l-btn'), ic = box.querySelector('.l2l-ic'), cap = box.querySelector('.l2l-cap'), cues = [];
    fetch(box.getAttribute('data-vtt')).then(function (r) { return r.text(); }).then(function (t) {
      cues = parse(t);
      box.querySelector('.l2l-all').innerHTML = cues.map(function (c) { return '<p>' + esc(c.t) + '</p>'; }).join('');
    }).catch(function () {});
    btn.onclick = function () { if (audio.paused) audio.play(); else audio.pause(); };
    audio.onplay = function () { ic.textContent = '⏸️'; btn.setAttribute('aria-pressed', 'true'); };
    audio.onpause = function () { ic.textContent = '▶️'; btn.setAttribute('aria-pressed', 'false'); };
    audio.onended = function () { cap.textContent = ''; audio.currentTime = 0; };
    audio.ontimeupdate = function () {
      var now = audio.currentTime, c = cues.filter(function (q) { return now >= q.a && now <= q.b; })[0];
      cap.textContent = c ? c.t : '';
    };
  });
})();
