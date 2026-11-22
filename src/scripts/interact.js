// Interactions: card tilt, copy-email, mobile card rail indicator, contact form.
import { qs, qsa, clamp, pad, reduced, finePointer } from './tb.js';
import { countUp } from './reveal.js';

/** Project cards tilt toward the pointer; their metrics re-count on hover. */
export function initTilt() {
  if (!finePointer) return;
  const MAX = 4.5;
  qsa('[data-tilt]').forEach((card) => {
    let tx = 0, ty = 0, rx = 0, ry = 0, raf = 0, over = false;
    const apply = () => {
      const mag = Math.hypot(rx, ry);
      card.style.rotate = mag < 0.02 ? 'none' : rx.toFixed(3) + ' ' + ry.toFixed(3) + ' 0 ' + mag.toFixed(3) + 'deg';
    };
    const step = () => {
      rx += (tx - rx) * 0.12;
      ry += (ty - ry) * 0.12;
      apply();
      if (over || Math.abs(rx - tx) > 0.01 || Math.abs(ry - ty) > 0.01) raf = requestAnimationFrame(step);
      else { raf = 0; rx = ry = 0; card.style.rotate = ''; }
    };
    const kick = () => { if (!raf) raf = requestAnimationFrame(step); };
    card.addEventListener('pointerenter', (e) => {
      if (e.pointerType !== 'mouse' || reduced()) return;
      over = true;
      qsa('.num[data-to]', card).forEach(countUp);
      kick();
    });
    card.addEventListener('pointermove', (e) => {
      if (e.pointerType !== 'mouse' || reduced()) return;
      const r = card.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width;
      const py = (e.clientY - r.top) / r.height;
      tx = (0.5 - py) * 2 * MAX;
      ty = (px - 0.5) * 2 * MAX;
      kick();
    });
    card.addEventListener('pointerleave', () => { over = false; tx = ty = 0; kick(); });
  });
}

/** "Copy" button next to the e-mail address. */
export function initCopy() {
  qsa('[data-copy]').forEach((btn) => {
    const label = qs('[data-copy-label]', btn);
    const live = qs('[data-copy-live]', btn);
    btn.addEventListener('click', async () => {
      const txt = btn.dataset.copy;
      let ok = false;
      try { await navigator.clipboard.writeText(txt); ok = true; }
      catch (e) {
        const ta = document.createElement('textarea');
        ta.value = txt;
        ta.setAttribute('readonly', '');
        ta.style.cssText = 'position:fixed;top:-100px;opacity:0';
        document.body.appendChild(ta);
        ta.select();
        try { ok = document.execCommand('copy'); } catch (e2) { ok = false; }
        ta.remove();
      }
      if (label) label.textContent = ok ? 'Copied' : 'Press Ctrl+C';
      if (live) live.textContent = ok ? 'Email address copied to clipboard' : 'Copy failed';
      btn.classList.toggle('is-done', ok);
      setTimeout(() => { if (label) label.textContent = 'Copy'; btn.classList.remove('is-done'); }, 1800);
    });
  });
}

/** Phones: which card of the swipe rail am I on? */
export function initDeck() {
  const deck = qs('[data-deck]');
  const idx = qs('[data-deck-idx]');
  const hint = qs('.deck__hint');
  if (!deck || !idx) return;
  let ticking = false;
  const upd = () => {
    ticking = false;
    const cards = qsa('.deploy', deck);
    if (cards.length < 2) return;
    const step = cards[1].offsetLeft - cards[0].offsetLeft || 1;
    const max = deck.scrollWidth - deck.clientWidth;
    idx.textContent = pad(clamp(Math.round(deck.scrollLeft / step), 0, cards.length - 1) + 1);
    if (hint) hint.style.setProperty('--deck-p', (max > 0 ? deck.scrollLeft / max : 0).toFixed(3));
  };
  deck.addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(upd); } }, { passive: true });
}

/**
 * Contact form. Netlify collects the submission; this just sends it without leaving the page.
 * (Without JavaScript the form still works: it posts and lands on /thanks/.)
 */
export function initForm() {
  const form = qs('[data-form]');
  if (!form) return;
  const status = qs('[data-form-status]', form);
  const btn = qs('button[type="submit"]', form);
  const label = qs('[data-label]', btn);

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!form.reportValidity()) return;
    btn.disabled = true;
    label.textContent = form.dataset.sending;
    status.textContent = '';
    status.removeAttribute('data-state');
    try {
      const body = new URLSearchParams(new FormData(form)).toString();
      const res = await fetch('/', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      form.reset();
      status.textContent = form.dataset.success;
      status.dataset.state = 'ok';
    } catch (err) {
      status.textContent = form.dataset.error;
      status.dataset.state = 'err';
    } finally {
      btn.disabled = false;
      label.textContent = form.dataset.send;
    }
  });
}
