// Usage: node scripts/check-claims.ts [--dist <dir>] [--content <dir>] [--require-dist]
// R-301: every number in the visible text of built HTML maps to a claim in claims.json.
// Exits 1 and names the page, the number and the nearest text. Without dist/ it skips, unless --require-dist.
// PDF text is checked once the PDF generator lands (docs/spec/06-architecture.md section 5.8).
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import {
  buildClaimIndex,
  checkHtml,
  formatFinding,
  pageName,
  type AllowEntry,
  type ClaimLike,
  type Finding,
} from '../src/lib/claims/check.ts';
import { claimsAllowlistSchema, claimsSchema, siteSchema } from '../src/lib/content/schemas.ts';

const args = process.argv.slice(2);
const opt = (name: string, fallback: string): string => {
  const i = args.indexOf(name);
  return resolve(i >= 0 && args[i + 1] ? args[i + 1]! : fallback);
};
const dist = opt('--dist', 'dist');
const contentDir = opt('--content', 'src/content');

if (!existsSync(dist)) {
  if (args.includes('--require-dist')) {
    console.error(`R-301: ${dist} is missing. Run the build first.`);
    process.exit(1);
  }
  console.log('check-claims: no dist/ yet, skipped');
  process.exit(0);
}

const readJson = (name: string): unknown => {
  const path = join(contentDir, name);
  if (!existsSync(path)) {
    console.error(`R-301: ${name} is missing`);
    process.exit(1);
  }
  return JSON.parse(readFileSync(path, 'utf8'));
};

function htmlFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((n) => {
    const p = join(dir, n);
    if (statSync(p).isDirectory()) return htmlFiles(p);
    return n.endsWith('.html') ? [p] : [];
  });
}

const claims = claimsSchema.parse(readJson('claims.json')) as ClaimLike[];
const site = siteSchema.parse(readJson('site.json'));
const allowlist = existsSync(join(contentDir, 'claims-allowlist.json'))
  ? (claimsAllowlistSchema.parse(readJson('claims-allowlist.json')) as AllowEntry[])
  : [];
const allowed = buildClaimIndex(claims, [site.phone]);

const findings: Finding[] = [];
const files = htmlFiles(dist).sort();
if (files.length === 0) {
  if (args.includes('--require-dist')) {
    console.error(`R-301: ${dist} has no HTML files. Run the build first.`);
    process.exit(1);
  }
  console.log('check-claims: dist/ has no HTML yet, skipped');
  process.exit(0);
}
for (const file of files) {
  const page = pageName(relative(dist, file));
  findings.push(...checkHtml(page, readFileSync(file, 'utf8'), allowed, allowlist));
}

for (const f of findings) console.error(formatFinding(f));
if (findings.length) {
  console.error(`check-claims: ${findings.length} unclaimed number(s) in ${files.length} page(s).`);
  process.exit(1);
}
console.log(`check-claims: OK (${files.length} page(s))`);
