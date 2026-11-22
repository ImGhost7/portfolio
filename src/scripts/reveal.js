// GSAP + ScrollTrigger reveals, horizontal parallax, count-ups.
//
// Everything here is LAZY: at page load we only register what to watch (an IntersectionObserver, no layout
// reads). The real work for an element (splitting a paragraph into lines, creating its tween) happens when
// it is about to scroll into view, and touches only that element. That keeps start-up fast.
import gsap from 'gsap';
import { qs, qsa, clamp, reduced, afterUnlock } from './tb.js';

/* ───────── paragraphs → word masks with a line index (--li) ───────── */
const splitTargets = [];

function splitWords(el) {
  if (el.classList.contains('is-split')) return;
  const text = el.textContent.replace(/\s+/g, ' ').trim();
  const walk = (node) => {
    Array.from(node.childNodes).forEach((ch) => {
      if (ch.nodeType === 3) {
        const out = document.createDocumentFragment();
        ch.textContent.split(/(\s+)/).forEach((part) => {
          if (!part) return;
          if (/^\s+$/.test(part)) { out.appendChild(document.createTextNode(' ')); return; }
          const w = document.createElement('span');
          w.className = 'w';
          w.setAttribute('aria-hidden', 'true');
          const wi = document.createElement('span');
          wi.className = 'wi';
          wi.textContent = part;
          w.appendChild(wi);
          out.appendChild(w);
        });
        ch.replaceWith(out);
      } else if (ch.nodeType === 1 && ch.tagName !== 'BR') {
        walk(ch);
      }
    });
  };
  walk(el);
  // screen readers get the original sentence once, not word by word
  const sr = document.createElement('span');
  sr.className = 'sr-only';
  sr.textContent = text;
  el.prepend(sr);
  el.classList.add('is-split');
  splitTargets.push(el);
}

function measureLines(el) {
  const tops = [];
  qsa('.w', el).forEach((w) => {
    const t = w.offsetTop;
    let i = tops.findIndex((v) => Math.abs(v - t) < 6);
    if (i < 0) { tops.push(t); i = tops.length - 1; }
    w.style.setProperty('--li', i);
  });
}

const lineOf = (wi) => parseFloat(wi.parentElement.style.getPropertyValue('--li')) || 0;
const afterFonts = (fn) => {
  if (document.fonts && document.fonts.status === 'loading') document.fonts.ready.then(fn);
  else fn();
};
/**
 * Runs onEnter once, the first time `el` gets into view (its top above the 90% line of the screen), or straight
 * away if it is already behind us. This uses IntersectionObserver on purpose: it never forces a layout, so
 * elements inside the lazy sections (see tb.js) cost nothing until they are about to be seen.
 */
const pending = new Map();
let seen = null;
function watch(el, onEnter) {
  if (!('IntersectionObserver' in window)) { onEnter(); return; }
  if (!seen) {
    seen = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        const r = e.boundingClientRect;
        const behind = !e.isIntersecting && r.height > 0 && r.bottom <= (e.rootBounds ? e.rootBounds.top : 0);
        if (!e.isIntersecting && !behind) return;
        seen.unobserve(e.target);
        const fns = pending.get(e.target) || [];
        pending.delete(e.target);
        fns.forEach((fn) => fn());
      });
    }, { rootMargin: '0px 0px -10% 0px' });
  }
  if (!pending.has(el)) { pending.set(el, []); seen.observe(el); }
  pending.get(el).push(onEnter);
}

/** On phones the project cards sit in a sideways swipe rail. Its cards are clipped until swiped, so the rail itself is watched. */
const revealTarget = (el) => {
  const deck = el.closest('[data-deck]');
  return deck && /auto|scroll/.test(getComputedStyle(deck).overflowX) ? deck : el;
};

