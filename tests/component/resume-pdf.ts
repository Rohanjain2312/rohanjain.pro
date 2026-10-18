// Usage: node tests/component/resume-pdf.ts [--dist dist] [--out dist/resume]
// Résumé PDFs (F-15, ADR-0010, architecture 5.8). After `astro build`, serves dist/ locally and prints each
// /print/resume/<role>/ with Playwright (Chromium) to <out>/<pdfFile>. Run by `npm run build`.
// The hook R-112 stopped Frontend from creating scripts/resume-pdf.ts, so this lives here until App/Data moves it
// (`git mv`, then fix the two relative imports and the build script). It writes to dist/ only: public/ is copied
// by Astro before this step, and public/resume/*.pdf has no .gitignore entry yet (Platform owns .gitignore).
// Checks each PDF: 1 to 2 pages, the name, email, employers, degrees and role summary present, no placeholder
// text, and every number in the PDF text traces to a claim (R-301).
import {
  createReadStream,
  existsSync,
  mkdirSync,
  readFileSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, normalize, resolve, sep } from 'node:path';
import { chromium } from '@playwright/test';
import {
  buildClaimIndex,
  checkHtml,
  formatFinding,
  type AllowEntry,
  type ClaimLike,
} from '../../src/lib/claims/check.ts';
import {
  claimsAllowlistSchema,
  claimsSchema,
  resumeSchema,
  rolesSchema,
  siteSchema,
} from '../../src/lib/content/schemas.ts';
import { extractPdfText } from './pdf-text.ts';

const args = process.argv.slice(2);
const opt = (name: string, fallback: string): string => {
  const i = args.indexOf(name);
  return resolve(i >= 0 && args[i + 1] ? args[i + 1]! : fallback);
};
const dist = opt('--dist', 'dist');
const out = opt('--out', join(dist, 'resume'));
const contentDir = resolve('src/content');

const readJson = (name: string): unknown =>
  JSON.parse(readFileSync(join(contentDir, name), 'utf8'));
const roles = rolesSchema.parse(readJson('roles.json'));
const resume = resumeSchema.parse(readJson('resume.json'));
const site = siteSchema.parse(readJson('site.json'));
const claims = claimsSchema.parse(readJson('claims.json')) as ClaimLike[];
const allowlist = existsSync(join(contentDir, 'claims-allowlist.json'))
  ? (claimsAllowlistSchema.parse(readJson('claims-allowlist.json')) as AllowEntry[])
  : [];

if (!existsSync(join(dist, 'print', 'resume'))) {
  console.error(`resume-pdf: ${dist}/print/resume is missing. Run "astro build" first.`);
  process.exit(1);
}

const TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.woff2': 'font/woff2',
  '.webp': 'image/webp',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
};

/** Minimal static server for dist/. Directories answer with their index.html. */
function serve(root: string) {
  return createServer((req, res) => {
    const path = decodeURIComponent((req.url ?? '/').split('?')[0] ?? '/');
    let file = normalize(join(root, path));
    if (file !== root && !file.startsWith(root + sep)) {
      res.writeHead(403).end();
      return;
    }
    if (existsSync(file) && statSync(file).isDirectory()) file = join(file, 'index.html');
    if (!existsSync(file)) {
      res.writeHead(404).end();
      return;
    }
    res.writeHead(200, { 'content-type': TYPES[extname(file)] ?? 'application/octet-stream' });
    createReadStream(file).pipe(res);
  });
}

const problems: string[] = [];
const server = serve(dist);
await new Promise<void>((ok) => server.listen(0, '127.0.0.1', ok));
const address = server.address();
const port = typeof address === 'object' && address ? address.port : 0;
const browser = await chromium.launch();

try {
  mkdirSync(out, { recursive: true });
  const index = buildClaimIndex(claims, [site.phone]);
  const must = [
    resume.header.name,
    resume.header.email,
    ...resume.experience.map((x) => x.company),
    ...resume.education.map((e) => e.degree),
  ];
  for (const role of roles) {
    const page = await browser.newPage();
    await page.goto(`http://127.0.0.1:${port}/print/resume/${role.id}/`, { waitUntil: 'load' });
    await page.evaluate(() => document.fonts.ready);
    await page.emulateMedia({ media: 'print' });
    const pdf = await page.pdf({
      format: 'Letter',
      printBackground: true,
      preferCSSPageSize: true,
      tagged: true,
    });
    await page.close();
    writeFileSync(join(out, role.pdfFile), pdf);

    const { pages, text } = extractPdfText(pdf);
    const flat = text.replace(/\s+/g, ' ');
    if (pages < 1 || pages > 2) problems.push(`${role.pdfFile}: ${pages} pages, expected 1 or 2.`);
    for (const m of [...must, role.summary])
      if (!flat.includes(m)) problems.push(`${role.pdfFile}: text is missing "${m.slice(0, 60)}".`);
    if (/\{\{|\}\}|undefined|\[object|\bnull\b|\bTODO\b/.test(text))
      problems.push(`${role.pdfFile}: unresolved placeholder in the text.`);
    const escaped = text.replace(/&/g, '&amp;').replace(/</g, '&lt;');
    for (const f of checkHtml(`/resume/${role.pdfFile}`, `<p>${escaped}</p>`, index, allowlist))
      problems.push(formatFinding(f));
    console.log(
      `resume-pdf: ${role.pdfFile} ${pages} page(s), ${Math.round(pdf.length / 1024)} KB`,
    );
  }
} finally {
  await browser.close();
  server.close();
}

if (problems.length) {
  for (const p of problems) console.error(`resume-pdf: ${p}`);
  process.exit(1);
}
