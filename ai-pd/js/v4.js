/* v0.4: the foundation slide. Each click shows one more part; the focus panel carries the full
   wording and a small animation for the current part, so the stage never gets crowded.
   Loaded after v3.js; adds to ACT_SLIDE and ACT_FRAGMENT before deck.js merges them. */

const FD_ICONS = {
  hub: '<svg class="fdi" viewBox="0 0 64 64"><path class="cover" d="M14 10h26l10 10v34H14z"/><path d="M40 10v10h10"/><path d="M21 30h22M21 38h22M21 46h14"/></svg>',
  lens: '<svg class="fdi" viewBox="0 0 64 64"><rect x="8" y="12" width="32" height="42" rx="3"/><path d="M14 22h20M14 30h20M14 38h12"/><g class="lensg"><circle cx="44" cy="30" r="11" class="fillbg"/><path d="M52 38l8 8"/></g></svg>',
  git: '<svg class="fdi" viewBox="0 0 64 64"><path d="M8 32h48"/><circle class="v v1" cx="14" cy="32" r="6"/><circle class="v v2" cx="32" cy="32" r="6"/><circle class="v v3" cx="50" cy="32" r="6"/><path class="rew" d="M44 16a16 16 0 1 0 4 16" /></svg>',
  gh: '<svg class="fdi" viewBox="0 0 64 64"><g class="folder"><path d="M8 18h18l4 6h26v28H8z"/></g><g class="web" opacity="0"><rect x="8" y="14" width="48" height="38" rx="4"/><path d="M8 24h48"/><circle cx="14" cy="19" r="1.5"/><circle cx="19" cy="19" r="1.5"/></g></svg>',
  bk: '<svg class="fdi" viewBox="0 0 64 64"><rect x="14" y="28" width="36" height="28" rx="4"/><path class="shackle" d="M22 28v-8a10 10 0 0 1 20 0v8"/><circle cx="32" cy="42" r="3"/></svg>',
};

const FD_TEXT = {
  hub: ['One rules hub', "It's like the induction pack every new teacher gets. It's one file of my rules that every AI reads before it starts: no pupil names, my house style, never overwrite, check your own work. I stopped repeating myself in every chat."],
  lens: ['A lens skill', "My design lens written as a recipe. The AI picks it up by itself whenever it makes a book or a lesson, like clipping the department's playbook to every job."],
  git: ['Git', '"Track changes" for a whole folder. Every save becomes a numbered snapshot with a note on what changed, so nothing is ever lost and I can always go back. It\'s save-as v1, v2, v3, but automatic.'],
  gh: ['GitHub', 'An online home for those folders. GitHub Pages turns a folder into a free website. That\'s how pupils open the studios, and how this deck is online.'],
  bk: ['Backup', 'A private copy of all my teaching material, <b><span id="fd-count">521</span> files</b>, safe on GitHub. If the laptop dies or I change AI tools, the work is still mine.'],
};
const FD_ORDER = ['hub', 'lens', 'git', 'gh', 'bk'];

function fdBuild() {
  document.querySelectorAll('#s-foundation .fd-ic[data-icon]').forEach((el) => { el.innerHTML = FD_ICONS[el.dataset.icon]; });
  const after = document.getElementById('fd-after-icons');
  if (after) after.innerHTML = FD_ORDER.map((k) => FD_ICONS[k]).join('');
}

