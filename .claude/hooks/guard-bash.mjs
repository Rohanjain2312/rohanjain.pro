#!/usr/bin/env node
// PreToolUse guard for Bash. Enforces: R-101 R-102 R-103 R-106 R-110 R-111 R-116 R-202 R-203 R-210 R-501 R-509 R-510
import { join, isAbsolute, resolve } from 'node:path';
import { readInput, roleOf, PREFIX, LABEL_ROLE, tokenize, segments, currentBranch, headSha, gitTop, readIfExists, deny, allow, projectDir } from './lib.mjs';

const input = readInput();
if (input.tool_name && input.tool_name !== 'Bash') allow();
const cmd = String(input.tool_input?.command || '');
const role = roleOf(input);
let cwd = input.cwd || projectDir(input);

// R-510: no piping downloads into a shell; no destructive recursive deletes.
if (/\b(curl|wget)\b[^\n]*\|\s*(sudo\s+)?(sh|bash|zsh|node|python3?)\b/.test(cmd)) deny(input, 'R-510', 'Piping a download into a shell is blocked.');
if (/\brm\s+(-[a-zA-Z]*r[a-zA-Z]*f|-[a-zA-Z]*f[a-zA-Z]*r)[a-zA-Z]*\s+(\/|~|\$HOME|\.\.)(\s|\/?$)/.test(cmd)) deny(input, 'R-510', 'Recursive delete outside the repo is blocked.');

const SECRET = /(^|[\s'"=\/])(\.env(\.[\w.-]+)?|[\w.-]+\.(pem|key)|postings\/[^\s'"]*|[\w.-]+\.jd\.txt)(?=$|[\s'"])/;
const ROLE_RE = /^(design|frontend|appdata|platform|security|qa|reader|supervisor)\/\d+-[a-z0-9][a-z0-9-]*$/;

function bodyOf(t) {
  for (let i = 0; i < t.length; i++) {
    if (t[i] === '--body' || t[i] === '-b') return t[i + 1] || '';
    if (t[i].startsWith('--body=')) return t[i].slice(7);
    if (t[i] === '--body-file' || t[i] === '-F') { const f = t[i + 1] || ''; return readIfExists(isAbsolute(f) ? f : resolve(cwd, f)); }
  }
  return '';
}
function msgOf(t) {
  const parts = [];
  for (let i = 0; i < t.length; i++) {
    if (t[i] === '-m' || t[i] === '--message') parts.push(t[i + 1] || '');
    else if (t[i].startsWith('--message=')) parts.push(t[i].slice(10));
    else if (/^-[a-zA-Z]*m$/.test(t[i]) && t[i] !== '-m') parts.push(t[i + 1] || '');
    else if (t[i] === '-F' || t[i] === '--file') { const f = t[i + 1] || ''; parts.push(readIfExists(isAbsolute(f) ? f : resolve(cwd, f))); }
  }
  return parts.join('\n');
}

const segs = segments(cmd);

// R-210: the Reader Advocate may run only an allowlist.
if (role === 'reader-advocate') {
  const ok = [/^gh pr (view|checkout|comment|edit)\b/, /^npm ci\b/, /^npm run (build|preview|shots)\b/, /^(ls|pwd)\b/, /^git (status|log)\b/, /^cd\s/];
  for (const s of segs) if (!ok.some((r) => r.test(s))) deny(input, 'R-210', `The Reader Advocate may not run "${s.slice(0, 60)}". Allowed: gh pr view|checkout|comment|edit, npm ci, npm run build|preview|shots.`);
}

