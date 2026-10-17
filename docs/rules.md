# Rule inventory

Every "must" and "never" in this project lives here, with exactly one home. 86 rules: 69 are enforced by a hook, CI check or ruleset; 17 need judgment and live in the file of the agent or procedure that applies them. 40 rules marked ★ were prose in plan v2.3 and are now enforced.

**How homes work**
- Rules whose home is this file are defined here (bold ID) and enforced by the listed check. Agents do not need to memorize them: the check blocks the action and its message cites the rule ID.
- Rules with another home are defined (bold ID) in that file only, which loads when it is needed: `CLAUDE.md` always; agent files when that role runs; `.claude/rules/*.md` when a matching file is touched; skills when invoked.
- `scripts/lint-docs.mjs` fails if a rule is defined twice, defined but missing here, or listed here but missing from its home.

**Status:** `active` works today (hooks and settings in `.claude/`). `phase-N` means the check is built in that phase (see `docs/spec/10-cicd.md`). `prose` means judgment only.

| ID | Rule | Home | Enforced by | Status |
|---|---|---|---|---|
| R-001 | Act as Supervisor: delegate role work to the matching subagent; do role work yourself only to unblock. | `CLAUDE.md` | judgment | prose |
| R-002 | Work autonomously. Never ask the client to approve plans, PRs, designs or phase moves. Ask only for the client-only items in CLAUDE.md. | `CLAUDE.md` | judgment | prose |
| R-003 | When blocked on a client item, log it in docs/needs-client.md with exact steps and continue other work. | `CLAUDE.md` | judgment | prose |
| R-004 | When something is ambiguous, decide, record an ADR in docs/adr/, and continue. | `CLAUDE.md` | judgment | prose |
| R-005 | Never invent numbers, dates, claims or copy. Search the repos and résumé; if not found, omit it and log it in docs/needs-client.md. | `CLAUDE.md` | judgment; R-301 catches untraced numbers | prose |
| R-006 | Write plain, short sentences. No filler or rhetorical questions. | `CLAUDE.md` | judgment; R-603 bans listed hype words | prose |
| **R-007** ★ | Never state or imply work authorization, visa or sponsorship status anywhere in the site, PDFs, briefs or metadata. | here | guard-write hook (src/, public/); copy lint in CI | active / phase-1 |
| **R-008** ★ | No em dashes (U+2014) in any file outside reference/. | here | guard-write hook; copy lint in CI | active / phase-1 |
| **R-009** ★ | Every session starts with the session-protocol skill. | here | SessionStart hook injects the instruction | active |
| **R-010** ★ | Location is "New York, NY" everywhere; contact details come only from src/content/site.json. | here | copy lint in CI | phase-1 |
| **R-101** ★ | Never commit to or push to main. | here | ruleset; guard-bash hook; Husky pre-push | active / phase-0 |
| **R-102** | Never force-push (except --force-with-lease on your own branch) and never delete main. | here | ruleset; guard-bash hook | active / phase-0 |
| **R-103** ★ | Branch names are <role>/<issue>-<slug>, and the role must be the agent creating it. | here | guard-bash hook; branch-name CI check | active / phase-1 |
| **R-104** | One issue per branch and PR; the PR body contains "Closes #<issue>". | here | pr-hygiene CI check | phase-1 |
| **R-105** | Conventional Commits with the issue number. | here | commitlint (Husky and CI) | phase-1 |
| **R-106** ★ | Every commit message has the trailer "Agent-Role: <role>" matching the agent that commits. | here | guard-bash hook; Husky commit-msg | active / phase-1 |
| **R-107** | Commits on main are signed. | here | ruleset | phase-0 |
| **R-108** | PR title is "[<role>] <type>(<scope>): <summary> (#<issue>)". | here | pr-hygiene CI check | phase-1 |
| **R-109** | PRs stay under 600 changed lines unless the Supervisor adds size:approved with a reason. | here | pr-hygiene CI check | phase-1 |
| **R-110** ★ | A PR is marked ready only after npm run verify passed on its current HEAD. | here | guard-bash hook checks .claude/state/verify-ok against HEAD | phase-1 |
| **R-111** ★ | Only the Supervisor merges, with gh pr merge --squash --delete-branch after all required checks pass; never --admin. | here | guard-bash hook; ruleset (squash only, required checks, no bypass) | active / phase-0 |
| **R-112** ★ | Each role edits only the paths it owns (see its agent file). | here | guard-write hook by agent_type | active |
| **R-113** ★ | Nobody edits reference/. | here | guard-write hook | active |
| **R-114** | Builders work in isolated worktrees. | here | isolation: worktree in agent files | active |
| **R-115** ★ | Subagents cannot spawn subagents, and the subagent model is never forced. | here | settings env; SessionStart hook warns if forced | active |
| **R-116** ★ | Never bypass git hooks (--no-verify) or force-add ignored files. | here | guard-bash hook | active |
| **R-201** | Required reviews come from labels; review-gate blocks merge until each required approval exists. | here | review-gate CI check; ruleset | phase-1 |
| **R-202** ★ | A review comment states REVIEW: APPROVED or CHANGES REQUESTED, Reviewer: <role>, Head: <sha>, Agent: <agent id>. | here | review-gate CI check; guard-bash hook | active / phase-1 |
| **R-203** ★ | A role posts reviews only as itself; the Supervisor never writes a review for another role. | here | guard-bash hook compares Reviewer to agent_type | active |
| R-204 | A review delegation contains only the PR number, head SHA, acceptance criteria and plan references; never the builder's report or reasoning. | `.claude/skills/run-review/SKILL.md` | judgment; audited by R-206 | prose |
| R-205 | CI first; then QA, Security and Design Lead in parallel (up to five agents at a time, ADR-0022); then Reader Advocate; Supervisor last. Each reviewer posts before reading others' reviews. | `.claude/skills/run-review/SKILL.md` | judgment | prose |
| R-206 ★ | At each gate, QA audits 20% of merged PRs, matching each approval to the reviewer's subagent transcript. | `.claude/skills/phase-gate/SKILL.md` | phase-gate script checks docs/qa/review-audit-N.md exists | phase-1 |
| **R-207** ★ | A review lists what was checked with evidence; "no findings" names at least three checks. | here | review-gate CI check for a Checked: section | phase-1 |
| **R-208** | A new commit invalidates earlier approvals. | here | review-gate CI check (Head must equal PR head) | phase-1 |
| **R-209** | Review-needed labels come from changed paths (.claude/** and dependencies need Security; visual baselines need Design; tests and content need QA). | here | labeler CI | phase-1 |
| R-210 ★ | The Reader Advocate judges only rendered output (screenshots, extracted text, PDFs), never source code or plans. | `.claude/agents/reader-advocate.md` | guard-bash and guard-read hooks restrict its commands and files | active |
| **R-301** | Every number in built HTML and PDFs maps to an entry in src/content/claims.json. | here | check-claims CI | phase-1 |
| R-302 | No claim is stronger than its source. Client decisions override repo values (see the content rule file). | `.claude/rules/content.md` | judgment; QA verification (R-303) | prose |
| **R-303** ★ | Every claim has a QA verification entry in docs/qa/claims-verification.md before it ships. | here | CI completeness check | phase-1 |
| **R-304** ★ | No placeholders, TODOs, lorem ipsum or bracketed fill-ins in built pages or PDFs. | here | CI scan of build output | phase-2 |
| **R-305** ★ | The phone number never appears in JSON-LD or meta tags. | here | CI test on build output | phase-2 |
| R-306 | Tenure reads "~4 years at Goldman Sachs"; "3.5+ years of production experience" appears only in role summaries, never side by side without the distinction. | `.claude/rules/content.md` | judgment; Reader Advocate review | prose |
| **R-401** ★ | The fit-check engine is pure: no DOM, network, storage, clock or randomness in src/lib/fitcheck/. | here | ESLint restricted globals; property tests | phase-1 |
| **R-402** ★ | Never build a RegExp from user input; patterns are precompiled from aliases. | here | ESLint no-restricted-syntax in runtime engine code; ReDoS test | phase-3 |
| **R-403** | Studied-tier skills never count as proven. | here | property test | phase-3 |
| **R-404** ★ | Fit-check thresholds change only with an ADR in the same PR. | here | pr-hygiene CI check | phase-3 |
| **R-405** | User input renders as text only; innerHTML, outerHTML, insertAdjacentHTML, document.write, eval, new Function and web storage of input are banned. | here | ESLint; property render test | phase-1 |
| **R-406** | No alias matches more than a third of the negative-control postings. | here | alias audit test | phase-3 |
| R-407 | How to tune the engine: fix aliases and tiers first; thresholds last. | `.claude/rules/fitcheck.md` | judgment | prose |
| **R-501** ★ | Job description text is never committed: postings/ and *.jd.txt are ignored and blocked. | here | guard-bash hook on git add; .gitignore; pre-commit; gitleaks rule | active / phase-1 |
| **R-502** | Application result files contain no job description text. | here | Zod schema rejects extra fields | phase-4 |
| **R-503** | /for slugs have a random suffix, pages are noindex, and they are excluded from the sitemap. | here | unit and e2e tests | phase-4 |
| **R-504** ★ | GitHub Actions are pinned to a full commit SHA; workflows default to read-only permissions. | here | action-pin CI check | phase-1 |
| **R-505** ★ | The CSP has no unsafe-inline or unsafe-eval, and every required header is present. | here | headers CI test | phase-1 |
| **R-506** | A new dependency needs a justification in the PR and a Security review. | here | labeler; pr-hygiene CI check | phase-1 |
| **R-507** | CI installs with npm ci --ignore-scripts; high-severity audit or OSV findings block merge. | here | CI | phase-1 |
| **R-508** | No secrets in the repo. | here | gitleaks pre-commit and CI; GitHub push protection | phase-0 |
| **R-509** | Claude Code never reads .env files, keys, or postings. | here | settings deny; guard-bash and guard-read hooks | active |
| **R-510** | No piping downloads into a shell; no recursive deletes outside the repo. | here | guard-bash hook | active |
| **R-511** ★ | No merge or launch while a Medium or higher security finding is open. | here | phase-gate script checks open severity labels; Security veto; fix-PR terms in ADR-0017 | phase-1 |
| **R-512** | Third-party embeds are only *.hf.space, loaded on click, sandboxed. | here | CSP test; e2e test | phase-5 |
| **R-601** ★ | Colors come only from tokens; red is only for margin notes; no gradients, box shadows or emoji. | here | Stylelint rules; copy lint | phase-1 |
| R-602 | Every visible PR passes the anti-slop checklist. | `.claude/agents/design-lead.md` | judgment | prose |
| **R-603** ★ | Banned words in site copy: passionate, cutting-edge, leverage, seamless, unlock, delve, synergy, world-class, robust (as filler), game-changer. | here | copy lint CI | phase-1 |
| R-604 | Folding sections use native details and summary; no custom accordion JavaScript. | `.claude/rules/ui.md` | judgment; e2e JS-disabled test | prose |
| **R-605** | Hero, results strip, production summary and project cards work with JavaScript disabled. | here | e2e JS-disabled test | phase-2 |
| **R-606** | WCAG 2.2 AA: zero axe violations, 44 px touch targets. | here | axe CI | phase-2 |
| **R-607** | Performance budgets hold (see docs/spec/09-quality.md). | here | Lighthouse CI | phase-2 |
| **R-608** ★ | Motion is 200 ms or less and respects prefers-reduced-motion. | here | Stylelint max duration; e2e reduced-motion check | phase-1 |
| **R-609** | Visual baselines change only with Design Lead approval. | here | labeler; review-gate | phase-1 |
| **R-610** ★ | No CLAUDE.md or other instruction files in public/ or src/pages/ (they would be served as pages). | here | guard-write hook; docs lint | active |
| R-701 ★ | Never weaken or delete a test to get a build to pass; removing a test file requires QA review. | `.claude/rules/tests.md` | pr-hygiene CI flags removed tests; labeler | phase-1 |
| **R-702** | Mutation score breaks at 80 for src/lib/fitcheck/ and 70 elsewhere in src/lib/. | here | Stryker CI | phase-3 |
| **R-703** | Line coverage on src/lib/ is at least 90%. | here | Vitest CI | phase-1 |
| R-704 ★ | Seeded-defect audits run at the end of Phases 1 and 3; any role under 75% in its area is retrained and re-tested. | `.claude/skills/seeded-defect-audit/SKILL.md` | phase-gate script checks docs/qa/audit-N.md | phase-1 |
| R-705 | QA writes acceptance tests from the issue's criteria without reading the builder's report. | `.claude/agents/qa-engineer.md` | judgment | prose |
| R-801 | Check usage before each phase and each issue; start a phase only if it fits in the remaining usage. | `.claude/skills/session-protocol/SKILL.md` | judgment | prose |
| R-802 ★ | After each issue: commit, push, merge if green, update docs/status.md. | `.claude/skills/session-protocol/SKILL.md` | Stop hook warns on uncommitted work | active |
| **R-803** ★ | Never end a session with uncommitted work; push a draft PR instead. A subagent may leave only its own agent-memory notes uncommitted; the Supervisor collects them. | here | Stop hook | active |
| R-804 ★ | A phase closes only when its plan, demo, retro and gate records exist. | `.claude/skills/phase-gate/SKILL.md` | phase-gate script | phase-1 |
| R-805 ★ | Tasks live in GitHub Issues and progress in docs/status.md; plan.md and docs/spec/ hold intent only. | `CLAUDE.md` | docs lint rejects task checklists in docs/spec/ | active |
| **R-806** ★ | Instruction files stay within token budgets, and every rule has exactly one home. | here | docs lint | active |
| R-807 ★ | Run the probe test after Phase 0 and after any change to CLAUDE.md or .claude/. | `.claude/skills/probe-test/SKILL.md` | phase-gate script checks docs/qa/probe-results.md is newer than .claude/ | phase-1 |
| R-901 | Validation results are stored without names or contact details. | `.claude/skills/external-validation/SKILL.md` | judgment | prose |
| **R-902** | The /for holdout assigns the link to 3 of 4 applications at random. | here | apps script test | phase-8 |
| R-903 | /for open tracking uses only cookieless Cloudflare path counts. | `.claude/skills/external-validation/SKILL.md` | Security review | prose |

**Gaps that cannot be closed by a check** (all agents share one GitHub account and one model family): R-204, R-205 and R-705 depend on how the Supervisor writes delegations. They are audited after the fact by R-206 (QA review audit), the seeded-defect audits (R-704) and the context audit skill.
