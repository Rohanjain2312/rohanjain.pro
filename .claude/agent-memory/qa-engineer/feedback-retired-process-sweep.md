---
name: feedback-retired-process-sweep
description: When a decision retires a process (ADR-0026), grep the whole tree, including agent descriptions, index files and gate specs, not only the files a review names.
metadata:
  type: feedback
---

When a review or ADR retires a rule, role duty or gate record, search the whole head tree for the rule IDs and terms (R-206, R-704, R-807, "audit", "probe", "demo", "retro", "Design Lead", "Reader Advocate", "needs:reader-review"). Read agent description lines, `plan.md` and `docs/spec/11-phases.md` as well as the files named in the review.

**Why:** On PR #185 the 182-L2 to L4 list named specific files. Round 1 fixed and checked those lines only. At the next head, the agent descriptions for Design Lead, Reader Advocate and QA still assigned per-PR review and audits, and the phase gates still required demo records and audit 2. Those are the same class of defect as the Medium that was raised. See [[escaped-defects]].

**How to apply:** For any "stale text" finding, run one grep across the export (excluding `docs/adr/` and `node_modules/`, which hold history) and classify each hit as history, fixed, or stale. Use a quoted pattern in zsh, otherwise `--include` globs fail with "no matches found".
