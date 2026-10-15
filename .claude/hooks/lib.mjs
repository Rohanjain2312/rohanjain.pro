// Shared helpers for project hooks. Node 18+, no dependencies.
import { readFileSync, appendFileSync, mkdirSync, existsSync, realpathSync } from 'node:fs';
import { join, relative, isAbsolute, resolve, dirname } from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));

export function readInput() {
  try { return JSON.parse(readFileSync(0, 'utf8') || '{}'); } catch { return {}; }
}

export function projectDir(input) {
  return process.env.CLAUDE_PROJECT_DIR || input.cwd || process.cwd();
}

// The acting role: subagent name, or "supervisor" for the main session.
export function roleOf(input) {
  return input.agent_type && input.agent_type !== 'main' ? input.agent_type : 'supervisor';
}

export const PREFIX = {
  supervisor: 'supervisor', 'design-lead': 'design', 'frontend-engineer': 'frontend', 'app-data-engineer': 'appdata',
  'platform-engineer': 'platform', 'security-engineer': 'security', 'qa-engineer': 'qa', 'reader-advocate': 'reader',
};
export const LABEL_ROLE = { supervisor: 'supervisor', 'design-lead': 'design', 'security-engineer': 'security', 'qa-engineer': 'qa', 'reader-advocate': 'reader' };

// Repo-relative path; strips Claude Code worktree prefixes (.claude/worktrees/<name>/).
export function repoRel(p, input) {
  if (!p) return '';
  const abs = isAbsolute(p) ? p : resolve(input.cwd || projectDir(input), p);
  const m = abs.replace(/\\/g, '/').match(/\/\.claude\/worktrees\/[^/]+\/(.*)$/);
  if (m) return m[1];
  // Each worktree has its own top level; walk up to an existing directory first.
  let d = dirname(abs);
  while (d && !existsSync(d) && dirname(d) !== d) d = dirname(d);
  let realAbs = abs;
  try { const rd = realpathSync(d); realAbs = join(rd, relative(d, abs)); } catch { /* keep abs */ }
  const top = gitTop(d);
  let base = top || projectDir(input);
  try { base = realpathSync(base); } catch { /* keep base */ }
  return relative(base, realAbs).replace(/\\/g, '/');
}

export function git(args, cwd) {
  try { return execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim(); } catch { return ''; }
}
export function gitTop(cwd) { return git(['rev-parse', '--show-toplevel'], cwd); }
export function currentBranch(cwd) { return git(['rev-parse', '--abbrev-ref', 'HEAD'], cwd); }
export function headSha(cwd) { return git(['rev-parse', 'HEAD'], cwd); }

export function globToRe(glob) {
  let re = '';
  for (let i = 0; i < glob.length; i++) {
    const c = glob[i];
    if (c === '*') {
      if (glob[i + 1] === '*') { re += '.*'; i++; if (glob[i + 1] === '/') i++; }
      else re += '[^/]*';
    } else if ('.+?^${}()|[]\\'.includes(c)) re += '\\' + c;
    else re += c;
  }
  return new RegExp('^' + re + '$');
}

export function owners() {
  return JSON.parse(readFileSync(join(HERE, 'owners.json'), 'utf8'));
}

export function ownsPath(role, rel) {
  const pats = owners()[role] || [];
  let ok = false;
  for (const p of pats) {
    if (p.startsWith('!')) { if (globToRe(p.slice(1)).test(rel)) return false; }
    else if (globToRe(p).test(rel)) ok = true;
  }
  return ok;
}

function log(input, entry) {
  try {
    const dir = join(projectDir(input), '.claude', 'state');
    mkdirSync(dir, { recursive: true });
    appendFileSync(join(dir, 'hook-log.jsonl'), JSON.stringify({ t: new Date().toISOString(), role: roleOf(input), tool: input.tool_name, ...entry }) + '\n');
  } catch { /* logging must never break a hook */ }
}

export function deny(input, rule, reason) {
  const msg = `${rule}: ${reason} See docs/rules.md.`;
  log(input, { decision: 'deny', rule, reason });
  process.stdout.write(JSON.stringify({ hookSpecificOutput: { hookEventName: 'PreToolUse', permissionDecision: 'deny', permissionDecisionReason: msg } }));
  process.exit(0);
}

export function allow() { process.exit(0); }

// Minimal POSIX-like tokenizer: handles quotes and backslashes; splits on whitespace.
export function tokenize(cmd) {
  const out = []; let cur = ''; let q = null; let has = false;
  for (let i = 0; i < cmd.length; i++) {
    const c = cmd[i];
    if (q) {
      if (c === q) q = null;
      else if (c === '\\' && q === '"' && i + 1 < cmd.length) cur += cmd[++i];
      else cur += c;
    } else if (c === '"' || c === "'") { q = c; has = true; }
    else if (c === '\\' && i + 1 < cmd.length) { cur += cmd[++i]; has = true; }
    else if (/\s/.test(c)) { if (cur || has) out.push(cur); cur = ''; has = false; }
    else { cur += c; has = true; }
  }
  if (cur || has) out.push(cur);
  return out;
}

// Split a shell command into segments on && || ; | (outside quotes).
export function segments(cmd) {
  const segs = []; let cur = ''; let q = null;
  for (let i = 0; i < cmd.length; i++) {
    const c = cmd[i];
    if (q) { cur += c; if (c === q) q = null; else if (c === '\\' && q === '"') cur += cmd[++i] ?? ''; continue; }
    if (c === '"' || c === "'") { q = c; cur += c; continue; }
    if ((c === '&' && cmd[i + 1] === '&') || (c === '|' && cmd[i + 1] === '|')) { segs.push(cur); cur = ''; i++; continue; }
    if (c === ';' || c === '|' || c === '\n') { segs.push(cur); cur = ''; continue; }
    cur += c;
  }
  segs.push(cur);
  return segs.map((s) => s.trim()).filter(Boolean);
}

export function readIfExists(p) { try { return existsSync(p) ? readFileSync(p, 'utf8') : ''; } catch { return ''; } }
