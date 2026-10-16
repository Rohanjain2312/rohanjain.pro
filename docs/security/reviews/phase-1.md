# Security reviews: Phase 1

Owner: security-engineer · Started 2026-10-16

This file has one entry per Security review comment posted on a Phase 1 PR, in PR order. Finding IDs are `<PR>-<severity letter><n>`. Status is the state when the entry was written unless it says otherwise.

## Reviews

| PR | Reviews (heads) | Final result | Merged |
|---|---|---|---|
| #77 | 08c605b APPROVED | APPROVED | open |

## PR #77: Astro scaffold and toolchain (issue #10)

Review comment: https://github.com/Rohanjain2312/rohanjain.pro/pull/77#issuecomment-6211013398 (head 08c605b, APPROVED).

Checks: exact pins and R-506 justifications; lockfile script (registry sources, sha512, install scripts, release age); clean `npm ci` with `ignore-scripts=true`; `npm audit` 0; `npm audit signatures` 287 signatures and 97 attestations; OSV batch over 354 versions 0 hits; `check`, `test`, `build`, `test:e2e` pass; preview listens only on `[::1]:4321`; `.gitignore` probes with `git check-ignore`; `verify.mjs` read; Node LTS schedule; head signature and ruleset 25204664; grep-only secret scan.

| ID | Severity | Finding | Status |
|---|---|---|---|
| 77-L1 | Low | 52 of 354 locked packages are under 7 days old (`astro@7.4.0`, `vitest@5.0.5` at 0.7 days). The 7-day cooldown covers only Dependabot. | open #79 (target: Phase 1 gate) |
| 77-I1 | Info | Astro telemetry is on by default and sends a hash of the public git remote. Suggest `ASTRO_TELEMETRY_DISABLED=1`. | open |
| 77-I2 | Info | `verify.mjs` writes the stamp under `CLAUDE_PROJECT_DIR` or cwd, but agent shells have no `CLAUDE_PROJECT_DIR`, so R-110 denies `gh pr ready` from worktrees. Fails closed. | open |
| 77-I3 | Info | `docs/runbooks/dependencies.md` says `npx playwright install chromium` without `--no-install`. | open |
| 77-I4 | Info | TypeScript 6.0.3 also fits the `@astrojs/check` peer range; `@types/node` 26 is newer than the Node 24 runtime. | open |
| 77-I5 | Info | `src/content/applications/.gitkeep` is missing, and no role in `owners.json` owns the path. | open |
