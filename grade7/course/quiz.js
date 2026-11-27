/* Self-marking check-in, in the style of a Canvas Classic Quiz.
   Five questions drawn from the pool, 2 points each. Runs in the browser only: nothing is saved or sent. */
(function () {
  var box = document.getElementById('quiz');
  var id = new URLSearchParams(location.search).get('id');
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function shuffle(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  fetch('quizzes.json').then(function (r) { return r.json(); }).then(function (all) {
    var Q = all[id];
    if (!Q) { box.innerHTML = '<p>Check-in not found. <a href="checkins.html">All check-ins</a></p>'; return; }
    document.title = Q.title + ' · Grade 7 Chemistry 2027 (preview)';
    document.querySelector('.cv-title').textContent = Q.title;
    var crumb = document.querySelector('.cv-crumb'); crumb.lastChild.textContent = ' › ' + Q.title;
    intro(Q);
  });
  function intro(Q) {
    box.innerHTML = '<div class="qz-head"><div class="qz-facts"><span><b>Points</b> 10</span><span><b>Questions</b> 5</span><span><b>Time limit</b> none</span><span><b>Allowed attempts</b> 2</span></div>' +
      '<p>Try without the book first. You have two tries. Your score does not count for marks.</p>' +
      '<p style="color:#6b7780;font-size:14px">Preview copy: this check-in marks itself in your browser. Nothing is saved or sent.</p></div>' +
      '<button class="qz-btn" id="go">Take the check-in</button>';
    document.getElementById('go').onclick = function () { take(Q, 1); };
  }
  function take(Q, attempt) {
    var picks = shuffle(Q.qs).slice(0, 5), h = [];
    picks.forEach(function (q, n) {
      var b = '';
      if (q.k === 'mc') {
        b = '<p>' + esc(q.s) + '</p>' + shuffle(q.o.map(function (o, i) { return [o, i]; })).map(function (p) {
          return '<label><input type="radio" name="q' + n + '" value="' + p[1] + '"> ' + esc(p[0]) + '</label>';
        }).join('');
      } else if (q.k === 'dd') {
        b = '<p>' + esc(q.s).replace(/\[(\w+)\]/g, function (m, k) {
          var o = q.b[k]; if (!o) return m;
          return '<select data-k="' + k + '"><option value="">[ Select ]</option>' + o.o.map(function (t, i) { return '<option value="' + i + '">' + esc(t) + '</option>'; }).join('') + '</select>';
        }) + '</p>';
      } else if (q.k === 'match') {
        var rights = shuffle(q.p.map(function (p) { return p[1]; }).concat(q.x));
        b = '<p>' + esc(q.s) + '</p><div class="qz-match">' + q.p.map(function (p, i) {
          return '<span>' + esc(p[0]) + '</span><select data-i="' + i + '"><option value="">[ Choose ]</option>' + rights.map(function (r) { return '<option>' + esc(r) + '</option>'; }).join('') + '</select>';
        }).join('') + '</div>';
      } else if (q.k === 'num') {
        b = '<p>' + esc(q.s) + '</p><input type="number" step="any" inputmode="decimal" aria-label="Your answer">';
      }
      h.push('<section class="qz-q" data-n="' + n + '"><header><span>Question ' + (n + 1) + '</span><span class="qz-mark">2 pts</span></header><div class="qb">' + b + '<div class="qz-fbx"></div></div></section>');
    });
    box.innerHTML = '<p style="color:#6b7780">Attempt ' + attempt + ' of 2</p>' + h.join('') + '<button class="qz-btn" id="sub">Submit check-in</button>';
    window.scrollTo(0, 0);
    document.getElementById('sub').onclick = function () { mark(Q, picks, attempt); };
  }
  function mark(Q, picks, attempt) {
    var total = 0;
    picks.forEach(function (q, n) {
      var el = box.querySelector('.qz-q[data-n="' + n + '"]'), got = 0, out = 2;
      if (q.k === 'mc') {
        var c = el.querySelector('input:checked'); got = c && +c.value === q.a ? 2 : 0;
      } else if (q.k === 'dd') {
        var ss = el.querySelectorAll('select'), ok = 0;
        ss.forEach(function (s) { if (s.value !== '' && +s.value === q.b[s.dataset.k].a) ok++; });
        got = Math.round(2 * ok / ss.length * 100) / 100;
      } else if (q.k === 'match') {
        var ms = el.querySelectorAll('select'), mk = 0;
        ms.forEach(function (s) { if (s.value === q.p[+s.dataset.i][1]) mk++; });
        got = Math.round(2 * mk / ms.length * 100) / 100;
      } else if (q.k === 'num') {
        var v = parseFloat((el.querySelector('input').value || '').replace(',', '.'));
        got = !isNaN(v) && Math.abs(v - q.a) <= (q.t || 0) ? 2 : 0;
      }
      total += got;
      el.classList.add(got === out ? 'right' : got > 0 ? 'part' : 'wrong');
      el.querySelector('.qz-mark').textContent = (got === out ? '✓ ' : got > 0 ? '◐ ' : '✗ ') + got + ' / 2 pts';
      el.querySelectorAll('input,select').forEach(function (i) { i.disabled = true; });
      if (got < out) el.querySelector('.qz-fbx').innerHTML = '<div class="qz-fb">' + esc(q.f) + '</div>';
    });
    total = Math.round(total * 100) / 100;
    var sub = document.getElementById('sub'); sub.remove();
    var top = document.createElement('div');
    top.innerHTML = '<p class="qz-score">Score for this attempt: <b>' + total + '</b> out of 10</p>' +
      (total === 10 ? '<p>All correct. Well done.</p>' : '<p>Read the feedback under each question you missed, then go back to the page it names.</p>') +
      (attempt < 2 ? '<button class="qz-btn" id="again">Take it again (a new set of 5)</button>' : '<p>That was your second try. <button class="qz-btn alt" id="again">Practise again anyway</button></p>');
    box.insertBefore(top, box.firstChild);
    window.scrollTo(0, 0);
    document.getElementById('again').onclick = function () { take(Q, attempt < 2 ? attempt + 1 : 2); };
  }
})();
