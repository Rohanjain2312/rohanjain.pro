---
name: project-qa-tooling-gaps
description: Which QA tools the issue test plans name but the repo does not run yet (lychee, CI), and the substitute checks. Check status before citing either tool.
metadata:
  type: project
---

As of 2026-10-16 (rechecked during the PR #124 review):

- **Lychee (link check).** Not installed. No CI job until issue #13 (`ci.yml`, open). Substitute: `test -e` on every relative link and repo path, plus one `curl` for each external URL.
- **Copy lint.** `scripts/lint-copy.mjs` now exists (`npm run lint:copy`) and runs clean on PR heads. Issue #27 is still open, so check what it covers before relying on it.
- **Stylelint and ESLint.** `npm run lint:css` and `npm run lint` exist and run in a clean clone.
- **Docs lint.** `scripts/lint-docs.mjs` (`npm run docs:lint`) checks rule IDs, paths, budgets and owners. It does not check dashes, copy words or links.
- **verify.** `scripts/verify.mjs` runs docs lint, type check, unit tests, build and e2e. It reads HEAD through git for the R-110 stamp, so an export cannot produce a real stamp. Run the steps by hand and say so. `tests/e2e/` did not exist at PR #124.
- **Built-output CSP test.** None exists. Astro inlines a stylesheet under 4,096 bytes as `<style>`, which breaks `style-src 'self'`. PR #124 left a 241-byte margin and `inlineStylesheets: 'never'` was not in `astro.config.mjs`. Owed: Platform config and a QA build-output test.

**Why:** the issue test plans name these tools. A review that skips them must say which substitute ran and which issue tracks the real run.

**How to apply:** when a test plan names lychee or CI, check whether #13 is closed. If not, run the substitute and record it under "Checked". A PR head can be behind main (for example, missing `public/_headers`): overlay the PR files on a main export to test CSP. Recheck status before citing. See [[escaped-defects]].
