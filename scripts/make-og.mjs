// Generates the link-preview image (public/og.png) and the favicons from the site's own fonts.
// Re-run any time with:  npm run og
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import satori from 'satori';
import sharp from 'sharp';
import { Resvg } from '@resvg/resvg-js';

const font = (p) => fs.readFileSync(new URL(`../node_modules/${p}`, import.meta.url));
const fonts = [
  { name: 'Anton', data: font('@fontsource/anton/files/anton-latin-400-normal.woff'), weight: 400, style: 'normal' },
  { name: 'IBM Plex Mono', data: font('@fontsource/ibm-plex-mono/files/ibm-plex-mono-latin-500-normal.woff'), weight: 500, style: 'normal' },
];
const out = (name) => new URL(`../public/${name}`, import.meta.url);
// the address printed in the corner of the share image comes from content.json ("site" → "url")
const content = JSON.parse(fs.readFileSync(new URL('../src/data/content.json', import.meta.url), 'utf8'));
const HOST = new URL(content.site.url).host.toUpperCase();

const INK = '#0a0a0a';
const PAPER = '#ece8e0';
const MUTE = '#8d8a84';
const RED = '#e10600';
const h = (type, style, children) => ({ type, props: { style, children } });

/* ───────── 1200 × 630 share image ───────── */
const rings = [70, 140, 220].map((r, i) =>
  h('div', {
    position: 'absolute', left: `${1010 - r}px`, top: `${150 - r}px`, width: `${r * 2}px`, height: `${r * 2}px`,
    borderRadius: '9999px', border: `2px solid rgba(225,6,0,${[0.9, 0.45, 0.22][i]})`,
  })
);
const guides = [0, 1, 2, 3, 4, 5, 6].map((i) =>
  h('div', { position: 'absolute', left: `${64 + i * (1072 / 6)}px`, top: '0px', width: '1px', height: '630px', background: 'rgba(236,232,224,0.05)' })
);

// top right: your main portrait (the first file in src/assets/portrait/, a transparent cut-out), or the red rings if there is none
let portraitUri = null;
const portraitDir = fileURLToPath(new URL('../src/assets/portrait/', import.meta.url));
const portraitFile = fs.existsSync(portraitDir)
  ? fs.readdirSync(portraitDir).filter((f) => /\.(png|jpe?g|webp)$/i.test(f)).sort()[0]
  : null;
if (portraitFile) {
  const buf = await sharp(portraitDir + portraitFile).resize(540, 540).flatten({ background: INK }).jpeg({ quality: 90 }).toBuffer();   // cut-out onto the page black
  portraitUri = 'data:image/jpeg;base64,' + buf.toString('base64');
}
const rightArt = portraitUri
  ? [{ type: 'img', props: { src: portraitUri, width: 540, height: 540, style: { position: 'absolute', left: '690px', top: '-58px', width: '540px', height: '540px' } } }]
  : [...rings, h('div', { position: 'absolute', left: '1000px', top: '140px', width: '20px', height: '20px', borderRadius: '9999px', background: RED })];

const og = h(
  'div',
  { width: '1200px', height: '630px', display: 'flex', position: 'relative', background: INK, overflow: 'hidden' },
  [
    ...guides,
    ...rightArt,

    h('div', { position: 'absolute', left: '64px', top: '46px', display: 'flex', alignItems: 'center' }, [
      h('div', { fontFamily: 'Anton', fontSize: '40px', color: PAPER, lineHeight: 1 }, 'TB'),
      h('div', { width: '9px', height: '9px', background: RED, marginLeft: '6px', marginBottom: '20px' }, ''),
      h('div', { fontFamily: 'IBM Plex Mono', fontSize: '18px', letterSpacing: '0.14em', color: MUTE, marginLeft: '24px' }, 'AI/ML ENGINEER · BUILDER'),
    ]),

    h('div', { position: 'absolute', left: '56px', top: '112px', fontFamily: 'Anton', fontSize: '206px', lineHeight: 0.86, color: PAPER }, 'TAANSHU'),
    h('div', {
      position: 'absolute', left: '548px', top: '282px', fontFamily: 'Anton', fontSize: '206px', lineHeight: 0.86,
      color: 'transparent', WebkitTextStroke: `3px ${PAPER}`,
    }, 'BABARIYA'),

    h('div', { position: 'absolute', left: '64px', bottom: '48px', display: 'flex', flexDirection: 'column' }, [
      h('div', { fontFamily: 'IBM Plex Mono', fontSize: '25px', color: '#c8c4bb', letterSpacing: '0.02em' }, 'ML systems that read, reason, and catch what humans miss.'),
      h('div', { fontFamily: 'IBM Plex Mono', fontSize: '17px', color: MUTE, letterSpacing: '0.14em', marginTop: '14px' }, 'GRAPH LEARNING / NLP / APPLIED AI  ·  MUMBAI 19.07°N 72.87°E'),
    ]),
    h('div', { position: 'absolute', right: '64px', bottom: '50px', fontFamily: 'IBM Plex Mono', fontSize: `${Math.max(11, Math.min(17, Math.floor(330 / (HOST.length * 0.74))))}px`, letterSpacing: '0.14em', color: MUTE }, HOST),
  ]
);

const ogSvg = await satori(og, { width: 1200, height: 630, fonts });
fs.writeFileSync(out('og.png'), new Resvg(ogSvg, { fitTo: { mode: 'width', value: 1200 } }).render().asPng());

/* ───────── favicon (SVG + PNGs + ICO) ───────── */
const icon = h('div', { width: '64px', height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: INK, position: 'relative' }, [
  h('div', { fontFamily: 'Anton', fontSize: '42px', color: PAPER, lineHeight: 1, marginTop: '5px', marginRight: '3px' }, 'TB'),
  h('div', { position: 'absolute', right: '8px', top: '8px', width: '8px', height: '8px', background: RED }, ''),
]);
const iconSvg = await satori(icon, { width: 64, height: 64, fonts });
fs.writeFileSync(out('favicon.svg'), iconSvg);

const png = (size) => new Resvg(iconSvg, { fitTo: { mode: 'width', value: size } }).render().asPng();
fs.writeFileSync(out('apple-touch-icon.png'), png(180));

function ico(images) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); header.writeUInt16LE(1, 2); header.writeUInt16LE(images.length, 4);
  let offset = 6 + 16 * images.length;
  const entries = images.map(({ size, data }) => {
    const e = Buffer.alloc(16);
    e.writeUInt8(size, 0); e.writeUInt8(size, 1); e.writeUInt8(0, 2); e.writeUInt8(0, 3);
    e.writeUInt16LE(1, 4); e.writeUInt16LE(32, 6); e.writeUInt32LE(data.length, 8); e.writeUInt32LE(offset, 12);
    offset += data.length;
    return e;
  });
  return Buffer.concat([header, ...entries, ...images.map((i) => i.data)]);
}
fs.writeFileSync(out('favicon.ico'), ico([{ size: 32, data: png(32) }, { size: 48, data: png(48) }]));

console.log('wrote public/og.png, favicon.svg, favicon.ico, apple-touch-icon.png');
