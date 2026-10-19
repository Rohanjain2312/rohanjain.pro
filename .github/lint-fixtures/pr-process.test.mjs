// Self-test for .github/scripts/pr-process.mjs (#14, #42). Run: node --test .github/lint-fixtures/pr-process.test.mjs
// Fixtures are inline: PR objects, comments and file lists shaped like the GitHub REST API responses.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import {
  checkBranchName,
  checkPrHygiene,
  checkReviewGate,
  deriveLabels,
  escapeLine,
  globToRegExp,
  incompleteFiles,
  loadLabelerConfig,
  newDependencies,
  parseReviews,
  parseTitle,
} from '../scripts/pr-process.mjs';

const config = loadLabelerConfig(fileURLToPath(new URL('../labeler.json', import.meta.url)));
const OWNER = 'Rohanjain2312';
const HEAD = 'a'.repeat(40);

const file = (filename, extra = {}) => ({ filename, status: 'modified', additions: 5, deletions: 1, ...extra });
const basePr = (over = {}) => ({
  title: '[platform-engineer] ci(workflows): add checks (#14)',
  body: 'Closes #14\n\n## What changed\n- x\n',
  head: { ref: 'platform/14-pr-process-checks', sha: HEAD },
  user: { login: OWNER, type: 'User' },
  labels: [],
  draft: false,
  ...over,
});
const fails = (r) => r.failures.join('\n');

// --- branch-name -------------------------------------------------------------------------------

test('branch-name accepts role prefixes and audit branches', () => {
  for (const ref of ['platform/14-pr-process-checks', 'qa/7-x', 'appdata/3-a-b', 'audit/2-phase-two'])
    assert.deepEqual(checkBranchName(basePr({ head: { ref, sha: HEAD } })).failures, [], ref);
});

test('branch-name rejects bad names with R-103', () => {
  for (const ref of ['platform-engineer/14-x', 'platform/pr-checks', 'fix/14-x', 'platform/14-Bad_Slug', 'main', 'platform/14-'])
    assert.match(fails(checkBranchName(basePr({ head: { ref, sha: HEAD } }))), /^R-103 /, ref);
});

test('branch-name skips Dependabot branches only when the author is a bot', () => {
  const ref = 'dependabot/npm_and_yarn/astro-7.5.0';
  assert.deepEqual(checkBranchName(basePr({ head: { ref, sha: HEAD }, user: { login: 'dependabot[bot]', type: 'Bot' } })).failures, []);
  assert.match(fails(checkBranchName(basePr({ head: { ref, sha: HEAD } }))), /R-103/);
});

test('branch-name gives release-please no exemption (ADR-0025)', () => {
  const ref = 'release-please--branches--main';
  assert.match(fails(checkBranchName(basePr({ head: { ref, sha: HEAD }, user: { login: 'github-actions[bot]', type: 'Bot' } }))), /R-103/);
});

// --- labeler (#42) -------------------------------------------------------------------------------

test('globs', () => {
  assert.ok(globToRegExp('.github/workflows/**').test('.github/workflows/ci.yml'));
  assert.ok(globToRegExp('**/*.test.*').test('src/lib/a.test.ts'));
  assert.ok(globToRegExp('**/*.test.*').test('a.test.ts'));
  assert.ok(globToRegExp('.lintstagedrc*').test('.lintstagedrc.json'));
  assert.ok(!globToRegExp('tests/*').test('tests/a/b.ts'));
  assert.ok(!globToRegExp('astro.config.*').test('src/astro.config.mjs'));
});

// Every path in the #42 list must produce needs:security-review.
const SECURITY_PATHS = [
  '.github/workflows/anything.yml',
  '.github/scripts/pr-process.mjs',
  '.github/labeler.json',
  'public/_headers',
];
for (const p of SECURITY_PATHS)
  test(`labeler: ${p} needs security review`, () => {
    assert.ok(deriveLabels([file(p)], config).includes('needs:security-review'));
  });

