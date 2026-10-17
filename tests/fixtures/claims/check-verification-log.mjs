#!/usr/bin/env node
// Completeness check for the claims verification log (issue #28, rule R-303).
// Every claim in src/content/claims.json needs one row in docs/qa/claims-verification.md.
// Row format (5 cells): | `claim-id` | `value` | source checked | result | YYYY-MM-DD |
// Result is one of: verified, verified-note, mismatch #<issue>, unsourced.
//
// Usage (run from the repo root):
//   node tests/fixtures/claims/check-verification-log.mjs                   fail on a missing, stale, duplicate or malformed entry
//   node tests/fixtures/claims/check-verification-log.mjs --require-clean   also fail on any entry that is not verified or verified-note
//   --claims FILE --log FILE                                                override the default paths (used by the self-test)
// Exit 0 = complete, 1 = problems found, 2 = bad usage or unreadable input.
// This file lives under tests/ because R-112 keeps the QA role out of scripts/.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

export const RESULTS = ['verified', 'verified-note', 'mismatch', 'unsourced'];
const CLEAN = new Set(['verified', 'verified-note']);
const COLUMNS = 5;

function isRealDate(text) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) return false;
  const d = new Date(`${text}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === text;
}

function unwrap(cell) {
  const m = /^`(.*)`$/.exec(cell.trim());
  return m ? m[1] : null;
}

/** Parses the data rows of the log. A data row is a table row whose first cell is a backticked id. */
export function parseLog(markdown) {
  const entries = [];
  const malformed = [];
  markdown.split('\n').forEach((line, index) => {
    const text = line.trim();
    if (!text.startsWith('|')) return;
    const cells = text.replace(/^\|/, '').replace(/\|$/, '').split('|');
    if (unwrap(cells[0]) === null) return;
    if (cells.length !== COLUMNS) {
      malformed.push({
        line: index + 1,
        message: `expected ${COLUMNS} cells, found ${cells.length}`,
      });
      return;
    }
    const [id, value, source, result, date] = cells.map((c) => c.trim());
    entries.push({ line: index + 1, id: unwrap(id), value: unwrap(value), source, result, date });
  });
  return { entries, malformed };
}

/** Compares claims with log entries. Returns { errors, warnings } as arrays of strings. */
export function checkLog(claims, markdown, { requireClean = false } = {}) {
  const errors = [];
  const warnings = [];
  const { entries, malformed } = parseLog(markdown);
  for (const m of malformed) errors.push(`log line ${m.line}: ${m.message}`);

  const byId = new Map();
  for (const e of entries) {
    if (byId.has(e.id)) {
      errors.push(
        `log line ${e.line}: duplicate entry for claim "${e.id}" (first at line ${byId.get(e.id).line})`,
      );
      continue;
    }
    byId.set(e.id, e);
  }

  const claimIds = new Set(claims.map((c) => c.id));
  for (const claim of claims) {
    const e = byId.get(claim.id);
    if (!e) {
      errors.push(`claim "${claim.id}" has no verification entry`);
      continue;
    }
    const where = `log line ${e.line} ("${e.id}")`;
    if (e.value !== String(claim.value)) {
      errors.push(
        `${where}: value is \`${e.value}\` but claims.json has \`${String(claim.value)}\`; re-verify the claim`,
      );
    }
    if (e.source.length === 0) errors.push(`${where}: source checked is empty`);
    if (!isRealDate(e.date))
      errors.push(`${where}: date "${e.date}" is not a real YYYY-MM-DD date`);
    const word = e.result.split(/\s+/)[0];
    if (!RESULTS.includes(word)) {
      errors.push(`${where}: result "${e.result}" is not one of ${RESULTS.join(', ')}`);
    } else if (word === 'mismatch' && !/^mismatch #\d+$/.test(e.result)) {
      errors.push(`${where}: a mismatch must cite its issue, for example "mismatch #123"`);
    } else if (word !== 'mismatch' && e.result !== word) {
      errors.push(`${where}: result "${e.result}" has extra text; put detail in the source column`);
    } else if (!CLEAN.has(word)) {
      const message = `${where}: result is "${e.result}"`;
      (requireClean ? errors : warnings).push(message);
    }
  }
  for (const e of byId.values()) {
    if (!claimIds.has(e.id)) {
      errors.push(`log line ${e.line}: entry "${e.id}" matches no claim in claims.json; remove it`);
    }
  }
  return { errors, warnings };
}

function parseArgs(argv) {
  const opts = {
    claims: 'src/content/claims.json',
    log: 'docs/qa/claims-verification.md',
    requireClean: false,
  };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--require-clean') opts.requireClean = true;
    else if ((arg === '--claims' || arg === '--log') && argv[i + 1]) {
      opts[arg.slice(2)] = argv[i + 1];
      i += 1;
    } else throw new Error(`unknown argument: ${arg}`);
  }
  return opts;
}

function main(argv) {
  let opts;
  let claims;
  let markdown;
  try {
    opts = parseArgs(argv);
    claims = JSON.parse(readFileSync(opts.claims, 'utf8'));
    markdown = readFileSync(opts.log, 'utf8');
    if (!Array.isArray(claims)) throw new Error(`${opts.claims} is not a JSON array`);
  } catch (e) {
    console.error(`check-verification-log: ${e.message}`);
    return 2;
  }
  const { errors, warnings } = checkLog(claims, markdown, { requireClean: opts.requireClean });
  for (const w of warnings) console.warn(`warning: ${w}`);
  for (const e of errors) console.error(`R-303 ${e}`);
  if (errors.length > 0) {
    console.error(`check-verification-log: ${errors.length} problem(s).`);
    return 1;
  }
  console.log(
    `check-verification-log: OK (${claims.length} claims, ${warnings.length} open finding(s))`,
  );
  return 0;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) process.exit(main(process.argv.slice(2)));
