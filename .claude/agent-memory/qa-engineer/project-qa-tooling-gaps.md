---
name: project-qa-tooling-gaps
description: Status of QA tools the issue test plans name (copy lint, lychee, verify). Copy lint is on main and in CI since PR #168 audit; check CI order before citing a copy-lint pass.
metadata:
  type: project
---

As of 2026-10-16:

- **Copy lint.** `scripts/lint-copy.mjs` and `npm run lint:copy` are on main. CI runs it in the content job and the build job (`.github/workflows/ci.yml`). Both runs come after a step that can fail, so a failed claims step skips it. Seeded-defect audit 1 (PR #168) found the copy lint catches the em dash (R-008) and the location (R-010) on the PR #164 head when run by hand. Follow-up on #163 covers the sequencing.
- **Lychee (link check).** `ci.yml` has lychee-action steps for the build output and for README and CONTRIBUTING. Issue #13 may have landed. Check its state before saying lychee is missing.
- **Docs lint.** `scripts/lint-docs.mjs` (`npm run docs:lint` or `node scripts/lint-docs.mjs`) checks rule IDs, paths, budgets and owners. It does not check dashes, copy words or links.
- **verify.** `scripts/verify.mjs` runs docs lint, type check, unit tests, build and e2e. It reads HEAD through git for the R-110 stamp, so an export cannot produce a real stamp. Run the steps by hand and say so when verify cannot run.

**Why:** a copy-lint pass in CI means nothing if the job stopped before the step. Reviews must say whether the step ran at the reviewed head.

**How to apply:** before citing copy lint or lychee, check the workflow order and whether the step ran at that head (`gh run view --log`). If it did not run, say so and run the tool by hand on an extracted head tree with `git archive`. See [[escaped-defects]].