test('labeler: one combined review, security only for workflow and header changes', () => {
  assert.deepEqual(deriveLabels([file('src/components/Hero.astro')], config), ['needs:qa-review']);
  assert.deepEqual(deriveLabels([file('docs/runbooks/a.md')], config), ['needs:qa-review']);
  assert.deepEqual(deriveLabels([file('package.json')], config), ['needs:qa-review']);
  assert.deepEqual(deriveLabels([file('tests/visual/home.spec.ts-snapshots/a.png')], config), ['needs:qa-review']);
  assert.deepEqual(deriveLabels([file('.husky/pre-commit')], config), ['needs:qa-review']);
  assert.deepEqual(deriveLabels([file('new.md', { previous_filename: 'public/_headers' })], config).sort(), ['needs:qa-review', 'needs:security-review']);
});

// --- pr-hygiene ----------------------------------------------------------------------------------

const hygiene = (over = {}, files = [file('docs/runbooks/a.md')], extra = {}) =>
  checkPrHygiene({ pr: basePr(over), files, config, ...extra });

test('hygiene passes a good PR', () => {
  assert.deepEqual(hygiene().failures, []);
});

test('hygiene R-104: Closes line', () => {
  assert.match(fails(hygiene({ body: 'No link here' })), /R-104/);
  assert.match(fails(hygiene({ body: 'Closes #<issue>' })), /R-104/);
  assert.match(fails(hygiene({ body: '```\nCloses #14\n```' })), /R-104/);
  assert.match(fails(hygiene({ body: '<!-- Closes #14 -->' })), /R-104/);
  assert.match(fails(hygiene({ body: '<!<!-- x -->--\nCloses #14\n-->' })), /R-104/);
  assert.match(fails(hygiene({ body: 'text\n<!-- unterminated\nCloses #14\n' })), /R-104/);
  assert.deepEqual(hygiene({ body: 'x\nCloses #14\nCloses #42\n' }).failures, []);
  assert.match(fails(hygiene({ body: 'Closes #15' })), /R-104.*#14/);
});

test('hygiene R-108: title', () => {
  for (const title of [
    'add checks',
    '[platform-engineer] add checks (#14)',
    '[platform-engineer] ci: add checks (#14)',
    '[platform-engineer] ci(workflows): add checks',
    '[platform-engin] ci(workflows): add checks (#14)',
    '[platform-engineer] wip(workflows): add checks (#14)',
  ])
    assert.match(fails(hygiene({ title })), /R-108/, title);
  assert.ok(parseTitle('[supervisor] docs(status): checkpoint after Phase 1 wave 3 (#129)'));
  assert.match(fails(hygiene({ title: '[qa] test(e2e): x (#14)' })), /R-108.*role/);
});

test('hygiene R-109: size', () => {
  const big = [file('src/a.ts', { additions: 600, deletions: 1 })];
  assert.match(fails(hygiene({}, big)), /R-109.*601/);
  assert.match(fails(hygiene({}, [file('src/a.ts', { additions: 599, deletions: 1 })])), /R-109.*600/);
  assert.deepEqual(hygiene({ labels: [{ name: 'size:approved' }] }, big).failures, []);
  assert.deepEqual(hygiene({}, [file('package-lock.json', { additions: 5000, deletions: 0 })]).failures, []);
  assert.deepEqual(hygiene({}, [file('src/a.ts', { additions: 598, deletions: 1 })]).failures, []);
});

test('hygiene R-404: thresholds need an ADR', () => {
  const t = file('src/lib/fitcheck/thresholds.ts');
  assert.match(fails(hygiene({}, [t])), /R-404/);
  assert.match(fails(hygiene({}, [file('src/lib/fitcheck/score.ts', { patch: '-const strong = 0.8; // threshold\n+const strong = 0.7; // threshold' })])), /R-404/);
  assert.deepEqual(hygiene({}, [file('src/lib/fitcheck/score.ts', { patch: '+const x = 1;' })]).failures, []);
  assert.deepEqual(hygiene({}, [t, file('docs/adr/0030-thresholds.md', { status: 'added' })]).failures, []);
});

test('hygiene R-506: new dependencies need a justification', () => {
  const basePkg = { dependencies: { astro: '1' }, devDependencies: { vitest: '1' } };
  const headPkg = { dependencies: { astro: '2' }, devDependencies: { vitest: '1', zod: '3' } };
  assert.deepEqual(newDependencies(basePkg, headPkg), ['zod']);
  const files = [file('package.json')];
  const run = (body) => hygiene({ body }, files, { basePkg, headPkg });
  assert.match(fails(run('Closes #14')), /R-506.*zod/);
  assert.match(fails(run('Closes #14\n\n## New dependencies\n\n<!-- zod goes here -->\n')), /R-506/);
  assert.match(fails(run('Closes #14\n\n## New dependencies\n\n- zod\n')), /R-506/);
  assert.deepEqual(run('Closes #14\n\n## New dependencies\n\n- zod: validates content at build time.\n').failures, []);
  assert.deepEqual(hygiene({}, files, { basePkg, headPkg: { ...basePkg, dependencies: { astro: '9' } } }).failures, []);
});

test('hygiene R-701: removed tests are flagged for QA', () => {
  const removed = [file('tests/unit/a.test.ts', { status: 'removed', additions: 0, deletions: 30 })];
  const r = hygiene({}, removed);
  assert.deepEqual(r.failures, []);
  assert.ok(r.notes.some((n) => /R-701 flagged for QA/.test(n)));
  const shrunk = [file('src/lib/a.test.ts', { patch: "-  it('a', () => {\n-  it('b', () => {\n+  it('a', () => {" })];
  assert.ok(hygiene({}, shrunk).notes.some((n) => /R-701/.test(n)));
  const grown = [file('src/lib/a.test.ts', { patch: "+  it('c', () => {" })];
  assert.equal(hygiene({}, grown).notes.length, 0);
  assert.match(fails(checkPrHygiene({ pr: basePr(), files: removed, config: { 'needs:qa-review': [] } })), /R-701/);
});

test('hygiene skips Dependabot PRs, not release-please PRs', () => {
  const dep = basePr({ title: 'chore(deps): bump astro', body: '', head: { ref: 'dependabot/npm_and_yarn/astro-7.5.0', sha: HEAD }, user: { login: 'dependabot[bot]', type: 'Bot' } });
  assert.deepEqual(checkPrHygiene({ pr: dep, files: [], config }).failures, []);
  const rp = basePr({ title: 'chore(main): release 0.2.0', body: '', head: { ref: 'release-please--branches--main', sha: HEAD }, user: { login: 'github-actions[bot]', type: 'Bot' } });
  assert.match(fails(checkPrHygiene({ pr: rp, files: [], config })), /R-104/);
});

test('hygiene R-104: an unpaired code fence before Closes hides the line', () => {
  assert.match(fails(hygiene({ body: '```\nunclosed\nCloses #14\n' })), /R-104/);
  assert.deepEqual(hygiene({ body: '```\nx\n```\nCloses #14\n' }).failures, []);
});

test('globs: a path with a newline still matches ** (s flag)', () => {
  assert.ok(globToRegExp('docs/**').test('docs/a\nb.md'));
  assert.ok(globToRegExp('**').test('a\nb'));
});

test('labeler: the hook guard and no design or reader label', () => {
  assert.ok(deriveLabels([file('.claude/hooks/guard-bash.mjs')], config).includes('needs:qa-review'));
  for (const p of ['.claude/hooks/guard-bash.mjs', 'src/components/Hero.astro', 'public/_headers', 'tests/visual/a-snapshots/home.png', 'src/styles/tokens.css'])
    for (const l of deriveLabels([file(p)], config)) assert.ok(!['needs:design-review', 'needs:reader-review'].includes(l), `${p}: ${l}`);
});

for (const p of [
  '.github/dependabot.yml',
  '.github/dependabot.yaml',
  '.github/actions/setup/action.yml',
  'public/_redirects',
  'public/_routes.json',
  'functions/api/x.ts',
  'wrangler.toml',
  'wrangler.jsonc',
  '.nvmrc',
  '.gitleaksignore',
  'lint-staged.config.mjs',
])
  test(`labeler: ${p} needs security review (135-L6)`, () => {
    assert.ok(deriveLabels([file(p)], config).includes('needs:security-review'));
  });

test('escapeLine keeps one printed line as one line (135-L7)', () => {
  assert.equal(escapeLine('a\r\n::error::x 100%'), 'a%0D%0A::error::x 100%25');
  assert.equal(escapeLine('plain'), 'plain');
});

test('incompleteFiles fails closed when the file list is short (135-L5)', () => {
  assert.match(incompleteFiles({ changed_files: 3001 }, new Array(3000).fill(file('a'))), /^R-209 /);
  assert.equal(incompleteFiles({ changed_files: 2 }, [file('a'), file('b')]), null);
  assert.equal(incompleteFiles({}, []), null);
});

// --- review-gate ---------------------------------------------------------------------------------

// The format from .claude/skills/run-review/SKILL.md.
const review = ({ verdict = 'APPROVED', reviewer = 'security-engineer', head = HEAD, agent = 'security-engineer (a1b2c3)', checked, findings = '- none' } = {}) =>
  [
    `REVIEW: ${verdict}`,
    `Reviewer: ${reviewer}`,
    `Head: ${head}`,
    `Agent: ${agent}`,
    'Checked:',
    ...(checked ?? ['- Diff `git diff origin/main...HEAD`: workflows only.', '- `npm run verify` passes.', '- Read docs/spec/10-cicd.md section 10.2.']),
    'Findings:',
    findings,
  ].join('\n');
const comment = (body, login = OWNER, id = 1) => ({ id, body, user: { login } });
const gate = ({ comments = [], labels = [], files = [], pr = {} } = {}) =>
  checkReviewGate({ pr: basePr({ labels: labels.map((name) => ({ name })), ...pr }), files, comments, config, owner: OWNER });
const sup = (over) => comment(review({ reviewer: 'supervisor', agent: 'main', ...over }), OWNER, 2);

test('gate: supervisor approval plus label passes', () => {
  assert.deepEqual(gate({ comments: [sup()], labels: ['approved:supervisor'] }).failures, []);
});

test('gate: accepts the run-review format and a review with findings and wrapped lines', () => {
  const body = review({
    reviewer: 'supervisor',
    agent: 'main',
    checked: ['- Security review APPROVED at this head.', '- Ruleset 25204664 includes required_signatures (live);', '  head commit verified on GitHub.', '- `node scripts/lint-docs.mjs`: 0 errors.'],
    findings: '- Low: stale wording in other files (fixed with #69).',
  });
  assert.deepEqual(gate({ comments: [comment(body)], labels: ['approved:supervisor'] }).failures, []);
});

test('gate R-201: missing supervisor review', () => {
  assert.match(fails(gate()), /R-201 supervisor review is required/);
});

test('gate R-201/R-209: required roles come from labels and from paths', () => {
  const byLabel = gate({ comments: [sup()], labels: ['approved:supervisor', 'needs:qa-review'] });
  assert.match(fails(byLabel), /R-201 qa-engineer review is required/);
  const byPath = gate({ comments: [sup()], labels: ['approved:supervisor'], files: [file('.github/workflows/x.yml')] });
  assert.match(fails(byPath), /R-201 security-engineer review is required/);
  assert.ok(byPath.notes.some((n) => /R-209 labels not yet applied/.test(n)));
});

test('gate R-609: visual baselines need only the combined review', () => {
  const r = gate({ comments: [sup()], labels: ['approved:supervisor'], files: [file('tests/visual/a-snapshots/home.png')] });
  assert.match(fails(r), /R-201 qa-engineer/);
  assert.doesNotMatch(fails(r), /design-lead/);
});

test('gate: all required approvals pass', () => {
  const r = gate({
    comments: [sup(), comment(review(), OWNER, 3), comment(review({ reviewer: 'qa-engineer' }), OWNER, 4)],
    labels: ['approved:supervisor', 'approved:security', 'approved:qa'],
    files: [file('.github/workflows/x.yml')],
  });
  assert.deepEqual(r.failures, []);
});

test('gate R-208: review of an older head is rejected', () => {
  const r = gate({ comments: [sup({ head: 'b'.repeat(40) })], labels: ['approved:supervisor'] });
  assert.match(fails(r), /R-208 supervisor reviewed b+/);
  assert.match(fails(r), /R-202 label approved:supervisor has no matching/);
});

test('gate R-208: a short head is rejected, only the full SHA counts', () => {
  const r = gate({ comments: [sup({ head: HEAD.slice(0, 7) })], labels: ['approved:supervisor'] });
  assert.match(fails(r), /R-208 missing "Head/);
});

test('gate R-207: a review without Findings is rejected', () => {
  const body = review({ reviewer: 'supervisor', agent: 'main' }).replace(/\nFindings:\n.*$/s, '');
  assert.match(fails(gate({ comments: [comment(body)], labels: ['approved:supervisor'] })), /R-207 missing a "Findings:"/);
});

test('gate R-202: label without a review, review without a label', () => {
  assert.match(fails(gate({ comments: [sup()] })), /R-202 supervisor approved, but the label approved:supervisor is missing/);
  const stray = gate({ comments: [sup()], labels: ['approved:supervisor', 'approved:qa'] });
  assert.match(fails(stray), /R-202 label approved:qa has no matching/);
});

test('gate R-202: missing fields', () => {
  for (const [name, body] of [
    ['reviewer', review({ reviewer: 'supervisor', agent: 'main' }).replace(/^Reviewer:.*\n/m, '')],
    ['head', review({ reviewer: 'supervisor', agent: 'main' }).replace(/^Head:.*\n/m, '')],
    ['agent', review({ reviewer: 'supervisor', agent: 'main' }).replace(/^Agent:.*\n/m, '')],
    ['verdict', review({ reviewer: 'supervisor', agent: 'main' }).replace('APPROVED', 'LGTM')],
  ]) {
    const r = gate({ comments: [comment(body)], labels: ['approved:supervisor'] });
    assert.ok(r.failures.length > 0, name);
    assert.match(fails(r), /R-202/, name);
  }
});

test('gate R-207: Checked section rules', () => {
  const only = (checked, findings) => gate({ comments: [sup({ checked, findings })], labels: ['approved:supervisor'] });
  assert.match(fails(only(['- Everything looked fine.', '- Read it carefully.', '- No concerns.'])), /R-207 .*no command or file/);
  assert.match(fails(only([])), /R-207 the Checked section lists nothing/);
  assert.match(fails(only(['- `npm test` passes.', '- Looked at the diff.'])), /R-207 .*at least three/);
  assert.deepEqual(only(['- `npm test` passes.', '- Looked at the diff.'], '- Low: one nit.').failures, []);
  assert.deepEqual(only(['- Read docs/spec/10-cicd.md.', '- b', '- c']).failures, []);
  assert.deepEqual(only(['- Opened README.md.', '- b', '- c']).failures, []);
  const noSection = review({ reviewer: 'supervisor', agent: 'main' }).replace(/^Checked:\n(- .*\n)+/m, '');
  assert.match(fails(gate({ comments: [comment(noSection)], labels: ['approved:supervisor'] })), /R-207 missing a "Checked:" section/);
});

test('gate: CHANGES REQUESTED blocks, and a later approval replaces it', () => {
  const blocked = gate({ comments: [sup({ verdict: 'CHANGES REQUESTED', findings: '- High: x' })] });
  assert.match(fails(blocked), /R-201 supervisor requested changes/);
  const fixed = gate({ comments: [sup({ verdict: 'CHANGES REQUESTED', findings: '- High: x' }), comment(review({ reviewer: 'supervisor', agent: 'main' }), OWNER, 9)], labels: ['approved:supervisor'] });
  assert.deepEqual(fixed.failures, []);
});

test('gate: comments from other authors and fenced quotes are ignored', () => {
  const body = review({ reviewer: 'supervisor', agent: 'main' });
  assert.match(fails(gate({ comments: [comment(body, 'someone-else')], labels: ['approved:supervisor'] })), /R-201/);
  assert.match(fails(gate({ comments: [comment('```\n' + body + '\n```')], labels: ['approved:supervisor'] })), /R-201/);
});

test('gate: two reviews in one comment are both read', () => {
  const both = review({ reviewer: 'security-engineer' }) + '\n\n' + review({ reviewer: 'supervisor', agent: 'main' });
  assert.equal(parseReviews([comment(both)], OWNER).length, 2);
});

test('gate: draft PRs are not evaluated', () => {
  const r = gate({ pr: { draft: true } });
  assert.deepEqual(r.failures, []);
  assert.match(r.notes[0], /draft/);
});
