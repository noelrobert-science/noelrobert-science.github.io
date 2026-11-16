/* Mr R Science: "back to the app" bar for studio pages.
   The app saves where the pupil came from (sessionStorage, this tab only). If it's there:
   - a slim bar at the top of the studio page goes straight back,
   - a bar at the bottom says "Done. Back to my topic": it ticks the step the pupil opened (mrr-step) and goes back,
   - html gets the class from-app, so a studio can hide its own header, menus and school-only parts.
   Pages opened any other way look exactly as before. Nothing leaves the device. */
(function () {
  var to, title, step = null;
  try {
    to = sessionStorage.getItem('mrr-return'); title = sessionStorage.getItem('mrr-return-title');
    step = JSON.parse(sessionStorage.getItem('mrr-step') || 'null');
  } catch (e) { return; }
  if (!to || to.charAt(0) !== '/' || to.indexOf('//') === 0) return;
  document.documentElement.classList.add('from-app');
  // The app's three steps. The older four-step keys still map, so a page opened from either one works.
  var STEP = { watch: 'Watch', train: 'Train', check: 'Check', learn: 'Watch', try: 'See it happen', practise: 'Train', test: 'Check' };
  var FONT = 'font:600 15px/1.2 Lexend,system-ui,sans-serif';

  function top() {
    if (document.getElementById('mrr-back')) return;
    var a = document.createElement('a');
    a.id = 'mrr-back'; a.href = to;
    a.innerHTML = '<span aria-hidden="true" style="font-size:20px;line-height:1">‹</span><span style="white-space:nowrap;flex:none">Back to Mr R Science</span>' +
      (title ? '<small style="opacity:.75;font-weight:400;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;min-width:0">· ' + title.replace(/[<>&]/g, '') + '</small>' : '');
    a.setAttribute('style', 'display:flex;align-items:center;gap:8px;min-height:44px;padding:6px max(16px, env(safe-area-inset-left, 0px));' +
      'padding-top:max(6px, env(safe-area-inset-top, 0px));background:#151b28;color:#fff;' + FONT + ';text-decoration:none;position:relative;z-index:2147483000');
    document.body.insertBefore(a, document.body.firstChild);
  }

  // The bottom "Done" bar. Not on pages with their own ending: the momentum lesson mode and the practice page's tests.
  function done() {
    if (!step || !STEP[step.k] || document.getElementById('mrr-done')) return;
    if (document.body.classList.contains('lesson')) return;
    if (/^\/app\/gym\//.test(location.pathname) && step.k === 'test') return;
    var bar = document.createElement('div'); bar.id = 'mrr-done';
    bar.setAttribute('style', 'position:fixed;left:0;right:0;bottom:0;z-index:2147483000;display:flex;align-items:center;justify-content:space-between;gap:10px;' +
      'background:#fff;border-top:1px solid #d9dee8;box-shadow:0 -4px 16px rgba(20,27,40,.08);padding:10px max(16px, env(safe-area-inset-right, 0px)) calc(10px + env(safe-area-inset-bottom, 0px)) max(16px, env(safe-area-inset-left, 0px));' + FONT);
    bar.innerHTML = '<span id="mrr-done-say" style="color:#4b5567;font-weight:500;font-size:14px;min-width:0">' + STEP[step.k] + '</span>' +
      '<button type="button" style="flex:none;border:0;border-radius:99px;min-height:46px;padding:0 20px;background:#151b28;color:#fff;' + FONT + ';cursor:pointer">Done. Back to my topic ✓</button>';
    bar.querySelector('button').onclick = function () {
      try { sessionStorage.setItem('mrr-done', JSON.stringify({ t: step.t, k: step.k })); } catch (e) {}
      location.href = to;
    };
    document.body.appendChild(bar);
    document.body.style.paddingBottom = 'calc(' + (parseFloat(getComputedStyle(document.body).paddingBottom) || 0) + 'px + 76px)';
  }

  // A studio can say "enough practice for now" (for example after five right): the bar then says so.
  window.MrrApp = {
    step: step,
    goal: function (msg) {
      var s = document.getElementById('mrr-done-say'), bar = document.getElementById('mrr-done');
      if (!s || !bar) return;
      s.textContent = msg || 'That will do for now. Next: Check.'; s.style.color = '#0f7a3d'; s.style.fontWeight = '700';
      bar.querySelector('button').style.boxShadow = '0 0 0 4px #bfe8cc';
    }
  };

  function go() { top(); setTimeout(done, 300); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', go); else go();
})();
