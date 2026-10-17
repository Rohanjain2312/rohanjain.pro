---
name: link-and-copy-lint-pending
description: Lychee (#13) and the copy lint (#27) do not exist yet; QA substitutes must be run and say so in reviews. Check the issue state before relying on either tool.
metadata:
  type: project
---

Lychee is not installed on this machine and runs in CI only after issue #13 (CI pipeline) lands. The copy lint is `scripts/lint-copy` (`.ts` in docs/spec/09-quality.md, `.mjs` in QA ownership; resolve the mismatch) and lands with issue #27. At PR #84 (2026-10-16) neither existed at head, yet the issue #30 test plan requires "Links resolve (lychee); copy lint passes".

**Why:** the issue test plan names tools that were not built yet, so the builder could not run them, and the PR body did not mention the copy lint at all.

**How to apply:** until #13 and #27 land, run a scratch link checker over the changed docs (relative paths, anchors, external URLs with fetch) and grep for U+2014 and location and title drift (R-008, R-010). Say in the review which items were substitutes. Do not block a merge only because a tool is missing, but log it as Medium and ask the Supervisor whether the issue should close before the tool exists. Re-check when #13 and #27 close: if either lands, rerun the real tool on the open PRs that touched docs.

Related: [[reference-tooling-gotchas]].
