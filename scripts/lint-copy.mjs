#!/usr/bin/env node
// Copy lint (issue #27, docs/spec/09-quality.md section 9.1). Checks site copy against:
//   R-007  no work authorization, visa or sponsorship wording
//   R-008  no em dashes (U+2014) in any file outside reference/
//   R-010  location is "New York, NY" everywhere
//   R-601  no emoji
//   R-603  no banned hype words
// Every failure prints: <rule ID> <file>:<line> <message>. Exit 0 = clean, 1 = failures, 2 = bad usage.
//
// Usage:
//   node scripts/lint-copy.mjs                    lint source content (src/, public/, README.md, CONTRIBUTING.md),
//                                                 build output (dist/, if present) and R-008 across the rest of the repo
//   node scripts/lint-copy.mjs --require-dist     same, but fail when dist/ is missing (use after the build)
//   node scripts/lint-copy.mjs FILE_OR_DIR ...    lint only these paths with every applicable rule
//   --root DIR                                    treat DIR as the repo root (used by the self-test)
//
// The lint skips reference/ for R-008 and skips its own fixtures in tests/fixtures/copy/.
// Source avoids unicode escape sequences on purpose: some tools expand them and the R-008 write guard would block the file.
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { basename, extname, isAbsolute, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const EM_DASH = String.fromCharCode(0x2014);
const BACKSLASH = String.fromCharCode(92);
const FIXTURE_DIR = 'tests/fixtures/copy';
const SITE_ROOTS = ['src', 'public', 'dist'];
const SITE_FILES = ['README.md', 'CONTRIBUTING.md'];
const SKIP_DIRS = new Set([
  'node_modules',
  '.git',
  '.astro',
  'coverage',
  'reports',
  'playwright-report',
  'test-results',
  '.stryker-tmp',
]);
const SKIP_PATHS = new Set(['.claude/worktrees', '.claude/state', FIXTURE_DIR]);
const BINARY_EXT = new Set([
  '.png',
  '.jpg',
  '.jpeg',
  '.gif',
  '.webp',
  '.avif',
  '.ico',
  '.woff',
  '.woff2',
  '.ttf',
  '.otf',
  '.eot',
  '.pdf',
  '.docx',
  '.zip',
  '.gz',
  '.mp4',
  '.mov',
  '.map',
]);
const CODE_EXT = new Set(['.ts', '.mts', '.cts', '.js', '.mjs', '.cjs', '.css', '.sh']);
const MAX_BYTES = 5 * 1024 * 1024;

// R-007. Mirrors the write hook, plus the common longer forms.
const WORK_AUTH = [
  /\bwork[\s-]+authori[sz]ation\b/i,
  /\bemployment[\s-]+authori[sz]ation\b/i,
  /\bauthori[sz]ed\s+to\s+work\b/i,
  /\b(?:eligible|eligibility)\s+to\s+work\b/i,
  /\bwork\s+eligibility\b/i,
  /\bright\s+to\s+work\b/i,
  /\bwork\s+permit\b/i,
  /\bvisas?\b/i,
  /\bsponsorship\b/i,
  /\bsponsor(?:ed)?\s+(?:for|by)\b/i,
  /\bh-?1-?b\b/i,
  /\bgreen\s+card\b/i,
  /\bcitizenship\b/i,
  /\b(?:u\.?s\.?|american)\s+citizens?\b/i,
  /\bpermanent\s+resident\b/i,
  /\b(?:OPT|CPT)\b/,
];

// R-603. "robust" is filler unless it names a statistical or numerical method.
const ROBUST_TECHNICAL =
  /^robust\s+(?:scal|standard\s+error|regress|statistic|estimat|covarian|loss|pca|m-estimat)/i;
const HYPE = [
  /\bpassionate(?:ly)?\b/gi,
  /\bcutting[\s-]+edge\b/gi,
  /\bleverag(?:e|es|ed|ing)\b/gi,
  /\bseamless(?:ly)?\b/gi,
  /\bunlock(?:s|ed|ing)?\b/gi,
  /\bdelv(?:e|es|ed|ing)\b/gi,
  /\bsynerg(?:y|ies|istic)\b/gi,
  /\bworld[\s-]+class\b/gi,
  /\bgame[\s-]+chang(?:er|ers|ing)\b/gi,
  /\brobust(?:ly)?\b/gi,
];

// R-010. The state list leaves out OR, IN, ME, OK and HI: they read as English words ("Python, OR R").
const STATES =
  'AL|AK|AZ|AR|CA|CO|CT|DE|DC|FL|GA|ID|IL|IA|KS|KY|LA|MD|MA|MI|MN|MS|MO|MT|NE|NV|NH|NJ|NM|NY|NC|ND|OH|PA|RI|SC|SD|TN|TX|UT|VT|VA|WA|WV|WI|WY';
const CITY_STATE = new RegExp(
  `\\b([A-Z][a-z.'-]+(?:[ ][A-Z][a-z.'-]+){0,3}),[ ]*(${STATES})\\b`,
  'g',
);
const PLACE = String.raw`(?:the\s+)?[A-Z][\w.'-]*(?:[ ]+[A-Z][\w.'-]*){0,3}(?:,[ ]*[A-Z][A-Za-z]*)?`;
const LOCATED_IN = new RegExp(
  String.raw`\b(?:based|located|living|residing|headquartered)\s+(?:in|near|out\s+of)\s+(${PLACE})`,
  'g',
);
const LIVES_IN = new RegExp(String.raw`\b(?:lives|lived|resides)\s+(?:in|near)\s+(${PLACE})`, 'g');
const LOCATION_LABEL = new RegExp(String.raw`\bLocation[ ]*:[ ]*(${PLACE})`, 'g');
const GREATER_AREA = /\bGreater\s+[A-Z][\w.'-]*(?:\s+[A-Z][\w.'-]*)*\s+Area\b/g;
const LOCALITY_KEYS = [
  [/"addressLocality"\s*:\s*"([^"]*)"/g, 'New York'],
  [/"addressRegion"\s*:\s*"([^"]*)"/g, 'NY'],
];
const REQUIRED_LOCATION = 'New York, NY';

