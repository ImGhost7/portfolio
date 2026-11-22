// Custom cursor: a dot + a lagging ring that grows (and shows a label) over interactive things.
// Only runs for mouse-like pointers; touch devices keep the normal behaviour.
import { root, qs, reduced, finePointer, tick } from './tb.js';

export function initCursor() {
  const c = qs('.cursor');
  if (!c || !finePointer) return;
  const ring = qs('.cursor__ring', c);
  const dot = qs('.cursor__dot', c);
  const label = qs('.cursor__label', c);

  root.classList.add('has-cursor');
  c.classList.add('is-out');
  let x = innerWidth / 2;
  let y = innerHeight / 2;
  let rx = x;
  let ry = y;
  let seen = false;

  window.addEventListener('pointermove', (e) => {
    if (e.pointerType === 'touch') return;
    x = e.clientX; y = e.clientY;
    if (!seen) { seen = true; rx = x; ry = y; c.classList.remove('is-out'); }
  }, { passive: true });
  document.addEventListener('mouseleave', () => c.classList.add('is-out'));
  document.addEventListener('mouseenter', () => { if (seen) c.classList.remove('is-out'); });
  window.addEventListener('pointerdown', () => c.classList.add('is-down'));
  window.addEventListener('pointerup', () => c.classList.remove('is-down'));

  document.addEventListener('pointerover', (e) => {
    const t = e.target.closest ? e.target.closest('[data-cursor], a, button') : null;
    if (!t) { c.classList.remove('is-hover', 'is-active'); label.textContent = ''; return; }
    const l = t.getAttribute('data-cursor');
    if (l) { label.textContent = l; c.classList.add('is-active'); c.classList.remove('is-hover'); }
    else { label.textContent = ''; c.classList.add('is-hover'); c.classList.remove('is-active'); }
  });

  tick(() => {
    const k = reduced() ? 1 : 0.2;
    rx += (x - rx) * k;
    ry += (y - ry) * k;
    dot.style.transform = 'translate3d(' + x + 'px,' + y + 'px,0)';
    ring.style.transform = 'translate3d(' + rx.toFixed(1) + 'px,' + ry.toFixed(1) + 'px,0)';
  });
}
