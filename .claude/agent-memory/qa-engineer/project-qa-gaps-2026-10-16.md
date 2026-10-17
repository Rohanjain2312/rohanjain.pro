---
name: qa-gaps-2026-10-16
description: Which QA tools and CI checks did not exist at the Phase 0 to Phase 1 boundary (2026-10-16), so reviews know what to check by hand
metadata:
  type: project
---

As of 2026-10-16 (head 596bc7a, PR #84):

- `scripts/lint-copy.mjs` does not exist. QA owns it. Copy lint (R-007, R-008, R-010, R-603) is only checkable by hand (grep) until it is written.
- Lychee is not installed and no CI workflow exists (`.github/workflows/` is absent). CI is issue #13, still open. Link checks are manual (`test -e` on relative targets, `curl` on external links) until #13 lands.
- `scripts/lint-docs.mjs` checks rule-ID integrity and paths only. It does not check links, em dashes or copy.
- No pages exist in `src/` yet (only `src/env.d.ts`). `npm run dev` returns 404 on `/`.
- No escaped defects are recorded yet. PR #84 was the first QA review; its one Medium finding was caught before merge.

**Why:** The issue #30 test plan asks for lychee and "copy lint passes". Neither can run literally at this point, so a review that skips the manual substitute would pass unchecked claims.

**How to apply:** Before reviewing any docs PR, check whether lychee and lint-copy exist. If they do not, run the manual checks and say so in the review. Re-check after #13 lands and after lint-copy is written. Update this note when either lands.

Related: [[feedback-recruiter-copy-present-tense]], [[feedback-worktree-verify-hygiene]].
