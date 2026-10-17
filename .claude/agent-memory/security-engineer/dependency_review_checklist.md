---
name: dependency-review-checklist
description: Checks for any PR that adds npm dependencies or changes the lockfile (R-506); release age, provenance, OSV, telemetry, from the PR #77 review
metadata:
  type: feedback
---

For any PR that adds dependencies or changes `package-lock.json`, check these with node scripts in the scratchpad. Use `fetch` and avoid `curl | node`, because R-510 blocks piping a download, and keep `$var` out of npm loops, because the worktree guard refuses them.

**Why:** In PR #77 (2026-10-16) the first lockfile held 52 of 354 packages under 7 days old. The 7-day cooldown covers only Dependabot (Low, #79). Astro telemetry is also on by default. No CI audit or OSV check existed yet, so the review was the only scan.

**How to apply:**
- Lockfile script: registry source, sha512 integrity, `hasInstallScript`, licenses, and release age of each version from the registry `time` field.
- After `npm ci` in a `git archive` export: `npm audit`, `npm audit signatures --json --include-attestations` (the JSON `verified` list holds only attested packages), and an OSV `api.osv.dev/v1/querybatch` over all versions.
- Check provenance for the Linux bindings in the registry, because CI runs them and they are not installed on macOS.
- Check the bind address of dev and preview servers with `lsof`, and look for outbound telemetry (`ASTRO_TELEMETRY_DISABLED`).
- Until #79 is fixed, a new lock without `min-release-age=7` adds to #79. It is not a new finding.

- PR #149 (2026-10-16, approved, #79 fix): `min-release-age=7` works on npm 11.19; explicit `pkg@too-new` fails with ETARGET (fail closed). Lock has 54 packages under 7 days, all clear by 2026-10-22T15:05Z. Re-run the lock age check on or after that date at the Phase 1 gate. R-509 hook blocks shell writes to `.npmrc`; test with the `--min-release-age=7` flag instead.

Related: [[severity-calibration]], [[tooling-quirks]]