for (const seg of segs) {
  let t = tokenize(seg);
  if (t[0] === 'cd' && t[1]) { cwd = isAbsolute(t[1]) ? t[1] : resolve(cwd, t[1]); continue; }
  if (t[0] === 'git') {
    // strip global options: -C <path>, -c <k=v>
    const rest = [];
    let gcwd = cwd;
    for (let i = 1; i < t.length; i++) {
      if (rest.length === 0 && t[i] === '-C') { gcwd = isAbsolute(t[i + 1]) ? t[i + 1] : resolve(cwd, t[i + 1] || '.'); i++; continue; }
      if (rest.length === 0 && t[i] === '-c') { i++; continue; }
      rest.push(t[i]);
    }
    t = ['git', ...rest];
    cwd = gcwd;
  }
  const verb = t[0];

  // R-509: never read secrets or postings from the shell (npm run for may read a posting file).
  if (/^(cat|less|more|head|tail|bat|sed|awk|grep|rg|cp|mv|base64|xxd|strings|od|nl|tac|sort|uniq|diff)$/.test(verb) && SECRET.test(' ' + t.slice(1).join(' '))) {
    deny(input, 'R-509', 'Reading .env files, keys or job postings is blocked.');
  }

  if (verb === 'git') {
    const sub = t[1];
    const args = t.slice(2);
    if (args.includes('--no-verify') || (sub === 'commit' && args.includes('-n'))) deny(input, 'R-116', 'Bypassing git hooks is blocked.');

    if (sub === 'add') {
      if (args.some((a) => a === '-f' || a === '--force')) deny(input, 'R-116', 'Force-adding ignored files is blocked.');
      if (args.some((a) => /(^|\/)postings\//.test(a) || /\.jd\.txt$/.test(a))) deny(input, 'R-501', 'Job description files are never committed.');
    }

    if (sub === 'commit') {
      const branch = currentBranch(cwd);
      if (branch === 'main' || branch === 'master') deny(input, 'R-101', 'Committing on main is blocked. Create <role>/<issue>-<slug> first.');
      const amendNoEdit = args.includes('--amend') && args.includes('--no-edit');
      if (!amendNoEdit) {
        let msg = msgOf(args);
        if (!/^Agent-Role:/m.test(msg)) msg = msg + '\n' + cmd; // heredoc or stdin message
        if (!msg.trim()) deny(input, 'R-106', 'Commit with -m or -F so the message can be checked.');
        const m = msg.match(/^\s*Agent-Role:\s*(\S+)\s*$/m);
        if (!m) deny(input, 'R-106', `Add the trailer "Agent-Role: ${role}" to the commit message.`);
        if (m[1] !== role) deny(input, 'R-106', `Agent-Role is "${m[1]}" but you are "${role}".`);
      }
    }

    if (sub === 'push') {
      if (args.some((a) => a === '--force' || a === '-f' || /^\+/.test(a) || /^-[a-zA-Z]*f/.test(a) && !a.startsWith('--'))) deny(input, 'R-102', 'Force push is blocked. Use --force-with-lease on your own branch if you must.');
      if (args.includes('--delete') || args.includes('-d') || args.some((a) => /^:/.test(a))) {
        if (args.some((a) => /(^|:)(refs\/heads\/)?(main|master)$/.test(a))) deny(input, 'R-102', 'Deleting main is blocked.');
      }
      if (args.some((a) => /(^|:)(refs\/heads\/)?(main|master)$/.test(a))) deny(input, 'R-101', 'Pushing to main is blocked. Push your branch and open a PR.');
      const positional = args.filter((a) => !a.startsWith('-'));
      if (positional.length <= 1) {
        const b = currentBranch(cwd);
        if (b === 'main' || b === 'master') deny(input, 'R-101', 'You are on main. Push your branch and open a PR.');
      }
    }

    // R-103: branch names.
    let newBranch = null;
    if ((sub === 'checkout' && (args.includes('-b') || args.includes('-B'))) || (sub === 'switch' && (args.includes('-c') || args.includes('-C')))) {
      const i = args.findIndex((a) => ['-b', '-B', '-c', '-C'].includes(a));
      newBranch = args[i + 1];
    } else if (sub === 'branch' && args.length && !args[0].startsWith('-')) {
      newBranch = args[0];
    } else if (sub === 'worktree' && args[0] === 'add') {
      const i = args.findIndex((a) => a === '-b' || a === '-B');
      if (i >= 0) newBranch = args[i + 1];
    }
    if (newBranch) {
      const isAudit = /^audit\/\d+-[a-z0-9][a-z0-9-]*$/.test(newBranch);
      if (isAudit && role !== 'supervisor') deny(input, 'R-103', 'Only the Supervisor creates audit/ branches.');
      if (!isAudit) {
        if (!ROLE_RE.test(newBranch)) deny(input, 'R-103', `Branch "${newBranch}" must be <role>/<issue>-<slug>, for example ${PREFIX[role] || 'frontend'}/14-hero-section.`);
        if (newBranch.split('/')[0] !== PREFIX[role]) deny(input, 'R-103', `As ${role} your branches start with "${PREFIX[role]}/".`);
      }
    }
  }

  if (verb === 'gh' && t[1] === 'pr') {
    const sub = t[2];
    const args = t.slice(3);

    if (sub === 'merge') {
      if (role !== 'supervisor') deny(input, 'R-111', 'Only the Supervisor merges.');
      if (args.includes('--admin')) deny(input, 'R-111', 'Admin override is blocked.');
      if (args.includes('--merge') || args.includes('--rebase') || args.includes('-m') || args.includes('-r')) deny(input, 'R-111', 'Use --squash.');
      if (!args.includes('--squash') && !args.includes('-s')) deny(input, 'R-111', 'Use gh pr merge <n> --squash --delete-branch.');
      if (!args.includes('--delete-branch') && !args.includes('-d')) deny(input, 'R-111', 'Add --delete-branch.');
    }

    if (sub === 'review') deny(input, 'R-202', 'Post reviews with gh pr comment in the format from the run-review skill. GitHub does not allow approving your own PR.');

    if (sub === 'ready') {
      const top = gitTop(cwd) || cwd;
      const pkg = readIfExists(join(top, 'package.json'));
      if (/"verify"\s*:/.test(pkg)) {
        const stamp = readIfExists(join(projectDir(input), '.claude', 'state', 'verify-ok')).trim();
        if (stamp !== headSha(cwd)) deny(input, 'R-110', 'Run npm run verify on this HEAD before marking the PR ready.');
      }
    }

    if (sub === 'comment') {
      const body = bodyOf(args);
      if (/^\s*REVIEW:/m.test(body)) {
        const r = (body.match(/^Reviewer:\s*(\S+)/m) || [])[1];
        if (!r) deny(input, 'R-202', 'A review needs a "Reviewer: <role>" line.');
        if (r !== role) deny(input, 'R-203', `You are "${role}" and may not post a review as "${r}".`);
        if (!/^Head:\s*[0-9a-f]{7,40}\b/m.test(body)) deny(input, 'R-202', 'A review needs a "Head: <sha>" line.');
        if (!/^Checked:/m.test(body)) deny(input, 'R-207', 'A review needs a "Checked:" section.');
      }
    }

    if (sub === 'edit') {
      for (let i = 0; i < args.length; i++) {
        if (args[i] === '--add-label' || args[i] === '--remove-label') {
          for (const label of String(args[i + 1] || '').split(',')) {
            const m = label.trim().match(/^approved:(\w+)$/);
            if (m && LABEL_ROLE[role] !== m[1]) deny(input, 'R-203', `You are "${role}" and may not set ${label.trim()}.`);
            if (label.trim() === 'size:approved' && role !== 'supervisor') deny(input, 'R-109', 'Only the Supervisor sets size:approved.');
          }
        }
      }
    }
  }
}

allow();
