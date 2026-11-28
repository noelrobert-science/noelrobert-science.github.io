/* Learning first talk (28 Nov 2026). */
Reveal.initialize({
  width: 1920, height: 1080, margin: 0, minScale: 0.1, maxScale: 3,
  center: false, hash: true, controls: true, controlsTutorial: false, progress: true,
  slideNumber: 'c/t', transition: 'fade', showNotes: false,
  plugins: [RevealNotes],
});

/* links that open another page */
document.addEventListener('click', (e) => {
  const b = e.target.closest('[data-href]');
  if (b) window.location.href = b.dataset.href;
});

/* slide 3: watch for 15 seconds, then write what you remember */
(() => {
  const root = document.getElementById('demo');
  if (!root) return;
  const facts = [...root.querySelectorAll('.dfact')];
  const write = root.querySelector('.write');
  const bar = root.querySelector('.bar');
  const timer = document.getElementById('demo-timer');
  const steps = [...document.querySelectorAll('#demo-steps li')];
  const startBtn = document.getElementById('demo-start');
  const revealBtn = document.getElementById('demo-reveal');
  const TOTAL = 15, PER = TOTAL / facts.length;
  let t0 = 0, raf = 0;
  const step = (i) => steps.forEach((s, k) => s.classList.toggle('now', k === i));
  const reset = () => {
    cancelAnimationFrame(raf); facts.forEach((f) => f.classList.remove('on'));
    write.classList.remove('on'); bar.style.width = '0'; timer.textContent = '15'; step(0);
    revealBtn.hidden = true; startBtn.textContent = '▶ Start the 15 seconds';
  };
  const tick = (now) => {
    const s = (now - t0) / 1000;
    if (s >= TOTAL) {
      facts.forEach((f) => f.classList.remove('on')); write.classList.add('on');
      bar.style.width = '100%'; timer.textContent = '0'; step(1); revealBtn.hidden = false; return;
    }
    const i = Math.min(facts.length - 1, Math.floor(s / PER));
    facts.forEach((f, k) => f.classList.toggle('on', k === i));
    bar.style.width = (s / TOTAL * 100) + '%'; timer.textContent = String(Math.ceil(TOTAL - s));
    raf = requestAnimationFrame(tick);
  };
  startBtn.addEventListener('click', () => { reset(); root.classList.remove('all'); root.classList.add('running'); startBtn.textContent = '↺ Start again'; t0 = performance.now(); raf = requestAnimationFrame(tick); });
  revealBtn.addEventListener('click', () => { write.classList.remove('on'); root.classList.add('all'); facts.forEach((f) => f.classList.add('on')); step(2); });
  reset();
})();

/* slide 12: the click */
(() => {
  const b = document.getElementById('bulb-btn');
  if (b) b.addEventListener('click', () => { const on = document.getElementById('bulb').classList.toggle('on'); document.getElementById('lf-click').classList.toggle('lit', on); });
})();

/* slide 13: the Monday test */
(() => {
  const ticks = [...document.querySelectorAll('.tick')];
  const v = document.getElementById('verdict');
  if (!ticks.length) return;
  const say = () => {
    const n = ticks.filter((t) => t.getAttribute('aria-pressed') === 'true').length;
    v.classList.toggle('all', n === 4);
    v.textContent = n === 4 ? '4 of 4. Keep it.' : n === 0 ? 'Pick one tool you used this week. Tick what it does.' : n + ' of 4. Change how you use it, or drop it.';
  };
  ticks.forEach((t) => t.addEventListener('click', () => { t.setAttribute('aria-pressed', t.getAttribute('aria-pressed') === 'true' ? 'false' : 'true'); say(); }));
  say();
})();
