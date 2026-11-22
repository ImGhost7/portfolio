// Corner HUD, live IST clock, motion switch, scroll progress, mobile menu.
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { root, qs, qsa, pad, reduced, shared, afterUnlock } from './tb.js';

/** "motion: on/off" switch. Off applies instantly; turning it back on reloads so everything starts clean. */
export function initMotion() {
  const btn = qs('[data-motion-toggle]');
  if (!btn) return;
  const paint = () => {
    const on = !reduced();
    btn.setAttribute('aria-pressed', String(on));
    btn.textContent = 'motion: ' + (on ? 'on' : 'off');
  };
  paint();
  btn.addEventListener('click', () => {
    if (reduced()) {
      try { localStorage.setItem('tb-motion', 'on'); } catch (e) { /* storage blocked: fine */ }
      location.reload();
    } else {
      try { localStorage.setItem('tb-motion', 'off'); } catch (e) { /* storage blocked: fine */ }
      root.classList.add('reduced');
      document.dispatchEvent(new CustomEvent('tb:motion-off'));
      paint();
    }
  });
}

/** Live IST clock, plus the version label (vYYYY.MM) and © year. */
export function initClock() {
  const els = qsa('[data-clock]');
  const fmt = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23',
  });
  const paint = () => {
    const s = fmt.format(new Date());
    els.forEach((e) => (e.textContent = s));
  };
  paint();
  setInterval(paint, 1000);

  const now = new Date();
  qsa('[data-ver]').forEach((e) => (e.textContent = 'v' + now.getFullYear() + '.' + pad(now.getMonth() + 1)));
  qsa('[data-year]').forEach((e) => (e.textContent = now.getFullYear()));
}

/** Scroll progress bar, % readout, and "which section am I in" (HUD + nav highlight). */
export function initScrollHUD() {
  const bar = qs('.scroll-bar i');
  const pct = qs('[data-hud-pct]');
  const idx = qs('[data-hud-idx]');
  const name = qs('[data-hud-name]');
  const links = qsa('[data-nav]');

  // created after unlock() (first scroll / click / key press), so the measured positions are exact (see tb.js)
  afterUnlock(() => {
    ScrollTrigger.create({
      id: 'hud-progress',
      start: 0,
      end: 'max',
      onUpdate: (self) => {
        if (bar) bar.style.setProperty('--p', self.progress.toFixed(4));
        if (pct) pct.textContent = pad(Math.round(self.progress * 100), 3) + '%';
      },
    });

    qsa('[data-sec]').forEach((sec) => {
      ScrollTrigger.create({
        id: 'hud-' + sec.id,
        trigger: sec,
        start: 'top 55%',
        end: 'bottom 55%',
        onToggle: (self) => {
          if (!self.isActive) return;
          if (idx) idx.textContent = sec.dataset.sec;
          if (name) name.textContent = sec.dataset.short || sec.dataset.name;
          links.forEach((a) => {
            const on = a.dataset.nav === sec.id;
            a.classList.toggle('is-active', on);
            if (on) a.setAttribute('aria-current', 'location'); else a.removeAttribute('aria-current');
          });
        },
      });
    });
  });
}

/** Full-screen menu on phones. */
export function initMenu() {
  const btn = qs('.menu-btn');
  const menu = qs('#menu');
  if (!btn || !menu) return;
  const label = qs('[data-menu-label]', btn);
  const inertTargets = qsa('main, footer, .hud-bar');

  const set = (open) => {
    btn.setAttribute('aria-expanded', String(open));
    menu.classList.toggle('is-open', open);
    menu.setAttribute('aria-hidden', String(!open));
    menu.inert = !open;
    inertTargets.forEach((n) => (n.inert = open));
    document.body.classList.toggle('menu-open', open);
    if (label) label.textContent = open ? 'Close' : 'Menu';
    if (shared.lenis) { if (open) shared.lenis.stop(); else shared.lenis.start(); }
    if (open) {
      const first = qs('a', menu);
      if (first) setTimeout(() => first.focus({ preventScroll: true }), 60);
    }
  };
  btn.addEventListener('click', () => set(btn.getAttribute('aria-expanded') !== 'true'));
  menu.addEventListener('click', (e) => { if (e.target.closest('a')) set(false); });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && menu.classList.contains('is-open')) { set(false); btn.focus(); }
  });
  window.matchMedia('(min-width: 721px)').addEventListener('change', (m) => { if (m.matches) set(false); });
}