// R-601. Extended_Pictographic covers emoji. Copyright, registered, trade mark and the arrows block
// (U+2190 to U+21FF) are plain text and allowed. Variation selector 16 and the keycap mark force emoji.
const ALLOWED_SYMBOLS = new RegExp(
  `[${String.fromCharCode(0xa9, 0xae, 0x2122, 0x2190)}-${String.fromCharCode(0x21ff)}]`,
  'g',
);
const EMOJI = new RegExp(
  `\\p{Extended_Pictographic}|\\p{Regional_Indicator}|${String.fromCharCode(0xfe0f)}|${String.fromCharCode(0x20e3)}`,
  'u',
);

// Entities and escapes that render as a character: &mdash;, &#8212;, &#x2014;, and the backslash-u forms.
const NAMED_MDASH = /&mdash;/gi;
const HEX_ENTITY = /&#x([0-9a-f]+);/gi;
const DEC_ENTITY = /&#(\d+);/g;
const BRACED_ESCAPE = new RegExp(
  `${BACKSLASH}${BACKSLASH}u${BACKSLASH}{([0-9a-f]+)${BACKSLASH}}`,
  'gi',
);
const FOUR_ESCAPE = new RegExp(`${BACKSLASH}${BACKSLASH}u([0-9a-f]{4})`, 'gi');

/** Decodes entities and escapes so a dash or emoji written in escaped form is still caught. */
function decode(line) {
  const cp = (n) => (Number.isInteger(n) && n >= 0 && n <= 0x10ffff ? String.fromCodePoint(n) : '');
  return line
    .replace(NAMED_MDASH, EM_DASH)
    .replace(HEX_ENTITY, (_, h) => cp(parseInt(h, 16)))
    .replace(DEC_ENTITY, (_, d) => cp(parseInt(d, 10)))
    .replace(BRACED_ESCAPE, (_, h) => cp(parseInt(h, 16)))
    .replace(FOUR_ESCAPE, (_, h) => String.fromCharCode(parseInt(h, 16)));
}

