---
name: golden-set-pr202
description: PR #202 (ADR-0028 synthetic golden set) round 2 at 3a79d0f: CHANGES REQUESTED. Ownership contradiction left in the ADR Decision line; R-509 vs spec 9.4 item 1 conflict. Check on any golden-set or fixtures PR.
metadata:
  type: project
---

PR #202 (issue #162) replaced real-posting golden fixtures with synthetic ones. Round 1 (5dcf4ff) got CHANGES REQUESTED with three Mediums. Round 2 (3a79d0f) still got CHANGES REQUESTED: the ADR Decision line still said App/Data writes the postings into `tests/fixtures/golden/`, issue #193 still said the same, and the content control had no reference set while R-509 forbids agents reading postings.

**Why:** an ADR fix that edits the Consequences but not the Decision leaves two live instructions. The stale-instruction grep finds the stragglers only if it runs over the whole ADR, not just the diff.

**How to apply:**
- When a docs PR fixes ownership, read the whole ADR and the linked issue bodies, not just the changed hunks.
- When a control relies on reading a source (for example, near-copy review against real postings), check that the rules allow the read. R-509 text is broader than the hooks, which only deny local `postings/` paths.
- Lows from a Phase 1 docs PR went to issue #163 as comments, not to CHANGES REQUESTED.
- Tooling: the worktree guard refuses Bash heredocs and `$VAR` git forms. Write review bodies with the Write tool into the scratchpad, then `gh pr comment --body-file`.

Related: [[escaped-defects]], [[project-pr165-claims-fixes]].
