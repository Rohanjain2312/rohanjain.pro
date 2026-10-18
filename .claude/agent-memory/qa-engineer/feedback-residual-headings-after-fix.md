---
name: feedback-residual-headings-after-fix
description: On a re-review, a fix that edits one line of a file can leave a sibling heading with the same stale duty. Grep every heading and owner line in the named files, not only the cited lines.
metadata:
  type: feedback
---

When re-checking a fix against a named Medium, grep the whole file for the retired duty term, not just the cited line. A builder can change the bullet or description and leave the heading that carries the same duty.

**Why:** On PR #185 (head 01364993), the 30a3836 finding cited reader-advocate.md line 20 ("Review a PR as two people"). The head changed the description and the "For each review" bullet header, and left line 20 as it was. docs/spec/11-phases.md line 14 (Phase 0 gate, R-807 probe test) also stayed after the fix covered lines 5 and 36. Both residuals were found only by reading the full file and grepping the retired terms.

**How to apply:** For each re-review, (1) `git diff <reviewed> <head>` for the changed hunks; (2) for each named file, grep the retired terms (R-206, R-704, R-807, "per-PR", "review", "audit", "probe", "demo") and read every heading and owner line that matches; (3) report a residual of the same finding as the same Medium, not as a new one. Use a clean export for the reads. See [[feedback-r705-issue-before-body]] and [[defects-escaped-review]].
