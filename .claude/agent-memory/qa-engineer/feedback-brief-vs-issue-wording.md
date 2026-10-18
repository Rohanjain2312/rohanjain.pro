---
name: feedback-brief-vs-issue-wording
description: When the review brief's criteria differ from the issue text, judge the stricter reading, flag the mismatch in Findings, and do not pick silently. Also how to handle re-reviews on a diff range.
metadata:
  type: feedback
---

When the launching brief and the issue's acceptance text disagree (PR #199, issue #196: brief said "status shows Phase 3 planned", the issue said "in progress"), say so in the Findings and let the Supervisor choose. Do not quietly judge against only one of them.

**Why:** the brief is written from the Supervisor's memory of the issue and can drift from the issue's text. A silent choice either approves a criterion the issue does not state or blocks on wording the Supervisor meant.

**How to apply:** on a re-review, read the issue text first with `gh issue view`, diff it against the brief's criteria, and list each mismatch in Findings as Low, with both readings quoted. Check the re-review diff range only, and state the range in Checked. For a "Medium" that was an ADR-status wording issue (ADR-0024 point 6), verify the claim against `gh issue list --label <phase>` and the PR commit list, not the status text alone.
