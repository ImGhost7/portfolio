import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { readFileSync } from 'node:fs';

// The live address of the site is kept in src/data/content.json ("site" → "url"), the one file you edit.
// If Netlify gives you a different name, or you connect a custom domain later, change it there
// (the README lists the two other spots: public/robots.txt and `npm run og`).
const SITE = JSON.parse(readFileSync(new URL('./src/data/content.json', import.meta.url), 'utf8')).site.url;

export default defineConfig({
  site: SITE,
  integrations: [
    // sitemap-index.xml is generated at build time; the thank-you and 404 pages stay out of it
    sitemap({ filter: (page) => !page.includes('/thanks') && !page.includes('/404') }),
  ],
  build: {
    // put the (small) stylesheet straight into the HTML: one request less, faster first paint
    inlineStylesheets: 'always',
  },
  compressHTML: true,
});