function lineAt(text, index) {
  let line = 1;
  for (let i = 0; i < index; i++) if (text.charCodeAt(i) === 10) line++;
  return line;
}

function applicableRules(rel, scope) {
  if (scope === 'repo') return new Set(['R-008']);
  const ext = extname(rel).toLowerCase();
  const all = ['R-007', 'R-008', 'R-010', 'R-601', 'R-603'];
  if (rel.startsWith('dist/') && ['.js', '.mjs', '.cjs', '.css'].includes(ext)) {
    return new Set(['R-008', 'R-601']);
  }
  if (CODE_EXT.has(ext)) return new Set(all.filter((r) => r !== 'R-010'));
  return new Set(all);
}

/** The candidate's own location field: top level in site.json, header in resume.json. */
function headerLocation(name, text) {
  try {
    const data = JSON.parse(text);
    return name === 'site.json' ? data?.location : data?.header?.location;
  } catch {
    return undefined;
  }
}

/**
 * Lints one file's text.
 * @param {string} rel path relative to the repo root, with forward slashes
 * @param {string} text file content
 * @param {{scope?: 'site' | 'repo'}} [options] scope 'repo' checks R-008 only
 * @returns {{rule: string, file: string, line: number, message: string}[]}
 */
export function lintText(rel, text, { scope = 'site' } = {}) {
  const rules = applicableRules(rel, scope);
  const out = [];
  const addAtLine = (rule, line, message) => out.push({ rule, file: rel, line, message });
  const add = (rule, index, message) => addAtLine(rule, lineAt(text, index), message);

  text.split(/\r?\n/).forEach((raw, i) => {
    const view = scope === 'repo' ? raw : decode(raw);
    if (rules.has('R-008') && view.includes(EM_DASH)) {
      addAtLine('R-008', i + 1, 'Em dash (U+2014). Use a comma, colon, period or parentheses.');
    }
    if (rules.has('R-601') && EMOJI.test(view.replace(ALLOWED_SYMBOLS, ''))) {
      addAtLine(
        'R-601',
        i + 1,
        'Emoji. Use text, or an inline SVG icon that uses the design tokens.',
      );
    }
  });

  if (rules.has('R-007')) {
    for (const re of WORK_AUTH) {
      for (const m of text.matchAll(new RegExp(re.source, `${re.flags}g`))) {
        add('R-007', m.index, `Work authorization wording "${m[0]}". Never state or imply it.`);
      }
    }
  }

  if (rules.has('R-603')) {
    for (const re of HYPE) {
      for (const m of text.matchAll(re)) {
        if (/^robust/i.test(m[0]) && ROBUST_TECHNICAL.test(text.slice(m.index, m.index + 40)))
          continue;
        add('R-603', m.index, `Banned word "${m[0]}". Say what was built and what it did.`);
      }
    }
  }

  if (rules.has('R-010')) {
    const wrong = (index, found) =>
      add(
        'R-010',
        index,
        `Location "${found}". The location is "${REQUIRED_LOCATION}" everywhere.`,
      );
    const isNyc = (s) => /^New York, NY(?![A-Za-z])/.test(s);
    for (const re of [LOCATED_IN, LIVES_IN, LOCATION_LABEL]) {
      for (const m of text.matchAll(re)) {
        const place = m[1].replace(/^the\s+/, '');
        if (!isNyc(place)) wrong(m.index, place);
      }
    }
    for (const m of text.matchAll(GREATER_AREA)) wrong(m.index, m[0]);
    for (const m of text.matchAll(CITY_STATE)) {
      if (!isNyc(m[0])) wrong(m.index, m[0]);
    }
    for (const [re, want] of LOCALITY_KEYS) {
      for (const m of text.matchAll(re)) if (m[1] !== want) wrong(m.index, m[1]);
    }
    const name = basename(rel);
    if (name === 'site.json' || name === 'resume.json') {
      const value = headerLocation(name, text);
      if (value !== undefined && value !== REQUIRED_LOCATION) {
        const at = text.indexOf('"location"');
        wrong(at < 0 ? 0 : at, value);
      }
    }
  }

  const unique = new Map(out.map((f) => [`${f.rule}|${f.line}|${f.message}`, f]));
  return [...unique.values()].sort((a, b) => a.line - b.line || a.rule.localeCompare(b.rule));
}

