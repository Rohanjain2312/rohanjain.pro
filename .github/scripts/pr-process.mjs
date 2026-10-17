#!/usr/bin/env node
// PR process checks for review-gate.yml, branch-name.yml, pr-hygiene.yml and labeler.yml (#14, #42).
// Usage: node .github/scripts/pr-process.mjs branch-name|pr-hygiene|review-gate|labeler --pr <number> [--repo owner/name]
// Reads the PR through `gh api` (GH_TOKEN). Every failure line starts with its rule ID (docs/rules.md).
// The checking functions are pure so .github/lint-fixtures/pr-process.test.mjs can run them on fixtures.
// Text from the PR (title, body, branch, comments) is data: it is parsed, never executed or put in a shell.
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

export const ROLES = [
  'supervisor',
  'design-lead',
  'frontend-engineer',
  'app-data-engineer',
  'platform-engineer',
  'security-engineer',
  'qa-engineer',
  'reader-advocate',
];
// Branch prefix per role. Must match PREFIX in .claude/hooks/lib.mjs.
export const PREFIX = {
  supervisor: 'supervisor',
  'design-lead': 'design',
  'frontend-engineer': 'frontend',
  'app-data-engineer': 'appdata',
  'platform-engineer': 'platform',
  'security-engineer': 'security',
  'qa-engineer': 'qa',
  'reader-advocate': 'reader',
};
// approved:<x> label per reviewing role. Must match LABEL_ROLE in .claude/hooks/lib.mjs.
export const APPROVAL_LABEL = {
  supervisor: 'supervisor',
  'design-lead': 'design',
  'security-engineer': 'security',
  'qa-engineer': 'qa',
  'reader-advocate': 'reader',
};
export const NEEDS_LABEL_ROLE = {
  'needs:design-review': 'design-lead',
  'needs:security-review': 'security-engineer',
  'needs:qa-review': 'qa-engineer',
  'needs:reader-review': 'reader-advocate',
};
const TYPES = [
  'feat',
  'fix',
  'docs',
  'style',
  'refactor',
  'perf',
  'test',
  'build',
  'ci',
  'chore',
  'revert',
];
const MAX_LINES = 600;
// Lines in these files do not count toward the size limit (R-109): generated lockfile.
const SIZE_EXEMPT = new Set(['package-lock.json']);

const prefixes = Object.values(PREFIX);

