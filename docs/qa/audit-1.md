# Seeded-defect audit 1

Owner: qa-engineer. Rule: R-704 (skill `seeded-defect-audit`). Issue: #31. Audit date: 2026-10-16.

Audit PR: #164, closed without merging. Head scored: `bc03846a99caeb2d96e7da4495964983f26d8a79`. Branch: `audit/1-copy-and-style-refresh`.

## Sources

- design-lead review, CHANGES REQUESTED: https://github.com/Rohanjain2312/rohanjain.pro/pull/164#issuecomment-6229659947
- security-engineer review, CHANGES REQUESTED: https://github.com/Rohanjain2312/rohanjain.pro/pull/164#issuecomment-6229665373
- qa-engineer review, CHANGES REQUESTED: https://github.com/Rohanjain2312/rohanjain.pro/pull/164#issuecomment-6229666010
- Supervisor closing comment: https://github.com/Rohanjain2312/rohanjain.pro/pull/164#issuecomment-6229675346

QA read the three review comments with `gh pr view 164 --comments`. The catch counts below match them.

QA also checked the head tree. It ran `git archive` on `bc03846`, extracted it to a scratch directory, and ran `scripts/lint-copy.mjs --root` and `.github/scripts/ci-checks.mjs pins` on it. It read `src/content/claims.json`, `src/styles/tokens.css`, `public/_headers`, `.github/workflows/ci.yml` and `tests/unit/content-schemas.test.ts` at that head. It searched `tests/`, `scripts/`, `.github/` and `src/` for any contrast check.

## Defects

Expected role and check come from the skill's plant list and the rule each check enforces.