function fdArt(k) {
  const art = document.getElementById('fd-art');
  art.innerHTML = FD_ICONS[k].replace('viewBox="0 0 64 64"', 'viewBox="0 0 64 64" width="200" height="160"');
  const s = art.querySelector('svg');
  if (k === 'hub') gsap.fromTo(s.querySelector('.cover'), { scaleX: 0.2, transformOrigin: '20% 50%' }, { scaleX: 1, duration: d(0.9), ease: 'back.out(1.6)' });
  if (k === 'lens') gsap.fromTo(s.querySelector('.lensg'), { x: 30, y: -30, opacity: 0 }, { x: -10, y: 0, opacity: 1, duration: d(0.9), ease: 'power2.out' });
  if (k === 'git') {
    gsap.fromTo(s.querySelectorAll('.v'), { scale: 0, transformOrigin: '50% 50%' }, { scale: 1, duration: d(0.35), stagger: d(0.35), ease: 'back.out(2)' });
    gsap.fromTo(s.querySelector('.rew'), { opacity: 0, rotate: 0, transformOrigin: '32px 32px' }, { opacity: 1, rotate: -300, duration: d(1), delay: d(1.2) });
  }
  if (k === 'gh') {
    gsap.to(s.querySelector('.folder'), { opacity: 0, duration: d(0.5), delay: d(0.6) });
    gsap.to(s.querySelector('.web'), { opacity: 1, duration: d(0.5), delay: d(0.6) });
  }
  if (k === 'bk') {
    gsap.fromTo(s.querySelector('.shackle'), { y: -8 }, { y: 0, duration: d(0.4), delay: d(0.6), ease: 'bounce.out' });
    const c = document.getElementById('fd-count'); const o = { v: 0 };
    if (c) gsap.to(o, { v: 521, duration: d(1.4), ease: 'power2.out', onUpdate: () => { c.textContent = Math.round(o.v); } });
  }
}

function fdStep() {
  const slide = document.getElementById('s-foundation');
  if (!slide) return;
  const shown = [...slide.querySelectorAll('.fragment.visible')].map((f) => +f.dataset.fragmentIndex);
  const step = shown.length ? Math.max(...shown) + 1 : 0; // 0 = only the card
  const card = document.getElementById('fd-card');
  const bubbles = slide.querySelectorAll('.fd-bubbles i');
  const panel = document.getElementById('fd-panel');
  // Click 1: chat bubbles evaporate, the card glows
  gsap.to(bubbles, { opacity: step >= 1 ? 0 : 1, y: step >= 1 ? -40 : 0, duration: d(0.8), stagger: d(0.12) });
  gsap.to(card, { boxShadow: step >= 1 ? '0 0 90px rgba(227,18,27,.55)' : '0 0 0 rgba(0,0,0,0)', duration: d(0.8) });
  // Clicks 2 to 6: current chip highlighted, its full text in the panel
  slide.querySelectorAll('.fd-chip').forEach((c) => c.classList.toggle('cur', +c.dataset.fragmentIndex === step - 1));
  const k = step >= 2 && step <= 6 ? FD_ORDER[step - 2] : null;
  if (k) {
    document.getElementById('fd-pt').textContent = FD_TEXT[k][0];
    document.getElementById('fd-px').innerHTML = FD_TEXT[k][1];
    gsap.to(panel, { opacity: 1, duration: d(0.3) });
    fdArt(k);
    const chip = slide.querySelector(`.fd-chip[data-k="${k}"]`);
    const scale = Reveal.getScale() || 1;
    const cr = card.getBoundingClientRect(), hr = chip.getBoundingClientRect();
    gsap.fromTo(chip, { x: (cr.left + cr.width / 2 - hr.left - hr.width / 2) / scale, y: (cr.top + cr.height / 2 - hr.top - hr.height / 2) / scale, scale: 0.3 },
      { x: 0, y: 0, scale: 1, duration: d(0.8), ease: 'back.out(1.4)' });
  } else {
    gsap.to(panel, { opacity: 0, duration: d(0.3) });
  }
  // Click 7: before/after
  if (step === 7) {
    gsap.fromTo(slide.querySelectorAll('.before-scene .bub'), { opacity: 1, y: 0 }, { opacity: 0.1, y: -30, duration: d(1.2), stagger: d(0.2), delay: d(0.4) });
    gsap.fromTo(slide.querySelectorAll('#fd-after-icons svg'), { scale: 0, opacity: 0 }, { scale: 1, opacity: 1, duration: d(0.4), stagger: d(0.18), delay: d(0.6), ease: 'back.out(2)' });
  }
  // Click 8: the Allow button gets clicked
  const allow = document.getElementById('fd-allow');
  allow.classList.remove('clicked');
  if (step === 8) gsap.timeline({ delay: d(0.8) }).to(allow, { scale: 0.9, duration: d(0.12) }).to(allow, { scale: 1, duration: d(0.2), onComplete: () => allow.classList.add('clicked') });
}

ACT_SLIDE['s-foundation'] = fdStep;
ACT_FRAGMENT.fdstep = () => fdStep();

const _buildActs3 = buildActs;
buildActs = function () { _buildActs3(); fdBuild(); };
