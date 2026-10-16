# Security reviews: Phase 0

## PR #36: issue and PR templates, CODEOWNERS, repo settings runbook (issue #3)

- Head: `abac3478065c04a277598f461ba9c4dad48562f2`
- Date: 2026-10-15
- Result: CHANGES REQUESTED
- Comment: https://github.com/Rohanjain2312/rohanjain.pro/pull/36#issuecomment-6204254315

| ID | Severity | Finding | Status |
|---|---|---|---|
| 36-L1 | Low | CODEOWNERS leaves out the platform-engineer scripts `lint-docs.mjs`, `autopilot.sh`, `phase-gate.mjs` and `verify.mjs`, so they fall under the app-data-engineer `/scripts/` entry. | open, fix in PR |
| 36-L2 | Low | The runbook is out of date: Phase 7 and 8 milestones now exist, and the `accessibility` label is not listed. | open, fix in PR |
| 36-L3 | Low | The runbook calls `required_signatures` "paused", but the rule is not in the ruleset. It cites ADR 0014, which is not on main. | open, fix in PR |
| 36-I1 | Info | The runbook leaves out Actions controls: default workflow permissions read, Actions cannot approve PRs, fork PR approval policy. | recommendation |
| 36-I2 | Info | `sha_pinning_required` is false and `allowed_actions` is all. Turn on SHA pinning before the Phase 1 workflows. | recommendation |
| 36-I3 | Info | The PR template fills in "none" under New dependencies. | recommendation |
| 36-I4 | Info | Owner role in the issue template is free text, not a dropdown. | recommendation |
| 36-I5 | Info | Until Phase 1 there are no required status checks, so merges are enforced only by the hooks. | known, tracked by Phase 1 |

### Re-review at `60b2f1ffdbecf2aaf740a6970d21a3894923136a`

- Date: 2026-10-15
- Result: CHANGES REQUESTED
- Comment: https://github.com/Rohanjain2312/rohanjain.pro/pull/36#issuecomment-6206649945
- 36-L1, 36-L2, 36-L3: fixed and verified with `gh api`. 36-I1 to 36-I4: done (`sha_pinning_required` is now true).

| ID | Severity | Finding | Status |
|---|---|---|---|
| 36-L4 | Low | `src/styles/tokens.css` and `src/assets/brand/` are listed again under the frontend-engineer heading, after the broader patterns. With last match wins, they map to frontend-engineer instead of design-lead. I missed this in the first review. | open, fix in PR |
| 36-I6 | Info | `package.json` and its lockfile are shared by four roles but listed only under platform-engineer. | recommendation |

Related, outside this PR: the signed-commit rule (R-107) is removed from the ruleset. This is tracked by issue #33 and ADR 0014 (PR #34). For the risk acceptance to be valid, the ADR must be listed in `docs/needs-client.md`.

## PR #52: turn off npm install scripts and add Dependabot cooldown (issue #46)

- Head: `916bb1c92d21e4fb8131db156a61fd20da3ee599`
- Date: 2026-10-15
- Result: APPROVED (no Medium or higher findings)
- Comment: https://github.com/Rohanjain2312/rohanjain.pro/pull/52#issuecomment-6206762256
- Checks: `npm config get ignore-scripts` prints `true` at the repo root. A scratch project with this `.npmrc` and a test package ran no install scripts on `npm install` or `npm ci`. `dependabot.yml` parsed, and its keys match GitHub's options reference. Path ownership checked with `ownsPath()`.

| ID | Severity | Finding | Status |
|---|---|---|---|
| 52-L1 | Low | `.npmrc` has no owner in `owners.json`. Shell writes are unchecked (#47) and the labeler does not route it (#42), so a later PR could weaken it without Security review. | open, #57 (Phase 0) |
| 52-L2 | Low | No hook blocks `--ignore-scripts=false`, `npm_config_ignore_scripts=false`, or `npm rebuild --ignore-scripts=false` with no package name. | open, #58 (Phase 1) |
| 52-I1 | Info | With scripts off, `pre`/`post` scripts and the root `prepare` do not run. #10 must set up husky and gitleaks with explicit steps. | recommendation for #10 |
| 52-I2 | Info | Use `npx --no-install playwright install chromium` so a missing local Playwright is not fetched from the registry. | recommendation |
| 52-I3 | Info | Cooldown does not apply to security updates (by design). Patch auto-merge after cooldown is not enforced yet; check it in #15 and in `ci.yml`. | check later |
| 52-I4 | Info | Until `package.json` exists, subdirectories read `ignore-scripts` as `false`, and the Dependabot npm entry has no manifest. | no action |
