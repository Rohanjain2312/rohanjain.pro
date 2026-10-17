#!/usr/bin/env node
// PreToolUse guard for Edit, Write, MultiEdit, NotebookEdit. Enforces: R-007 R-008 R-112 R-113 R-610
import { readInput, roleOf, repoRel, ownsPath, currentBranch, deny, allow } from './lib.mjs';
import { dirname, isAbsolute, resolve } from 'node:path';

const input = readInput();
const ti = input.tool_input || {};
const file = ti.file_path || ti.notebook_path || ti.path || '';
const rel = repoRel(file, input);
const role = roleOf(input);

const text = [ti.content, ti.new_string, ti.new_source, ...(Array.isArray(ti.edits) ? ti.edits.map((e) => e.new_string) : [])]
  .filter((x) => typeof x === 'string').join('\n');

if (rel.startsWith('reference/')) deny(input, 'R-113', 'reference/ is read-only.');

// #58: .npmrc must keep ignore-scripts=true; an edit may not set it to anything else or remove it.
if (/(^|\/)\.npmrc$/.test(rel)) {
  const olds = [ti.old_string, ...(Array.isArray(ti.edits) ? ti.edits.map((e) => e.old_string) : [])].filter((x) => typeof x === 'string').join('\n');
  const setsOther = /ignore-scripts\s*=\s*(?!true\b)/i.test(text);
  const removes = ti.content !== undefined ? !/^\s*ignore-scripts\s*=\s*true\b/im.test(ti.content) : (/ignore-scripts/i.test(olds) && !/ignore-scripts\s*=\s*true\b/i.test(text));
  if (setsOther || removes) deny(input, 'R-509', '.npmrc must keep ignore-scripts=true (#58).');
}

const base = rel.split('/').pop();
if (/^public\/.*\.md$/i.test(rel) || /^src\/pages\/.*\.md$/i.test(rel)) deny(input, 'R-610', 'Markdown in public/ or src/pages/ would be served as a page.');
if (base === 'CLAUDE.md' && rel !== 'CLAUDE.md' && rel !== '.claude/CLAUDE.md') deny(input, 'R-610', 'Use .claude/rules/<topic>.md with paths: frontmatter instead of a nested CLAUDE.md.');

if (text.includes(String.fromCharCode(0x2014))) deny(input, 'R-008', 'Em dashes are not allowed. Use a comma, colon, period or parentheses.');

if (/^(src|public)\//.test(rel)) {
  const banned = /\b(work authori[sz]ation|work permit|visa|sponsorship|sponsor(ed)?\s+(for|by)|h-?1b|green card|authori[sz]ed to work|citizenship)\b/i;
  if (banned.test(text) || /\b(OPT|CPT)\b/.test(text)) deny(input, 'R-007', 'Work authorization, visa or sponsorship status is never stated.');
}

if (rel && !rel.startsWith('../') && !rel.startsWith('.claude/state/')) {
  const absDir = dirname(isAbsolute(file) ? file : resolve(input.cwd || '.', file));
  const onAudit = role === 'supervisor' && /^audit\//.test(currentBranch(absDir));
  if (!onAudit && !ownsPath(role, rel)) deny(input, 'R-112', `As ${role} you may not edit ${rel}. Open an issue for the owning role.`);
}

allow();
