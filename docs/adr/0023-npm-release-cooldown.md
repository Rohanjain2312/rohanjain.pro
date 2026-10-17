# ADR-0023: Seven-day release cooldown for manual npm installs

Status: accepted · Date: 2026-10-16 · Issues: #79, #10

## Context
Dependabot waits 7 days before it opens an update PR (threat model 4.4). A manual `npm install` does not wait. It takes the newest matching version. The Security review of PR #77 (finding 77-L1, Low) found 52 of 354 lockfile packages under 7 days old, including `astro@7.4.0` and `vitest@5.0.5`. Build and test run this code on the client machine, which holds the gh token.

Issue #10 asks for "Astro latest stable". That wording does not say whether a release published yesterday qualifies.

## Decision
1. `.npmrc` sets `min-release-age=7`. npm 11.19 supports this option. When npm builds a tree, it installs only versions published more than 7 days ago. It applies to `npm install`, `npm update` and `npm install <pkg>`. `npm ci` installs the exact lockfile and does not read this rule.
2. "Latest stable" means the newest stable release that is at least 7 days old. Prereleases do not count. Dependabot keeps its own 7-day cooldown.
3. A security fix may ship before the 7 days pass only in a PR that Security reviews (R-209, R-511). The PR names the advisory and the reason. Any exemption for one package uses `min-release-age-exclude` and needs the same review.
4. No re-lock now. The lock holds `astro@7.4.0` and `vitest@5.0.5`, published about 2026-10-15; they pass the 7-day rule on 2026-10-22. Until then the residual risk is the one RR-4 already accepts (signed packages, `ignore-scripts=true`, 0 audit findings). Any re-lock before then checks every new version against the rule.

## Consequences
- Manual installs wait 7 days for new releases, as Dependabot does.
- The current lock meets the rule from 2026-10-22 without a change.
- Behavior when an explicit too-new version is requested (`npm install pkg@x.y.z`) was not tested. Check it before relying on it.

## Alternatives
- Re-lock now to `astro@7.3.8`: churn for a gap that closes by itself on 2026-10-22.
- Record a lock check date in the ADR (the issue's second option): the check date must fall on or after 2026-10-22, which is after today.
- Pin a fixed `before=<date>` in `.npmrc`: the date goes stale and needs an edit each release window.

