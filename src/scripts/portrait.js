// The portrait: further angles of the same person take over, one after another, as the page scrolls (a slow head
// turn). They download only when the page is idle (or on the first scroll), so the first paint stays fast.
// Which images are used lives in src/components/Hero.astro (the files in src/assets/portrait/).
import { qs, qsa, pad, reduced, root } from './tb.js';

// The small read-outs in the corners of the picture ("Focus 100%", "Frame 001", ...) would run into the menu bar as soon as
// the page starts to scroll, so they fade out over the first moments of scrolling instead.
export function initPortraitHud() {
  const phs = qsa('.portrait__hud .ph');
  if (!phs.length) return;
  let hide = 0;   // how far (px) the page has to scroll before the read-outs would touch the menu bar
  let fade = 0;   // they fade out over the last part of that distance (all of it on a phone)
  let ticking = false;
  const update = () => {
    ticking = false;
    if (!hide) {
      hide = Math.max(phs[0].getBoundingClientRect().top + window.scrollY - 66, 30);
      fade = Math.min(44, hide);
    }
    const o = Math.max(0, Math.min(1, (hide - window.scrollY) / fade));
    phs.forEach((p) => { p.style.opacity = o > 0.99 ? '' : o.toFixed(2); });
  };
  window.addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
  window.addEventListener('resize', () => { hide = 0; }, { passive: true });
}

export function initPortraitTurn() {
  const media = qs('[data-frames]');
  if (!media || reduced()) return;
  let cfg;
  try { cfg = JSON.parse(media.dataset.frames); } catch (e) { return; }
  if (!cfg || !cfg.turns || !cfg.turns.length) return;

  const main = qs('.portrait__img--main', media);
  const label = qs('.ph--br');                 // "Frame 001"
  const lock = qs('[data-lock]');              // "lock" (flickers to "seek" while the frame changes)
  const imgs = [main];                         // index 0 = the main portrait, the rest are the turned angles
  const n = cfg.turns.length + 1;
  // how far (in pixels) the page has scrolled when each frame takes over: the portrait leaves the screen as the page
  // scrolls, so the whole turn has to happen in the first moments of scrolling (24px, 68px, ...)
  const takeOver = (i) => (i === 0 ? 0 : 28 + (i - 1) * 56);
  let loaded = false;
  let current = 0;
  let wanted = 0;
  let stopped = false;

  const load = () => {
    if (loaded) return;
    loaded = true;
    cfg.turns.forEach((t, i) => {
      const im = new Image();
      im.className = 'portrait__img portrait__img--alt';
      im.alt = '';
      im.setAttribute('aria-hidden', 'true');
      im.decoding = 'async';
      im.sizes = cfg.sizes;
      im.srcset = t.srcset;
      im.src = t.src;
      imgs[i + 1] = im;
      media.appendChild(im);
    });
  };

  const apply = (idx) => {
    if (stopped || idx === current || !imgs[idx]) return;
    current = idx;
    // every angle up to the current one stays switched on, stacked in order, so the picture underneath is always still
    // there while the next one fades in (a true cross-fade: the portrait never dips to black in between)
    imgs.forEach((im, i) => { if (i > 0) im.classList.toggle('is-on', i <= idx); });
    if (label) label.textContent = 'Frame ' + pad(idx + 1, 3);
    if (lock && root.classList.contains('is-locked')) {
      lock.textContent = 'seek';
      setTimeout(() => { if (!stopped) lock.textContent = 'lock'; }, 420);
    }
  };

  const show = (idx) => {
    wanted = idx;
    const el = imgs[idx];
    if (!el) return;
    // wait until the picture is decoded, so a frame never pops in half-drawn
    if (el.decode) el.decode().then(() => { if (wanted === idx) apply(idx); }, () => apply(idx));
    else apply(idx);
  };

  let ticking = false;
  const update = () => {
    ticking = false;
    if (stopped) return;
    const y = window.scrollY;
    let idx = 0;
    for (let i = 1; i < imgs.length; i++) if (y >= takeOver(i)) idx = i;
    if (idx !== wanted) show(idx);
  };
  const onScroll = () => {
    load();
    if (!ticking) { ticking = true; requestAnimationFrame(update); }
  };
  window.addEventListener('scroll', onScroll, { passive: true });

  // fetch the other angles a moment after the page has settled, even if nobody scrolls yet
  const later = () => setTimeout(() => ('requestIdleCallback' in window ? requestIdleCallback(load, { timeout: 2500 }) : load()), 2000);
  if (document.readyState === 'complete') later(); else window.addEventListener('load', later, { once: true });

  // "motion: off": back to the main portrait, nothing changes any more
  document.addEventListener('tb:motion-off', () => {
    stopped = true;
    imgs.forEach((im, i) => { if (i > 0) im.classList.remove('is-on'); });
    if (label) label.textContent = 'Frame 001';
    if (lock) lock.textContent = 'lock';
  });
}
