---
name: feedback-branch-prefix
description: Design Lead branches must start with `design/` (hook R-103), even when a task brief says `design-lead/`
metadata:
  type: feedback
---

Name branches `design/<issue>-<slug>`. The guard-bash hook rejects `design-lead/...` with R-103.

**Why:** The hook maps role to prefix from the agent file ("Branch prefix: `design/`"). On issue #19 (2026-10-16) the delegation said `design-lead/19-design-spec` and the hook blocked it.
**How to apply:** Use `design/` and tell the Supervisor in the report that the branch name differs from the brief.