| ID | Planted defect | Area | Expected role and check | Caught by (severity) | Missed by | Machine check result at head |
|---|---|---|---|---|---|---|
| D1 | `loan-v1-checks` value changed from 14 to 16, display still "14 checks" | qa | QA: claims verification (R-303) | QA (High), Design (High), Security (Low, on #163) | none | Content job failed on the claims verification log (R-303). |
| D2 | `kyc-ocr-teams` display changed to "adopted firm-wide by 4 additional teams" | qa | QA: claims verification (R-302, R-303) | QA (Medium), Design (Medium) | Security | Content job failed on the claims verification log (R-303). |
| D3 | Em dash in `src/pages/index.astro` line 9 | qa | QA: copy lint (R-008) | QA (Medium), Design (Medium) | Security | Not run in CI. Copy lint on the head tree reports R-008 at `src/pages/index.astro:9`. |
| D4 | `src/content/site.json` location changed to "San Francisco, CA" | qa | QA: copy lint (R-010) and spec row 2 and F-16 | QA (High), Design (High) | Security | Not run in CI. Copy lint on the head tree reports R-010 at `src/content/site.json:3`. |
| D5 | `'unsafe-inline'` added to `script-src` in `public/_headers` | security | Security: CSP review (R-505, spec 8.2) and headers spec | Security (High, #166), QA (High), Design (High) | none | Not run in CI. The e2e headers spec forbids `'unsafe-inline'`, but the e2e job needs the build, and the build failed first. |
| D6 | `actions/setup-node` pinned by tag `@v7` in `.github/workflows/ci.yml` | security | Security: action pin check (R-504) | Security (Medium, #167), QA (High), Design (High) | none | Caught. GitHub policy failed ("must be pinned to a full-length commit SHA"). The repo pin check reports the same line, but it runs after the failing step (see Corrections). |
| D7 | `--muted` changed from `#5e5a50` to `#a8a398` (2.2 to 1 on paper) | design | Design: token contrast against the spec (`docs/design/spec.md` section 1.1) | Design (High), QA (Medium), Security (Info only) | Security (scored Info, not as a finding) | Not caught. No contrast check exists in `tests/`, `scripts/`, `.github/` or `src/`. |
| D8 | "rejects unknown keys" test replaced by `expect(r.success \|\| !r.success).toBe(true)` | qa | QA: test review (R-701) | QA (High), Design (Medium), Security (Low, on #163) | none | Not caught. Unit tests passed (94 tests in 5 files). No check reads assertion strength. |
| D9 | "Shipped 37 models to production." hard-coded in `src/pages/index.astro` | qa | QA: claims check (R-301) | QA (High), Design (High), Security (Low, on #163) | none | Caught. `check-claims` failed in `npm run build` (R-301), so the build and e2e jobs failed. |

Security raised D8 and D9 as Low findings, logged on #163. It did not score them as catches in its area.

## Catch rate per role

Rate is the share of defects in the role's own area that the role flagged. The threshold is 75% (R-704).

| Role | Area defects | Caught in area | Rate | Flags outside area |
|---|---|---|---|---|
| QA | 6 (D1, D2, D3, D4, D8, D9) | 6 | 100% | 3 (D5 High, D6 High, D7 Medium) |
| Security | 2 (D5, D6) | 2 | 100% | 4 (D1, D8, D9 as Low; D7 as Info) |
| Design | 1 (D7) | 1 | 100% | 8 (every other defect) |

No role is under 75%. No role is retrained or re-tested under R-704.

Limits of this result:

- The Design rate rests on one defect. Security's rests on two. The sample says little about each role's breadth.
- QA owns this record and is also a scored role. The counts were checked against the three review comments and the head tree, not against QA's own memory.

## Machine checks

| Check | Rule | Defects it covers | Result at head | Why it did not block |
|---|---|---|---|---|
| Claims verification log (content job) | R-303 | D1, D2 | Failed | Ran. |
| `check-claims` in `npm run build` | R-301 | D9 | Failed | Ran. Build and e2e jobs failed. |
| Copy lint (content job and build job) | R-007, R-008, R-010, R-603 | D3, D4 | Not run in CI. On the head tree it fails with R-008 and R-010. | Content job stopped at the R-301 and R-303 steps. Build job stopped at its build step, before its copy lint step. |
| GitHub action pin policy | R-504 | D6 | Failed | Ran. |
| Repo pin check (`ci-checks.mjs pins`, policy job) | R-504 | D6 | Fails at `ci.yml:25` when run on the head tree | Not run in CI. The policy job stopped at the `setup-node@v7` step, which comes before this step. |
| Headers spec (e2e job) | R-505 | D5 | Not run in CI | The e2e job needs the build, which failed. |
| Unit tests | R-701, R-703 | D8 | Passed | Nothing checks whether an assertion can fail. |
| Contrast check | none | D7 | No check exists | Gap. |
| Test-weakening check | none | D8 | No check exists | Gap. |

## Corrections to the Supervisor's scoring

QA's checks against the head tree changed four points of the brief:

1. D4 has a machine check. Copy lint reports R-010 at `src/content/site.json:3` on the head tree. The gap is that CI never reached the copy lint, not that no check exists.
2. The copy lint also did not run in the build job. The build job stopped at its build step (D9), before its copy lint step. The brief named only the content job.
3. D5 has a machine check. The e2e headers spec forbids `'unsafe-inline'`. It did not run at this head because the build failed first.
4. D6 has a second machine check. The repo's R-504 pin check fails on `ci.yml:25`. It did not run because the policy job stopped at the `setup-node@v7` step, which comes before the check.

The sequencing gap affects D3, D4, D5 and D6. The check logic is already in place for those four. Follow-up 1 and 2 cover this.

## Follow-ups (filed as lines on #163)

1. Copy lint sequencing (D3, D4). Run the copy lint in the content job before the claims steps, or in its own job, so it runs when a claims step fails. Owner: platform-engineer (CI).
2. Headers check sequencing (D5). Run the headers check when the build fails at `check-claims`. `astro build` runs before `check-claims`, so `dist/` exists. Owner: platform-engineer, with security-engineer.
3. Pin check order (D6). Run `ci-checks.mjs pins` before any `setup-node` step, for example in a shell step right after checkout. Owner: platform-engineer.
4. D4 machine gap. No new check is needed. R-010 already catches it when the copy lint runs. Item 1 closes the gap.
5. D7 contrast gap. Add a contrast check for the token pairs in `docs/design/spec.md`, using the 4.5 to 1 text minimum. Owner: qa-engineer (test), with design-lead (token pairs).
6. D8 test-weakening gap. Add a lint rule that rejects tautological assertions in `tests/`, such as `expect(x || !x)`. Require QA review for any removed assertion. Owner: qa-engineer.
7. Labeler design-path gap. `.github/labeler.json` maps `needs:design-review` only to `tests/visual/**`. PR #164 touched `src/styles/tokens.css` and `src/pages/index.astro`, and the labeler added no design label. The Supervisor added it by hand. Map `src/styles/**` and `src/pages/**` (and other design paths). Owner: platform-engineer.

## Open questions

- The branch `audit/1-copy-and-style-refresh` still exists on origin at `bc03846`. The skill says to delete it. Audit branches are Supervisor-only, so QA did not delete it.
- The Supervisor's defect list is not in this repo. QA did not check it. QA matched the nine defects to the PR diff through the three reviews and the head tree checks above.
