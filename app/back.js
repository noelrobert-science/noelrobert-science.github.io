/* Mr R Science: "back to the app" bar for studio pages.
   The app saves where the pupil came from (sessionStorage, this tab only). If it's there, a slim bar at the top
   of the studio page goes straight back to that topic. Pages opened any other way look exactly as before. */
(function () {
  var to, title;
  try { to = sessionStorage.getItem('mrr-return'); title = sessionStorage.getItem('mrr-return-title'); } catch (e) { return; }
  if (!to || to.charAt(0) !== '/' || to.indexOf('//') === 0) return;
  // Studios can hide school-only or teacher-only parts with html.from-app.
  document.documentElement.classList.add('from-app');
  function add() {
    if (document.getElementById('mrr-back')) return;
    var a = document.createElement('a');
    a.id = 'mrr-back'; a.href = to;
    a.innerHTML = '<span aria-hidden="true" style="font-size:20px;line-height:1">‹</span><span style="white-space:nowrap;flex:none">Back to Mr R Science</span>' +
      (title ? '<small style="opacity:.75;font-weight:400;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;min-width:0">· ' + title.replace(/[<>&]/g, '') + '</small>' : '');
    a.setAttribute('style', 'display:flex;align-items:center;gap:8px;min-height:44px;padding:6px max(16px, env(safe-area-inset-left, 0px));' +
      'padding-top:max(6px, env(safe-area-inset-top, 0px));background:#151b28;color:#fff;font:600 15px/1.2 Lexend,system-ui,sans-serif;text-decoration:none;position:relative;z-index:2147483000');
    document.body.insertBefore(a, document.body.firstChild);
  }
  if (document.body) add(); else document.addEventListener('DOMContentLoaded', add);
})();
