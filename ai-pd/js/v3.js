/* v0.3 behaviour: the scrolling Canvas hero, the act 3 map hotspots, the screen clip,
   the studios' live frames, a "?" key list and number + Enter to jump to a slide.
   Loaded after acts.js; adds to ACT_SLIDE and ACT_FRAGMENT before deck.js merges them. */

function heroScroll() {
  const img = document.getElementById('hero-img');
  const vp = document.getElementById('hero-vp');
  if (!img || !vp) return;
  const run = () => {
    const over = img.offsetHeight - vp.offsetHeight;
    gsap.killTweensOf(img);
    gsap.fromTo(img, { y: 0 }, { y: -Math.max(0, over), duration: d(16), ease: 'sine.inOut', delay: d(1.2) });
  };
  if (img.complete) run(); else img.addEventListener('load', run, { once: true });
}

function buildHotspots() {
  const host = document.getElementById('hotspots');
  if (!host || !window.LANDING_HOTSPOTS) return;
  host.innerHTML = window.LANDING_HOTSPOTS.map((b) => `<div class="hotspot" style="left:${b.x}%;top:${b.y}%;width:${b.w}%;height:${b.h}%"></div>`).join('');
}

function showHotspot(i) {
  document.querySelectorAll('#hotspots .hotspot').forEach((h, k) => {
    gsap.to(h, { opacity: k === i ? 1 : 0, duration: d(0.4) });
    if (k === i) gsap.fromTo(h, { scale: 1.08 }, { scale: 1, duration: d(0.5), ease: 'power2.out' });
  });
}

function hotspotForCurrent() {
  const vis = [...document.querySelectorAll('#hs-list .feat.fragment.visible')];
  const last = vis[vis.length - 1];
  showHotspot(last ? +last.dataset.hs : -2);
}

function setupClip() {
  const v = document.getElementById('clip');
  if (!v) return;
  const box = v.closest('.clip');
  const fail = () => box.classList.add('novideo');
  v.addEventListener('error', fail);
  v.addEventListener('loadedmetadata', () => box.classList.remove('novideo'));
  box.classList.add('novideo'); // show the still until the video proves it can load
  v.load();
}

function playClip(on) {
  const v = document.getElementById('clip');
  if (!v || v.closest('.clip').classList.contains('novideo')) return;
  if (on) { v.currentTime = 0; v.play().catch(() => {}); } else { v.pause(); }
}

/* Keyboard: "?" shows the key list; typing a number then Enter jumps to that slide. */
const KEYS = [
  ['→ or Space', 'next step'], ['←', 'back one step'], ['Esc or O', 'overview of all slides'],
  ['F', 'full screen'], ['S', 'speaker notes and timer'], ['B or .', 'black screen'],
  ['Alt + click', 'zoom in (again to zoom out)'], ['number, then Enter', 'jump to that slide'], ['Backspace', 'back to the slide you jumped from'], ['P', 'hide or show the progress bar'], ['Space on the AI literacy slide', 'play or pause the video'], ['Esc on an open page', 'close it and stay on this slide'],
  ['Home / End', 'first / last slide'], ['?', 'this list'],
];

function setupKeys() {
  const help = document.createElement('div');
  help.className = 'keyhelp';
  help.innerHTML = `<div class="kh"><h3>Keys</h3><table>${KEYS.map(([k, v]) => `<tr><td>${k}</td><td>${v}</td></tr>`).join('')}</table></div>`;
  help.addEventListener('click', () => help.classList.remove('on'));
  document.body.appendChild(help);
  const jump = document.createElement('div');
  jump.className = 'jumpbox';
  document.body.appendChild(jump);
  let buf = '', timer;
  document.addEventListener('keydown', (e) => {
    if (e.target.closest && e.target.closest('input, textarea, iframe')) return;
    if (e.key === '?' || (e.key === '/' && e.shiftKey)) {
      help.classList.toggle('on'); e.preventDefault(); e.stopImmediatePropagation(); return;
    }
    if (help.classList.contains('on') && e.key === 'Escape') { help.classList.remove('on'); e.stopImmediatePropagation(); return; }
    if (/^[0-9]$/.test(e.key) && !e.ctrlKey && !e.altKey && !e.metaKey) {
      buf += e.key; jump.textContent = `Go to slide ${buf}, then Enter`; jump.classList.add('on');
      clearTimeout(timer); timer = setTimeout(() => { buf = ''; jump.classList.remove('on'); }, 3000);
      e.stopImmediatePropagation(); return;
    }
    if (e.key === 'Enter' && buf) {
      const n = Math.max(1, Math.min(+buf, Reveal.getTotalSlides()));
      Reveal.slide(n - 1); buf = ''; jump.classList.remove('on');
      e.preventDefault(); e.stopImmediatePropagation();
    }
  }, true);
}

ACT_SLIDE['s-hero'] = heroScroll;
ACT_SLIDE['s-studios'] = (s) => goLive(s);
ACT_SLIDE['s-canvas-hub'] = hotspotForCurrent;
delete ACT_SLIDE['s-momentum'];
delete ACT_SLIDE['s-dashboard'];
ACT_FRAGMENT.hs = () => hotspotForCurrent();
ACT_FRAGMENT.clip = (f, shown) => playClip(shown);
ACT_FRAGMENT.live = (f, shown) => { if (shown) goLive(f.closest('section')); };

const _buildActs = buildActs;
buildActs = function () { _buildActs(); buildHotspots(); setupClip(); setupKeys(); };