/* ───────── scroll reveals (everything below the hero) ───────── */
export function initReveals() {
  if (reduced()) return;

  // big display lines rise through their masks, one after the other
  qsa('.display').forEach((el) => {
    if (el.closest('.hero') || !el.querySelector('.dl__in')) return; // hero lines animate in CSS; small headings have no masks
    watch(el, () => {
      gsap.fromTo(qsa('.dl__in', el), { yPercent: 112 }, { yPercent: 0, duration: 1.3, ease: 'expo.out', stagger: 0.14 });
      el.classList.add('is-in'); // un-hides; the tween already holds the start position, so nothing flashes
    });
  });

  // paragraphs reveal line by line
  qsa('[data-split]').forEach((el) => {
    watch(el, () => afterFonts(() => {
      splitWords(el);
      measureLines(el);
      gsap.fromTo(qsa('.wi', el), { yPercent: 118 }, {
        yPercent: 0, duration: 1.05, ease: 'expo.out', stagger: (i, t) => lineOf(t) * 0.095,
      });
      el.classList.add('is-in');
    }));
  });

  // cards, list rows, sticker: fade + rise (delay comes from a --d:120ms style if present)
  qsa('[data-reveal]').forEach((el) => {
    watch(revealTarget(el), () => {
      const raw = getComputedStyle(el).getPropertyValue('--d').trim();
      const delay = raw.endsWith('ms') ? parseFloat(raw) / 1000 : raw.endsWith('s') ? parseFloat(raw) : 0;
      gsap.fromTo(el, { autoAlpha: 0, y: 34 }, {
        autoAlpha: 1, y: 0, duration: 1.15, ease: 'expo.out', delay, clearProps: 'opacity,visibility,transform',
      });
      el.classList.add('is-in');
    });
  });

  // keep line indexes right when the layout reflows
  let timer;
  window.addEventListener('resize', () => {
    clearTimeout(timer);
    timer = setTimeout(() => splitTargets.forEach(measureLines), 160);
  });
}

/** Oversized type drifts sideways as you scroll past it (desktop only). */
export const parallaxMedia = gsap.matchMedia();
export function initParallax() {
  if (reduced()) return;
  // set up after unlock(), so the scroll positions it measures are exact (see tb.js)
  afterUnlock(() => {
    if (reduced()) return;
    parallaxMedia.add('(min-width: 721px)', () => {
      qsa('[data-parallax]').forEach((el) => {
        const s = parseFloat(el.dataset.parallax) || 0;
        gsap.fromTo(el, { x: s + 'vw' }, {
          x: -s + 'vw', ease: 'none',
          scrollTrigger: { trigger: el.parentElement, start: 'top bottom', end: 'bottom top', scrub: true },
        });
      });
    });
  });
}

/* ───────── count-ups: numbers and their bars ───────── */
function writeNum(el, v) {
  const dec = parseInt(el.dataset.dec || '0', 10);
  const suf = el.dataset.suffix || '';
  const to = parseFloat(el.dataset.to);
  const max = parseFloat(el.dataset.max) || (suf === '%' ? 100 : to <= 1 ? 1 : to);
  el.textContent = v.toFixed(dec) + suf;
  const host = el.closest('.metric, .tl__prog, .gauge');
  if (host) host.style.setProperty('--p', clamp(v / max, 0, 1).toFixed(4));
}

export function countUp(el) {
  if (el._tween) return;
  const to = parseFloat(el.dataset.to);
  if (isNaN(to)) return;
  if (reduced()) { writeNum(el, to); return; }
  const state = { v: 0 };
  writeNum(el, 0);
  el._tween = gsap.to(state, {
    v: to, duration: 1.5, ease: 'expo.out',
    onUpdate: () => writeNum(el, state.v),
    onComplete: () => { writeNum(el, to); el._tween = null; },
  });
}

export function initCounts() {
  // the degree-progress figure is computed from today's date, not typed
  const prog = qs('[data-degree]');
  if (prog && prog.dataset.start && prog.dataset.end) {
    const a = new Date(prog.dataset.start).getTime();
    const b = new Date(prog.dataset.end).getTime();
    const num = qs('.num', prog);
    if (num) num.dataset.to = String(Math.round(clamp((Date.now() - a) / (b - a), 0, 1) * 100));
  }
  const nums = qsa('.num[data-to]');
  if (reduced()) { nums.forEach((n) => writeNum(n, parseFloat(n.dataset.to))); return; }
  // the HTML already contains the final numbers; each one counts up from zero as it scrolls in
  nums.forEach((n) => watch(n, () => countUp(n)));
}
