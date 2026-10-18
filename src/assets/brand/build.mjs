// Usage: node src/assets/brand/build.mjs
// Builds the brand files (design spec 13.1 and 13.2) and writes them to public/:
//   favicon.svg      master mark: ink square, "RJ" in paper, glyph paths from rj-paths.json
//   favicon.ico      16 and 32 px, PNG entries
//   favicon-180.png  apple touch icon, full-bleed, no transparency
//   og.png           1200 by 630 social image, from og.html and og.css
// Colors come from src/styles/tokens.css, text from site.json and home.json, fonts from public/fonts/.
// Run it again after a token, font or copy change and commit the result. Playwright (already a
// dev dependency) does the rendering. rj-paths.json comes from glyphs.py.
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..', '..', '..');
const pub = join(root, 'public');

const tokens = readFileSync(join(root, 'src', 'styles', 'tokens.css'), 'utf8');
const ink = /--ink:\s*(#[0-9a-f]{6})\b/i.exec(tokens)?.[1]?.toLowerCase();
const paper = /--paper:\s*(#[0-9a-f]{6})\b/i.exec(tokens)?.[1]?.toLowerCase();
if (!ink || !paper) throw new Error('brand: --ink or --paper not found in tokens.css');

const site = JSON.parse(readFileSync(join(root, 'src', 'content', 'site.json'), 'utf8'));
const homeFile = join(root, 'src', 'components', 'copy', 'home.json');
const home = JSON.parse(readFileSync(homeFile, 'utf8'));
const DOMAIN = 'rohanjain.pro';

// Favicon master.
const glyphs = JSON.parse(readFileSync(join(here, 'rj-paths.json'), 'utf8'));
const svg =
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${glyphs.viewBox} ${glyphs.viewBox}">` +
  `<title>RJ</title>` +
  `<rect width="${glyphs.viewBox}" height="${glyphs.viewBox}" fill="${ink}"/>` +
  `<path fill="${paper}" d="${glyphs.d}"/></svg>\n`;
writeFileSync(join(pub, 'favicon.svg'), svg);

/** ICO container with PNG payloads (supported since Windows Vista and by every browser). */
function ico(images) {
  const head = Buffer.alloc(6 + 16 * images.length);
  head.writeUInt16LE(1, 2); // type: icon
  head.writeUInt16LE(images.length, 4);
  let offset = head.length;
  images.forEach(({ size, png }, i) => {
    const e = 6 + 16 * i;
    head[e] = size; // width
    head[e + 1] = size; // height
    head.writeUInt16LE(1, e + 4); // planes
    head.writeUInt16LE(32, e + 6); // bits per pixel
    head.writeUInt32LE(png.length, e + 8);
    head.writeUInt32LE(offset, e + 12);
    offset += png.length;
  });
  return Buffer.concat([head, ...images.map((i) => i.png)]);
}

const fontFace = (family, weight, bytes) =>
  `@font-face{font-family:'${family}';font-weight:${weight};` +
  `src:url(data:font/woff2;base64,${bytes.toString('base64')}) format('woff2');}`;

const browser = await chromium.launch();
try {
  // Icons: render the SVG master at each size.
  const iconPage = await browser.newPage({ deviceScaleFactor: 1 });
  const render = async (size) => {
    await iconPage.setViewportSize({ width: size, height: size });
    await iconPage.setContent(
      `<!doctype html><meta charset="utf-8"><style>html,body{margin:0;background:${ink}}` +
        `img{display:block;width:${size}px;height:${size}px}</style>` +
        `<img alt="" src="data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}">`,
    );
    await iconPage.evaluate(() => document.images[0].decode());
    return iconPage.screenshot({ type: 'png', omitBackground: false });
  };
  const small = [];
  for (const size of [16, 32]) small.push({ size, png: await render(size) });
  writeFileSync(join(pub, 'favicon.ico'), ico(small));
  writeFileSync(join(pub, 'favicon-180.png'), await render(180));
  await iconPage.close();

  // OG image.
  const html = readFileSync(join(here, 'og.html'), 'utf8')
    .replace('{{role}}', home.hero.role)
    .replace('{{name}}', site.name)
    .replace('{{domain}}', DOMAIN)
    .replace('<link rel="stylesheet" href="og.css" />', '');
  const css = readFileSync(join(here, 'og.css'), 'utf8');
  const root_ = tokens.match(/:root\s*{[\s\S]*?\n}/)[0];
  const fonts = [
    fontFace('Newsreader', '400 600', readFileSync(join(pub, 'fonts', 'newsreader-roman.woff2'))),
    fontFace('IBM Plex Mono', 400, readFileSync(join(pub, 'fonts', 'ibm-plex-mono-400.woff2'))),
    fontFace('IBM Plex Mono', 500, readFileSync(join(pub, 'fonts', 'ibm-plex-mono-500.woff2'))),
  ].join('\n');
  const page = await browser.newPage({
    viewport: { width: 1200, height: 630 },
    deviceScaleFactor: 1,
  });
  await page.setContent(
    html.replace('</head>', `<style>${fonts}\n${root_}\n${css}</style></head>`),
  );
  await page.evaluate(() => document.fonts.ready);
  const loaded = await page.evaluate(() =>
    [...document.fonts].filter((f) => f.status === 'loaded').map((f) => f.family),
  );
  if (!loaded.includes('Newsreader') || !loaded.includes('IBM Plex Mono'))
    throw new Error(`brand: fonts did not load (${loaded.join(', ')})`);
  const textRight = await page.evaluate(() => {
    const range = document.createRange();
    range.selectNodeContents(document.querySelector('.name'));
    return range.getBoundingClientRect().right;
  });
  if (textRight > 1200 - 64)
    throw new Error(`brand: name runs past the right margin (${textRight})`);
  writeFileSync(join(pub, 'og.png'), await page.screenshot({ type: 'png' }));
  await page.close();
} finally {
  await browser.close();
}
console.log('brand: wrote favicon.svg, favicon.ico, favicon-180.png, og.png to public/');