function toRel(root, abs) {
  return relative(root, abs).split(sep).join('/');
}

function isSkippedDir(rel) {
  return SKIP_PATHS.has(rel) || SKIP_DIRS.has(basename(rel));
}

function* walk(root, dirAbs) {
  const entries = readdirSync(dirAbs, { withFileTypes: true }).sort((a, b) =>
    a.name.localeCompare(b.name),
  );
  for (const entry of entries) {
    const abs = join(dirAbs, entry.name);
    if (entry.isDirectory()) {
      if (!isSkippedDir(toRel(root, abs))) yield* walk(root, abs);
    } else if (entry.isFile()) {
      yield abs;
    }
  }
}

function readText(abs) {
  if (BINARY_EXT.has(extname(abs).toLowerCase())) return undefined;
  if (statSync(abs).size > MAX_BYTES) return undefined;
  const buf = readFileSync(abs);
  if (buf.includes(0)) return undefined;
  return buf.toString('utf8');
}

/**
 * Lints a repo tree. Without `paths`, lints source content and build output with every rule
 * and the rest of the repo with R-008. With `paths`, lints those files and directories with every rule.
 */
export function lintRepo({ root, paths = [], requireDist = false }) {
  const findings = [];
  const scanned = { site: 0, repo: 0 };
  const seen = new Set();
  const lintFile = (abs, scope) => {
    const rel = toRel(root, abs);
    if (seen.has(rel)) return;
    seen.add(rel);
    if (rel.startsWith('reference/')) return; // R-008 exemption; reference/ is read-only
    const text = readText(abs);
    if (text === undefined) return;
    scanned[scope]++;
    findings.push(...lintText(rel, text, { scope }));
  };

  if (paths.length > 0) {
    for (const p of paths) {
      const abs = isAbsolute(p) ? p : resolve(process.cwd(), p);
      if (!existsSync(abs)) throw new Error(`No such path: ${p}`);
      if (statSync(abs).isDirectory()) for (const f of walk(root, abs)) lintFile(f, 'site');
      else lintFile(abs, 'site');
    }
    return { findings, scanned };
  }

  if (requireDist && !existsSync(join(root, 'dist'))) {
    throw new Error('dist/ is missing. Run "npm run build" first.');
  }
  for (const dir of SITE_ROOTS) {
    const abs = join(root, dir);
    if (existsSync(abs)) for (const f of walk(root, abs)) lintFile(f, 'site');
  }
  for (const file of SITE_FILES) {
    const abs = join(root, file);
    if (existsSync(abs)) lintFile(abs, 'site');
  }
  for (const f of walk(root, root)) lintFile(f, 'repo');
  return { findings, scanned };
}

function usage(message) {
  console.error(`lint-copy: ${message}`);
  return 2;
}

function main(argv) {
  let root = resolve(fileURLToPath(new URL('..', import.meta.url)));
  let requireDist = false;
  const paths = [];
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--root') {
      const next = argv[++i];
      if (!next) return usage('--root needs a directory');
      root = resolve(next);
    } else if (a === '--require-dist') requireDist = true;
    else if (a.startsWith('--')) return usage(`Unknown option ${a}`);
    else paths.push(a);
  }
  let result;
  try {
    result = lintRepo({ root, paths, requireDist });
  } catch (err) {
    return usage(err.message);
  }
  const { findings, scanned } = result;
  for (const f of findings) console.log(`${f.rule} ${f.file}:${f.line} ${f.message}`);
  if (findings.length > 0) {
    const files = new Set(findings.map((f) => f.file)).size;
    console.error(`\nlint-copy FAILED: ${findings.length} problem(s) in ${files} file(s).`);
    return 1;
  }
  console.log(
    `lint-copy OK: ${scanned.site} site file(s) and ${scanned.repo} other file(s) checked.`,
  );
  return 0;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  process.exitCode = main(process.argv.slice(2));
}
