// Small shared helpers. Every other script imports from here.
import gsap from 'gsap';

export const root = document.documentElement;
export const qs = (s, c) => (c || document).querySelector(s);
export const qsa = (s, c) => Array.from((c || document).querySelectorAll(s));
export const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
export const lerp = (a, b, t) => a + (b - a) * t;
export const pad = (n, l = 2) => String(n).padStart(l, '0');
export const easeOutExpo = (t) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t));

/** True when motion should be minimal (OS setting or the on-page switch). */
export const reduced = () => root.classList.contains('reduced');

/** Mouse-like pointer present (the custom cursor and card tilt only run there). */
export const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

/** Run fn(milliseconds) every frame. GSAP's ticker is the one shared loop. Returns a stop function. */
export const tick = (fn) => {
  const handler = (time) => fn(time * 1000);
  gsap.ticker.add(handler);
  return () => gsap.ticker.remove(handler);
};

/** { visible } follows whether el is near the viewport, so canvases can sleep off-screen. */
export function visible(el, margin = '160px 0px') {
  const state = { visible: true };
  if (!('IntersectionObserver' in window)) return state;
  state.visible = false;
  new IntersectionObserver((entries) => entries.forEach((e) => (state.visible = e.isIntersecting)), { rootMargin: margin }).observe(el);
  return state;
}

/** Things main.js shares with other modules. */
export const shared = { lenis: null };

/*
 * Lazy sections. To make the first load fast, the sections below the hero are laid out only when they get
 * close to the screen (CSS content-visibility, see extra.css). Their sizes are estimates until then.
 * unlock() switches that off, so every position on the page is exact. It runs on the first scroll / click /
 * key press (see main.js). Code that measures sections or scroll positions waits for it with afterUnlock().
 */
let unlocked = false;
const waiting = [];
export const afterUnlock = (fn) => { if (unlocked) fn(); else waiting.push(fn); };
export function unlock() {
  if (unlocked) return;
  unlocked = true;
  root.classList.add('cv-off');
  waiting.splice(0).forEach((fn) => fn());
}
