---
name: feedback-rereview-negative-control
description: On a re-review after CHANGES REQUESTED, run the checker on the prior requested SHA too, so a pass proves the checker can fail. Used on PR #207.
metadata:
  type: feedback
---

On a re-review, run the defect check on the SHA where I requested changes as well as the new head. The check must flag the old defect at the old SHA and clear it at the new head.

**Why:** On PR #207 (agent-memory index sweep) the head passed with zero problems. A zero result alone does not show the checker would have caught the 14 unindexed files. Running the same script on the 058ea72 extract flagged exactly those 14, so the clean head result means something.

**How to apply:** Extract both SHAs with `git archive <literal-sha> | tar -x -C <scratch>/...`. Run the checker on each. Report the old-SHA hit count in Checked. Pass a literal scratch path to `python3 -I`, not a shell variable (the worktree guard refuses variables). Keep dashes out of scripts written with Write (R-008). See [[feedback-r705-issue-before-body]] and [[feedback-worktree-verify-hygiene]].
