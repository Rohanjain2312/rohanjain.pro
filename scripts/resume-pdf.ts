// Usage: node scripts/resume-pdf.ts [--dist dist] [--out dist/resume]
// Résumé PDFs (F-15, ADR-0010, architecture 5.8). After `astro build`, serves dist/ locally and prints each
// /print/resume/<role>/ with Playwright (Chromium) to <out>/<pdfFile>. Run by `npm run build`.
// It writes to dist/ only. File paths never come from request or argument data: the server answers from a map
// built by walking dist/, and each PDF name comes from a fixed role-to-file table.
// Checks each PDF: 1 to 2 pages, the name, email, employers, degrees and role summary present, no placeholder
// text, and every number in the PDF text traces to a claim (R-301).
import {
  createReadStream,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  writeFileSync,
} from 'node:fs';
import { createServer } from 'node:http';
import { extname, isAbsolute, join, relative, resolve, sep } from 'node:path';
import { chromium } from '@playwright/test';
import {
  buildClaimIndex,
  checkHtml,
  formatFinding,
  type AllowEntry,
  type ClaimLike,
} from '../src/lib/claims/check.ts';
import {
  claimsAllowlistSchema,
  claimsSchema,
  resumeSchema,
  rolesSchema,
} from '../src/lib/content/schemas.ts';
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

/** Every file under root, keyed by its URL path. Request data is only ever a lookup key. */
function indexFiles(root: string): Map<string, string> {
  const files = new Map<string, string>();
  const walk = (dir: string): void => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.isFile()) files.set('/' + relative(root, full).split(sep).join('/'), full);
    }
  };
  walk(root);
  return files;
}

/** Minimal static server for dist/. A path ending in "/" answers with its index.html. */
function serve(root: string) {
  const files = indexFiles(root);
  return createServer((req, res) => {
    let url: string;
    try {
      url = decodeURIComponent((req.url ?? '/').split('?')[0] ?? '/');
    } catch {
      res.writeHead(400).end();
      return;
    }
    const file =
      files.get(url.endsWith('/') ? url + 'index.html' : url) ?? files.get(url + '/index.html');
    if (!file) {
      res.writeHead(404).end();
      return;
    }
    res.writeHead(200, { 'content-type': TYPES[extname(file)] ?? 'application/octet-stream' });
    createReadStream(file).pipe(res);
  });
}

/** Fixed role-to-file table. The output name never comes from argv, env or a URL. */
const PDF_FILES: Readonly<Record<string, string>> = {
  ai: 'Rohan-Jain-AI-Engineer.pdf',
  ml: 'Rohan-Jain-ML-Engineer.pdf',
  ds: 'Rohan-Jain-Data-Scientist.pdf',
};

/** Output path for a role: the table name, resolved under `out`, which must stay inside it. */
function pdfPath(roleId: string): string {
  const name = Object.hasOwn(PDF_FILES, roleId) ? PDF_FILES[roleId] : undefined;
  if (!name) throw new Error(`resume-pdf: unknown role "${roleId}".`);
  const target = resolve(out, name);
  const rel = relative(out, target);
  if (rel === '' || rel.startsWith('..') || isAbsolute(rel)) {
    throw new Error('resume-pdf: output path escapes the output directory.');
  }
  return target;
}

const problems: string[] = [];
const server = serve(dist);
await new Promise<void>((ok) => server.listen(0, '127.0.0.1', ok));
const address = server.address();
const port = typeof address === 'object' && address ? address.port : 0;
const browser = await chromium.launch();

try {
  mkdirSync(out, { recursive: true });
  const index = buildClaimIndex(claims);
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
    if (role.pdfFile !== PDF_FILES[role.id])
      problems.push(`${role.id}: pdfFile does not match the fixed table.`);
    writeFileSync(pdfPath(role.id), pdf);

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
