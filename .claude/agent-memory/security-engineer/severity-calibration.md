---
name: severity-calibration
description: How this project rates hook bypasses versus input-side and server-side gaps (ADR-0018), with past findings and their state, so reviews stay consistent
metadata:
  type: project
---

Source of the rule: ADR-0018 (hooks are tripwires; input controls and token scope are the boundary). New hook bypass forms are Low unless they bypass an input-side control (interaction limit, fork approval, author rule). Exception (#63, 53-I3): a pattern agents hit in normal work, such as passing a gh token to another tool through an environment variable, is rated on likelihood, not held to Low. Rate Medium when nothing input-side or server-side backs the control, or when untrusted input or credentials reach far.

Past findings, state as of 2026-10-15 (re-check before citing):
- Medium, closed: #9 (role-forging routes, PR #2), #44 and #62 (/for data public, PR #55, ADR-0016), #45, #60, #61 (public input and all-repo token, PR #53, ADR-0018), #46 (local install scripts, PR #52).
- Low, open: #47, #51, #54, #56, #58, #63. Low, closed: #32, #38, #57.

**Why:** set in the threat model (#5, PR #49) and fixed by ADR-0018, to keep severity consistent across reviews.

**How to apply:** before rating, check whether an input-side control, ruleset, CI check or Cloudflare setting backs the hook. Probe hooks by feeding synthetic PreToolUse JSON to copies of the hook files from current `main` and from the open fix PR head; build paths with string concatenation, because `path.join` normalizes `..`. Check open `severity:*` issues first to avoid duplicates. See [[review-stale-status]], [[tooling-quirks]].
