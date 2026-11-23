// Boot order: GSAP + ScrollTrigger, Lenis smooth scroll, then everything else.
// The page is complete HTML/CSS without any of this; scripts only add motion and polish.
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import { root, qs, qsa, easeOutExpo, reduced, shared, unlock } from './tb.js';
import { initMotion, initClock, initScrollHUD, initMenu } from './hud.js';
import { initCursor } from './cursor.js';
import { initReveals, initParallax, initCounts, parallaxMedia } from './reveal.js';
import { initTilt, initCopy, initDeck, initForm } from './interact.js';
import { initFX } from './fx.js';
import { initPortraitTurn, initPortraitHud } from './portrait.js';

gsap.registerPlugin(ScrollTrigger);

/** Runs fn and records how long it took (visible in DevTools → Performance → Timings). */
const timed = (name, fn) => {
  const t0 = performance.now();
  const out = fn();
  try { performance.measure('tb:' + name, { start: t0, end: performance.now() }); } catch (e) { /* old browsers */ }
  return out;
};

/** Smooth scrolling, wired into ScrollTrigger. Anchor links glide to their section. */
function initLenis() {
  if (reduced()) return null;
  const lenis = new Lenis({
    duration: 1.15,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smoothWheel: true,
  });
  lenis.on('scroll', ScrollTrigger.update);
  const raf = (time) => lenis.raf(time * 1000);
  gsap.ticker.add(raf);
  gsap.ticker.lagSmoothing(0);

  document.addEventListener('click', (e) => {
    const a = e.target.closest && e.target.closest('a[href^="#"]');
    if (!a) return;
    const id = a.getAttribute('href');
    if (!id || id.length < 2) return;
    const target = document.querySelector(id);
    if (!target) return;
    e.preventDefault();
    unlock(); // every section gets its real size first, so the glide lands exactly
    lenis.resize();
    // Lenis already leaves room for the header (it reads scroll-padding-top from the CSS), so no extra offset
    if (id === '#hero') lenis.scrollTo(0, { duration: 1.5 });
    else lenis.scrollTo(target, { duration: 1.5 });
    history.replaceState(null, '', id);
    target.setAttribute('tabindex', '-1');
    target.focus({ preventScroll: true });
  });

  document.addEventListener('tb:motion-off', () => {
    gsap.ticker.remove(raf);
    lenis.destroy();
    shared.lenis = null;
  });
  return lenis;
}

/** Hero: the lines, pitch and portrait animate in CSS; this adds the focus-pull readout. */
function heroIntro() {
  root.classList.add('is-ready');
  const focus = qs('[data-focus]');
  const lock = qs('[data-lock]');
  const done = () => {
    if (focus) focus.textContent = '100';
    if (lock) lock.textContent = 'lock';
    root.classList.add('is-locked');
  };
  if (reduced()) { done(); return; }
  const state = { v: 0 };
  gsap.to(state, {
    v: 1, duration: 2.7, delay: 0.35, ease: 'expo.out',
    onUpdate: () => { if (focus) focus.textContent = String(Math.round(easeOutExpo(state.v) * 100)).padStart(3, '0'); },
    onComplete: done,
  });
}

/**
 * Lazy sections (see tb.js). The first paint only has to lay out the hero. Right after it, while the browser is
 * idle, the other sections are made real ONE AT A TIME, each as its own small piece of work, so no single task
 * hogs the page (that is what keeps phones responsive). If the visitor scrolls, clicks or presses a key first,
 * whatever is left is finished right away. A page that opens part-way down (reload, back button, #link) is
 * exact from the start.
 */
function initLazySections() {
  const nav = performance.getEntriesByType && performance.getEntriesByType('navigation')[0];
  const fresh = !nav || nav.type === 'navigate';
  if (!fresh || location.hash || window.scrollY > 4 || !CSS.supports('content-visibility', 'auto')) { unlock(); return; }

  const idle = (fn, timeout) => ('requestIdleCallback' in window ? requestIdleCallback(fn, { timeout }) : setTimeout(fn, 80));
  const events = ['pointerdown', 'keydown', 'wheel', 'touchstart', 'scroll'];
  let finished = false;
  let asked = false;
  const finish = () => {
    if (finished) return;
    finished = true;
    events.forEach((t) => window.removeEventListener(t, onInput, true));
    unlock();
  };
  const onInput = () => { if (!asked) { asked = true; idle(finish, 500); } };
  events.forEach((t) => window.addEventListener(t, onInput, { capture: true, passive: true }));

  const queue = qsa('.sec, .foot');
  const next = () => {
    if (finished) return;
    const el = queue.shift();
    if (!el) { finish(); return; }
    el.classList.add('cv-live'); // this section is laid out in the next frame
    idle(next, 400);
  };
  idle(next, 400);
}

/** "motion: off" pressed: stop everything that moves, keep the HUD working. */
function killMotion() {
  ScrollTrigger.getAll().forEach((t) => { if (!String(t.vars.id || '').startsWith('hud')) t.kill(); });
  parallaxMedia.revert();
  gsap.globalTimeline.getChildren(true, true, false).forEach((t) => t.kill());
  gsap.set('[data-reveal], .dl__in, .wi, [data-parallax]', { clearProps: 'all' });
}

function boot() {
  initLazySections();
  timed('basics', () => {
    initMotion();
    initClock();
    initCursor();
    initForm();
    initCopy();
    initDeck();
    initTilt();
  });

  shared.lenis = timed('lenis', initLenis);
  timed('menu', initMenu);
  timed('hud', initScrollHUD);

  // register the scroll-triggered reveals (lazy: the actual work happens as things scroll in)
  timed('reveals', () => { initReveals(); initParallax(); initCounts(); });
  document.addEventListener('tb:motion-off', killMotion);
  root.classList.add('gsap-ready');
  heroIntro();
  timed('portrait', () => { initPortraitHud(); initPortraitTurn(); });

  // heavy visuals (WebGL smoke, canvases) wait until the page is idle, so the first paint stays fast
  const startFx = () => timed('fx', initFX);
  if ('requestIdleCallback' in window) requestIdleCallback(startFx, { timeout: 1800 });
  else setTimeout(startFx, 500);
}

boot();
