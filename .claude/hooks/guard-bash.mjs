#!/usr/bin/env node
// PreToolUse guard for Bash. Enforces: R-101 R-102 R-103 R-106 R-109 R-110 R-111 R-116 R-202 R-203 R-207 R-210 R-501 R-509 R-510
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

// R-509 tripwires on the raw command (ADR-0018): substitution, wrappers and quoting do not hide these.
const RAW_DENY = [
  [/\bgh\s+auth\s+token\b/, 'Printing the GitHub token is blocked.'],
  [/--show-token\b/, 'Printing the GitHub token is blocked.'],
  [/\bgh\s+auth\s+git-credential\b/, 'Reading GitHub credentials is blocked.'],
  [/\bgit\s+(-\S+\s+(\S+\s+)?)*credential(-[\w-]+)?\b/, 'Reading or changing git credentials is blocked.'],
  [/\bGH_(TOKEN|ENTERPRISE_TOKEN|HOST)=/, 'Setting GitHub CLI credentials or host is blocked.'],
  [/\bgh\s+issue\s+transfer\b/, 'Transferring issues is blocked.'],
  [/(^|[\s;|&])-c\s*["']?(remote\.[^\s=]+\.(push)?url|url\.[^\s=]+\.(push)?insteadof)=/i, 'Overriding remote URLs is blocked.'],
  [/\bgit\b(?![^\n;|&]*\s--(get|get-all|get-regexp|list)\b)[^\n;|&]*\bconfig\b[^\n;|&]*\b(remote\.[^\s]+\.(push)?url|url\.[^\s]+\.(push)?insteadof)\b/i, 'Changing remote URLs is blocked.'],
  [/\bgit\b[^\n;|&]*\bpush\b[^\n;|&]*--repo\b/, 'Push only to origin.'],
  [/\brepositories\/\d+/, 'Use repos/<owner>/<name> paths; repositories/<id> is blocked.'],
];
for (const [re, why] of RAW_DENY) if (re.test(cmd)) deny(input, 'R-509', why);
{
  const m = cmd.match(/\bGH_REPO=["']?([^\s"';|&]+)/);
  if (m && m[1].replace(/^https:\/\/github\.com\//, '').toLowerCase() !== 'rohanjain2312/rohanjain.pro') deny(input, 'R-509', 'GH_REPO may name only Rohanjain2312/rohanjain.pro.');
}

const SECRET = /(^|[\s'"=\/])(\.env(\.[\w.-]+)?|[\w.-]+\.(pem|key)|postings\/[^\s'"]*|[\w.-]+\.jd\.txt)(?=$|[\s'"])/;
const ROLE_RE = /^(design|frontend|appdata|platform|security|qa|reader|supervisor)\/\d+-[a-z0-9][a-z0-9-]*$/;

function fileText(f) { return readIfExists(isAbsolute(f) ? f : resolve(cwd, f)); }
// Comment body as the hook can see it. Bodies it cannot see (stdin without a heredoc,
// command substitution without a heredoc) are denied so reviews are always checkable (R-202).
function bodyOf(t) {
  let body = null;
  let file = null;
  for (let i = 0; i < t.length; i++) {
    if (t[i] === '--body' || t[i] === '-b') body = t[i + 1] || '';
    else if (t[i].startsWith('--body=')) body = t[i].slice(7);
    else if (t[i] === '--body-file' || t[i] === '-F') file = t[i + 1] || '';
    else if (t[i].startsWith('--body-file=')) file = t[i].slice(12);
  }
  if (file === '-') {
    if (!/<</.test(cmd)) deny(input, 'R-202', 'Use --body text or --body-file <path> so the comment can be checked.');
    return cmd;
  }
  if (file !== null) return fileText(file);
  if (body !== null && /\$\(|`/.test(body) && !/<</.test(body)) deny(input, 'R-202', 'Command substitution in a comment body hides it from checks. Use --body text or --body-file <path>.');
  return body || '';
}
// Unwrap env/command/exec/nohup/time prefixes, VAR=value assignments and sh -c strings.
const WRAPPERS = new Set(['env', 'command', 'exec', 'nohup', 'time', 'builtin', 'xargs']);
function expand(seg, depth = 0) {
  let t = tokenize(seg);
  while (t.length) {
    if (WRAPPERS.has(t[0])) { t = t.slice(1); while (t.length && /^-/.test(t[0])) t = t.slice(1); continue; }
    if (/^[A-Za-z_][A-Za-z0-9_]*=/.test(t[0])) { t = t.slice(1); continue; }
    break;
  }
  if (/^(sh|bash|zsh|dash)$/.test(t[0] || '')) {
    const i = t.findIndex((a) => /^-[a-z]*c$/.test(a));
    if (i >= 0 && t[i + 1] !== undefined) {
      if (depth > 3) deny(input, 'R-203', 'Nested shell wrappers are blocked.');
      return segments(t[i + 1]).flatMap((s) => expand(s, depth + 1));
    }
  }
  return [t];
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

function checkReview(body) {
  const r = (body.match(/^Reviewer:\s*(\S+)/m) || [])[1];
  if (!r) deny(input, 'R-202', 'A review needs a "Reviewer: <role>" line.');
  if (r !== role) deny(input, 'R-203', `You are "${role}" and may not post a review as "${r}".`);
  if (!/^Head:\s*[0-9a-f]{7,40}\b/m.test(body)) deny(input, 'R-202', 'A review needs a "Head: <sha>" line.');
  if (!/^Checked:/m.test(body)) deny(input, 'R-207', 'A review needs a "Checked:" section.');
}
function checkLabels(labels) {
  for (const raw of labels) {
    const label = String(raw).trim();
    const m = label.match(/^approved:(\w+)$/);
    if (m && LABEL_ROLE[role] !== m[1]) deny(input, 'R-203', `You are "${role}" and may not set ${label}.`);
    if (label === 'size:approved' && role !== 'supervisor') deny(input, 'R-109', 'Only the Supervisor sets size:approved.');
  }
}

const THIS_REPO = 'rohanjain2312/rohanjain.pro';
const READ_SUBS = new Set(['view', 'list', 'diff', 'checks', 'status', 'search']);

const segs = segments(cmd);

// R-210: the Reader Advocate may run only an allowlist.
if (role === 'reader-advocate') {
  const ok = [/^gh pr (view|checkout|comment|edit)\b/, /^npm ci\b/, /^npm run (build|preview|shots)\b/, /^(ls|pwd)\b/, /^git (status|log)\b/, /^cd\s/];
  for (const s of segs) if (!ok.some((r) => r.test(s))) deny(input, 'R-210', `The Reader Advocate may not run "${s.slice(0, 60)}". Allowed: gh pr view|checkout|comment|edit, npm ci, npm run build|preview|shots.`);
}

for (let t of segs.flatMap((s) => expand(s))) {
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

    if (sub === 'add' || sub === 'stage' || sub === 'mv') {
      if (args.some((a) => /(^|\/)src\/content\/applications(\/(?!\.gitkeep$).*)?\/?$/.test(a))) deny(input, 'R-501', 'Application result files live in the private APPLICATIONS_DIR, never in this repo (ADR-0016).');
    }
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

    if (sub === 'remote' && ['add', 'set-url', 'rename', 'remove', 'rm'].includes(args[0]) && role !== 'supervisor') deny(input, 'R-509', 'Only the Supervisor changes git remotes.');
    if (sub === 'push') {
      const remote = args.filter((a) => !a.startsWith('-'))[0];
      if (remote && remote !== 'origin') deny(input, 'R-509', `Push only to origin (${THIS_REPO}), not "${remote}".`);
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

  if (verb === 'gh') {
    // Untrusted input can steer agents; keep the token and other repos out of reach (#45).
    if (t[1] === 'auth' && (t[2] === 'token' || t.includes('--show-token') || t.includes('-t'))) deny(input, 'R-509', 'Printing the GitHub token is blocked.');
    if (t[1] === 'auth' && ['login', 'logout', 'refresh', 'setup-git', 'switch'].includes(t[2])) deny(input, 'R-509', 'Changing GitHub CLI auth is a client-only step (docs/needs-client.md).');
    if (t[1] === 'repo' && ['delete', 'rename', 'archive', 'unarchive', 'create', 'fork', 'set-default', 'deploy-key'].includes(t[2])) deny(input, 'R-509', `gh repo ${t[2]} is blocked.`);
    if (t[1] === 'repo' && t[2] === 'edit') {
      const target = t.slice(3).find((a) => !a.startsWith('-') && a.includes('/'));
      if (role !== 'supervisor') deny(input, 'R-111', 'Only the Supervisor edits repository settings.');
      if (target && target.toLowerCase() !== THIS_REPO) deny(input, 'R-509', `Only ${THIS_REPO} may be edited.`);
    }
    if (['secret', 'variable', 'ssh-key', 'gpg-key', 'extension', 'alias', 'config'].includes(t[1]) && !['list', 'view', 'get'].includes(t[2]) && role !== 'supervisor') deny(input, 'R-509', `gh ${t[1]} ${t[2] || ''} is Supervisor-only.`);
    const bare = [];
    const repos = [];
    for (let i = 1; i < t.length; i++) {
      if (t[i] === '-R' || t[i] === '--repo') { repos.push(String(t[i + 1] || '')); i++; continue; }
      if (t[i].startsWith('--repo=')) { repos.push(t[i].slice(7)); continue; }
      if (/^-R./.test(t[i])) { repos.push(t[i].slice(2)); continue; }
      bare.push(t[i]);
    }
    const ghSub = bare.filter((a) => !a.startsWith('-'))[1];
    for (const v of repos) if (v.replace(/^https:\/\/github\.com\//, '').toLowerCase() !== THIS_REPO && !READ_SUBS.has(ghSub)) deny(input, 'R-509', `Write commands may target only ${THIS_REPO}.`);
  }

  if (verb === 'gh' && (t[1] === 'pr' || t[1] === 'issue')) {
    const kind = t[1];
    const sub = t[2];
    const args = t.slice(3);

    if (kind === 'pr' && sub === 'merge') {
      if (role !== 'supervisor') deny(input, 'R-111', 'Only the Supervisor merges.');
      if (args.includes('--admin')) deny(input, 'R-111', 'Admin override is blocked.');
      if (args.includes('--merge') || args.includes('--rebase') || args.includes('-m') || args.includes('-r')) deny(input, 'R-111', 'Use --squash.');
      if (!args.includes('--squash') && !args.includes('-s')) deny(input, 'R-111', 'Use gh pr merge <n> --squash --delete-branch.');
      if (!args.includes('--delete-branch') && !args.includes('-d')) deny(input, 'R-111', 'Add --delete-branch.');
    }

    if (kind === 'pr' && sub === 'review') deny(input, 'R-202', 'Post reviews with gh pr comment in the format from the run-review skill. GitHub does not allow approving your own PR.');

    if (kind === 'pr' && sub === 'ready') {
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
        if (kind === 'issue') deny(input, 'R-202', 'Post reviews with gh pr comment.');
        checkReview(body);
      }
    }

    if (sub === 'edit' || sub === 'create') {
      const labelFlags = sub === 'create' ? ['--label', '-l'] : ['--add-label', '--remove-label'];
      for (let i = 0; i < args.length; i++) {
        if (labelFlags.includes(args[i])) checkLabels(String(args[i + 1] || '').split(','));
        for (const f of labelFlags) if (f.startsWith('--') && args[i].startsWith(f + '=')) checkLabels(args[i].slice(f.length + 1).split(','));
      }
    }
  }

  // gh api: the same rules for raw API writes (R-111, R-202, R-203, R-101, R-102).
  if (verb === 'gh' && t[1] === 'api') {
    const args = t.slice(2);
    const VALUE_FLAGS = ['-X', '--method', '-f', '-F', '--field', '--raw-field', '--input', '-H', '--header', '--jq', '-q', '-t', '--template', '--hostname', '--cache', '-p', '--preview'];
    let method = '';
    let endpoint = '';
    const fields = [];
    let hasInput = false;
    let inputText = '';
    // -F key=@file reads the file; check its text as the value.
    const typedField = (f) => { const k = f.indexOf('='); return k > 0 && f[k + 1] === '@' ? f.slice(0, k + 1) + fileText(f.slice(k + 2)) : f; };
    for (let i = 0; i < args.length; i++) {
      const a = args[i];
      if (a === '-X' || a === '--method') { method = String(args[i + 1] || '').toUpperCase(); i++; continue; }
      if (a.startsWith('--method=')) { method = a.slice(9).toUpperCase(); continue; }
      if (/^-X[A-Za-z]+$/.test(a)) { method = a.slice(2).toUpperCase(); continue; }
      if (['-F', '--field'].includes(a)) { fields.push(typedField(String(args[i + 1] || ''))); i++; continue; }
      if (/^--field=/.test(a)) { fields.push(typedField(a.slice(8))); continue; }
      if (['-f', '--raw-field'].includes(a)) { fields.push(String(args[i + 1] || '')); i++; continue; }
      if (/^--raw-field=/.test(a)) { fields.push(a.slice(12)); continue; }
      if (a === '--input') { hasInput = true; inputText += fileText(String(args[i + 1] || '')); i++; continue; }
      if (a.startsWith('--input=')) { hasInput = true; inputText += fileText(a.slice(8)); continue; }
      if (VALUE_FLAGS.includes(a)) { i++; continue; }
      if (!a.startsWith('-') && !endpoint) endpoint = a;
    }
    const path = endpoint.replace(/^https?:\/\/[^/]+/, '').replace(/^\//, '').split('?')[0];
    const write = (method && method !== 'GET') || (!method && (fields.length > 0 || hasInput));
    const m = path.match(/^repos\/([^/]+\/[^/]+)/);
    if (write && m && m[1].toLowerCase() !== THIS_REPO && !/^\{owner\}\/\{repo\}$/.test(m[1])) deny(input, 'R-509', `API writes may target only ${THIS_REPO}.`);
    if (write && /^(user|orgs|users|authorizations|applications|gists)(\/|$)/.test(path)) deny(input, 'R-509', 'API writes outside this repository are blocked.');
    if (path === 'graphql') {
      const q = [...fields, inputText, cmd].join('\n');
      if (/\bmutation\b/i.test(q) || hasInput) deny(input, 'R-203', 'GraphQL mutations are blocked. Use the gh pr and gh issue commands.');
    } else if (write) {
      if (/(^|\/)pulls\/\d+\/merge$/.test(path)) deny(input, 'R-111', 'Merge with gh pr merge <n> --squash --delete-branch, not gh api.');
      if (/(^|\/)pulls\/\d+\/reviews(\/|$)/.test(path)) deny(input, 'R-202', 'Post reviews with gh pr comment in the format from the run-review skill.');
      if (/(^|\/)rulesets(\/|$)/.test(path) || /(^|\/)branches\/[^/]+\/protection(\/|$)/.test(path)) {
        if (role !== 'supervisor') deny(input, 'R-111', 'Only the Supervisor changes rulesets or branch protection.');
        if (method === 'DELETE') deny(input, 'R-111', 'Deleting a ruleset or branch protection is blocked.');
      }
      if (/(^|\/)git\/refs(\/|$)/.test(path)) {
        if (role !== 'supervisor') deny(input, 'R-101', 'Only the Supervisor writes git refs through the API.');
        if (/heads\/(main|master)$/.test(path) && method === 'DELETE') deny(input, 'R-102', 'Deleting main is blocked.');
        if (/heads\/(main|master)$/.test(path) || fields.some((f) => /^ref=refs\/heads\/(main|master)$/.test(f))) deny(input, 'R-101', 'Moving main through the API is blocked. Merge a PR.');
      }
      if (/(^|\/)issues\/\d+\/labels(\/|$)/.test(path)) {
        if (hasInput) deny(input, 'R-203', 'Add labels with -f labels[]=<label> so the role check can read them.');
        const tail = decodeURIComponent(path.split(/\/labels\/?/)[1] || '');
        const labels = fields.filter((f) => /^labels(\[\])?=/.test(f)).map((f) => f.slice(f.indexOf('=') + 1));
        checkLabels(tail ? [tail, ...labels] : labels);
      }
      if (/(^|\/)issues\/\d+$/.test(path) || /(^|\/)issues$/.test(path)) {
        if (hasInput) deny(input, 'R-203', 'Edit issues with -f fields so the role check can read labels.');
        checkLabels(fields.filter((f) => /^labels(\[\])?=/.test(f)).map((f) => f.slice(f.indexOf('=') + 1)));
      }
      if (/(^|\/)(issues|pulls)\/(\d+\/)?comments(\/|$)/.test(path)) {
        if (hasInput) deny(input, 'R-202', 'Post comments with gh pr comment so reviews can be checked.');
        const body = fields.filter((f) => /^body=/.test(f)).map((f) => f.slice(5)).join('\n');
        if (/^\s*REVIEW:/m.test(body)) deny(input, 'R-202', 'Post reviews with gh pr comment.');
      }
    }
  }
}

allow();
