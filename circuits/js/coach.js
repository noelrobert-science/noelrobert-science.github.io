/* Mr R's study coach: the panel on a practice question (private test, 25 Nov 2026).
   Hidden for everyone unless this browser has opened a page with ?coach=1 (?coach=0 turns it off again).
   It opens only from the help ladder, after a real try, and every session ends on paper.
   It sends the question, the worked answer, the learner's own lines and a random device code to the coach server;
   never a name. ?coachurl=mock (with ?coach=1) uses a pretend coach for testing without the AI. */
(function () {
  'use strict';
  var SERVER = 'https://mr-r-coach.ncrncr23.workers.dev';
  var MAX_TURNS = 6;
  function q(name) { var m = (location.search + '&' + location.hash).match(new RegExp('[?&]' + name + '=([^&#]*)')); return m ? decodeURIComponent(m[1]) : null; }
  try {
    if (q('coach') === '1') localStorage.setItem('mrr-coach', '1');
    if (q('coach') === '0') { localStorage.removeItem('mrr-coach'); localStorage.removeItem('mrr-coach-url'); }
    if (q('coachurl')) localStorage.setItem('mrr-coach-url', q('coachurl'));
  } catch (e) { /* private window: coach stays off */ }
  function on() { try { return localStorage.getItem('mrr-coach') === '1'; } catch (e) { return false; } }
  function server() { try { return localStorage.getItem('mrr-coach-url') || SERVER; } catch (e) { return SERVER; } }
  function device() {
    try { var d = localStorage.getItem('mrr-coach-device'); if (!d) { d = 'd' + Math.random().toString(36).slice(2, 12); localStorage.setItem('mrr-coach-device', d); } return d; } catch (e) { return 'dprivate'; }
  }

  var MOCK = ['Show me your first line. Which formula did you start from, and why that one?', 'Good. Now look at the numbers you put in: is every value in the unit the formula needs?',
    'You are close. Try the substitution again with that change, then work out the answer.', 'That is the idea. Close the screen. Do this one in pen, then check it against the worked answer.'];
  function ask(payload) {
    if (server() === 'mock') return new Promise(function (res) { setTimeout(function () { res({ reply: MOCK[Math.min(payload.messages.filter(function (m) { return m.role === 'user'; }).length - 1, MOCK.length - 1)] }); }, 400); });
    return fetch(server().replace(/\/$/, '') + '/coach', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      .then(function (r) { return r.json(); })
      .catch(function () { return { reply: 'The coach could not be reached just now. Use the hints on the page.' }; });
  }

  /* info: { h, code, stem, worked, learner, feedback, rung } */
  function open(host, info) {
    var h = info.h, msgs = [], turns = 0;
    var panel = h('div', { class: 'card inner coach', role: 'region', 'aria-label': 'Mr R’s study coach' });
    var log = h('div', { class: 'coachlog', 'aria-live': 'polite' });
    var box = h('textarea', { rows: '2', 'aria-label': 'Your message to the coach', placeholder: 'Tell the coach what you tried, or answer its question' });
    var send = h('button', { class: 'btn', text: 'Send' });
    var paper = h('button', { class: 'btn ghost', text: 'Back to paper' });
    panel.appendChild(h('p', { class: 'small b', text: 'Mr R’s study coach (test version). It helps you find your own mistake. It will not give you the answer.' }));
    panel.appendChild(log);
    panel.appendChild(box);
    panel.appendChild(h('div', { class: 'row', style: 'margin-top:8px' }, [send, paper]));
    host.appendChild(panel);
    function say(role, text) { log.appendChild(h('p', { class: 'coachmsg ' + role, text: (role === 'assistant' ? 'Coach: ' : 'You: ') + text })); }
    function end(text) { say('assistant', text); box.disabled = true; send.disabled = true; paper.disabled = true; }
    function go(text) {
      if (text) { msgs.push({ role: 'user', text: text }); say('user', text); }
      turns++; send.disabled = true; box.value = '';
      ask({ device: device(), messages: msgs, question: { code: info.code, stem: info.stem, worked: info.worked, learner: info.learner, feedback: info.feedback, rung: info.rung } }).then(function (out) {
        var r = ((out && out.reply) || 'Use the hints on the page.').replace(/\*\*|__/g, '').replace(/^#+\s*/gm, '');
        msgs.push({ role: 'assistant', text: r }); say('assistant', r); send.disabled = false;
        if (turns >= MAX_TURNS) end('That is enough screen for this one. Close the screen and do this question in pen. Then try a fresh one.');
      });
    }
    send.addEventListener('click', function () { var t = box.value.trim(); if (t) go(t); });
    paper.addEventListener('click', function () { end('Close the screen. Do this question in pen, line by line, then check it against the worked answer.'); });
    msgs.push({ role: 'user', text: 'I tried this and I am stuck. Help me find my mistake.' });
    say('user', 'I’m stuck. Help me find my mistake.');
    turns = 0; go(null);
    return panel;
  }
  if (on() && document.head) { var css = document.createElement('style'); css.textContent = '.coach{border-left:4px solid #0b7285}.coachlog{max-height:320px;overflow:auto;margin:6px 0}.coachmsg{margin:6px 0;padding:6px 10px;border-radius:8px}.coachmsg.assistant{background:#e7f5f7}.coachmsg.user{background:#f4f5f7}.coach textarea{width:100%;box-sizing:border-box;font:inherit;padding:8px;border-radius:8px;border:1px solid #c9d1de}'; document.head.appendChild(css); }
  window.Coach = { on: on, open: open };
})();
