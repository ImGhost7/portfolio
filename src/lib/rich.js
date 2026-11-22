// Tiny, safe text helpers used by the components. You never need to edit this file.

/** Escape characters that have a meaning in HTML. */
export const esc = (s) =>
  String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** *word* becomes <em>word</em>, **word** becomes <strong>word</strong> (anything else is escaped first). */
export const rich = (s) =>
  esc(s).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/\*(.+?)\*/g, '<em>$1</em>');

/** Titles: every " & " becomes the red ampersand. */
export const amp = (s) => esc(s).replace(/ &amp; /g, ' <span class="amp">&amp;</span> ');

export const pad = (n, l = 2) => String(n).padStart(l, '0');

/** Text written in [square brackets] is a placeholder. */
export const isTodo = (s) => typeof s === 'string' && /^\[.*\]$/.test(s.trim());

/** Rich text, but placeholders get the red "fill me in" highlight. */
export const fmt = (s) => (isTodo(s) ? `<span class="todo">${esc(s)}</span>` : rich(s));

/** True on the live site; false while you run `npm run dev` on your own computer. */
export const isProd = import.meta.env.PROD;

/** Items marked "draft": true are hidden from the live site (but visible, tagged, while developing). */
export const live = (list) => (list || []).filter((x) => !(x && x.draft && isProd));
