---
name: pr-process-gate-pr135
description: PR #135 (review-gate, branch-name, pr-hygiene, labeler) review result at head 3135510, the Medium defect found, and how to re-check it
metadata:
  type: project
---

PR #135 (issue #14, #42), head 3135510: QA review CHANGES REQUESTED (2026-10-16).

- Medium: `stripHtmlComments` in `.github/scripts/pr-process.mjs` is single pass. Nested `<!<!-- x -->--` and unterminated `<!--` hide a `Closes #N` line or a dependency justification from reviewers but still satisfy R-104 and R-506. CodeQL flagged it (high, red check on the PR).
- Seed script lives only in the session scratchpad; rebuild from the cases in the PR comment if needed.
- Re-check on the next head: nested and unterminated comment cases for `closesIssues` and `newDependenciesSection`, CodeQL check green, `npm run gates:test` passes.
- Low items filed in the review: supervisor needs `approved:supervisor` label (run-review skill silent on it), labeler.json gaps (`.github/actions/**`, `.nvmrc`, release-please and lint configs), R-701 misses `it.skip` and deleted asserts, R-109 allows exactly 600, multiple `Closes` accepted.

**Why:** the gate script is the merge control; a bypass in the body parser defeats R-104/R-506 silently.
**How to apply:** when a later PR edits `pr-process.mjs` or `labeler.json`, re-run the seeded cases against the new script. The workflows run the base-commit script, so a PR cannot change its own check; test the PR copy by hand.

Related: [[review-mechanics]], [[worktree-git-guard]].
