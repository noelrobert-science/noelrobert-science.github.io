/* Anonymous visit counter (GoatCounter: no cookies, no personal data).
   A personal link like ?from=mike is kept in the counted path, so Noel can see which shared link was used.
   Used by the deck, the Starter Kit pages, the studios and the /go/ book links. */
(function () {
  var GC = 'https://noelrobert.goatcounter.com/count';
  var q = new URLSearchParams(location.search), from = (q.get('from') || '').toLowerCase().replace(/[^a-z0-9_-]/g, '').slice(0, 40);
  try { if (from) sessionStorage.setItem('gc_from', from); else from = sessionStorage.getItem('gc_from') || ''; } catch (e) {}
  var tag = from ? ' · from ' + from : '';
  window.goatcounter = { path: function (p) { return p.split('?')[0] + (from ? '?from=' + from : ''); } };
  // one helper for events (acts reached, video plays, book link clicks)
  window.gcEvent = function (name) {
    try { if (window.goatcounter && window.goatcounter.count) window.goatcounter.count({ path: name + tag, title: name, event: true }); } catch (e) {}
  };
  var s = document.createElement('script'); s.async = true; s.src = 'https://gc.zgo.at/count.js'; s.setAttribute('data-goatcounter', GC);
  document.head.appendChild(s);
})();