// A bot PR (release-please, Dependabot) is exempt from the naming rules. Both the author type and the branch prefix must match.
export function isBotPr(pr) {
  return (
    pr.user?.type === 'Bot' &&
    (/^release-please--/.test(pr.head.ref) || /^dependabot\//.test(pr.head.ref))
  );
}

// --- Globs and labeler -------------------------------------------------------------------------

export function globToRegExp(glob) {
  let re = '';
  for (let i = 0; i < glob.length; i++) {
    const c = glob[i];
    if (c === '*' && glob[i + 1] === '*') {
      if (glob[i + 2] === '/') {
        re += '(?:.*/)?';
        i += 2;
      } else {
        re += '.*';
        i += 1;
      }
    } else if (c === '*') re += '[^/]*';
    else if (c === '?') re += '[^/]';
    else re += c.replace(/[.+^${}()|[\]\\]/g, '\\$&');
  }
  return new RegExp(`^${re}$`);
}

export function loadLabelerConfig(path) {
  const raw = JSON.parse(readFileSync(path, 'utf8'));
  const config = {};
  for (const [label, globs] of Object.entries(raw))
    if (label.startsWith('needs:')) config[label] = globs;
  return config;
}

// Paths a PR touches, including the old name of a renamed file.
export function changedPaths(files) {
  return files.flatMap((f) => [f.filename, f.previous_filename].filter(Boolean));
}

// Labels a PR must carry for its changed paths (R-209, R-609, R-506, R-701).
export function deriveLabels(files, config) {
  const paths = changedPaths(files);
  return Object.entries(config)
    .filter(([, globs]) => globs.some((g) => paths.some((p) => globToRegExp(g).test(p))))
    .map(([label]) => label)
    .sort();
}

// --- branch-name (R-103) -----------------------------------------------------------------------

export function checkBranchName(pr) {
  if (isBotPr(pr)) return { failures: [], notes: ['bot branch, naming rule skipped'] };
  const ref = pr.head.ref;
  const re = new RegExp(`^(${prefixes.join('|')})/(\\d+)-[a-z0-9]+(?:-[a-z0-9]+)*$`);
  if (re.test(ref) || /^audit\/\d+-[a-z0-9]+(?:-[a-z0-9]+)*$/.test(ref))
    return { failures: [], notes: [] };
  return {
    failures: [
      `R-103 branch "${ref}" must be <role>/<issue>-<slug> with lowercase words, for example platform/14-pr-process-checks. Role prefixes: ${prefixes.join(', ')}.`,
    ],
    notes: [],
  };
}

// --- pr-hygiene (R-104, R-108, R-109, R-404, R-506, R-701) ---------------------------------------

export function stripHtmlComments(text) {
  return text.replace(/<!--[\s\S]*?-->/g, '');
}

export function parseTitle(title) {
  const re = new RegExp(
    `^\\[(${ROLES.join('|')})\\] (${TYPES.join('|')})\\(([a-z0-9][a-z0-9-]*)\\)!?: (\\S.*) \\(#(\\d+)\\)$`,
  );
  const m = re.exec(title);
  return m ? { role: m[1], type: m[2], scope: m[3], summary: m[4], issue: Number(m[5]) } : null;
}

export function closesIssues(body) {
  const text = stripHtmlComments(body ?? '').replace(/```[\s\S]*?```/g, '');
  return [...text.matchAll(/^Closes #(\d+)[ \t]*$/gm)].map((m) => Number(m[1]));
}

export function changedLines(files) {
  return files
    .filter((f) => !SIZE_EXEMPT.has(f.filename))
    .reduce((n, f) => n + (f.additions ?? 0) + (f.deletions ?? 0), 0);
}

const DEP_SECTIONS = [
  'dependencies',
  'devDependencies',
  'optionalDependencies',
  'peerDependencies',
];
export function newDependencies(basePkg, headPkg) {
  const known = new Set(DEP_SECTIONS.flatMap((s) => Object.keys(basePkg?.[s] ?? {})));
  return DEP_SECTIONS.flatMap((s) => Object.keys(headPkg?.[s] ?? {}))
    .filter((name, i, all) => !known.has(name) && all.indexOf(name) === i)
    .sort();
}

// Text under "## New dependencies", without comments. Empty string when the section is missing.
export function newDependenciesSection(body) {
  const text = stripHtmlComments(body ?? '');
  const m = /^##[ \t]+New dependencies[ \t]*$/im.exec(text);
  if (!m) return '';
  const rest = text.slice(m.index + m[0].length);
  const next = /^##[ \t]/m.exec(rest);
  return (next ? rest.slice(0, next.index) : rest).trim();
}

const TEST_PATH = /(^tests\/|\.(test|spec)\.[^/]+$)/;
const CASE_LINE = /^[+-]\s*(?:it|test)(?:\.\w+)*\(/;
export function removedTests(files) {
  const removedFiles = files
    .filter((f) => f.status === 'removed' && TEST_PATH.test(f.filename))
    .map((f) => f.filename);
  const shrunk = [];
  for (const f of files) {
    if (f.status === 'removed' || !TEST_PATH.test(f.filename) || !f.patch) continue;
    const lines = f.patch.split('\n').filter((l) => CASE_LINE.test(l));
    const removed = lines.filter((l) => l[0] === '-').length;
    const added = lines.length - removed;
    if (removed > added) shrunk.push(f.filename);
  }
  return { removedFiles, shrunk };
}

// R-404: a change to fit-check thresholds needs a new or changed ADR in the same PR.
const THRESHOLD_PATH = /(^|\/)[^/]*thresholds?[^/]*$/i;
const FITCHECK_PATH = /^(src\/lib\/fitcheck\/|src\/content\/.*fit)/i;
export function thresholdChanges(files) {
  return files
    .filter(
      (f) =>
        (/^src\//.test(f.filename) && THRESHOLD_PATH.test(f.filename)) ||
        (FITCHECK_PATH.test(f.filename) &&
          (f.patch ?? '').split('\n').some((l) => /^[+-]/.test(l) && /threshold/i.test(l))),
    )
    .map((f) => f.filename);
}

export function checkPrHygiene({ pr, files, config, basePkg = null, headPkg = null }) {
  if (isBotPr(pr)) return { failures: [], notes: ['bot PR, hygiene rules skipped'] };
  const failures = [];
  const notes = [];
  const labels = (pr.labels ?? []).map((l) => (typeof l === 'string' ? l : l.name));

  const closes = closesIssues(pr.body);
  if (closes.length === 0)
    failures.push(
      'R-104 the PR body needs a line "Closes #<issue>" for the issue this PR completes.',
    );

  const title = parseTitle(pr.title ?? '');
  if (!title)
    failures.push(
      `R-108 title "${pr.title}" must be "[<role>] <type>(<scope>): <summary> (#<issue>)". Roles: ${ROLES.join(', ')}. Types: ${TYPES.join(', ')}.`,
    );
  else {
    const branchRole = prefixes.includes(pr.head.ref.split('/')[0])
      ? ROLES.find((r) => PREFIX[r] === pr.head.ref.split('/')[0])
      : pr.head.ref.startsWith('audit/')
        ? 'supervisor'
        : null;
    if (branchRole && branchRole !== title.role)
      failures.push(
        `R-108 title role "${title.role}" does not match the branch role "${branchRole}".`,
      );
    if (closes.length && !closes.includes(title.issue))
      failures.push(
        `R-104 the title names #${title.issue}, but the body has no "Closes #${title.issue}" line.`,
      );
  }

  const lines = changedLines(files);
  if (lines > MAX_LINES && !labels.includes('size:approved'))
    failures.push(
      `R-109 this PR changes ${lines} lines (limit ${MAX_LINES}, package-lock.json not counted). Split it, or ask the Supervisor to add size:approved with a reason.`,
    );

  const thresholds = thresholdChanges(files);
  const addedAdr = files.some(
    (f) => /^docs\/adr\/.+\.md$/.test(f.filename) && f.status !== 'removed',
  );
  if (thresholds.length && !addedAdr)
    failures.push(
      `R-404 fit-check thresholds changed (${thresholds.join(', ')}) without an ADR in docs/adr/ in this PR.`,
    );

  const newDeps = basePkg && headPkg ? newDependencies(basePkg, headPkg) : [];
  if (newDeps.length) {
    const section = newDependenciesSection(pr.body);
    const sectionLines = section.split('\n').map((l) => l.trim());
    for (const dep of newDeps) {
      const justified = sectionLines.some((l) => l.length > dep.length + 8 && l.includes(dep));
      if (!justified)
        failures.push(
          `R-506 new dependency "${dep}" needs a justification line naming it under "## New dependencies" in the PR body.`,
        );
    }
  }

  const { removedFiles, shrunk } = removedTests(files);
  if (removedFiles.length || shrunk.length) {
    const needed = new Set([...labels, ...deriveLabels(files, config)]);
    const all = [...removedFiles, ...shrunk].join(', ');
    if (!needed.has('needs:qa-review'))
      failures.push(
        `R-701 tests were removed or reduced (${all}) but the PR does not require QA review. Check .github/labeler.json.`,
      );
    else notes.push(`R-701 flagged for QA: tests removed or reduced in ${all}.`);
  }
  return { failures, notes };
}

// --- review-gate (R-201, R-202, R-207, R-208, R-609) ---------------------------------------------

const FENCE = /```[\s\S]*?```/g;
const FILE_EVIDENCE =
  /\b[\w-]+\.(?:md|mjs|cjs|js|ts|tsx|json|ya?ml|css|astro|png|jpe?g|toml|html|sh|txt|lock)\b/;
const CODE_EVIDENCE = /`[^`\n]+`/;

function sectionItems(lines) {
  const items = [];
  for (const line of lines) {
    if (/^\s*(?:[-*]|\d+[.)])\s+\S/.test(line)) items.push(line.trim());
    else if (items.length && /^\s+\S/.test(line)) items[items.length - 1] += ' ' + line.trim();
  }
  return items;
}

// Parses every REVIEW block in the comments written by the repo owner. Other authors are ignored (#45).
export function parseReviews(comments, owner) {
  const blocks = [];
  for (const c of comments) {
    if (c.user?.login !== owner) continue;
    const body = (c.body ?? '').replace(/\r/g, '').replace(FENCE, '');
    const starts = [...body.matchAll(/^REVIEW:/gm)].map((m) => m.index);
    starts.forEach((start, i) => {
      blocks.push(parseBlock(body.slice(start, starts[i + 1] ?? body.length), c));
    });
  }
  return blocks;
}

function parseBlock(text, comment) {
  const problems = [];
  const verdict = /^REVIEW:[ \t]*(APPROVED|CHANGES REQUESTED)[ \t]*$/m.exec(text)?.[1] ?? null;
  if (!verdict)
    problems.push(
      'R-202 the REVIEW line must read "REVIEW: APPROVED" or "REVIEW: CHANGES REQUESTED"',
    );
  const reviewer = /^Reviewer:[ \t]*(\S+)[ \t]*$/m.exec(text)?.[1] ?? null;
  if (!reviewer) problems.push('R-202 missing "Reviewer: <role>"');
  else if (!ROLES.includes(reviewer)) problems.push(`R-202 unknown reviewer "${reviewer}"`);
  const head = /^Head:[ \t]*([0-9a-f]{7,40})[ \t]*$/m.exec(text)?.[1] ?? null;
  if (!head) problems.push('R-202 missing "Head: <sha>"');
  const agent = /^Agent:[ \t]*(\S.*)$/m.exec(text)?.[1] ?? null;
  if (!agent) problems.push('R-202 missing "Agent: <agent id>"');

  const lines = text.split('\n');
  const checkedAt = lines.findIndex((l) => /^Checked:[ \t]*$/.test(l));
  const findingsAt = lines.findIndex((l) => /^Findings:/.test(l));
  let checked = [];
  if (checkedAt < 0) problems.push('R-207 missing a "Checked:" section');
  else {
    const end = findingsAt > checkedAt ? findingsAt : lines.length;
    checked = sectionItems(lines.slice(checkedAt + 1, end));
    if (checked.length === 0) problems.push('R-207 the Checked section lists nothing');
    else if (!checked.some((l) => CODE_EVIDENCE.test(l) || FILE_EVIDENCE.test(l)))
      problems.push(
        'R-207 the Checked section names no command or file as evidence (put a command in backticks or name a file)',
      );
  }
  let findingsNone = false;
  if (findingsAt >= 0) {
    const inline = lines[findingsAt].replace(/^Findings:/, '').trim();
    const rest = [inline, ...lines.slice(findingsAt + 1)].join('\n').trim();
    findingsNone = /^(?:[-*]\s*)?"?none"?\.?$/i.test(rest);
  }
  if (findingsNone && checked.length < 3)
    problems.push('R-207 a review with no findings must list at least three checks');
  return { commentId: comment.id, verdict, reviewer, head, agent, checked, problems };
}

export function headMatches(blockHead, prHead) {
  return Boolean(blockHead) && blockHead.length >= 7 && prHead.startsWith(blockHead);
}

export function checkReviewGate({ pr, files, comments, config, owner }) {
  if (pr.draft) return { failures: [], notes: ['draft PR: reviews are checked once it is ready'] };
  const failures = [];
  const notes = [];
  const labels = (pr.labels ?? []).map((l) => (typeof l === 'string' ? l : l.name));
  const derived = deriveLabels(files, config);
  const required = new Set(['supervisor']);
  for (const l of new Set([...labels, ...derived]))
    if (NEEDS_LABEL_ROLE[l]) required.add(NEEDS_LABEL_ROLE[l]);

  const blocks = parseReviews(comments, owner);
  const latest = new Map();
  for (const b of blocks) if (ROLES.includes(b.reviewer)) latest.set(b.reviewer, b);

  const approved = new Set();
  for (const role of ROLES) {
    const b = latest.get(role);
    const need = required.has(role);
    const label = APPROVAL_LABEL[role];
    const why =
      role === 'design-lead' && derived.includes('needs:design-review') ? 'R-609/R-201' : 'R-201';
    if (!b) {
      if (need) failures.push(`${why} ${role} review is required and none was posted.`);
      continue;
    }
    if (b.problems.length) {
      if (need || headMatches(b.head, pr.head.sha))
        failures.push(`${role} review is malformed: ${b.problems.join('; ')}.`);
      continue;
    }
    if (!headMatches(b.head, pr.head.sha)) {
      if (need)
        failures.push(
          `R-208 ${role} reviewed ${b.head}, but the PR head is ${pr.head.sha}. Post a new review for the current head.`,
        );
      continue;
    }
    if (b.verdict === 'CHANGES REQUESTED') {
      if (need) failures.push(`R-201 ${role} requested changes at the current head.`);
      continue;
    }
    approved.add(role);
  }

  for (const role of required) {
    if (approved.has(role) && !labels.includes(`approved:${APPROVAL_LABEL[role]}`))
      failures.push(
        `R-202 ${role} approved, but the label approved:${APPROVAL_LABEL[role]} is missing. Add it.`,
      );
  }
  for (const role of Object.keys(APPROVAL_LABEL)) {
    if (labels.includes(`approved:${APPROVAL_LABEL[role]}`) && !approved.has(role))
      failures.push(
        `R-202 label approved:${APPROVAL_LABEL[role]} has no matching approving ${role} review for head ${pr.head.sha}. Remove the label or post the review.`,
      );
  }
  const unlabeled = derived.filter((l) => !labels.includes(l));
  if (unlabeled.length)
    notes.push(`R-209 labels not yet applied but required by paths: ${unlabeled.join(', ')}.`);
  notes.push(
    `required reviews: ${[...required].join(', ')}; approved: ${[...approved].join(', ') || 'none'}.`,
  );
  return { failures, notes };
}

// --- gh access -----------------------------------------------------------------------------------

function gh(args) {
  const r = spawnSync('gh', args, { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  if (r.status !== 0)
    throw new Error(`gh ${args.slice(0, 2).join(' ')} failed: ${r.stderr.trim()}`);
  return r.stdout;
}
const ghJson = (path) => JSON.parse(gh(['api', path]));
const ghPages = (path) => JSON.parse(gh(['api', '--paginate', '--slurp', path])).flat();

function packageJsonAt(repo, ref) {
  const out = gh([
    'api',
    '-H',
    'Accept: application/vnd.github.raw',
    `repos/${repo}/contents/package.json?ref=${ref}`,
  ]);
  return JSON.parse(out);
}

function labelerPath() {
  return new URL('../labeler.json', import.meta.url);
}

function addLabels(repo, number, labels) {
  const args = ['api', '-X', 'POST', `repos/${repo}/issues/${number}/labels`];
  for (const l of labels) args.push('-f', `labels[]=${l}`);
  gh(args);
}

function main(argv) {
  const [cmd, ...rest] = argv;
  const opt = (name) => {
    const i = rest.indexOf(name);
    return i >= 0 ? rest[i + 1] : undefined;
  };
  const number = opt('--pr');
  const repo = opt('--repo') ?? process.env.GITHUB_REPOSITORY;
  if (
    !['branch-name', 'pr-hygiene', 'review-gate', 'labeler'].includes(cmd) ||
    !/^\d+$/.test(number ?? '') ||
    !/^[\w.-]+\/[\w.-]+$/.test(repo ?? '')
  ) {
    console.error(
      'usage: pr-process.mjs branch-name|pr-hygiene|review-gate|labeler --pr <number> [--repo owner/name]',
    );
    return 2;
  }
  const owner = repo.split('/')[0];
  const pr = ghJson(`repos/${repo}/pulls/${number}`);
  let result;
  if (cmd === 'branch-name') result = checkBranchName(pr);
  else {
    const files = ghPages(`repos/${repo}/pulls/${number}/files`);
    const config = loadLabelerConfig(labelerPath());
    if (cmd === 'review-gate') {
      const comments = ghPages(`repos/${repo}/issues/${number}/comments`);
      result = checkReviewGate({ pr, files, comments, config, owner });
    } else if (cmd === 'pr-hygiene') {
      const touchesPkg = files.some((f) => f.filename === 'package.json' && f.status !== 'removed');
      const basePkg = touchesPkg ? packageJsonAt(repo, pr.base.sha) : null;
      const headPkg = touchesPkg ? packageJsonAt(repo, pr.head.sha) : null;
      result = checkPrHygiene({ pr, files, config, basePkg, headPkg });
    } else {
      const have = new Set(pr.labels.map((l) => l.name));
      const missing = deriveLabels(files, config).filter((l) => !have.has(l));
      if (missing.length) {
        try {
          addLabels(repo, number, missing);
          console.log(`labeler: added ${missing.join(', ')} (R-209)`);
        } catch (e) {
          // Dependabot and fork PRs get a read-only token. review-gate derives the same labels from paths, so this is not fatal.
          console.log(`labeler: could not add ${missing.join(', ')}: ${e.message}`);
        }
      } else console.log('labeler: labels already match changed paths (R-209)');
      return 0;
    }
  }
  for (const n of result.notes) console.log(`note: ${n}`);
  if (result.failures.length) {
    for (const f of result.failures) console.error(f);
    console.error(`${cmd} FAILED (${result.failures.length}). Rules: docs/rules.md.`);
    return 1;
  }
  console.log(`${cmd} OK`);
  return 0;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  try {
    process.exit(main(process.argv.slice(2)));
  } catch (e) {
    console.error(`pr-process error: ${e.message}`);
    process.exit(1);
  }
}
