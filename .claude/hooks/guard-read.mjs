#!/usr/bin/env node
// PreToolUse guard for Read, Grep, Glob. Enforces: R-210 R-509
import { readInput, roleOf, repoRel, deny, allow } from './lib.mjs';

const input = readInput();
const ti = input.tool_input || {};
const p = ti.file_path || ti.path || '';
const rel = p ? repoRel(p, input) : '';
const role = roleOf(input);
const pattern = String(ti.pattern || ti.glob || '');

const SECRET = /(^|\/)(\.env(\.[\w.-]+)?|[^/]+\.(pem|key)|postings(\/|$)|[^/]+\.jd\.txt)$/;
if (rel && (SECRET.test(rel) || /(^|\/)postings\//.test(rel))) deny(input, 'R-509', 'Reading .env files, keys or job postings is blocked.');
if (input.tool_name === 'Glob' && /(^|\/)(\.env|postings\/|[^/]*\.jd\.txt$)/.test(pattern)) deny(input, 'R-509', 'Listing secrets or postings is blocked.');

if (role === 'reader-advocate') {
  const okDirs = ['.shots/', 'public/resume/', 'docs/reader/', 'docs/validation/'];
  const target = rel || (input.tool_name === 'Glob' ? pattern : '');
  if (!okDirs.some((d) => target.startsWith(d))) deny(input, 'R-210', `The Reader Advocate reads only ${okDirs.join(', ')}.`);
}

allow();
