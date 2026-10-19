---
name: feedback-exemption-premise-check
description: When an ADR or runbook skips or narrows a check, read the code its premise describes. "Bounded by the schema" often bounds length, not value.
metadata:
  type: feedback
---

Rule: for any ADR, runbook or spec line that exempts a page, number or file from a check (claims, lint, gate), open the code the stated reason depends on and confirm it. Quote the line in Checked.

Why: PR #257 (ADR-0031) exempted /for pages from the R-301 claims check because their numbers were "engine output, not claims about Rohan". The code composes proof lines from claim display text (src/lib/content/evidence.ts), and the result schema bounds string length and count range, not the values. The exemption would have let a changed or stale claim number ship with a wrong reason in the record.

How to apply: when a PR says a check does not apply because of a property of the data, grep the producer function and the schema named by that property. If the property is false, the check is still needed. See [[project-pr257-status-handoff-review]] and [[docs-review-checks]].
