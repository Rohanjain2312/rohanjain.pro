---
name: project-qa-tooling-gaps
description: Which QA tools the issue test plans name but the repo does not run yet (lychee, copy lint), who owns each, and the substitute checks. Check status before citing either tool.
metadata:
  type: project
---

As of 2026-10-16:

- **Lychee (link check).** Not installed. No CI job until issue #13 (`ci.yml`, open). Substitute: `test -e` on every relative link and repo path, plus one `curl` for each external URL.
- **Copy lint.** `scripts/lint-copy.*` does not exist on main. Issue #27 ("Copy lint", open) owns it. Naming conflict: `docs/spec/09-quality.md` says `lint-copy.ts`; QA ownership says `scripts/lint-copy.mjs`. QA settles the name when building it on a `qa/` branch. Substitute: grep for U+2014, R-603 banned words, R-007 work-authorization terms, and R-010 location.
- **Docs lint.** `scripts/lint-docs.mjs` (`npm run docs:lint`) checks rule IDs, paths, budgets and owners. It does not check dashes, copy words or links.
- **verify.** `scripts/verify.mjs` runs docs lint, type check, unit tests, build and e2e. It reads HEAD through git for the R-110 stamp, so an export cannot produce a real stamp. Run the five steps by hand and say so.

**Why:** the issue test plans name these tools. A review that skips them must say which substitute ran and which issue tracks the real run.

**How to apply:** when a test plan names lychee or copy lint, check whether #13 and #27 are closed. If not, run the substitute, record it under "Checked", and track the gap as Low. Recheck the status before citing it. See [[escaped-defects]].
